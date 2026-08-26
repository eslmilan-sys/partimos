/**
 * Resultados — la estructura del v6, pantalla «Resultados» de
 * `diseno/Partimos App v6.dc.html`.
 *
 * Lo fijo, de arriba a abajo: la fila de navegación (volver y editar la
 * búsqueda, en celdas de 44), la cabecera de ruta — DESDE sobre el origen,
 * HASTA en acento sobre el destino, la flecha punteada entre los dos — con
 * su línea de meta («Hoy · 1 pasajero · 4 viajes»), la barra de chips
 * (Filtros en tinta con su cuenta, el orden, el día) y la fila de filtros
 * aplicados, retirables uno a uno con su «Limpiar». Lo que se desplaza: la
 * mejor opción con la frase que se la gana, los resultados, y los agotados
 * en gris con su lista de espera. Abajo, fijo, el botón de avisarme.
 *
 * **Sin barra de pestañas**: es una vista empujada, dice la sección 09.
 *
 * Tres invariantes del archivo viven aquí: la línea de meta dice su cuenta y
 * su sujeto y se lee de la búsqueda, así que no puede contradecirla (5); los
 * filtros aplicados se ven y se quitan donde estén en vigor, incluido el
 * vacío que ellos causaron (6); y «Mejor opción» lleva la frase que la
 * justifica — calculada de los datos, no escrita a mano (7).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { soloCiudad, soloPunto } from '@/dominio/comoSeLlama';
import { NOMBRE_DEL_CANAL } from '@/dominio/tarifas';
import {
  type Filtros,
  type Orden,
  buscarViajes,
  viajesPorDia,
  diaEnPanama,
  proximoDiaConViajes,
} from '@/servicios/viajes';
import { nombreDeCiudad, CIUDAD_POR_DEFECTO } from '@/servicios/lugares';
import { guardarRutaBuscada } from '@/servicios/rutas';
import { useMiId } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { type Opcion, HojaDeEleccion } from '@/ui/HojaDeEleccion';
import { Boton } from '@/ui/controles';
import { cifraRedonda, tabular } from '@/ui/dinero';
import { diaCorto, diaLargo, hora } from '@/ui/fechas';
import { Atras, Avanza, Campana, Cerrar, Filtros as IconoFiltros } from '@/ui/iconos';
import { AroDeOrigen, PuntaDeFlecha, TarjetaDeViaje, type ViajeEnTarjeta } from '@/ui/TarjetaDeViaje';
import { familia, color, espacio, pulsado, radio, sombra, zonaDeToque } from '@/ui/tokens';

/** La ruta del traspaso, cuando la pantalla se abre suelta desde el índice. */
const ORIGEN_POR_DEFECTO = CIUDAD_POR_DEFECTO;
const DESTINO_POR_DEFECTO = 'chitre';

/** Un viaje al que no le caben tus pasajeros: se enseña agotado, no se borra. */
type ViajeAgotado = ViajeEnTarjeta;

export default function Resultados() {
  const router = useRouter();
  const volver = useVolver();
  const params = useLocalSearchParams<{
    origen?: string;
    destino?: string;
    etiquetaDestino?: string;
    dia?: string;
    pasajeros?: string;
  }>();

  /* La ruta se lee del parámetro DESPUÉS del primer render: el sitio sale
     prerenderizado sin parámetros y pintar otra cosa en el primer render del
     navegador es una discordancia de hidratación (React 418, medido). */
  const [ruta, setRuta] = useState<{
    origen: string;
    destino: string;
    etiqueta: string;
    dia: string | null;
    pasajeros: number;
  } | null>(null);

  useEffect(() => {
    setRuta({
      origen: params.origen || ORIGEN_POR_DEFECTO,
      destino: params.destino || DESTINO_POR_DEFECTO,
      etiqueta: params.etiquetaDestino || '',
      dia: params.dia || null,
      pasajeros: Number(params.pasajeros) || 1,
    });
  }, [params.origen, params.destino, params.etiquetaDestino, params.dia, params.pasajeros]);

  const origen = ruta?.origen ?? ORIGEN_POR_DEFECTO;
  const destino = ruta?.destino ?? DESTINO_POR_DEFECTO;
  const yo = useMiId('22222222-2222-4222-8222-222222222222');
  const [guardada, setGuardada] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [eligiendoDia, setEligiendoDia] = useState(false);
  const [viajes, setViajes] = useState<ViajeEnTarjeta[]>([]);
  const [agotados, setAgotados] = useState<ViajeAgotado[]>([]);
  const [dia, setDia] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  /**
   * CUÁNTOS HAY CADA DÍA.
   *
   * Cambiar de día se podía, pero A CIEGAS: se elegía una fecha del
   * calendario sin saber si había algo, y el vacío decía «mira otro día»
   * sin decir cuál. Con la cuenta al lado, elegir deja de ser adivinar —
   * y cuando hoy está vacío, se ve de un vistazo dónde SÍ hay.
   */
  const [porDia, setPorDia] = useState<{ dia: string; cuantos: number }[]>([]);

  /* Dónde cae cada día dentro de la tira, para poder traerlo a la vista. */
  const tira = useRef<ScrollView>(null);
  const xDeDia = useRef<Record<string, number>>({});
  /** Veinte de aire a la izquierda: el día elegido no se pega al borde. */
  const aLaVista = useCallback((x: number, suave: boolean) => {
    tira.current?.scrollTo({ x: Math.max(0, x - 20), animated: suave });
  }, []);

  /**
   * ELEGIR DÍA ES CAMBIAR LA BÚSQUEDA, no la etiqueta.
   *
   * `dia` es estado derivado: lo escribe `buscar()` al final, leyendo
   * `ruta.dia`. Tocarlo directamente cambiaba el rótulo de la cabecera y
   * dejaba la lista como estaba. Lo que manda es `ruta`, que es de lo que
   * `buscar` depende — es lo que hace el calendario desde siempre.
   */
  const elegirDia = useCallback((cual: string) => {
    setRuta((r) => (r ? { ...r, dia: cual } : r));
  }, []);

  /* Elegir un día desde fuera de la tira —el calendario, o «hay 3 mañana»
     del vacío— también la mueve: si no, se cambia el día y la tira sigue
     enseñando el lunes. */
  useEffect(() => {
    const x = xDeDia.current[dia ?? diaEnPanama(new Date())];
    if (x != null) aLaVista(x, true);
  }, [dia, aLaVista]);

  const buscar = useCallback(async () => {
    if (!ruta) return;
    setCargando(true);
    /* Toda ruta se busca — decidido el 24-08-2026. Un viaje de ruta libre
       no cuelga de ningún corredor y aun así tiene que aparecer aquí. */
    const fecha = ruta.dia ?? (await proximoDiaConViajes(origen, destino));
    setDia(fecha);
    const encontrados = await buscarViajes(origen, destino, fecha, filtros);
    viajesPorDia(origen, destino).then(setPorDia);
    const todos = encontrados
      .map(
        (v): ViajeEnTarjeta => ({
          id: v.id!,
          salida: hora(v.departure_at!),
          duracion: duracion(v.departure_at!, v.arrival_estimate_at),
          aporteCentavos: Number(v.price_cents ?? 0),
          puestosLibres: v.seats_available ?? 0,
          /* LA PAGE D'OFFRES dit ville ET point exact : c'est là qu'on décide,
             et c'est là qu'il faut savoir où se tenir. Sur deux lignes, parce
             que sur une seule le point se faisait tronquer. Le `.replace` qui
             rabotait « Unión » est parti avec : on n'ampute pas un nom de lieu
             pour gagner de la place. */
          origen: soloCiudad(v.origin_city, v.origin_label),
          origenPunto: soloPunto(v.origin_city, v.origin_label),
          destino: soloCiudad(v.destination_city, v.destination_label),
          destinoPunto: soloPunto(v.destination_city, v.destination_label),
          llegada: v.arrival_estimate_at ? hora(v.arrival_estimate_at) : '',
          aceptaMascotas: v.allows_pets,
          sePuedeFumar: v.allows_smoking,
          conductor: {
            nombre: `${v.first_name ?? ''} ${v.last_initial ?? ''}`.trim(),
            calificacion: v.driver_rating,
            carro: `${v.model ?? ''} ${v.color ?? ''}`.trim(),
          },
          canal: NOMBRE_DEL_CANAL.yappy_app,
        }),
      )
      .sort((a, b) => a.salida.localeCompare(b.salida));

    /* Un viaje sin sitio para tus pasajeros no se borra: se enseña agotado,
       en gris, con su lista de espera. Borrado parece que no existió. */
    setViajes(todos.filter((v) => v.puestosLibres >= (ruta.pasajeros ?? 1)));
    setAgotados(todos.filter((v) => v.puestosLibres < (ruta.pasajeros ?? 1)));
    setCargando(false);
  }, [filtros, ruta, origen, destino]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const alternar = (clave: ClaveDeFiltro) =>
    setFiltros((f) => ({ ...f, [clave]: f[clave] ? undefined : true }));

  if (!ruta) return <Cargando />;

  const orden: Orden = filtros.orden ?? 'temprano';
  const ordenados =
    orden === 'barato' ? [...viajes].sort((a, b) => a.aporteCentavos - b.aporteCentavos) : viajes;

  /**
   * LA MEJOR OPCIÓN Y SU RAZÓN — calculadas, no escritas a mano. Con el
   * orden en hora es la salida más temprana; con el orden en aporte, la más
   * barata. La frase dice exactamente eso, así que nunca puede mentir.
   */
  const mejor = ordenados.length > 1 ? ordenados[0] : null;
  const resto = mejor ? ordenados.slice(1) : ordenados;
  const razonDeMejor = mejor
    ? orden === 'barato'
      ? `El aporte más bajo del día para esta ruta: B/${cifraRedonda(mejor.aporteCentavos)}.`
      : `La salida más temprana del día con cupo para ${ruta.pasajeros === 1 ? 'tu puesto' : 'tus puestos'}.`
    : null;

  const etiquetaDestino = ruta.etiqueta || nombreDeCiudad(destino);
  /* Le corps du titre suit la longueur de la paire — voir `corpoDeLaRuta`. */
  const cuerpoRuta = tamanoDeRuta(etiquetaDestino);
  const cuantosFiltrosPuestos = cuantosFiltros(filtros);
  const activos = filtrosActivos(filtros);
  /** Los días próximos que SÍ tienen algo, sin contar el que se está viendo. */
  const otrosDias = porDia
    .filter((d) => d.cuantos > 0 && d.dia !== (dia ?? diaEnPanama(new Date())))
    .slice(0, 3);

  const guardarAlerta = async () => {
    if (!yo) {
      router.push('/(cuenta)/entrar');
      return;
    }
    await guardarRutaBuscada(yo, origen, destino, dia ?? diaEnPanama(new Date()));
    setGuardada(true);
  };

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA: la cabecera de búsqueda y los filtros se van
          con la lista, como en una app. Solo la barra de estado queda fija. */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <CampoRojo altura={340} />

      {/* La fila de navegación: dos celdas de 44 en los extremos. */}
      <View style={estilos.filaNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atrás"
          onPress={() => volver()}
          style={({ pressed }) => [estilos.celdaIcono, pressed && pulsado.celda]}
        >
          <Atras tamano={23} tinta={color.ink900} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar la búsqueda"
          onPress={() => volver()}
          style={({ pressed }) => [estilos.celdaIcono, pressed && pulsado.celda]}
        >
          <Lapiz />
        </Pressable>
      </View>

      {/* La cabecera de ruta: DESDE → HASTA, y la línea de meta que se lee
          de la propia búsqueda — no puede contradecirla. */}
      <View style={estilos.cabecera}>
        <View style={estilos.parRuta}>
          <CurvaDeRuta />
          <View style={estilos.columnaRuta}>
            <View>
              <Text style={estilos.cejaRuta}>Desde</Text>
              <Text style={estilos.origen} numberOfLines={1}>
                {nombreDeCiudad(origen)}
              </Text>
            </View>
            <View style={estilos.bloqueDestino}>
              <Text style={[estilos.cejaRuta, estilos.cejaHasta]}>Hasta</Text>
              <Text style={[estilos.destino, cuerpoRuta]} numberOfLines={2}>
                {etiquetaDestino}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[estilos.meta, tabular]}>
          {`${cuandoTexto(dia)} · ${ruta.pasajeros} ${ruta.pasajeros === 1 ? 'pasajero' : 'pasajeros'} · ${
            cargando
              ? 'buscando…'
              : viajes.length === 0
                ? 'sin viajes'
                : `${viajes.length} ${viajes.length === 1 ? 'viaje' : 'viajes'}`
          }`}
        </Text>
      </View>

      {/* La barra: Filtros en tinta con su cuenta, el orden, el día. */}
      <View style={estilos.barraChips}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            cuantosFiltrosPuestos === 0 ? 'Filtros' : `Filtros, ${cuantosFiltrosPuestos} puestos`
          }
          onPress={() => setHojaAbierta(true)}
          style={({ pressed }) => [estilos.chipOscuro, pressed && pulsado.boton]}
        >
          <IconoFiltros tamano={15} tinta={color.blanco} />
          <Text style={estilos.chipOscuroTexto}>Filtros</Text>
          {cuantosFiltrosPuestos > 0 ? (
            <View style={estilos.cuenta}>
              <Text style={estilos.cuentaTexto}>{String(cuantosFiltrosPuestos)}</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ordenar: ${orden === 'temprano' ? 'salida más temprana' : 'aporte más bajo'}. Cambiar`}
          onPress={() =>
            setFiltros((f) => ({ ...f, orden: orden === 'temprano' ? 'barato' : 'temprano' }))
          }
          style={({ pressed }) => [estilos.chipClaro, pressed && { backgroundColor: color.lavadoChip }]}
        >
          <Text style={estilos.chipClaroTexto}>
            {orden === 'temprano' ? 'Más temprano' : 'Aporte más bajo'}
          </Text>
          <Chevron />
        </Pressable>

      </View>

      {/* LA TIRA DE DÍAS, con su cuenta. Los días sin nada se ven apagados
          pero NO se esconden: saber que el jueves está vacío es tan útil
          como saber que el viernes tiene tres. */}
      {porDia.length > 0 ? (
        <ScrollView
          ref={tira}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.tiraDias}
        >
          {porDia.map((d) => {
            const puesto = (dia ?? diaEnPanama(new Date())) === d.dia;
            const vacio = d.cuantos === 0;
            return (
              <Pressable
                key={d.dia}
                /* La tira cubre una semana y no cabe entera: si el día
                   elegido es el sábado, hay que arrastrarla para verlo.
                   Se apunta dónde cae cada uno y se lleva solo. */
                onLayout={(e) => {
                  xDeDia.current[d.dia] = e.nativeEvent.layout.x;
                  if (puesto) aLaVista(e.nativeEvent.layout.x, false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: puesto }}
                accessibilityLabel={`${cuandoTexto(d.dia)}, ${
                  vacio ? 'sin viajes' : d.cuantos === 1 ? '1 viaje' : `${d.cuantos} viajes`
                }`}
                onPress={() => elegirDia(d.dia)}
                style={({ pressed }) => [
                  estilos.diaTira,
                  puesto && estilos.diaTiraPuesto,
                  pressed && { backgroundColor: color.lavadoChip },
                ]}
              >
                <Text style={[estilos.diaTiraNombre, puesto && estilos.diaTiraNombrePuesto]}>
                  {cuandoTexto(d.dia)}
                </Text>
                <Text
                  style={[
                    estilos.diaTiraCuenta,
                    puesto && estilos.diaTiraCuentaPuesta,
                    vacio && !puesto && estilos.diaTiraCuentaVacia,
                  ]}
                >
                  {vacio ? '—' : String(d.cuantos)}
                </Text>
              </Pressable>
            );
          })}
          {/* La tira cubre una semana; más allá, el calendario. Antes esto
              era un chip «Hoy» al lado de los filtros, que decía lo mismo
              que el primer día de la tira. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Elegir otra fecha"
            onPress={() => setEligiendoDia(true)}
            style={({ pressed }) => [
              estilos.diaTira,
              estilos.diaTiraOtra,
              pressed && { backgroundColor: color.lavadoChip },
            ]}
          >
            <Text style={estilos.diaTiraNombre}>Otra</Text>
            <Text style={[estilos.diaTiraCuenta, estilos.diaTiraCuentaVacia]}>fecha</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {/* Los filtros aplicados, retirables uno a uno — también cuando son
          ellos los que dejaron la lista vacía. */}
      {activos.length > 0 ? (
        <View style={estilos.filaAplicados}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.tiraAplicados}
          >
            {activos.map((f) => (
              <Pressable
                key={f.clave}
                accessibilityRole="button"
                accessibilityLabel={`Quitar el filtro ${f.etiqueta}`}
                onPress={() => alternar(f.clave)}
                style={({ pressed }) => [estilos.chipAplicado, pressed && { backgroundColor: color.lavado }]}
              >
                <Text style={estilos.chipAplicadoTexto}>{f.etiqueta}</Text>
                <Cerrar tamano={13} tinta={color.inkIcono} />
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quitar todos los filtros"
              onPress={() => setFiltros((f) => ({ orden: f.orden }))}
              style={estilos.limpiar}
            >
              <Text style={estilos.limpiarTexto}>Limpiar</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}

      <View style={estilos.lista}>
        {cargando ? (
          <View style={{ gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <Esqueleto key={i} />
            ))}
          </View>
        ) : viajes.length === 0 && agotados.length === 0 ? (
          <View style={estilos.vacio}>
            <View style={estilos.vacioDibujo}>
              <AroDeOrigen tinta={color.ink300} />
              <View style={estilos.vacioLinea} />
              <PuntaDeFlecha tamano={10} tinta={color.ink300} />
            </View>
            {/* Una sola voz: toda ruta existe y se busca; lo único que puede
                faltar son viajes. El «todavía no hay esa ruta» murió con la
                apertura de las rutas libres (24-08-2026). */}
            <Text style={estilos.vacioTitulo}>{`Sin viajes a ${etiquetaDestino}`}</Text>
            <Text style={estilos.vacioTexto}>
              {activos.length > 0
                ? 'Nadie ha publicado esta ruta con los filtros aplicados. Quita alguno o mira otro día.'
                : ruta.pasajeros > 1
                  ? `Nadie lleva ${ruta.pasajeros} puestos juntos ese día. Prueba con menos puestos o con otro día.`
                  : 'Nadie sale ese día.'}
            </Text>

            {/* «MIRA OTRO DÍA» AHORA DICE CUÁL. El texto lo aconsejaba desde
                siempre y no daba ninguna puerta: había que volver, abrir el
                calendario y adivinar. Con la cuenta por día ya sabemos dónde
                sí hay, así que se ofrece — hasta tres, los más cercanos. */}
            {otrosDias.length > 0 ? (
              <View style={estilos.otrosDias}>
                {otrosDias.map((d) => (
                  <Pressable
                    key={d.dia}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver los ${d.cuantos} de ${cuandoTexto(d.dia)}`}
                    onPress={() => elegirDia(d.dia)}
                    style={({ pressed }) => [
                      estilos.otroDia,
                      pressed && { backgroundColor: color.lavadoChip },
                    ]}
                  >
                    <Text style={estilos.otroDiaTexto}>
                      {`${d.cuantos === 1 ? 'Hay 1' : `Hay ${d.cuantos}`} ${cuandoTexto(d.dia).toLowerCase()}`}
                    </Text>
                    <Avanza tamano={15} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* La mejor opción, con la frase que se la gana y su acción. */}
            {mejor ? (
              <View style={[estilos.destacada, sombra.l]}>
                <View style={estilos.filaDestacada}>
                  <View style={estilos.selloMejor}>
                    <Text style={estilos.selloMejorTexto}>Mejor opción</Text>
                  </View>
                  <Text style={estilos.metaDestacada}>{`Sale a las ${mejor.salida}`}</Text>
                </View>
                <Text style={estilos.razon}>{razonDeMejor}</Text>
                <View style={estilos.divisorDestacada} />
                <TarjetaDeViaje
                  plano
                  viaje={mejor}
                  alPulsar={() =>
                    router.push({ pathname: '/(pasajero)/viaje', params: { viaje: mejor.id } })
                  }
                />
                <Boton
                  tamano="md"
                  alPulsar={() =>
                    router.push({ pathname: '/(pasajero)/viaje', params: { viaje: mejor.id } })
                  }
                >
                  Reservar puesto
                </Boton>
              </View>
            ) : null}

            {resto.map((v) => (
              <TarjetaDeViaje
                key={v.id}
                viaje={v}
                alPulsar={() =>
                  router.push({ pathname: '/(pasajero)/viaje', params: { viaje: v.id } })
                }
              />
            ))}

            {/* Los agotados, en gris, con su lista de espera: que no quepa
                no significa que no exista. */}
            {agotados.map((v) => (
              <View key={v.id} style={estilos.agotada}>
                <View style={estilos.filaAgotada}>
                  <Text style={[estilos.horaAgotada, tabular]}>
                    {`${v.salida} → ${v.llegada}`}
                  </Text>
                  <View style={estilos.selloAgotado}>
                    <Text style={estilos.selloAgotadoTexto}>Agotado</Text>
                  </View>
                </View>
                <Text style={estilos.metaAgotada} numberOfLines={1}>
                  {`${v.conductor.nombre} · B/${cifraRedonda(v.aporteCentavos)}${
                    v.puestosLibres > 0
                      ? ` · ${v.puestosLibres === 1 ? 'queda 1 cupo' : `quedan ${v.puestosLibres} cupos`} y van ${ruta.pasajeros}`
                      : ''
                  }`}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Avísame si se libera un cupo"
                  onPress={guardarAlerta}
                  style={({ pressed }) => [estilos.botonEspera, pressed && { backgroundColor: color.lavadoChip }]}
                >
                  <Campana tamano={15} tinta={color.inkIcono} />
                  <Text style={estilos.botonEsperaTexto}>Avísame si se libera un cupo</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
      </ScrollView>

      {/* Fijo abajo: la alerta de ruta. Blanca cuando está por poner, teñida
          del acento cuando ya quedó puesta. */}
      {origen && destino ? (
        <View style={estilos.pieAlerta}>
          {guardada ? (
            <View style={[estilos.alerta, estilos.alertaPuesta]}>
              <Visto />
              <Text style={[estilos.alertaTexto, { color: color.rojo800 }]}>
                Te avisamos cuando alguien publique esta ruta
              </Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Avísame cuando alguien publique esta ruta"
              onPress={guardarAlerta}
              style={({ pressed }) => [
                estilos.alerta,
                pressed && { backgroundColor: color.lavadoChip, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Campana tamano={19} tinta={color.ink900} />
              <Text style={estilos.alertaTexto}>Avísame si alguien publica</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      <HojaDeFiltros
        abierta={hojaAbierta}
        filtros={filtros}
        alCambiar={setFiltros}
        alCerrar={() => setHojaAbierta(false)}
        cuantos={viajes.length}
      />

      <HojaDeEleccion
        abierta={eligiendoDia}
        titulo="Qué día viajas"
        opciones={LOS_PROXIMOS_DIAS()}
        elegido={dia ?? diaEnPanama(new Date())}
        alElegir={(v) => setRuta((r) => (r ? { ...r, dia: v } : r))}
        alCerrar={() => setEligiendoDia(false)}
      />
    </View>
  );
}

/* ------------------------------------------------------- Piezas de dibujo */

/** El lápiz de editar la búsqueda, 21 en trazo 1.9. */
function Lapiz() {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.4 5.6 14 16.4 3.2l4.4 4.4L10 18.4 4 19.4Z"
        stroke={color.inkIconoFuerte}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    </Svg>
  );
}


/**
 * LE CORPS DE LA DESTINATION.
 *
 * Sur une ligne partagée, « Ciudad de Panamá → El Valle de Antón » forçait
 * les deux noms à 18 et les coupait quand même. Empilés, chacun a la largeur
 * entière : l'arrivée peut donc rester grosse, et ne rétrécit que pour les
 * noms vraiment longs. Deux lignes autorisées avant de réduire.
 */
function tamanoDeRuta(destino: string): { fontSize: number; lineHeight: number } {
  const cuerpo = destino.length <= 18 ? 28 : destino.length <= 26 ? 24 : 21;
  return { fontSize: cuerpo, lineHeight: Math.round(cuerpo * 1.14) };
}

/**
 * LA COURBE QUI DESCEND DU DÉPART VERS L'ARRIVÉE.
 *
 * Le couple se lit maintenant de haut en bas — d'où l'on part, puis où l'on
 * va — et la courbe fait le trajet des yeux. Elle part sous l'anneau creux du
 * départ, s'incurve vers la droite et arrive en pointe rouge sur la ligne de
 * la destination : la direction s'écrit deux fois, par les cejas ET par le
 * dessin (invariant 1 du v6). L'anneau creux et la pointe pleine sont les
 * mêmes qu'ailleurs dans l'app.
 */
function CurvaDeRuta() {
  return (
    <Svg width={26} height={64} viewBox="0 0 26 64" fill="none" style={estilos.curva}>
      {/* L'anneau du départ : creux, comme sur chaque carte. */}
      <Circle cx={6} cy={7} r={3.4} stroke={color.inkIcono} strokeWidth={1.9} fill="none" />
      {/* Le trait descend droit, puis s'ouvre vers la destination. */}
      <Path
        d="M6 13.5v22c0 8.5 3.5 13 11 14.5"
        stroke={color.ink300}
        strokeWidth={1.9}
        strokeLinecap="round"
        fill="none"
      />
      {/* La pointe rouge : le rouge dit la destination, et rien d'autre. */}
      <Path d="M15.4 45.6 21.6 50.2 15 54Z" fill={color.rojo500} />
    </Svg>
  );
}

function Chevron() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9.6 12 15.6l6-6"
        stroke={color.inkIcono}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Visto() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8Z" stroke={color.rojo800} strokeWidth={1.9} />
      <Path
        d="m8.2 12.2 2.6 2.6 5-5.4"
        stroke={color.rojo800}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** El esqueleto de carga, sobre la geometría real de la tarjeta. */
function Esqueleto() {
  return (
    <View style={estilos.esqueleto}>
      <View style={estilos.esqueletoFila}>
        <View style={estilos.esqueletoBloque} />
        <View style={estilos.esqueletoLinea} />
        <View style={estilos.esqueletoBloque} />
      </View>
      <View style={{ height: 1, backgroundColor: 'rgba(10,39,49,.06)' }} />
      <View style={estilos.esqueletoFila}>
        <View style={estilos.esqueletoAvatar} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[estilos.esqueletoLinea, { width: '44%', height: 9 }]} />
          <View style={[estilos.esqueletoLinea, { width: '28%', height: 8 }]} />
        </View>
        <View style={[estilos.esqueletoBloque, { width: 48, height: 24 }]} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------- Los filtros */

/* «Acepta maletas» se fue con el booleano del conductor: ya no hay nada que
   filtrar, porque el viaje no lo declara — lo decide al recibir cada
   solicitud (25-08-2026). */
type ClaveDeFiltro = 'aceptaMascotas' | 'soloMujeres' | 'yappy';

const ETIQUETAS: Record<ClaveDeFiltro, string> = {
  aceptaMascotas: 'Con mascota',
  soloMujeres: 'Solo mujeres',
  yappy: 'Yappy',
};

function filtrosActivos(f: Filtros): { clave: ClaveDeFiltro; etiqueta: string }[] {
  return (Object.keys(ETIQUETAS) as ClaveDeFiltro[])
    .filter((k) => !!f[k])
    .map((k) => ({ clave: k, etiqueta: ETIQUETAS[k] }));
}

function cuantosFiltros(f: Filtros): number {
  return filtrosActivos(f).length;
}

/**
 * La hoja de filtros: lo mismo que la fila de aplicados y lo que no cabe
 * ahí — el orden y el botón de quitarlos todos.
 */
function HojaDeFiltros({
  abierta,
  filtros,
  alCambiar,
  alCerrar,
  cuantos,
}: {
  abierta: boolean;
  filtros: Filtros;
  alCambiar: (f: Filtros) => void;
  alCerrar: () => void;
  cuantos: number;
}) {
  const alternar = (clave: ClaveDeFiltro) =>
    alCambiar({ ...filtros, [clave]: filtros[clave] ? undefined : true });

  return (
    <Modal visible={abierta} transparent animationType="slide" onRequestClose={alCerrar}>
      <Pressable accessibilityLabel="Cerrar" style={estilos.velo} onPress={alCerrar} />
      <View style={estilos.hoja}>
        <View style={estilos.asa} />
        <Text style={estilos.hojaTitulo}>Filtros</Text>

        <View style={estilos.hojaGrupo}>
          {(Object.keys(ETIQUETAS) as ClaveDeFiltro[]).map((k) => (
            <ChipDeHoja
              key={k}
              activo={!!filtros[k]}
              etiqueta={ETIQUETAS[k]}
              alPulsar={() => alternar(k)}
            />
          ))}
        </View>

        <Text style={estilos.hojaEpigrafe}>Ordenar por</Text>
        <View style={estilos.hojaGrupo}>
          {(['temprano', 'barato'] as Orden[]).map((o) => (
            <ChipDeHoja
              key={o}
              activo={(filtros.orden ?? 'temprano') === o}
              etiqueta={o === 'temprano' ? 'Más temprano' : 'Aporte más bajo'}
              alPulsar={() => alCambiar({ ...filtros, orden: o })}
            />
          ))}
        </View>

        <View style={estilos.hojaPie}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitar los filtros"
            onPress={() => alCambiar({ orden: filtros.orden })}
            style={zonaDeToque}
          >
            <Text style={estilos.quitar}>Quitar los filtros</Text>
          </Pressable>
          <Boton alPulsar={alCerrar}>
            {cuantos === 1 ? 'Ver 1 viaje' : `Ver ${cuantos} viajes`}
          </Boton>
        </View>
      </View>
    </Modal>
  );
}

function ChipDeHoja({
  activo,
  etiqueta,
  alPulsar,
}: {
  activo: boolean;
  etiqueta: string;
  alPulsar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={etiqueta}
      onPress={alPulsar}
      style={[
        estilos.chipHoja,
        activo
          ? { backgroundColor: color.ink900, borderColor: color.ink900 }
          : { backgroundColor: color.blanco, borderColor: color.bordePorDefecto },
      ]}
    >
      <Text style={[estilos.chipHojaTexto, { color: activo ? color.blanco : color.ink700 }]}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------- Utilidades */

const LOS_PROXIMOS_DIAS = (): Opcion[] =>
  Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dia = diaEnPanama(d);
    return {
      valor: dia,
      etiqueta: cuandoTexto(dia),
      debajo: i <= 1 ? diaLargo(d.toISOString()) : undefined,
    };
  });

/** «Hoy», «Mañana» o el día corto, según cuándo salgan los viajes que hay. */
function cuandoTexto(dia: string | null): string {
  if (!dia) return 'Hoy';
  const hoy = diaEnPanama(new Date());
  if (dia === hoy) return 'Hoy';
  const manana = diaEnPanama(new Date(Date.now() + 86_400_000));
  if (dia === manana) return 'Mañana';
  return diaCorto(`${dia}T12:00:00-05:00`);
}

function duracion(salida: string, llegada: string | null): string {
  if (!llegada) return '';
  const minutos = Math.round((new Date(llegada).getTime() - new Date(salida).getTime()) / 60_000);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

/* ----------------------------------------------------------------- Estilos */

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  filaNav: {
    paddingTop: 8,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  celdaIcono: {
    width: 44,
    height: 44,
    borderRadius: radio.icono,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cabecera: { paddingTop: 8, paddingHorizontal: espacio.gutter, gap: 6 },
  /** Le couple vertical : la courbe à gauche, les deux noms à droite. */
  parRuta: { flexDirection: 'row', gap: 12 },
  curva: { marginTop: 4, flexShrink: 0 },
  columnaRuta: { flex: 1, minWidth: 0, gap: 10 },
  /** L'arrivée s'aligne sur la pointe de la courbe. */
  bloqueDestino: { marginTop: 2 },
  cejaRuta: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    letterSpacing: 0.99,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },
  cejaHasta: { color: color.rojo700 },
  /**
   * LE DÉPART EST LE CONTEXTE, L'ARRIVÉE EST LE SUJET. D'où la hiérarchie :
   * le départ en corps de lieu, dans l'encre secondaire ; l'arrivée en
   * titre plein, dans l'encre forte. On sait toujours d'où l'on part ; ce
   * qu'on cherche des yeux, c'est où l'on va.
   */
  origen: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.34,
    color: color.ink600,
    fontFamily: familia,
  },
  destino: {
    fontWeight: '700',
    letterSpacing: -0.9,
    color: color.ink900,
    fontFamily: familia,
  },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: '400', color: color.ink600, fontFamily: familia },

  barraChips: {
    paddingTop: 16,
    paddingHorizontal: espacio.gutter,
    flexDirection: 'row',
    gap: 8,
  },
  chipOscuro: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: radio.cuadrado,
    backgroundColor: color.ink900,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipOscuroTexto: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.13,
    color: color.blanco,
    fontFamily: familia,
  },
  cuenta: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 7,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuentaTexto: {
    fontSize: 10,
    lineHeight: 18,
    fontWeight: '600',
    color: color.blanco,
    fontFamily: familia,
    ...tabular,
  },
  chipClaro: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: radio.cuadrado,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.09)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chipClaroTexto: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.13,
    color: color.ink700,
    fontFamily: familia,
  },

  otrosDias: { marginTop: 16, alignSelf: 'stretch', gap: 8 },
  otroDia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
  },
  otroDiaTexto: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },

  tiraDias: { paddingHorizontal: espacio.gutter, paddingTop: 12, gap: 8 },
  diaTira: {
    minWidth: 62,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
  },
  /* El día elegido va en tinta, no en rojo: elegir un día no es una acción
     primaria, y el rojo tiene sus cuatro sentidos (invariante 4). */
  diaTiraPuesto: { backgroundColor: color.ink900, borderColor: color.ink900 },
  diaTiraNombre: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: color.ink600,
    fontFamily: familia,
  },
  diaTiraNombrePuesto: { color: 'rgba(255,255,255,.82)' },
  diaTiraCuenta: {
    marginTop: 2,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  diaTiraCuentaPuesta: { color: color.blanco },
  diaTiraCuentaVacia: { color: color.ink300, fontWeight: '500' },
  diaTiraOtra: { borderStyle: 'dashed', justifyContent: 'center' },

  filaAplicados: { paddingTop: 12 },
  tiraAplicados: {
    paddingHorizontal: espacio.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipAplicado: {
    height: 32,
    paddingLeft: 11,
    paddingRight: 7,
    borderRadius: radio.ficha,
    backgroundColor: color.lavadoChip,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.07)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipAplicadoTexto: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: -0.12,
    color: color.ink700,
    fontFamily: familia,
  },
  limpiar: { height: 32, paddingHorizontal: 6, justifyContent: 'center' },
  limpiarTexto: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: color.rojo700,
    fontFamily: familia,
  },

  lista: { padding: espacio.gutter, paddingBottom: 24 },

  destacada: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.l,
    padding: 16,
    gap: 12,
  },
  filaDestacada: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selloMejor: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: 'rgba(225,33,59,.10)',
  },
  selloMejorTexto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.45,
    textTransform: 'uppercase',
    color: color.rojo800,
    fontFamily: familia,
  },
  metaDestacada: { fontSize: 11, lineHeight: 15, fontWeight: '400', color: color.ink600, fontFamily: familia },
  razon: { fontSize: 12, lineHeight: 17, fontWeight: '400', letterSpacing: -0.12, color: color.ink500, fontFamily: familia },
  divisorDestacada: { height: 1, backgroundColor: color.divisor },

  agotada: {
    backgroundColor: 'rgba(10,39,49,.035)',
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.05)',
    borderRadius: radio.l,
    padding: 16,
    gap: 12,
  },
  filaAgotada: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  horaAgotada: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.57,
    color: color.ink400,
    fontFamily: familia,
  },
  selloAgotado: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: 'rgba(10,39,49,.06)',
  },
  selloAgotadoTexto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.45,
    textTransform: 'uppercase',
    color: color.inkIcono,
    fontFamily: familia,
  },
  metaAgotada: { fontSize: 12, lineHeight: 17, fontWeight: '400', color: color.ink400, fontFamily: familia, ...tabular },
  botonEspera: {
    height: 40,
    borderRadius: radio.cuadrado,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.10)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  botonEsperaTexto: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.13,
    color: color.ink700,
    fontFamily: familia,
  },

  esqueleto: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.06)',
    borderRadius: radio.l,
    padding: 16,
    gap: 14,
  },
  esqueletoFila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  esqueletoBloque: { width: 58, height: 38, borderRadius: 9, backgroundColor: 'rgba(10,39,49,.07)' },
  esqueletoLinea: { flex: 1, height: 7, borderRadius: 4, backgroundColor: 'rgba(10,39,49,.05)' },
  esqueletoAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(10,39,49,.07)' },

  vacio: { alignItems: 'center', paddingTop: 24, gap: 6 },
  vacioDibujo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: color.lavadoChip,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 10,
  },
  vacioLinea: {
    width: 16,
    height: 0,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,39,49,.2)',
  },
  vacioTitulo: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: color.ink900,
    textAlign: 'center',
    fontFamily: familia,
  },
  vacioTexto: {
    maxWidth: 270,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    color: color.ink500,
    textAlign: 'center',
    fontFamily: familia,
  },

  pieAlerta: { paddingHorizontal: espacio.gutter, paddingTop: 12, paddingBottom: 12 },
  alerta: {
    height: 54,
    borderRadius: radio.boton,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#0A2731',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  alertaPuesta: {
    backgroundColor: 'rgba(225,33,59,.07)',
    borderColor: 'rgba(225,33,59,.20)',
    shadowOpacity: 0,
  },
  alertaTexto: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.15,
    color: color.ink900,
    fontFamily: familia,
  },

  velo: { flex: 1, backgroundColor: 'rgba(10,20,25,.42)' },
  hoja: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.blanco,
    borderTopLeftRadius: radio.hoja,
    borderTopRightRadius: radio.hoja,
    paddingHorizontal: espacio.hoja,
    paddingTop: 12,
    paddingBottom: 34,
    gap: 14,
    maxWidth: espacio.marco,
    alignSelf: 'center',
    width: '100%',
  },
  asa: { width: 40, height: 4, borderRadius: 2, backgroundColor: color.ink200, alignSelf: 'center' },
  hojaTitulo: {
    fontFamily: familia,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: color.ink900,
  },
  hojaEpigrafe: {
    fontFamily: familia,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: color.ink500,
  },
  hojaGrupo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hojaPie: { gap: 12, marginTop: 4 },
  quitar: {
    fontFamily: familia,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.rojo700,
    textAlign: 'center',
  },
  chipHoja: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: radio.cuadrado,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipHojaTexto: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: -0.13, fontFamily: familia },
});
