/**
 * Cómo te cuidamos — la pantalla que el mensaje de bienvenida promete.
 *
 * **Por qué existe.** La tercera fila del mensaje de Partimos —«Mira cómo te
 * cuidamos»— llevaba a `reportar`, el formulario de denunciar algo de un
 * viaje. Dos cosas mal a la vez: no es lo que promete el texto —enseñar
 * cómo se cuida a quien viaja, no denunciar—, y ese formulario necesita un
 * viaje del que hablar, así que a alguien recién registrado le dejaba la
 * pantalla girando para siempre. Visto en el teléfono del dueño el 25-08.
 *
 * Aquí no hace falta ningún viaje: es lo que la app hace SIEMPRE, dicho una
 * vez y por escrito, con la salida de emergencia arriba del todo porque en
 * una emergencia nadie desplaza una pantalla.
 *
 * Cada punto lleva su límite al lado. Prometer sin decir dónde acaba la
 * promesa es lo que hace desconfiar de una app de viajar con desconocidos.
 */

import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { EMERGENCIAS, EMERGENCIAS_QUIEN } from '@/servicios/seguridad';
import { useVolver } from '@/ui/salidas';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { Atras, Cedula, Chat, Escudo, Persona } from '@/ui/iconos';
import { color, espacio, familia, interlinea, pulsado, radio, sombra, texto } from '@/ui/tokens';

/** Lo que hacemos, y hasta dónde. El límite va en la misma tarjeta. */
const LO_QUE_HACEMOS = [
  {
    clave: 'cedula',
    Glifo: Cedula,
    titulo: 'La cédula se verifica de verdad',
    cuerpo:
      'Quien publica un viaje pasa por un proveedor certificado, con documento y selfie. Nosotros recibimos si pasó o no, y nada más.',
    limite: 'La foto del documento y el número nunca llegan a nuestros servidores.',
  },
  {
    clave: 'chat',
    Glifo: Chat,
    titulo: 'El chat queda escrito',
    cuerpo:
      'Lo que se acuerda antes del viaje —el punto, la hora, el aporte— se queda en la conversación, con fecha. Si algo no cuadra después, está ahí.',
    limite: 'Nadie borra mensajes, ni tú ni el conductor.',
  },
  {
    clave: 'quien',
    Glifo: Persona,
    titulo: 'Sabes con quién vas antes de subir',
    cuerpo:
      'Nombre, inicial del apellido, reseñas de otros viajes y el carro con su foto por detrás, con la placa legible.',
    limite: 'El apellido completo no se enseña nunca, ni el tuyo ni el suyo.',
  },
  {
    clave: 'dinero',
    Glifo: Escudo,
    titulo: 'El dinero no pasa por nosotros',
    cuerpo:
      'El aporte se paga de la mano, en efectivo o por Yappy, y lo ves calculado antes de pedir el puesto. Nadie gana dinero con esto: se reparte la gasolina.',
    limite: 'No guardamos tarjetas ni retenemos pagos.',
  },
] as const;

export default function Seguridad() {
  const router = useRouter();
  const volver = useVolver('/(pasajero)');

  const llamar = () => {
    const numero = `tel:${EMERGENCIAS}`;
    if (Platform.OS === 'web') window.location.href = numero;
    else Linking.openURL(numero);
  };

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <CampoRojo altura={206} />

        <View style={estilos.cabecera}>
          <View style={estilos.filaEpigrafe}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atrás"
              onPress={() => volver()}
              style={estilos.circulo}
            >
              <Atras />
            </Pressable>
            <Text style={estilos.epigrafeCampo}>Seguridad</Text>
          </View>
          <Text style={estilos.titular}>
            {'Cómo te '}
            <Text style={texto.titularFuerte}>cuidamos</Text>
          </Text>
        </View>

        {/* La emergencia va ARRIBA: en una emergencia nadie desplaza. */}
        <View style={estilos.tarjetaEmergencia}>
          <Epigrafe tinta={color.rojo700}>Si estás en peligro ahora</Epigrafe>
          <View style={{ marginTop: 10 }}>
            <Boton alPulsar={llamar}>{`Llamar al ${EMERGENCIAS}`}</Boton>
          </View>
          <Text style={estilos.notaEmergencia}>
            {`${EMERGENCIAS_QUIEN}. Después de llamar, cuéntanoslo desde el viaje.`}
          </Text>
        </View>

        {LO_QUE_HACEMOS.map(({ clave, Glifo, titulo, cuerpo, limite }) => (
          <View key={clave} style={estilos.tarjeta}>
            <View style={estilos.filaTitulo}>
              <View style={estilos.celdaGlifo}>
                <Glifo tamano={19} tinta={color.rojo600} />
              </View>
              <Text style={estilos.titulo}>{titulo}</Text>
            </View>
            <Text style={estilos.cuerpo}>{cuerpo}</Text>
            <View style={estilos.limite}>
              <Text style={estilos.limiteTexto}>{limite}</Text>
            </View>
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a Ayuda"
          onPress={() => router.push('/(ayuda)')}
          style={({ pressed }) => [estilos.ayuda, pressed && pulsado.celda]}
        >
          <Text style={estilos.ayudaTexto}>
            {'¿Pasó algo en un viaje? '}
            <Text style={estilos.ayudaFuerte}>Escríbenos desde Ayuda</Text>
          </Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4 },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto },
  titular: { ...texto.titular, color: color.ink900, marginTop: 12 },

  tarjetaEmergencia: {
    marginHorizontal: espacio.gutter,
    marginTop: 20,
    backgroundColor: color.rojo100,
    borderRadius: radio.hoja,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  notaEmergencia: {
    marginTop: 10,
    fontSize: 12.5,
    lineHeight: 17.5,
    color: color.rojo700,
    fontFamily: familia,
  },

  tarjeta: {
    marginHorizontal: espacio.gutter,
    marginTop: espacio.entreTarjetas,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingHorizontal: 18,
    paddingVertical: 16,
    ...sombra.s,
  },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  celdaGlifo: {
    width: 36,
    height: 36,
    borderRadius: radio.icono,
    backgroundColor: color.rojo100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { ...texto.fila, color: color.ink900, flex: 1 },
  cuerpo: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: color.ink500,
    fontFamily: familia,
  },
  /** El límite, en su propia caja: se lee aparte de la promesa. */
  limite: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  limiteTexto: {
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink600,
    fontFamily: familia,
  },

  ayuda: {
    marginHorizontal: espacio.gutter,
    marginTop: espacio.entreTarjetas,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ayudaTexto: { fontSize: 14, lineHeight: 20, color: color.ink600, fontFamily: familia },
  ayudaFuerte: { color: color.rojo600, fontWeight: '600' },
});
