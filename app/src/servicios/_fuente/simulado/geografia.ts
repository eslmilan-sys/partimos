/**
 * Ciudades y corredores. Filas copiadas tal cual de la base de producción,
 * con sus ids reales: cuando la app apunte a Supabase, estas mismas filas
 * vuelven idénticas y nada de arriba se entera.
 */

import type { City, Corridor } from '@/tipos';

export const CIUDAD_PANAMA_ID = '6a6a7413-08f3-4902-9378-62847a9856bd';

export const ciudades: City[] = [
  {
    id: CIUDAD_PANAMA_ID,
    country_code: 'PA',
    name: 'Ciudad de Panamá',
    slug: 'panama',
    province: 'Panamá',
    lat: 8.9824,
    lng: -79.5199,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
  {
    id: '80e33730-d19b-4820-9cfd-94d71871b3f2',
    country_code: 'PA',
    name: 'Chitré',
    slug: 'chitre',
    province: 'Herrera',
    lat: 7.9614,
    lng: -80.4297,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
  {
    id: '25def5be-9044-43c2-9360-a357f85e6c4d',
    country_code: 'PA',
    name: 'La Chorrera',
    slug: 'la-chorrera',
    province: 'Panamá Oeste',
    lat: 8.8803,
    lng: -79.7833,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
  {
    id: '116c8b0a-7978-4b5b-8954-b8259b090344',
    country_code: 'PA',
    name: 'Penonomé',
    slug: 'penonome',
    province: 'Coclé',
    lat: 8.5194,
    lng: -80.3572,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
  {
    id: '8e80ac24-41bc-4e49-9c3b-b634c5dd8037',
    country_code: 'PA',
    name: 'Aguadulce',
    slug: 'aguadulce',
    province: 'Coclé',
    lat: 8.2422,
    lng: -80.5442,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
  {
    id: 'ac445fcb-ce3d-4c62-b24d-23c9dbe81373',
    country_code: 'PA',
    name: 'Santiago',
    slug: 'santiago',
    province: 'Veraguas',
    lat: 8.1,
    lng: -80.9833,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
  {
    id: 'abcbb99b-dca8-48ef-b1da-03ddf9ed6048',
    country_code: 'PA',
    name: 'Coronado',
    slug: 'coronado',
    province: 'Panamá Oeste',
    lat: 8.5333,
    lng: -79.95,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
];

export const corredores: Corridor[] = [
  {
    id: 'a9fc7dcd-ab81-4b89-80e0-2e5ceaad2de0',
    origin_city_id: CIUDAD_PANAMA_ID,
    destination_city_id: '80e33730-d19b-4820-9cfd-94d71871b3f2',
    slug: 'panama-chitre',
    max_price_cents: 700,
    distance_km: 250,
    toll_cents: 300,
    typical_duration_min: 220,
    bus_price_cents: 900,
    is_priority: true,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
  {
    id: 'ed125eaa-c00e-46fd-9f26-82159eec6c59',
    origin_city_id: CIUDAD_PANAMA_ID,
    destination_city_id: 'abcbb99b-dca8-48ef-b1da-03ddf9ed6048',
    slug: 'panama-coronado',
    max_price_cents: 300,
    distance_km: 85,
    toll_cents: 200,
    typical_duration_min: 75,
    bus_price_cents: 450,
    is_priority: true,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
  {
    id: 'cdf7700f-3108-42c4-bf30-0b1ed416b388',
    origin_city_id: CIUDAD_PANAMA_ID,
    destination_city_id: '116c8b0a-7978-4b5b-8954-b8259b090344',
    slug: 'panama-penonome',
    max_price_cents: 500,
    distance_km: 145,
    toll_cents: 300,
    typical_duration_min: 120,
    bus_price_cents: 600,
    is_priority: false,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
  {
    id: '7be342aa-9a0e-4b37-b2c2-e155bd93c6a5',
    origin_city_id: CIUDAD_PANAMA_ID,
    destination_city_id: 'ac445fcb-ce3d-4c62-b24d-23c9dbe81373',
    slug: 'panama-santiago',
    max_price_cents: 700,
    distance_km: 250,
    toll_cents: 300,
    typical_duration_min: 210,
    bus_price_cents: 950,
    is_priority: false,
    is_active: true,
    created_at: '2026-08-14T00:43:38.000418+00:00',
  },
];

/**
 * Las paradas que una ruta ofrece, en orden. El diseño de `5c` las nombra una
 * a una al añadirlas («Añadir Aguadulce»), nunca dice «añadir parada».
 * En producción salen de `pickup_points` cruzado con la geometría del corredor.
 */
export const paradasDeLaRuta: Record<string, { ciudad: string; etiqueta: string; minutos: number }[]> = {
  'panama-chitre': [
    { ciudad: 'La Chorrera', etiqueta: 'La Chorrera', minutos: 45 },
    { ciudad: 'Penonomé', etiqueta: 'Penonomé', minutos: 110 },
    { ciudad: 'Aguadulce', etiqueta: 'Aguadulce', minutos: 140 },
    { ciudad: 'Divisa', etiqueta: 'Divisa', minutos: 165 },
  ],
};
