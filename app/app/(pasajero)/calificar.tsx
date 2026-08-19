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

import { useRouter } from 'expo-router';

import { ATAJOS, type Atajo, calificar, prepararCalificacion, type Calificacion } from '@/servicios/calificaciones';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Boton } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { diaLargo } from '@/ui/fechas';
import { EstrellaGrande } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

// Una reserva que ya abordó: sin viaje que pasó no hay nada que calificar.
const RESERVA = '77777777-7777-4777-8777-777777777711';

const EN_LETRA = ['', 'Una estrella', 'Dos estrellas', 'Tres estrellas', 'Cuatro estrellas', 'Cinco estrellas'];

export default function Calificar() {
  const router = useRouter();
  const [datos, setDatos] = useState<Calificacion | null>(null);
  const [estrellas, setEstrellas] = useState(4);
  const [elegidos, setElegidos] = useState<Atajo[]>(['puntual', 'manejo']);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    prepararCalificacion(RESERVA).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  const alternar = (a: Atajo) =>
    setElegidos((e) => (e.includes(a) ? e.filter((x) => x !== a) : [...e, a]));

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.hoja}>
          <View style={estilos.filaPersona}>
            <Avatar nombre={datos.otro} tono="rojo" />
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
            {ATAJOS.map((a) => {
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
      </ScrollView>

      <View style={estilos.pie}>
        <Boton
          alPulsar={async () => {
            await calificar(RESERVA, estrellas, elegidos, comentario);
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
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: espacio.gutter },
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
    fontSize: 29,
    lineHeight: 31.9,
    letterSpacing: -1.16,
    fontWeight: '400',
    color: '#fff',
    marginTop: 11,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 12 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingVertical: 24,
    paddingHorizontal: 22,
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
    fontSize: 16.5,
    lineHeight: interlinea(16.5),
    fontWeight: '500',
    letterSpacing: -0.33,
    color: color.ink900,
    fontFamily: familia,
  },
  contexto: { fontSize: 13.5, lineHeight: interlinea(13.5), color: color.ink600, fontFamily: familia, ...tabular },

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
    color: color.ink600,
    marginBottom: 20,
    fontFamily: familia,
  },

  atajos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  atajo: {
    height: 36,
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
    fontSize: 14.5,
    lineHeight: 21.02,
    color: color.ink900,
    fontFamily: familia,
    outlineStyle: 'none',
  } as never,

  pie: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30, gap: 10 },
});
