/**
 * El pago del aporte — pantallas `7b` y `9a`.
 *
 * La tarifa se calcula sobre el aporte y se suma encima. El conductor recibe
 * el aporte completo con cualquier método; la tarifa es de Partimos.
 */

import {
  type CanalDePago,
  NOMBRE_DEL_CANAL,
  TARIFA_PCT,
  seCobraEnLaApp,
  tarifaDeServicio,
  totalQuePagaElPasajero,
} from '@/dominio/tarifas';
import type { Payment } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type MetodoDePago = {
  canal: CanalDePago;
  nombre: string;
  /** «Tarifa 5 % · 0,30 $» o «Sin tarifa · le pagas al subir». */
  detalle: string;
  /** «Recomendado» en el más barato de Panamá. */
  distintivo: string;
};

/** Los métodos que el viaje admite, con su tarifa ya calculada sobre este aporte. */
export async function metodosDePago(viajeId: string): Promise<MetodoDePago[]> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);
  const aporte = viaje.price_cents;

  const todos: MetodoDePago[] = [
    {
      canal: 'yappy_app',
      nombre: NOMBRE_DEL_CANAL.yappy_app,
      detalle: `Tarifa ${TARIFA_PCT.yappy_app} % · ${dinero(tarifaDeServicio(aporte, 'yappy_app'))}`,
      distintivo: 'Recomendado',
    },
    {
      canal: 'card',
      nombre: NOMBRE_DEL_CANAL.card,
      detalle: `Tarifa ${TARIFA_PCT.card} % · ${dinero(tarifaDeServicio(aporte, 'card'))}`,
      distintivo: '',
    },
    {
      canal: 'external',
      nombre: NOMBRE_DEL_CANAL.external,
      detalle: 'Sin tarifa · le pagas al subir',
      distintivo: '',
    },
  ];

  // El conductor decide si acepta efectivo y Yappy directo.
  return demora(todos.filter((m) => (m.canal === 'external' ? viaje.accepts_cash : true)));
}

export type Desglose = {
  aporteCentavos: number;
  tarifaCentavos: number;
  totalCentavos: number;
  conductor: string;
  /** «Tarifa Partimos · 5 %» o «Tarifa Partimos» cuando no la hay. */
  etiquetaTarifa: string;
  /** «Pagas ahora» o «Pagas al subir». */
  etiquetaTotal: string;
  textoBoton: string;
  /** La nota de retención bajo el botón. */
  nota: string;
  explicacion: string;
};

export function desglosar(
  aporteCentavos: number,
  canal: CanalDePago,
  conductor: string,
): Desglose {
  const enLaApp = seCobraEnLaApp(canal);
  return {
    aporteCentavos,
    tarifaCentavos: tarifaDeServicio(aporteCentavos, canal),
    totalCentavos: totalQuePagaElPasajero(aporteCentavos, canal),
    conductor,
    etiquetaTarifa: enLaApp ? `Tarifa Partimos · ${TARIFA_PCT[canal]} %` : 'Tarifa Partimos',
    etiquetaTotal: enLaApp ? 'Pagas ahora' : 'Pagas al subir',
    textoBoton: enLaApp ? 'Confirmar y pagar' : 'Confirmar el puesto',
    nota: enLaApp
      ? 'Se retiene hasta la salida. Si el viaje se cancela, se devuelve entero.'
      : `No se cobra nada ahora. Le pagas ${dinero(aporteCentavos, true)} en efectivo al subir.`,
    explicacion: `${conductor} recibe los ${dinero(aporteCentavos, true)} completos. La tarifa es de Partimos.`,
  };
}

/**
 * Deja el puesto pedido con el método elegido. Todavía no se cobra nada: el
 * cargo ocurre cuando el conductor acepta.
 */
export async function elegirMetodo(reservaId: string, canal: CanalDePago): Promise<void> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);
  const aporte = reserva.unit_price_cents * reserva.seats;
  await fuente.actualizarReserva(reservaId, {
    payment_channel: canal,
    service_fee_cents: tarifaDeServicio(aporte, canal),
    total_cents: totalQuePagaElPasajero(aporte, canal),
  });
  await demora(null);
}

/** El aporte retenido pasa al conductor. Solo ocurre con la llegada confirmada. */
export async function liberarAporte(reservaId: string): Promise<Payment | null> {
  const pago = fuente.pagos.find((p) => p.booking_id === reservaId);
  if (!pago) return demora(null);
  pago.status = 'captured';
  pago.captured_at = new Date().toISOString();
  await fuente.actualizarReserva(reservaId, { released_at: pago.captured_at });
  return demora(pago);
}

/* ------------------------------------------------------------------ */

/** Sin importar ui/dinero: los servicios no dependen de la interfaz. */
function dinero(centavos: number, redondo = false): string {
  if (redondo && centavos % 100 === 0) return `${centavos / 100} $`;
  return `${Math.floor(centavos / 100)},${String(centavos % 100).padStart(2, '0')} $`;
}
