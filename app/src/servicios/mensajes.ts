/**
 * El chat del viaje — pantallas `6c` (un hilo) y `16a` (todos).
 *
 * Un hilo por reserva, que es donde se acuerda por escrito el punto de
 * recogida. No se enseñan celulares: el hilo es la prueba de lo que se
 * acordó, y por eso los mensajes no se editan ni se borran.
 */

import { NOMBRE_DEL_CANAL } from '@/dominio/tarifas';
import type { Message } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type MensajeEnHilo = {
  id: string;
  mio: boolean;
  texto: string;
  hora: string;
};

export type HiloDelViaje = {
  reservaId: string;
  /** Con quién hablas. */
  otro: { id: string; nombre: string; iniciales: string };
  ruta: string;
  cuando: string;
  /** La tarjeta de arriba: qué puesto es este y en qué estado. */
  puesto: { resumen: string; estado: string; confirmado: boolean };
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
    otro: { id: otroId, nombre, iniciales: iniciales(nombre) },
    ruta: `${(viaje.origin_label ?? '').split(' · ')[0]} → ${(viaje.destination_label ?? '').split(' · ')[0]}`,
    cuando: viaje.departure_at,
    puesto: {
      resumen: `${aporte % 100 === 0 ? aporte / 100 : (aporte / 100).toFixed(2)} $ · ${NOMBRE_DEL_CANAL[reserva.payment_channel]} · código ${reserva.boarding_code}`,
      estado: reserva.status === 'confirmed' ? 'Aceptado' : 'Pendiente',
      confirmado: reserva.status === 'confirmed',
    },
    mensajes: fuente.mensajes
      .filter((m) => m.booking_id === reservaId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((m) => ({
        id: String(m.id),
        mio: m.sender_id === yo,
        texto: m.body,
        hora: hhmm(m.created_at),
      })),
  });
}

export async function enviarMensaje(
  reservaId: string,
  autorId: string,
  texto: string,
): Promise<Message> {
  const limpio = texto.trim();
  if (!limpio) throw new Error('No se manda un mensaje vacío');
  // La base lo limita a 2000 caracteres (`messages_body_razonable`).
  if (limpio.length > 2000) throw new Error('El mensaje es demasiado largo');

  const mensaje: Message = {
    id: fuente.mensajes.length + 1,
    booking_id: reservaId,
    sender_id: autorId,
    body: limpio,
    read_at: null,
    created_at: new Date().toISOString(),
  };
  fuente.mensajes.push(mensaje);
  return demora(mensaje);
}

/* ------------------------------------------------------------------ */

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
