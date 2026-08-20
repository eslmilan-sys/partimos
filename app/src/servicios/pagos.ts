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
      detalle: 'Sin tarifa · le aportas al subir',
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
    etiquetaTotal: enLaApp ? 'Aportas ahora' : 'Aportas al subir',
    textoBoton: enLaApp ? 'Confirmar el aporte' : 'Confirmar el puesto',
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
  // El mismo reparto que al pedir el puesto: `total_cents` es el aporte, y la
  // tarifa se calcula sobre él. Ver la nota larga en `reservas.ts`.
  const total = reserva.unit_price_cents * reserva.seats;
  await fuente.actualizarReserva(reservaId, {
    payment_channel: canal,
    service_fee_cents: tarifaDeServicio(total, canal),
    total_cents: total,
  });
  await demora(null);
}

/**
 * Guarda por dónde te cobran, en tu perfil. Es lo que `14c` deja al aceptar y
 * lo que `9a` lee como predeterminado la próxima vez.
 *
 * **El número de Yappy y el de la tarjeta no se guardan**, y no es un olvido:
 * no hay columna donde ponerlos, y guardar un número de tarjeta sería además
 * exactamente lo que no queremos custodiar. Se guarda el canal, que es lo que
 * la pantalla necesita recordar.
 */
export async function guardarMetodoPreferido(
  perfilId: string,
  canal: CanalDePago,
): Promise<void> {
  await fuente.actualizarPerfil(perfilId, { preferred_pay_channel: canal });
  await demora(null);
}

/**
 * El aporte retenido pasa al conductor. Solo ocurre con la llegada confirmada.
 *
 * Se escribe, no se toca en memoria: antes esto era `pago.status = 'captured'`
 * sobre el objeto cargado, así que en el simulado parecía funcionar y contra
 * la base la fila se quedaba en `authorized` y `released_at` en nulo.
 */
export async function liberarAporte(reservaId: string): Promise<Payment | null> {
  const ahora = new Date().toISOString();
  /**
   * En efectivo NO HAY PAGO QUE CAPTURAR, y el viaje se cierra igual.
   *
   * Aquí se salía antes de tiempo cuando no había fila en `payments` —que es
   * lo normal: en efectivo la plata va de mano a mano y la plataforma no la
   * toca nunca—, así que `released_at` no se escribía y el viaje se quedaba
   * abierto para siempre. La marca de cerrado es de la reserva; capturar el
   * pago es lo que se hace **además**, cuando lo hay.
   */
  const pago = fuente.pagos.find((p) => p.booking_id === reservaId);
  const cobrado = pago
    ? await fuente.actualizarPago(pago.id, { status: 'captured', captured_at: ahora })
    : null;
  await fuente.actualizarReserva(reservaId, { released_at: ahora });
  return demora(cobrado);
}

/* ------------------------------------------------------------------ */

/** Sin importar ui/dinero: los servicios no dependen de la interfaz. */
function dinero(centavos: number, redondo = false): string {
  if (redondo && centavos % 100 === 0) return `${centavos / 100} $`;
  return `${Math.floor(centavos / 100)},${String(centavos % 100).padStart(2, '0')} $`;
}
