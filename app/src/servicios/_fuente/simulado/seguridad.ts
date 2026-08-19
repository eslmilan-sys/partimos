/**
 * Cédula, incidencias y rutas guardadas: la forma exacta de
 * `identity_verifications`, `incidents`, `no_show_reports` y `routines`.
 *
 * Una ruta guardada **es** una `routine`: de dónde a dónde, qué días y a qué
 * hora. Lo único que la tabla no guarda todavía es el interruptor de avisar,
 * que va aparte como `RoutinePendiente`.
 */

import type { IdentityVerification, Incident, NoShowReport, RutinaFila } from '@/tipos';

import { CIUDAD_PANAMA_ID, ciudades } from './geografia';
import { ANDRES_ID, DANIELA_ID } from './personas';
import { haceDias } from './reloj';

const ciudad = (slug: string) => ciudades.find((c) => c.slug === slug)!.id;

/**
 * La cédula del conductor, ya verificada: sin esto no se publica. Nunca se
 * enseña como distintivo que separe a unos conductores de otros — todos la
 * tienen, o no estarían ahí.
 */
export const verificaciones: IdentityVerification[] = [
  {
    id: 'id000000-0000-4000-8000-000000000001',
    profile_id: ANDRES_ID,
    provider: 'didit',
    provider_ref: 'ver_0001',
    document_country: 'PA',
    document_type: 'cedula',
    status: 'verified',
    score: 0.98,
    verified_at: haceDias(160),
    expires_at: null,
    created_at: haceDias(160),
    updated_at: haceDias(160),
  },
];

export const incidencias: Incident[] = [];
export const reportesDeNoShow: NoShowReport[] = [];

/**
 * Las rutas guardadas de `15a`. El interruptor de avisos apaga el aviso sin
 * borrar la ruta: son dos cosas distintas y el diseño las separa a propósito.
 */
export const rutinas: RutinaFila[] = [
  {
    id: 'r0000000-0000-4000-8000-000000000001',
    profile_id: DANIELA_ID,
    from_city_id: CIUDAD_PANAMA_ID,
    to_city_id: ciudad('chitre'),
    days: [5],
    departure_time: '15:00',
    created_at: haceDias(40),
    updated_at: haceDias(40),
    avisar: true,
    etiqueta: 'Viernes por la tarde',
  },
  {
    id: 'r0000000-0000-4000-8000-000000000002',
    profile_id: DANIELA_ID,
    from_city_id: CIUDAD_PANAMA_ID,
    to_city_id: ciudad('santiago'),
    days: [6],
    departure_time: '06:30',
    created_at: haceDias(30),
    updated_at: haceDias(30),
    avisar: true,
    etiqueta: 'Sábados temprano',
  },
  {
    id: 'r0000000-0000-4000-8000-000000000003',
    profile_id: DANIELA_ID,
    from_city_id: ciudad('chitre'),
    to_city_id: CIUDAD_PANAMA_ID,
    days: [0],
    departure_time: '15:00',
    created_at: haceDias(20),
    updated_at: haceDias(20),
    avisar: false,
    etiqueta: 'Domingos después de las 15:00',
  },
];

export async function guardarIncidencia(i: Incident): Promise<Incident> {
  incidencias.unshift(i);
  return i;
}

export async function cambiarAvisoDeRutina(
  id: string,
  avisar: boolean,
): Promise<RutinaFila | null> {
  const i = rutinas.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rutinas[i] = { ...rutinas[i], avisar, updated_at: new Date().toISOString() };
  return rutinas[i];
}
