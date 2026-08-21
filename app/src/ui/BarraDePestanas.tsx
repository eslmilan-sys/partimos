/**
 * La barra de abajo.
 *
 * **Por qué es oscura.** `diseno/SISTEMA.md` reparte los dos colores de la
 * bandera por oficio: el azul manda en las superficies —«en-têtes, champs
 * héros, **barres**, chrome sombre»— y el rojo manda en la interacción. Una
 * barra blanca con las pestañas en rojo tenía las dos cosas al revés: la
 * superficie no era azul y el rojo se gastaba en cuatro rótulos que están ahí
 * siempre. Ahora la superficie es azul profundo y el rojo aparece **solo donde
 * estás**, que es lo único de la barra que cambia.
 *
 * **Las tres capas de lo activo**, y ninguna es adorno:
 *
 *   · el **remate rojo** de tres píxeles en el borde de arriba dice cuál es,
 *     desde lejos y sin leer;
 *   · el **cono de luz** que cae de él ata el remate con el icono, para que no
 *     se lean como dos cosas sueltas;
 *   · el **halo** detrás del icono lo despega del fondo.
 *
 * Se apoyan las tres en lo mismo y por eso se puede quitar cualquiera sin que
 * la barra deje de funcionar; juntas es lo que le da cara.
 *
 * **El icono activo se queda blanco, no rojo.** Medido: `rojo400` sobre
 * `azul800` da 3,89:1 — suficiente para un dibujo, corto para un rótulo de
 * diez píxeles. El rojo hace de indicador, que es lo que no tiene que leerse
 * letra a letra; el rótulo se queda en blanco, que da 15,4:1.
 *
 * **Publicar está siempre.** Antes solo salía en las pantallas de búsqueda, y
 * ofrecer un viaje es la mitad del producto: si no está en la barra, no
 * existe.
 */

import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { color, familia, radio, vidrio } from './tokens';

export type Pestana = { valor: string; etiqueta: string; icono: (activo: boolean) => ReactNode };

type Props = {
  pestanas: Pestana[];
  valor: string;
  alCambiar?: (v: string) => void;
  /** El círculo rojo de publicar, en medio. */
  fab?: { etiqueta: string; icono: ReactNode; activo?: boolean; alPulsar?: () => void };
};

/** El ancho de una ranura. Cinco caben en 358 —390 menos los dos 16 del marco—. */
const RANURA = 64;
const ALTO = 66;

/* --------------------------------------------------------------- El cono */

/**
 * El haz que baja del remate. Un trapecio que se abre y se apaga: arriba mide
 * lo que el remate y llega al 22 %, abajo mide el doble y no queda nada.
 */
function Cono() {
  return (
    <Svg width={RANURA} height={ALTO} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="haz" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color.rojo400} stopOpacity="0.26" />
          <Stop offset="0.55" stopColor={color.rojo400} stopOpacity="0.09" />
          <Stop offset="1" stopColor={color.rojo400} stopOpacity="0" />
        </LinearGradient>
        <RadialGradient id="halo" cx="50%" cy="42%" r="52%">
          <Stop offset="0" stopColor={color.rojo400} stopOpacity="0.4" />
          <Stop offset="0.55" stopColor={color.rojo400} stopOpacity="0.13" />
          <Stop offset="1" stopColor={color.rojo400} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Path
        d={`M${RANURA / 2 - 15} 0 H${RANURA / 2 + 15} L${RANURA - 4} ${ALTO} H4 Z`}
        fill="url(#haz)"
      />
      <Rect x="0" y="0" width={RANURA} height={ALTO} fill="url(#halo)" />
    </Svg>
  );
}

/* ------------------------------------------------------------- La barra */

export function BarraDePestanas({ pestanas, valor, alCambiar, fab }: Props) {
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
        style={estilos.ranura}
      >
        {activo ? (
          <>
            <Cono />
            <View style={estilos.remate} />
          </>
        ) : null}
        <View style={estilos.icono}>{p.icono(activo)}</View>
        <Text style={[estilos.etiqueta, activo && estilos.etiquetaActiva]} numberOfLines={1}>
          {p.etiqueta}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={estilos.barra}>
      {/* El brillo del borde de arriba: una sola línea clara que separa la
          pastilla del fondo sin dibujarle un marco. */}
      <View style={estilos.filoSuperior} pointerEvents="none" />

      {pestanas.slice(0, medio).map(pestana)}

      {fab ? (
        <Pressable
          key="fab"
          accessibilityRole="button"
          accessibilityLabel={fab.etiqueta}
          accessibilityState={{ selected: !!fab.activo }}
          onPress={fab.alPulsar}
          style={estilos.ranura}
        >
          {fab.activo ? (
            <>
              <Cono />
              <View style={estilos.remate} />
            </>
          ) : null}
          <View style={[estilos.circulo, fab.activo && estilos.circuloActivo]}>{fab.icono}</View>
          <Text style={[estilos.etiqueta, fab.activo && estilos.etiquetaActiva]}>Publicar</Text>
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
    height: ALTO,
    paddingHorizontal: 4,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,39,65,.94)',
    shadowColor: '#14141A',
    shadowOpacity: 0.34,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    ...(vidrio ?? {}),
  },
  filoSuperior: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,.14)',
  },

  ranura: {
    width: RANURA,
    height: ALTO,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    overflow: 'hidden',
  },
  /* Tres píxeles pegados al filo, del ancho de un pulgar. Es la única cosa
     roja de la barra y por eso se ve antes que nada. */
  remate: {
    position: 'absolute',
    top: 0,
    width: 30,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: color.rojo400,
  },
  icono: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  etiqueta: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    letterSpacing: -0.05,
    color: 'rgba(255,255,255,.62)',
    fontFamily: familia,
  },
  etiquetaActiva: { fontWeight: '700', color: '#fff' },

  circulo: {
    width: 34,
    height: 34,
    marginTop: -4,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgb(210,16,52)',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  circuloActivo: { backgroundColor: color.rojo400 },
});
