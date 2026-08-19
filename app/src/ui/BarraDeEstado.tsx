/**
 * La barra de estado que el diseño dibuja dentro del marco: 44 px de alto,
 * 26 de gutter, la hora a la izquierda y cobertura + batería a la derecha.
 *
 * En el teléfono la tapa la barra real del sistema; en el navegador es la que
 * hace que la pantalla se vea como en el traspaso.
 */

import { Platform, StyleSheet, Text, View } from 'react-native';

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
  // En el móvil manda la barra del sistema; solo la dibujamos en web.
  if (Platform.OS !== 'web') return <View style={{ height: 0 }} />;

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
