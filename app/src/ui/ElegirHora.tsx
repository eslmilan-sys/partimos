/**
 * La hoja de elegir la hora de salida — «A qué hora sales».
 *
 * ── La rueda del 01-09-2026 ──────────────────────────────────────────────
 *
 * Pedido del dueño con la captura delante: *«attached calendar and button is
 * not well designed. Act like a pro of ui apps and design. I like it simple
 * yet like Apple.»*
 *
 * Lo que había era una **rejilla de veinticuatro casillas** más cuatro
 * pastillas de cuartos: veintiocho controles en una hoja para contestar una
 * pregunta de dos cifras. Se leía como un teclado numérico o como un
 * calendario roto —de ahí lo de «calendar»—, y ninguna de las dos cosas es.
 * Elegir una hora no es escoger entre veinticuatro opciones sueltas: es mover
 * un número por una recta, que es exactamente lo que hace la rueda de iOS.
 *
 * **Lo que hay ahora.** Dos ruedas que giran con el dedo, hora y minutos, con
 * la banda de selección quieta en el centro y el resto degradándose hacia los
 * bordes. Cero controles a la vista, dos gestos, y la respuesta se lee en el
 * sitio donde está el dedo — no en un renglón aparte que hay que ir a mirar.
 *
 * · **Los minutos van de cinco en cinco.** Eran cuartos porque una lista de
 *   96 filas no cabía; en una rueda no cuesta nada, y «sale 6:35» es una hora
 *   que la gente dice. Doce posiciones.
 * · **La franja del día sigue debajo** —«de la noche»—, porque el reloj de 24
 *   horas se lee mal de reojo y publicar un viaje doce horas antes de lo que
 *   se quería es un error caro.
 * · **Lo que ya pasó se apaga en la propia rueda**, no dos pantallas después
 *   cuando el botón de seguir se apaga sin decir por qué.
 * · **Cada fila también se toca.** La rueda es para el pulgar; el toque es
 *   para el dedo que apunta, y para un lector de pantalla, que no arrastra.
 *
 * **Cómo funciona el enganche.** `snapToInterval` en RN-Web se traduce a
 * `scroll-snap`, así que el reposo cae siempre en una fila exacta; el valor se
 * lee de `onScroll` redondeando la posición, para que la banda del centro y la
 * cifra vayan con el dedo y no un paso por detrás.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Boton } from './controles';
import { tabular } from './dinero';
import { Cerrar } from './iconos';
import { color, espacio, familia, interlinea, radio } from './tokens';

/** Cinco en cinco: doce posiciones, y «6:35» es una hora que la gente dice. */
const PASO_DE_MINUTOS = 5;
const LOS_MINUTOS = Array.from({ length: 60 / PASO_DE_MINUTOS }, (_, i) =>
  String(i * PASO_DE_MINUTOS).padStart(2, '0'),
);
const LAS_HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

/** El alto de una fila y cuántas se ven: cinco, con la elegida en el centro. */
const FILA = 42;
const A_LA_VISTA = 5;
const MITAD = (A_LA_VISTA - 1) / 2;

/**
 * La franja del día, dicha como se dice. Existe por el reloj de 24 h: «18:00»
 * es correcto y aun así se lee mal de reojo, y publicar un viaje doce horas
 * antes de lo que se quería es un error caro.
 */
export function franjaDelDia(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2));
  if (h < 5) return 'de la madrugada';
  if (h < 12) return 'de la mañana';
  if (h < 13) return 'del mediodía';
  if (h < 19) return 'de la tarde';
  return 'de la noche';
}

type Props = {
  abierta: boolean;
  /** La hora elegida, en 'HH:MM'. */
  elegido: string;
  alElegir: (hora: string) => void;
  alCerrar: () => void;
  titulo?: string;
  /**
   * La primera hora que se puede elegir, en 'HH:MM'. Lo anterior se ve
   * apagado, no escondido: un hueco en la rueda haría contar las horas a
   * mano. Vacío —el caso de cualquier día que no sea hoy— y valen todas.
   */
  minimo?: string;
};

export function ElegirHora({
  abierta,
  elegido,
  alElegir,
  alCerrar,
  titulo = 'A qué hora sales',
  minimo,
}: Props) {
  const [hh, setHh] = useState(() => (elegido || '06:00').slice(0, 2));
  const [mm, setMm] = useState(() => alPasoMasCerca(elegido || '06:00'));

  /* Al abrir, la hoja se sitúa en lo que ya está elegido. Sin esto, quien
     había puesto las 18:30 y vuelve a abrirla se encuentra con lo que tocó
     la última vez y no con lo que su viaje dice. */
  useEffect(() => {
    if (!abierta) return;
    setHh((elegido || '06:00').slice(0, 2));
    setMm(alPasoMasCerca(elegido || '06:00'));
  }, [abierta, elegido]);

  const puesta = `${hh}:${mm}`;
  /* Una hora sirve si ALGUNO de sus minutos sirve; el minuto se juzga ya con
     la hora puesta. Así las 05 no se apagan enteras porque el mínimo sean las
     05:20. */
  const valeLaHora = (h: string) => !minimo || `${h}:55` >= minimo;
  const valeElMinuto = (m: string) => !minimo || `${hh}:${m}` >= minimo;
  const sePuede = valeLaHora(hh) && valeElMinuto(mm);

  return (
    <Modal visible={abierta} animationType="slide" transparent onRequestClose={alCerrar}>
      <Pressable accessibilityLabel="Cerrar" onPress={alCerrar} style={estilos.velo} />

      <View style={estilos.alFondo} pointerEvents="box-none">
        <View style={estilos.hoja}>
          <View style={estilos.asa} pointerEvents="none" />

          <View style={estilos.cabecera}>
            <Text style={estilos.titulo}>{titulo}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={alCerrar}
              style={estilos.cerrar}
            >
              <Cerrar tamano={16} tinta={color.ink700} />
            </Pressable>
          </View>

          {/* LAS DOS RUEDAS. La banda del centro va debajo y no se toca: es
              el sitio donde se lee, no un control. */}
          <View style={estilos.rueda} accessibilityLabel={`Hora de salida, ${puesta}`}>
            <View style={estilos.banda} pointerEvents="none" />

            <View style={estilos.columnas}>
              <Columna
                abierta={abierta}
                valores={LAS_HORAS}
                puesto={hh}
                apagado={(h) => !valeLaHora(h)}
                comoSeLee={(h) => `Las ${h} ${franjaDelDia(`${h}:00`)}`}
                alCambiar={(h) => {
                  setHh(h);
                  /* Si el minuto que llevaba puesto cae antes del mínimo en
                     esta hora nueva, se adelanta solo al primero que vale: si
                     no, la hoja se quedaba con el botón de confirmar apagado
                     sin que se viera por qué. */
                  if (minimo && `${h}:${mm}` < minimo) {
                    setMm(LOS_MINUTOS.find((m) => `${h}:${m}` >= minimo) ?? mm);
                  }
                }}
              />

              {/* Los dos puntos van entre las ruedas y quietos: el reloj es
                  «06:30», no dos números uno al lado del otro. */}
              <Text style={estilos.dosPuntos} pointerEvents="none">
                :
              </Text>

              <Columna
                abierta={abierta}
                valores={LOS_MINUTOS}
                puesto={mm}
                apagado={(m) => !valeElMinuto(m)}
                comoSeLee={(m) => `Y ${Number(m)} minutos`}
                alCambiar={setMm}
              />
            </View>

            {/* El degradado de los bordes, hecho con dos velos planos: en
                RN-Web un degradado de verdad pide una librería, y lo que se
                busca —que las filas de fuera se apaguen— se consigue igual
                con opacidad en el propio texto. Estos dos sólo recortan. */}
            <View style={estilos.veloArriba} pointerEvents="none" />
            <View style={estilos.veloAbajo} pointerEvents="none" />
          </View>

          <Text style={estilos.franja}>{franjaDelDia(puesta)}</Text>

          {/* AZUL, no rojo: dentro de una hoja, rojo sobre rojo no se lee.
              Y el rótulo dice la hora entera —«Salgo a las 06:30»— porque es
              lo último que se lee antes de cerrar. */}
          <View style={estilos.pie}>
            <Boton
              tono="azul"
              ancho
              desactivado={!sePuede}
              alPulsar={() => {
                alElegir(puesta);
                alCerrar();
              }}
            >
              {sePuede ? `Salgo a las ${puesta}` : 'Esa hora ya pasó'}
            </Boton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------ Una rueda */

/**
 * UNA COLUMNA QUE GIRA. Dos rellenos de dos filas arriba y abajo ponen la
 * primera y la última al alcance del centro; sin ellos las 00 y las 23 no se
 * podrían elegir nunca.
 */
function Columna({
  abierta,
  valores,
  puesto,
  apagado,
  comoSeLee,
  alCambiar,
}: {
  abierta: boolean;
  valores: string[];
  puesto: string;
  apagado: (v: string) => boolean;
  comoSeLee: (v: string) => string;
  alCambiar: (v: string) => void;
}) {
  const rodillo = useRef<ScrollView | null>(null);
  /* Lo último que se PUSO desde el dedo. Sin esto, cada `setState` volvería a
     colocar la rueda donde ya está y el arrastre daría tirones. */
  const puestoPorElDedo = useRef<string | null>(null);

  const indice = Math.max(0, valores.indexOf(puesto));

  useEffect(() => {
    if (!abierta) return;
    if (puestoPorElDedo.current === puesto) return;
    /* Un latido: el `ScrollView` tiene que existir y estar medido antes de
       poder colocarse. */
    const t = setTimeout(
      () => rodillo.current?.scrollTo({ y: indice * FILA, animated: false }),
      abierta ? 30 : 0,
    );
    return () => clearTimeout(t);
  }, [abierta, indice, puesto]);

  const alRodar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / FILA);
    const v = valores[Math.min(valores.length - 1, Math.max(0, i))];
    if (v && v !== puesto) {
      puestoPorElDedo.current = v;
      alCambiar(v);
    }
  };

  return (
    <ScrollView
      ref={rodillo}
      style={estilos.columna}
      showsVerticalScrollIndicator={false}
      snapToInterval={FILA}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={alRodar}
      contentContainerStyle={{ paddingVertical: FILA * MITAD }}
    >
      {valores.map((v) => {
        const esEl = v === puesto;
        const fuera = Math.abs(valores.indexOf(v) - indice);
        return (
          <Pressable
            key={v}
            accessibilityRole="button"
            accessibilityState={{ selected: esEl, disabled: apagado(v) }}
            accessibilityLabel={comoSeLee(v)}
            disabled={apagado(v)}
            onPress={() => {
              puestoPorElDedo.current = v;
              alCambiar(v);
              rodillo.current?.scrollTo({ y: valores.indexOf(v) * FILA, animated: true });
            }}
            style={estilos.fila}
          >
            <Text
              style={[
                estilos.filaTexto,
                /* Las de fuera se apagan por pasos, como en la rueda de iOS:
                   la del centro manda y las demás la acompañan. */
                !esEl && { color: color.ink500, opacity: fuera === 1 ? 0.85 : 0.45 },
                esEl && estilos.filaTextoPuesta,
                apagado(v) && estilos.filaPasada,
              ]}
            >
              {v}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** El paso de cinco más cercano a lo que traiga la pantalla — «06:07» → «05». */
function alPasoMasCerca(hhmm: string): string {
  const m = Number(hhmm.slice(3, 5));
  if (Number.isNaN(m)) return '00';
  const redondo = Math.min(55, Math.round(m / PASO_DE_MINUTOS) * PASO_DE_MINUTOS);
  return String(redondo).padStart(2, '0');
}

const estilos = StyleSheet.create({
  velo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26,20,32,.34)',
  },
  /** `zIndex`: en la web un elemento posicionado se pinta por encima de uno
      que no lo está, y sin esto el velo se comía los toques de la rueda. */
  alFondo: { flex: 1, justifyContent: 'flex-end', zIndex: 1 },
  hoja: {
    backgroundColor: color.blanco,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: espacio.gutter,
    paddingTop: 10,
    paddingBottom: 26,
    width: '100%',
    maxWidth: espacio.marco,
    alignSelf: 'center',
  },
  asa: {
    width: 38,
    height: 4,
    borderRadius: radio.pastilla,
    backgroundColor: color.bordePorDefecto,
    alignSelf: 'center',
  },

  cabecera: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  titulo: {
    flex: 1,
    fontSize: 17,
    lineHeight: interlinea(17.5),
    fontWeight: '600',
    letterSpacing: -0.3,
    color: color.ink900,
    fontFamily: familia,
  },
  cerrar: {
    width: 34,
    height: 34,
    borderRadius: radio.icono,
    backgroundColor: color.lavado,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rueda: { height: FILA * A_LA_VISTA, marginTop: 14, justifyContent: 'center' },
  /** La banda quieta del centro: es el sitio donde se lee, no un control. */
  banda: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: FILA,
    top: FILA * MITAD,
    borderRadius: radio.icono,
    backgroundColor: color.sand100,
  },
  columnas: { flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch' },
  columna: { width: 92, height: FILA * A_LA_VISTA },
  fila: { height: FILA, alignItems: 'center', justifyContent: 'center' },
  filaTexto: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '500',
    letterSpacing: -0.6,
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },
  filaTextoPuesta: { color: color.ink900, fontWeight: '700', opacity: 1 },
  filaPasada: { color: color.ink300, opacity: 0.5 },
  dosPuntos: {
    alignSelf: 'center',
    width: 14,
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: color.ink900,
    fontFamily: familia,
  },

  /* Los dos velos recortan la rueda por arriba y por abajo con el blanco de
     la hoja, para que las filas no se corten a cuchillo contra la cabecera. */
  veloArriba: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: FILA * 0.7,
    backgroundColor: 'rgba(255,255,255,.72)',
  },
  veloAbajo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FILA * 0.7,
    backgroundColor: 'rgba(255,255,255,.72)',
  },

  franja: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: 19,
    color: color.ink500,
    fontFamily: familia,
  },

  pie: { marginTop: 18 },
});
