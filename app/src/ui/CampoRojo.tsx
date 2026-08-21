/**
 * EL FONDO DE PANTALLA v6 — antes, el campo rojo héroe.
 *
 * El arquetipo anterior abría cada pantalla con una banda roja de bandera.
 * **El usuario lo rechazó** («the red cut at 1/4 on top screen — delete it»),
 * y el v6 no tiene superficie roja en ninguna parte: toda pantalla abre sobre
 * el lienzo `#F4F7F8` con dos halos radiales tenues como única atmósfera —
 * sarcelle arriba a la izquierda, un rubor del acento arriba a la derecha —
 * exactamente los dos círculos del `Partimos App v6.dc.html`.
 *
 * El componente conserva su nombre y sus props porque una veintena de
 * pantallas lo montan; así todas pierden la banda roja a la vez y ninguna se
 * rompe. `altura` hoy solo limita hasta dónde bajan los halos.
 *
 * **Dónde se coloca.** Igual que siempre: se pinta en absoluto sobre su
 * padre, y en una pantalla que se desplaza va DENTRO del `ScrollView` —
 * `Bandera` hace justo eso.
 */

import { type ReactNode, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import Hibisco from '../../assets/motivos/pa-hibisco.svg';
import MapaPa from '../../assets/motivos/pa-mapa.svg';
import Palmera from '../../assets/motivos/pa-palmera.svg';
import Skyline from '../../assets/motivos/pa-skyline.svg';
import SkylineTornillo from '../../assets/motivos/pa-skyline-tornillo.svg';
import { ambiente, espacio } from './tokens';

/**
 * Los motivos del sitio. Sobre el lienzo claro van en tinta sarcelle muy
 * atenuada — son textura, no dibujo, y la textura se recorta contra el borde
 * sin que nadie lo note.
 */
const MOTIVOS = {
  palmera: { svg: Palmera, ancho: 170, alto: 170, sitio: { right: -18, bottom: -10 }, opacidad: 0.1 },
  hibisco: { svg: Hibisco, ancho: 158, alto: 158, sitio: { right: -36, top: -28 }, opacidad: 0.1 },
  mapa: { svg: MapaPa, ancho: 180, alto: 180, sitio: { right: -20, bottom: -16 }, opacidad: 0.1 },
  skyline: { svg: Skyline, ancho: espacio.marco, alto: 196, sitio: { left: 0, right: 0, bottom: 0 }, opacidad: 0.1 },
  tornillo: { svg: SkylineTornillo, ancho: espacio.marco, alto: 135, sitio: { left: 0, right: 0, bottom: 0 }, opacidad: 0.14 },
  ciudadDetras: {
    svg: SkylineTornillo,
    ancho: espacio.marco,
    alto: 132,
    sitio: { left: 0, right: 0, bottom: 0 },
    opacidad: 0.1,
  },
} as const;

export type Motivo = keyof typeof MOTIVOS;

/**
 * QUÉ DIBUJO LE TOCA A CADA SITIO. El reparto es por lo que hay en el sitio,
 * no por gusto: la torre para la capital, la palmera para la costa, el
 * hibisco para Azuero —es su flor— y el mapa del país para tierra adentro.
 */
const MOTIVO_DE: Record<string, Motivo> = {
  'panama-city': 'tornillo',
  colon: 'skyline',
  arraijan: 'skyline',
  'la-chorrera': 'skyline',
  capira: 'skyline',
  chepo: 'skyline',

  coronado: 'palmera',
  'san-carlos': 'palmera',
  chame: 'palmera',
  'rio-hato': 'palmera',
  pedasi: 'palmera',
  'las-tablas': 'palmera',
  guarare: 'palmera',
  'las-lajas': 'palmera',
  almirante: 'palmera',
  changuinola: 'palmera',

  chitre: 'hibisco',
  parita: 'hibisco',
  'los-santos': 'hibisco',
  santiago: 'hibisco',
  sona: 'hibisco',
  aguadulce: 'hibisco',
  penonome: 'hibisco',
  nata: 'hibisco',
  anton: 'hibisco',

  david: 'mapa',
  boquete: 'mapa',
  volcan: 'mapa',
  'el-valle': 'mapa',
  'la-concepcion': 'mapa',
  'paso-canoas': 'mapa',
  tole: 'mapa',
};

/** El del sitio, o el mapa del país cuando no le hemos puesto ninguno. */
export function motivoDe(slug: string | null | undefined): Motivo {
  return (slug && MOTIVO_DE[slug]) || 'mapa';
}

/**
 * EL DIBUJO DEL SITIO, SUELTO, PARA UNA CASILLA CUADRADA. Las rutas populares
 * enseñan una fotografía del destino y solo hay cuatro fotografías: para el
 * resto, el dibujo del sitio hace de retrato. La silueta de ciudad no cabe en
 * un cuadrado, así que en este tamaño la capital usa el mapa del país.
 */
export function DibujoDelSitio({
  slug,
  tamano = 44,
  opacidad = 0.28,
}: {
  slug: string | null | undefined;
  tamano?: number;
  /** Los trazos no traen relleno propio, así que salen negros: se atenúan. */
  opacidad?: number;
}) {
  const cual = motivoDe(slug);
  const cuadrado: Motivo = cual === 'skyline' || cual === 'tornillo' ? 'mapa' : cual;
  const Dibujo = MOTIVOS[cuadrado].svg;
  return (
    <View style={{ opacity: opacidad }} pointerEvents="none">
      <Dibujo width={tamano} height={tamano} />
    </View>
  );
}

type Props = {
  /** Hasta dónde baja la atmósfera. Ya no es una banda de color: solo aire. */
  altura?: number;
  ancho?: number;
  /** Marca de agua del sitio, en tinta sarcelle al 10 %. */
  motivo?: Motivo;
  children?: ReactNode;
};

/** La altura por defecto de la atmósfera en una pantalla secundaria. */
const ALTURA_SECUNDARIA = 240;

export function CampoRojo({
  altura = ALTURA_SECUNDARIA,
  /* El ancho del marco y no 390: en un iPhone de 430 los halos terminaban
     antes que la pantalla. */
  ancho = espacio.marco,
  motivo,
  children,
}: Props) {
  const m = motivo ? MOTIVOS[motivo] : null;
  // Los ids de degradado son globales en el DOM: uno por instancia.
  const id = useId().replace(/:/g, '');

  /*
   * Los dos halos del v6, convertidos de CSS a elipses:
   * sarcelle — círculo de 440×400 en top:-160 left:-100, rgba(38,120,140,.16)
   * rubor — círculo de 320×320 en top:-70 right:-130, rgba(225,33,59,.10)
   * Ambos se apagan al 70 % del radio.
   */
  return (
    <View
      /* Es un fondo: sin `pointerEvents="none"` se comería los toques. */
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { height: altura, overflow: 'hidden' }]}
    >
      <Svg width={ancho} height={altura} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`halo-sarcelle-${id}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={ambiente.sarcelle} />
            <Stop offset="0.7" stopColor="rgba(38,120,140,0)" />
          </RadialGradient>
          <RadialGradient id={`halo-rubor-${id}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={ambiente.rojo} />
            <Stop offset="0.7" stopColor="rgba(225,33,59,0)" />
          </RadialGradient>
        </Defs>

        <Ellipse cx={-100 + 220} cy={-160 + 200} rx={220} ry={200} fill={`url(#halo-sarcelle-${id})`} />
        <Ellipse cx={ancho + 130 - 160} cy={-70 + 160} rx={160} ry={160} fill={`url(#halo-rubor-${id})`} />
      </Svg>

      {m ? (
        <View style={[{ position: 'absolute', opacity: m.opacidad }, m.sitio]} pointerEvents="none">
          <m.svg width={m.ancho} height={m.alto} color="#0A2731" />
        </View>
      ) : null}

      {children}
    </View>
  );
}

/**
 * `--grad-sunrise`: azul frío en una esquina, rosa cálido en la contraria y
 * luz de arena en medio. Lo usan las tarjetas de destino sin fotografía.
 */
export function Amanecer({ ancho = 346, alto = 260 }: { ancho?: number; alto?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg width={ancho} height={alto} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={`amanecer-base-${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#F2F8FC" />
          <Stop offset="1" stopColor="#FFF8F2" />
        </LinearGradient>
        <RadialGradient id={`amanecer-azul-${id}`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#8CBEDD" stopOpacity="1" />
          <Stop offset="0.62" stopColor="#8CBEDD" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={`amanecer-rosa-${id}`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#F2A0AC" stopOpacity="1" />
          <Stop offset="0.66" stopColor="#F2A0AC" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={`amanecer-arena-${id}`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFDCC0" stopOpacity="1" />
          <Stop offset="0.72" stopColor="#FFDCC0" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={ancho} height={alto} fill={`url(#amanecer-base-${id})`} />
      <Ellipse cx={0.14 * ancho} cy={0.1 * alto} rx={0.58 * ancho} ry={0.66 * alto} fill={`url(#amanecer-azul-${id})`} />
      <Ellipse cx={0.86 * ancho} cy={0.86 * alto} rx={0.62 * ancho} ry={0.7 * alto} fill={`url(#amanecer-rosa-${id})`} />
      <Ellipse cx={0.52 * ancho} cy={0.52 * alto} rx={0.74 * ancho} ry={0.62 * alto} fill={`url(#amanecer-arena-${id})`} />
    </Svg>
  );
}

/**
 * El brillo cálido que cierra la tarjeta del aporte en `5c` y `7b`. Sobre
 * blanco sigue funcionando: sube desde debajo del borde, la tarjeta recorta.
 */
export function Brillo({ ancho = 346, alto = 190 }: { ancho?: number; alto?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg width={ancho} height={alto} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={`brillo-${id}`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#E1213B" stopOpacity="0.30" />
          <Stop offset="0.4" stopColor="#E0A83C" stopOpacity="0.24" />
          <Stop offset="0.74" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse
        cx={0.46 * ancho}
        cy={1.22 * alto}
        rx={1.2 * ancho}
        ry={0.96 * alto}
        fill={`url(#brillo-${id})`}
      />
    </Svg>
  );
}

/**
 * EL ARQUETIPO ENTERO: la atmósfera con lo que va encima. Envolver aquí la
 * cabecera con su fondo hace que las dos se muevan juntas al desplazar.
 */
export function Bandera({
  altura = ALTURA_SECUNDARIA,
  motivo,
  children,
}: {
  altura?: number;
  motivo?: Motivo;
  children?: ReactNode;
}) {
  return (
    <View style={{ position: 'relative' }}>
      <CampoRojo altura={altura} motivo={motivo} />
      {children}
    </View>
  );
}
