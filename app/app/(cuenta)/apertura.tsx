/**
 * `4a` Apertura — lo primero que se ve al instalar.
 *
 * Una sola pantalla roja de borde a borde, con la ciudad al pie. Es la única
 * del producto donde el campo ocupa los 844 px enteros: después de esto, el
 * rojo siempre cede el sitio a una hoja blanca.
 *
 * La tercera opción —mirar los viajes sin cuenta— va deliberadamente en texto
 * pleno y abajo: el recorrido del pasajero busca primero y se registra
 * después, y la puerta de la cuenta no está aquí, está en `1c`.
 */

import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { Marca } from '@/ui/iconos';
import { familia, color, espacio, interlinea } from '@/ui/tokens';

export default function Apertura() {
  const router = useRouter();

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={844} motivo="tornillo" />
      <BarraDeEstado />

      <View style={estilos.cuerpo}>
        <View style={estilos.marca}>
          <Marca tamano={30} />
          <Text style={estilos.nombre}>Partimos</Text>
        </View>

        <Text style={estilos.titular}>
          {'Alguien ya va'}
          {'\n'}
          <Text style={estilos.titularFuerte}>para allá</Text>
        </Text>

        <Text style={estilos.entrada}>
          Te recogen cerca y pagas como prefieras: Yappy, tarjeta o efectivo. El aporte le llega
          completo al conductor.
        </Text>

        <View style={estilos.botones}>
          <Boton tono="blanco" alPulsar={() => router.push('/(cuenta)/registro')}>
            Crear cuenta
          </Boton>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(cuenta)/entrar')}
            style={estilos.contornoClaro}
          >
            <Text style={estilos.contornoTexto}>Ya tengo cuenta</Text>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.replace('/(pasajero)')}>
          <Text style={estilos.sinCuenta}>Mirar los viajes sin cuenta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.rojo600,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cuerpo: { flex: 1, minHeight: 0, paddingHorizontal: espacio.gutter, paddingBottom: 34 },

  marca: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 8 },
  nombre: {
    fontSize: 19,
    lineHeight: interlinea(19),
    fontWeight: '600',
    letterSpacing: -0.57,
    color: '#fff',
    fontFamily: familia,
  },

  // `margin: auto 0 0` en el traspaso: el bloque de abajo empuja al titular
  // hasta donde acaba el espacio libre.
  titular: {
    marginTop: 'auto',
    fontSize: 46,
    lineHeight: 46,
    letterSpacing: -2.3,
    fontWeight: '400',
    color: '#fff',
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  entrada: {
    fontSize: 15.5,
    lineHeight: 22.475,
    color: color.campoTexto,
    marginTop: 18,
    maxWidth: 290,
    fontFamily: familia,
  },

  botones: { gap: 10, marginTop: 34 },
  contornoClaro: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contornoTexto: {
    fontSize: 16,
    lineHeight: interlinea(16),
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },

  sinCuenta: {
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.campoTexto,
    marginTop: 18,
    fontFamily: familia,
  },
});
