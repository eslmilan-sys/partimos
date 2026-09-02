/**
 * El almacén simulado: filas en memoria con la forma exacta de las tablas.
 *
 * Nadie fuera de `servicios/` importa este archivo. Las pantallas llaman a los
 * servicios y reciben filas; de dónde salen no es asunto suyo.
 */

import type { Booking, Message, Payment, ReservaFila, TripStop, ViajeFila } from '@/tipos';

import { ANDRES_ID, CARLA_ID, DANIELA_ID, ELANTRA_ID, JAVIER_ID, JOSE_ID, LUCIA_ID, MARIA_ID, MATEO_ID, ROSA_ID, TUCSON_ID, VIELKA_ID, vehiculos } from './personas';
import { CONSUMO_L_100KM, aporteCalculado, costoDelViaje, topeDeRuta } from '@/dominio/aporte';
import { CIUDAD_PANAMA_ID, ciudades, corredores } from './geografia';
import { AHORA, LLEGADA, SALIDA, desdeLaSalida, enMinutos, enPanama, haceMinutos } from './reloj';

const CHITRE = corredores.find((c) => c.slug === 'panama-chitre')!;

export const VIAJE_CHITRE_ID = '55555555-5555-4555-8555-555555555555';
/** El mismo viaje con el booleano de maletas apagado, para ver `7a` en su otra cara. */
export const VIAJE_SIN_MALETAS_ID = '55555555-5555-4555-8555-555555555556';
/** El de esta mañana, a punto de salir: es el que se aborda en `1f` / `1g`. */
export const VIAJE_ABORDANDO_ID = '55555555-5555-4555-8555-555555555557';


/**
 * DE QUELLE VILLE PARLE CETTE ÉTIQUETTE. Les données simulées ont la forme
 * exacte des tables (règle 5), et depuis 0031 une ligne `trips` porte sa ville.
 * On la déduit du premier morceau de l'étiquette — « Chitré · Parque Unión »
 * → Chitré — et sinon on prend celle qu'on nous donne : « Albrook » et « Vía
 * España » sont des quartiers de la capitale, pas des villes.
 */
const ciudadDe = (etiqueta: string, siNo: string): string => {
  const cabeza = etiqueta.split(' · ')[0]?.trim();
  return ciudades.find((c) => c.name === cabeza)?.id ?? siNo;
};

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
    seats_front: 1,
    seats_back: 2,
    price_cents: 600,
    gender_preference: 'any',
    notes: 'Salgo puntual. Llevo el baúl medio lleno, así que una maleta grande por persona.',
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
    origin_city_id: CIUDAD_PANAMA_ID,
    destination_city_id: ciudadDe('Chitré · Parque Unión', CIUDAD_PANAMA_ID),
    origin_lat: 8.9737,
    origin_lng: -79.5527,
    destination_lat: 7.9614,
    destination_lng: -80.4297,
    accepts_luggage: true,
    allows_pets: false,
    allows_smoking: false,
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
    origin_city_id: ciudadDe(s.origen, CIUDAD_PANAMA_ID),
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
 * LA VUELTA. Chitré → Panamá, sin corredor medido: es una ruta libre, como
 * las que se publican desde el 24-08-2026.
 *
 * Está aquí porque el interurbano de verdad es de ida Y vuelta —se baja el
 * viernes, se sube el domingo— y el simulado sólo tenía salidas DESDE la
 * capital. Con eso, quien dice que vive en Chitré no veía una sola salida
 * desde su ciudad, que es justo lo que la pantalla le promete.
 */
[
  { enMin: 26 * 60, precio: 600, puestos: 3, conductor: JOSE_ID },
  { enMin: 50 * 60, precio: 600, puestos: 2, conductor: MARIA_ID },
].forEach((v, i) => {
  const id = `55555555-5555-4555-8555-5555555557${String(i).padStart(2, '0')}`;
  const sale = enMinutos(v.enMin);
  const llega = new Date(new Date(sale).getTime() + 210 * 60_000).toISOString();
  viajes.push({
    ...viajes[0],
    id,
    driver_id: v.conductor,
    corridor_id: null,
    departure_at: sale,
    arrival_estimate_at: llega,
    seats_offered: v.puestos,
    price_cents: v.precio,
    gender_preference: 'any',
    origin_label: 'Chitré · Parque Unión',
    destination_label: 'Ciudad de Panamá · Albrook',
    origin_city_id: ciudadDe('Chitré · Parque Unión', CIUDAD_PANAMA_ID),
    destination_city_id: CIUDAD_PANAMA_ID,
    origin_lat: 7.9614,
    origin_lng: -80.4297,
    destination_lat: 8.9737,
    destination_lng: -79.5527,
  });
  paradas.push(
    {
      id: `66666666-6666-4666-8666-6666666677${String(i).padStart(2, '0')}`,
      trip_id: id,
      pickup_point_id: null,
      custom_label: 'Chitré · Parque Unión',
      kind: 'origin',
      sequence: 0,
      scheduled_at: sale,
      created_at: AHORA,
    },
    {
      id: `66666666-6666-4666-8666-6666666678${String(i).padStart(2, '0')}`,
      trip_id: id,
      pickup_point_id: null,
      custom_label: 'Ciudad de Panamá · Albrook',
      kind: 'destination',
      sequence: 1,
      scheduled_at: llega,
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
    origin_city_id: ciudadDe(origen, CIUDAD_PANAMA_ID),
    destination_city_id: ciudadDe(destino, CORONADO.destination_city_id),
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
  maletas_pequenas: 0,
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
    mochilas: 2,
    maletas: 0,
    maletas_pequenas: 1,
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
    mochilas: 0,
    maletas: 2,
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

  /**
   * Un hilo de PREGUNTA (0041): Daniela le escribe a Carla por un viaje a
   * Coronado que **no ha reservado**. `booking_id` va nulo y el hilo cuelga
   * del viaje, con `con_id` diciendo quién es la otra parte.
   *
   * Está en el simulado porque la bandeja tenía que poder enseñar las dos
   * clases de hilo una al lado de la otra: sin esto, «Preguntando» era una
   * pastilla que nadie veía nunca.
   */
  {
    id: 4,
    booking_id: null,
    trip_id: '55555555-5555-4555-8555-555555555901',
    con_id: DANIELA_ID,
    sender_id: DANIELA_ID,
    body: '¿Pasas cerca de la vía Ricardo J. Alfaro? Vivo por ahí.',
    read_at: null,
    created_at: haceMinutos(48),
  },
  {
    id: 5,
    booking_id: null,
    trip_id: '55555555-5555-4555-8555-555555555901',
    con_id: DANIELA_ID,
    sender_id: CARLA_ID,
    body: 'Sí, salgo por Tumba Muerto. Te puedo recoger en la entrada.',
    read_at: null,
    created_at: haceMinutos(41),
  },
];

export const pagos: Payment[] = [];

/** Altas en memoria. Se pierde al recargar, y está bien: es un simulado. */
export async function guardarViaje(viaje: ViajeFila): Promise<ViajeFila> {
  viajes.unshift(viaje);
  return viaje;
}

/** Las paradas de un viaje recién publicado. */
export async function guardarParada(parada: TripStop): Promise<TripStop> {
  paradas.push(parada);
  return parada;
}

export async function guardarReserva(reserva: ReservaFila): Promise<ReservaFila> {
  reservas.unshift(reserva);
  return reserva;
}

export async function guardarPago(pago: Payment): Promise<Payment> {
  pagos.unshift(pago);
  return pago;
}

export async function guardarMensaje(mensaje: Message): Promise<Message> {
  mensajes.push(mensaje);
  return mensaje;
}

/**
 * Marcar leídos los mensajes que te escribieron.
 *
 * Sólo `read_at`, y sólo de los que NO son tuyos: es lo único que la política
 * de la base deja tocar (`grant update (read_at)`, 0021). Marcar como leído
 * el mensaje de otro sería reescribir su correo.
 */
export async function marcarMensajesLeidos(ids: number[]): Promise<number> {
  const ahora = new Date().toISOString();
  let tocados = 0;
  for (const m of mensajes) {
    if (ids.includes(m.id) && m.read_at == null) {
      m.read_at = ahora;
      tocados++;
    }
  }
  return tocados;
}

/**
 * El pago cambia de estado una sola vez en su vida: de retenido a cobrado,
 * cuando el viaje se cierra. `liberarAporte` lo hacía tocando el objeto en
 * memoria, que en el simulado se nota y contra la base no: la fila se quedaba
 * `authorized` para siempre.
 */
export async function actualizarPago(id: string, cambios: Partial<Payment>): Promise<Payment> {
  const i = pagos.findIndex((p) => p.id === id);
  if (i < 0) throw new Error(`No existe el pago ${id}`);
  pagos[i] = { ...pagos[i], ...cambios };
  return pagos[i];
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

/** Editar un viaje escribe su fila — la pareja simulada de `trips.update`. */
export async function actualizarViaje(id: string, cambios: Partial<ViajeFila>): Promise<ViajeFila> {
  const i = viajes.findIndex((v) => v.id === id);
  if (i < 0) throw new Error(`No existe el viaje ${id}`);
  viajes[i] = { ...viajes[i], ...cambios, updated_at: new Date().toISOString() };
  return viajes[i];
}

/* ══════════════════════════════════════════════════════════════════════
   EL HISTORIAL DE DANIELA — dos viajes que ya pasaron.

   La pestaña «Historial» de Mis viajes existía y salía siempre vacía:
   parecía una persona que nunca ha viajado, y quien prueba no podía ver
   ni el comprobante ni la pantalla de calificar. Dos viajes hechos, con
   su reserva completada, alcanzan para recorrer todo eso.
   ══════════════════════════════════════════════════════════════════════ */

const historico = (
  sufijo: string,
  corredorSlug: string,
  haceDias: number,
  etiquetaOrigen: string,
  etiquetaDestino: string,
  aporteCentavos: number,
) => {
  const c = corredores.find((x) => x.slug === corredorSlug)!;
  const sale = haceMinutos(haceDias * 1440);
  const llega = haceMinutos(haceDias * 1440 - (c.typical_duration_min ?? 120));
  const viajeId = `88888888-8888-4888-8888-88888888880${sufijo}`;

  viajes.push({
    ...viajes[0],
    id: viajeId,
    corridor_id: c.id,
    departure_at: sale,
    arrival_estimate_at: llega,
    price_cents: aporteCentavos,
    status: 'completed',
    completed_at: llega,
    published_at: haceMinutos(haceDias * 1440 + 2880),
    created_at: haceMinutos(haceDias * 1440 + 2880),
    origin_label: etiquetaOrigen,
    destination_label: etiquetaDestino,
    destination_city_id: ciudadDe(etiquetaDestino, CIUDAD_PANAMA_ID),
  });

  reservas.push(
    reservaBase({
      id: `77777777-7777-4777-8777-7777777777${sufijo}0`,
      trip_id: viajeId,
      passenger_id: DANIELA_ID,
      status: 'completed',
      unit_price_cents: aporteCentavos,
      service_fee_cents: Math.round(aporteCentavos * 0.05),
      total_cents: aporteCentavos + Math.round(aporteCentavos * 0.05),
      confirmed_at: haceMinutos(haceDias * 1440 + 1440),
      completed_at: llega,
      created_at: haceMinutos(haceDias * 1440 + 2000),
      boarding_code: '7301',
      arrival_code: '5648',
      maletas: 1,
    }),
  );
};

historico('1', 'panama-chitre', 9, 'Albrook · Terminal', 'Chitré · Parque Unión', 600);
historico('2', 'panama-coronado', 23, 'Costa del Este', 'Coronado · entrada', 500);


/* ═══════════════════════════════════════════════════════════════════════════
 * LA CARTELERA
 *
 * Antes había SEIS viajes en toda la demo: buscar cualquier cosa devolvía una
 * lista de dos renglones y la app parecía vacía. El dueño lo pidió lleno
 * (25-08-2026) — «pas trop non plus»: treinta salidas repartidas en las
 * cuatro rutas y los tres días siguientes. Con eso una búsqueda devuelve
 * entre cuatro y ocho resultados, que es lo que hace que los filtros y el
 * orden signifiquen algo, y la demo sigue arrancando al instante.
 *
 * **Los aportes NO están escritos a mano.** Cada uno sale de la misma
 * fórmula que usa la app —gasolina del carro de verdad, peaje del corredor,
 * repartido entre los ocupantes y con el tope de la ruta— así que la
 * cartelera no puede contradecir a la calculadora, ni enseñar a nadie
 * ganando dinero (R1). Cambiar el precio de la gasolina cambia estos
 * treinta números solos.
 */

type Salida = {
  /** El corredor, por su slug. */
  ruta: string;
  /** Quién maneja y con qué carro. */
  conductor: string;
  carro: string;
  /** Cuántas horas desde ahora. */
  enHoras: number;
  puestos: number;
  origen: string;
  destino: string;
  soloMujeres?: boolean;
  /** Sin efectivo: solo Yappy. Da variedad al filtro de pago. */
  soloYappy?: boolean;
  mascotas?: boolean;
};

const CARTELERA: Salida[] = [
  // ── Panamá → Chitré, la ruta del recorrido ──
  { ruta: 'panama-chitre', conductor: MARIA_ID, carro: 'cccccccc-0000-4000-8000-000000000002', enHoras: 5, puestos: 3, origen: 'Costa del Este', destino: 'Chitré · Parque Unión' },
  { ruta: 'panama-chitre', conductor: JOSE_ID, carro: 'cccccccc-0000-4000-8000-000000000003', enHoras: 9, puestos: 2, origen: 'Vía Brasil', destino: 'Chitré · Parque Unión', mascotas: true },
  { ruta: 'panama-chitre', conductor: LUCIA_ID, carro: 'cccccccc-0000-4000-8000-000000000004', enHoras: 22, puestos: 4, origen: 'San Francisco', destino: 'Chitré · Parque Unión', soloMujeres: true },
  { ruta: 'panama-chitre', conductor: JAVIER_ID, carro: 'cccccccc-0000-4000-8000-000000000006', enHoras: 27, puestos: 2, origen: 'Albrook · Terminal', destino: 'Chitré · La Arena', soloYappy: true },
  { ruta: 'panama-chitre', conductor: ROSA_ID, carro: 'cccccccc-0000-4000-8000-000000000007', enHoras: 31, puestos: 3, origen: 'Calle 50', destino: 'Chitré · Parque Unión' },
  { ruta: 'panama-chitre', conductor: MATEO_ID, carro: 'cccccccc-0000-4000-8000-000000000001', enHoras: 46, puestos: 4, origen: 'Tocumen', destino: 'Chitré · Parque Unión' },
  { ruta: 'panama-chitre', conductor: VIELKA_ID, carro: 'cccccccc-0000-4000-8000-000000000005', enHoras: 53, puestos: 2, origen: 'Costa del Este', destino: 'Chitré · Parque Unión', soloMujeres: true },
  { ruta: 'panama-chitre', conductor: CARLA_ID, carro: TUCSON_ID, enHoras: 70, puestos: 3, origen: 'Vía España', destino: 'Chitré · Parque Unión' },

  // ── Panamá → Santiago ──
  { ruta: 'panama-santiago', conductor: ROSA_ID, carro: 'cccccccc-0000-4000-8000-000000000007', enHoras: 4, puestos: 2, origen: 'Albrook · Terminal', destino: 'Santiago · centro' },
  { ruta: 'panama-santiago', conductor: JOSE_ID, carro: 'cccccccc-0000-4000-8000-000000000003', enHoras: 11, puestos: 3, origen: 'Vía Brasil', destino: 'Santiago · centro', mascotas: true },
  { ruta: 'panama-santiago', conductor: MARIA_ID, carro: 'cccccccc-0000-4000-8000-000000000002', enHoras: 25, puestos: 4, origen: 'San Francisco', destino: 'Santiago · Universidad' },
  { ruta: 'panama-santiago', conductor: LUCIA_ID, carro: 'cccccccc-0000-4000-8000-000000000004', enHoras: 29, puestos: 2, origen: 'Costa del Este', destino: 'Santiago · centro', soloMujeres: true },
  { ruta: 'panama-santiago', conductor: MATEO_ID, carro: 'cccccccc-0000-4000-8000-000000000001', enHoras: 49, puestos: 3, origen: 'Calle 50', destino: 'Santiago · centro', soloYappy: true },
  { ruta: 'panama-santiago', conductor: ANDRES_ID, carro: ELANTRA_ID, enHoras: 55, puestos: 2, origen: 'Albrook · Terminal', destino: 'Santiago · centro' },
  { ruta: 'panama-santiago', conductor: JAVIER_ID, carro: 'cccccccc-0000-4000-8000-000000000006', enHoras: 73, puestos: 4, origen: 'Tocumen', destino: 'Santiago · centro' },

  // ── Panamá → Penonomé ──
  { ruta: 'panama-penonome', conductor: MATEO_ID, carro: 'cccccccc-0000-4000-8000-000000000001', enHoras: 3, puestos: 3, origen: 'Vía España', destino: 'Penonomé · centro' },
  { ruta: 'panama-penonome', conductor: VIELKA_ID, carro: 'cccccccc-0000-4000-8000-000000000005', enHoras: 8, puestos: 2, origen: 'San Francisco', destino: 'Penonomé · centro', soloMujeres: true },
  { ruta: 'panama-penonome', conductor: CARLA_ID, carro: TUCSON_ID, enHoras: 20, puestos: 4, origen: 'Costa del Este', destino: 'Penonomé · La Pintada', mascotas: true },
  { ruta: 'panama-penonome', conductor: ROSA_ID, carro: 'cccccccc-0000-4000-8000-000000000007', enHoras: 28, puestos: 3, origen: 'Albrook · Terminal', destino: 'Penonomé · centro' },
  { ruta: 'panama-penonome', conductor: JOSE_ID, carro: 'cccccccc-0000-4000-8000-000000000003', enHoras: 47, puestos: 2, origen: 'Calle 50', destino: 'Penonomé · centro', soloYappy: true },
  { ruta: 'panama-penonome', conductor: LUCIA_ID, carro: 'cccccccc-0000-4000-8000-000000000004', enHoras: 52, puestos: 4, origen: 'Vía Brasil', destino: 'Penonomé · centro' },
  { ruta: 'panama-penonome', conductor: MARIA_ID, carro: 'cccccccc-0000-4000-8000-000000000002', enHoras: 71, puestos: 3, origen: 'Tocumen', destino: 'Penonomé · centro' },

  // ── Panamá → Coronado, la escapada de fin de semana ──
  { ruta: 'panama-coronado', conductor: JAVIER_ID, carro: 'cccccccc-0000-4000-8000-000000000006', enHoras: 2, puestos: 3, origen: 'Costa del Este', destino: 'Coronado · entrada' },
  { ruta: 'panama-coronado', conductor: LUCIA_ID, carro: 'cccccccc-0000-4000-8000-000000000004', enHoras: 7, puestos: 4, origen: 'San Francisco', destino: 'Coronado · Playa Serena', soloMujeres: true },
  { ruta: 'panama-coronado', conductor: MATEO_ID, carro: 'cccccccc-0000-4000-8000-000000000001', enHoras: 19, puestos: 2, origen: 'Calle 50', destino: 'Coronado · entrada', mascotas: true },
  { ruta: 'panama-coronado', conductor: ANDRES_ID, carro: ELANTRA_ID, enHoras: 24, puestos: 3, origen: 'Albrook · Terminal', destino: 'Coronado · entrada' },
  { ruta: 'panama-coronado', conductor: VIELKA_ID, carro: 'cccccccc-0000-4000-8000-000000000005', enHoras: 30, puestos: 4, origen: 'Vía España', destino: 'Coronado · entrada', soloYappy: true },
  { ruta: 'panama-coronado', conductor: MARIA_ID, carro: 'cccccccc-0000-4000-8000-000000000002', enHoras: 45, puestos: 2, origen: 'Costa del Este', destino: 'Coronado · Playa Serena' },
  { ruta: 'panama-coronado', conductor: JOSE_ID, carro: 'cccccccc-0000-4000-8000-000000000003', enHoras: 51, puestos: 3, origen: 'Tocumen', destino: 'Coronado · entrada' },
  { ruta: 'panama-coronado', conductor: ROSA_ID, carro: 'cccccccc-0000-4000-8000-000000000007', enHoras: 68, puestos: 4, origen: 'Vía Brasil', destino: 'Coronado · entrada' },
];

CARTELERA.forEach((s, i) => {
  const corredor = corredores.find((c) => c.slug === s.ruta);
  const carro = vehiculos.find((v) => v.id === s.carro);
  if (!corredor || !carro) return;

  const n = String(i).padStart(2, '0');
  const id = `55555555-5555-4555-8555-5555555590${n}`;
  const sale = enMinutos(s.enHoras * 60);
  /* La duración sale de la distancia a 65 km/h de media, que es lo que da la
     Interamericana con sus pueblos: 250 km ≈ 3 h 50, medido contra el
     recorrido del diseño. */
  const minutos = Math.round((corredor.distance_km / 65) * 60);
  const llega = new Date(new Date(sale).getTime() + minutos * 60_000).toISOString();

  const costo = costoDelViaje({
    distanciaKm: corredor.distance_km,
    peajeCentavos: corredor.toll_cents,
    consumoL100km: carro.consumption_l_100km ?? CONSUMO_L_100KM.standard,
  });
  /* EL TOPE ES DE LA RUTA, no del carro: se calcula con el sedán de
     referencia. Con el del conductor, quien maneja una SUV podría pedir más
     por el mismo trayecto — y el precio dejaría de ser el mismo para todos
     (R3). Es la misma regla que aplica `prepararPublicacion`. */
  const tope = topeDeRuta(
    costoDelViaje({
      distanciaKm: corredor.distance_km,
      peajeCentavos: corredor.toll_cents,
      consumoL100km: CONSUMO_L_100KM.standard,
    }),
  );
  const aporte = aporteCalculado(costo, s.puestos, tope);

  viajes.push({
    ...viajes[0],
    id,
    driver_id: s.conductor,
    vehicle_id: s.carro,
    corridor_id: corredor.id,
    departure_at: sale,
    arrival_estimate_at: llega,
    seats_offered: s.puestos,
    price_cents: aporte,
    gender_preference: s.soloMujeres ? 'women_only' : 'any',
    allows_pets: s.mascotas ?? false,
    accepts_cash: !s.soloYappy,
    origin_label: s.origen,
    destination_label: s.destino,
    origin_city_id: ciudadDe(s.origen, CIUDAD_PANAMA_ID),
    destination_city_id: corredor.destination_city_id,
    published_at: AHORA,
    snap_distance_km: corredor.distance_km,
    snap_toll_cents: corredor.toll_cents,
    snap_cost_total_cents: costo,
    snap_occupants: s.puestos + 1,
    snap_max_price_cents: tope,
  });

  paradas.push(
    {
      id: `66666666-6666-4666-8666-6666666690${n}`,
      trip_id: id,
      pickup_point_id: null,
      custom_label: s.origen,
      kind: 'origin',
      sequence: 0,
      scheduled_at: sale,
      created_at: AHORA,
    },
    {
      id: `66666666-6666-4666-8666-6666666691${n}`,
      trip_id: id,
      pickup_point_id: null,
      custom_label: s.destino,
      kind: 'destination',
      sequence: 1,
      scheduled_at: llega,
      created_at: AHORA,
    },
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
 * UN SOLO PRECIO PARA TODOS: la pasada que cuadra la cartelera con la
 * calculadora.
 *
 * Los viajes escritos a mano traían aportes de antes de la subida de la
 * gasolina del 24-08 (el de Chitré decía B/6 cuando la fórmula da B/8), y uno
 * de Santiago pedía **B/12 con un tope de ruta de B/10** — un precio que la
 * base de verdad habría rechazado con `CHECK price_within_cap`. Una demo que
 * enseña un número y calcula otro no se puede probar.
 *
 * Así que ningún aporte se escribe: todos salen aquí, de la misma fórmula,
 * con el carro de cada quien para el costo y el sedán de referencia para el
 * tope. Cambiar el precio de la gasolina los cambia todos a la vez.
 *
 * Solo los publicados: los viajes históricos ya tienen reservas cobradas
 * contra su precio, y moverlo dejaría el recibo mintiendo.
 */
viajes.forEach((v, i) => {
  if (v.status !== 'published') return;
  const corredor = corredores.find((c) => c.id === v.corridor_id);
  const carro = vehiculos.find((x) => x.id === v.vehicle_id);
  if (!corredor) return;

  const distanciaKm = corredor.distance_km;
  const peajeCentavos = corredor.toll_cents;
  const costo = costoDelViaje({
    distanciaKm,
    peajeCentavos,
    consumoL100km: carro?.consumption_l_100km ?? CONSUMO_L_100KM.standard,
  });
  const tope = topeDeRuta(
    costoDelViaje({ distanciaKm, peajeCentavos, consumoL100km: CONSUMO_L_100KM.standard }),
  );

  viajes[i] = {
    ...v,
    price_cents: aporteCalculado(costo, v.seats_offered, tope),
    snap_distance_km: distanciaKm,
    snap_toll_cents: peajeCentavos,
    snap_cost_total_cents: costo,
    snap_occupants: v.seats_offered + 1,
    snap_max_price_cents: tope,
  };
});
