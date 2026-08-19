/**
 * Ayuda y cómo se paga — pantallas `15b` (¿qué pasó?), `16b` (cómo se paga) y
 * `16c` (el comprobante).
 *
 * `15b` empieza por **tu viaje**, no por un buscador: quien abre la ayuda
 * viene de algo concreto. Después, las cuatro cosas que de verdad salen mal, y
 * sólo al final las preguntas de siempre.
 *
 * El comprobante de `16c` **no es una factura**: Partimos no vende un
 * transporte, sólo reparte el costo. Eso va escrito en la pantalla, no en la
 * letra pequeña.
 */

import { NOMBRE_DEL_CANAL, TARIFA_PCT, tarifaDeServicio } from '@/dominio/tarifas';
import { resumenDeEquipaje } from '@/dominio/equipaje';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/* -------------------------------------------------------------- Ayuda */

export type ViajeDeAyuda = {
  reservaId: string;
  destino: string;
  cuando: string;
  linea: string;
  conductor: string;
};

/** El viaje del que se viene hablando, arriba del todo. */
export async function viajeDeAyuda(reservaId: string): Promise<ViajeDeAyuda | null> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) return demora(null);
  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  const conductor = fuente.perfiles.find((p) => p.id === viaje?.driver_id);
  const nombre = conductor ? `${conductor.first_name} ${conductor.last_initial ?? ''}`.trim() : '';
  const aporte = reserva.unit_price_cents * reserva.seats;

  return demora({
    reservaId,
    destino: (viaje?.destination_label ?? '').split(' · ')[0],
    cuando: viaje?.departure_at ?? '',
    linea: `${aporte % 100 === 0 ? aporte / 100 : (aporte / 100).toFixed(2).replace('.', ',')} $ · ${NOMBRE_DEL_CANAL[reserva.payment_channel]} · ${nombre}`,
    conductor: nombre,
  });
}

export type CosaQueSaleMal = {
  clave: string;
  titulo: string;
  /** La pastilla de la derecha: qué pasa si lo tocas. */
  respuesta: string;
  ruta: string;
};

/** Las cuatro cosas que de verdad salen mal, en orden de urgencia real. */
export const LO_QUE_SALE_MAL: CosaQueSaleMal[] = [
  { clave: 'nollego', titulo: 'No llegó a recogerme', respuesta: 'Reembolso', ruta: '/(ayuda)/reembolso' },
  { clave: 'cobro', titulo: 'Me cobraron mal', respuesta: 'Revisamos', ruta: '/(ayuda)/reembolso' },
  { clave: 'cancelar', titulo: 'Quiero cancelar', respuesta: 'Ahora', ruta: '/(ayuda)/cancelar' },
  { clave: 'incidente', titulo: 'Algo pasó en el viaje', respuesta: 'Urgente', ruta: '/(ayuda)/reportar' },
];

export const PREGUNTAS: { titulo: string; ruta: string }[] = [
  { titulo: 'Cómo se paga y qué es la tarifa', ruta: '/(ayuda)/pagos' },
  { titulo: 'Cuándo se libera el aporte', ruta: '/(ayuda)/pagos' },
  { titulo: 'Seguridad y verificación', ruta: '/(ayuda)/reportar' },
];

export const HORARIO = 'Respondemos de 7 a 21';
export const PROMESA = 'Contestamos en menos de 2 h dentro del horario.';

/* -------------------------------------------------------- Cómo se paga */

export type ComoSePaga = {
  aporteCentavos: number;
  tarifaPct: number;
  topeCentavos: number;
  porque: string;
  reloj: { titulo: string; texto: string }[];
  letraChica: string;
};

/** Los tres números y el reloj del dinero. Sin letra pequeña. */
export async function comoSePaga(viajeId?: string): Promise<ComoSePaga> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId) ?? fuente.viajes[0];

  return demora({
    aporteCentavos: viaje.price_cents,
    tarifaPct: TARIFA_PCT.yappy_app,
    topeCentavos: viaje.snap_max_price_cents ?? 0,
    porque:
      'Nadie gana dinero con esto. El aporte cubre gasolina y peajes, y hay un tope por ruta para que no se convierta en un taxi.',
    reloj: [
      { titulo: 'Pides el puesto', texto: 'No se cobra nada todavía.' },
      { titulo: 'El conductor acepta', texto: 'Se retiene el aporte. Aún no es suyo.' },
      { titulo: 'Viajan', texto: 'Sigue retenido durante el camino.' },
      { titulo: 'Llegan', texto: 'Se le libera al conductor. Si el viaje no pasó, vuelve a ti.' },
    ],
    letraChica: `Con tarjeta la tarifa es del ${TARIFA_PCT.card} %; en efectivo no hay tarifa y le pagas al subir. El conductor recibe el aporte completo con cualquier método.`,
  });
}

/* -------------------------------------------------------- Comprobante */

export type Comprobante = {
  referencia: string;
  cuando: string;
  destino: string;
  totalCentavos: number;
  pagadoCon: string;
  desglose: { concepto: string; centavos: number; fuerte?: boolean }[];
  filas: { etiqueta: string; valor: string }[];
  /** Lo que esto es y lo que no es. Va en la pantalla, no en la letra chica. */
  queEsEsto: string;
};

export async function comprobante(reservaId: string): Promise<Comprobante> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);
  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  if (!viaje) throw new Error(`No existe el viaje ${reserva.trip_id}`);
  const conductor = fuente.perfiles.find((p) => p.id === viaje.driver_id);
  const carro = fuente.vehiculos.find((v) => v.id === viaje.vehicle_id);

  const aporte = reserva.unit_price_cents * reserva.seats;
  const tarifa = tarifaDeServicio(aporte, reserva.payment_channel);
  const nombre = conductor ? `${conductor.first_name} ${conductor.last_initial ?? ''}`.trim() : '';

  return demora({
    referencia: reserva.boarding_code ?? reserva.id.slice(0, 8),
    cuando: reserva.confirmed_at ?? reserva.created_at,
    destino: (viaje.destination_label ?? '').split(' · ')[0],
    totalCentavos: aporte + tarifa,
    pagadoCon: NOMBRE_DEL_CANAL[reserva.payment_channel],
    desglose: [
      { concepto: `Aporte a ${conductor?.first_name ?? 'el conductor'}`, centavos: aporte },
      { concepto: `Tarifa Partimos · ${TARIFA_PCT[reserva.payment_channel]} %`, centavos: tarifa },
      { concepto: 'Total', centavos: aporte + tarifa, fuerte: true },
    ],
    filas: [
      {
        etiqueta: 'Viaje',
        valor: `${(viaje.origin_label ?? '').split(' · ')[0]} → ${(viaje.destination_label ?? '').split(' · ')[0]}`,
      },
      { etiqueta: 'Salida y llegada', valor: `${hhmm(viaje.departure_at)} · ${hhmm(viaje.arrival_estimate_at)}` },
      {
        etiqueta: 'Conductor',
        valor: `${nombre} · ${carro?.model ?? ''} ${carro?.color ?? ''}`.trim(),
      },
      {
        etiqueta: 'Puestos',
        valor: `${reserva.seats} · ${resumenDeEquipaje({ mochilas: reserva.mochilas, maletas: reserva.maletas }).toLowerCase()}`,
      },
      { etiqueta: 'Referencia', valor: reserva.boarding_code ?? reserva.id.slice(0, 8) },
    ],
    queEsEsto:
      'Sirve como comprobante de gasto compartido. No es una factura: Partimos no vende un transporte, solo reparte el costo.',
  });
}

function hhmm(cuando: string | null): string {
  if (!cuando) return '';
  return new Intl.DateTimeFormat('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Panama',
  }).format(new Date(cuando));
}
