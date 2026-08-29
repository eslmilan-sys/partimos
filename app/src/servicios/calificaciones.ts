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

import { type Atajo as Atajo2, type Lado, atajosDe, ejesDe } from '@/dominio/ejes';
import type { Review } from '@/tipos';

import { nuevoId } from './_id';
import { fuente } from './_fuente';
import { ciudadDestino, ciudadOrigen } from './viajes';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/**
 * **LOS ATAJOS DEPENDEN DE A QUIÉN CALIFICAS** (28-08-2026).
 *
 * Eran cinco, siempre los mismos, escritos para quien maneja. Al conductor
 * que califica a su pasajero le habrían salido «Manejó tranquilo» y «Carro
 * limpio» — de alguien que ni condujo ni puso el carro. La lista por lado, y
 * en qué eje cae cada una, viven en `dominio/ejes.ts` con sus pruebas.
 */
export type Atajo = string;

export type Calificacion = {
  reservaId: string;
  /**
   * A QUIÉN ESTÁS CALIFICANDO. Decide los atajos que la pantalla enseña — y
   * es un dato del viaje, no una suposición de quien dibuja.
   */
  lado: Lado;
  /** Los atajos que valen para ese lado, ya escritos. */
  atajos: Atajo2[];
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
  const lado = ladoQueCalificas(autorId, reserva.passenger_id, viaje.driver_id);
  const otroId = lado === 'conductor' ? viaje.driver_id : reserva.passenger_id;
  const otro = fuente.perfiles.find((p) => p.id === otroId);

  const origen = ciudadOrigen(viaje);
  const destino = ciudadDestino(viaje);

  return demora({
    reservaId,
    lado,
    atajos: atajosDe(lado),
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
  const lado = ladoQueCalificas(autorId, reserva.passenger_id, viaje.driver_id);
  const subjectId = lado === 'conductor' ? viaje.driver_id : reserva.passenger_id;

  if (fuente.resenas.some((r) => r.booking_id === reservaId && r.author_id === autorId)) {
    throw new Error('Este viaje ya está calificado');
  }

  /* Un eje marcado se lleva la nota general; uno sin marcar se queda en null,
     que no es una mala nota: es que no opinó. Y los ejes que ese lado NO
     puede juzgar salen en null pase lo que pase (`dominio/ejes`). */
  const ejes = ejesDe(lado, atajos, nota);

  const limpio = comentario.trim();
  const resena: Review = {
    id: nuevoId(),
    booking_id: reservaId,
    author_id: autorId,
    subject_id: subjectId,
    rating: nota,
    comment: limpio === '' ? null : limpio,
    ...ejes,
    created_at: new Date().toISOString(),
  };

  // Guardar, no apilar: `push` dejaba la nota en memoria y se perdia al
  // recargar, asi que calificar no calificaba nada.
  return demora(await fuente.guardarResena(resena));
}

/* ------------------------------------------------------------------ */

function duracion(salida: string, llegada: string | null): string {
  if (!llegada) return '';
  const minutos = Math.round((new Date(llegada).getTime() - new Date(salida).getTime()) / 60_000);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}



/**
 * A QUÉ LADO PERTENECE LA PERSONA A LA QUE CALIFICAS.
 *
 * Se decidía con un `autorId === passenger_id ? … : …`, que da «pasajero»
 * para cualquiera que no fuera el pasajero — incluido alguien que no tiene
 * nada que ver con el viaje. Visto el 28-08-2026: la pasajera abría la
 * pantalla de una reserva que no era suya y le salían los atajos de calificar
 * a un pasajero, cuando estaba calificando al conductor.
 *
 * Las dos partes se nombran, y quien no es ninguna no califica: una reseña de
 * un tercero no vale nada y `reviews` ni siquiera la aceptaría.
 */
function ladoQueCalificas(autorId: string, pasajeroId: string, conductorId: string): Lado {
  if (autorId === pasajeroId) return 'conductor';
  if (autorId === conductorId) return 'pasajero';
  throw new Error('Solo el conductor y el pasajero de ese viaje pueden calificarlo');
}
