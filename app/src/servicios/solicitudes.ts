/**
 * Solicitudes de puesto — pantalla `11a`.
 *
 * Aquí es donde se mueve la plata: aceptar retiene el aporte; no lo entrega.
 * El aporte se libera cuando se confirma la llegada (`1i`).
 */

import { resumenCorto, resumenDeEquipaje } from '@/dominio/equipaje';
import { tarifaDeServicio } from '@/dominio/tarifas';
import type { EstadoDeSolicitud, Payment, ReservaFila } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/** Horas que tiene el conductor para responder antes de que caduque. */
export const HORAS_PARA_RESPONDER = 4;

export type Solicitud = {
  id: string;
  pasajero: { id: string; nombre: string; reputacion: string };
  punto: string;
  minutosDeDesvio: number | null;
  equipaje: string;
  aporteCentavos: number;
  estado: EstadoDeSolicitud;
  expiraEn: string;
  /** A menos de una hora de caducar, la pastilla va en rojo sólido. */
  urgente: boolean;
};

export type PasajeroConfirmado = {
  /** El id de la reserva, para no repetir a quien acabas de aceptar. */
  reservaId: string;
  id: string;
  nombre: string;
  punto: string;
  equipaje: string;
  /** En efectivo todavía no hay nada retenido: se paga al subir. */
  pagado: boolean;
};

/** Lo que la cabecera cuenta: solicitudes nuevas y puestos vendidos. */
export type ResumenDeSolicitudes = {
  /** Para la cabecera: «Hoy 14:50 · Albrook → Chitré». */
  viaje: { salida: string; origen: string; destino: string };
  solicitudes: Solicitud[];
  confirmados: PasajeroConfirmado[];
  puestosVendidos: number;
  puestosOfrecidos: number;
  texto: string;
};

export async function listarSolicitudes(
  viajeId: string,
  ahora = new Date(),
): Promise<ResumenDeSolicitudes> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);

  const delViaje = fuente.reservas.filter((r) => r.trip_id === viajeId);
  const solicitudes = delViaje
    .filter((r) => r.status === 'pending')
    .map((r) => comoSolicitud(r, ahora));
  const confirmados = delViaje
    .filter((r) => r.status === 'confirmed' || r.status === 'completed')
    .map(comoConfirmado);

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;

  return demora({
    viaje: {
      salida: viaje.departure_at,
      origen: (viaje.origin_label ?? '').split(' · ')[0],
      destino: (viaje.destination_label ?? '').split(' · ')[0],
    },
    solicitudes,
    confirmados,
    puestosVendidos: confirmados.length,
    puestosOfrecidos: viaje.seats_offered,
    texto:
      `${
        pendientes === 0
          ? 'Sin solicitudes nuevas'
          : pendientes === 1
            ? '1 solicitud nueva'
            : `${pendientes} solicitudes nuevas`
      } · ${confirmados.length} de ${viaje.seats_offered} puestos vendidos`,
  });
}

/**
 * El conductor acepta. Se retiene el aporte del pasajero — no es del conductor
 * todavía — y el puesto queda vendido.
 */
export async function aceptarSolicitud(
  id: string,
): Promise<{ reserva: ReservaFila; pago: Payment; puestosLibres: number }> {
  const reserva = fuente.reservas.find((r) => r.id === id);
  if (!reserva) throw new Error(`No existe la solicitud ${id}`);
  if (reserva.status !== 'pending') throw new Error('Esta solicitud ya no está pendiente');
  if (puestosLibresDe(reserva.trip_id) < reserva.seats) {
    throw new Error('Ya no quedan puestos en este viaje');
  }

  const ahora = new Date().toISOString();
  const confirmada = await fuente.actualizarReserva(id, {
    status: 'confirmed',
    confirmed_at: ahora,
    proposal_accepted: reserva.proposed_point ? true : null,
  });

  const pago: Payment = {
    id: nuevoId(),
    booking_id: id,
    provider: reserva.payment_channel === 'card' ? 'tarjeta' : 'yappy',
    provider_ref: null,
    provider_order_id: null,
    amount_cents: reserva.total_cents,
    fee_cents: tarifaDeServicio(reserva.unit_price_cents * reserva.seats, reserva.payment_channel),
    // retenido, no cobrado: el conductor no lo tiene hasta la llegada
    status: 'authorized',
    raw_payload: null,
    captured_at: null,
    created_at: ahora,
  };
  await fuente.guardarPago(pago);

  return demora({ reserva: confirmada, pago, puestosLibres: puestosLibresDe(reserva.trip_id) });
}

/** Rechazar no pide motivo. */
export async function rechazarSolicitud(id: string): Promise<ReservaFila> {
  return demora(
    await fuente.actualizarReserva(id, {
      status: 'cancelled_driver',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'rechazada_por_el_conductor',
    }),
  );
}

export function puestosLibresDe(viajeId: string): number {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) return 0;
  const vendidos = fuente.reservas.filter(
    (r) => r.trip_id === viajeId && (r.status === 'confirmed' || r.status === 'completed'),
  ).length;
  return Math.max(0, viaje.seats_offered - vendidos);
}

/* ------------------------------------------------------------------ */

function nombreDe(id: string): string {
  const p = fuente.perfiles.find((x) => x.id === id);
  return p ? `${p.first_name} ${p.last_initial ?? ''}`.trim() : 'Alguien';
}

function comoSolicitud(r: ReservaFila, ahora: Date): Solicitud {
  // Una solicitud sin caducidad no ha empezado a correr: se enseña con las
  // cuatro horas enteras por delante, no como caducada hace un siglo.
  const caduca = r.expires_at ?? new Date(ahora.getTime() + HORAS_PARA_RESPONDER * 3_600_000).toISOString();
  const restante = new Date(caduca).getTime() - ahora.getTime();
  const rep = fuente.reputacion[r.passenger_id];
  return {
    id: r.id,
    pasajero: {
      id: r.passenger_id,
      nombre: nombreDe(r.passenger_id),
      reputacion:
        !rep || rep.viajes === 0
          ? 'Nueva · sin viajes'
          : `${rep.calificacion?.toFixed(1)} · ${rep.viajes} viajes`,
    },
    punto: r.proposed_point ?? '',
    minutosDeDesvio: r.detour_minutes,
    equipaje: resumenDeEquipaje({ mochilas: r.mochilas, maletas: r.maletas }),
    aporteCentavos: r.unit_price_cents * r.seats,
    estado: restante <= 0 ? 'caducada' : 'pendiente',
    expiraEn: restante <= 0 ? 'Caducada' : `Expira en ${textoRestante(restante)}`,
    urgente: restante > 0 && restante < 3600_000,
  };
}

function comoConfirmado(r: ReservaFila): PasajeroConfirmado {
  return {
    reservaId: r.id,
    id: r.passenger_id,
    nombre: nombreDe(r.passenger_id),
    punto: r.proposed_point ?? '',
    equipaje: resumenCorto({ mochilas: r.mochilas, maletas: r.maletas }),
    pagado: r.payment_channel !== 'external',
  };
}

function textoRestante(ms: number): string {
  const minutos = Math.floor(ms / 60_000);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
}

let contador = 0;
function nuevoId(): string {
  contador += 1;
  return `bbbbbbbb-bbbb-4bbb-8bbb-${String(contador).padStart(12, '0')}`;
}
