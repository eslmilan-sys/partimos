/**
 * Entrar — la estructura del `10c` del canevas, con la paleta v6.
 *
 * **La foto del atardecer se fue con el sistema anterior.** El usuario pidió
 * las pantallas de entrada tal como las dibuja el archivo de diseño: fondo
 * claro, la teja roja con la marca, «Bienvenido a Partimos», lo social
 * primero — porque es el camino sin fricción —, el correo después, y abajo
 * lo legal con la puerta a crear cuenta.
 *
 * **Google y Apple, no Facebook.** El canevas dibuja Facebook, pero el único
 * OAuth cableado en `servicios/cuenta.ts` es `entrarCon('google' | 'apple')`.
 * Un botón que no lleva a ningún sitio es un control muerto — la clase de
 * defecto que `app/README.md` cuenta uno a uno — así que se dibujan los dos
 * que funcionan.
 *
 * **Correo y contraseña**, no el código que dibuja el canevas: no hay
 * proveedor de SMS contratado y las cuentas que existen son de correo. Es la
 * divergencia asumida de `CLAUDE.md`; el motivo entero está en
 * `servicios/cuenta.ts`.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

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
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { Marca } from '@/ui/iconos';
import { color, espacio, familia, pulsado, radio, zonaDeToque } from '@/ui/tokens';

/* ---------------------------------------------------------------- Glifos */

function Sobre({ tinta = color.ink400 }: { tinta?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path d="M3.5 6.5h17v11h-17z" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M3.5 7l8.5 6 8.5-6" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

function Candado({ tinta = color.ink400 }: { tinta?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path d="M5.5 10.5h13v9h-13z" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M8.5 10.5V7.8a3.5 3.5 0 017 0v2.7" stroke={tinta} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/** La G de Google, en sus cuatro colores oficiales. */
function LogoGoogle() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        d="M19.6 10.23c0-.68-.06-1.36-.18-2.03H10v3.85h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.34Z"
        fill="#4285F4"
      />
      <Path
        d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.24-2.51c-.9.61-2.05.96-3.38.96-2.6 0-4.8-1.75-5.59-4.1H1.07v2.59A10 10 0 0 0 10 20Z"
        fill="#34A853"
      />
      <Path d="M4.41 11.93a5.99 5.99 0 0 1 0-3.83V5.5H1.07a10 10 0 0 0 0 9l3.34-2.57Z" fill="#FBBC05" />
      <Path
        d="M10 3.98c1.47 0 2.79.5 3.82 1.5l2.87-2.87A10 10 0 0 0 1.07 5.5l3.34 2.6C5.2 5.73 7.4 3.98 10 3.98Z"
        fill="#EA4335"
      />
    </Svg>
  );
}

/**
 * La manzana, negra, para el botón blanco. La versión clara del botón de
 * Apple es oficial de sus guías — y así la única losa oscura de la pantalla
 * deja de competir con el CTA: en el v6 la superficie de tinta es de
 * Filtros y de Publicar, no de un proveedor.
 */
function LogoApple() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M13.9 10.6c0-2 1.6-3 1.7-3-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.5 2 1 0 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.8-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.1ZM11.9 4.4c.5-.7.9-1.6.8-2.6-.8 0-1.7.6-2.3 1.2-.5.6-.9 1.6-.8 2.5.9.1 1.8-.4 2.3-1.1Z"
        fill="#000"
      />
    </Svg>
  );
}

/* -------------------------------------------------------------- Pantalla */

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
      <CampoRojo altura={320} />

      <BarraDeEstado />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.desplazable}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* La teja de la marca, el saludo y su bajada — el bloque del 10c. */}
        <View style={estilos.cabecera}>
          <View style={estilos.teja}>
            <Marca tamano={27} tinta="#fff" />
          </View>
          <Text style={estilos.titulo}>
            {'Bienvenido a'}
            {'\n'}
            <Text style={estilos.tituloFuerte}>Partimos</Text>
          </Text>
          <Text style={estilos.bajada}>Entra para reservar tu puesto o publicar tu viaje.</Text>
        </View>

        {/* Lo social primero: los dos proveedores que de verdad funcionan. */}
        <View style={estilos.sociales}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continuar con Google"
            onPress={async () => {
              if (!(await entrarCon('google'))) setQuePaso(SIN_PROVEEDOR('Google'));
            }}
            style={({ pressed }) => [estilos.social, pressed && pulsado.boton]}
          >
            <LogoGoogle />
            <Text style={estilos.socialTexto}>Continuar con Google</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continuar con Apple"
            onPress={async () => {
              if (!(await entrarCon('apple'))) setQuePaso(SIN_PROVEEDOR('Apple'));
            }}
            style={({ pressed }) => [estilos.social, pressed && pulsado.boton]}
          >
            <LogoApple />
            <Text style={estilos.socialTexto}>Continuar con Apple</Text>
          </Pressable>
        </View>

        <View style={estilos.separador}>
          <View style={estilos.raya} />
          <Text style={estilos.oTexto}>O con correo</Text>
          <View style={estilos.raya} />
        </View>

        <View style={estilos.campos}>
          <Campo
            etiqueta="Correo"
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Olvidé mi contraseña"
            onPress={() => router.push('/(ayuda)')}
            style={[estilos.olvide, zonaDeToque]}
          >
            <Text style={estilos.olvideTexto}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          {quePaso ? <Aviso>{quePaso}</Aviso> : null}

          <Boton desactivado={!listo || entrando} alPulsar={enviar}>
            {entrando ? 'Entrando…' : 'Iniciar sesión'}
          </Boton>
        </View>

        {/* La acción antes que la nota al pie: crear cuenta es una puerta,
            lo legal es una letra pequeña. */}
        <View style={estilos.pie}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear una cuenta"
            onPress={() => router.push('/(cuenta)/registro')}
            style={zonaDeToque}
          >
            <Text style={estilos.crear}>
              {'¿No tienes cuenta? '}
              <Text style={estilos.crearFuerte}>Regístrate</Text>
            </Text>
          </Pressable>
          <Text style={estilos.legal}>
            {'Al continuar aceptas los '}
            <Text style={estilos.legalFuerte}>Términos</Text>
            {' y la '}
            <Text style={estilos.legalFuerte}>Política de privacidad</Text>
            {'.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.blanco,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },
  desplazable: { paddingBottom: 24 },

  cabecera: { paddingTop: 24, paddingHorizontal: espacio.gutter, gap: 12 },
  /** La teja de 52 al radio 14 — la celda de icono del v6 — roja, con la marca en blanco. */
  teja: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Dos tintas: el saludo velado, la marca en tinta plena. */
  titulo: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '700',
    letterSpacing: -0.84,
    color: color.ink400,
    fontFamily: familia,
  },
  tituloFuerte: { color: color.ink900 },
  bajada: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: color.ink500, fontFamily: familia },

  sociales: { paddingTop: 20, paddingHorizontal: espacio.gutter, gap: 10 },
  social: {
    height: 52,
    borderRadius: 18,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialTexto: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.15,
    color: color.ink900,
    fontFamily: familia,
  },

  separador: {
    paddingTop: 20,
    paddingHorizontal: espacio.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  raya: { flex: 1, height: 1, backgroundColor: color.ink200 },
  oTexto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },

  campos: { paddingTop: 20, paddingHorizontal: espacio.gutter, gap: 14 },
  olvide: { alignSelf: 'flex-end' },
  olvideTexto: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.rojo700,
    fontFamily: familia,
  },

  pie: { paddingTop: 20, paddingHorizontal: espacio.gutter, gap: 10, alignItems: 'center' },
  legal: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
    color: color.ink600,
    textAlign: 'center',
    fontFamily: familia,
  },
  legalFuerte: { color: color.ink900, fontWeight: '500' },
  crear: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: color.ink500, fontFamily: familia },
  crearFuerte: { color: color.rojo600, fontWeight: '600' },
});
