/**
 * La barra de estado que el diseño dibuja dentro del marco: 44 px de alto,
 * 26 de gutter, la hora a la izquierda y cobertura + batería a la derecha.
 *
 * **Solo se dibuja donde no estorba.** En el teléfono —con app o con
 * navegador— el sistema ya enseña su propia barra con la hora de verdad, así
 * que dibujar otra pone dos relojes uno encima del otro: se vio en el
 * teléfono, «15:17» del sistema y «9:41» nuestro justo debajo. Eso no es una
 * app, es una maqueta.
 *
 * En una ventana ancha sí: ahí la barra es lo que enmarca la pantalla como en
 * el traspaso, y no compite con nada. El corte está en 480 px, que es más que
 * cualquier teléfono y menos que cualquier escritorio.
 */

/** Por encima de esto la ventana es un escritorio, no un teléfono. */
const ANCHO_DE_ESCRITORIO = 480;

import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Bateria, Cobertura } from './iconos';
import { familia, color, espacio } from './tokens';

/**
 * `claro` sobre el campo rojo o un mapa oscuro; `oscuro` sobre el mapa de día,
 * donde el blanco no se lee.
 */
export function BarraDeEstado({
  hora = '9:41',
  tono = 'claro',
}: {
  hora?: string;
  tono?: 'claro' | 'oscuro';
}) {
  const { width } = useWindowDimensions();

  // En el móvil manda la barra del sistema, la dibuje quien la dibuje.
  if (Platform.OS !== 'web' || width < ANCHO_DE_ESCRITORIO) {
    return <View style={{ height: 0 }} />;
  }

  const tinta = tono === 'claro' ? '#fff' : color.ink900;

  return (
    <View style={estilos.barra}>
      <Text style={[estilos.hora, { color: tinta }]}>{hora}</Text>
      <View style={estilos.iconos}>
        <Cobertura tinta={tinta} />
        <Bateria tinta={tinta} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    height: 44,
    paddingHorizontal: espacio.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hora: { fontSize: 14, lineHeight: 20.3, fontWeight: '600', letterSpacing: -0.14, fontFamily: familia },
  iconos: { flexDirection: 'row', gap: 5, alignItems: 'center' },
});
