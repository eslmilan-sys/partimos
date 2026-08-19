/**
 * El dinero que ya se movió: cancelaciones, reembolsos, pagos al conductor y
 * el libro.
 *
 * Todo con la forma exacta de sus tablas. El escrow del traspaso —«se retiene
 * hasta la llegada»— **es** el par de cuentas `passenger_escrow` →
 * `driver_payable` de `ledger_entries`; no hace falta inventar nada.
 *
 * Una diferencia real con la base, y se queda documentada aquí: la política
 * guarda `late_retain_pct`, un porcentaje, y la regla decidida del traspaso es
 * **1 $ fijo** cuando cancelas a menos de 2 h. Manda el traspaso
 * (`src/dominio/reembolsos.ts`); la base no se toca.
 */

import type {
  Cancellation,
  CancellationPolicy,
  Credit,
  LedgerEntry,
  Payout,
  PayoutBatch,
  Refund,
} from '@/tipos';

import { ANDRES_ID, DANIELA_ID } from './personas';
import { AHORA, haceDias, haceMinutos } from './reloj';

export const CANCELACION_ID = 'cc000000-0000-4000-8000-000000000001';
export const REEMBOLSO_ID = 'ff000000-0000-4000-8000-000000000001';
export const LOTE_ID = 'ba000000-0000-4000-8000-000000000001';

/** La política vigente en Panamá. Los valores son los del traspaso. */
export const politicas: CancellationPolicy[] = [
  {
    id: 'p0000000-0000-4000-8000-000000000001',
    country_code: 'PA',
    version_label: 'v1',
    effective_from: '2026-01-01T00:00:00+00:00',
    effective_to: null,
    full_refund_hours: 2,
    partial_refund_hours: 0,
    late_retain_pct: 0,
    free_cancels_count: 2,
    free_cancels_window_days: 30,
    driver_goodwill_hours: 2,
    driver_goodwill_pct: 100,
    driver_suspend_count: 3,
    driver_suspend_window_days: 90,
    no_show_wait_minutes: 15,
    created_at: '2026-01-01T00:00:00+00:00',
  },
];

/**
 * La cancelación que enseña `15c`: canceló el conductor, así que vuelve todo
 * con la tarifa y nadie retiene nada.
 */
export const cancelaciones: Cancellation[] = [
  {
    id: CANCELACION_ID,
    booking_id: '77777777-7777-4777-8777-777777777701',
    trip_id: '55555555-5555-4555-8555-555555555555',
    actor_id: ANDRES_ID,
    cancelled_by: 'driver',
    policy_id: politicas[0].id,
    hours_before: 9,
    reason_code: 'conductor_no_puede',
    reason_free_text: null,
    resolved_at: null,
    seat_resold: false,
    was_free_cancel: true,
    snap_total_cents: 630,
    snap_refund_cents: 630,
    snap_retained_cents: 0,
    snap_goodwill_cents: 0,
    created_at: haceMinutos(300),
  },
];

export const reembolsos: Refund[] = [
  {
    id: REEMBOLSO_ID,
    cancellation_id: CANCELACION_ID,
    payment_id: null,
    amount_cents: 630,
    status: 'pending',
    issued_at: null,
    provider_ref: null,
    created_at: haceMinutos(300),
  },
];

export const creditos: Credit[] = [];

/** Los envíos del lunes. `10b` enseña el último cerrado y el que viene. */
export const lotes: PayoutBatch[] = [
  {
    id: LOTE_ID,
    period_start: haceDias(7),
    period_end: haceDias(0),
    status: 'pending',
    executed_at: null,
    executed_by: null,
    notes: null,
    created_at: AHORA,
  },
];

export const pagosAlConductor: Payout[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    driver_id: ANDRES_ID,
    batch_id: LOTE_ID,
    amount_cents: 5400,
    method: 'yappy',
    status: 'pending',
    sent_at: null,
    provider_ref: null,
    created_at: AHORA,
  },
];

/**
 * Lo aportado viaje por viaje, que es lo que lee `10b`. Sale del libro: las
 * entradas de `driver_payable` de este conductor, agrupadas por reserva.
 */
export const libro: LedgerEntry[] = [
  entrada(1, 1800, 'Albrook → Chitré · 3 puestos', haceDias(5)),
  entrada(2, 1200, 'Chitré → Albrook · 2 puestos', haceDias(3)),
  entrada(3, 2400, 'Albrook → Santiago · 3 puestos', haceDias(11)),
];

function entrada(id: number, centavos: number, descripcion: string, cuando: string): LedgerEntry {
  return {
    id,
    account: 'driver_payable',
    amount_cents: centavos,
    currency: 'USD',
    description: descripcion,
    entry_group: `g${id}`,
    booking_id: null,
    payment_id: null,
    payout_id: null,
    profile_id: ANDRES_ID,
    occurred_at: cuando,
    created_at: cuando,
  };
}

/** El Yappy donde caen los envíos. La base guarda el método, no el número. */
export const yappyDelConductor: Record<string, string> = { [ANDRES_ID]: '7788', [DANIELA_ID]: '6699' };

export async function guardarCancelacion(c: Cancellation): Promise<Cancellation> {
  cancelaciones.unshift(c);
  return c;
}

export async function guardarReembolso(r: Refund): Promise<Refund> {
  reembolsos.unshift(r);
  return r;
}
