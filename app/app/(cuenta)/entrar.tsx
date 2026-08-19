/**
 * `4e` `14e` Entrar — para quien ya tiene cuenta.
 *
 * **Correo y contraseña**, no el celular que dibuja el traspaso: no hay
 * proveedor de SMS contratado y las cuentas que existen son de correo. El
 * motivo entero está en `servicios/cuenta.ts`.
 *
 * Google y Apple van debajo de una línea, no arriba: el correo es lo que todo
 * el mundo tiene, y lo demás es un atajo para quien lo prefiera.
 */

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useRouter } from 'expo-router';

import { QUE_PASO, contrasenaValida, correoValido, entrar as entrarConCuenta } from '@/servicios/cuenta';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Campo } from '@/ui/Campo';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

export default function Entrar() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [quePaso, setQuePaso] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const listo = correoValido(correo) && contrasenaValida(clave);

  const enviar = async () => {
    if (!listo || entrando) return;
    setEntrando(true);
    setQuePaso(null);
    const r = await entrarConCuenta(correo, clave);
    setEntrando(false);
    if (r.ok) router.replace('/(pasajero)');
    else setQuePaso(QUE_PASO[r.motivo]);
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={190} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>Entrar</Text>
        </View>

        <Text style={estilos.titular}>
          {'Hola otra vez,'}
          {'\n'}
          <Text style={estilos.titularFuerte}>¿tu correo?</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          <View style={{ gap: 14 }}>
            <Campo
              etiqueta="Correo"
              valor={correo}
              alEscribir={setCorreo}
              marcador="tu@correo.com"
              correo
              mal={!!quePaso}
            />
            <Campo
              etiqueta="Contraseña"
              valor={clave}
              alEscribir={setClave}
              marcador="Al menos 6 caracteres"
              secreto
              mal={!!quePaso}
              alTerminar={enviar}
            />
          </View>

          {quePaso ? <Text style={estilos.quePaso}>{quePaso}</Text> : null}

          <View style={{ marginTop: 16 }}>
            {/* Dentro de la hoja blanca la acción es azul: rojo sobre rojo no se lee. */}
            <Boton tono="azul" desactivado={!listo || entrando} alPulsar={enviar}>
              {entrando ? 'Entrando…' : 'Entrar'}
            </Boton>
          </View>
        </View>

        <View style={estilos.abajo}>
          <View style={estilos.separador}>
            <View style={estilos.raya} />
            <Text style={estilos.oTexto}>o</Text>
            <View style={estilos.raya} />
          </View>

          <View style={estilos.otros}>
            <Pressable accessibilityRole="button" style={estilos.otro}>
              <Text style={estilos.otroTexto}>Continuar con Google</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={estilos.otro}>
              <Text style={estilos.otroTexto}>Continuar con Apple</Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push('/(cuenta)/registro')}>
            <Text style={estilos.cambiaste}>
              {'¿Todavía no tienes cuenta? '}
              <Text style={estilos.escribenos}>Regístrate</Text>
            </Text>
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
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  quePaso: {
    fontFamily: familia,
    fontSize: 13,
    lineHeight: interlinea(13),
    color: color.rojo500,
    marginTop: 12,
  },

  cabecera: { paddingHorizontal: espacio.gutter },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 31,
    lineHeight: 32.86,
    letterSpacing: -1.395,
    fontWeight: '400',
    color: '#fff',
    marginTop: 14,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 22,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  filaTelefono: { flexDirection: 'row', gap: 9 },
  prefijo: {
    width: 96,
    height: 58,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  prefijoTexto: {
    fontSize: 16,
    lineHeight: interlinea(16),
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },
  campoTelefono: {
    flex: 1,
    height: 58,
    borderRadius: radio.control,
    borderWidth: 1,
    // El campo activo se dibuja con el borde en tinta, no con un halo de color.
    borderColor: color.bordePorDefecto,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  entradaTelefono: {
    fontSize: 18,
    lineHeight: interlinea(18),
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    outlineStyle: 'none',
    ...tabular,
  } as never,

  abajo: { paddingHorizontal: 4, paddingTop: 26 },
  separador: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  raya: { flex: 1, height: 1, backgroundColor: color.bordeSutil },
  oTexto: {
    fontSize: 12,
    lineHeight: interlinea(12),
    fontWeight: '600',
    letterSpacing: 12 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink400,
    fontFamily: familia,
  },

  otros: { gap: 10, marginTop: 20 },
  otro: {
    height: 52,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otroTexto: {
    fontSize: 16,
    lineHeight: interlinea(16),
    fontWeight: '600',
    letterSpacing: -0.16,
    color: color.ink900,
    fontFamily: familia,
  },

  cambiaste: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink600,
    marginTop: 26,
    fontFamily: familia,
  },
  escribenos: { fontWeight: '600', color: color.rojo600 },

  chevron: { width: 14, height: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  chevronRama: {
    width: 7,
    height: 1.6,
    backgroundColor: color.ink600,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});
