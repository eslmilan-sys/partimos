/**
 * `14e` Entrar — la versión larga de la misma puerta que `4e`.
 *
 * Dice en voz alta lo que `4e` da por sabido: **tu número es tu cuenta**. Sin
 * contraseña que perder y sin correo que confirmar; llega un código y entras.
 *
 * Y deja abierta la salida que el producto entero defiende: buscar no pide
 * cuenta. Quien llegó aquí por error puede seguir mirando viajes.
 *
 * Una diferencia con `4e` que viene del traspaso y no de aquí: el botón de
 * esta hoja es **rojo**, no azul. La hoja ya no monta sobre el campo, así que
 * el rojo no cae sobre rojo.
 */

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useRouter } from 'expo-router';

import { QUE_PASO, contrasenaValida, correoValido, entrar } from '@/servicios/cuenta';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Campo } from '@/ui/Campo';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { MarcaColor, Pin } from '@/ui/iconos';
import { familia, color, espacio, interlinea, radio } from '@/ui/tokens';

export default function Acceso() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [quePaso, setQuePaso] = useState<string | null>(null);
  const [enfocado, setEnfocado] = useState(false);

  const listo = correoValido(correo) && contrasenaValida(clave);

  const enviar = async () => {
    if (!listo) return;
    setQuePaso(null);
    const r = await entrar(correo, clave);
    if (r.ok) router.replace('/(pasajero)');
    else setQuePaso(QUE_PASO[r.motivo]);
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={290} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <MarcaColor tamano={44} />

        <Text style={estilos.titular}>
          {'Hola otra '}
          <Text style={estilos.titularFuerte}>vez</Text>
        </Text>

        <Text style={estilos.entrada}>Tu correo es tu cuenta. Escribe la contraseña y entras.</Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          <Epigrafe>Tu correo</Epigrafe>

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

          {quePaso ? <Text style={estilos.malo}>{quePaso}</Text> : null}

          <View style={{ marginTop: 16 }}>
            <Boton desactivado={!listo} alPulsar={enviar}>
              Entrar
            </Boton>
          </View>

          <Text style={estilos.ayuda}>El mismo correo con el que te registraste.</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(pasajero)')}
          style={estilos.salida}
        >
          <View style={estilos.cuadroIcono}>
            <Pin tamano={17} tinta={color.ink700} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.salidaTitulo}>Mirar viajes sin entrar</Text>
            <Text style={estilos.salidaPie}>Buscar no pide cuenta</Text>
          </View>
          <Flecha />
        </Pressable>

        <Text style={estilos.cierre}>
          ¿Cambiaste de número? Escríbenos y movemos tu cuenta con tus viajes y tu cédula.
        </Text>
      </View>
    </View>
  );
}

/** El galón de «entra aquí» al final de una fila. */
function Flecha() {
  return (
    <View style={estilos.flecha}>
      <View style={estilos.flechaRama} />
      <View style={[estilos.flechaRama, { transform: [{ rotate: '-45deg' }], marginTop: -3.4 }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  malo: {
    fontFamily: familia,
    fontSize: 13,
    lineHeight: 18.85,
    color: color.rojo500,
    marginTop: 12,
  },
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 12 },
  titular: {
    fontSize: 33,
    lineHeight: 34.65,
    letterSpacing: -1.32,
    fontWeight: '400',
    color: '#fff',
    marginTop: 20,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },
  entrada: {
    fontSize: 14.5,
    lineHeight: 21.025,
    letterSpacing: -0.116,
    color: color.campoTexto,
    marginTop: 9,
    fontFamily: familia,
  },

  cuerpo: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 20,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  filaTelefono: { flexDirection: 'row', gap: 9, marginTop: 12 },
  prefijo: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    backgroundColor: color.sand100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefijoTexto: {
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  campoTelefono: {
    flex: 1,
    height: 52,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  entradaTelefono: {
    fontSize: 17,
    lineHeight: interlinea(17),
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    outlineStyle: 'none',
    ...tabular,
  } as never,

  ayuda: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink500,
    marginTop: 12,
    fontFamily: familia,
  },

  salida: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  cuadroIcono: {
    width: 34,
    height: 34,
    borderRadius: radio.cuadrado,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salidaTitulo: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  salidaPie: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    fontFamily: familia,
  },

  cierre: {
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink500,
    marginTop: 15,
    fontFamily: familia,
  },

  flecha: { width: 17, height: 17, alignItems: 'center', justifyContent: 'center' },
  flechaRama: {
    width: 1.6,
    height: 7,
    backgroundColor: color.ink400,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});
