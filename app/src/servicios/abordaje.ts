/**
 * El abordaje — pantallas `1f` (pasajero) y `1g` (conductor).
 *
 * Cada pasajero tiene un código de cuatro dígitos. El conductor lo teclea al
 * subirlo. Esa marca es lo que prueba que el viaje pasó: sin ella no se libera
 * el aporte, y el reembolso por conductor que no llegó depende de que no exista.
 */

import { seCobraEnLaApp } from '@/dominio/tarifas';
import type { ReservaFila } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type CodigoDeAbordaje = {
  reservaId: string;
  /** Los cuatro dígitos, ya separados. */
  digitos: string[];
  conductor: { nombre: string; carro: string; placa: string };
  salida: string;
  recogida: { etiqueta: string; hora: string };
  destino: { etiqueta: string; hora: string };
  aporteCentavos: number;
  /** Qué pasa con la plata, según el método elegido. */
  lineaDePago: string;
  abordado: boolean;
};

/** Lo que el pasajero enseña en `1f`. */
export async function codigoDeAbordaje(reservaId: string): Promise<CodigoDeAbordaje> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);

  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id)!;
  const conductor = fuente.perfiles.find((p) => p.id === viaje.driver_id);
  const carro = fuente.vehiculos.find((c) => c.id === viaje.vehicle_id);
  const paradas = fuente.paradas
    .filter((p) => p.trip_id === viaje.id)
    .sort((a, b) => a.sequence - b.sequence);
  const primera = paradas[0];
  const ultima = paradas[paradas.length - 1];
  const aporte = reserva.unit_price_cents * reserva.seats;

  return demora({
    reservaId,
    digitos: (reserva.boarding_code ?? '····').split(''),
    conductor: {
      nombre: `${conductor?.first_name ?? ''} ${conductor?.last_initial ?? ''}`.trim(),
      carro: [carro?.make, carro?.model, carro?.color].filter(Boolean).join(' '),
      placa: fuente.placasCompletas[carro?.id ?? ''] ?? '',
    },
    salida: viaje.departure_at,
    recogida: {
      etiqueta: reserva.proposed_point ?? primera?.custom_label ?? '',
      hora: primera?.scheduled_at ?? viaje.departure_at,
    },
    destino: {
      etiqueta: ultima?.custom_label ?? viaje.destination_label ?? '',
      hora: ultima?.scheduled_at ?? viaje.arrival_estimate_at ?? viaje.departure_at,
    },
    aporteCentavos: aporte,
    lineaDePago: lineaDePago(reserva),
    abordado: reserva.boarded_at != null,
  });
}

export type PasajeroDeAbordaje = {
  reservaId: string;
  nombre: string;
  puestos: number;
  abordado: boolean;
};

export type ListaDeAbordaje = {
  parada: string;
  salida: string;
  pasajeros: PasajeroDeAbordaje[];
  /** El que toca teclear ahora: el primero sin marcar. */
  siguiente: PasajeroDeAbordaje | null;
  abordados: number;
  total: number;
};

/** Lo que el conductor ve en `1g`. */
export async function listaDeAbordaje(viajeId: string): Promise<ListaDeAbordaje> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);

  const primera = fuente.paradas
    .filter((p) => p.trip_id === viajeId)
    .sort((a, b) => a.sequence - b.sequence)[0];

  const pasajeros: PasajeroDeAbordaje[] = fuente.reservas
    .filter((r) => r.trip_id === viajeId && (r.status === 'confirmed' || r.status === 'completed'))
    .map((r) => {
      const p = fuente.perfiles.find((x) => x.id === r.passenger_id);
      return {
        reservaId: r.id,
        nombre: p ? `${p.first_name} ${p.last_initial ?? ''}`.trim() : 'Alguien',
        puestos: r.seats,
        abordado: r.boarded_at != null,
      };
    });

  const abordados = pasajeros.filter((p) => p.abordado).length;

  return demora({
    parada: primera?.custom_label ?? viaje.origin_label ?? '',
    salida: primera?.scheduled_at ?? viaje.departure_at,
    pasajeros,
    siguiente: pasajeros.find((p) => !p.abordado) ?? null,
    abordados,
    total: pasajeros.length,
  });
}

export type ResultadoDeAbordaje =
  | { ok: true; reservaId: string; nombre: string }
  | { ok: false; motivo: 'no-coincide' | 'ya-abordo' };

/**
 * El conductor teclea el código. Si coincide con alguien que aún no ha subido,
 * queda marcado. En producción esto se verifica en el servidor.
 */
export async function verificarCodigo(
  viajeId: string,
  codigo: string,
): Promise<ResultadoDeAbordaje> {
  const reserva = fuente.reservas.find(
    (r) =>
      r.trip_id === viajeId &&
      (r.status === 'confirmed' || r.status === 'completed') &&
      r.boarding_code === codigo,
  );
  if (!reserva) return demora({ ok: false, motivo: 'no-coincide' } as const);
  if (reserva.boarded_at) return demora({ ok: false, motivo: 'ya-abordo' } as const);

  await fuente.actualizarReserva(reserva.id, { boarded_at: new Date().toISOString() });
  const p = fuente.perfiles.find((x) => x.id === reserva.passenger_id);

  return demora({
    ok: true,
    reservaId: reserva.id,
    nombre: p ? `${p.first_name} ${p.last_initial ?? ''}`.trim() : 'Alguien',
  } as const);
}

/* ------------------------------------------------------------------ *
 * Llegada — pantalla `1i`
 * ------------------------------------------------------------------ */

export type Llegada = {
  reservaId: string;
  /** El segundo código: el que cierra el viaje. */
  digitos: string[];
  ciudad: string;
  lugar: string;
  llegadaHora: string;
  conductor: string;
  /** Dónde le llega la plata al conductor. */
  destinoDelDinero: string;
  aporteCentavos: number;
  /** Lo que Partimos se queda del aporte: nada. */
  comisionCentavos: number;
  totalCentavos: number;
  liberado: boolean;
};

export async function resumenDeLlegada(reservaId: string): Promise<Llegada> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);

  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id)!;
  const conductor = fuente.perfiles.find((p) => p.id === viaje.driver_id);
  const paradas = fuente.paradas
    .filter((p) => p.trip_id === viaje.id)
    .sort((a, b) => a.sequence - b.sequence);
  const ultima = paradas[paradas.length - 1];
  const etiqueta = ultima?.custom_label ?? viaje.destination_label ?? '';
  const [ciudad, lugar] = etiqueta.split(' · ');

  return demora({
    reservaId,
    digitos: (reserva.arrival_code ?? '····').split(''),
    ciudad: ciudad ?? etiqueta,
    lugar: lugar ?? '',
    llegadaHora: ultima?.scheduled_at ?? viaje.arrival_estimate_at ?? viaje.departure_at,
    conductor: conductor?.first_name ?? 'El conductor',
    destinoDelDinero:
      reserva.payment_channel === 'external' ? 'la mano, en efectivo' : 'su Yappy',
    aporteCentavos: reserva.unit_price_cents * reserva.seats,
    // El conductor recibe el aporte entero: la tarifa se cobró aparte.
    comisionCentavos: 0,
    totalCentavos: reserva.unit_price_cents * reserva.seats,
    liberado: reserva.released_at != null,
  });
}

/** Nadie apareció. Sin marca de abordaje, el aporte no se libera. */
export async function marcarNoShow(reservaId: string): Promise<ReservaFila> {
  return demora(
    await fuente.actualizarReserva(reservaId, {
      status: 'no_show_passenger',
      cancelled_at: new Date().toISOString(),
    }),
  );
}

/* ------------------------------------------------------------------ */

function lineaDePago(reserva: ReservaFila): string {
  const aporte = reserva.unit_price_cents * reserva.seats;
  const enDolares = aporte % 100 === 0 ? `${aporte / 100} $` : `${(aporte / 100).toFixed(2)} $`;
  if (!seCobraEnLaApp(reserva.payment_channel)) {
    return `Le pagas ${enDolares} en efectivo al llegar.`;
  }
  if (reserva.payment_channel === 'card') {
    return 'Ya se cobró a tu tarjeta. Se le manda al cerrar el viaje.';
  }
  return 'Se le manda por Yappy al cerrar el viaje.';
}
