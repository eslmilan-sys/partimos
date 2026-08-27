/**
 * El abordaje — pantallas `1f` (pasajero) y `1g` (conductor).
 *
 * Cada pasajero tiene un código de cuatro dígitos. El conductor lo teclea al
 * subirlo. Esa marca es lo que prueba que el viaje pasó: sin ella no se libera
 * el aporte, y el reembolso por conductor que no llegó depende de que no exista.
 */

import {
  type ReservaCerrable,
  cuandoSeCierraSola,
  estadoDelCierre,
  sePuedeConfirmar,
} from '@/dominio/cierre';
import { seCobraEnLaApp } from '@/dominio/tarifas';
import type { ReservaFila } from '@/tipos';

import { fuente } from './_fuente';
import { liberarAporte } from './pagos';
import { formatearDineroRedondo } from '@/ui/dinero';

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
  /** Bajó y su aporte ya está liberado: el viaje, para esa persona, cerró. */
  cerrado: boolean;
};

/**
 * EL VIAJE TIENE UN SOLO CÓDIGO, Y ES EL DE SUBIR.
 *
 * `subir` mientras quede alguien por abordar; `esperando` cuando ya están
 * todos dentro y el cierre depende de que cada quien diga que llegó bien;
 * `listo` cuando no queda nadie.
 *
 * **Antes había un segundo código**, tecleado por el conductor al bajar a
 * cada pasajero. Se retiró el 27-08-2026: al bajar, con la maleta en la mano
 * y el carro en doble fila, nadie saca el teléfono para teclear cuatro
 * dígitos — y si no lo hacía, la reserva se quedaba abierta para siempre.
 * Ahora cierra el pasajero, o se cierra sola a las 24 h (`dominio/cierre`).
 */
export type FaseDelViaje = 'subir' | 'esperando' | 'listo';

export type ListaDeAbordaje = {
  parada: string;
  salida: string;
  pasajeros: PasajeroDeAbordaje[];
  /** El que toca teclear ahora: el primero sin marcar. */
  siguiente: PasajeroDeAbordaje | null;
  /** El primero que subió y todavía no ha bajado. */
  siguientePorBajar: PasajeroDeAbordaje | null;
  fase: FaseDelViaje;
  abordados: number;
  cerrados: number;
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
        cerrado: r.released_at != null,
      };
    });

  const abordados = pasajeros.filter((p) => p.abordado).length;
  const cerrados = pasajeros.filter((p) => p.cerrado).length;
  const siguiente = pasajeros.find((p) => !p.abordado) ?? null;
  const siguientePorBajar = pasajeros.find((p) => p.abordado && !p.cerrado) ?? null;

  return demora({
    parada: primera?.custom_label ?? viaje.origin_label ?? '',
    salida: primera?.scheduled_at ?? viaje.departure_at,
    pasajeros,
    siguiente,
    siguientePorBajar,
    fase: siguiente ? 'subir' : siguientePorBajar ? 'esperando' : 'listo',
    abordados,
    cerrados,
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

/**
 * EL CIERRE: LO DICE QUIEN VIAJÓ.
 *
 * «Todo bien». Hace tres cosas de una vez, y por eso están juntas: la reserva
 * pasa a `completed`, el pago retenido se captura y `released_at` queda
 * escrito. Sin esto el aporte se quedaba retenido para siempre —era el «pago
 * nunca liberado» del informe— y el conductor no cobraba nunca.
 *
 * Solo cierra quien subió: sin `boarded_at` no hay viaje que cerrar, y ese es
 * justo el hecho en que se apoya el reembolso por conductor que no llegó.
 *
 * Y no antes de llegar: confirmar a mitad de camino sería dar por bueno lo
 * que todavía no ha pasado. La regla vive en `dominio/cierre`.
 */
export async function confirmarQueLlegue(reservaId: string): Promise<boolean> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) return demora(false);
  if (!sePuedeConfirmar(comoCerrable(reserva))) return demora(false);

  await cerrar(reserva);
  return demora(true);
}

/**
 * LAS QUE SE CIERRAN SOLAS. Pasadas las 24 h desde la llegada, un viaje que
 * ocurrió se da por bueno aunque nadie haya abierto la app.
 *
 * **Se barre al leer**, no por un reloj del servidor: no hay cron contratado
 * todavía, y una reserva que se queda abierta es plata que no llega. El día
 * que exista el cron, esto se borra y nadie se entera — la regla ya está
 * fuera, en el dominio.
 */
export async function cerrarLasVencidas(perfilId?: string): Promise<number> {
  const candidatas = fuente.reservas.filter(
    (r) =>
      (!perfilId || r.passenger_id === perfilId) &&
      r.boarded_at != null &&
      r.released_at == null &&
      estadoDelCierre(comoCerrable(r)) === 'se-cierra-sola',
  );
  for (const r of candidatas) await cerrar(r);
  return demora(candidatas.length, 0);
}

async function cerrar(reserva: ReservaFila): Promise<void> {
  const ahora = new Date().toISOString();
  await fuente.actualizarReserva(reserva.id, { status: 'completed', completed_at: ahora });
  // libera el aporte y escribe `released_at`
  await liberarAporte(reserva.id);
}

/** La reserva, dicha como la lee el dominio del cierre. */
function comoCerrable(reserva: ReservaFila): ReservaCerrable {
  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  return {
    boardedAt: reserva.boarded_at,
    releasedAt: reserva.released_at,
    llegadaPrevista: viaje?.arrival_estimate_at ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Llegada — pantalla `1i`
 * ------------------------------------------------------------------ */

export type Llegada = {
  reservaId: string;
  /** En qué punto está el cierre. Ya no hay código que enseñar. */
  estado: ReturnType<typeof estadoDelCierre>;
  /** Cuándo se dará por bueno solo, si nadie dice nada. */
  seCierraSola: string | null;
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
    estado: estadoDelCierre(comoCerrable(reserva)),
    seCierraSola: cuandoSeCierraSola(comoCerrable(reserva)),
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
  const enDolares = formatearDineroRedondo(aporte);
  if (!seCobraEnLaApp(reserva.payment_channel)) {
    return `Le pagas ${enDolares} en efectivo al llegar.`;
  }
  if (reserva.payment_channel === 'card') {
    return 'Ya se cobró a tu tarjeta. Se le manda al cerrar el viaje.';
  }
  return 'Se le manda por Yappy al cerrar el viaje.';
}
