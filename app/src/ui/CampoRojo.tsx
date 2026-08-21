/**
 * El campo rojo — el arquetipo de pantalla.
 *
 * Tres capas, exactamente como el CSS del traspaso: luz cálida arriba a la
 * derecha, sombra profunda abajo a la izquierda, y el degradado de bandera.
 * Una por pantalla, y nada debajo del subtítulo se sienta encima.
 *
 * **Dónde se coloca.** Se pinta en absoluto sobre su padre, así que el padre
 * decide si el campo se queda quieto o se va con el desplazamiento. En una
 * pantalla que se desplaza tiene que ir DENTRO del `ScrollView`, envuelto con
 * la cabecera y la hoja: puesto fuera se queda clavado y el contenido de más
 * abajo le pasa por encima —«RUTAS POPULARES» sobre el rojo, medido en el
 * teléfono—. `Bandera` de abajo hace justo eso y es lo que hay que usar.
 */

import { type ReactNode, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import Hibisco from '../../assets/motivos/pa-hibisco.svg';
import MapaPa from '../../assets/motivos/pa-mapa.svg';
import Palmera from '../../assets/motivos/pa-palmera.svg';
import Skyline from '../../assets/motivos/pa-skyline.svg';
import SkylineTornillo from '../../assets/motivos/pa-skyline-tornillo.svg';
import { campoRojo, espacio } from './tokens';

/**
 * Los motivos que se recortan contra el borde del campo, en tinta oscura al
 * 20–26 %. Nunca sobre texto: cada uno trae su sitio.
 */
const MOTIVOS = {
  palmera: { svg: Palmera, ancho: 170, alto: 170, sitio: { right: -18, bottom: -10 }, opacidad: 0.2 },
  hibisco: { svg: Hibisco, ancho: 158, alto: 158, sitio: { right: -36, top: -28 }, opacidad: 0.2 },
  mapa: { svg: MapaPa, ancho: 180, alto: 180, sitio: { right: -20, bottom: -16 }, opacidad: 0.2 },
  // la ciudad va al pie, de lado a lado, como una línea de horizonte
  skyline: { svg: Skyline, ancho: espacio.marco, alto: 196, sitio: { left: 0, right: 0, bottom: 0 }, opacidad: 0.26 },
  /**
   * La silueta con la torre Tornillo, la que trajo el cliente. En `4a` no es
   * marca de agua sino la línea de horizonte de la pantalla entera: va al pie,
   * a plena opacidad, con sus tres capas de profundidad ya dentro del propio
   * archivo.
   */
  tornillo: { svg: SkylineTornillo, ancho: espacio.marco, alto: 135, sitio: { left: 0, right: 0, bottom: 0 }, opacidad: 1 },
  /**
   * La misma ciudad, levantada del suelo.
   *
   * En el inicio la hoja de búsqueda monta sobre el borde del campo, así que
   * una línea de horizonte pegada abajo queda tapada entera y solo asoman dos
   * franjas de veintidós píxeles a los lados. Subida treinta, las torres caen
   * en la banda vacía que hay entre el titular y la hoja, y la hoja se apoya
   * en la ciudad en vez de taparla.
   */
  /**
   * La ciudad AL LADO DEL TITULAR, no debajo de la hoja.
   *
   * Al pie del campo quedaba tapada entera por la hoja de búsqueda: solo
   * asomaban dos franjas de veintidós píxeles a los lados, y eso es lo que se
   * veía torcido. Arriba a la derecha cae en la banda que el titular deja
   * libre —el titular es corto y va a la izquierda—, se ve completa y se
   * recorta contra el borde del campo, que es lo que el sistema pide de un
   * motivo.
   */
  /**
   * La ciudad como marca de agua del inicio, y no como objeto.
   *
   * Se probaron los dos sitios y los dos estaban mal. Al pie del campo la
   * tapaba entera la hoja de búsqueda. Al lado del titular —258 de ancho,
   * anclada a la derecha— se cortaba contra el borde del campo y chocaba con
   * la segunda línea del titular: se leía como un manchón, no como una
   * ciudad. El fallo no era el sitio: era la **opacidad**. A 0,92 es un
   * dibujo, y un dibujo tiene que caber entero o no estar; a 0,2 es textura,
   * y la textura se recorta contra el borde sin que nadie lo note, que es
   * justo lo que el sistema pide de un motivo.
   *
   * Así que va de lado a lado, al pie, al 20 %: la línea de horizonte detrás
   * de todo, con la hoja de búsqueda apoyada encima.
   */
  ciudadDetras: {
    svg: SkylineTornillo,
    ancho: espacio.marco,
    alto: 132,
    sitio: { left: 0, right: 0, bottom: 0 },
    opacidad: 0.2,
  },
} as const;

export type Motivo = keyof typeof MOTIVOS;

/**
 * QUÉ DIBUJO LE TOCA A CADA SITIO.
 *
 * Las pantallas de una ruta llevaban el campo rojo liso, y liso el campo es
 * una franja de color sin nada que mirar. Los cinco motivos del traspaso ya
 * estaban en `assets/motivos`: lo que faltaba era decidir cuál va con qué.
 *
 * El reparto es por lo que hay en el sitio, no por gusto: la torre para la
 * capital, la palmera para la costa, el hibisco para Azuero —es su flor— y el
 * mapa del país para lo que queda, que es tierra adentro.
 */
const MOTIVO_DE: Record<string, Motivo> = {
  // la capital y su cinturón: silueta de ciudad
  'panama-city': 'tornillo',
  colon: 'skyline',
  arraijan: 'skyline',
  'la-chorrera': 'skyline',
  capira: 'skyline',
  chepo: 'skyline',

  // costa y playa: palmera
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

  // Azuero y el interior de tierra llana: el hibisco, que es su flor
  chitre: 'hibisco',
  parita: 'hibisco',
  'los-santos': 'hibisco',
  santiago: 'hibisco',
  sona: 'hibisco',
  aguadulce: 'hibisco',
  penonome: 'hibisco',
  nata: 'hibisco',
  anton: 'hibisco',

  // tierras altas y frontera: el mapa del país, que es el que queda por
  // defecto, escrito aquí para que se vea que es una decisión y no un hueco
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
 * EL DIBUJO DEL SITIO, SUELTO, PARA UNA CASILLA CUADRADA.
 *
 * Las rutas populares enseñan una fotografía del destino, y solo hay cuatro
 * fotografías: las demás caían en un pin gris igual para todas, que no dice
 * nada de a dónde vas. Aquí el dibujo del sitio hace de retrato.
 *
 * La silueta de ciudad no cabe en un cuadrado —es una línea de horizonte de
 * lado a lado—, así que en este tamaño la capital y su cinturón usan el mapa
 * del país, como el resto del interior.
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
  /** 326 en una pantalla de inicio, 186–214 en una secundaria. */
  altura?: number;
  ancho?: number;
  /** Marca de agua en tinta oscura al 20 %, cortada por el borde. */
  motivo?: Motivo;
  children?: ReactNode;
};

export function CampoRojo({
  altura = campoRojo.alturaSecundaria,
  /* El ancho del marco y no 390: en un iPhone de 430 el degradado terminaba
     antes que la pantalla y quedaba una franja clara pegada al borde. */
  ancho = espacio.marco,
  motivo,
  children,
}: Props) {
  const m = motivo ? MOTIVOS[motivo] : null;
  // Los ids de degradado son globales en el DOM: si dos campos coinciden en la
  // transición entre pantallas, el segundo se queda sin relleno cuando el
  // primero se desmonta. Uno por instancia.
  const id = useId().replace(/:/g, '');
  return (
    <View
      /* `pointerEvents="none"` porque es un fondo: sin esto, en las pantallas
         donde el campo cubre un control, el campo se come el toque. */
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { height: altura, overflow: 'hidden' }]}
    >
      <Svg width={ancho} height={altura} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* linear-gradient(166deg, #E83950 0%, #E1213B 44%, #A6122A 100%) */}
          <LinearGradient id={`bandera-${id}`} x1="0.434" y1="0" x2="0.566" y2="1">
            <Stop offset="0" stopColor={campoRojo.de} />
            <Stop offset="0.44" stopColor={campoRojo.medio} />
            <Stop offset="1" stopColor={campoRojo.a} />
          </LinearGradient>

          {/* radial 86% 60% at 88% 0% — la luz */}
          <RadialGradient id={`luz-${id}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#FFD8BC" stopOpacity="0.34" />
            <Stop offset="0.62" stopColor="#FFD8BC" stopOpacity="0" />
          </RadialGradient>

          {/* radial 96% 76% at 2% 100% — la sombra */}
          <RadialGradient id={`sombra-${id}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#8F1024" stopOpacity="0.62" />
            <Stop offset="0.7" stopColor="#8F1024" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width={ancho} height={altura} fill={`url(#bandera-${id})`} />
        <Ellipse
          cx={0.88 * ancho}
          cy={0}
          rx={0.86 * ancho}
          ry={0.6 * altura}
          fill={`url(#luz-${id})`}
        />
        <Ellipse
          cx={0.02 * ancho}
          cy={altura}
          rx={0.96 * ancho}
          ry={0.76 * altura}
          fill={`url(#sombra-${id})`}
        />
      </Svg>

      {m ? (
        <View style={[{ position: 'absolute', opacity: m.opacidad }, m.sitio]} pointerEvents="none">
          <m.svg width={m.ancho} height={m.alto} color="#1C0A10" />
        </View>
      ) : null}

      {children}
    </View>
  );
}

/**
 * `--grad-sunrise`: azul frío en una esquina, rosa cálido en la contraria y luz
 * de arena en medio. El blanco del centro es lo que impide que vire a morado.
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
 * El brillo cálido que cierra la tarjeta del aporte en `5c` y `7b`:
 * `radial-gradient(120% 96% at 46% 122%, rojo .30, oro .24 al 40 %, nada al 74 %)`.
 * Sube desde debajo del borde, así que la tarjeta necesita recortar.
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
 * EL ARQUETIPO ENTERO: el campo rojo con lo que va encima de él.
 *
 * Existe porque colocar el campo bien es una decisión que se estaba tomando
 * cuarenta y ocho veces, y una de ellas mal. Envolver aquí la cabecera con su
 * fondo hace que las dos se muevan juntas, que es lo único que hace falta
 * para que nada de más abajo termine escrito sobre el rojo.
 *
 * La hoja blanca puede seguir desbordando por abajo —es el arquetipo, «la
 * hoja monta sobre el borde del campo»—: lo que se mueve es el bloque entero.
 */
export function Bandera({
  altura = campoRojo.alturaSecundaria,
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
