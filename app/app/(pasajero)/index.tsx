/**
 * Inicio — la estructura del v6, pantalla «Inicio» de
 * `diseno/Partimos App v6.dc.html`, sin aproximaciones.
 *
 * De arriba a abajo, lo fijo: la fila de marca (el logo con la campana y el
 * retrato), el título en dos tintas — «¿Para dónde» en tinta, «partimos
 * hoy?» apagado —, la tarjeta de búsqueda blanca con SALGO DE / VOY A y el
 * botón de invertir montado en su borde, la fila Hoy · pasajeros, el CTA
 * rojo con su lupa, y la línea de confianza. Debajo, una sola columna que se
 * desplaza: las rutas populares en tarjetas horizontales y las salidas
 * próximas. Al pie, la barra de pestañas del v6.
 *
 * Los rótulos de campo son verbos en primera persona — «Salgo de»,
 * «Voy a» — porque así los exige el invariante 8 del archivo.
 */

import type { Lugar } from '@/dominio/lugar';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { bandeja } from '@/servicios/avisos';
import { perfilResumido } from '@/servicios/perfiles';
import { useMiId } from '@/servicios/sesion';
import { aDondeSeVaDesde, ciudadesDeSalida, CIUDAD_POR_DEFECTO } from '@/servicios/lugares';
import {
  type GanchoDeConductor,
  type RutaPopular,
  type SalidaCercana,
  diaEnPanama,
  ganchoDeConductor,
  proximasSalidas,
  rutasPopulares,
} from '@/servicios/viajes';
import { BuscadorDeLugar } from '@/ui/BuscadorDeLugar';
import { type Opcion, HojaDeEleccion } from '@/ui/HojaDeEleccion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Pestanas } from '@/ui/Pestanas';
import { CampoRojo, DibujoDelSitio } from '@/ui/CampoRojo';
import { Avatar } from '@/ui/controles';
import { PuntaDeFlecha } from '@/ui/TarjetaDeViaje';
import { cifraRedonda, formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaCorto, diaLargo, hora } from '@/ui/fechas';
import { Calendario, Campana, Escudo, Estrella, Intercambio, Lupa, Marca, Persona } from '@/ui/iconos';
import { familia, color, espacio, pulsado, radio, sombra, zonaDeToque } from '@/ui/tokens';

const FOTOS: Record<string, number> = {
  chitre: require('../../assets/chitre.jpeg'),
  coronado: require('../../assets/playa-blanca.jpeg'),
  david: require('../../assets/david.jpeg'),
  'las-tablas': require('../../assets/venao.webp'),
};

/** Los puestos se escriben con letra: en una frase, «tres» se lee y «3» se cuenta. */
const LETRAS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis'];
const enLetra = (n: number) => LETRAS[n] ?? String(n);

/**
 * Los quince días que se pueden elegir. Quince y no un calendario entero:
 * los viajes se publican con dos o tres días de antelación, así que un mes
 * de casillas vacías sería enseñar sobre todo días sin nadie.
 */
const LOS_PROXIMOS_DIAS = (): Opcion[] =>
  Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dia = diaEnPanama(d);
    return {
      valor: dia,
      etiqueta: comoSeLlamaElDia(dia),
      debajo: i <= 1 ? diaLargo(d.toISOString()) : undefined,
    };
  });

/** «Hoy» y «Mañana» tienen nombre; el resto se dice por su fecha. */
function comoSeLlamaElDia(dia: string): string {
  const hoy = diaEnPanama(new Date());
  if (dia === hoy) return 'Hoy';
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  if (dia === diaEnPanama(manana)) return 'Mañana';
  return diaCorto(`${dia}T12:00:00-05:00`);
}

/** Cuatro es el máximo: un carro de cinco plazas lleva cuatro pasajeros. */
const CUANTOS_PUESTOS: Opcion[] = [
  { valor: '1', etiqueta: '1 pasajero' },
  { valor: '2', etiqueta: '2 pasajeros' },
  { valor: '3', etiqueta: '3 pasajeros' },
  { valor: '4', etiqueta: '4 pasajeros' },
];

/** De dónde se sale por defecto: es de donde sale casi todo el mundo. */
const DESDE_POR_DEFECTO: Lugar = {
  nombre: 'Ciudad de Panamá',
  contexto: 'Panamá',
  citySlug: CIUDAD_POR_DEFECTO,
  tipo: 'ciudad',
  fuente: 'catalogo',
  lat: 8.9824,
  lng: -79.5199,
};

/** Sin sesión que preguntar —solo en simulado—: la persona del recorrido. */
const YO_DEL_RECORRIDO = '22222222-2222-4222-8222-222222222222';

export default function Inicio() {
  const router = useRouter();
  const yo = useMiId(YO_DEL_RECORRIDO);
  const [nombre, setNombre] = useState<string | null>(null);
  const [sinLeer, setSinLeer] = useState(0);
  const [rutas, setRutas] = useState<RutaPopular[]>([]);
  const [salen, setSalen] = useState<SalidaCercana[]>([]);
  const [gancho, setGancho] = useState<GanchoDeConductor | null>(null);
  const [desde, setDesde] = useState<Lugar>(DESDE_POR_DEFECTO);
  const [hacia, setHacia] = useState<Lugar | null>(null);
  const [buscando, setBuscando] = useState<'desde' | 'hacia' | null>(null);
  const [cuando, setCuando] = useState(() => diaEnPanama(new Date()));
  const [pasajeros, setPasajeros] = useState(1);
  const [eligiendo, setEligiendo] = useState<'cuando' | 'pasajeros' | null>(null);

  useEffect(() => {
    rutasPopulares().then(setRutas);
    ganchoDeConductor().then(setGancho);
    /* Lo que sale ya. Si no hay nada en la próxima hora la sección no
       aparece: una fila vacía diciendo «salen ahora» sería mentira. */
    proximasSalidas(6).then(setSalen);
  }, []);

  useEffect(() => {
    if (!yo) return;
    perfilResumido(yo).then((p) => setNombre(p?.first_name ?? null));
    bandeja(yo).then((b) => setSinLeer(b.sinLeer));
  }, [yo]);

  const sugerencias =
    buscando === 'hacia'
      ? aDondeSeVaDesde(desde.citySlug ?? CIUDAD_POR_DEFECTO)
      : buscando === 'desde'
        ? ciudadesDeSalida()
        : [];

  const buscar = () => {
    /* Sin destino no se busca: se abre el campo que falta. */
    if (!hacia) {
      setBuscando('hacia');
      return;
    }
    router.push({
      pathname: '/(pasajero)/resultados',
      params: {
        origen: desde.citySlug ?? CIUDAD_POR_DEFECTO,
        destino: hacia.citySlug ?? '',
        etiquetaDestino: hacia.nombre,
        dia: cuando,
        pasajeros: String(pasajeros),
      },
    });
  };

  /** El rango de precios de las salidas próximas: «B/9 – B/18». */
  const precios = salen.map((v) => v.aporteCentavos);
  const rango =
    precios.length > 1
      ? `B/${cifraRedonda(Math.min(...precios))} – B/${cifraRedonda(Math.max(...precios))}`
      : null;

  /** Las iniciales del retrato de la cabecera. */
  const iniciales = (nombre ?? 'Tú')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View style={estilos.pantalla}>
      {/* La atmósfera del v6: los dos halos, detrás de todo. */}
      <CampoRojo altura={400} />

      <BarraDeEstado />

      {/* La fila de marca: el logo a la izquierda, campana y retrato a la derecha. */}
      <View style={estilos.filaMarca}>
        <View style={estilos.marca}>
          <Marca tamano={21} />
          <Text style={estilos.marcaTexto}>partimos</Text>
        </View>
        <View style={estilos.filaDerecha}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={sinLeer === 0 ? 'Avisos' : `Avisos, ${sinLeer} sin leer`}
            onPress={() => router.push('/(avisos)/avisos')}
            style={({ pressed }) => [estilos.celdaIcono, pressed && pulsado.celda]}
          >
            <Campana tamano={23} tinta={color.inkIconoFuerte} />
            {sinLeer > 0 ? <View style={estilos.puntoAviso} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tu perfil"
            onPress={() => router.push('/(cuenta)/cuenta')}
            style={estilos.celdaRetrato}
          >
            <View style={estilos.retrato}>
              <Text style={estilos.retratoTexto}>{iniciales}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* El título en dos tintas, como el v6: la pregunta y su eco apagado. */}
      <View style={estilos.filaTitulo}>
        <Text style={estilos.titulo} numberOfLines={2}>
          {'¿Para dónde '}
          <Text style={estilos.tituloApagado}>partimos hoy?</Text>
        </Text>
      </View>

      {/* La tarjeta de búsqueda: SALGO DE / VOY A con el conector punteado,
          el botón de invertir en su borde, y la fila Hoy · pasajeros. */}
      <View style={estilos.zonaBusqueda}>
        <View style={estilos.tarjetaBusqueda}>
          <View style={{ position: 'relative' }}>
            {/* El conector punteado entre los dos iconos de campo. */}
            <View style={estilos.conector} pointerEvents="none" />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Salgo de ${desde.nombre}. Cambiar`}
              onPress={() => setBuscando('desde')}
              style={estilos.filaCampo}
            >
              <View style={estilos.casillaIconoCampo}>
                <View style={estilos.aroOrigen} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.cejaCampo}>Salgo de</Text>
                <Text style={estilos.valorCampo} numberOfLines={1}>
                  {desde.nombre}
                </Text>
              </View>
            </Pressable>

            <View style={estilos.divisorCampo} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={hacia ? `Voy a ${hacia.nombre}. Cambiar` : 'Elegir a dónde vas'}
              onPress={() => setBuscando('hacia')}
              style={estilos.filaCampo}
            >
              <View style={estilos.casillaIconoCampo}>
                {/* El pin relleno del destino: rojo, con el punto blanco. */}
                <View style={estilos.pin}>
                  <View style={estilos.pinPunto} />
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[estilos.cejaCampo, estilos.cejaVoyA]}>Voy a</Text>
                <Text
                  style={[estilos.valorCampo, !hacia && { color: color.ink400 }]}
                  numberOfLines={1}
                >
                  {hacia?.nombre ?? '¿A dónde vas?'}
                </Text>
              </View>
            </Pressable>

            {/* Invertir: 40 × 40 al radio 14, montado sobre el borde derecho,
                centrado en la línea que separa los dos campos. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Invertir origen y destino"
              disabled={!hacia}
              onPress={() => {
                if (!hacia) return;
                const antes = desde;
                setDesde(hacia);
                setHacia(antes);
              }}
              style={({ pressed }) => [
                estilos.invertir,
                pressed && { transform: [{ translateY: -20 }, { scale: 0.94 }] },
                !hacia && { opacity: 0.35 },
              ]}
            >
              <Intercambio tamano={17} tinta={color.ink700} />
            </Pressable>
          </View>

          <View style={estilos.divisorTarjeta} />

          <View style={estilos.filaOpciones}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Cuándo sales: ${comoSeLlamaElDia(cuando)}. Cambiar`}
              onPress={() => setEligiendo('cuando')}
              style={({ pressed }) => [estilos.opcion, pressed && { backgroundColor: color.lavadoChip }]}
            >
              <Calendario tamano={17} />
              <Text style={estilos.opcionTexto}>{comoSeLlamaElDia(cuando)}</Text>
            </Pressable>
            <View style={estilos.divisorVertical} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${pasajeros} ${pasajeros === 1 ? 'pasajero' : 'pasajeros'}. Cambiar`}
              onPress={() => setEligiendo('pasajeros')}
              style={({ pressed }) => [estilos.opcion, pressed && { backgroundColor: color.lavadoChip }]}
            >
              <Persona tamano={17} tinta={color.inkIcono} grueso={2.1} />
              <Text style={[estilos.opcionTexto, tabular]}>
                {`${pasajeros} ${pasajeros === 1 ? 'pasajero' : 'pasajeros'}`}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* El CTA: rojo, 54, con su lupa y la sombra del acento. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar viajes"
          onPress={buscar}
          style={({ pressed }) => [
            estilos.cta,
            pressed && { backgroundColor: color.rojo600, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Lupa tamano={19} tinta={color.blanco} grueso={2.1} />
          <Text style={estilos.ctaTexto}>Buscar viajes</Text>
        </Pressable>

        {/* La línea de confianza. Dice lo que es verdad: sin cédula
            verificada no se publica. Lleva a la pantalla que lo explica. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cómo cuidamos el viaje"
          onPress={() => router.push('/(ayuda)')}
          style={estilos.confianza}
        >
          <Escudo tamano={13} tinta={color.inkIcono} />
          <Text style={estilos.confianzaTexto}>Solo conductores con cédula verificada</Text>
        </Pressable>
      </View>

      {/* La columna que se desplaza: rutas populares y salidas próximas. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {rutas.length > 0 ? (
          <View style={estilos.seccion}>
            <View style={estilos.cabeceraSeccion}>
              <View style={estilos.cabeceraIzquierda}>
                <Estrella tamano={12} tinta={color.ink500} />
                <Text style={estilos.rotuloSeccion}>Rutas populares</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver todos los destinos"
                onPress={() => setBuscando('hacia')}
                style={zonaDeToque}
              >
                <Text style={estilos.enlaceSeccion}>Ver todas</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.tiraFavoritas}
            >
              {rutas.map((r) => (
                <Pressable
                  key={r.slug}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.origen} a ${r.destino}, desde ${formatearDineroRedondo(r.desdeCentavos)}`}
                  onPress={() =>
                    router.push({
                      pathname: '/(pasajero)/resultados',
                      params: { origen: CIUDAD_POR_DEFECTO, destino: r.slug, etiquetaDestino: r.destino },
                    })
                  }
                  style={({ pressed }) => [estilos.tarjetaFavorita, pressed && pulsado.tarjeta]}
                >
                  <View style={estilos.miniatura}>
                    {FOTOS[r.foto] ? (
                      <Image source={FOTOS[r.foto]} style={estilos.foto} resizeMode="cover" />
                    ) : (
                      <DibujoDelSitio slug={r.foto} tamano={36} />
                    )}
                  </View>
                  <View style={estilos.cuerpoFavorita}>
                    <View style={estilos.filaDesde}>
                      <Text style={estilos.desdeFavorita} numberOfLines={1}>
                        {r.origen}
                      </Text>
                      <PuntaDeFlecha tamano={7} />
                    </View>
                    <Text style={estilos.destinoFavorita} numberOfLines={1}>
                      {r.destino}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {salen.length > 0 ? (
          <View style={estilos.seccion}>
            <View style={estilos.cabeceraSeccion}>
              <View style={estilos.cabeceraIzquierda}>
                {/* El punto en vivo: uno de los cuatro sentidos del rojo. */}
                <View style={estilos.puntoVivo} />
                <Text style={estilos.rotuloSeccion}>
                  {`${salen.length} ${salen.length === 1 ? 'salida próxima' : 'salidas próximas'}`}
                </Text>
              </View>
              {rango ? (
                <Text style={[estilos.rangoPrecios, tabular]}>{rango}</Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver todas las salidas de hoy"
                  onPress={() => router.push('/(pasajero)/salidas')}
                  style={zonaDeToque}
                >
                  <Text style={estilos.enlaceSeccion}>Ver todas</Text>
                </Pressable>
              )}
            </View>

            <View style={estilos.listaSalen}>
              {salen.map((v) => (
                <Pressable
                  key={v.viajeId}
                  accessibilityRole="button"
                  accessibilityLabel={`${v.destino} a las ${hora(v.hora)} con ${v.conductor}, ${formatearDineroRedondo(v.aporteCentavos)}`}
                  onPress={() =>
                    router.push({ pathname: '/(pasajero)/viaje', params: { viaje: v.viajeId } })
                  }
                  style={({ pressed }) => [estilos.tarjetaSale, pressed && pulsado.tarjeta]}
                >
                  <Text style={[estilos.horaSale, tabular]}>{hora(v.hora)}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={estilos.filaHaciaSale}>
                      <PuntaDeFlecha tamano={7} />
                      <Text style={estilos.destinoSale} numberOfLines={1}>
                        {v.destino}
                      </Text>
                    </View>
                    <View style={estilos.filaQuienSale}>
                      <Avatar nombre={v.conductor || '·'} tamano={20} />
                      <Text style={estilos.quienSale} numberOfLines={1}>
                        {v.conductor}
                        {v.calificacion != null ? ` · ★ ${v.calificacion.toFixed(1)}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={estilos.pilaPrecioSale}>
                    <View style={estilos.filaPrecioSale}>
                      <Text style={estilos.unidadSale}>B/</Text>
                      <Text style={[estilos.precioSale, tabular]}>{cifraRedonda(v.aporteCentavos)}</Text>
                    </View>
                    <Text
                      style={[
                        estilos.cuposSale,
                        { color: v.puestosLibres <= 2 ? color.rojo800 : color.inkIcono },
                      ]}
                    >
                      {v.puestosLibres === 1 ? '1 cupo' : `${v.puestosLibres} cupos`}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* El gancho del conductor: lo que RECUPERAS — nunca «ganas»— si
            llevas puestos. La otra mitad del producto, dicha una vez. */}
        {gancho ? (
          <View style={estilos.seccion}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Publicar tu viaje"
              onPress={() => router.push('/(conductor)/publicar')}
              style={({ pressed }) => [estilos.tarjetaGancho, pressed && pulsado.tarjeta]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={estilos.filaCifraGancho}>
                  <Text style={estilos.unidadGancho}>B/</Text>
                  <Text style={[estilos.cifraGancho, tabular]}>
                    {cifraRedonda(gancho.recuperasCentavos)}
                  </Text>
                </View>
                <Text style={estilos.fraseGancho}>
                  {'Lo que recuperas si llevas '}
                  {`${enLetra(gancho.puestos)} puestos a ${gancho.destino}`}
                </Text>
              </View>
              <View style={estilos.botonGancho}>
                <Text style={estilos.botonGanchoTexto}>Publicar</Text>
              </View>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Pestanas valor="Buscar" insignias={{ Mensajes: sinLeer > 0 ? sinLeer : undefined }} />

      <BuscadorDeLugar
        abierto={buscando !== null}
        titulo={buscando === 'desde' ? 'Desde dónde sales' : 'A dónde vas'}
        sugerencias={sugerencias}
        alElegir={(d) => {
          if (buscando === 'desde') setDesde(d);
          else setHacia(d);
          setBuscando(null);
        }}
        alCerrar={() => setBuscando(null)}
      />

      <HojaDeEleccion
        abierta={eligiendo === 'cuando'}
        titulo="Cuándo sales"
        opciones={LOS_PROXIMOS_DIAS()}
        elegido={cuando}
        alElegir={setCuando}
        alCerrar={() => setEligiendo(null)}
      />

      <HojaDeEleccion
        abierta={eligiendo === 'pasajeros'}
        titulo="Cuántos van"
        opciones={CUANTOS_PUESTOS}
        elegido={String(pasajeros)}
        alElegir={(v) => setPasajeros(Number(v))}
        alCerrar={() => setEligiendo(null)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  /* ------------------------------------------------------- La cabecera */
  filaMarca: {
    paddingTop: 8,
    paddingLeft: espacio.gutter,
    paddingRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marcaTexto: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.67,
    color: color.ink900,
    fontFamily: familia,
  },
  filaDerecha: { flexDirection: 'row', alignItems: 'center' },
  celdaIcono: {
    width: 44,
    height: 44,
    borderRadius: radio.icono,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** El punto de «hay algo»: rojo con el aro del fondo alrededor. */
  puntoAviso: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.rojo500,
    borderWidth: 2.5,
    borderColor: color.sand100,
  },
  celdaRetrato: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  retrato: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: color.ink100,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retratoTexto: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.24,
    color: color.ink700,
    fontFamily: familia,
  },

  filaTitulo: { paddingTop: 14, paddingHorizontal: espacio.gutter },
  titulo: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.77,
    color: color.ink900,
    fontFamily: familia,
  },
  /** El eco apagado del título, `#8FA6AD` en el archivo. */
  tituloApagado: { color: '#8FA6AD' },

  /* --------------------------------------------- La tarjeta de búsqueda */
  zonaBusqueda: { paddingTop: 16, paddingHorizontal: espacio.gutter },
  tarjetaBusqueda: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.09)',
    borderRadius: radio.l,
    padding: 8,
    ...sombra.busqueda,
  },
  /** El punteado vertical que ata el aro del origen con el pin del destino. */
  conector: {
    position: 'absolute',
    left: 21,
    top: 36,
    height: 32,
    width: 0,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,39,49,.22)',
  },
  filaCampo: {
    height: 52,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  casillaIconoCampo: { width: 16, alignItems: 'center' },
  aroOrigen: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: color.inkIcono,
  },
  pin: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPunto: { width: 4, height: 4, borderRadius: 2, backgroundColor: color.blanco },
  cejaCampo: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },
  /** VOY A va en el acento de texto: es el destino, y el destino es rojo. */
  cejaVoyA: { color: color.rojo700 },
  valorCampo: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },
  divisorCampo: { height: 1, backgroundColor: color.divisor, marginLeft: 42, marginRight: 14 },
  invertir: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: radio.icono,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A2731',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  divisorTarjeta: { height: 1, backgroundColor: color.divisor, marginHorizontal: 8 },
  filaOpciones: { flexDirection: 'row', alignItems: 'center', height: 48 },
  opcion: {
    flex: 1,
    height: 48,
    borderRadius: radio.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  opcionTexto: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
  },
  divisorVertical: { width: 1, height: 20, backgroundColor: 'rgba(10,39,49,.09)' },

  cta: {
    marginTop: 12,
    height: 54,
    borderRadius: radio.boton,
    backgroundColor: color.rojo500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    ...sombra.cta,
  },
  ctaTexto: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.16,
    color: color.blanco,
    fontFamily: familia,
  },

  confianza: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 25,
  },
  confianzaTexto: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    color: color.ink500,
    fontFamily: familia,
  },

  /* ------------------------------------------------------ Las secciones */
  seccion: { paddingTop: 16 },
  cabeceraSeccion: {
    paddingHorizontal: espacio.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cabeceraIzquierda: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rotuloSeccion: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 1.43,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
  },
  enlaceSeccion: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.rojo700,
    fontFamily: familia,
  },
  /** El punto en vivo, con su halo del 14 %. */
  puntoVivo: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.rojo500,
    shadowColor: color.rojo500,
    shadowOpacity: 0.35,
    shadowRadius: 3.5,
    shadowOffset: { width: 0, height: 0 },
  },
  rangoPrecios: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },

  tiraFavoritas: { flexDirection: 'row', gap: 12, paddingHorizontal: espacio.gutter, paddingTop: 10 },
  tarjetaFavorita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.09)',
    borderRadius: radio.control,
    ...sombra.s,
  },
  /** 52, al radio 8: la superficie anidada resta el padding de la madre. */
  miniatura: {
    width: 52,
    height: 52,
    borderRadius: radio.anidado,
    overflow: 'hidden',
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foto: { width: '100%', height: '100%' },
  cuerpoFavorita: { paddingRight: 6 },
  filaDesde: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  desdeFavorita: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: -0.11,
    color: color.ink600,
    fontFamily: familia,
  },
  destinoFavorita: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.48,
    color: color.ink900,
    fontFamily: familia,
  },

  listaSalen: { paddingHorizontal: espacio.gutter, paddingTop: 12, gap: 10 },
  tarjetaSale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
  },
  horaSale: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.57,
    color: color.ink900,
    fontFamily: familia,
  },
  filaHaciaSale: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  destinoSale: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.13,
    color: color.ink900,
    fontFamily: familia,
  },
  filaQuienSale: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  quienSale: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400',
    color: color.ink600,
    fontFamily: familia,
  },
  pilaPrecioSale: { alignItems: 'flex-end', gap: 2 },
  filaPrecioSale: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  unidadSale: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: color.ink600, fontFamily: familia },
  precioSale: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.77,
    color: color.ink900,
    fontFamily: familia,
  },
  cuposSale: { fontSize: 11, lineHeight: 15, fontWeight: '500', fontFamily: familia },

  /* ------------------------------------------------ El gancho de manejar */
  tarjetaGancho: {
    marginHorizontal: espacio.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
  },
  filaCifraGancho: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  unidadGancho: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: color.ink600, fontFamily: familia },
  cifraGancho: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.77,
    color: color.ink900,
    fontFamily: familia,
  },
  fraseGancho: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
    color: color.ink500,
    marginTop: 3,
    fontFamily: familia,
  },
  botonGancho: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: color.ink900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonGanchoTexto: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.13,
    color: color.blanco,
    fontFamily: familia,
  },
});
