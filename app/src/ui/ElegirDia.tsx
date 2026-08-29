/**
 * La hoja de elegir un día — «Cuándo sales».
 *
 * **Qué estaba mal** (visto por el dueño el 27-08-2026). Era una lista de
 * quince filas: «Hoy», «Mañana», «viernes 28», «sábado 29»… sin decir NUNCA
 * el mes. A partir del 31 la lista seguía con «lunes 1», «martes 2», que es
 * el mes siguiente sin avisar; y más allá de quince días no se podía llegar.
 * Para publicar un viaje del puente de octubre, no había forma.
 *
 * **Ahora**: los meses arriba, y debajo el mes entero en una rejilla de siete
 * columnas. El mes se dice siempre —en la pastilla y en el rótulo— así que
 * ninguna fecha queda a medio decir. Lo que ya pasó no se puede elegir: se
 * ve, apagado, porque un hueco en la rejilla haría contar los días a mano.
 *
 * **Y una sola copia.** `LOS_PROXIMOS_DIAS` estaba escrito TRES veces —en
 * inicio, en resultados y en publicar— con el mismo defecto en las tres. Esto
 * las reemplaza a las tres.
 */

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cerrar } from './iconos';
import { tabular } from './dinero';
import { color, espacio, familia, interlinea, radio } from './tokens';

/** Hasta dónde se puede mirar hacia delante. Cuatro meses cubre un puente largo. */
const MESES_A_LA_VISTA = 4;

const ZONA = 'America/Panama';

const enPanama = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: ZONA,
});

/** El día de Panamá en 'AAAA-MM-DD' — el mismo formato que usan los servicios. */
export function diaDePanama(d: Date = new Date()): string {
  return enPanama.format(d);
}

const nombreDeMes = new Intl.DateTimeFormat('es-PA', { month: 'long', timeZone: ZONA });

type Props = {
  abierta: boolean;
  /** El día elegido, en 'AAAA-MM-DD'. */
  elegido: string;
  alElegir: (dia: string) => void;
  alCerrar: () => void;
  /** «Cuándo sales» del pasajero, «Qué día sales» del conductor. */
  titulo?: string;
};

export function ElegirDia({ abierta, elegido, alElegir, alCerrar, titulo = 'Cuándo sales' }: Props) {
  const hoy = diaDePanama();
  const [mes, setMes] = useState(() => primeroDelMesDe(elegido || hoy));

  /* Al abrir, la hoja se sitúa en el mes de lo que ya está elegido. Sin esto,
     quien había elegido el 3 de octubre volvía a abrirla en agosto. */
  useEffect(() => {
    if (abierta) setMes(primeroDelMesDe(elegido || hoy));
  }, [abierta, elegido, hoy]);

  const meses = mesesALaVista(hoy);
  const dias = diasDelMes(mes);
  /* El hueco antes del día 1, para que cada columna sea siempre el mismo día
     de la semana. Lunes primero, como se lee un calendario aquí. */
  const huecos = (diaDeLaSemana(dias[0]) + 6) % 7;

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

          {/* Los meses. Con uno solo no se enseñan: una fila de un chip es un
              adorno que no decide nada. */}
          {meses.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.filaMeses}
            >
              {meses.map((m) => {
                const puesto = m === mes;
                return (
                  <Pressable
                    key={m}
                    accessibilityRole="button"
                    accessibilityState={{ selected: puesto }}
                    accessibilityLabel={comoSeLlamaElMes(m)}
                    onPress={() => setMes(m)}
                    style={[estilos.chipMes, puesto && estilos.chipMesPuesto]}
                  >
                    <Text style={[estilos.chipMesTexto, puesto && estilos.chipMesTextoPuesto]}>
                      {comoSeLlamaElMes(m)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={estilos.filaSemana}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
              <Text key={`${d}${i}`} style={estilos.letraSemana}>
                {d}
              </Text>
            ))}
          </View>

          <View style={estilos.rejilla}>
            {Array.from({ length: huecos }, (_, i) => (
              <View key={`hueco${i}`} style={estilos.celda} />
            ))}
            {dias.map((dia) => {
              const pasado = dia < hoy;
              const puesto = dia === elegido;
              return (
                <View key={dia} style={estilos.celda}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: puesto, disabled: pasado }}
                    accessibilityLabel={comoSeLlamaElDia(dia, hoy)}
                    disabled={pasado}
                    onPress={() => {
                      alElegir(dia);
                      alCerrar();
                    }}
                    style={({ pressed }) => [
                      estilos.dia,
                      puesto && estilos.diaPuesto,
                      pressed && !puesto ? { backgroundColor: color.lavado } : null,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.diaTexto,
                        pasado && estilos.diaPasado,
                        puesto && estilos.diaTextoPuesto,
                      ]}
                    >
                      {Number(dia.slice(8))}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Lo elegido, escrito entero. La rejilla dice el número; esto dice
              qué día de la semana y de qué mes, que es lo que se comprueba
              antes de cerrar. */}
          <Text style={estilos.elegido}>{comoSeLlamaElDia(elegido, hoy)}</Text>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

/** «Hoy», «Mañana», o «viernes 28 de agosto» — con el mes, siempre. */
export function comoSeLlamaElDia(dia: string, hoy = diaDePanama()): string {
  if (!dia) return '';
  if (dia === hoy) return 'Hoy';
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  if (dia === diaDePanama(manana)) return 'Mañana';
  return new Intl.DateTimeFormat('es-PA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: ZONA,
  }).format(aFecha(dia));
}

/** La versión corta para un chip: «vie 28 ago». Nunca sin mes. */
export function diaEnChip(dia: string, hoy = diaDePanama()): string {
  if (dia === hoy) return 'Hoy';
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  if (dia === diaDePanama(manana)) return 'Mañana';
  return new Intl.DateTimeFormat('es-PA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: ZONA,
  })
    .format(aFecha(dia))
    .replace(/\./g, '');
}

/** El mediodía de Panamá: así ningún huso mueve la fecha un día. */
const aFecha = (dia: string): Date => new Date(`${dia}T12:00:00-05:00`);

const primeroDelMesDe = (dia: string): string => `${dia.slice(0, 7)}-01`;

function comoSeLlamaElMes(mes: string): string {
  const nombre = nombreDeMes.format(aFecha(mes));
  return nombre[0].toUpperCase() + nombre.slice(1);
}

function mesesALaVista(hoy: string): string[] {
  const meses: string[] = [];
  const d = aFecha(primeroDelMesDe(hoy));
  for (let i = 0; i < MESES_A_LA_VISTA; i++) {
    meses.push(diaDePanama(d));
    d.setMonth(d.getMonth() + 1);
  }
  return meses;
}

function diasDelMes(mes: string): string[] {
  const [ano, num] = mes.split('-').map(Number);
  // El día 0 del mes siguiente es el último del mes: así no hay tabla de 28/30/31.
  const cuantos = new Date(ano, num, 0).getDate();
  return Array.from(
    { length: cuantos },
    (_, i) => `${mes.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`,
  );
}

/** 0 = domingo, como `getDay`. */
const diaDeLaSemana = (dia: string): number => aFecha(dia).getDay();

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
      que no lo está, y sin esto el velo se comía los toques de la rejilla. */
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

  filaMeses: { gap: 8, paddingVertical: 14 },
  chipMes: {
    height: 36,
    paddingHorizontal: 15,
    borderRadius: radio.pastilla,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.lavado,
  },
  chipMesPuesto: { backgroundColor: color.ink900 },
  chipMesTexto: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    fontWeight: '600',
    color: color.ink700,
    fontFamily: familia,
  },
  chipMesTextoPuesto: { color: '#fff' },

  filaSemana: { flexDirection: 'row', marginTop: 4, marginBottom: 6 },
  letraSemana: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    color: color.ink600,
    fontFamily: familia,
  },

  rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
  /** Un séptimo exacto: la columna tiene que caer bajo su letra. */
  celda: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  dia: { flex: 1, borderRadius: radio.icono, alignItems: 'center', justifyContent: 'center' },
  diaPuesto: { backgroundColor: color.rojo500 },
  diaTexto: {
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  /** Apagado, no escondido: un hueco obligaría a contar los días a mano. */
  diaPasado: { color: color.ink300 },
  diaTextoPuesto: { color: '#fff', fontWeight: '700' },

  elegido: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: 19,
    color: color.ink500,
    fontFamily: familia,
  },
});
