/**
 * Avisos. **La base no tiene tabla**, así que la forma vive en
 * `tipos/index.ts` como `AvisoPendiente` y estas filas la respetan entera.
 *
 * Las cinco reglas del traspaso, que son las que ordenan esta lista:
 * el título dice qué pasó y la segunda línea lleva ruta y hora; **si hay
 * acción, va dentro del aviso**; un evento, un aviso; el permiso se pide
 * cuando ya importa, no al arrancar; y nunca escribimos si no es tu viaje.
 */

import type { AvisoPendiente } from '@/tipos';

import { DANIELA_ID } from './personas';
import { haceDias, haceMinutos } from './reloj';

export const avisos: AvisoPendiente[] = [
  {
    id: 'av000000-0000-4000-8000-000000000001',
    profile_id: DANIELA_ID,
    kind: 'solicitud_aceptada',
    title: 'Andrés aceptó tu puesto',
    body: 'Hoy 6:00 · Albrook → Chitré',
    action_label: 'Ver código',
    action_route: '/(pasajero)/codigo',
    booking_id: '77777777-7777-4777-8777-777777777700',
    trip_id: '55555555-5555-4555-8555-555555555555',
    read_at: null,
    created_at: haceMinutos(45),
  },
  {
    id: 'av000000-0000-4000-8000-000000000002',
    profile_id: DANIELA_ID,
    kind: 'califica_tu',
    title: 'Califica a Moisés B.',
    body: 'Viaje del viernes',
    action_label: 'Calificar',
    action_route: '/(pasajero)/calificar',
    booking_id: '77777777-7777-4777-8777-777777777711',
    trip_id: null,
    read_at: null,
    created_at: haceMinutos(180),
  },
  {
    id: 'av000000-0000-4000-8000-000000000003',
    profile_id: DANIELA_ID,
    kind: 'solicitud_recibida',
    title: 'Rosa I. pidió puesto',
    body: 'Hace 20 min · expira en 1 h 10',
    action_label: null,
    action_route: null,
    booking_id: '77777777-7777-4777-8777-777777777702',
    trip_id: '55555555-5555-4555-8555-555555555555',
    read_at: null,
    created_at: haceMinutos(20),
  },
  {
    id: 'av000000-0000-4000-8000-000000000004',
    profile_id: DANIELA_ID,
    kind: 'aporte_recibido',
    title: 'Te aportaron 6 $',
    body: 'Ayer · Yappy · 7788',
    action_label: null,
    action_route: null,
    booking_id: null,
    trip_id: null,
    read_at: null,
    created_at: haceDias(1),
  },
  {
    id: 'av000000-0000-4000-8000-000000000005',
    profile_id: DANIELA_ID,
    kind: 'ruta_publicada',
    title: 'Alguien publicó tu ruta guardada',
    body: 'Sáb 22 · Albrook → Santiago',
    action_label: null,
    action_route: null,
    booking_id: null,
    trip_id: null,
    read_at: haceDias(1),
    created_at: haceDias(2),
  },
  {
    id: 'av000000-0000-4000-8000-000000000006',
    profile_id: DANIELA_ID,
    kind: 'te_calificaron',
    title: 'Daniela L. te calificó',
    body: 'Viaje del viernes · 5,0',
    action_label: null,
    action_route: null,
    booking_id: null,
    trip_id: null,
    read_at: haceDias(2),
    created_at: haceDias(3),
  },
];

export async function marcarAvisoLeido(id: string): Promise<AvisoPendiente | null> {
  const i = avisos.findIndex((a) => a.id === id);
  if (i < 0) return null;
  avisos[i] = { ...avisos[i], read_at: new Date().toISOString() };
  return avisos[i];
}

export async function marcarTodosLeidos(perfilId: string): Promise<number> {
  const ahora = new Date().toISOString();
  let n = 0;
  avisos.forEach((a, i) => {
    if (a.profile_id === perfilId && !a.read_at) {
      avisos[i] = { ...a, read_at: ahora };
      n++;
    }
  });
  return n;
}
