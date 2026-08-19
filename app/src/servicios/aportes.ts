/**
 * Lo que te han aportado — pantalla `10b`.
 *
 * «Aportado», no «ganado»: nadie gana dinero aquí. El titular compara el total
 * con lo que costó la gasolina, porque eso es lo que el número significa.
 *
 * Sale del libro (`ledger_entries` en la cuenta `driver_payable`) y del envío
 * semanal (`payouts` dentro de su `payout_batch`). El conductor recibe el
 * aporte **entero**: la tarifa se cobró aparte, encima de lo que pagó el
 * pasajero, y nunca sale de aquí.
 */

import type { LedgerEntry } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type Tramo = 'mes' | 'todo';

export type AporteDeViaje = {
  id: string;
  ruta: string;
  detalle: string;
  centavos: number;
  cuando: string;
};

export type Aportes = {
  tramo: Tramo;
  totalCentavos: number;
  /** «junio», o «desde marzo» cuando el tramo es todo. */
  periodo: string;
  /** La frase que le da sentido al número. */
  resumen: string;
  viajes: AporteDeViaje[];
  /** Dónde cae, ya escrito: «Yappy · 7788». */
  donde: string;
  cadaCuando: string;
};

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export async function aportes(conductorId: string, tramo: Tramo = 'mes'): Promise<Aportes> {
  const ahora = new Date();
  const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

  const suyas = fuente.libro
    .filter((e) => e.profile_id === conductorId && e.account === 'driver_payable')
    .filter((e) => (tramo === 'mes' ? e.occurred_at >= desde : true))
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  const total = suyas.reduce((n, e) => n + e.amount_cents, 0);
  const puestos = suyas.reduce((n, e) => n + puestosDe(e), 0);

  return demora({
    tramo,
    totalCentavos: total,
    periodo: tramo === 'mes' ? MESES[ahora.getMonth()] : 'todo',
    resumen: `${suyas.length} ${suyas.length === 1 ? 'viaje' : 'viajes'}, ${puestos} ${puestos === 1 ? 'puesto' : 'puestos'}. La gasolina de ${MESES[ahora.getMonth()]} te sale casi cubierta.`,
    viajes: suyas.map((e) => ({
      id: String(e.id),
      ruta: e.description.split(' · ')[0],
      detalle: e.description.split(' · ').slice(1).join(' · '),
      centavos: e.amount_cents,
      cuando: e.occurred_at,
    })),
    donde: `Yappy · ${fuente.yappyDelConductor[conductorId as keyof typeof fuente.yappyDelConductor] ?? ''}`,
    cadaCuando: 'Se envía cada lunes',
  });
}

/** El envío de esta semana, con su ventana. */
export async function proximoEnvio(conductorId: string) {
  const pago = fuente.pagosAlConductor.find(
    (p) => p.driver_id === conductorId && p.status === 'pending',
  );
  const lote = fuente.lotes.find((l) => l.id === pago?.batch_id);
  return demora(
    pago && lote
      ? {
          centavos: pago.amount_cents,
          desde: lote.period_start,
          hasta: lote.period_end,
          enviado: pago.sent_at != null,
        }
      : null,
  );
}

/** Los puestos que dice la descripción: «3 puestos · Yappy». */
function puestosDe(e: LedgerEntry): number {
  const m = e.description.match(/(\d+)\s+puestos?/);
  return m ? Number(m[1]) : 0;
}
