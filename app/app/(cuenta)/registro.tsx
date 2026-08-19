/**
 * `4b` `4c` `4d` Registro — correo, contraseña y nombre.
 *
 * Los tres pasos del traspaso, en una sola ruta con el paso en el parámetro,
 * porque el número escrito en el primero es lo que el segundo verifica.
 *
 * El diseño dibuja el teclado del sistema al pie para enseñar la pantalla con
 * el teclado subido. Aquí no se dibuja: se usa el teclado de verdad del
 * teléfono, que es el que va a salir.
 */

import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  QUE_PASO,
  contrasenaValida,
  correoValido,
  inicialDelApellido,
  registrarse,
} from '@/servicios/cuenta';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Campo } from '@/ui/Campo';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

type Paso = 1 | 2 | 3;

export default function Registro() {
  const router = useRouter();
  const params = useLocalSearchParams<{ correo?: string; paso?: string; viaje?: string }>();

  const [paso, setPaso] = useState<Paso>((Number(params.paso) as Paso) || 1);
  const [correo, setCorreo] = useState(params.correo ?? '');
  const [clave, setClave] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  /**
   * La cuenta se crea en el último paso, no en el primero: hasta que no hay
   * nombre no hay nada que guardar, y así nadie deja a medias una cuenta que
   * ya existe.
   */
  const crear = async () => {
    if (creando) return;
    setCreando(true);
    setError(null);
    const r = await registrarse(correo, clave, nombre, apellido);
    setCreando(false);

    if (!r.ok) {
      setError(QUE_PASO[r.motivo]);
      // Un correo ya registrado o mal escrito se arregla en el primer paso.
      if (r.motivo === 'ya-existe' || r.motivo === 'correo-invalido') setPaso(1);
      return;
    }

    // Sin sesión hay un correo de confirmación esperando: decirlo, y no dejar
    // a alguien mirando una pantalla que no avanza.
    if (!r.dentro) {
      setError('Cuenta creada. Confirma el correo que acabamos de enviarte y entra.');
      return;
    }

    router.replace(
      params.viaje
        ? { pathname: '/(pasajero)/reservar', params: { viaje: params.viaje } }
        : '/(pasajero)',
    );
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        {/* El paso va a la derecha del botón de atrás, en la misma fila: es
            una marca de sitio, no un título. */}
        <View style={estilos.filaSuperior}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => (paso === 1 ? router.back() : setPaso((p) => (p - 1) as Paso))}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>{`Paso ${paso} de 3`}</Text>
        </View>
        <Text style={estilos.titular}>
          {paso === 1 ? 'Tu ' : paso === 2 ? 'Elige una ' : '¿Cómo te '}
          <Text style={estilos.titularFuerte}>
            {paso === 1 ? 'correo' : paso === 2 ? 'contraseña' : 'llamas?'}
          </Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          {paso === 1 ? (
            <PasoCorreo
              correo={correo}
              alEscribir={(v) => { setCorreo(v); setError(null); }}
              error={error}
              alSeguir={() => correoValido(correo) && setPaso(2)}
            />
          ) : paso === 2 ? (
            <PasoContrasena
              clave={clave}
              alEscribir={(v) => { setClave(v); setError(null); }}
              error={error}
              alSeguir={() => contrasenaValida(clave) && setPaso(3)}
            />
          ) : (
            <PasoNombre
              nombre={nombre}
              apellido={apellido}
              alEscribirNombre={setNombre}
              alEscribirApellido={setApellido}
              error={error}
              creando={creando}
              alCrear={crear}
            />
          )}
        </View>

        {paso === 3 ? (
          <View style={estilos.loQueSigue}>
            <Text style={estilos.loQueSigueTitulo}>Lo que sigue</Text>
            <Paso numero="1" texto="Pides tu puesto y el conductor acepta" />
            <Paso numero="2" texto="Verificas tu cédula cuando quieras publicar" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------ pasos */

function PasoCorreo({
  correo,
  alEscribir,
  error,
  alSeguir,
}: {
  correo: string;
  alEscribir: (v: string) => void;
  error: string | null;
  alSeguir: () => void;
}) {
  return (
    <>
      <Campo
        etiqueta="Correo"
        valor={correo}
        alEscribir={alEscribir}
        marcador="tu@correo.com"
        correo
        mal={!!error}
        alTerminar={alSeguir}
      />
      {error ? <Text style={estilos.malo}>{error}</Text> : null}
      <Text style={estilos.ayuda}>Aquí te llega la confirmación y nada más.</Text>
      <View style={{ marginTop: 18 }}>
        <Boton tono="azul" desactivado={!correoValido(correo)} alPulsar={alSeguir}>
          Seguir
        </Boton>
      </View>
    </>
  );
}

function PasoContrasena({
  clave,
  alEscribir,
  error,
  alSeguir,
}: {
  clave: string;
  alEscribir: (v: string) => void;
  error: string | null;
  alSeguir: () => void;
}) {
  return (
    <>
      <Campo
        etiqueta="Contraseña"
        valor={clave}
        alEscribir={alEscribir}
        marcador="Al menos 6 caracteres"
        secreto
        mal={!!error}
        alTerminar={alSeguir}
      />
      {error ? <Text style={estilos.malo}>{error}</Text> : null}
      <Text style={estilos.ayuda}>Seis caracteres o más. No hace falta que sea rara.</Text>
      <View style={{ marginTop: 18 }}>
        <Boton tono="azul" desactivado={!contrasenaValida(clave)} alPulsar={alSeguir}>
          Seguir
        </Boton>
      </View>
    </>
  );
}

function PasoNombre({
  nombre,
  apellido,
  alEscribirNombre,
  alEscribirApellido,
  error,
  creando,
  alCrear,
}: {
  nombre: string;
  apellido: string;
  alEscribirNombre: (v: string) => void;
  alEscribirApellido: (v: string) => void;
  error: string | null;
  creando: boolean;
  alCrear: () => void;
}) {
  const inicial = inicialDelApellido(apellido);
  return (
    <>
      <View style={{ gap: 9 }}>
        <View style={estilos.campo}>
          <TextInput
            accessibilityLabel="Tu nombre"
            value={nombre}
            onChangeText={alEscribirNombre}
            placeholder="Nombre"
            placeholderTextColor={color.ink400}
            style={estilos.entradaGrande}
          />
        </View>
        <View style={estilos.campo}>
          <TextInput
            accessibilityLabel="Tu apellido"
            value={apellido}
            onChangeText={alEscribirApellido}
            placeholder="Apellido"
            placeholderTextColor={color.ink400}
            style={estilos.entradaGrande}
          />
        </View>
      </View>

      <Text style={estilos.ayuda}>
        {inicial
          ? `En público se te verá como ${nombre.trim() || 'tu nombre'} ${inicial} — nunca el apellido completo.`
          : 'En público solo se ve tu nombre y la inicial del apellido — nunca el apellido completo.'}
      </Text>

      {error ? <Text style={estilos.malo}>{error}</Text> : null}

      <View style={{ marginTop: 18 }}>
        <Boton
          tono="azul"
          desactivado={!nombre.trim() || !apellido.trim() || creando}
          alPulsar={alCrear}
        >
          Crear mi cuenta
        </Boton>
      </View>
      <Text style={estilos.legal}>
        Al crear la cuenta aceptas los términos y el aviso de privacidad.
      </Text>
    </>
  );
}

function Paso({ numero, texto }: { numero: string; texto: string }) {
  return (
    <View style={estilos.filaPaso}>
      <View style={estilos.numeroPaso}>
        <Text style={estilos.numeroPasoTexto}>{numero}</Text>
      </View>
      <Text style={estilos.textoPaso}>{texto}</Text>
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

  malo: {
    fontFamily: familia,
    fontSize: 13,
    lineHeight: 18.85,
    color: color.rojo500,
    marginTop: 10,
  },

  cabecera: { paddingHorizontal: espacio.gutter },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  epigrafeCampo: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 30,
    lineHeight: 31.8,
    letterSpacing: -1.35,
    fontWeight: '400',
    color: '#fff',
    marginTop: 14,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
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
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefijoTexto: { fontSize: 16, lineHeight: 23.2, fontWeight: '500', color: color.ink700, fontFamily: familia },
  campo: {
    flex: 1,
    height: 58,
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.control,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  entradaGrande: {
    fontSize: 18, lineHeight: 26.1,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
    outlineStyle: 'none',
  } as never,
  ayuda: { fontSize: 13.5, lineHeight: 20, color: color.ink600, marginTop: 16, fontFamily: familia },
  ayudaCorta: { flex: 1, fontSize: 13.5, lineHeight: 19.57, color: color.ink600, fontFamily: familia, ...tabular },
  legal: { fontSize: 12.5, lineHeight: 18.125, color: color.ink500, marginTop: 12, textAlign: 'center', fontFamily: familia },

  casillas: { flexDirection: 'row', gap: 10 },
  casilla: {
    flex: 1,
    height: 74,
    borderRadius: radio.cuadrado,
    borderWidth: 1.5,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaTexto: {
    fontSize: 34, lineHeight: 49.3,
    fontWeight: '600',
    letterSpacing: -1.02,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  cursor: { width: 2, height: 30, backgroundColor: color.rojo500 },
  entradaInvisible: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  error: { marginTop: 12, fontSize: 12.5, lineHeight: 18.125, color: color.rojo700, fontFamily: familia },

  filaReenvio: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  enlace: { fontSize: 13.5, lineHeight: 19.57, fontWeight: '600', color: color.azul700, fontFamily: familia },
  reenviar: { fontSize: 13.5, lineHeight: 19.57, color: color.ink500, marginTop: 10, fontFamily: familia, ...tabular },

  loQueSigue: { marginTop: 16, gap: 10 },
  loQueSigueTitulo: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul500,
    fontFamily: familia,
  },
  filaPaso: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  numeroPaso: {
    width: 22,
    height: 22,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroPasoTexto: { fontSize: 12, lineHeight: 17.4, fontWeight: '600', color: color.azul700, fontFamily: familia },
  textoPaso: { flex: 1, fontSize: 13.5, lineHeight: 19, color: color.ink700, fontFamily: familia },
});
