/**
 * Perfiles y carros. Forma exacta de `profiles`, `vehicles` y `vehicle_categories`.
 *
 * Andrés es el conductor del recorrido del diseño; Mateo y Rosa son quienes
 * piden puesto en `11a`.
 */

import { notaDe } from '@/dominio/notas';
import type { Profile, Review, Vehicle, VehicleCategory } from '@/tipos';

export const ANDRES_ID = '11111111-1111-4111-8111-111111111111';
export const MATEO_ID = '22222222-2222-4222-8222-222222222222';
export const ROSA_ID = '33333333-3333-4333-8333-333333333333';
export const DANIELA_ID = '99999999-9999-4999-8999-999999999999';
export const MARIA_ID = 'aaaaaaa1-0000-4000-8000-000000000001';
export const JOSE_ID = 'aaaaaaa1-0000-4000-8000-000000000002';
export const LUCIA_ID = 'aaaaaaa1-0000-4000-8000-000000000003';
export const VIELKA_ID = 'aaaaaaa1-0000-4000-8000-000000000004';
export const JAVIER_ID = 'aaaaaaa1-0000-4000-8000-000000000005';
/** Conductora del fin de semana a la playa, con SUV y viajes solo para mujeres. */
export const CARLA_ID = 'aaaaaaa1-0000-4000-8000-000000000006';
export const TUCSON_ID = '44444444-4444-4444-8444-444444444445';
export const ELANTRA_ID = '44444444-4444-4444-8444-444444444444';

/** Filas reales de `vehicle_categories`. El `rate_per_km_cents` de la base es
 *  otra escala de costo; la app calcula con litros y precio de gasolina
 *  (ver dominio/aporte.ts), y este consumo es lo que falta ahí. */
export const categorias: (VehicleCategory & { consumo_l_100km: number })[] = [
  { code: 'economy', label_es: 'Económico (sedán pequeño)', rate_per_km_cents: 22, consumo_l_100km: 7.0 },
  { code: 'standard', label_es: 'Estándar (sedán / crossover)', rate_per_km_cents: 25, consumo_l_100km: 8.0 },
  { code: 'suv', label_es: 'SUV o pick-up', rate_per_km_cents: 32, consumo_l_100km: 11.0 },
];

/**
 * Cambia una fila de `profiles` en memoria. La usa `9a` para guardar por dónde
 * te cobran, que es la única columna del perfil que la app escribe hoy.
 */
export async function actualizarPerfil(id: string, cambios: Partial<Profile>): Promise<Profile> {
  const i = perfiles.findIndex((p) => p.id === id);
  if (i < 0) throw new Error(`No existe el perfil ${id}`);
  perfiles[i] = { ...perfiles[i], ...cambios, updated_at: new Date().toISOString() };
  return perfiles[i];
}

export async function guardarVehiculo(carro: Vehicle): Promise<Vehicle> {
  vehiculos.push(carro);
  return carro;
}

export async function guardarResena(resena: Review): Promise<Review> {
  resenas.push(resena);
  return resena;
}

export const perfiles: Profile[] = [
  {
    id: ANDRES_ID,
    first_name: 'Andrés',
    last_initial: 'M.',
    phone: '+507 6000 0000',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'hombre',
    bio: 'Voy a Chitré casi todos los fines de semana.',
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-03-02T14:10:00+00:00',
    updated_at: '2026-08-10T09:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
  {
    id: MATEO_ID,
    first_name: 'Mateo',
    last_initial: 'Q.',
    phone: '+507 6000 0001',
    photo_url: null,
    /* Mateo es quien encarna `1a`, y llega SIN ciudad a propósito: es como
       llega cualquiera que acaba de abrir la cuenta, y es la única forma de
       ver la tarjeta «¿de qué ciudad sales?» en el recorrido. */
    home_city_id: null,
    gender: 'hombre',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-05-18T11:00:00+00:00',
    updated_at: '2026-08-12T08:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
  {
    id: DANIELA_ID,
    first_name: 'Daniela',
    last_initial: 'L.',
    phone: '+507 6000 0003',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'mujer',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-04-02T09:00:00+00:00',
    updated_at: '2026-11-10T09:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: false,
  },
  {
    id: MARIA_ID,
    first_name: 'María',
    last_initial: 'P.',
    phone: '+507 6000 0004',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'mujer',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-05-01T09:00:00+00:00',
    updated_at: '2026-11-10T09:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
  {
    id: JOSE_ID,
    first_name: 'José',
    last_initial: 'R.',
    phone: '+507 6000 0005',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'hombre',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-05-01T09:00:00+00:00',
    updated_at: '2026-11-10T09:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
  {
    id: LUCIA_ID,
    first_name: 'Lucía',
    last_initial: 'V.',
    phone: '+507 6000 0006',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'mujer',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-05-01T09:00:00+00:00',
    updated_at: '2026-11-10T09:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
  {
    id: ROSA_ID,
    first_name: 'Rosa',
    last_initial: 'I.',
    phone: '+507 6000 0002',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'mujer',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-08-14T19:40:00+00:00',
    updated_at: '2026-08-14T19:40:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: false,
  },
  {
    id: VIELKA_ID,
    first_name: 'Vielka',
    last_initial: 'C.',
    phone: '+507 6000 0007',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'mujer',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-04-20T09:00:00+00:00',
    updated_at: '2026-08-01T09:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
  {
    id: JAVIER_ID,
    first_name: 'Javier',
    last_initial: 'S.',
    phone: '+507 6000 0008',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'hombre',
    bio: null,
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-04-20T09:00:00+00:00',
    updated_at: '2026-08-01T09:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
  {
    id: CARLA_ID,
    first_name: 'Carla',
    last_initial: 'V.',
    phone: '+507 6000 0009',
    photo_url: null,
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
    gender: 'mujer',
    bio: 'Voy a la playa casi todos los fines de semana.',
    is_id_verified: true,
    is_phone_verified: true,
    is_suspended: false,
    suspended_reason: null,
    locale: 'es-PA',
    created_at: '2026-02-10T09:00:00+00:00',
    updated_at: '2026-08-01T09:00:00+00:00',
    linkedin_connected_at: null,
    preferred_pay_channel: 'yappy_app',
    accepts_yappy_direct: true,
    accepts_cash: true,
  },
];

export const vehiculos: Vehicle[] = [
  {
    id: ELANTRA_ID,
    owner_id: ANDRES_ID,
    category_code: 'standard',
    make: 'Hyundai',
    model: 'Elantra',
    color: 'gris',
    year: 2019,
    seats_total: 5,
    // La base guarda 3 caracteres; `5c` enseña la placa entera. Ver tipos/index.ts.
    plate_last3: '234',
    is_active: true,
    created_at: '2026-03-02T14:30:00+00:00',
    consumption_l_100km: 8.0,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: true,
  },
  /**
   * El SEGUNDO carro de Andrés. Está aquí porque con uno solo no se puede ver
   * elegir: el conductor de verdad tiene el sedán entre semana y la camioneta
   * cuando baja con la familia, y hasta el 27-08-2026 sólo se podía publicar
   * con el primero que la base devolviera.
   */
  {
    id: 'cccccccc-0000-4000-8000-00000000000a',
    owner_id: ANDRES_ID,
    category_code: 'suv',
    make: 'Toyota',
    model: 'RAV4',
    color: 'negro',
    year: 2021,
    seats_total: 5,
    plate_last3: '871',
    is_active: true,
    created_at: '2026-05-19T09:10:00+00:00',
    consumption_l_100km: 9.5,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: false,
  },
  {
    id: TUCSON_ID,
    owner_id: CARLA_ID,
    category_code: 'suv',
    make: 'Hyundai',
    model: 'Tucson',
    color: 'blanco',
    year: 2022,
    seats_total: 5,
    plate_last3: '907',
    is_active: true,
    created_at: '2026-02-10T09:30:00+00:00',
    consumption_l_100km: 11.0,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: false,
  },
  /* ── Los carros de los demás conductores ─────────────────────────────────
   *
   * Había DOS carros para diez perfiles, así que toda la demo enseñaba el
   * mismo Elantra gris y el mismo Tucson blanco. Con estos, cada viaje se
   * reconoce por su carro — que es justo lo que el pasajero busca al subir.
   * Los consumos son los de `CONSUMO.md`, no números puestos a mano.
   */
  {
    id: 'cccccccc-0000-4000-8000-000000000001',
    owner_id: MATEO_ID,
    category_code: 'economy',
    make: 'Kia',
    model: 'Picanto',
    color: 'rojo',
    year: 2021,
    seats_total: 5,
    plate_last3: '451',
    is_active: true,
    created_at: '2026-01-18T10:00:00+00:00',
    consumption_l_100km: 6.5,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: false,
  },
  {
    id: 'cccccccc-0000-4000-8000-000000000002',
    owner_id: MARIA_ID,
    category_code: 'standard',
    make: 'Toyota',
    model: 'Corolla',
    color: 'blanco',
    year: 2020,
    seats_total: 5,
    plate_last3: '778',
    is_active: true,
    created_at: '2026-02-02T10:00:00+00:00',
    consumption_l_100km: 7.5,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: false,
  },
  {
    id: 'cccccccc-0000-4000-8000-000000000003',
    owner_id: JOSE_ID,
    category_code: 'suv',
    make: 'Toyota',
    model: 'RAV4',
    color: 'negro',
    year: 2021,
    seats_total: 5,
    plate_last3: '063',
    is_active: true,
    created_at: '2026-03-11T10:00:00+00:00',
    consumption_l_100km: 9.5,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: false,
  },
  {
    id: 'cccccccc-0000-4000-8000-000000000004',
    owner_id: LUCIA_ID,
    category_code: 'economy',
    make: 'Nissan',
    model: 'Versa',
    color: 'gris',
    year: 2022,
    seats_total: 5,
    plate_last3: '512',
    is_active: true,
    created_at: '2026-04-05T10:00:00+00:00',
    consumption_l_100km: 6.5,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: false,
  },
  {
    id: 'cccccccc-0000-4000-8000-000000000005',
    owner_id: VIELKA_ID,
    category_code: 'standard',
    make: 'Mitsubishi',
    model: 'Lancer',
    color: 'azul',
    year: 2018,
    seats_total: 5,
    plate_last3: '390',
    is_active: true,
    created_at: '2026-01-30T10:00:00+00:00',
    consumption_l_100km: 7.5,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: false,
  },
  {
    id: 'cccccccc-0000-4000-8000-000000000006',
    owner_id: JAVIER_ID,
    category_code: 'suv',
    make: 'Kia',
    model: 'Sportage',
    color: 'negro',
    year: 2023,
    seats_total: 5,
    plate_last3: '846',
    is_active: true,
    created_at: '2026-05-20T10:00:00+00:00',
    consumption_l_100km: 9.5,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: false,
  },
  {
    id: 'cccccccc-0000-4000-8000-000000000007',
    owner_id: ROSA_ID,
    category_code: 'standard',
    make: 'Honda',
    model: 'Civic',
    color: 'blanco',
    year: 2019,
    seats_total: 5,
    plate_last3: '127',
    is_active: true,
    created_at: '2026-02-22T10:00:00+00:00',
    consumption_l_100km: 7.5,
    rate_per_km_cents: null,
    photo_path: null,
    has_ac: true,
    has_usb: false,
  },
];


/**
 * Reputación por persona. En producción sale de la vista `driver_ratings` y su
 * equivalente para pasajeros (`reviews` agrupadas por `subject_id`).
 */
export const reputacion: Record<string, { viajes: number; calificacion: number | null }> = {};

/**
 * Reseñas, forma exacta de `reviews`. Los atajos de `1j` no son una columna
 * nueva: se guardan en las notas por eje que la tabla ya tiene
 * (`puntualidad`, `manejo`, `trato`, `carro`, `encuentro`).
 *
 * El nombre de quien escribe no vive aquí: se une por `author_id`, como en
 * producción se une con `public_profiles`.
 */
export const resenas: Review[] = [
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000001',
    booking_id: '77777777-7777-4777-8777-7777777776a1',
    author_id: VIELKA_ID,
    subject_id: ANDRES_ID,
    rating: 5,
    comment: 'Puntual y maneja tranquilo. Avisó cuando iba llegando.',
    puntualidad: 5,
    manejo: 5,
    trato: 5,
    carro: null,
    encuentro: null,
    created_at: '2026-07-12T22:10:00+00:00',
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000002',
    booking_id: '77777777-7777-4777-8777-7777777776a2',
    author_id: JAVIER_ID,
    subject_id: ANDRES_ID,
    rating: 5,
    comment: 'El punto de recogida era exacto. Repetiría.',
    puntualidad: null,
    manejo: null,
    trato: null,
    carro: null,
    encuentro: 5,
    created_at: '2026-06-28T23:40:00+00:00',
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000003',
    booking_id: '77777777-7777-4777-8777-7777777776a3',
    author_id: ROSA_ID,
    subject_id: ANDRES_ID,
    rating: 5,
    comment: 'Todo claro desde el chat.',
    puntualidad: null,
    manejo: null,
    trato: 5,
    carro: null,
    encuentro: null,
    created_at: '2026-06-01T21:05:00+00:00',
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000004',
    booking_id: '77777777-7777-4777-8777-7777777776a4',
    author_id: ANDRES_ID,
    subject_id: MATEO_ID,
    rating: 5,
    comment: 'Llegó antes que yo al punto.',
    puntualidad: 5,
    manejo: null,
    trato: null,
    carro: null,
    encuentro: 5,
    created_at: '2026-07-20T20:00:00+00:00',
  },
];

/**
 * LAS RESEÑAS CALLADAS, para que las notas del recorrido salgan de datos.
 *
 * Las cuatro de arriba están escritas a mano porque llevan comentario. Éstas
 * no llevan ninguno — que es lo normal: casi todo el mundo pone estrellas y
 * sigue —, y existen porque **la nota ya no se escribe a mano en ningún
 * sitio**: sale de `dominio/notas.ts` contando estas filas. Sin ellas el
 * recorrido enseñaría «Todavía sin nota» en todas partes, que es cierto pero
 * no deja probar nada.
 *
 * `booking_id` es sintético: no hay una reserva detrás de cada una. Es la
 * única licencia que nos tomamos, y sólo la ve `yaCalifico`, que compara
 * (reserva, autor) y por eso nunca casa con ninguna de éstas.
 *
 * Las cuentas están elegidas para que el recorrido enseñe los tres casos que
 * la fórmula distingue: nota hecha (Carla, Andrés, María), nota naciendo
 * (Lucía, Daniela) y todavía sin nota (José, Mateo, Rosa).
 */
const CALLADAS: { de: string; notas: number[] }[] = [
  { de: CARLA_ID, notas: [5, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5] },
  { de: ANDRES_ID, notas: [5, 4, 5, 5, 5, 4, 5, 5, 5] },
  { de: MARIA_ID, notas: [5, 5, 4, 5, 5, 4, 5, 5] },
  { de: LUCIA_ID, notas: [5, 5, 4, 5] },
  { de: DANIELA_ID, notas: [5, 5, 5] },
  { de: JOSE_ID, notas: [5, 4] },
];

for (const { de, notas } of CALLADAS) {
  notas.forEach((rating, i) => {
    /* Una por semana hacia atrás desde mediados de agosto: el orden importa,
       porque la ventana de la fórmula se queda con las más nuevas. */
    const cuando = new Date(Date.UTC(2026, 7, 15) - i * 7 * 86_400_000);
    resenas.push({
      id: `bbbbbbb2-0000-4000-8000-${de.slice(0, 8)}${String(i).padStart(4, '0')}`,
      booking_id: `77777777-7777-4777-8777-callada${String(i).padStart(5, '0')}`,
      author_id: VIELKA_ID,
      subject_id: de,
      rating,
      comment: null,
      puntualidad: null,
      manejo: null,
      trato: null,
      carro: null,
      encuentro: null,
      created_at: cuando.toISOString(),
    });
  });
}

/**
 * LA REPUTACIÓN, calculada — ya no escrita a mano (28-08-2026).
 *
 * `viajes` son los viajes hechos, que es un hecho aparte y sigue puesto a
 * mano porque no hay historial completo en el recorrido. `calificacion` sale
 * de `notaDe`, la MISMA función que usa la fuente real: si la fórmula cambia,
 * cambian las dos a la vez. Antes eran dos números inventados que no se
 * podían derivar de ninguna reseña — y uno de ellos, el 4,9 de Andrés, no
 * coincidía con sus tres reseñas de 5.
 */
const VIAJES_HECHOS: Record<string, number> = {
  [ANDRES_ID]: 34,
  [MATEO_ID]: 12,
  [ROSA_ID]: 0,
  [DANIELA_ID]: 6,
  [MARIA_ID]: 21,
  [JOSE_ID]: 3,
  [LUCIA_ID]: 9,
  [CARLA_ID]: 41,
};

for (const [id, viajes] of Object.entries(VIAJES_HECHOS)) {
  reputacion[id] = {
    viajes,
    calificacion: notaDe(resenas.filter((r) => r.subject_id === id)).valor,
  };
}

/** La placa completa, que la columna `plate_last3` todavía no puede guardar. */
export const placasCompletas: Record<string, string> = {
  [ELANTRA_ID]: 'AB-1234',
  ['cccccccc-0000-4000-8000-00000000000a']: 'AR-8871',
  [TUCSON_ID]: 'CV-0907',
};
