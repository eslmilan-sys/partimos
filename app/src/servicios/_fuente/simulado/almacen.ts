/**
 * El almacén simulado: filas en memoria con la forma exacta de las tablas.
 *
 * Nadie fuera de `servicios/` importa este archivo. Las pantallas llaman a los
 * servicios y reciben filas; de dónde salen no es asunto suyo.
 */

import type { Booking, Message, Payment, ReservaFila, TripStop, ViajeFila } from '@/tipos';

import { ANDRES_ID, CARLA_ID, DANIELA_ID, ELANTRA_ID, JOSE_ID, LUCIA_ID, MARIA_ID, MATEO_ID, ROSA_ID, TUCSON_ID } from './personas';
import { corredores } from './geografia';
import { AHORA, LLEGADA, SALIDA, desdeLaSalida, enMinutos, enPanama, haceMinutos } from './reloj';

const CHITRE = corredores.find((c) => c.slug === 'panama-chitre')!;

export const VIAJE_CHITRE_ID = '55555555-5555-4555-8555-555555555555';
/** El mismo viaje con el booleano de maletas apagado, para ver `7a` en su otra cara. */
export const VIAJE_SIN_MALETAS_ID = '55555555-5555-4555-8555-555555555556';
/** El de esta mañana, a punto de salir: es el que se aborda en `1f` / `1g`. */
export const VIAJE_ABORDANDO_ID = '55555555-5555-4555-8555-555555555557';

/**
 * El viaje del recorrido del diseño: Albrook → Chitré, publicado y con gente
 * pidiendo puesto. Los `snap_*` son la foto del cálculo en el momento de
 * publicar, igual que en la base.
 */
export const viajes: ViajeFila[] = [
  {
    id: VIAJE_CHITRE_ID,
    driver_id: ANDRES_ID,
    vehicle_id: ELANTRA_ID,
    corridor_id: CHITRE.id,
    departure_at: SALIDA,
    arrival_estimate_at: LLEGADA,
    seats_offered: 3,
    price_cents: 600,
    gender_preference: 'any',
    notes: null,
    status: 'published',
    price_rule_id: '6ad0a57f-ec7c-4a83-b331-523af650584e',
    snap_distance_km: 250,
    snap_rate_per_km_cents: 6,
    snap_toll_cents: 300,
    snap_cost_total_cents: 2060,
    snap_occupants: 4,
    snap_max_price_cents: 700,
    published_at: AHORA,
    completed_at: null,
    cancelled_at: null,
    created_at: AHORA,
    updated_at: AHORA,
    recurrence: 'none',
    recurrence_parent_id: null,
    accepts_yappy_direct: true,
    accepts_cash: true,
    origin_place_id: null,
    destination_place_id: null,
    origin_label: 'Albrook · Terminal',
    destination_label: 'Chitré · Parque Unión',
    origin_lat: 8.9737,
    origin_lng: -79.5527,
    destination_lat: 7.9614,
    destination_lng: -80.4297,
    // pendiente de migración
    accepts_luggage: true,
  },
];

viajes.push({
  ...viajes[0],
  id: VIAJE_SIN_MALETAS_ID,
  seats_offered: 2,
  accepts_luggage: false,
});


export const paradas: TripStop[] = [
  {
    id: '66666666-6666-4666-8666-666666666601',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'Albrook · Terminal',
    kind: 'origin',
    sequence: 0,
    scheduled_at: SALIDA,
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666602',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'La Chorrera',
    kind: 'waypoint',
    sequence: 1,
    scheduled_at: desdeLaSalida(45),
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666603',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'Penonomé',
    kind: 'waypoint',
    sequence: 2,
    scheduled_at: desdeLaSalida(110),
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666604',
    trip_id: VIAJE_CHITRE_ID,
    pickup_point_id: null,
    custom_label: 'Chitré · Parque Unión',
    kind: 'destination',
    sequence: 3,
    scheduled_at: LLEGADA,
    created_at: AHORA,
  },
];

viajes.push({
  ...viajes[0],
  id: VIAJE_ABORDANDO_ID,
  departure_at: enMinutos(12),
  arrival_estimate_at: enMinutos(12 + 210),
  seats_offered: 3,
  origin_label: 'Albrook · bahía 4',
});

paradas.push(
  {
    id: '66666666-6666-4666-8666-666666666701',
    trip_id: VIAJE_ABORDANDO_ID,
    pickup_point_id: null,
    custom_label: 'Albrook · bahía 4',
    kind: 'origin',
    sequence: 0,
    scheduled_at: enMinutos(12),
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666702',
    trip_id: VIAJE_ABORDANDO_ID,
    pickup_point_id: null,
    custom_label: 'Chitré · Parque Unión',
    kind: 'destination',
    sequence: 1,
    scheduled_at: enMinutos(12 + 210),
    created_at: AHORA,
  },
);

/**
 * Más salidas del día en la misma ruta, para que los resultados tengan algo que
 * enseñar: horas distintas, aportes distintos y el booleano de maletas en sus
 * dos posiciones.
 */
const otrasSalidas: { enMinutos: number; precio: number; puestos: number; maletas: boolean; origen: string }[] = [
  { enMinutos: 50, precio: 600, puestos: 3, maletas: true, origen: 'Albrook · Terminal' },
  { enMinutos: 160, precio: 700, puestos: 1, maletas: false, origen: 'Vía España' },
  { enMinutos: 245, precio: 500, puestos: 4, maletas: true, origen: 'Costa del Este' },
];

otrasSalidas.forEach((s, i) => {
  const id = `55555555-5555-4555-8555-5555555556${String(i).padStart(2, '0')}`;
  const sale = enMinutos(s.enMinutos);
  viajes.push({
    ...viajes[0],
    id,
    departure_at: sale,
    arrival_estimate_at: new Date(new Date(sale).getTime() + (200 + i * 10) * 60_000).toISOString(),
    seats_offered: s.puestos,
    price_cents: s.precio,
    accepts_luggage: s.maletas,
    origin_label: s.origen,
    gender_preference: i === 2 ? 'women_only' : 'any',
    accepts_cash: i !== 1,
  });
  paradas.push(
    {
      id: `66666666-6666-4666-8666-6666666668${String(i).padStart(2, '0')}`,
      trip_id: id,
      pickup_point_id: null,
      custom_label: s.origen,
      kind: 'origin',
      sequence: 0,
      scheduled_at: sale,
      created_at: AHORA,
    },
    {
      id: `66666666-6666-4666-8666-6666666669${String(i).padStart(2, '0')}`,
      trip_id: id,
      pickup_point_id: null,
      custom_label: 'Chitré · Parque Unión',
      kind: 'destination',
      sequence: 1,
      scheduled_at: new Date(new Date(sale).getTime() + (200 + i * 10) * 60_000).toISOString(),
      created_at: AHORA,
    },
  );
});

/**
 * Una salida a otro destino, para que `1a` y los resultados no enseñen la
 * misma ciudad dos veces. Santiago está más lejos, así que el aporte sube: es
 * el mismo cálculo, no un número puesto a mano.
 */
const SANTIAGO = corredores.find((c) => c.slug === 'panama-santiago')!;

viajes.push({
  ...viajes[0],
  id: '55555555-5555-4555-8555-555555555580',
  corridor_id: SANTIAGO.id,
  departure_at: enMinutos(38),
  arrival_estimate_at: enMinutos(38 + (SANTIAGO.typical_duration_min ?? 240)),
  seats_offered: 2,
  price_cents: 1200,
  snap_distance_km: Number(SANTIAGO.distance_km),
  snap_toll_cents: Number(SANTIAGO.toll_cents),
  snap_max_price_cents: 1300,
  destination_label: 'Santiago · Terminal',
  destination_lat: 8.1015,
  destination_lng: -80.9803,
  accepts_luggage: true,
});

paradas.push(
  {
    id: '66666666-6666-4666-8666-666666666801',
    trip_id: '55555555-5555-4555-8555-555555555580',
    pickup_point_id: null,
    custom_label: 'Albrook · Terminal',
    kind: 'origin',
    sequence: 0,
    scheduled_at: enMinutos(38),
    created_at: AHORA,
  },
  {
    id: '66666666-6666-4666-8666-666666666802',
    trip_id: '55555555-5555-4555-8555-555555555580',
    pickup_point_id: null,
    custom_label: 'Santiago · Terminal',
    kind: 'destination',
    sequence: 1,
    scheduled_at: enMinutos(38 + (SANTIAGO.typical_duration_min ?? 240)),
    created_at: AHORA,
  },
);

/**
 * El fin de semana a la playa, que es lo que enseña `3c`: la ruta con su
 * fotografía detrás. Carla lleva SUV y publica viajes solo para mujeres.
 */
const CORONADO = corredores.find((c) => c.slug === 'panama-coronado')!;

const playa = (i: number, hora: number, precio: number, origen: string, destino: string, soloMujeres: boolean) => {
  const id = `55555555-5555-4555-8555-5555555559${String(i).padStart(2, '0')}`;
  const sale = enPanama(hora, 1);
  const llega = new Date(new Date(sale).getTime() + (CORONADO.typical_duration_min ?? 100) * 60_000).toISOString();
  viajes.push({
    ...viajes[0],
    id,
    driver_id: CARLA_ID,
    vehicle_id: TUCSON_ID,
    corridor_id: CORONADO.id,
    departure_at: sale,
    arrival_estimate_at: llega,
    seats_offered: i === 0 ? 2 : 3,
    price_cents: precio,
    gender_preference: soloMujeres ? 'women_only' : 'any',
    snap_distance_km: Number(CORONADO.distance_km),
    snap_toll_cents: Number(CORONADO.toll_cents),
    snap_max_price_cents: 600,
    origin_label: origen,
    destination_label: destino,
    accepts_luggage: true,
  });
  paradas.push(
    {
      id: `66666666-6666-4666-8666-66666666690${i}`,
      trip_id: id,
      pickup_point_id: null,
      custom_label: origen,
      kind: 'origin',
      sequence: 0,
      scheduled_at: sale,
      created_at: AHORA,
    },
    {
      id: `66666666-6666-4666-8666-66666666691${i}`,
      trip_id: id,
      pickup_point_id: null,
      custom_label: destino,
      kind: 'destination',
      sequence: 1,
      scheduled_at: llega,
      created_at: AHORA,
    },
  );
};

playa(0, 7.5, 600, 'Costa del Este', 'Playa Blanca · entrada', true);
playa(1, 9, 500, 'Albrook · Terminal', 'Playa Blanca · entrada', false);
playa(2, 14, 500, 'Vía Centenario', 'Río Hato · cruce', false);

const reservaBase = (extra: Partial<ReservaFila>): ReservaFila => ({
  id: '',
  trip_id: VIAJE_CHITRE_ID,
  passenger_id: '',
  seats: 1,
  unit_price_cents: 600,
  service_fee_cents: 30,
  total_cents: 630,
  trip_stop_id: null,
  proposed_point: null,
  proposal_accepted: null,
  status: 'pending',
  confirmed_at: null,
  completed_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  created_at: AHORA,
  updated_at: AHORA,
  board_sequence: 0,
  alight_sequence: 3,
  offer_price_cents: null,
  offer_accepted: null,
  payment_channel: 'yappy_app',
  // pendiente de migración
  boarding_code: '0000',
  arrival_code: '0000',
  boarded_at: null,
  expires_at: AHORA,
  detour_minutes: null,
  released_at: null,
  mochilas: 1,
  maletas: 0,
  ...extra,
});

/**
 * Todas las reservas del viaje, como estarían en la tabla: la de Daniela ya
 * pagada, y las dos que `11a` tiene pendientes de respuesta.
 */
export const reservas: ReservaFila[] = [
  reservaBase({
    id: '77777777-7777-4777-8777-777777777700',
    passenger_id: DANIELA_ID,
    status: 'confirmed',
    confirmed_at: haceMinutos(180),
    proposed_point: 'Costa del Este',
    detour_minutes: 3,
    mochilas: 1,
    maletas: 1,
    boarding_code: '5521',
    arrival_code: '9084',
  }),
  reservaBase({
    id: '77777777-7777-4777-8777-777777777701',
    passenger_id: MATEO_ID,
    proposed_point: 'Vía Argentina, Riba Smith',
    detour_minutes: 4,
    mochilas: 1,
    maletas: 1,
    boarding_code: '4917',
    arrival_code: '2610',
    expires_at: enMinutos(220), // 3 h 40
    created_at: haceMinutos(20),
  }),
  reservaBase({
    id: '77777777-7777-4777-8777-777777777702',
    passenger_id: ROSA_ID,
    proposed_point: 'Vía España, El Dorado',
    detour_minutes: 2,
    mochilas: 1,
    maletas: 0,
    boarding_code: '2384',
    arrival_code: '7431',
    expires_at: enMinutos(50), // menos de 1 h: pastilla roja sólida
    created_at: haceMinutos(190),
  }),
];

/** Los tres puestos vendidos del viaje que está abordando: dos ya subieron. */
reservas.push(
  reservaBase({
    id: '77777777-7777-4777-8777-777777777710',
    trip_id: VIAJE_ABORDANDO_ID,
    passenger_id: MARIA_ID,
    status: 'confirmed',
    confirmed_at: haceMinutos(2880),
    proposed_point: 'Albrook · bahía 4',
    boarding_code: '3179',
    arrival_code: '8052',
    maletas: 1,
  }),
  reservaBase({
    id: '77777777-7777-4777-8777-777777777711',
    trip_id: VIAJE_ABORDANDO_ID,
    passenger_id: JOSE_ID,
    status: 'confirmed',
    confirmed_at: haceMinutos(2900),
    proposed_point: 'Albrook · bahía 4',
    boarding_code: '6042',
    arrival_code: '1596',
    boarded_at: haceMinutos(3),
  }),
  reservaBase({
    id: '77777777-7777-4777-8777-777777777712',
    trip_id: VIAJE_ABORDANDO_ID,
    passenger_id: LUCIA_ID,
    status: 'confirmed',
    confirmed_at: haceMinutos(3000),
    proposed_point: 'Vía Brasil',
    boarding_code: '8465',
    arrival_code: '4728',
    boarded_at: haceMinutos(1),
    payment_channel: 'external',
    service_fee_cents: 0,
    total_cents: 600,
  }),
);

/**
 * El hilo de la reserva de Daniela, donde se acuerda el punto por escrito.
 * `messages` es inmutable en la base: un trigger prohíbe editarlos.
 */
export const mensajes: Message[] = [
  {
    id: 1,
    booking_id: '77777777-7777-4777-8777-777777777700',
    sender_id: ANDRES_ID,
    body: 'Buenas Daniela, salgo puntual del Parque Unión a las 6.',
    read_at: haceMinutos(600),
    created_at: haceMinutos(660),
  },
  {
    id: 2,
    booking_id: '77777777-7777-4777-8777-777777777700',
    sender_id: DANIELA_ID,
    body: 'Perfecto. ¿Puedo subir una maleta mediana?',
    read_at: haceMinutos(600),
    created_at: haceMinutos(658),
  },
  {
    id: 3,
    booking_id: '77777777-7777-4777-8777-777777777700',
    sender_id: ANDRES_ID,
    body: 'Sí, va en el baúl. Te espero frente a la iglesia.',
    read_at: null,
    created_at: haceMinutos(655),
  },
];

export const pagos: Payment[] = [];

/** Altas en memoria. Se pierde al recargar, y está bien: es un simulado. */
export async function guardarViaje(viaje: ViajeFila): Promise<ViajeFila> {
  viajes.unshift(viaje);
  return viaje;
}

export async function guardarReserva(reserva: ReservaFila): Promise<ReservaFila> {
  reservas.unshift(reserva);
  return reserva;
}

export async function guardarPago(pago: Payment): Promise<Payment> {
  pagos.unshift(pago);
  return pago;
}

export async function actualizarReserva(
  id: string,
  cambios: Partial<ReservaFila>,
): Promise<ReservaFila> {
  const i = reservas.findIndex((r) => r.id === id);
  if (i < 0) throw new Error(`No existe la reserva ${id}`);
  reservas[i] = { ...reservas[i], ...cambios, updated_at: new Date().toISOString() };
  return reservas[i];
}
