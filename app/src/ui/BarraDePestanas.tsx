/**
 * La barra de pestañas, en pastilla y sobre la página — nunca una barra negra
 * pegada al borde. El FAB de publicar es el cuadrado rojo del motivo de bandera.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { familia, color, radio } from './tokens';

export type Pestana = { valor: string; etiqueta: string; icono: (activo: boolean) => ReactNode };

type Props = {
  pestanas: Pestana[];
  valor: string;
  alCambiar?: (v: string) => void;
  /** El cuadrado rojo que se mete en medio de la barra. */
  fab?: { etiqueta: string; icono: ReactNode; alPulsar?: () => void };
};

export function BarraDePestanas({ pestanas, valor, alCambiar, fab }: Props) {
  // El FAB es un hermano más de la barra, no un añadido pegado a una pestaña:
  // si va dentro de otra caja, el reparto `space-between` cuenta cuatro cosas
  // en vez de cinco y las pestañas del medio se separan de más.
  const medio = Math.ceil(pestanas.length / 2);

  const pestana = (p: Pestana) => {
    const activo = p.valor === valor;
    return (
      <Pressable
        key={p.valor}
        accessibilityRole="tab"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={p.etiqueta}
        onPress={() => alCambiar?.(p.valor)}
        style={estilos.pestana}
      >
        <View style={estilos.icono}>{p.icono(activo)}</View>
        <Text
          style={[
            estilos.etiqueta,
            { fontWeight: activo ? '600' : '500', color: activo ? color.rojo600 : color.ink700 },
          ]}
        >
          {p.etiqueta}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={estilos.barra}>
      {pestanas.slice(0, medio).map(pestana)}
      {fab ? (
        <Pressable
          key="fab"
          accessibilityRole="button"
          accessibilityLabel={fab.etiqueta}
          onPress={fab.alPulsar}
          style={estilos.fab}
        >
          {fab.icono}
        </Pressable>
      ) : null}
      {pestanas.slice(medio).map(pestana)}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 72,
    paddingHorizontal: 8,
    borderRadius: radio.pastilla,
    backgroundColor: 'rgba(255,255,255,.86)',
    borderWidth: 1,
    borderColor: color.bordeSutil,
    shadowColor: '#26232B',
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  pestana: { alignItems: 'center', gap: 4, paddingHorizontal: 12, minWidth: 52 },
  icono: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  etiqueta: { fontSize: 10.5, lineHeight: 15.22, letterSpacing: -0.05, fontFamily: familia },
  fab: {
    width: 46,
    height: 46,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgb(210,16,52)',
    shadowOpacity: 0.42,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
