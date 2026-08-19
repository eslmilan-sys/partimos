/**
 * La hoja que sube desde abajo para elegir una cosa de una lista corta —
 * cuándo sales y cuántos van.
 *
 * **Por qué una hoja y no un desplegable nativo.** El `<select>` del navegador
 * se pinta con el estilo del sistema, que no es el nuestro: rompe la única
 * regla de superficie que el sistema tiene —azul manda las superficies, rojo
 * la interacción, y el blanco los separa—. Y en el teléfono abre una rueda que
 * tapa la pantalla entera para elegir entre tres cosas.
 *
 * Es la misma pieza para las dos, porque son el mismo gesto: una lista corta,
 * una elección, se cierra. Lo que cambia es el contenido, no la mecánica.
 */

import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cerrar, Visto } from './iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio } from './tokens';

export type Opcion = { valor: string; etiqueta: string; debajo?: string };

type Props = {
  abierta: boolean;
  titulo: string;
  opciones: Opcion[];
  elegido: string;
  alElegir: (valor: string) => void;
  alCerrar: () => void;
};

export function HojaDeEleccion({
  abierta,
  titulo,
  opciones,
  elegido,
  alElegir,
  alCerrar,
}: Props) {
  return (
    <Modal visible={abierta} animationType="slide" transparent onRequestClose={alCerrar}>
      <Pressable accessibilityLabel="Cerrar" onPress={alCerrar} style={estilos.velo} />

      <View style={estilos.hoja}>
        <View style={estilos.cabecera}>
          <Text style={estilos.epigrafe}>{titulo}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={alCerrar}
            style={estilos.cerrar}
          >
            <Cerrar tamano={12} tinta={color.ink600} />
          </Pressable>
        </View>

        <ScrollView style={estilos.lista}>
          {opciones.map((o) => {
            const activo = o.valor === elegido;
            return (
              <Pressable
                key={o.valor}
                accessibilityRole="radio"
                accessibilityState={{ checked: activo }}
                accessibilityLabel={o.etiqueta}
                onPress={() => {
                  alElegir(o.valor);
                  alCerrar();
                }}
                style={({ pressed }) => [
                  estilos.fila,
                  pressed && { backgroundColor: color.sand200 },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[estilos.etiqueta, activo && estilos.etiquetaActiva]}>
                    {o.etiqueta}
                  </Text>
                  {o.debajo ? <Text style={estilos.debajo}>{o.debajo}</Text> : null}
                </View>
                {/* La marca de lo elegido va en azul: es estado, no acción. */}
                {activo ? (
                  <View style={estilos.marca}>
                    <Visto tamano={12} tinta="#fff" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(26,20,32,.34)' },
  hoja: {
    backgroundColor: color.sand100,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: espacio.gutter,
    paddingTop: 16,
    paddingBottom: 26,
    maxHeight: 460,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 -18px 48px rgba(26,20,32,.18)' as never } : null),
  },

  cabecera: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  epigrafe: {
    flex: 1,
    fontFamily: familia,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
  },
  cerrar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.sand200,
  },

  lista: { marginTop: 4 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: color.bordeSutil,
  },
  etiqueta: { fontFamily: familia, fontSize: 16, color: color.ink900 },
  etiquetaActiva: { fontWeight: '600' },
  debajo: {
    fontFamily: familia,
    fontSize: 12,
    lineHeight: interlinea(12),
    color: color.ink500,
    marginTop: 2,
  },
  marca: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.azul500,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
