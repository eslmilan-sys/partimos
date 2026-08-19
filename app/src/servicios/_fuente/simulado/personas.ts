/**
 * Perfiles y carros. Forma exacta de `profiles`, `vehicles` y `vehicle_categories`.
 *
 * Andrés es el conductor del recorrido del diseño; Mateo y Rosa son quienes
 * piden puesto en `11a`.
 */

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
    home_city_id: '6a6a7413-08f3-4902-9378-62847a9856bd',
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
  },
];

/**
 * Reputación por persona. En producción sale de la vista `driver_ratings` y su
 * equivalente para pasajeros (`reviews` agrupadas por `subject_id`).
 */
export const reputacion: Record<string, { viajes: number; calificacion: number | null }> = {
  [ANDRES_ID]: { viajes: 34, calificacion: 4.9 },
  [MATEO_ID]: { viajes: 12, calificacion: 4.8 },
  [ROSA_ID]: { viajes: 0, calificacion: null },
  [DANIELA_ID]: { viajes: 6, calificacion: 5.0 },
  [MARIA_ID]: { viajes: 21, calificacion: 4.9 },
  [JOSE_ID]: { viajes: 3, calificacion: 4.7 },
  [LUCIA_ID]: { viajes: 9, calificacion: 5.0 },
  [CARLA_ID]: { viajes: 41, calificacion: 5.0 },
};

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

/** La placa completa, que la columna `plate_last3` todavía no puede guardar. */
export const placasCompletas: Record<string, string> = {
  [ELANTRA_ID]: 'AB-1234',
  [TUCSON_ID]: 'CV-0907',
};
