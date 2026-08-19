/**
 * El vidrio del traspaso. Una sola capa translúcida, y sólo encima de algo con
 * color: el degradado, una superficie azul o un mapa de noche. Sobre la arena
 * lisa se pone gris y sucio — ahí va una tarjeta normal.
 *
 * Lo que hace que se lea como vidrio es el **canto**, no el desenfoque: un
 * pelo de borde más un brillo interior arriba, encima de una sombra. La
 * saturación del desenfoque es lo que mantiene vivo el color de detrás en vez
 * de volverlo gris.
 *
 * En React Native no existe `backdrop-filter`, así que el desenfoque lo pone
 * `BlurView` y el resto —fondo, canto, brillo, sombra— se compone encima.
 */

import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { BlurView } from 'expo-blur';

import { radio } from './tokens';

export type TonoDeVidrio = 'claro' | 'fuerte' | 'tenue' | 'tinta' | 'azul';

const FONDO: Record<TonoDeVidrio, string> = {
  claro: 'rgba(255,255,255,.58)',
  fuerte: 'rgba(255,255,255,.76)',
  tenue: 'rgba(255,255,255,.34)',
  tinta: 'rgba(38,35,43,.52)',
  azul: 'rgba(0,58,105,.44)',
};

const CANTO: Record<TonoDeVidrio, string> = {
  claro: 'rgba(255,255,255,.55)',
  fuerte: 'rgba(255,255,255,.55)',
  tenue: 'rgba(255,255,255,.55)',
  tinta: 'rgba(255,255,255,.16)',
  azul: 'rgba(255,255,255,.16)',
};

/** El brillo interior de arriba. Es un pelo de luz, no un borde. */
const BRILLO: Record<TonoDeVidrio, string> = {
  claro: 'rgba(255,255,255,.72)',
  fuerte: 'rgba(255,255,255,.72)',
  tenue: 'rgba(255,255,255,.72)',
  tinta: 'rgba(255,255,255,.14)',
  azul: 'rgba(255,255,255,.14)',
};

const INTENSIDAD = { s: 12, m: 22, l: 34 } as const;

type Props = {
  children?: ReactNode;
  tono?: TonoDeVidrio;
  /** `s` 12px, `m` 22px (el de casi todo), `l` 34px. */
  desenfoque?: keyof typeof INTENSIDAD;
  radioEsquina?: number;
  /** La sombra sólo va cuando el vidrio flota; pegado a un borde, no. */
  conSombra?: boolean;
  estilo?: ViewStyle | ViewStyle[];
};

export function Vidrio({
  children,
  tono = 'claro',
  desenfoque = 'm',
  radioEsquina = radio.l,
  conSombra = true,
  estilo,
}: Props) {
  const oscuro = tono === 'tinta' || tono === 'azul';

  return (
    <View
      style={[
        conSombra ? (oscuro ? estilos.sombraOscura : estilos.sombra) : null,
        { borderRadius: radioEsquina },
        estilo,
      ]}
    >
      <View style={[estilos.recorte, { borderRadius: radioEsquina }]}>
        <BlurView
          intensity={INTENSIDAD[desenfoque]}
          tint={oscuro ? 'dark' : 'light'}
          style={estilos.desenfoque}
        />
        <View
          style={[
            estilos.capa,
            {
              backgroundColor: FONDO[tono],
              borderColor: CANTO[tono],
              borderRadius: radioEsquina,
            },
          ]}
        >
          {/* El brillo de arriba: en el traspaso es un `inset 0 1px 0`, que en
              React Native no existe. Se dibuja como una línea de un píxel. */}
          <View style={[estilos.brillo, { backgroundColor: BRILLO[tono] }]} />
          {children}
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  recorte: { overflow: 'hidden' },
  desenfoque: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  capa: { borderWidth: 1 },
  brillo: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  sombra: {
    shadowColor: 'rgb(0,39,65)',
    shadowOpacity: 0.26,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 32px -10px rgba(0,39,65,.26), 0 2px 8px -4px rgba(0,39,65,.14)' }
      : null),
  } as ViewStyle,
  sombraOscura: {
    shadowColor: '#000',
    shadowOpacity: 0.34,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 20 },
    elevation: 10,
  },
});
