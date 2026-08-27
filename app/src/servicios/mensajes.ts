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
  /** El viaje del que se pregunta. Nulo si el hilo ya cuelga de una reserva. */
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
};

export async function hiloDelViaje(reservaId: string, yo: string): Promise<HiloDelViaje> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);

  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id)!;
  const otroId = yo === reserva.passenger_id ? viaje.driver_id : reserva.passenger_id;
  const otro = fuente.perfiles.find((p) => p.id === otroId);
  const nombre = otro ? `${otro.first_name} ${otro.last_initial ?? ''}`.trim() : 'Alguien';
  const aporte = reserva.unit_price_cents * reserva.seats;

  return demora({
    reservaId,
    viajeId: null,
    conId: null,
    otro: { id: otroId, nombre, iniciales: iniciales(nombre) },
    ruta: rutaCorta(viaje),
    cuando: viaje.departure_at,
    puesto: {
      resumen: `${formatearDineroRedondo(aporte)} · ${NOMBRE_DEL_CANAL[reserva.payment_channel]} · código ${reserva.boarding_code}`,
      estado: reserva.status === 'confirmed' ? 'Aceptado' : 'Pendiente',
      confirmado: reserva.status === 'confirmed',
    },
    mensajes: enHilo(
      fuente.mensajes.filter((m) => m.booking_id === reservaId),
      yo,
    ),
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

  return demora({
    reservaId: null,
    viajeId,
    conId,
    otro: { id: otroId, nombre, iniciales: iniciales(nombre) },
    ruta: rutaCorta(viaje),
    cuando: viaje.departure_at,
    puesto: null,
    mensajes: enHilo(
      fuente.mensajes.filter((m) => m.trip_id === viajeId && m.con_id === conId),
      yo,
    ),
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

/* ------------------------------------------------------------------ */

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
