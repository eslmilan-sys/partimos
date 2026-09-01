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

import { useDecir } from '@/ui/Nota';
import { DIJO, compartir } from '@/ui/salidas';
import Svg, { Path } from 'react-native-svg';

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
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Asiento } from '@/ui/iconos';
import { diaAbrev, diaSemana, duracionEntre, esHoy, hora, mesAbrev, numeroDeDia } from '@/ui/fechas';
import { color, espacio, familia, interlinea, radio, TRACK_MICRO, zonaDeToque } from '@/ui/tokens';

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
              <Viaje viaje={siguiente} tono="siguiente" router={router} />
            </>
          ) : null}

          {resto.length > 0 ? (
            <>
              <Rotulo>Después</Rotulo>
              {resto.map((v) => (
                <Viaje key={v.id} viaje={v} tono="proximo" router={router} />
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
                <Viaje key={v.id} viaje={v} tono="pasado" router={router} />
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

type Router = ReturnType<typeof useRouter>;
type Tono = 'siguiente' | 'proximo' | 'pasado';

/**
 * LO QUE QUEDA DE LA VENTANA, no lo que dura la ventana.
 *
 * Una solicitud sin responder caduca a las 4 h. La banda decía «expiran en
 * 4 h» siempre, así que a los tres minutos de que caiga la primera seguía
 * diciendo cuatro horas: una cuenta atrás escrita como una constante.
 */
function loQueQueda(expira?: string): string {
  if (!expira) return 'expiran a las 4 h de pedirlo';
  const minutos = Math.round((new Date(expira).getTime() - Date.now()) / 60_000);
  if (minutos <= 0) return 'la primera está a punto de caerse';
  if (minutos < 60) return `la primera se cae en ${minutos} min`;
  return `la primera se cae en ${Math.floor(minutos / 60)} h`;
}

/** El rótulo de una sección. Uno solo por grupo, y todos iguales. */
function Rotulo({ children }: { children: string }) {
  return <Text style={estilos.rotulo}>{children}</Text>;
}

/**
 * UNA TARJETA DE VIAJE, LA MISMA PARA LOS TRES ESTADOS.
 *
 * Cinco renglones, siempre en el mismo orden y en el mismo sitio: **cuándo ·
 * dónde · quién va · cuánto · qué hago ahora**. Antes había tres tarjetas
 * distintas —hoja blanca, tarjeta, y tarjeta otra vez para los pasados— con
 * datos distintos en cada una: la de hoy no enseñaba el aporte y las otras no
 * enseñaban la hora de llegada. `tono` cambia el peso, no el contenido.
 */
function Viaje({ viaje, tono, router }: { viaje: ViajePublicado; tono: Tono; router: Router }) {
  const decir = useDecir();
  const pasado = tono === 'pasado';
  const libres = viaje.puestosOfrecidos - viaje.puestosVendidos;
  const recupera = viaje.aporteCentavos * viaje.puestosVendidos;
  const siSeLlena = viaje.aporteCentavos * viaje.puestosOfrecidos;

  return (
    <View style={[estilos.tarjeta, tono === 'siguiente' && estilos.tarjetaAlta, pasado && estilos.tarjetaApagada]}>
      {/* 1 · CUÁNDO. El bloque de fecha a la izquierda, como en la ficha de
          un viaje: el día en grande se encuentra sin leer. */}
      <View style={estilos.filaAlta}>
        <View style={[estilos.fecha, pasado && estilos.fechaApagada]}>
          <Text style={[estilos.fechaDia, pasado && estilos.apagadoFuerte]}>
            {numeroDeDia(viaje.cuando)}
          </Text>
          <Text style={[estilos.fechaMes, pasado && estilos.apagado]}>
            {mesAbrev(viaje.cuando)}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={estilos.filaEpigrafe}>
            <Text
              style={[
                estilos.epigrafe,
                tono === 'siguiente' && esHoy(viaje.cuando) && { color: color.rojo600 },
                pasado && estilos.apagado,
              ]}
              numberOfLines={1}
            >
              {/* El día de la semana, no el número: el número ya está en el
                  bloque de fecha de al lado, y decirlo dos veces en la misma
                  fila deja «MAR 1» junto a «1 SEPT». */}
              {pasado ? 'Ya salió' : esHoy(viaje.cuando) ? 'Hoy' : diaSemana(viaje.cuando)}
            </Text>
            {tono === 'siguiente' && esHoy(viaje.cuando) ? (
              <View style={estilos.puntoVivo} />
            ) : null}
          </View>
          {/* **DE CUÁNDO A CUÁNDO, EN UNA SOLA LÍNEA.** La hora de salida
              estaba aquí Y otra vez a la derecha del origen, en el raíl: el
              mismo dato dos veces a treinta píxeles. Aquí van las dos horas y
              lo que dura; el raíl se queda con los lugares, que es lo suyo. */}
          <Text style={[estilos.horaSalida, tabular, pasado && estilos.apagadoFuerte]}>
            {`${hora(viaje.horaSalida)} → ${hora(viaje.horaLlegada)}`}
            <Text style={estilos.duracion}>
              {duracionEntre(viaje.horaSalida, viaje.horaLlegada)
                ? ` · ${duracionEntre(viaje.horaSalida, viaje.horaLlegada)}`
                : ''}
            </Text>
          </Text>
        </View>

        {viaje.sePuedeEditar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar este viaje"
            onPress={() =>
              router.push({ pathname: '/(conductor)/editar', params: { viaje: viaje.id } })
            }
            style={[{ paddingHorizontal: 6 }, zonaDeToque]}
          >
            <Text style={estilos.enlace}>Editar</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 2 · DÓNDE. El raíl escribe la dirección dos veces —el orden de las
          filas y el punto lleno arriba— como manda el invariante 1. Sin horas:
          las dos están arriba, en la línea que las dice juntas. */}
      <View style={estilos.recorrido}>
        <View style={estilos.filaRuta}>
          <View style={[estilos.puntoLleno, pasado && { backgroundColor: color.ink400 }]} />
          <Text style={[estilos.parada, pasado && estilos.apagadoFuerte]} numberOfLines={1}>
            {viaje.origen}
          </Text>
        </View>
        <View style={estilos.hilo} />
        <View style={estilos.filaRuta}>
          <View style={estilos.puntoVacio} />
          <Text style={[estilos.parada, pasado && estilos.apagadoFuerte]} numberOfLines={1}>
            {viaje.destino}
          </Text>
        </View>
      </View>

      {/* 3 y 4 · QUIÉN VA Y CUÁNTO. Juntos y bajo el filete, porque es una
          sola cuenta: cada asiento ocupado es un aporte.

          **Los asientos se dibujan** (01-09-2026). Era «2 de 3 puestos
          ocupados» en 13 px, la línea más pequeña de la tarjeta y el dato
          que más se mira. Tinta el ocupado, hueco el libre. */}
      <View style={estilos.filete} />

      <View style={estilos.filaCuenta}>
        <View style={estilos.asientos}>
          {Array.from({ length: viaje.puestosOfrecidos }, (_, i) => (
            <Asiento
              key={i}
              tamano={20}
              tinta={
                i < viaje.puestosVendidos
                  ? pasado
                    ? color.ink500
                    : color.ink900
                  : color.ink300
              }
            />
          ))}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[estilos.cuentaFuerte, pasado && estilos.apagadoFuerte]} numberOfLines={1}>
            {viaje.puestosVendidos === 0
              ? libres === 1
                ? 'Nadie todavía · 1 puesto libre'
                : `Nadie todavía · ${libres} puestos libres`
              : `${viaje.puestosVendidos} de ${viaje.puestosOfrecidos} puestos ocupados`}
          </Text>
          {/* **EL DINERO, TAMBIÉN EN LA TARJETA DE HOY.** No estaba en
              ninguna parte de la grande, y en las otras iba pegado al origen,
              donde se confunde con la hora de salida. */}
          <Text style={[estilos.cuentaFina, tabular]} numberOfLines={1}>
            {viaje.puestosVendidos === 0
              ? `${formatearDineroRedondo(viaje.aporteCentavos)} por puesto · hasta ${formatearDineroRedondo(siSeLlena)}`
              : `${formatearDineroRedondo(viaje.aporteCentavos)} por puesto · ${formatearDineroRedondo(recupera)} en total`}
          </Text>
        </View>
      </View>

      {/* 5 · QUÉ HAGO AHORA. Una sola acción por tarjeta, y la que toca:
          teclear códigos si hay gente a bordo, compartir si quedan puestos y
          el viaje no ha salido. Nada si ya está todo hecho. */}
      <Codigos viaje={viaje} router={router} />

      {!pasado && libres > 0 && viaje.porSubir === 0 && viaje.porBajar === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartir el viaje"
          onPress={() =>
            compartir(
              `${viaje.origen} → ${viaje.destino} · ${diaAbrev(viaje.cuando)} ${hora(viaje.cuando)} · ${formatearDineroRedondo(viaje.aporteCentavos)} por puesto · quedan ${libres}`,
            ).then((c) => decir(DIJO[c]))
          }
          style={({ pressed }) => [estilos.compartir, pressed && { backgroundColor: color.lavado }]}
        >
          <Text style={estilos.compartirTexto}>Compartir el viaje</Text>
          <Galon tinta={color.rojo700} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * LOS CÓDIGOS, DICHOS DESDE EL LADO DE QUIEN MANEJA.
 *
 * Decía **«Abordar · teclear los códigos»** (visto por el dueño el
 * 30-08-2026: «they are going to board and you are the chauffeur»). Dos
 * cosas mal en cuatro palabras:
 *
 * 1. *Abordar* es lo que hace el pasajero. Quien lee esta pantalla no aborda
 *    nada: recoge gente y teclea lo que ellos le enseñan. El rótulo estaba
 *    escrito desde el asiento equivocado.
 * 2. *Los códigos*, en plural y sin dueño, no dice de quién ni para qué. Son
 *    cuatro dígitos que la persona enseña en su teléfono al subirse, y otros
 *    cuatro al bajarse.
 *
 * Y salía **siempre**, también en un viaje donde no había reservado nadie:
 * llevaba a una pantalla que contestaba «El viaje está cerrado. Cada aporte
 * ya salió hacia ti» sobre un viaje al que no se subió nunca nadie. Ahora la
 * fila sólo existe cuando hay alguien a bordo, y dice el momento en el que
 * está: recoger, o cerrar al bajar.
 */
function Codigos({ viaje, router }: { viaje: ViajePublicado; router: Router }) {
  // Sin nadie con el puesto asegurado no hay ningún código que teclear.
  if (viaje.aBordo === 0) return null;
  // Todos subieron y todos bajaron: el viaje cerró, no queda nada que hacer.
  if (viaje.porSubir === 0 && viaje.porBajar === 0) return null;

  const subiendo = viaje.porSubir > 0;
  const cuantos = subiendo ? viaje.porSubir : viaje.porBajar;
  /* «Falta 1», no «faltan 1». El plural de una cuenta se acuerda con la
     cuenta, y este renglón sale con un 1 en la última persona que sube. */
  const faltan = cuantos === 1 ? 'Falta' : 'Faltan';
  const quedan = cuantos === 1 ? 'Queda' : 'Quedan';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        subiendo
          ? `Recogiste a alguien: teclear su código. ${faltan} ${cuantos} de ${viaje.aBordo}`
          : `Alguien se bajó: teclear su código de llegada. ${quedan} ${cuantos}`
      }
      onPress={() =>
        router.push({ pathname: '/(conductor)/abordaje', params: { viaje: viaje.id } })
      }
      style={({ pressed }) => [estilos.codigos, pressed && { opacity: 0.9 }]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={estilos.codigosTitulo}>
          {subiendo ? '¿Recogiste a alguien?' : '¿Alguien se bajó?'}
        </Text>
        <Text style={estilos.codigosPie}>
          {subiendo
            ? `Teclea el código que te enseña · ${faltan.toLowerCase()} ${cuantos} de ${viaje.aBordo}`
            : `Su aporte sale hacia ti al teclear el código de llegada · ${quedan.toLowerCase()} ${cuantos}`}
        </Text>
      </View>
      <Galon tinta={color.azul700} />
    </Pressable>
  );
}

/** El galón que dice «esto lleva a algún sitio». */
function Galon({ tinta = color.rojo700 }: { tinta?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={tinta}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
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

  /* -------------------------------------------------------- la tarjeta */

  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 18,
    marginBottom: 10,
  },
  /** El siguiente pesa más: sombra del acento y sin borde, como una hoja. */
  tarjetaAlta: {
    borderWidth: 0,
    borderRadius: 24,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.2,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  /** Y el que ya salió pesa menos: arena, no blanco. */
  tarjetaApagada: { backgroundColor: 'transparent', borderColor: color.bordePorDefecto },
  apagado: { color: color.ink400 },
  apagadoFuerte: { color: color.ink600 },

  filaAlta: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  /** El bloque de fecha: el número en grande, el mes debajo. */
  fecha: {
    width: 46,
    paddingVertical: 7,
    borderRadius: radio.icono,
    backgroundColor: color.sand100,
    alignItems: 'center',
  },
  fechaApagada: { backgroundColor: color.sand200 },
  fechaDia: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  fechaMes: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 10.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
  },

  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  epigrafe: {
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul500,
    fontFamily: familia,
  },
  puntoVivo: { width: 7, height: 7, borderRadius: 999, backgroundColor: color.rojo500 },
  horaSalida: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: color.ink900,
    fontFamily: familia,
    marginTop: 2,
  },
  /** Lo que dura, al lado y en voz baja: es contexto, no la hora. */
  duracion: { fontSize: 13, fontWeight: '500', color: color.ink500 },

  /**
   * **UN SOLO ROJO POR TARJETA.** «Editar» y «Compartir el viaje» iban los
   * dos en rojo, uno en cada esquina de la misma tarjeta, tirando por igual.
   * En este sistema el rojo tiene cuatro sentidos contados y «acción
   * primaria» es uno: si dos enlaces de la misma tarjeta son primarios,
   * ninguno lo es. El rojo se queda donde de verdad hace falta —compartir el
   * viaje es lo que llena el carro— y «Editar» baja a tinta, que es lo que
   * es: una salida secundaria (29-08-2026).
   */
  enlace: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    color: color.ink600,
    fontFamily: familia,
  },

  recorrido: { marginTop: 15 },
  filaRuta: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  /** El hilo que une los dos extremos: la dirección se ve, no se deduce. */
  hilo: {
    width: 2,
    height: 14,
    marginLeft: 3.5,
    marginTop: -3,
    marginBottom: -3,
    borderRadius: 1,
    backgroundColor: color.ink200,
  },
  puntoLleno: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.rojo500 },
  puntoVacio: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  parada: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.3,
    color: color.ink900,
    fontFamily: familia,
  },
  horaParada: {
    fontSize: 13,
    lineHeight: 18,
    color: color.ink600,
    fontFamily: familia,
  },

  filete: {
    height: 1,
    backgroundColor: color.bordeSutil,
    marginTop: 15,
  },

  filaCuenta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 },
  asientos: { flexDirection: 'row', gap: 2 },
  cuentaFuerte: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  cuentaFina: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink600,
    fontFamily: familia,
  },

  /* -------------------------------------------------- lo que hay que hacer */

  // La caja azul: teclear un código es una tarea, no una alarma.
  codigos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
    borderRadius: radio.l,
    borderWidth: 1.5,
    borderColor: color.azul200,
    backgroundColor: color.azul50,
  },
  codigosTitulo: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.2175,
    color: color.azul700,
    fontFamily: familia,
  },
  codigosPie: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    fontFamily: familia,
  },

  /** Compartir es lo que llena el carro: es la acción primaria de la tarjeta. */
  compartir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginTop: 12,
    marginHorizontal: -4,
    borderRadius: radio.control,
  },
  compartirTexto: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: color.rojo700,
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
