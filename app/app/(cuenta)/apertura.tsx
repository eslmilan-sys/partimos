/**
 * Apertura — lo primero que se ve al instalar, en el lenguaje v6.
 *
 * Antes era la única pantalla roja de borde a borde; ese arquetipo se fue
 * con el sistema anterior. Ahora abre como el resto de la app: lienzo claro
 * con los dos halos, la teja roja con la marca —el bloque del `10c` del
 * canevas—, el titular en tinta con su eco apagado, y las dos salidas. La
 * tercera —mirar los viajes sin cuenta— va deliberadamente en texto y abajo:
 * el recorrido del pasajero busca primero y se registra después.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { Marca } from '@/ui/iconos';
import { color, espacio, familia, zonaDeToque } from '@/ui/tokens';

export default function Apertura() {
  const router = useRouter();

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={420} motivo="ciudadDetras" />
      <BarraDeEstado />

      <View style={estilos.cuerpo}>
        <View style={estilos.marca}>
          <View style={estilos.teja}>
            <Marca tamano={27} tinta="#fff" />
          </View>
          <Text style={estilos.nombre}>partimos</Text>
        </View>

        <Text style={estilos.titular}>
          {'Alguien ya va '}
          <Text style={estilos.titularApagado}>para allá</Text>
        </Text>

        <Text style={estilos.entrada}>
          Te recogen cerca y aportas como prefieras: Yappy, tarjeta o efectivo. El aporte le llega
          completo al conductor.
        </Text>

        <View style={estilos.botones}>
          <Boton alPulsar={() => router.push('/(cuenta)/registro')}>Crear cuenta</Boton>
          <Boton tono="blanco" alPulsar={() => router.push('/(cuenta)/entrar')}>
            Ya tengo cuenta
          </Boton>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(pasajero)')}
          style={zonaDeToque}
        >
          <Text style={estilos.sinCuenta}>Mirar los viajes sin cuenta</Text>
        </Pressable>
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

  cuerpo: { flex: 1, minHeight: 0, paddingHorizontal: espacio.gutter, paddingBottom: 34 },

  marca: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  teja: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.67,
    color: color.ink900,
    fontFamily: familia,
  },

  // El bloque de abajo empuja al titular hasta donde acaba el espacio libre.
  titular: {
    marginTop: 'auto',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.19,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  /** El eco apagado, como el título del Inicio v6. */
  titularApagado: { color: '#8FA6AD' },

  entrada: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: color.ink500,
    marginTop: 15,
    maxWidth: 300,
    fontFamily: familia,
  },

  botones: { gap: 10, marginTop: 30 },

  sinCuenta: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.rojo700,
    marginTop: 12,
    fontFamily: familia,
  },
});
