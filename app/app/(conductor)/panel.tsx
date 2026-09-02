/**
 * `10a` Panel del conductor — sus viajes publicados.
 *
 * ── La reconstrucción del 01-09-2026 ─────────────────────────────────────
 *
 * Pedido del dueño: «this viajes publicados page is lacking a lot of design.
 * Spend time on it. We need to understand the best information clearly».
 * Y tenía razón por una razón concreta: **la pantalla enseñaba tres tarjetas
 * distintas para la misma cosa** —el viaje de hoy en hoja blanca, los
 * próximos en tarjeta, y los que ya salieron en esa misma tarjeta otra vez—
 * y ninguna de las tres contestaba entera la pregunta que trae aquí a un
 * conductor.
 *
 * **La pregunta es siempre la misma, y son cinco datos en este orden:**
 * cuándo salgo · por dónde voy · quién va conmigo · cuánto se recupera ·
 * qué tengo que hacer ahora. Ahora hay UNA tarjeta, con esos cinco renglones
 * siempre en el mismo sitio, y lo que cambia entre un viaje de hoy y uno de
 * la semana que viene son los adornos —el punto en vivo, el color del
 * epígrafe, la sombra— y no la estructura.
 *
 * **Lo que faltaba y ahora está:**
 *
 * · **Los puestos se VEN.** Decía «2 de 3 puestos ocupados» en una línea de
 *   texto de 13 px. Son tres asientos dibujados: dos en tinta y uno hueco.
 *   Cuántos van y cuántos faltan es la cifra que un conductor mira primero,
 *   y era la más difícil de leer de la tarjeta.
 * · **El dinero, en todas.** La tarjeta de hoy —la más grande, la de arriba,
 *   la del viaje que sale en dos horas— **no enseñaba el aporte por ningún
 *   lado**. Sólo lo traían las de abajo, y metido a la derecha del origen,
 *   donde parece la hora de salida.
 * · **Las solicitudes suben a la cabecera.** Es lo único de esta pantalla
 *   con reloj corriendo —no responder en 4 h no es un aviso perdido, es un
 *   puesto que se cae— y estaba dentro de la tarjeta de hoy, así que una
 *   solicitud en el viaje del sábado no se veía sin desplazar. Ahora hay una
 *   sola banda roja arriba que las cuenta todas y dice cuándo expira la
 *   primera.
 * · **Un resumen de una línea bajo el titular.** Cuántos viajes tienes por
 *   delante y cuántos puestos llevas ocupados. La pantalla se abría en frío,
 *   sin decir de cuánto se estaba hablando.
 * · **Los que ya salieron se apagan.** Eran idénticos a los que vienen —el
 *   mismo blanco, el mismo peso—, y el único modo de distinguirlos era leer
 *   la fecha. Ahora van sobre la arena, con el epígrafe en tinta suave.
 * · **Un vacío que se puede tocar.** «No tienes viajes por delante» era una
 *   línea de texto gris. Ahora es una tarjeta con el botón de publicar.
 *
 * Lo único con reloj corriendo son las solicitudes; el resto es
 * deliberadamente tranquilo. Un viaje sin nadie todavía no es un problema
 * que resolver: es un viaje al que le queda tiempo, y lo que ofrece es
 * compartirlo, no un aviso.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import {
  type ViajeHecho,
  type ViajePublicado,
  viajesHechos,
  viajesPublicados,
} from '@/servicios/panel';
import { perfilResumido } from '@/servicios/perfiles';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Pestanas } from '@/ui/Pestanas';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { diaAbrev, hora } from '@/ui/fechas';
import { Galon, TarjetaDePublicado, loQueQueda } from '@/ui/TarjetaDePublicado';
import { color, espacio, familia, interlinea, radio, TRACK_MICRO } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

export default function Panel() {
  const router = useRouter();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [viajes, setViajes] = useState<ViajePublicado[]>([]);
  const [hechos, setHechos] = useState<ViajeHecho[]>([]);
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    if (!yo) return;
    viajesPublicados(yo).then(setViajes);
    viajesHechos(yo).then(setHechos);
    perfilResumido(yo).then((p) =>
      setNombre(p ? `${p.first_name} ${p.last_initial ?? ''}`.trim() : null),
    );
  }, [yo]);

  /**
   * **UN VIAJE QUE YA SALIÓ NO ES «EL PRÓXIMO»** (27-08-2026, visto por el
   * dueño). `viajesPublicados` devuelve todo lo publicado ordenado por hora,
   * y el primero se dibujaba en la hoja blanca con el punto rojo en vivo —
   * también cuando era el de las 6 de esta mañana, ya hecho. Con «Editar» al
   * lado, que sobre un viaje pasado no es editar: es reescribir la historia.
   */
  const proximos = viajes.filter((v) => !v.yaSalio);
  const salidos = viajes.filter((v) => v.yaSalio);
  const [siguiente, ...resto] = proximos;

  /* EL RESUMEN Y LA BANDA DE SOLICITUDES SE CUENTAN AQUÍ, sobre la misma
     lista que se dibuja abajo: un contador calculado aparte de lo que cuenta
     acaba diciendo otra cosa que la lista. */
  const puestosOcupados = proximos.reduce((n, v) => n + v.puestosVendidos, 0);
  const pidiendo = proximos.filter((v) => v.solicitudes > 0);
  const cuantasPiden = pidiendo.reduce((n, v) => n + v.solicitudes, 0);
  /* La que expira ANTES, que es la que decide la urgencia de la banda. El
     rótulo decía «expiran en 4 h» fijo, que es la duración de la ventana y no
     lo que queda de ella: a las tres horas y media seguía diciendo 4. */
  const primeraEnExpirar = pidiendo
    .map((v) => v.expiraLaPrimera)
    .filter((x): x is string => !!x)
    .sort()[0];

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <CampoRojo altura={214} />

        <View style={estilos.cabecera}>
          <Text style={estilos.epigrafeCampo}>
            {nombre ? `Conductor · ${nombre}` : 'Conductor'}
          </Text>
          <Text style={estilos.titular}>
            {'Tus viajes '}
            <Text style={estilos.titularFuerte}>publicados</Text>
          </Text>

          {/* DE CUÁNTO ESTAMOS HABLANDO, en una línea. La pantalla se abría
              en frío, con un titular y luego tarjetas: esto es lo que un
              conductor contestaría si le preguntaras «¿cómo vas?». */}
          {proximos.length > 0 ? (
            <Text style={estilos.resumen}>
              {`${proximos.length === 1 ? '1 viaje por delante' : `${proximos.length} viajes por delante`} · ${
                puestosOcupados === 0
                  ? 'ningún puesto ocupado todavía'
                  : puestosOcupados === 1
                    ? '1 puesto ocupado'
                    : `${puestosOcupados} puestos ocupados`
              }`}
            </Text>
          ) : null}
        </View>

        <View style={estilos.cuerpo}>
          {/* **LO ÚNICO CON RELOJ CORRIENDO, ARRIBA DEL TODO.** Estaba dentro
              de la tarjeta del viaje de hoy: una solicitud en el viaje del
              sábado no se veía sin desplazar hasta él. Aquí se cuentan todas
              y se abre la del viaje que expira antes. */}
          {cuantasPiden > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${cuantasPiden} solicitudes de puesto sin responder`}
              onPress={() =>
                router.push({
                  pathname: '/(conductor)/solicitudes',
                  params: { viaje: pidiendo[0].id },
                })
              }
              style={({ pressed }) => [estilos.aviso, pressed && { opacity: 0.9 }]}
            >
              <View style={estilos.contador}>
                <Text style={estilos.contadorTexto}>{cuantasPiden}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.avisoTitulo}>
                  {cuantasPiden === 1 ? 'Te piden un puesto' : 'Te piden puesto'}
                </Text>
                <Text style={estilos.avisoPie}>
                  {`${
                    pidiendo.length === 1
                      ? `${pidiendo[0].origen.split(' · ')[0]} → ${pidiendo[0].destino.split(' · ')[0]}`
                      : `En ${pidiendo.length} de tus viajes`
                  } · ${loQueQueda(primeraEnExpirar)}`}
                </Text>
              </View>
              <Galon tinta={color.rojo700} />
            </Pressable>
          ) : null}

          {siguiente ? (
            <>
              {/* «Tu próximo viaje», no «Sale hoy»: el rótulo decía HOY y la
                  tarjeta de debajo del grupo siguiente también, porque puede
                  haber dos viajes el mismo día. Cuál es hoy lo dice cada
                  tarjeta; el rótulo dice cuál es el que viene. */}
              <Rotulo>Tu próximo viaje</Rotulo>
              <TarjetaDePublicado viaje={siguiente} tono="siguiente" />
            </>
          ) : null}

          {resto.length > 0 ? (
            <>
              <Rotulo>Después</Rotulo>
              {resto.map((v) => (
                <TarjetaDePublicado key={v.id} viaje={v} tono="proximo" />
              ))}
            </>
          ) : null}

          {/* EL VACÍO SE PUEDE TOCAR. Era una línea de texto gris debajo de
              nada: la pantalla que existe para publicar viajes no ofrecía
              publicar uno justo cuando no había ninguno. */}
          {!siguiente ? (
            <View style={estilos.vacio}>
              <Text style={estilos.vacioTitulo}>No tienes viajes por delante</Text>
              <Text style={estilos.vacioTexto}>
                Publica el que ya ibas a hacer. Toma dos minutos y no cuesta nada.
              </Text>
              <View style={estilos.vacioBoton}>
                <Boton tamano="md" alPulsar={() => router.push('/(conductor)/publicar')}>
                  Publicar un viaje
                </Boton>
              </View>
            </View>
          ) : null}

          {/* LOS QUE YA SALIERON, aparte y apagados. Estaban mezclados arriba,
              así que el viaje de las 6 de esta mañana se dibujaba como el
              próximo, con el punto rojo en vivo. Se siguen enseñando —desde
              aquí se teclean los códigos de quien todavía no ha bajado— pero
              ya no se pueden tocar y no compiten con los que vienen. */}
          {salidos.length > 0 ? (
            <>
              <Rotulo>Ya salieron</Rotulo>
              {salidos.map((v) => (
                <TarjetaDePublicado key={v.id} viaje={v} tono="pasado" />
              ))}
            </>
          ) : null}

          {/* PARA REPETIR. El interurbano de verdad es semanal — a Chitré el
              viernes, de vuelta el domingo — y los viajes hechos no salían en
              ninguna pantalla: repetir uno era rellenar el formulario entero
              de memoria. Una ruta hecha, una fila; tocarla abre publicar ya
              rellenado y solo queda ponerle fecha. */}
          {hechos.length > 0 ? (
            <>
              <Rotulo>Para repetir</Rotulo>
              <View style={estilos.repetir}>
                {hechos.map((h, i) => (
                  <Pressable
                    key={h.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Publicar de nuevo ${h.origen} a ${h.destino}`}
                    onPress={() =>
                      router.push({ pathname: '/(conductor)/publicar', params: { deViaje: h.id } })
                    }
                    style={({ pressed }) => [
                      estilos.filaRepetir,
                      i > 0 && estilos.filaRepetirSigue,
                      pressed && { backgroundColor: color.lavadoChip },
                    ]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={estilos.repetirRuta} numberOfLines={1}>
                        {`${h.origen.split(' · ')[0]} → ${h.destino.split(' · ')[0]}`}
                      </Text>
                      <Text style={estilos.repetirMeta}>
                        {`${diaAbrev(h.cuando)} ${hora(h.cuando)} · ${
                          h.puestosVendidos === 1
                            ? '1 puesto ocupado'
                            : `${h.puestosVendidos} puestos ocupados`
                        }`}
                      </Text>
                    </View>
                    <Text style={estilos.repetirAccion}>Repetir</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Text style={estilos.pieTexto}>
            Puedes editar un viaje mientras nadie haya asegurado su puesto y no haya salido.
          </Text>
        </View>
      </ScrollView>

      {/* Sin FAB propio: la barra de abajo YA tiene la casilla Publicar
          levantada en el centro. Dos «+» flotando a sesenta píxeles el uno
          del otro eran la misma acción dibujada dos veces. */}
      <Pestanas valor="Mis viajes" yo={yo} />
    </View>
  );
}

/* La tarjeta del viaje, `Codigos` y el galón viven ahora en
   `@/ui/TarjetaDePublicado`: la pantalla de administrar UN viaje (02-09-2026)
   dibuja exactamente la misma tarjeta, y dos copias habrían divergido. */

/** El rótulo de una sección. Uno solo por grupo, y todos iguales. */
function Rotulo({ children }: { children: string }) {
  return <Text style={estilos.rotulo}>{children}</Text>;
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
  epigrafeCampo: {
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.77,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
    marginTop: 12,
  },
  titularFuerte: { fontWeight: '600' },
  resumen: {
    fontSize: 13.5,
    lineHeight: 19,
    color: color.ink600,
    fontFamily: familia,
    marginTop: 6,
    ...tabular,
  },

  /* El hueco de abajo es el ALTO DE LA BARRA DE PESTAÑAS más aire: con 8 px
     la última tarjeta se cortaba justo por su fila de acciones, que es la
     parte que hay que poder tocar. */
  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 96 },

  /** El rótulo de sección: uno por grupo, todos iguales, ninguno grita. */
  rotulo: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 11.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
    marginTop: 22,
    marginBottom: 9,
  },

  /* ------------------------------------------------- la banda de solicitudes */

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    backgroundColor: color.rojo100,
    borderRadius: radio.l,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  contador: {
    width: 34,
    height: 34,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: {
    fontSize: 15.5,
    lineHeight: interlinea(15),
    fontWeight: '700',
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },
  avisoTitulo: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.2175,
    color: color.rojo700,
    fontFamily: familia,
  },
  avisoPie: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    fontFamily: familia,
  },

  /* ---------------------------------------------------------- el vacío */

  vacio: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 20,
    marginTop: 6,
  },
  vacioTitulo: {
    fontSize: 16.5,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: color.ink900,
    fontFamily: familia,
  },
  vacioTexto: {
    fontSize: 13.5,
    lineHeight: 20,
    color: color.ink600,
    fontFamily: familia,
    marginTop: 5,
  },
  vacioBoton: { marginTop: 15, alignSelf: 'flex-start' },

  /* ------------------------------------------------------- para repetir */

  repetir: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingVertical: 2,
  },
  filaRepetir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filaRepetirSigue: {
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  repetirRuta: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  repetirMeta: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },
  repetirAccion: {
    fontSize: 13,
    lineHeight: 18.85,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },

  pieTexto: {
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink500,
    marginTop: 20,
    fontFamily: familia,
  },
});
