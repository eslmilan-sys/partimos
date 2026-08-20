/**
 * Cuando lo que la pantalla iba a enseñar no existe.
 *
 * **Por qué existe.** Casi todas las pantallas del recorrido leen una fila por
 * su identificador y hacen `if (!datos) return <View />`. Eso mezcla dos cosas
 * distintas: «todavía estoy pidiéndolo» y «no está». La primera dura un
 * instante; la segunda dura para siempre, y quien la ve solo ve una pantalla
 * en blanco sin nada que tocar, ni siquiera para salir.
 *
 * Pasa de verdad: un enlace compartido a un viaje que ya salió, una reserva de
 * otra cuenta, o el catálogo de pantallas abierto sin parámetro. La respuesta
 * honesta es decirlo y dar la puerta de salida.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useVolver } from './salidas';

import { BarraDeEstado } from './BarraDeEstado';
import { CampoRojo } from './CampoRojo';
import { Boton } from './controles';
import { color, espacio, familia, radio, zonaDeToque } from './tokens';

export function NoEsta({
  titulo = 'Esto ya no está aquí',
  explicacion = 'El viaje pudo salir, o el enlace es de otra cuenta. Búscalo otra vez desde el principio.',
}: {
  titulo?: string;
  explicacion?: string;
}) {
  const router = useRouter();
  const volver = useVolver();

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} motivo="mapa" />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <Text style={estilos.titular}>{titulo}</Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.explicacion}>{explicacion}</Text>
          <Boton tamano="md" alPulsar={() => router.replace('/(pasajero)')}>
            Buscar un viaje
          </Boton>
          <Pressable accessibilityRole="button" onPress={() => volver()} style={zonaDeToque}>
            <Text style={estilos.atras}>Volver atrás</Text>
          </Pressable>
        </View>
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
  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 46 },
  titular: {
    fontSize: 30,
    lineHeight: 30.74,
    letterSpacing: -1.3,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },
  cuerpo: { flex: 1, paddingHorizontal: espacio.gutter, paddingTop: 40 },
  tarjeta: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 22,
    gap: 18,
  },
  explicacion: { fontSize: 15.5, lineHeight: 22.5, color: color.ink700, fontFamily: familia },
  atras: {
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '600',
    color: color.ink600,
    textAlign: 'center',
    fontFamily: familia,
  },
});
