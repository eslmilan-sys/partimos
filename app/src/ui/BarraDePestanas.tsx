/**
 * La barra de abajo, tal como la dibuja el v6.
 *
 * **Ya no es una pastilla oscura flotante.** El v6 la asienta de lado a lado:
 * blanco al 94 % con un borde superior de tinta al 8 %, cinco casillas de
 * 64 × 52, y debajo la banda del indicador de inicio (34 px con la píldora de
 * 139 × 5). La pestaña activa se distingue por tres cosas a la vez — icono en
 * rojo con trazo 2.2, rótulo en `#C11730`, peso 500 contra 400 — y las
 * inactivas van en el gris de icono `#6C8A93`.
 *
 * **Publicar es la casilla del centro, levantada.** Un cuadrado de 48 con
 * radio 17, degradado 160° `#123F4D → #0A2731`, subido 20 px sobre el borde,
 * con su rótulo debajo como una casilla más. Es la única superficie oscura de
 * la pantalla, y por eso se ve antes que nada.
 *
 * Una casilla puede llevar **insignia**: el círculo rojo con borde blanco y
 * la cuenta en 10/600 — «Viajes · 2» en el dibujo.
 */

import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { color, familia, pulsado, sombra, vidrio } from './tokens';

export type Pestana = {
  valor: string;
  etiqueta: string;
  icono: (activo: boolean) => ReactNode;
  /** La cuenta de la insignia roja; nada si es 0 o no viene. */
  insignia?: number;
};

type Props = {
  pestanas: Pestana[];
  valor: string;
  alCambiar?: (v: string) => void;
  /** El cuadrado oscuro de publicar, en medio, levantado sobre el borde. */
  fab?: { etiqueta: string; icono: ReactNode; activo?: boolean; alPulsar?: () => void };
};

/** El ancho de una casilla y el alto de la fila de casillas, del v6. */
const CASILLA = 64;
const ALTO = 52;

export function BarraDePestanas({ pestanas, valor, alCambiar, fab }: Props) {
  const medio = Math.ceil(pestanas.length / 2);
  const { width } = useWindowDimensions();
  /* La banda del indicador solo tiene sentido en el marco de escritorio: en
     el teléfono el sistema ya pone la suya y salían dos, una sobre otra. */
  const conIndicador = Platform.OS === 'web' && width >= 480;

  const pestana = (p: Pestana) => {
    const activo = p.valor === valor;
    return (
      <Pressable
        key={p.valor}
        accessibilityRole="tab"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={p.insignia ? `${p.etiqueta}, ${p.insignia} sin ver` : p.etiqueta}
        onPress={() => alCambiar?.(p.valor)}
        style={estilos.casilla}
      >
        <View style={estilos.icono}>
          {p.icono(activo)}
          {p.insignia ? (
            <View style={estilos.insignia} pointerEvents="none">
              <Text style={estilos.insigniaTexto}>{p.insignia > 9 ? '9+' : p.insignia}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[estilos.etiqueta, activo && estilos.etiquetaActiva]} numberOfLines={1}>
          {p.etiqueta}
        </Text>
      </Pressable>
    );
  };

  return (
    <View>
      <View style={estilos.barra}>
        {pestanas.slice(0, medio).map(pestana)}

        {fab ? (
          <Pressable
            key="fab"
            accessibilityRole="button"
            accessibilityLabel={fab.etiqueta}
            accessibilityState={{ selected: !!fab.activo }}
            onPress={fab.alPulsar}
            style={estilos.casillaPublicar}
          >
            {({ pressed }) => (
              <>
                <View style={[estilos.cuadrado, pressed && pulsado.boton]}>{fab.icono}</View>
                <Text style={estilos.etiquetaPublicar} numberOfLines={1}>
                  Publicar
                </Text>
              </>
            )}
          </Pressable>
        ) : null}

        {pestanas.slice(medio).map(pestana)}
      </View>

      {conIndicador ? (
        <View style={estilos.bandaIndicador} pointerEvents="none">
          <View style={estilos.indicador} />
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,.94)',
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    ...(vidrio ?? {}),
  },

  casilla: {
    width: CASILLA,
    height: ALTO,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  icono: { width: 23, height: 23, alignItems: 'center', justifyContent: 'center' },

  etiqueta: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '400',
    color: color.inkIcono,
    fontFamily: familia,
  },
  etiquetaActiva: { fontWeight: '500', color: color.rojo700 },

  /** El círculo rojo con aro blanco, arriba a la derecha del icono. */
  insignia: {
    position: 'absolute',
    top: -7,
    right: -9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: color.rojo500,
    borderWidth: 2,
    borderColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insigniaTexto: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    color: color.blanco,
    fontFamily: familia,
  },

  casillaPublicar: {
    width: CASILLA,
    height: ALTO,
    alignItems: 'center',
    gap: 4,
  },
  /** 48 × 48, radio 17, degradado de tinta, subido 20 sobre el borde. */
  cuadrado: {
    width: 48,
    height: 48,
    marginTop: -20,
    borderRadius: 17,
    // RN no degrada un fondo sin SVG; el paso claro del degradado 160° queda
    // como color base y la profundidad la pone la sombra.
    backgroundColor: color.ink900,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.12)',
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra.publicar,
  },
  etiquetaPublicar: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
  },

  bandaIndicador: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.94)',
  },
  indicador: {
    width: 139,
    height: 5,
    borderRadius: 100,
    backgroundColor: 'rgba(10,39,49,.28)',
  },
});
