/**
 * El campo rojo — el arquetipo de pantalla.
 *
 * Tres capas, exactamente como el CSS del traspaso: luz cálida arriba a la
 * derecha, sombra profunda abajo a la izquierda, y el degradado de bandera.
 * Una por pantalla, y nada debajo del subtítulo se sienta encima.
 */

import { type ReactNode, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import Hibisco from '../../assets/motivos/pa-hibisco.svg';
import MapaPa from '../../assets/motivos/pa-mapa.svg';
import Palmera from '../../assets/motivos/pa-palmera.svg';
import Skyline from '../../assets/motivos/pa-skyline.svg';
import SkylineTornillo from '../../assets/motivos/pa-skyline-tornillo.svg';
import { campoRojo } from './tokens';

/**
 * Los motivos que se recortan contra el borde del campo, en tinta oscura al
 * 20–26 %. Nunca sobre texto: cada uno trae su sitio.
 */
const MOTIVOS = {
  palmera: { svg: Palmera, ancho: 170, alto: 170, sitio: { right: -18, bottom: -10 }, opacidad: 0.2 },
  hibisco: { svg: Hibisco, ancho: 158, alto: 158, sitio: { right: -36, top: -28 }, opacidad: 0.2 },
  mapa: { svg: MapaPa, ancho: 180, alto: 180, sitio: { right: -20, bottom: -16 }, opacidad: 0.2 },
  // la ciudad va al pie, de lado a lado, como una línea de horizonte
  skyline: { svg: Skyline, ancho: 390, alto: 196, sitio: { left: 0, right: 0, bottom: 0 }, opacidad: 0.26 },
  /**
   * La silueta con la torre Tornillo, la que trajo el cliente. En `4a` no es
   * marca de agua sino la línea de horizonte de la pantalla entera: va al pie,
   * a plena opacidad, con sus tres capas de profundidad ya dentro del propio
   * archivo.
   */
  tornillo: { svg: SkylineTornillo, ancho: 390, alto: 120, sitio: { left: 0, right: 0, bottom: 0 }, opacidad: 1 },
} as const;

type Props = {
  /** 326 en una pantalla de inicio, 186–214 en una secundaria. */
  altura?: number;
  ancho?: number;
  /** Marca de agua en tinta oscura al 20 %, cortada por el borde. */
  motivo?: keyof typeof MOTIVOS;
  children?: ReactNode;
};

export function CampoRojo({
  altura = campoRojo.alturaSecundaria,
  ancho = 390,
  motivo,
  children,
}: Props) {
  const m = motivo ? MOTIVOS[motivo] : null;
  // Los ids de degradado son globales en el DOM: si dos campos coinciden en la
  // transición entre pantallas, el segundo se queda sin relleno cuando el
  // primero se desmonta. Uno por instancia.
  const id = useId().replace(/:/g, '');
  return (
    <View style={[StyleSheet.absoluteFill, { height: altura, overflow: 'hidden' }]}>
      <Svg width={ancho} height={altura} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* linear-gradient(166deg, #DD1D3F 0%, #D21034 44%, #AF0B29 100%) */}
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
            <Stop offset="0" stopColor="#5E0717" stopOpacity="0.62" />
            <Stop offset="0.7" stopColor="#5E0717" stopOpacity="0" />
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
          <Stop offset="0" stopColor="#D21034" stopOpacity="0.30" />
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
