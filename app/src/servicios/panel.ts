/**
 * Los viajes de cada uno — pantallas `10a` (panel del conductor), `5b` (mis
 * viajes, lado pasajero) y `14d` (editar el viaje).
 *
 * En `10a` las solicitudes pendientes van **ancladas arriba y en rojo, con su
 * caducidad**: son lo único de la pantalla con reloj corriendo, y no
 * responderlas cuesta un puesto.
 *
 * En `14d` lo que un pasajero pagado ha cerrado se enseña **con candado y con
 * el motivo**, no escondido. Cambiar la hora o la ruta de un viaje que alguien
 * ya pagó no es editar: es cancelarle el viaje a otro sin decírselo.
 */

import { etiquetaDeMaletero } from '@/dominio/equipaje';
import type { ViajeFila } from '@/tipos';

import { fuente } from './_fuente';
import { puestosLibresDe } from './solicitudes';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/* ------------------------------------------------------- 10a · el panel */

export type ViajePublicado = {
  id: string;
  cuando: string;
  origen: string;
  destino: string;
  horaSalida: string;
  horaLlegada: string;
  puestosVendidos: number;
  puestosOfrecidos: number;
  aporteCentavos: number;
  maletas: string;
  /** Solicitudes sin responder, con la que expira antes. */
  solicitudes: number;
  expiraLaPrimera: string | null;
  /** Se puede editar mientras nadie haya pagado. */
  editable: boolean;
};

export async function viajesPublicados(conductorId: string): Promise<ViajePublicado[]> {
  const mios = fuente.viajes
    .filter((v) => v.driver_id === conductorId && v.status === 'published')
    .sort((a, b) => a.departure_at.localeCompare(b.departure_at));

  return demora(mios.map(comoPublicado));
}

export async function viajePublicado(viajeId: string): Promise<ViajePublicado | null> {
  const v = fuente.viajes.find((x) => x.id === viajeId);
  return demora(v ? comoPublicado(v) : null);
}

function comoPublicado(v: ViajeFila): ViajePublicado {
  const reservas = fuente.reservas.filter((r) => r.trip_id === v.id);
  const pendientes = reservas
    .filter((r) => r.status === 'pending')
    .sort((a, b) => (a.expires_at ?? '9').localeCompare(b.expires_at ?? '9'));
  const vendidos = v.seats_offered - puestosLibresDe(v.id);

  return {
    id: v.id,
    cuando: v.departure_at,
    // La etiqueta entera, con el sitio: en el panel del conductor «Albrook»
    // a secas no dice de qué terminal sale su propio viaje.
    origen: v.origin_label ?? '',
    destino: v.destination_label ?? '',
    horaSalida: v.departure_at,
    horaLlegada: v.arrival_estimate_at ?? v.departure_at,
    puestosVendidos: vendidos,
    puestosOfrecidos: v.seats_offered,
    aporteCentavos: v.price_cents,
    maletas: etiquetaDeMaletero(v.accepts_luggage),
    solicitudes: pendientes.length,
    expiraLaPrimera: pendientes[0]?.expires_at ?? null,
    editable: reservas.every((r) => r.status !== 'confirmed'),
  };
}

/* -------------------------------------------------- 5b · mis viajes */

export type PuestoMio = {
  reservaId: string;
  destino: string;
  cuando: string;
  conductor: string;
  iniciales: string;
  aporteCentavos: number;
  canal: string;
  codigo: string;
  punto: string;
  /** Los kilómetros del corredor, que `1h` enseña junto al tiempo que falta. */
  distanciaKm: number;
  /** Sólo el de hoy manda en la pantalla. */
  esDeHoy: boolean;
};

export type MisViajes = { proximos: PuestoMio[]; pasados: PuestoMio[]; hoy: PuestoMio | null };

export async function misViajes(perfilId: string): Promise<MisViajes> {
  const ahora = Date.now();
  const mios = fuente.reservas
    .filter((r) => r.passenger_id === perfilId && r.status !== 'pending')
    .map(comoPuesto)
    .filter(Boolean) as PuestoMio[];

  const proximos = mios
    .filter((p) => new Date(p.cuando).getTime() >= ahora)
    .sort((a, b) => a.cuando.localeCompare(b.cuando));
  const pasados = mios
    .filter((p) => new Date(p.cuando).getTime() < ahora)
    .sort((a, b) => b.cuando.localeCompare(a.cuando));

  return demora({ proximos, pasados, hoy: proximos.find((p) => p.esDeHoy) ?? null });
}

function comoPuesto(r: (typeof fuente.reservas)[number]): PuestoMio | null {
  const viaje = fuente.viajes.find((v) => v.id === r.trip_id);
  if (!viaje) return null;
  const conductor = fuente.perfiles.find((p) => p.id === viaje.driver_id);
  const nombre = conductor ? `${conductor.first_name} ${conductor.last_initial ?? ''}`.trim() : '';
  const enPanama = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Panama',
  });

  return {
    reservaId: r.id,
    destino: (viaje.destination_label ?? '').split(' · ')[0],
    cuando: viaje.departure_at,
    conductor: nombre,
    iniciales: `${conductor?.first_name[0] ?? ''}${(conductor?.last_initial ?? '')[0] ?? ''}`.toUpperCase(),
    aporteCentavos: r.unit_price_cents * r.seats,
    canal: r.payment_channel,
    codigo: r.boarding_code ?? '',
    punto: r.proposed_point ?? (viaje.origin_label ?? '').split(' · ')[0],
    distanciaKm: viaje.snap_distance_km ?? 0,
    esDeHoy: enPanama.format(new Date(viaje.departure_at)) === enPanama.format(new Date()),
  };
}

/* -------------------------------------------------- 14d · editar */

export type CampoEditable = {
  clave: 'hora' | 'ruta' | 'puestos' | 'maletas' | 'mujeres';
  etiqueta: string;
  valor: string;
  /** Cerrado por alguien que ya pagó, con el motivo escrito. */
  cerrado: boolean;
};

export type Edicion = {
  viajeId: string;
  cuando: string;
  ruta: string;
  /** Quién ha pagado ya, que es lo que cierra los campos. */
  aviso: string | null;
  campos: CampoEditable[];
  /** Avisar de un cambio no es opcional cuando alguien tiene puesto. */
  seAvisa: boolean;
};

export async function prepararEdicion(viajeId: string): Promise<Edicion> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);

  const pagados = fuente.reservas.filter((r) => r.trip_id === viajeId && r.status === 'confirmed');
  const hayPagados = pagados.length > 0;
  const quien = fuente.perfiles.find((p) => p.id === pagados[0]?.passenger_id);
  const paradas = fuente.paradas
    .filter((p) => p.trip_id === viajeId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((p) => (p.custom_label ?? '').split(' · ')[0]);

  return demora({
    viajeId,
    cuando: viaje.departure_at,
    ruta: `${(viaje.origin_label ?? '').split(' · ')[0]} → ${(viaje.destination_label ?? '').split(' · ')[0]}`,
    aviso: hayPagados
      ? `${quien?.first_name ?? 'Alguien'} ya pagó su puesto. La hora y la ruta quedan cerradas.`
      : null,
    campos: [
      { clave: 'hora', etiqueta: 'Hora de salida', valor: hhmm(viaje.departure_at), cerrado: hayPagados },
      { clave: 'ruta', etiqueta: 'Ruta y paradas', valor: paradas.join(' · '), cerrado: hayPagados },
      {
        clave: 'puestos',
        etiqueta: 'Puestos',
        valor: `${viaje.seats_offered} · ${pagados.length} vendido${pagados.length === 1 ? '' : 's'}`,
        cerrado: false,
      },
      { clave: 'maletas', etiqueta: 'Acepto maletas', valor: viaje.accepts_luggage ? 'Sí' : 'No', cerrado: false },
      {
        clave: 'mujeres',
        etiqueta: 'Solo mujeres',
        valor: viaje.gender_preference === 'women_only' ? 'Sí' : 'No',
        // El traspaso lo deja abierto aunque alguien haya pagado. Encenderlo
        // con un hombre a bordo es un problema de verdad, pero la decisión es
        // del diseño y se respeta: queda anotado, no cambiado a escondidas.
        cerrado: false,
      },
    ],
    seAvisa: hayPagados,
  });
}

/**
 * Apagar «acepto maletas» cuando alguien reservó **con** maleta es el caso que
 * el traspaso pinta en rojo: no es un ajuste, es dejar en tierra el equipaje de
 * alguien que ya pagó.
 */
export function equipajeEnConflicto(viajeId: string, aceptaMaletas: boolean): string | null {
  if (aceptaMaletas) return null;
  const con = fuente.reservas.filter(
    (r) => r.trip_id === viajeId && r.status === 'confirmed' && r.maletas > 0,
  );
  if (!con.length) return null;
  const quien = fuente.perfiles.find((p) => p.id === con[0].passenger_id);
  return `${quien?.first_name ?? 'Alguien'} reservó con maleta. Si lo apagas, se queda sin sitio para ella.`;
}

export async function guardarEdicion(
  viajeId: string,
  cambios: { puestos?: number; maletas?: boolean; mujeres?: boolean },
): Promise<ViajeFila> {
  const i = fuente.viajes.findIndex((v) => v.id === viajeId);
  if (i < 0) throw new Error(`No existe el viaje ${viajeId}`);

  fuente.viajes[i] = {
    ...fuente.viajes[i],
    seats_offered: cambios.puestos ?? fuente.viajes[i].seats_offered,
    accepts_luggage: cambios.maletas ?? fuente.viajes[i].accepts_luggage,
    gender_preference:
      cambios.mujeres === undefined
        ? fuente.viajes[i].gender_preference
        : cambios.mujeres
          ? 'women_only'
          : 'any',
    updated_at: new Date().toISOString(),
  };
  return demora(fuente.viajes[i]);
}

function hhmm(cuando: string): string {
  return new Intl.DateTimeFormat('es-PA', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Panama',
  }).format(new Date(cuando));
}
