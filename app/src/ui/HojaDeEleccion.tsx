/**
 * La hoja que sube desde abajo para elegir una cosa de una lista corta —
 * cuándo sales, cuántos van, qué ruta.
 *
 * **Por qué una hoja y no un desplegable nativo.** El `<select>` del navegador
 * se pinta con el estilo del sistema, que no es el nuestro: rompe la única
 * regla de superficie que el sistema tiene —azul manda las superficies, rojo
 * la interacción, y el blanco los separa—. Y en el teléfono abre una rueda que
 * tapa la pantalla entera para elegir entre tres cosas.
 *
 * **Qué estaba mal.** Se abría, pero no se veía dónde empezaba: el fondo de la
 * hoja era `sand100`, el mismo de la página de debajo, así que las dos
 * superficies se fundían y la hoja parecía la propia página desplazada. No
 * llevaba asa, así que no decía que se arrastra. El rótulo era un epígrafe
 * gris de once píxeles, más pequeño que las opciones que titulaba. Y la última
 * fila llevaba raya, que dibuja un renglón vacío contra el borde.
 *
 * Ahora: blanca sobre el velo, asa arriba, título del tamaño de un título, y
 * la última fila sin raya.
 */

import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cerrar, Visto } from './iconos';
import { color, espacio, familia, interlinea, radio, zonaDeToque } from './tokens';

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
        {/* El asa. No se toca —cerrar tiene su botón— pero dice de un vistazo
            que esto es una hoja que sube, y no la página de debajo movida. */}
        <View style={estilos.asa} pointerEvents="none" />

        <View style={estilos.cabecera}>
          <Text style={estilos.titulo}>{titulo}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={alCerrar}
            style={estilos.cerrar}
          >
            <Cerrar tamano={12} tinta={color.ink700} />
          </Pressable>
        </View>

        <ScrollView style={estilos.lista} showsVerticalScrollIndicator={false}>
          {opciones.map((o, i) => {
            const activo = o.valor === elegido;
            const ultima = i === opciones.length - 1;
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
                  !ultima && estilos.conRaya,
                  pressed && { backgroundColor: color.sand100 },
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
  velo: { flex: 1, backgroundColor: 'rgba(26,20,32,.42)' },
  hoja: {
    backgroundColor: color.blanco,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: espacio.gutter,
    paddingTop: 10,
    /* 30 abajo: el indicador del iPhone se come los últimos veinte y la
       última fila quedaba pegada al canto. */
    paddingBottom: 30,
    maxHeight: 470,
    width: '100%',
    maxWidth: espacio.marco,
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 -20px 56px rgba(26,20,32,.24)' as never } : null),
  },

  asa: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.ink200,
    marginBottom: 12,
  },

  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  titulo: {
    flex: 1,
    fontFamily: familia,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.34,
    color: color.ink900,
  },
  cerrar: {
    width: 32,
    height: 32,
    borderRadius: radio.pastilla,
    alignItems: 'center',
    backgroundColor: color.sand200,
    ...zonaDeToque,
  },

  lista: { marginTop: 6 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 12,
  },
  conRaya: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  etiqueta: { fontFamily: familia, fontSize: 15.5, lineHeight: 22, color: color.ink900 },
  etiquetaActiva: { fontWeight: '700' },
  debajo: {
    fontFamily: familia,
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink600,
    marginTop: 1,
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
