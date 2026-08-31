/**
 * La hoja de elegir la hora de salida — «A qué hora sales».
 *
 * **Qué estaba mal** (visto por el dueño el 30-08-2026: «a qué hora sales no
 * muestra minutos, deberían estar»). Era una `HojaDeEleccion` sobre una lista
 * de diecinueve horas en punto: 05:00, 06:00, 07:00… Nadie sale a las siete
 * en punto. Quien sale a las 6:30 tenía que elegir entre mentir media hora
 * antes o media hora después, y en un viaje que se coordina por chat esa media
 * hora es la diferencia entre esperar y perder el puesto.
 *
 * **Por qué no una lista más larga.** Con cuartos de hora la lista pasa de 19
 * filas a 96: para llegar a las siete de la noche hay que desplazar la hoja
 * entera. BlaBlaCar resuelve esto con la rueda del sistema, que aquí no
 * podemos usar —es la razón por la que existe `HojaDeEleccion`: el control
 * nativo se pinta con el estilo del sistema y no con el nuestro.
 *
 * **Lo que hay.** Dos decisiones, cada una de un toque: las veinticuatro horas
 * en una rejilla de seis columnas —el día entero cabe sin desplazar nada— y
 * los cuartos debajo. Arriba, la hora que llevas elegida, en grande, con la
 * franja del día escrita al lado: «06:30 · de la mañana» quita de un vistazo
 * la duda de las 06 contra las 18, que es el error que un reloj de 24 h
 * invita a cometer.
 *
 * **Y lo que ya pasó no se puede elegir.** Antes se podía poner una hora de
 * esta madrugada y sólo se sabía dos pantallas después, cuando el botón de
 * seguir se apagaba sin decir por qué. Aquí sale apagado en la propia
 * rejilla, como los días pasados en `ElegirDia`.
 */

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from './controles';
import { tabular } from './dinero';
import { Cerrar } from './iconos';
import { color, espacio, familia, interlinea, radio } from './tokens';

/** Los cuartos. Ni cinco en cinco —doce pastillas para nada— ni sólo la media. */
const CUARTOS = ['00', '15', '30', '45'];

const LAS_HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

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
   * apagado, no escondido: un hueco en la rejilla haría contar las horas a
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
  const [mm, setMm] = useState(() => cuartoMasCerca(elegido || '06:00'));

  /* Al abrir, la hoja se sitúa en lo que ya está elegido. Sin esto, quien
     había puesto las 18:30 y vuelve a abrirla se encuentra con lo que tocó
     la última vez y no con lo que su viaje dice. */
  useEffect(() => {
    if (!abierta) return;
    setHh((elegido || '06:00').slice(0, 2));
    setMm(cuartoMasCerca(elegido || '06:00'));
  }, [abierta, elegido]);

  const puesta = `${hh}:${mm}`;
  const valeLaHora = (h: string) => !minimo || `${h}:45` >= minimo;
  const valeElCuarto = (m: string) => !minimo || `${hh}:${m}` >= minimo;
  const sePuede = valeLaHora(hh) && valeElCuarto(mm);

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

          {/* La respuesta, en grande y viva: cambia con cada toque, así que la
              rejilla no necesita explicarse. */}
          <View style={estilos.respuesta}>
            <Text style={[estilos.cifra, tabular]}>{puesta}</Text>
            <Text style={estilos.franja}>{franjaDelDia(puesta)}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={estilos.cuerpo}>
            <View style={estilos.rejilla}>
              {LAS_HORAS.map((h) => {
                const puesto = h === hh;
                const pasada = !valeLaHora(h);
                return (
                  <View key={h} style={estilos.celda}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: puesto, disabled: pasada }}
                      accessibilityLabel={`Las ${h} ${franjaDelDia(`${h}:00`)}`}
                      disabled={pasada}
                      onPress={() => {
                        setHh(h);
                        /* Si el cuarto que llevaba puesto cae antes del mínimo
                           en esta hora nueva, se adelanta solo al primero que
                           vale: si no, la hoja se quedaba con el botón de
                           confirmar apagado sin que se viera por qué. */
                        if (minimo && `${h}:${mm}` < minimo) {
                          setMm(CUARTOS.find((m) => `${h}:${m}` >= minimo) ?? mm);
                        }
                      }}
                      style={({ pressed }) => [
                        estilos.hora,
                        puesto && estilos.horaPuesta,
                        pressed && !puesto ? { backgroundColor: color.lavado } : null,
                      ]}
                    >
                      <Text
                        style={[
                          estilos.horaTexto,
                          pasada && estilos.horaPasada,
                          puesto && estilos.horaTextoPuesta,
                        ]}
                      >
                        {h}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={estilos.filaCuartos}>
              {CUARTOS.map((m) => {
                const puesto = m === mm;
                const pasado = !valeElCuarto(m);
                return (
                  <Pressable
                    key={m}
                    accessibilityRole="button"
                    accessibilityState={{ selected: puesto, disabled: pasado }}
                    accessibilityLabel={`Y ${m} minutos`}
                    disabled={pasado}
                    onPress={() => setMm(m)}
                    style={({ pressed }) => [
                      estilos.cuarto,
                      puesto && estilos.cuartoPuesto,
                      pressed && !puesto ? { backgroundColor: color.lavado } : null,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.cuartoTexto,
                        pasado && estilos.horaPasada,
                        puesto && estilos.cuartoTextoPuesto,
                      ]}
                    >
                      {`:${m}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

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

/** El cuarto de hora más cercano a lo que traiga la pantalla — «06:07» → «00». */
function cuartoMasCerca(hhmm: string): string {
  const m = Number(hhmm.slice(3, 5));
  if (Number.isNaN(m)) return '00';
  return CUARTOS.includes(String(m).padStart(2, '0'))
    ? String(m).padStart(2, '0')
    : (CUARTOS.find((c) => Number(c) >= m) ?? '45');
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

  respuesta: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 12 },
  cifra: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1,
    color: color.ink900,
    fontFamily: familia,
  },
  franja: { fontSize: 14, lineHeight: 20, color: color.ink500, fontFamily: familia },

  cuerpo: { marginTop: 12 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
  /** Un sexto exacto: veinticuatro horas en cuatro filas, sin desplazar. */
  celda: { width: `${100 / 6}%`, padding: 3 },
  hora: {
    height: 44,
    borderRadius: radio.icono,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.sand100,
  },
  horaPuesta: { backgroundColor: color.ink900 },
  horaTexto: {
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  /** Apagado, no escondido — como los días pasados del calendario. */
  horaPasada: { color: color.ink300 },
  horaTextoPuesta: { color: '#fff', fontWeight: '700' },

  filaCuartos: { flexDirection: 'row', gap: 8, marginTop: 14 },
  cuarto: {
    flex: 1,
    height: 46,
    borderRadius: radio.control,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.sand100,
  },
  cuartoPuesto: { backgroundColor: color.azul100, borderWidth: 1.5, borderColor: color.ink900 },
  cuartoTexto: {
    fontSize: 15.5,
    lineHeight: interlinea(15.5),
    fontWeight: '600',
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },
  cuartoTextoPuesto: { color: color.ink900, fontWeight: '700' },

  pie: { marginTop: 16 },
});
