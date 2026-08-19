/**
 * `1b` / `3b` Resultados — los viajes completos y sin cuenta.
 *
 * El pasajero ve precio, puestos, equipaje y quién maneja antes de registrarse.
 * La puerta está más adelante, al pedir puesto. Los filtros son los tres del
 * traspaso: acepta maletas, solo mujeres y método de pago.
 */

import { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { etiquetaDeMaletero } from '@/dominio/equipaje';
import { NOMBRE_DEL_CANAL } from '@/dominio/tarifas';
import {
  COMO_SE_ORDENA,
  type Filtros,
  type Orden,
  buscarViajes,
  diaEnPanama,
  proximoDiaConViajes,
} from '@/servicios/viajes';
import { hayCorredor, nombreDeCiudad, CIUDAD_POR_DEFECTO } from '@/servicios/lugares';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Pestanas } from '@/ui/Pestanas';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { hora } from '@/ui/fechas';
import { Atras, Cerrar, Filtros as IconoFiltros } from '@/ui/iconos';
import { TarjetaDeViaje, type ViajeEnTarjeta } from '@/ui/TarjetaDeViaje';
import { familia, color, espacio, radio } from '@/ui/tokens';



/** La ruta del traspaso, cuando la pantalla se abre suelta desde el índice. */
const ORIGEN_POR_DEFECTO = CIUDAD_POR_DEFECTO;
const DESTINO_POR_DEFECTO = 'chitre';

export default function Resultados() {
  const router = useRouter();
  // `3a` manda a dónde vas. Sin eso —solo abriendo la pantalla suelta— la ruta
  // del traspaso, que es la que tiene viajes sembrados.
  const params = useLocalSearchParams<{
    origen?: string;
    destino?: string;
    etiquetaDestino?: string;
    dia?: string;
    pasajeros?: string;
  }>();

  /**
   * La ruta se lee del parámetro **después** del primer render, y no durante.
   *
   * El sitio sale prerenderizado sin parámetros, así que el HTML que llega ya
   * dice «→ Chitré»; pintar «→ Colón» en el primer render del navegador es una
   * discordancia de hidratación —React 418, medido— y React tira el árbol y lo
   * rehace. Es el mismo patrón que usan las otras pantallas con parámetro:
   * pantalla vacía hasta que se sabe qué enseñar.
   */
  const [ruta, setRuta] = useState<{
    origen: string;
    destino: string;
    etiqueta: string;
    /** El día que `3a` eligió. `null` = el primero con salidas. */
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
  // Un sitio de Mapbox no es una ciudad que servimos: se busca, no se encuentra,
  // y la pantalla tiene que decir eso y no «nadie sale con esos filtros».
  const servimosLaRuta = hayCorredor(origen, destino);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [viajes, setViajes] = useState<ViajeEnTarjeta[]>([]);
  const [dia, setDia] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    if (!ruta) return;
    if (!servimosLaRuta) {
      /* El día elegido sigue siendo el día elegido aunque no haya ruta:
         poner `null` hacía que la cabecera dijera «Hoy» después de haber
         elegido «Mañana». */
      setDia(ruta.dia);
      setViajes([]);
      return;
    }
    /* El día elegido manda. Sin él —al abrir la pantalla suelta— el primero
       con salidas, que es más útil que un «hoy» vacío. */
    const fecha = ruta.dia ?? (await proximoDiaConViajes(origen, destino));
    setDia(fecha);
    const encontrados = await buscarViajes(origen, destino, fecha, filtros);
    setViajes(
      encontrados
        .map(
          (v): ViajeEnTarjeta => ({
            id: v.id!,
            salida: hora(v.departure_at!),
            duracion: duracion(v.departure_at!, v.arrival_estimate_at),
            aporteCentavos: Number(v.price_cents ?? 0),
            puestosLibres: v.seats_available ?? 0,
            origen: v.origin_label ?? '',
            destino: (v.destination_label ?? '').replace(' Unión', ''),
            llegada: v.arrival_estimate_at ? hora(v.arrival_estimate_at) : '',
            equipaje: etiquetaDeMaletero(v.accepts_luggage),
            conductor: {
              nombre: `${v.first_name ?? ''} ${v.last_initial ?? ''}`.trim(),
              calificacion: v.driver_rating ?? 0,
              carro: `${v.model ?? ''} ${v.color ?? ''}`.trim(),
            },
            canal: NOMBRE_DEL_CANAL.yappy_app,
          }),
        )
        /* Un viaje con dos puestos no sirve a tres personas: no es un
           resultado, es una decepción a un toque de distancia. */
        .filter((v) => v.puestosLibres >= (ruta.pasajeros ?? 1))
        .sort((a, b) => a.salida.localeCompare(b.salida)),
    );
  }, [filtros, ruta, origen, destino, servimosLaRuta]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const alternar = (clave: keyof Filtros) =>
    setFiltros((f) => ({ ...f, [clave]: f[clave] ? undefined : true }));

  if (!ruta) return <View style={estilos.pantalla} />;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtros"
            onPress={() => setHojaAbierta(true)}
            style={estilos.circulo}
          >
            <IconoFiltros />
            {cuantosFiltros(filtros) > 0 ? <View style={estilos.punto} /> : null}
          </Pressable>
        </View>

        <Text style={estilos.titular}>
          {nombreDeCiudad(origen)}
          {'\n'}
          <Text style={estilos.titularFuerte}>
            {`→ ${ruta.etiqueta || nombreDeCiudad(destino)}`}
          </Text>
        </Text>
        <Text style={estilos.subtitulo}>
          {`${cuandoTexto(dia)} · ${ruta.pasajeros} ${ruta.pasajeros === 1 ? 'puesto' : 'puestos'} · ${viajes.length} ${viajes.length === 1 ? 'viaje' : 'viajes'}`}
        </Text>
      </View>

      <View style={estilos.filtros}>
        <Chip
          activo={!!filtros.aceptaMaletas}
          etiqueta="Acepta maletas"
          alPulsar={() => alternar('aceptaMaletas')}
        />
        <Chip
          activo={!!filtros.soloMujeres}
          etiqueta="Solo mujeres"
          alPulsar={() => alternar('soloMujeres')}
        />
        <Chip activo={!!filtros.yappy} etiqueta="Yappy" alPulsar={() => alternar('yappy')} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.filaSeccion}>
          <Epigrafe>{`Salidas de ${cuandoTexto(dia).toLowerCase()}`}</Epigrafe>
          <Text style={estilos.orden}>{COMO_SE_ORDENA[filtros.orden ?? 'temprano']}</Text>
        </View>

        {viajes.length === 0 ? (
          <View style={estilos.vacio}>
            {servimosLaRuta ? (
              <>
                <Text style={estilos.vacioTitulo}>
                  {ruta.pasajeros > 1
                    ? `Nadie lleva ${ruta.pasajeros} puestos juntos ese día.`
                    : 'Nadie sale ese día con esos filtros.'}
                </Text>
                <Text style={estilos.vacioTexto}>
                  {ruta.pasajeros > 1
                    ? 'Prueba con menos puestos o con otro día.'
                    : 'Quita alguno o mira otro día.'}
                </Text>
              </>
            ) : (
              <>
                {/* Una búsqueda sin resultados no es un fallo: es un aviso a los
                    conductores. PRODUCT.md lo dice, y por eso se nombra la ruta
                    en vez de decir «no hay nada». */}
                <Text style={estilos.vacioTitulo}>Todavía no hay esa ruta.</Text>
                <Text style={estilos.vacioTexto}>
                  {`Nadie ha publicado ${nombreDeCiudad(origen)} → ${ruta.etiqueta || nombreDeCiudad(destino)}. Guárdala y te avisamos cuando alguien la abra.`}
                </Text>
              </>
            )}
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {viajes.map((v) => (
              <TarjetaDeViaje
                key={v.id}
                viaje={v}
                alPulsar={() => router.push({ pathname: '/(pasajero)/viaje', params: { viaje: v.id } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    <HojaDeFiltros
        abierta={hojaAbierta}
        filtros={filtros}
        alCambiar={setFiltros}
        alCerrar={() => setHojaAbierta(false)}
        cuantos={viajes.length}
      />

      <View style={estilos.pie}>
        <Pestanas valor="Buscar" />
      </View>
    </View>
  );
}

function Chip({
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
        estilos.chip,
        activo
          ? { backgroundColor: color.azul100, borderColor: 'transparent', paddingRight: 5 }
          : { backgroundColor: color.blanco, borderColor: color.bordePorDefecto },
      ]}
    >
      <Text style={[estilos.chipTexto, { color: activo ? color.azul700 : color.ink700 }]}>
        {etiqueta}
      </Text>
      {activo ? (
        <View style={estilos.chipQuitar}>
          <Cerrar tamano={9} tinta="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
}

/** Cuántos filtros están puestos: es lo que enciende el punto del icono. */
function cuantosFiltros(f: Filtros): number {
  return [f.aceptaMaletas, f.soloMujeres, f.yappy].filter(Boolean).length;
}

/**
 * La hoja de filtros. Lo mismo que las pastillas de arriba y dos cosas que no
 * caben ahí: el orden, y el botón de quitarlos todos.
 *
 * Se cierra tocando fuera, como todas las hojas del traspaso.
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
  const alternar = (clave: 'aceptaMaletas' | 'soloMujeres' | 'yappy') =>
    alCambiar({ ...filtros, [clave]: filtros[clave] ? undefined : true });

  return (
    <Modal visible={abierta} transparent animationType="slide" onRequestClose={alCerrar}>
      <Pressable accessibilityLabel="Cerrar" style={estilos.velo} onPress={alCerrar} />
      <View style={estilos.hoja}>
        <View style={estilos.asa} />
        <Text style={estilos.hojaTitulo}>Filtros</Text>

        <View style={estilos.hojaGrupo}>
          <Chip
            activo={!!filtros.aceptaMaletas}
            etiqueta="Acepta maletas"
            alPulsar={() => alternar('aceptaMaletas')}
          />
          <Chip
            activo={!!filtros.soloMujeres}
            etiqueta="Solo mujeres"
            alPulsar={() => alternar('soloMujeres')}
          />
          <Chip activo={!!filtros.yappy} etiqueta="Yappy" alPulsar={() => alternar('yappy')} />
        </View>

        <Text style={estilos.hojaEpigrafe}>Ordenar por</Text>
        <View style={estilos.hojaGrupo}>
          {(['temprano', 'barato'] as Orden[]).map((o) => (
            <Chip
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
            onPress={() => alCambiar({})}
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

/** «Hoy», «Mañana» o el día, según cuándo salgan los viajes que hay. */
function cuandoTexto(dia: string | null): string {
  if (!dia) return 'Hoy';
  const hoy = diaEnPanama(new Date());
  if (dia === hoy) return 'Hoy';
  const manana = diaEnPanama(new Date(Date.now() + 86_400_000));
  return dia === manana ? 'Mañana' : dia;
}

function duracion(salida: string, llegada: string | null): string {
  if (!llegada) return '';
  const minutos = Math.round((new Date(llegada).getTime() - new Date(salida).getTime()) / 60_000);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

const estilos = StyleSheet.create({
  pie: { paddingHorizontal: espacio.gutter, paddingBottom: 10, paddingTop: 6 },
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingBottom: 24 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titular: {
    fontSize: 31,
    lineHeight: 32.86,
    letterSpacing: -1.395,
    fontWeight: '400',
    color: '#fff',
    marginTop: 14,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },
  subtitulo: {
    fontSize: 14, lineHeight: 20.3,
    color: color.campoTexto,
    marginTop: 10,
    fontFamily: familia,
    ...tabular,
  },

  filtros: { flexDirection: 'row', gap: 8, paddingHorizontal: espacio.gutter },

  /** El punto que dice que hay filtros puestos sin tener que abrir la hoja. */
  punto: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: color.rojo500,
  },

  velo: { flex: 1, backgroundColor: 'rgba(18,9,12,.42)' },
  hoja: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.blanco,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: espacio.hoja,
    paddingTop: 12,
    paddingBottom: 34,
    gap: 14,
    maxWidth: 390,
    alignSelf: 'center',
    width: '100%',
  },
  asa: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.bordePorDefecto,
    alignSelf: 'center',
  },
  hojaTitulo: {
    fontFamily: familia,
    fontSize: 22,
    lineHeight: 31.9,
    fontWeight: '600',
    letterSpacing: -0.22,
    color: color.ink900,
  },
  hojaEpigrafe: {
    fontFamily: familia,
    fontSize: 12,
    lineHeight: 17.4,
    fontWeight: '600',
    letterSpacing: 0.1 * 12,
    textTransform: 'uppercase',
    color: color.ink600,
  },
  hojaGrupo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hojaPie: { gap: 12, marginTop: 4 },
  quitar: {
    fontFamily: familia,
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '600',
    color: color.ink600,
    textAlign: 'center',
  },
  chip: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chipTexto: { fontSize: 13, lineHeight: 18.85, fontWeight: '500', fontFamily: familia },
  chipQuitar: {
    width: 21,
    height: 21,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul500,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lista: { paddingHorizontal: espacio.gutter, paddingTop: 18, paddingBottom: 26 },
  filaSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  orden: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, fontFamily: familia },

  vacio: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    borderRadius: radio.l,
    padding: 20,
    gap: 4,
  },
  vacioTitulo: { fontSize: 15, lineHeight: 21.75, fontWeight: '500', color: color.ink900, fontFamily: familia },
  vacioTexto: { fontSize: 13.5, lineHeight: 20, color: color.ink600, fontFamily: familia },
});
