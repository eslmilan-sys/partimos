/**
 * `4e` `14e` Entrar — para quien ya tiene cuenta.
 *
 * **La estructura que pidió el cliente**, traída a nuestro lenguaje: la foto de
 * la bahía al atardecer ocupa la pantalla entera, la marca respira arriba, y
 * la hoja blanca con el formulario se apoya abajo.
 *
 * **Por qué la foto puede estar aquí y en ningún otro sitio.** El sistema dice
 * que el azul manda en las superficies y el rojo en lo que se toca, y que
 * nunca se tocan. Una foto de atardecer es roja de arriba abajo, así que
 * cualquier control encima tendría que ser rojo sobre rojo. La solución es la
 * misma que usa el campo rojo con su hoja: **el blanco los separa**. Todo lo
 * que se toca vive dentro de la hoja blanca, y ahí la acción es azul. Sobre la
 * foto solo hay marca y una frase, que no se tocan.
 *
 * **El velo no es decoración.** Sin él, «Comparte el camino» cae sobre nubes
 * naranjas a 2,4:1. Con el degradado a negro al 62 % abajo y 34 % arriba, el
 * blanco lee por encima de 4,5:1 en toda la franja donde hay texto.
 *
 * **La entrada.** Al abrir, la marca sube y aparece sola durante un segundo;
 * después la hoja se levanta desde abajo. No es un adorno: el nombre de la app
 * es lo primero que hay que reconocer, y una hoja que aparece con el resto se
 * lleva la mirada antes de tiempo. Quien vuelve a entrar por décima vez no la
 * sufre — dura 900 ms de punta a punta.
 *
 * **Correo y contraseña**, no el celular que dibuja el traspaso: no hay
 * proveedor de SMS contratado y las cuentas que existen son de correo. El
 * motivo entero está en `servicios/cuenta.ts`.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import {
  QUE_PASO,
  SIN_PROVEEDOR,
  contrasenaValida,
  correoValido,
  entrar as entrarConCuenta,
  entrarCon,
} from '@/servicios/cuenta';
import { Aviso } from '@/ui/Aviso';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Campo } from '@/ui/Campo';
import { Boton } from '@/ui/controles';
import { Escudo, MarcaColor } from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio, zonaDeToque } from '@/ui/tokens';

const FOTO = require('../../assets/entrada.jpg');

/** Los dos que dibuja el traspaso. El nombre se escribe una vez, no dos. */
const OTROS = [
  { quien: 'google', nombre: 'Google' },
  { quien: 'apple', nombre: 'Apple' },
] as const;

/* --------------------------------------------------------------- El velo */

/**
 * El degradado que hace legible el blanco sobre la foto.
 *
 * Tres paradas, no dos: arriba hace falta poco —la marca cae sobre cielo
 * oscuro—, en medio casi nada, y abajo mucho, porque ahí está el mar
 * encendido y encima se apoya la hoja.
 */
function Velo() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="velo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1C0A10" stopOpacity="0.34" />
          <Stop offset="0.34" stopColor="#1C0A10" stopOpacity="0.16" />
          <Stop offset="0.72" stopColor="#1C0A10" stopOpacity="0.46" />
          <Stop offset="1" stopColor="#1C0A10" stopOpacity="0.62" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#velo)" />
    </Svg>
  );
}

/* -------------------------------------------------------------- Glifos */

function Sobre({ tinta = color.ink400 }: { tinta?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path
        d="M3.5 6.5h17v11h-17z"
        stroke={tinta}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M3.5 7l8.5 6 8.5-6" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

function Candado({ tinta = color.ink400 }: { tinta?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path d="M5.5 10.5h13v9h-13z" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
      <Path
        d="M8.5 10.5V7.8a3.5 3.5 0 017 0v2.7"
        stroke={tinta}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/* ------------------------------------------------------------- Pantalla */

export default function Entrar() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [quePaso, setQuePaso] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  /* La entrada. `marca` sube y aparece; `hoja` se levanta 380 ms después, que
     es lo que tarda el ojo en leer un nombre de ocho letras. */
  const marca = useRef(new Animated.Value(0)).current;
  const hoja = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(marca, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(hoja, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [marca, hoja]);

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
      {/* El recorte lo hace este envoltorio, no la imagen: `cover` la escala
          hasta 690 px de ancho para cubrir 390 de alto entero, y sin
          `overflow: hidden` esos 300 px de más se pintan fuera del marco de
          440 en una ventana ancha. Medido. */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <ImageBackground source={FOTO} resizeMode="cover" style={StyleSheet.absoluteFill}>
          <Velo />
        </ImageBackground>
      </View>

      <BarraDeEstado />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.desplazable}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            estilos.marca,
            {
              opacity: marca,
              transform: [
                { translateY: marca.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) },
              ],
            },
          ]}
        >
          <MarcaColor tamano={48} />
          <Text style={estilos.nombre}>Partimos</Text>
          <Text style={estilos.lema}>
            {'Comparte el camino.'}
            {'\n'}
            {'Llega más lejos.'}
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: hoja,
            transform: [
              { translateY: hoja.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) },
            ],
          }}
        >
          <View style={estilos.hoja}>
            <Text style={estilos.titulo}>Bienvenido a Partimos</Text>
            <Text style={estilos.bajada}>
              Entra para ver tus viajes, tus reservas y tus mensajes.
            </Text>

            <View style={estilos.campos}>
              <Campo
                etiqueta="Correo electrónico"
                valor={correo}
                alEscribir={setCorreo}
                marcador="nombre@correo.com"
                correo
                mal={!!quePaso}
                glifo={<Sobre />}
              />
              <Campo
                etiqueta="Contraseña"
                valor={clave}
                alEscribir={setClave}
                marcador="Al menos 6 caracteres"
                secreto
                mal={!!quePaso}
                alTerminar={enviar}
                glifo={<Candado />}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Olvidé mi contraseña"
              onPress={() => router.push('/(ayuda)')}
              style={[estilos.olvide, zonaDeToque]}
            >
              <Text style={estilos.olvideTexto}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            {quePaso ? <Aviso>{quePaso}</Aviso> : null}

            <View style={{ marginTop: 14 }}>
              {/* Dentro de la hoja blanca la acción es azul: rojo sobre rojo no
                  se lee, y la foto de detrás es roja entera. */}
              <Boton tono="azul" desactivado={!listo || entrando} alPulsar={enviar}>
                {entrando ? 'Entrando…' : 'Iniciar sesión'}
              </Boton>
            </View>

            <View style={estilos.separador}>
              <View style={estilos.raya} />
              <Text style={estilos.oTexto}>o continúa con</Text>
              <View style={estilos.raya} />
            </View>

            <View style={estilos.otros}>
              {OTROS.map(({ quien, nombre }) => (
                <Pressable
                  key={quien}
                  accessibilityRole="button"
                  accessibilityLabel={`Continuar con ${nombre}`}
                  onPress={async () => {
                    if (!(await entrarCon(quien))) setQuePaso(SIN_PROVEEDOR(nombre));
                  }}
                  style={({ pressed }) => [
                    estilos.otro,
                    pressed && { backgroundColor: color.sand100 },
                  ]}
                >
                  <Text style={estilos.otroTexto}>{nombre}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Crear una cuenta"
              onPress={() => router.push('/(cuenta)/registro')}
              style={[estilos.zonaCrear, zonaDeToque]}
            >
              <Text style={estilos.crear}>
                {'¿Primera vez en Partimos? '}
                <Text style={estilos.crearFuerte}>Crear cuenta</Text>
              </Text>
            </Pressable>
          </View>

          <Text style={estilos.legal}>
            {'Al continuar aceptas nuestros '}
            <Text style={estilos.legalEnlace}>términos de uso</Text>
            {' y la '}
            <Text style={estilos.legalEnlace}>política de privacidad</Text>
            {'.'}
          </Text>

          <View style={estilos.protegido}>
            <Escudo tamano={14} tinta="rgba(255,255,255,.86)" />
            <Text style={estilos.protegidoTexto}>Tus datos están protegidos</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#2A0A12',
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  desplazable: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: espacio.gutter,
    paddingTop: 30,
    paddingBottom: 26,
  },

  marca: { alignItems: 'center', gap: 9, paddingBottom: 24 },
  nombre: {
    fontSize: 27,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: 27 * 0.06,
    textTransform: 'uppercase',
    color: '#fff',
    fontFamily: familia,
  },
  lema: {
    textAlign: 'center',
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '500',
    color: 'rgba(255,255,255,.94)',
    fontFamily: familia,
  },

  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 26,
    padding: 20,
    shadowColor: '#1C0A10',
    shadowOpacity: 0.34,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  titulo: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.63,
    color: color.ink900,
    fontFamily: familia,
  },
  bajada: {
    fontSize: 13.5,
    lineHeight: 19.575,
    color: color.ink600,
    marginTop: 5,
    fontFamily: familia,
  },

  campos: { gap: 13, marginTop: 18 },

  olvide: { alignSelf: 'flex-start', marginTop: 2 },
  olvideTexto: {
    fontSize: 13,
    lineHeight: 18.85,
    fontWeight: '600',
    color: color.azul500,
    fontFamily: familia,
  },

  separador: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  raya: { flex: 1, height: 1, backgroundColor: color.bordeSutil },
  oTexto: {
    fontSize: 11.5,
    lineHeight: interlinea(11.5),
    fontWeight: '600',
    letterSpacing: 11.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
  },

  otros: { flexDirection: 'row', gap: 10, marginTop: 16 },
  otro: {
    flex: 1,
    height: espacio.control,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otroTexto: {
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '600',
    letterSpacing: -0.15,
    color: color.ink900,
    fontFamily: familia,
  },

  zonaCrear: { alignItems: 'center', marginTop: 16 },
  crear: {
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: 19.575,
    color: color.ink600,
    fontFamily: familia,
  },
  crearFuerte: { fontWeight: '700', color: color.rojo600 },

  legal: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,.86)',
    marginTop: 18,
    fontFamily: familia,
  },
  legalEnlace: { fontWeight: '600', color: '#fff', textDecorationLine: 'underline' },

  protegido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
  },
  protegidoTexto: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,.86)',
    fontFamily: familia,
  },
});
