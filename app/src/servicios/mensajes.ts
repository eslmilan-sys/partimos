/**
 * El chat del viaje — pantallas `6c` (un hilo) y `16a` (todos).
 *
 * Un hilo por reserva, que es donde se acuerda por escrito el punto de
 * recogida. No se enseñan celulares: el hilo es la prueba de lo que se
 * acordó, y por eso los mensajes no se editan ni se borran.
 *
 * **Y un hilo por pregunta** (0041, 26-08-2026). Antes había que pedir el
 * puesto —ocupar un sitio, arrancar el reloj del conductor— para poder
 * preguntar «¿pasas por la vía Ricardo J. Alfaro?». Al revés de como decide
 * la gente. Ahora un hilo cuelga de una reserva o de un viaje, nunca de las
 * dos: la clave del hilo de pregunta es (viaje, quien pregunta), y sus dos
 * partes son esa persona y el conductor. Nadie más, ni siquiera otro
 * pasajero del mismo viaje.
 */

import { formatearDineroRedondo } from '@/ui/dinero';
import { NOMBRE_DEL_CANAL } from '@/dominio/tarifas';
import type { Message } from '@/tipos';

import { fuente } from './_fuente';
import { rutaCorta } from './viajes';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type MensajeEnHilo = {
  id: string;
  mio: boolean;
  texto: string;
  hora: string;
  /** Cuándo se dijo, entero: la pantalla necesita el día, no solo la hora. */
  cuando: string;
};

export type HiloDelViaje = {
  /** La reserva de la que cuelga el hilo. Nulo si todavía es una pregunta. */
  reservaId: string | null;
  /**
   * El viaje del que se habla — SIEMPRE, cuelgue el hilo de donde cuelgue
   * (01-09-2026): la cabecera del chat abre la ficha del viaje con él. En
   * un hilo de pregunta es media clave del hilo; en uno de reserva, contexto.
   */
  viajeId: string | null;
  /**
   * Quien preguntó: la otra mitad de la clave del hilo, junto con el viaje.
   * Va en el hilo y no se recalcula en cada pantalla porque desde el lado del
   * conductor es `otro.id` y desde el del pasajero eres tú — la misma clave
   * deducida de dos maneras es la misma clave escrita dos veces.
   */
  conId: string | null;
  /** Con quién hablas. */
  otro: { id: string; nombre: string; iniciales: string };
  ruta: string;
  cuando: string;
  /**
   * La tarjeta de arriba: qué puesto es este y en qué estado. **Nula mientras
   * sea una pregunta** — no hay puesto que resumir, y fingir uno sería decirle
   * a alguien que tiene reservado lo que no ha pedido.
   */
  puesto: { resumen: string; estado: string; confirmado: boolean } | null;
  mensajes: MensajeEnHilo[];
  /**
   * CUÁNTOS TE ESCRIBIERON Y NO HAS ABIERTO.
   *
   * Sale de `read_at`, no de «el último no es mío» como antes: con aquello,
   * abrir el hilo no cambiaba nada y la pastilla se quedaba encendida para
   * siempre (visto por el dueño el 27-08-2026). Es un hecho de la base, no
   * una deducción de la pantalla.
   */
  sinLeer: number;
};

export async function hiloDelViaje(reservaId: string, yo: string): Promise<HiloDelViaje> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);

  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id)!;
  const otroId = yo === reserva.passenger_id ? viaje.driver_id : reserva.passenger_id;
  const otro = fuente.perfiles.find((p) => p.id === otroId);
  const nombre = otro ? `${otro.first_name} ${otro.last_initial ?? ''}`.trim() : 'Alguien';
  const aporte = reserva.unit_price_cents * reserva.seats;
  const deLaReserva = fuente.mensajes.filter((m) => m.booking_id === reservaId);

  return demora({
    reservaId,
    viajeId: reserva.trip_id,
    conId: null,
    otro: { id: otroId, nombre, iniciales: iniciales(nombre) },
    ruta: rutaCorta(viaje),
    cuando: viaje.departure_at,
    puesto: {
      resumen: `${formatearDineroRedondo(aporte)} · ${NOMBRE_DEL_CANAL[reserva.payment_channel]} · código ${reserva.boarding_code}`,
      estado: reserva.status === 'confirmed' ? 'Aceptado' : 'Pendiente',
      confirmado: reserva.status === 'confirmed',
    },
    mensajes: enHilo(deLaReserva, yo),
    sinLeer: cuantosSinLeerDe(deLaReserva, yo),
  });
}

/**
 * El hilo de PREGUNTA de un viaje: el conductor y UNA persona interesada.
 *
 * `conId` es quien pregunta —siempre el pasajero, nunca el conductor—, así
 * que sirve de clave tanto si abres el hilo desde tu lado como si el
 * conductor lo abre desde el suyo.
 */
export async function hiloDeViaje(
  viajeId: string,
  conId: string,
  yo: string,
): Promise<HiloDelViaje> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);
  if (conId === viaje.driver_id) {
    throw new Error('El conductor no es la otra parte de su propio hilo');
  }

  const otroId = yo === viaje.driver_id ? conId : viaje.driver_id;
  const otro = fuente.perfiles.find((p) => p.id === otroId);
  const nombre = otro ? `${otro.first_name} ${otro.last_initial ?? ''}`.trim() : 'Alguien';
  const delHilo = fuente.mensajes.filter((m) => m.trip_id === viajeId && m.con_id === conId);

  return demora({
    reservaId: null,
    viajeId,
    conId,
    otro: { id: otroId, nombre, iniciales: iniciales(nombre) },
    ruta: rutaCorta(viaje),
    cuando: viaje.departure_at,
    puesto: null,
    mensajes: enHilo(delHilo, yo),
    sinLeer: cuantosSinLeerDe(delHilo, yo),
  });
}

/**
 * Todas las preguntas en las que eres parte — las que hiciste y, si manejas,
 * las que te hicieron. Es lo que evita que un hilo abierto desde un viaje se
 * pierda: se empieza en la ficha del viaje y se vuelve a encontrar aquí.
 */
export async function hilosDePregunta(yo: string): Promise<HiloDelViaje[]> {
  const claves = new Map<string, { viajeId: string; conId: string }>();
  for (const m of fuente.mensajes) {
    if (!m.trip_id || !m.con_id) continue;
    const viaje = fuente.viajes.find((v) => v.id === m.trip_id);
    if (!viaje) continue;
    if (m.con_id !== yo && viaje.driver_id !== yo) continue;
    claves.set(`${m.trip_id}·${m.con_id}`, { viajeId: m.trip_id, conId: m.con_id });
  }
  return Promise.all([...claves.values()].map((k) => hiloDeViaje(k.viajeId, k.conId, yo)));
}

export async function enviarMensaje(
  reservaId: string,
  autorId: string,
  texto: string,
): Promise<Message> {
  const limpio = revisar(texto);

  const mensaje: Message = {
    id: fuente.mensajes.length + 1,
    booking_id: reservaId,
    sender_id: autorId,
    body: limpio,
    read_at: null,
    created_at: new Date().toISOString(),
  };
  return demora(await fuente.guardarMensaje(mensaje));
}

/**
 * Preguntar por un viaje sin pedir puesto. **No toca `bookings`**: ni ocupa
 * un sitio, ni arranca el reloj de las cuatro horas del conductor.
 *
 * `booking_id` va nulo a propósito y `trip_id`/`con_id` llenos: la base impone
 * que sea lo uno o lo otro (`messages_de_una_cosa`), y el disparador
 * `messages_hilo_coherente` impide abrir un hilo a nombre de un tercero
 * incluso con la llave de servicio.
 */
export async function enviarPregunta(
  viajeId: string,
  conId: string,
  autorId: string,
  texto: string,
): Promise<Message> {
  const limpio = revisar(texto);

  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);
  if (autorId !== viaje.driver_id && autorId !== conId) {
    throw new Error('Solo el conductor y quien pregunta escriben en este hilo');
  }

  const mensaje: Message = {
    id: fuente.mensajes.length + 1,
    booking_id: null,
    trip_id: viajeId,
    con_id: conId,
    sender_id: autorId,
    body: limpio,
    read_at: null,
    created_at: new Date().toISOString(),
  };
  return demora(await fuente.guardarMensaje(mensaje));
}

/**
 * ABRIR UN HILO LO MARCA LEÍDO.
 *
 * Sólo los que te escribieron: marcar como leído el tuyo no querría decir
 * nada, y la política de la base sólo deja tocar `read_at` de todas formas.
 * Devuelve cuántos se marcaron, por si la pantalla quiere refrescar.
 */
export async function marcarHiloLeido(
  yo: string,
  hilo: { reservaId: string | null; viajeId: string | null; conId: string | null },
): Promise<number> {
  const suyos = fuente.mensajes.filter(
    (m) =>
      m.sender_id !== yo &&
      m.read_at == null &&
      (hilo.reservaId
        ? m.booking_id === hilo.reservaId
        : m.trip_id === hilo.viajeId && m.con_id === hilo.conId),
  );
  if (suyos.length === 0) return 0;
  return fuente.marcarMensajesLeidos(suyos.map((m) => m.id));
}

/**
 * CUÁNTOS MENSAJES SIN LEER TIENES EN TODA LA APP.
 *
 * Es lo que enciende la pastilla de la pestaña Chats. Cuenta los de las dos
 * clases de hilo —reserva y pregunta— porque para quien mira la barra son lo
 * mismo: alguien le escribió.
 */
export async function cuantosSinLeer(yo: string | null): Promise<number> {
  if (!yo) return demora(0, 0);
  const mios = fuente.mensajes.filter((m) => {
    if (m.sender_id === yo || m.read_at != null) return false;
    if (m.booking_id) {
      const r = fuente.reservas.find((x) => x.id === m.booking_id);
      if (!r) return false;
      const v = fuente.viajes.find((x) => x.id === r.trip_id);
      return r.passenger_id === yo || v?.driver_id === yo;
    }
    if (!m.trip_id) return false;
    const v = fuente.viajes.find((x) => x.id === m.trip_id);
    return m.con_id === yo || v?.driver_id === yo;
  });
  return demora(mios.length, 0);
}

/* ------------------------------------------------------------------ */

/** Los que te escribieron y no has abierto. */
function cuantosSinLeerDe(mensajes: Message[], yo: string): number {
  return mensajes.filter((m) => m.sender_id !== yo && m.read_at == null).length;
}

/** Los mensajes de un hilo, en orden y ya vestidos de burbuja. */
function enHilo(mensajes: Message[], yo: string): MensajeEnHilo[] {
  return mensajes
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((m) => ({
      id: String(m.id),
      mio: m.sender_id === yo,
      texto: m.body,
      hora: hhmm(m.created_at),
      cuando: m.created_at,
    }));
}

/** El mismo largo que impone la base (`messages_body_razonable`). */
function revisar(texto: string): string {
  const limpio = texto.trim();
  if (!limpio) throw new Error('No se manda un mensaje vacío');
  if (limpio.length > 2000) throw new Error('El mensaje es demasiado largo');
  return limpio;
}

function hhmm(cuando: string): string {
  return new Intl.DateTimeFormat('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Panama',
  }).format(new Date(cuando));
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
