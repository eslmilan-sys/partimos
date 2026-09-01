/**
 * `15c` Cómo funciona Partimos — el paso a paso, en bloques.
 *
 * Pedido del dueño (01-09-2026): «Como funciona partimos shall have blocks
 * of how it works. Here be super specific and use good copywriting.»
 *
 * **No es la ayuda de incidencias.** Quien abre «Cómo funciona» no viene de
 * un problema: viene a entender en qué se está metiendo antes de pedir su
 * primer puesto. Por eso esta pantalla no pregunta qué salió mal — cuenta,
 * en orden, lo que va a pasar.
 *
 * Arriba, los tres pasos que son el producto entero, numerados y en una
 * frase cada uno. Debajo, los bloques de detalle de `COMO_SE_HACE` —
 * abiertos, sin acordeón: quien llegó hasta aquí vino a leer, y esconder
 * las respuestas detrás de siete toques es hacerle trabajar por ellas.
 *
 * Las palabras respetan las reglas de la casa: se «aporta» —nadie «gana»—,
 * la plata va de la mano a la mano, y no se promete nada que el producto
 * no haga.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useVolver } from '@/ui/salidas';

import { COMO_SE_HACE } from '@/servicios/ayuda';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Atras } from '@/ui/iconos';
import { Pestanas } from '@/ui/Pestanas';
import { color, espacio, familia, interlinea, radio, sombra, texto } from '@/ui/tokens';

/**
 * LOS TRES PASOS. Es la columna vertebral del producto dicha de una vez:
 * todo lo demás —códigos, chat, calificaciones— cuelga de estos tres.
 */
const LOS_TRES = [
  {
    numero: '1',
    titulo: 'Encuentra con quién ir',
    texto:
      'Escribe a dónde vas y mira quién sale ese día. Cada viaje dice quién maneja, en qué carro, a qué hora y cuánto se aporta. ¿Una duda? Pregúntale por el chat antes de pedir nada: preguntar no ocupa puesto.',
  },
  {
    numero: '2',
    titulo: 'Pide tu puesto y acuerden el punto',
    texto:
      'Tocas «Pedir mi puesto» y el conductor decide. Cuando acepta, acuerdan por el chat dónde te recoge, y tu puesto lleva un código de cuatro cifras: se lo dices al subir, y eso prueba que subiste.',
  },
  {
    numero: '3',
    titulo: 'El aporte es gasolina, no negocio',
    texto:
      'Lo que pagas es tu parte de la gasolina y los peajes, dividida entre los que van en el carro. La app calcula un tope que el conductor no puede pasar, y la plata va directo de tu mano a la suya: Partimos no la guarda ni cobra comisión.',
  },
];

export default function ComoFunciona() {
  const volver = useVolver('/(cuenta)/cuenta');

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <CampoRojo altura={206} />

        <View style={estilos.cabecera}>
          <View style={estilos.filaVolver}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atrás"
              onPress={() => volver()}
              style={estilos.circulo}
            >
              <Atras />
            </Pressable>
          </View>
          <Text style={estilos.titular}>
            {'Cómo funciona '}
            <Text style={texto.titularFuerte}>Partimos</Text>
          </Text>
          <Text style={estilos.bajada}>
            Gente que va en la misma dirección repartiéndose la gasolina. Eso es todo, y así se
            hace:
          </Text>
        </View>

        {/* Los tres pasos, en la hoja blanca que monta sobre el campo rojo:
            es lo primero y lo único imprescindible. */}
        <View style={estilos.hoja}>
          {LOS_TRES.map((paso, i) => (
            <View key={paso.numero} style={[estilos.paso, i > 0 && estilos.pasoConLinea]}>
              <View style={estilos.numero}>
                <Text style={estilos.numeroTexto}>{paso.numero}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.pasoTitulo}>{paso.titulo}</Text>
                <Text style={estilos.pasoTexto}>{paso.texto}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* El detalle, ABIERTO. Son los mismos bloques que la ayuda enseña
            plegados; aquí se vino a leer, así que se leen. */}
        <Text style={estilos.rotuloDetalle}>En detalle</Text>
        {COMO_SE_HACE.map((bloque) => (
          <View key={bloque.titulo} style={estilos.bloque}>
            <Text style={estilos.bloqueTitulo}>{bloque.titulo}</Text>
            <Text style={estilos.bloqueTexto}>{bloque.texto}</Text>
          </View>
        ))}

        <View style={{ height: 96 }} />
      </ScrollView>

      <Pestanas valor="Perfil" />
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

  cabecera: { paddingTop: 4, paddingHorizontal: espacio.gutter },
  filaVolver: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: espacio.controlS,
    height: espacio.controlS,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titular: { ...texto.titular, color: color.ink900, marginTop: 12 },
  bajada: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: color.ink700,
    fontFamily: familia,
  },

  hoja: {
    marginTop: 20,
    marginHorizontal: espacio.tarjeta,
    backgroundColor: color.blanco,
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 18,
    ...sombra.hoja,
  },
  paso: { flexDirection: 'row', gap: 14, paddingVertical: 16 },
  pasoConLinea: { borderTopWidth: 1, borderTopColor: color.bordeSutil },
  /* El número en el rojo de la casa: es el único adorno del bloque, y dice
     «esto va en orden» sin escribirlo. */
  numero: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numeroTexto: {
    fontSize: 14.5,
    lineHeight: interlinea(14.5),
    fontWeight: '700',
    color: '#fff',
    fontFamily: familia,
  },
  pasoTitulo: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  pasoTexto: {
    marginTop: 4,
    fontSize: 13.5,
    lineHeight: 20,
    color: color.ink600,
    fontFamily: familia,
  },

  rotuloDetalle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: color.ink900,
    fontFamily: familia,
    marginTop: 24,
    marginBottom: 4,
    marginHorizontal: espacio.gutter,
  },
  bloque: {
    marginTop: 10,
    marginHorizontal: espacio.tarjeta,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 16,
  },
  bloqueTitulo: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },
  bloqueTexto: {
    marginTop: 5,
    fontSize: 13.5,
    lineHeight: 20,
    color: color.ink600,
    fontFamily: familia,
  },
});
