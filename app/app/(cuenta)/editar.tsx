/**
 * `6b` Editar perfil — lo que el otro lee antes de subirse, en tus palabras.
 *
 * **Por qué existe** (31-08-2026, pedido del dueño). El perfil enseñaba
 * nombre, foto y ciudad y no había forma de cambiar ninguno: el nombre se
 * ponía al registrarse y ahí se quedaba para siempre. La ciudad sí se podía
 * tocar, pero escondida dentro de Ajustes, con el rótulo «Salgo de».
 *
 * **Se abre tocando la cabecera del perfil**, no con una fila «Editar perfil»
 * aparte: tocar tu propia foto para cambiarla es el gesto que ya tiene
 * cualquiera aprendido, y una fila más en la lista era una fila más.
 *
 * **Sólo hay campos que existen de verdad.** `profiles` tiene `first_name`,
 * `last_initial`, `bio`, `home_city_id` y `phone`; no hay dónde subir una
 * foto todavía, así que no se dibuja una fila «Foto» que no guardaría nada —
 * un control muerto es el primer defecto de la lista de `REVISION.md`.
 *
 * **El apellido va como INICIAL**, y el campo lo dice. En público nunca se
 * enseña entero: quien escriba «Pérez» ve «P.» al volver, y eso no puede ser
 * una sorpresa (`perfiles.comoInicial`).
 *
 * **El teléfono se enseña y no se toca.** Está verificado; cambiarlo es
 * volver a verificarlo, y ese camino no existe. Decirlo es mejor que
 * esconderlo: quien lo busca ya sabe dónde no está.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useDecir } from '@/ui/Nota';
import { useVolver } from '@/ui/salidas';

import { type Cuenta, cuenta } from '@/servicios/ajustes';
import { type MiCiudad, guardarMiCiudad, miCiudad } from '@/servicios/miCiudad';
import { comoInicial, guardarMiPerfil } from '@/servicios/perfiles';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { ElegirCiudad } from '@/ui/ElegirCiudad';
import { Boton, Epigrafe } from '@/ui/controles';
import { Atras, Avanza, Pin } from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

/** Lo que cabe en una presentación. Más que esto ya no lo lee nadie. */
const BIO_MAXIMO = 200;

export default function EditarPerfil() {
  const router = useRouter();
  const volver = useVolver('/(cuenta)/cuenta');
  const decir = useDecir();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);

  const [datos, setDatos] = useState<Cuenta | null>(null);
  const [ciudad, setCiudad] = useState<MiCiudad | null>(null);
  const [eligiendoCiudad, setEligiendoCiudad] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [bio, setBio] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!yo) return;
    cuenta(yo).then((c) => {
      setDatos(c);
      setNombre(c.nombre);
      setApellido(c.apellido);
      setBio(c.bio);
    });
    miCiudad(yo).then(setCiudad);
  }, [yo]);

  if (!datos) return <Cargando />;

  const nombreLimpio = nombre.trim();
  /* Sin nombre no hay perfil que enseñar: es lo único obligatorio de esta
     pantalla, y por eso el botón lo dice en vez de fallar al pulsarlo. */
  const falta = nombreLimpio.length === 0;

  const guardar = async () => {
    if (!yo || falta || guardando) return;
    setGuardando(true);
    try {
      await guardarMiPerfil(yo, { nombre: nombreLimpio, apellido, bio });
      decir('Guardado.');
      router.replace('/(cuenta)/cuenta');
    } catch {
      decir('No se pudo guardar. Prueba otra vez.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <CampoRojo altura={196} />

        <View style={estilos.cabecera}>
          <View style={estilos.filaSuperior}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atrás"
              onPress={() => volver()}
              style={estilos.circulo}
            >
              <Atras />
            </Pressable>
            <Text style={estilos.epigrafeCampo}>Mi perfil</Text>
          </View>
          <Text style={estilos.titular}>Editar perfil</Text>
          <Text style={estilos.bajada}>Esto es lo que lee el otro antes de subirse contigo.</Text>
        </View>

        <View style={estilos.cuerpo}>
          <View style={estilos.tarjeta}>
            <Epigrafe>Cómo te llamas</Epigrafe>

            <View style={estilos.campo}>
              <Text style={estilos.rotulo}>Nombre</Text>
              <TextInput
                accessibilityLabel="Tu nombre"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Andrés"
                placeholderTextColor={color.ink400}
                style={estilos.entrada}
              />
            </View>

            <View style={estilos.filete} />

            <View style={estilos.campo}>
              {/* El rótulo dice la regla ANTES de escribir, no después de
                  guardar: «Pérez» se guarda como «P.» y verlo aparecer sin
                  aviso parecería que la app se comió el apellido. */}
              <Text style={estilos.rotulo}>Apellido · sólo la inicial</Text>
              <TextInput
                accessibilityLabel="La inicial de tu apellido"
                value={apellido}
                onChangeText={setApellido}
                placeholder="P."
                placeholderTextColor={color.ink400}
                style={estilos.entrada}
              />
              {apellido.trim().length > 2 ? (
                <Text style={estilos.pista}>
                  {`En público se verá «${comoInicial(apellido)}».`}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={estilos.tarjeta}>
            <Epigrafe>Tu presentación</Epigrafe>
            <TextInput
              accessibilityLabel="Tu presentación"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={BIO_MAXIMO}
              placeholder="Voy a Chitré casi todos los fines de semana. Manejo tranquilo y con música baja."
              placeholderTextColor={color.ink400}
              style={estilos.bio}
            />
            <Text style={estilos.pista}>
              {bio.trim()
                ? `${BIO_MAXIMO - bio.length} caracteres de sobra.`
                : 'Puedes dejarlo en blanco. Dos líneas bastan para que alguien decida subirse.'}
            </Text>
          </View>

          <View style={estilos.tarjeta}>
            <Epigrafe>De dónde sales</Epigrafe>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Tu ciudad: ${ciudad?.nombre ?? 'sin elegir'}. Cambiar`}
              onPress={() => setEligiendoCiudad(true)}
              style={({ pressed }) => [estilos.fila, pressed && estilos.pulsada]}
            >
              <Pin tamano={17} tinta={color.ink500} />
              <Text style={estilos.filaValor} numberOfLines={1}>
                {ciudad?.nombre ?? 'Elegir mi ciudad'}
              </Text>
              <Avanza />
            </Pressable>
            <Text style={estilos.pista}>
              Con ella te proponemos los viajes que salen de donde vives.
            </Text>
          </View>

          <View style={estilos.tarjeta}>
            <Epigrafe>Tu teléfono</Epigrafe>
            {/* SE ENSEÑA Y NO SE TOCA. Está verificado; cambiarlo sería volver
                a verificarlo, y ese camino no existe todavía. Decir dónde NO
                se cambia ahorra el paseo de buscarlo por toda la app. */}
            <Text style={estilos.telefono}>{datos.telefono ?? 'Sin teléfono'}</Text>
            <Text style={estilos.pista}>
              Nadie lo ve: sirve para avisarte y para verificarte. Para cambiarlo, escríbenos
              desde Ayuda.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton desactivado={falta || guardando} alPulsar={guardar}>
          {falta ? 'Escribe tu nombre' : guardando ? 'Guardando…' : 'Guardar'}
        </Boton>
      </View>

      <ElegirCiudad
        abierto={eligiendoCiudad}
        yo={yo}
        actual={ciudad}
        alElegir={(c) => {
          setCiudad(c);
          setEligiendoCiudad(false);
          if (yo) guardarMiCiudad(yo, c.id).catch(() => decir('No se pudo guardar la ciudad.'));
        }}
        alCerrar={() => setEligiendoCiudad(false)}
      />
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
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.84,
    color: color.ink900,
    fontFamily: familia,
    marginTop: 12,
  },
  bajada: {
    fontSize: 13.5,
    lineHeight: 19,
    color: color.campoTexto,
    fontFamily: familia,
    marginTop: 6,
  },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 140 },
  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 12,
  },

  campo: { marginTop: 10 },
  rotulo: { fontSize: 12.5, lineHeight: 17, color: color.ink600, fontFamily: familia },
  entrada: {
    marginTop: 2,
    /* 16 o más: por debajo, Safari acerca la página al enfocar el campo. */
    fontSize: 16,
    lineHeight: 23,
    color: color.ink900,
    fontFamily: familia,
    outlineStyle: 'none',
  } as never,
  filete: { height: 1, backgroundColor: color.bordeSutil, marginTop: 12 },

  bio: {
    marginTop: 10,
    minHeight: 92,
    padding: 12,
    borderRadius: radio.control,
    backgroundColor: color.sand100,
    fontSize: 16,
    lineHeight: 23,
    color: color.ink900,
    fontFamily: familia,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  } as never,

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 44,
    marginTop: 8,
  },
  pulsada: { backgroundColor: color.lavado },
  filaValor: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  telefono: {
    marginTop: 8,
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  pista: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: interlinea(12),
    color: color.ink600,
    fontFamily: familia,
  },

  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espacio.gutter,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
});
