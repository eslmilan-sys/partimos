/**
 * Calificar — pantalla `1j` (el pasajero al conductor) y su espejo del lado
 * del conductor.
 *
 * Una pregunta y unos atajos. Las estrellas dan la nota; los atajos dicen por
 * qué, para que la reseña le sirva al siguiente sin obligar a nadie a escribir.
 *
 * Los atajos no son una columna nueva: `reviews` ya tiene una nota por eje
 * (`puntualidad`, `manejo`, `trato`, `carro`, `encuentro`). Un atajo marcado
 * guarda la nota general en su eje; uno sin marcar deja el eje en `null`, que
 * es distinto de una mala nota: es «no opinó».
 *
 * Solo se califica un viaje que pasó: sin `boarded_at` no hay reseña, igual
 * que sin abordaje no se libera el aporte.
 */

import type { Review } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/** Los ejes que ya existen en la tabla. */
type Eje = 'puntualidad' | 'manejo' | 'trato' | 'carro' | 'encuentro';

export type Atajo = 'puntual' | 'manejo' | 'punto' | 'conversa' | 'carro';

/** Los cinco atajos de `1j`, cada uno atado al eje donde se guarda. */
export const ATAJOS: { clave: Atajo; texto: string; eje: Eje }[] = [
  { clave: 'puntual', texto: 'Puntual', eje: 'puntualidad' },
  { clave: 'manejo', texto: 'Manejó tranquilo', eje: 'manejo' },
  { clave: 'punto', texto: 'Punto exacto', eje: 'encuentro' },
  { clave: 'conversa', texto: 'Buena conversa', eje: 'trato' },
  { clave: 'carro', texto: 'Carro limpio', eje: 'carro' },
];

export type Calificacion = {
  reservaId: string;
  /** A quién se califica: nombre e id. */
  otroId: string;
  otro: string;
  /** Quién califica. */
  autorId: string;
  /** Salida del viaje, para el epígrafe del campo rojo. */
  cuando: string;
  /** «Chitré», el destino a secas. */
  destino: string;
  /** «Albrook → Chitré». */
  ruta: string;
  /** «3 h 14». */
  duracion: string;
  /** Si ya la calificó, la pantalla no vuelve a pedirlo. */
  yaCalificado: boolean;
};

/**
 * Todo lo que `1j` necesita. Sin sesión todavía: quien califica es, por
 * defecto, el pasajero de la reserva; el conductor pasa su id para el espejo.
 */
export async function prepararCalificacion(
  reservaId: string,
  yo?: string,
): Promise<Calificacion> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);

  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  if (!viaje) throw new Error(`No existe el viaje ${reserva.trip_id}`);

  const autorId = yo ?? reserva.passenger_id;
  const otroId = autorId === reserva.passenger_id ? viaje.driver_id : reserva.passenger_id;
  const otro = fuente.perfiles.find((p) => p.id === otroId);

  const origen = (viaje.origin_label ?? '').split(' · ')[0];
  const destino = (viaje.destination_label ?? '').split(' · ')[0];

  return demora({
    reservaId,
    otroId,
    otro: otro ? `${otro.first_name} ${otro.last_initial ?? ''}`.trim() : 'Alguien',
    autorId,
    cuando: viaje.departure_at,
    destino,
    ruta: `${origen} → ${destino}`,
    duracion: duracion(viaje.departure_at, viaje.arrival_estimate_at),
    yaCalificado: fuente.resenas.some(
      (r) => r.booking_id === reservaId && r.author_id === autorId,
    ),
  });
}

/**
 * Guarda la reseña. El comentario es opcional a propósito: obligar a escribir
 * es la manera más rápida de quedarse sin reseñas.
 */
export async function calificar(
  reservaId: string,
  estrellas: number,
  atajos: Atajo[],
  comentario = '',
  yo?: string,
): Promise<Review> {
  const nota = Math.round(estrellas);
  if (nota < 1 || nota > 5) throw new Error('La nota va de 1 a 5 estrellas');

  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);
  if (!reserva.boarded_at) throw new Error('Todavía no hay viaje que calificar');

  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  if (!viaje) throw new Error(`No existe el viaje ${reserva.trip_id}`);

  const autorId = yo ?? reserva.passenger_id;
  const subjectId = autorId === reserva.passenger_id ? viaje.driver_id : reserva.passenger_id;

  if (fuente.resenas.some((r) => r.booking_id === reservaId && r.author_id === autorId)) {
    throw new Error('Este viaje ya está calificado');
  }

  // Un eje marcado se lleva la nota general; uno sin marcar se queda en null,
  // que no es una mala nota: es que no opinó.
  const eje = (e: Eje): number | null =>
    ATAJOS.some((a) => a.eje === e && atajos.includes(a.clave)) ? nota : null;

  const limpio = comentario.trim();
  const resena: Review = {
    id: nuevoId(),
    booking_id: reservaId,
    author_id: autorId,
    subject_id: subjectId,
    rating: nota,
    comment: limpio === '' ? null : limpio,
    puntualidad: eje('puntualidad'),
    manejo: eje('manejo'),
    trato: eje('trato'),
    carro: eje('carro'),
    encuentro: eje('encuentro'),
    created_at: new Date().toISOString(),
  };

  fuente.resenas.push(resena);
  return demora(resena);
}

/* ------------------------------------------------------------------ */

function duracion(salida: string, llegada: string | null): string {
  if (!llegada) return '';
  const minutos = Math.round((new Date(llegada).getTime() - new Date(salida).getTime()) / 60_000);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

function nuevoId(): string {
  const n = (fuente.resenas.length + 1).toString().padStart(12, '0');
  return `bbbbbbb2-0000-4000-8000-${n}`;
}
