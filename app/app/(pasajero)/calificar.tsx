/**
 * `1j` Calificar — una pregunta y cuatro atajos.
 *
 * Las estrellas dan la nota; los atajos dicen por qué, para que la reseña sirva
 * de algo al siguiente pasajero sin obligar a escribir. El texto es opcional.
 *
 * Los atajos se guardan en las notas por eje que ya tiene `reviews`
 * (`puntualidad`, `manejo`, `trato`, `carro`, `encuentro`).
 *
 * Aquí nos apartamos del traspaso a propósito: el diseño pinta «Ahora no» de
 * rojo sólido y «Enviar calificación» de azul, y eso deja el botón más fuerte
 * de la pantalla en la salida. Rojo es lo que se toca para seguir adelante,
 * así que enviar es rojo y la salida va en texto pleno.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { type Atajo, calificar, prepararCalificacion, type Calificacion } from '@/servicios/calificaciones';
import { useMiId } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { NoEsta } from '@/ui/NoEsta';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Boton } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { diaLargo } from '@/ui/fechas';
import { EstrellaGrande } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

// Una reserva que ya abordó: sin viaje que pasó no hay nada que calificar.
/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, la del traspaso. */
const DEL_RECORRIDO = '77777777-7777-4777-8777-777777777711';
/** Sin sesión que preguntar —solo en simulado—, JOSÉ: el pasajero de ESA
 *  reserva. Estaba puesta Daniela, que no es parte del viaje del traspaso, y
 *  la pantalla le enseñaba los atajos del lado equivocado. */
const DEL_PASAJERO_DEL_RECORRIDO = 'aaaaaaa1-0000-4000-8000-000000000002';

const EN_LETRA = ['', 'Una estrella', 'Dos estrellas', 'Tres estrellas', 'Cuatro estrellas', 'Cinco estrellas'];

export default function Calificar() {
  const router = useRouter();
  const { reserva } = useLocalSearchParams<{ reserva?: string }>();
  const reservaId = reserva ?? DEL_RECORRIDO;
  const [datos, setDatos] = useState<Calificacion | null>(null);
  /* «Todavía no lo sé» y «no está» no son lo mismo: lo segundo dura para
     siempre, y en blanco no hay ni por dónde salir. */
  const [noEsta, setNoEsta] = useState(false);
  const [estrellas, setEstrellas] = useState(4);
  /**
   * NADA MARCADO DE ENTRADA (28-08-2026). Venía con «puntual» y «manejo»
   * puestos, así que quien enviaba sin tocar nada firmaba dos elogios que no
   * había dicho — y «manejo» ni siquiera existe cuando calificas a un
   * pasajero. Los atajos son de quien califica, no del formulario.
   */
  const [elegidos, setElegidos] = useState<Atajo[]>([]);
  const [comentario, setComentario] = useState('');

  /**
   * **QUIÉN CALIFICA** (28-08-2026). La pantalla nunca pasaba `yo`, así que el
   * servicio daba por hecho que el autor era el PASAJERO: si la abría el
   * conductor para calificar a quien llevó, la reseña se guardaba a nombre del
   * pasajero y contra el conductor — al revés de lo que la persona acababa de
   * escribir.
   */
  const yo = useMiId(DEL_PASAJERO_DEL_RECORRIDO);

  useEffect(() => {
    prepararCalificacion(reservaId, yo ?? undefined)
      .then(setDatos)
      .catch(() => setNoEsta(true));
  }, [reservaId, yo]);

  if (noEsta) return <NoEsta />;
  if (!datos) return <Cargando />;

  const alternar = (a: Atajo) =>
    setElegidos((e) => (e.includes(a) ? e.filter((x) => x !== a) : [...e, a]));

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >

      <CampoRojo altura={196} />

      <View style={estilos.cabecera}>
        <Text style={estilos.epigrafeCampo}>
          {`${diaLargo(datos.cuando)} · ${datos.destino}`}
        </Text>
        <Text style={estilos.titular}>
          {'¿Cómo fue'}
          {'\n'}
          <Text style={estilos.titularFuerte}>{`con ${datos.otro.split(' ')[0]}?`}</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          <View style={estilos.filaPersona}>
            <Avatar nombre={datos.otro} />
            <View style={{ flex: 1 }}>
              <Text style={estilos.nombre}>{datos.otro}</Text>
              <Text style={estilos.contexto}>{`${datos.ruta} · ${datos.duracion}`}</Text>
            </View>
          </View>

          <View style={estilos.estrellas}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={EN_LETRA[n]}
                onPress={() => setEstrellas(n)}
              >
                <EstrellaGrande llena={n <= estrellas} />
              </Pressable>
            ))}
          </View>
          <Text style={estilos.enLetra}>{EN_LETRA[estrellas]}</Text>

          <View style={estilos.atajos}>
            {datos.atajos.map((a) => {
              const activo = elegidos.includes(a.clave);
              return (
                <Pressable
                  key={a.clave}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  accessibilityLabel={a.texto}
                  onPress={() => alternar(a.clave)}
                  style={[
                    estilos.atajo,
                    // El elegido no lleva borde, como en el diseño: por eso mide
                    // dos píxeles menos que el que sigue sin marcar.
                    activo
                      ? { backgroundColor: color.azul100, borderWidth: 0 }
                      : { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.bordePorDefecto },
                  ]}
                >
                  <Text
                    style={[estilos.atajoTexto, { color: activo ? color.azul700 : color.ink700 }]}
                  >
                    {a.texto}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={estilos.campoComentario}>
            <TextInput
              accessibilityLabel="Cuéntale algo al próximo pasajero"
              value={comentario}
              onChangeText={setComentario}
              placeholder="Cuéntale algo al próximo pasajero (opcional)"
              placeholderTextColor={color.ink400}
              multiline
              style={estilos.entradaComentario}
            />
          </View>
        </View>
      </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton
          alPulsar={async () => {
            await calificar(reservaId, estrellas, elegidos, comentario, yo ?? undefined);
            router.replace('/(pasajero)');
          }}
        >
          Enviar calificación
        </Boton>
        <Boton tono="texto" tamano="md" alPulsar={() => router.replace('/(pasajero)')}>
          Ahora no
        </Boton>
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

  cabecera: { paddingHorizontal: espacio.gutter },
  epigrafeCampo: {
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 11, },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 28, paddingBottom: 12 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingVertical: 24,
    paddingHorizontal: espacio.gutter,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  filaPersona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: color.bordeSutil,
  },
  nombre: {
    fontSize: 15.5,
    lineHeight: interlinea(16.5),
    fontWeight: '500',
    letterSpacing: -0.33,
    color: color.ink900,
    fontFamily: familia,
  },
  contexto: { fontSize: 13.5, lineHeight: interlinea(13.5), color: color.ink500, fontFamily: familia, ...tabular },

  estrellas: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingTop: 22,
    paddingBottom: 6,
  },
  enLetra: {
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink500,
    marginBottom: 20,
    fontFamily: familia,
  },

  atajos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  atajo: {
    height: espacio.tap,
    paddingHorizontal: 14,
    borderRadius: radio.pastilla,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atajoTexto: { fontSize: 13.5, lineHeight: interlinea(13.5), fontWeight: '500', fontFamily: familia },

  campoComentario: {
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.control,
    paddingVertical: 15,
    paddingHorizontal: 16,
    minHeight: 84,
  },
  entradaComentario: {
    fontSize: 14,
    lineHeight: 21.02,
    color: color.ink900,
    fontFamily: familia,
    outlineStyle: 'none',
  } as never,

  pie: { paddingHorizontal: espacio.gutter, paddingTop: 18, paddingBottom: 30, gap: 10 },
});
