/**
 * La línea de «algo no salió», con la forma que manda el sistema.
 *
 * **El error no puede ser rojo a secas.** El rojo de Partimos es lo que se
 * pulsa —botones, enlaces, estados activos—, así que un texto rojo suelto se
 * lee como una acción. `SISTEMA.md` lo resuelve con tres cosas juntas:
 * `rojo-700`, más oscuro que cualquier botón; **un icono**; y **un texto que
 * nombra la situación**. Las tres, o no es un error, es decoración.
 *
 * Existe para que las pantallas no vuelvan a inventarse cada una la suya: hasta
 * ahora `4e` usaba `rojo-500` sin icono, que es exactamente el color de su
 * propio botón «Entrar».
 */

import { StyleSheet, Text, View } from 'react-native';

import { Alerta } from './iconos';
import { color, familia, interlinea } from './tokens';

export function Aviso({ children }: { children: string }) {
  return (
    <View accessibilityRole="alert" style={estilos.fila}>
      <View style={estilos.icono}>
        <Alerta />
      </View>
      <Text style={estilos.texto}>{children}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 7, marginTop: 12, alignItems: 'flex-start' },
  /* El icono se sienta en la primera línea del texto, no en el centro del
     bloque: con dos líneas, centrarlo lo deja flotando entre las dos. */
  icono: { paddingTop: 2 },
  texto: {
    flex: 1,
    fontFamily: familia,
    fontSize: 13.5,
    lineHeight: interlinea(13),
    color: color.rojo700,
  },
});
