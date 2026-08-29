/**
 * Entrar — la estructura del `10c` del canevas, con la paleta v6.
 *
 * **La foto del atardecer se fue con el sistema anterior.** El usuario pidió
 * las pantallas de entrada tal como las dibuja el archivo de diseño: fondo
 * claro, la teja roja con la marca, «Bienvenido a Partimos» — y desde el
 * 25-08, EL CORREO PRIMERO y lo social debajo del separador: el dueño trajo
 * el patrón de referencia y todas las cuentas reales son de correo, así que
 * el camino más usado va arriba. Abajo lo legal con la puerta a crear
 * cuenta. «Recordarme» guarda el correo en este navegador (solo el correo,
 * nunca la contraseña) y lo deja puesto la próxima vez.
 *
 * **Google, Facebook y Apple.** Facebook estuvo fuera a propósito —su botón
 * no llevaba a ningún sitio, y un control muerto es la clase de defecto que
 * `app/README.md` cuenta uno a uno— hasta que el dueño lo pidió y se cableó
 * de verdad (26-08-2026). Los tres pasan por `entrarCon`: si el proveedor
 * no está activado en Supabase, la pantalla lo dice en vez de quedarse
 * quieta.
 *
 * **Correo y contraseña**, no el código que dibuja el canevas: no hay
 * proveedor de SMS contratado y las cuentas que existen son de correo. Es la
 * divergencia asumida de `CLAUDE.md`; el motivo entero está en
 * `servicios/cuenta.ts`.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import {
  QUE_PASO,
  contrasenaValida,
  correoValido,
  entrar as entrarConCuenta,
} from '@/servicios/cuenta';
import { Aviso } from '@/ui/Aviso';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Campo } from '@/ui/Campo';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { EntrarCon } from '@/ui/EntrarCon';
import { Marca } from '@/ui/iconos';
import { color, espacio, familia, pulsado, radio, zonaDeToque } from '@/ui/tokens';

/** Dónde vive el correo recordado en este navegador. */
const RECUERDO = 'partimos.correo.recordado';

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

function Palomita() {
  return (
    <Svg viewBox="0 0 12 12" width={11} height={11} fill="none">
      <Path d="M2 6.2 4.8 9 10 3.4" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
  const [recordar, setRecordar] = useState(false);

  /* El correo recordado se pone solo al abrir. SOLO el correo: la
     contraseña no se guarda nunca — recordarla en claro sería regalarla. */
  useEffect(() => {
    try {
      const guardado = globalThis.localStorage?.getItem(RECUERDO);
      if (guardado) {
        setCorreo(guardado);
        setRecordar(true);
      }
    } catch {
      /* sin almacén no hay recuerdo, y no pasa nada */
    }
  }, []);

  const listo = correoValido(correo) && contrasenaValida(clave);

  const enviar = async () => {
    if (!listo || entrando) return;
    setEntrando(true);
    setQuePaso(null);
    const r = await entrarConCuenta(correo, clave);
    setEntrando(false);
    if (r.ok) {
      try {
        if (recordar) globalThis.localStorage?.setItem(RECUERDO, correo.trim());
        else globalThis.localStorage?.removeItem(RECUERDO);
      } catch {
        /* nada */
      }
      router.replace('/(pasajero)');
    } else setQuePaso(QUE_PASO[r.motivo]);
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

        {/* El correo primero: es el camino de todas las cuentas reales. */}
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

          {/* Recordarme a la izquierda, el olvido a la derecha: la fila
              entera es de la contraseña que acaba de pasar. */}
          <View style={estilos.filaRecuerdo}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: recordar }}
              accessibilityLabel="Recordar mi correo en este navegador"
              onPress={() => setRecordar((v) => !v)}
              style={[estilos.recuerdo, zonaDeToque]}
            >
              <View style={[estilos.casilla, recordar && estilos.casillaMarcada]}>
                {recordar ? <Palomita /> : null}
              </View>
              <Text style={estilos.recuerdoTexto}>Recordarme</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Olvidé mi contraseña"
              onPress={() => router.push('/(ayuda)')}
              style={zonaDeToque}
            >
              <Text style={estilos.olvideTexto}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </View>

          {quePaso ? <Aviso>{quePaso}</Aviso> : null}

          <Boton desactivado={!listo || entrando} alPulsar={enviar}>
            {entrando ? 'Entrando…' : 'Iniciar sesión'}
          </Boton>
        </View>

        <EntrarCon alFallar={setQuePaso} />

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
  bajada: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: color.ink600, fontFamily: familia },


  campos: { paddingTop: 20, paddingHorizontal: espacio.gutter, gap: 14 },

  filaRecuerdo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  recuerdo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  /** La casilla marcada es roja como el interruptor encendido: mismo verbo. */
  casilla: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: color.ink200,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaMarcada: { backgroundColor: color.rojo500, borderColor: color.rojo500 },
  recuerdoTexto: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
  },
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
    color: color.ink500,
    textAlign: 'center',
    fontFamily: familia,
  },
  legalFuerte: { color: color.ink900, fontWeight: '500' },
  crear: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: color.ink600, fontFamily: familia },
  crearFuerte: { color: color.rojo600, fontWeight: '600' },
});
