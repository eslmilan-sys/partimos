/**
 * La pantalla mientras llega.
 *
 * **Por qué existe.** Casi todas las pantallas hacían `if (!datos) return
 * <View style={estilos.pantalla} />`: un rectángulo de arena, sin nada. En un
 * teléfono con red lenta eso es medio segundo de pantalla muerta entre dos
 * toques, y medio segundo de nada se lee como «se rompió», no como «viene».
 *
 * Lo que se dibuja aquí es la FORMA de lo que va a llegar —el campo de color,
 * la cabecera, dos o tres tarjetas—, así que cuando llega no salta nada de
 * sitio. Es la diferencia entre esperar y no saber si pasa algo.
 *
 * El latido es lento a propósito: 1,1 s por ciclo y entre 0,45 y 0,9 de
 * opacidad. Más rápido o más contrastado deja de ser un fondo y se convierte
 * en algo que mirar, que es justo lo que no queremos.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { CampoRojo } from './CampoRojo';
import { color, espacio, radio } from './tokens';

/** Un bloque de relleno con el latido puesto. */
export function Hueso({
  ancho,
  alto = 14,
  redondo = 7,
  estilo,
}: {
  ancho?: number | `${number}%`;
  alto?: number;
  redondo?: number;
  estilo?: object;
}) {
  const latido = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(latido, {
          toValue: 0.9,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(latido, {
          toValue: 0.45,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [latido]);

  return (
    <Animated.View
      style={[
        {
          width: ancho ?? '100%',
          height: alto,
          borderRadius: redondo,
          backgroundColor: color.sand300,
          opacity: latido,
        },
        estilo,
      ]}
    />
  );
}

/**
 * La pantalla entera esperando: campo de color arriba, cabecera y tarjetas.
 *
 * `tarjetas` es cuántas cajas se dibujan debajo —tres para una lista, una
 * para un detalle—, y `altura` la del campo, para que coincida con la de la
 * pantalla que está llegando y no dé un salto al aparecer.
 */
export function Cargando({ altura = 214, tarjetas = 3 }: { altura?: number; tarjetas?: number }) {
  return (
    <View style={estilos.pantalla} accessibilityLabel="Cargando" accessibilityRole="progressbar">
      <CampoRojo altura={altura} />

      <View style={estilos.cabecera}>
        <Hueso ancho={110} alto={11} redondo={6} estilo={{ backgroundColor: 'rgba(255,255,255,.34)' }} />
        <Hueso
          ancho="70%"
          alto={26}
          redondo={9}
          estilo={{ marginTop: 14, backgroundColor: 'rgba(255,255,255,.28)' }}
        />
        <Hueso
          ancho="45%"
          alto={13}
          redondo={7}
          estilo={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,.22)' }}
        />
      </View>

      <View style={estilos.cuerpo}>
        {Array.from({ length: tarjetas }, (_, i) => (
          <View key={i} style={estilos.tarjeta}>
            <View style={estilos.fila}>
              <Hueso ancho={44} alto={44} redondo={radio.cuadrado} />
              <View style={{ flex: 1, gap: 9 }}>
                <Hueso ancho="55%" alto={14} />
                <Hueso ancho="35%" alto={12} />
              </View>
              <Hueso ancho={54} alto={26} redondo={9} />
            </View>
            <Hueso alto={12} estilo={{ marginTop: 16 }} />
            <Hueso ancho="62%" alto={12} estilo={{ marginTop: 9 }} />
          </View>
        ))}
      </View>
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
  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 58 },
  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 34, gap: 10 },
  tarjeta: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 16,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 13 },
});
