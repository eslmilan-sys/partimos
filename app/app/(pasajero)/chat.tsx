/**
 * `6c` Chat del viaje — donde se acuerda el punto por escrito.
 *
 * Sin celulares a la vista: el hilo es la prueba de lo que se acordó, y por eso
 * los mensajes no se editan (en la base hay un trigger que lo impide). Arriba,
 * siempre, de qué puesto se está hablando.
 *
 * **Dos maneras de llegar aquí** (0041, 26-08-2026):
 *
 * - `?reserva=` — el hilo de un puesto ya pedido. Arriba, la tarjeta del
 *   puesto con su estado.
 * - `?viaje=&con=` — una PREGUNTA, antes de reservar nada. Arriba, en su
 *   lugar, que todavía no hay puesto pedido y el botón para pedirlo. Fingir
 *   una tarjeta de puesto aquí sería decirle a alguien que tiene reservado
 *   lo que no ha pedido.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { useMiIdOEntrar } from '@/servicios/sesion';

import {
  type HiloDelViaje,
  enviarMensaje,
  enviarPregunta,
  hiloDeViaje,
  hiloDelViaje,
  marcarHiloLeido,
} from '@/servicios/mensajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Epigrafe, Insignia } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { cuando, diaLargo, esHoy } from '@/ui/fechas';
import { Atras, Avanza, Avion, Ayuda } from '@/ui/iconos';
import { familia, color, espacio, interlinea, radio } from '@/ui/tokens';

/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, la del traspaso. */
const DEL_RECORRIDO = '77777777-7777-4777-8777-777777777700';
/** Sin sesión que preguntar —solo en simulado—, la pasajera del traspaso. */
const YO_DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

export default function Chat() {
  const router = useRouter();
  const volver = useVolver();
  const { reserva, viaje, con } = useLocalSearchParams<{
    reserva?: string;
    viaje?: string;
    con?: string;
  }>();
  const yo = useMiIdOEntrar(YO_DEL_RECORRIDO);
  /* Preguntar es de quien pregunta: sin `con` explícito —el caso normal, el
     pasajero abriendo el hilo desde la ficha del viaje— la otra parte eres tú. */
  const conId = con ?? yo;
  /* Un viaje manda sobre la reserva por defecto: `DEL_RECORRIDO` solo entra
     cuando no llega ningún parámetro y la pantalla se abre suelta. */
  const reservaId = viaje ? null : (reserva ?? DEL_RECORRIDO);
  const [hilo, setHilo] = useState<HiloDelViaje | null>(null);
  const [texto, setTexto] = useState('');
  /** El envío que no pasó, escrito junto al campo hasta reintentar. */
  const [falloEnvio, setFalloEnvio] = useState<string | null>(null);
  const lista = useRef<ScrollView>(null);

  const recargar = useCallback(async () => {
    if (!yo) return;
    /* **ABRIR ES LEER** (27-08-2026). El hilo se quedaba en «sin leer» para
       siempre: la pastilla se deducía de «el último no es mío», así que
       abrirlo no cambiaba nada. Se marca ANTES de dibujar, así la cuenta que
       se enseña ya es la de después de haber entrado. */
    await marcarHiloLeido(yo, {
      reservaId: viaje ? null : reservaId,
      viajeId: viaje ?? null,
      conId: viaje ? (conId ?? null) : null,
    }).catch(() => 0);
    if (viaje && conId) setHilo(await hiloDeViaje(viaje, conId, yo));
    else if (reservaId) setHilo(await hiloDelViaje(reservaId, yo));
  }, [reservaId, viaje, conId, yo]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  /**
   * **EL HILO SE REFRESCA SOLO MIENTRAS SE MIRA** (02-09-2026, critique).
   * Sólo se recargaba al entrar y al mandar: en la acera, con el carro
   * llegando, el «estoy a 5 min» del conductor no aparecía hasta salir y
   * volver a entrar — el momento más tenso del producto era el único sin
   * flujo. Cada 12 s se vuelve a pedir el hilo mientras la pantalla tiene
   * el foco; `recargar` ya marca leído y ordena, así que no hay saltos.
   */
  useFocusEffect(
    useCallback(() => {
      const reloj = setInterval(() => {
        recargar();
      }, 12_000);
      return () => clearInterval(reloj);
    }, [recargar]),
  );

  if (!hilo) return <Cargando />;

  const mandar = async () => {
    if (!texto.trim()) return;
    if (!yo) return;
    /* El texto NO se borra hasta que el envío pasó: si la red lo tumba, lo
       escrito sigue en el campo y el fallo se dice (02-09-2026, critique). */
    try {
      if (viaje && conId) await enviarPregunta(viaje, conId, yo, texto);
      else if (reservaId) await enviarMensaje(reservaId, yo, texto);
    } catch {
      setFalloEnvio('No se pudo enviar. Revisa la señal y prueba otra vez.');
      return;
    }
    setFalloEnvio(null);
    setTexto('');
    await recargar();
    lista.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atrás"
          onPress={() => volver()}
          style={estilos.circulo}
        >
          <Atras />
        </Pressable>
        <View style={estilos.retrato}>
          <Text style={estilos.retratoTexto}>{hilo.otro.iniciales}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={estilos.nombre} numberOfLines={1}>
            {hilo.otro.nombre}
          </Text>
          {/* **LA RUTA ABRE EL VIAJE** (01-09-2026, pedido del dueño): quien
              está escribiendo necesita mirar la ficha — la hora, el punto, el
              aporte — sin salir a buscarla. La línea que ya dice de qué viaje
              se habla es la puerta natural, con su galón para que se sepa. */}
          {hilo.viajeId ?? viaje ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver los detalles del viaje"
              onPress={() =>
                router.push({
                  pathname: '/(pasajero)/viaje',
                  params: { viaje: hilo.viajeId ?? viaje ?? '' },
                })
              }
              style={estilos.filaContexto}
            >
              <Text style={estilos.contextoEnlace} numberOfLines={1}>
                {`${hilo.ruta} · ${cuando(hilo.cuando).toLowerCase()}`}
              </Text>
              <Avanza tamano={13} tinta={color.ink400} />
            </Pressable>
          ) : (
            <Text style={estilos.contexto} numberOfLines={1}>
              {`${hilo.ruta} · ${cuando(hilo.cuando).toLowerCase()}`}
            </Text>
          )}
        </View>

        {/* **AYUDA, DONDE APARECE EL PROBLEMA** (27-08-2026, decidido por el
            dueño). Estaba sólo en Perfil → Ajustes: tres pantallas desde
            aquí, y aquí es justo donde se ve que algo va mal — no contesta,
            no aparece, cambió el punto. Un icono, no una fila: el chat es
            para escribir, y esto es la salida de emergencia. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ayuda y reembolsos"
          /* CON LA RESERVA EN LA MANO. Iba a `/(ayuda)` sin decirle de qué
             puesto se hablaba, y la ayuda tenía que adivinarlo: contra la
             base real adivinaba mal y la pantalla se quedaba girando. */
          onPress={() =>
            router.push(
              reservaId
                ? { pathname: '/(ayuda)', params: { reserva: reservaId } }
                : { pathname: '/(ayuda)' },
            )
          }
          style={estilos.circulo}
        >
          <Ayuda tamano={20} tinta={color.ink700} />
        </Pressable>
      </View>

      <View style={estilos.cuerpo}>
        {hilo.puesto ? (
          <View style={estilos.tarjetaPuesto}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Epigrafe>Tu puesto</Epigrafe>
              <Text style={estilos.resumenPuesto}>{hilo.puesto.resumen}</Text>
            </View>
            <Insignia
              fondo={hilo.puesto.confirmado ? color.hechoFondo : color.sand200}
              tinta={hilo.puesto.confirmado ? color.hechoTinta : color.ink700}
            >
              {hilo.puesto.estado}
            </Insignia>
          </View>
        ) : (
          /* La misma tarjeta, con lo que sí es cierto: preguntar no reserva
             nada. Y el botón al lado, porque el momento de pedir el puesto es
             justo después de que te contesten. */
          <View style={estilos.tarjetaPuesto}>
            {/* Sin epígrafe (28-08-2026, pedido del dueño). «SOLO UNA
                PREGUNTA» rotulaba en versalitas lo que la línea de debajo ya
                dice con todas sus palabras — y la palabra «solo» además
                quitaba importancia a lo que la persona está haciendo. */}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.resumenPuesto}>Todavía no has pedido puesto</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pedir mi puesto en este viaje"
              onPress={() =>
                router.push({ pathname: '/(pasajero)/reservar', params: { viaje: viaje ?? '' } })
              }
              style={({ pressed }) => [
                estilos.pedirPuesto,
                pressed && { backgroundColor: color.rojo600 },
              ]}
            >
              <Text style={estilos.pedirPuestoTexto}>Pedir puesto</Text>
            </Pressable>
          </View>
        )}

        <ScrollView
          ref={lista}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Un hilo de pregunta empieza vacío, y una pantalla en blanco con
              «Ayer» encima no dice qué hacer. Lo primero que uno quiere saber
              es si el conductor pasa por su lado. */}
          {hilo.mensajes.length === 0 ? (
            <View style={estilos.primeraVez}>
              <Text style={estilos.primeraVezTitulo}>
                {`Pregúntale a ${hilo.otro.nombre.split(' ')[0]} lo que necesites saber`}
              </Text>
              <Text style={estilos.primeraVezTexto}>
                Si pasa cerca de donde estás, si te deja en el camino, a qué hora sale de verdad.
                Preguntar no ocupa el puesto ni te compromete a nada.
              </Text>
            </View>
          ) : (
            /* El día, del primer mensaje. Estaba escrito «Ayer» a mano, así
               que un hilo de hace diez minutos decía ayer. */
            <Text style={estilos.dia}>{elDia(hilo.mensajes[0].cuando)}</Text>
          )}

          <View style={{ gap: 10 }}>
            {hilo.mensajes.map((m) => (
              <View key={m.id} style={[estilos.burbuja, m.mio ? estilos.mia : estilos.suya]}>
                <Text style={[estilos.textoBurbuja, m.mio && { color: '#fff' }]}>{m.texto}</Text>
                <Text style={[estilos.horaBurbuja, m.mio && { color: 'rgba(255,255,255,.72)' }]}>
                  {m.hora}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* El envío que no pasó, dicho JUNTO al campo y hasta reintentar:
            un aviso que se va solo deja el chat mudo (02-09-2026). */}
        {falloEnvio ? (
          <View style={estilos.falloEnvio}>
            <Text style={estilos.falloEnvioTexto}>{falloEnvio}</Text>
          </View>
        ) : null}

        <View style={estilos.barraEscribir}>
          {/* SIN «+» (01-09-2026, pedido del dueño). Abría el punto de
              recogida, que ya tiene su sitio en la ficha del puesto: aquí
              parecía un adjunto y no lo era. El campo se queda con todo el
              ancho, que es lo que un chat necesita. */}
          <View style={estilos.campoMensaje}>
            <TextInput
              accessibilityLabel="Escribe un mensaje"
              value={texto}
              onChangeText={setTexto}
              onSubmitEditing={mandar}
              placeholder="Escribe un mensaje"
              placeholderTextColor={color.ink400}
              returnKeyType="send"
              style={estilos.entradaMensaje}
            />
          </View>
          {/* Sin texto el botón devolvía en silencio: parecía roto. Apagado
              dice lo mismo antes de que nadie lo pulse. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            disabled={!texto.trim()}
            onPress={mandar}
            style={({ pressed }) => [
              estilos.enviar,
              !texto.trim() && estilos.enviarApagado,
              pressed && texto.trim() ? { backgroundColor: color.rojo600 } : null,
            ]}
          >
            <Avion tinta={texto.trim() ? '#fff' : color.inerteTinta} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** «Hoy», «Ayer», o el día escrito. Sin adivinar: sale de la fecha. */
function elDia(cuandoISO: string): string {
  if (esHoy(cuandoISO)) return 'Hoy';
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  if (esHoy(cuandoISO, ayer)) return 'Ayer';
  return diaLargo(cuandoISO);
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 18,
  },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Círculo, como todo retrato del v6. */
  retrato: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.ink100,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retratoTexto: { fontSize: 13.5, lineHeight: interlinea(13.5), fontWeight: '600', color: color.ink700, fontFamily: familia },
  nombre: {
    fontSize: 15.5,
    lineHeight: interlinea(16.5),
    fontWeight: '600',
    letterSpacing: -0.41,
    color: color.ink900,
    fontFamily: familia,
  },
  contexto: { fontSize: 12.5, lineHeight: interlinea(12.5), color: color.campoTexto, fontFamily: familia, ...tabular },
  filaContexto: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', maxWidth: '100%' },
  contextoEnlace: {
    flexShrink: 1,
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    fontWeight: '600',
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },

  cuerpo: { flex: 1, paddingHorizontal: espacio.gutter },
  tarjetaPuesto: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resumenPuesto: {
    fontSize: 14,
    lineHeight: interlinea(14.5),
    fontWeight: '500',
    color: color.ink900,
    marginTop: 4,
    fontFamily: familia,
    ...tabular,
  },

  /** El botón de la tarjeta: 38 de alto, el control chico del v6. */
  pedirPuesto: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedirPuestoTexto: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },

  primeraVez: {
    marginTop: 20,
    padding: 16,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    gap: 6,
  },
  primeraVezTitulo: {
    fontSize: 15,
    lineHeight: interlinea(15.5),
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  primeraVezTexto: {
    fontSize: 13.5,
    lineHeight: 20,
    color: color.ink500,
    fontFamily: familia,
  },

  dia: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: interlinea(12),
    color: color.ink600,
    marginTop: 20,
    marginBottom: 14,
    fontFamily: familia,
    ...tabular,
  },

  burbuja: { maxWidth: '78%', paddingVertical: 10, paddingHorizontal: 14 },
  /** La suya: blanca con borde de pelo, la esquina de salida recogida. */
  suya: {
    alignSelf: 'flex-start',
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
  },
  /** La mía: la superficie oscura de tinta — la única del v6. */
  mia: {
    alignSelf: 'flex-end',
    backgroundColor: color.ink900,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 18,
  },
  textoBurbuja: { fontSize: 14, lineHeight: 20, color: color.ink900, fontFamily: familia },
  horaBurbuja: {
    fontSize: 10,
    lineHeight: 14,
    color: color.ink600,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: familia,
    ...tabular,
  },

  barraEscribir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 26,
  },
  /** El campo del v6: superficie de campo, sin borde. */
  campoMensaje: {
    flex: 1,
    height: 48,
    borderRadius: radio.control,
    backgroundColor: color.sand200,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  entradaMensaje: {
    fontSize: 15.5,
    lineHeight: interlinea(15),
    color: color.ink900,
    fontFamily: familia,
    outlineStyle: 'none',
  } as never,
  falloEnvio: {
    marginHorizontal: espacio.gutter,
    marginBottom: 8,
    backgroundColor: color.rojo100,
    borderRadius: radio.m,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  falloEnvioTexto: {
    fontSize: 13,
    lineHeight: 18.85,
    fontWeight: '500',
    color: color.rojo700,
    fontFamily: familia,
  },
  /** Apagado sigue OPACO — lo que se apaga es el dibujo, no la superficie. */
  enviarApagado: { backgroundColor: color.inerteFondo },
  /** Enviar ES la acción: va en rojo, con la sombra del acento. */
  enviar: {
    width: 48,
    height: 48,
    borderRadius: radio.control,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
