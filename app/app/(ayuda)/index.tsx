/**
 * `15b` Ayuda — primero tu viaje, después lo que sale mal, y al final las
 * preguntas de siempre.
 *
 * Quien abre la ayuda no viene a leer un centro de soporte: viene de algo que
 * le acaba de pasar. Por eso arriba del todo va **su** viaje —el conductor, la
 * fecha, lo que pagó y por dónde—, y no un buscador: la pantalla empieza donde
 * ya está la cabeza de quien la abre, y sólo ofrece cambiarlo si se equivocó
 * de viaje.
 *
 * Debajo, las cuatro cosas que de verdad salen mal, cada una con una pastilla
 * que dice de antemano qué va a pasar al tocarla: «Reembolso», «Revisamos»,
 * «Ahora». Nadie debería tener que abrir una fila para averiguar si abrirla
 * cuesta algo.
 *
 * La única pastilla roja es la de «Algo pasó en el viaje». Es la que no va de
 * plata y la que no puede esperar; las otras tres son azules porque son cosas
 * que miramos nosotros con calma. Dentro de la hoja blanca el rojo se puede
 * usar como aviso, no como acción.
 *
 * Las preguntas de siempre van al final, en una tarjeta con borde y sin
 * sombra: están, pero no compiten con lo urgente. Y el pie se separa en blanco
 * para que escribirle a una persona siga siendo visible aunque no te
 * reconozcas en ninguna de las siete filas.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { type Href, useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import {
  HORARIO,
  LO_QUE_SALE_MAL,
  PREGUNTAS,
  PROMESA,
  type ViajeDeAyuda,
  viajeDeAyuda,
} from '@/servicios/ayuda';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Boton } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { diaCorto } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, interlinea, radio, sombra, texto, zonaDeToque } from '@/ui/tokens';

// Mientras no haya sesión, el puesto que la pasajera del recorrido tiene
// comprado en el Albrook → Chitré: el viaje del que se viene hablando.
/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, la del traspaso. */
const DEL_RECORRIDO = '77777777-7777-4777-8777-777777777700';

/** La única fila que no va de dinero: la que hay que atender ya. */
const URGENTE = 'incidente';

/** El galón de fila que abre. No está en `@/ui/iconos` y sólo vive aquí. */
function Adelante() {
  return (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path
        d="M9 5l7 7-7 7"
        stroke={color.ink400}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Ayuda sin ningún viaje del que hablar. Casi todo esta pantalla cuelga de
 * un viaje —«sobre un viaje», sus preguntas, su chat—, y sin él no queda
 * nada que enseñar; pero girar no es una respuesta.
 */
function SinViaje({ alVolver, alCuidado }: { alVolver: () => void; alCuidado: () => void }) {
  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />
      <CampoRojo altura={206} />
      <View style={estilos.cabecera}>
        <View style={estilos.filaVolver}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={alVolver}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
        </View>
        <Text style={estilos.titular}>
          {'Aquí te '}
          <Text style={texto.titularFuerte}>ayudamos</Text>
        </Text>
      </View>
      <View style={estilos.vacio}>
        <Text style={estilos.vacioTexto}>
          Todavía no tienes ningún viaje del que hablar. Cuando hagas uno, aquí
          aparecen sus preguntas y desde dónde escribirnos.
        </Text>
        {/* LA ACCIÓN ERA LA EQUIVOCADA. Decía «Ir a mi perfil» —y la prop se
            llamaba `alEscribir`, que era una tercera cosa—: quien abre AYUDA
            sin viaje no viene a mirarse el perfil. Lo único que de verdad
            ayuda sin tener viaje es saber cómo te cuidamos, y esa pantalla
            existe. */}
        <View style={{ marginTop: 18 }}>
          <Boton alPulsar={alCuidado}>Mira cómo te cuidamos</Boton>
        </View>
      </View>
    </View>
  );
}

export default function Ayuda() {
  const router = useRouter();
  const volver = useVolver();
  const { reserva } = useLocalSearchParams<{ reserva?: string }>();
  const reservaId = reserva ?? DEL_RECORRIDO;
  const [viaje, setViaje] = useState<ViajeDeAyuda | null>(null);
  /* «Todavía no sé» y «no hay ninguno» son cosas distintas, y confundirlas
     dejaba la pantalla girando PARA SIEMPRE a quien no tiene viajes — es
     decir, a todo el que acaba de registrarse. Visto el 25-08. */
  const [buscando, setBuscando] = useState(true);

  useEffect(() => {
    let vivo = true;
    setBuscando(true);
    viajeDeAyuda(reservaId).then((v) => {
      if (!vivo) return;
      setViaje(v);
      setBuscando(false);
    });
    return () => {
      vivo = false;
    };
  }, [reservaId]);

  if (buscando) return <Cargando />;
  if (!viaje)
    return <SinViaje alVolver={volver} alCuidado={() => router.push('/(ayuda)/seguridad')} />;

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

      <CampoRojo altura={206} />

      <View style={estilos.cabecera}>
        <View style={estilos.filaVolver}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => volver()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>{HORARIO}</Text>
        </View>
        <Text style={estilos.titular}>
          {'¿Qué '}
          <Text style={texto.titularFuerte}>pasó</Text>
          {'?'}
        </Text>
      </View>

        <View style={estilos.hoja}>
          <Text style={estilos.epigrafeViaje}>Sobre un viaje</Text>

          <View style={estilos.filaViaje}>
            <Avatar nombre={viaje.conductor} tamano={36} />
            <View style={estilos.columnaViaje}>
              <Text style={estilos.destino} numberOfLines={1}>
                {`${viaje.destino} · ${diaCorto(viaje.cuando)}`}
              </Text>
              <Text style={estilos.detalle} numberOfLines={1}>
                {viaje.linea}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar de viaje"
              onPress={() => router.push('/(pasajero)')}
              style={zonaDeToque}
            >
              <Text style={estilos.cambiar}>Cambiar</Text>
            </Pressable>
          </View>

          <View style={estilos.lista}>
            {LO_QUE_SALE_MAL.map((cosa) => {
              const urgente = cosa.clave === URGENTE;
              return (
                <Pressable
                  key={cosa.clave}
                  accessibilityRole="button"
                  accessibilityLabel={`${cosa.titulo}. ${cosa.respuesta}`}
                  onPress={() =>
                    router.push({
                      pathname: cosa.ruta,
                      params: { reserva: viaje.reservaId },
                    } as Href)
                  }
                  style={({ pressed }) => [estilos.fila, pressed && estilos.filaPulsada]}
                >
                  <View style={estilos.filaTituloCaja}>
                    <Text style={estilos.filaTitulo}>{cosa.titulo}</Text>
                  </View>
                  <View style={[estilos.pastilla, urgente && estilos.pastillaUrgente]}>
                    <Text
                      style={[estilos.pastillaTexto, urgente && estilos.pastillaTextoUrgente]}
                    >
                      {cosa.respuesta}
                    </Text>
                  </View>
                  <Adelante />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={estilos.tarjetaPreguntas}>
          <Text style={estilos.epigrafePreguntas}>Preguntas de siempre</Text>
          {PREGUNTAS.map((pregunta, i) => (
            <Pressable
              key={pregunta.titulo}
              accessibilityRole="button"
              accessibilityLabel={pregunta.titulo}
              onPress={() =>
                router.push({
                  pathname: pregunta.ruta,
                  params: { reserva: viaje.reservaId, viaje: viaje.viajeId },
                } as Href)
              }
              // La última no lleva relleno abajo: el padding de la tarjeta ya
              // la separa del borde, y con los dos la fila queda descentrada.
              style={[estilos.filaPregunta, i === PREGUNTAS.length - 1 && { paddingBottom: 0 }]}
            >
              <Text style={estilos.preguntaTexto}>{pregunta.titulo}</Text>
              <Adelante />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        {/* Azul, no rojo: el pie es blanco y esto no es «sigue adelante», es la
            salida de quien no se reconoce en ninguna fila. */}
        <Boton
         
          alPulsar={() =>
            router.push({ pathname: '/(pasajero)/chat', params: { reserva: viaje.reservaId } })
          }
        >
          Escribirle a una persona
        </Boton>
        <Text style={estilos.promesa}>{PROMESA}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  vacio: { paddingHorizontal: espacio.gutter, paddingTop: 26 },
  vacioTexto: {
    fontSize: 15,
    lineHeight: 22,
    color: color.ink500,
    fontFamily: familia,
  },
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: { paddingTop: 4, paddingHorizontal: espacio.gutter },
  filaVolver: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: espacio.controlS,
    height: espacio.controlS,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto },
  titular: { ...texto.titular, color: color.ink900, marginTop: 12 },

  /* La hoja blanca monta sobre el borde del campo rojo: 28 de radio, dos más
     que `radio.hoja`, como en el resto de las pantallas de ayuda. */
  hoja: {
    marginTop: 20,
    marginHorizontal: espacio.tarjeta,
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 18,
    ...sombra.hoja,
  },
  epigrafeViaje: { ...texto.epigrafe, color: color.rojo600, marginBottom: 12 },

  filaViaje: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: color.sand100,
  },
  columnaViaje: { flex: 1, minWidth: 0 },
  destino: {
    fontSize: 14,
    lineHeight: interlinea(14.5),
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  detalle: {
    marginTop: 1,
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  cambiar: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: color.rojo700,
    fontFamily: familia,
  },

  lista: { marginTop: 12, gap: 7 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  filaPulsada: { opacity: 0.6 },
  /* El título ocupa el hueco que queda hasta la pastilla, pero la caja de
     texto se ciñe a la palabra: el traspaso mete el título en un span en
     línea, y si el texto se estira el galón deja de leerse como final de
     fila. */
  filaTituloCaja: { flex: 1, alignItems: 'flex-start' },
  filaTitulo: {
    fontSize: 14,
    lineHeight: interlinea(14.5),
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  pastilla: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul100,
  },
  pastillaUrgente: { backgroundColor: color.rojo100 },
  pastillaTexto: {
    fontSize: 11.5,
    lineHeight: interlinea(11.5),
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },
  pastillaTextoUrgente: { color: color.rojo700 },

  tarjetaPreguntas: {
    marginTop: espacio.entreTarjetas,
    marginHorizontal: espacio.tarjeta,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 18,
  },
  epigrafePreguntas: { ...texto.epigrafe, color: color.azul500, marginBottom: 4 },
  filaPregunta: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: espacio.tap,
    gap: 11,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  preguntaTexto: {
    flex: 1,
    fontSize: 14,
    lineHeight: interlinea(14.5),
    fontWeight: '400',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },

  pie: {
    paddingTop: 14,
    paddingHorizontal: espacio.gutter,
    paddingBottom: espacio.gutter,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  promesa: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink600,
    fontFamily: familia,
  },
});
