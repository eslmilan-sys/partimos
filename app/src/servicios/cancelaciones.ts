/**
 * Cancelar y reembolsar — pantallas `14a` (cancelar el puesto), `7d` (de qué
 * reembolso hablamos) y `15c` (por dónde va).
 *
 * La regla y el importe cambian con el motivo, y el traspaso es tajante en una
 * cosa: **se dice la consecuencia antes de confirmar**, no después. Por eso
 * `previsualizar` existe: la pantalla enseña qué vuelve y por qué mientras
 * todavía se puede echar atrás.
 *
 * El cálculo no vive aquí, vive en `dominio/reembolsos.ts`. Esto sólo lo trae
 * a la forma de las tablas: una `cancellation` con su foto de importes y un
 * `refund` que la sigue.
 */

import { calcularReembolso, type MotivoDeReembolso } from '@/dominio/reembolsos';
import { tarifaDeServicio } from '@/dominio/tarifas';
import type { Cancellation, CancelParty, Refund } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type MotivoElegible = {
  clave: MotivoDeReembolso;
  etiqueta: string;
  /** Quién cancela, para la columna `cancelled_by` de la tabla. */
  parte: CancelParty;
};

/** Los cuatro motivos, en el orden del traspaso: primero el tuyo. */
export const MOTIVOS: MotivoElegible[] = [
  { clave: 'yo', etiqueta: 'Ya no puedo ir', parte: 'passenger' },
  { clave: 'conductor', etiqueta: 'El conductor canceló', parte: 'driver' },
  { clave: 'novino', etiqueta: 'El conductor no apareció', parte: 'driver' },
  { clave: 'nopaso', etiqueta: 'El viaje no ocurrió', parte: 'system' },
];

export type Previsualizacion = {
  motivo: MotivoDeReembolso;
  titulo: string;
  texto: string;
  /** Lo que vuelve, en centavos. */
  montoCentavos: number;
  /** Lo que se queda el conductor por el puesto perdido. */
  retenidoCentavos: number;
  plazo: string;
  /** Horas que faltan para la salida, que es lo que decide la regla del pasajero. */
  horasAntes: number;
};

/**
 * Lo que `14a` y `7d` enseñan antes de confirmar: la regla, el importe y el
 * plazo, ya escritos.
 */
export async function previsualizar(
  reservaId: string,
  motivo: MotivoDeReembolso,
): Promise<Previsualizacion> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);
  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  if (!viaje) throw new Error(`No existe el viaje ${reserva.trip_id}`);

  const aporte = reserva.unit_price_cents * reserva.seats;
  const tarifa = tarifaDeServicio(aporte, reserva.payment_channel);
  const horasAntes = Math.max(
    0,
    (new Date(viaje.departure_at).getTime() - Date.now()) / 3_600_000,
  );

  const conductor = fuente.perfiles.find((p) => p.id === viaje.driver_id);
  const r = calcularReembolso({
    motivo,
    aporteCentavos: aporte,
    tarifaCentavos: tarifa,
    horasAntesDeLaSalida: horasAntes,
    nombreDelConductor: conductor?.first_name,
  });

  return demora({
    motivo,
    titulo: r.titulo,
    texto: r.texto,
    montoCentavos: r.montoCentavos,
    retenidoCentavos: r.retenidoCentavos,
    plazo: r.plazo,
    horasAntes: Math.round(horasAntes * 10) / 10,
  });
}

/** Las cuatro previsualizaciones de golpe, que es lo que pide el selector. */
export async function previsualizarTodos(reservaId: string): Promise<Previsualizacion[]> {
  return Promise.all(MOTIVOS.map((m) => previsualizar(reservaId, m.clave)));
}

/**
 * Cancela de verdad: escribe la `cancellation` con su foto de importes y abre
 * el `refund` que la sigue. La foto se guarda porque la política puede cambiar
 * mañana y lo que se prometió hoy tiene que seguir siendo legible.
 */
export async function cancelar(
  reservaId: string,
  motivo: MotivoDeReembolso,
  quienCancela: string,
  textoLibre?: string,
): Promise<{ cancelacion: Cancellation; reembolso: Refund }> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);

  const previa = await previsualizar(reservaId, motivo);
  const eleccion = MOTIVOS.find((m) => m.clave === motivo)!;
  const politica = fuente.politicas[0];
  const aporte = reserva.unit_price_cents * reserva.seats;
  const tarifa = tarifaDeServicio(aporte, reserva.payment_channel);
  const sufijo = String(fuente.cancelaciones.length + 2).padStart(12, '0');

  const cancelacion: Cancellation = {
    id: `cc000000-0000-4000-8000-${sufijo}`,
    booking_id: reservaId,
    trip_id: reserva.trip_id,
    actor_id: quienCancela,
    cancelled_by: eleccion.parte,
    policy_id: politica.id,
    hours_before: Math.round(previa.horasAntes),
    reason_code: motivo,
    reason_free_text: textoLibre?.trim() || null,
    resolved_at: null,
    seat_resold: false,
    was_free_cancel: previa.retenidoCentavos === 0,
    snap_total_cents: aporte + tarifa,
    snap_refund_cents: previa.montoCentavos,
    snap_retained_cents: previa.retenidoCentavos,
    snap_goodwill_cents: 0,
    created_at: new Date().toISOString(),
  };

  const reembolso: Refund = {
    id: `ff000000-0000-4000-8000-${sufijo}`,
    cancellation_id: cancelacion.id,
    payment_id: fuente.pagos.find((p) => p.booking_id === reservaId)?.id ?? null,
    amount_cents: previa.montoCentavos,
    // El del viaje que no ocurrió sale solo: no hay nadie que aprobarlo.
    status: motivo === 'nopaso' ? 'issued' : 'pending',
    issued_at: motivo === 'nopaso' ? new Date().toISOString() : null,
    provider_ref: null,
    created_at: new Date().toISOString(),
  };

  await fuente.guardarCancelacion(cancelacion);
  await fuente.guardarReembolso(reembolso);
  await fuente.actualizarReserva(reservaId, {
    status: eleccion.parte === 'driver' ? 'cancelled_driver' : 'cancelled_passenger',
    cancelled_at: cancelacion.created_at,
  });

  return demora({ cancelacion, reembolso });
}

export type PasoDelReembolso = {
  titulo: string;
  cuando: string;
  /** `hecho` ya pasó, `ahora` es donde está, `falta` todavía no. */
  estado: 'hecho' | 'ahora' | 'falta';
};

export type EstadoDelReembolso = {
  solicitud: string;
  destino: string;
  montoCentavos: number;
  titulo: string;
  texto: string;
  pasos: PasoDelReembolso[];
  /** Dónde cae el dinero, ya escrito: «Yappy · 6699». */
  donde: string;
  cierre: string;
};

/**
 * `15c`: cuatro pasos con fecha y nada de jerga bancaria. Un reembolso que se
 * ve avanzar es un reembolso por el que no se escribe a soporte.
 */
export async function estadoDelReembolso(reembolsoId: string): Promise<EstadoDelReembolso> {
  const reembolso = fuente.reembolsos.find((r) => r.id === reembolsoId);
  if (!reembolso) throw new Error(`No existe el reembolso ${reembolsoId}`);
  const cancelacion = fuente.cancelaciones.find((c) => c.id === reembolso.cancellation_id);
  if (!cancelacion) throw new Error('El reembolso no tiene cancelación');

  const reserva = fuente.reservas.find((r) => r.id === cancelacion.booking_id);
  const viaje = fuente.viajes.find((v) => v.id === cancelacion.trip_id);
  const conductor = fuente.perfiles.find((p) => p.id === viaje?.driver_id);
  const destino = (viaje?.destination_label ?? '').split(' · ')[0];
  const enviado = reembolso.status === 'issued';

  return demora({
    solicitud: reserva?.boarding_code ?? '',
    destino,
    montoCentavos: reembolso.amount_cents,
    titulo: 'en camino',
    texto:
      cancelacion.cancelled_by === 'driver'
        ? `${conductor?.first_name ?? 'El conductor'} canceló el viaje, así que vuelve todo con la tarifa. Sale el lunes con los envíos de la semana.`
        : 'Vuelve a donde salió. Sale el lunes con los envíos de la semana.',
    pasos: [
      { titulo: 'Lo pediste', cuando: cancelacion.created_at, estado: 'hecho' },
      {
        titulo: 'Revisado y aprobado',
        cuando: new Date(new Date(cancelacion.created_at).getTime() + 28 * 60_000).toISOString(),
        estado: 'hecho',
      },
      {
        titulo: 'Enviado a tu Yappy',
        cuando: proximoLunes(cancelacion.created_at),
        estado: enviado ? 'hecho' : 'ahora',
      },
      { titulo: 'En tu cuenta', cuando: proximoLunes(cancelacion.created_at, 1), estado: 'falta' },
    ],
    donde: `Yappy · ${fuente.yappyDelConductor[reserva?.passenger_id as keyof typeof fuente.yappyDelConductor] ?? '6699'}`,
    cierre: 'Si el lunes no está, escríbenos y lo revisamos el mismo día.',
  });
}

/* ------------------------------------------------------------------ */

/** El envío es semanal, los lunes: todo lo que sale, sale ese día. */
function proximoLunes(desde: string, masDias = 0): string {
  const d = new Date(desde);
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + masDias);
  return d.toISOString();
}
