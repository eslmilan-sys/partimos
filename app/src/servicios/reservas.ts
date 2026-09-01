/**
 * Reservas: pedir puesto, cancelar, abordar.
 *
 * Pedir puesto no cobra nada. El cobro ocurre cuando el conductor acepta
 * (ver `solicitudes.ts`).
 */

import { type Equipaje, aFilas } from '@/dominio/equipaje';
import { type CanalDePago, tarifaDeServicio } from '@/dominio/tarifas';
import type { ReservaFila } from '@/tipos';

import { nuevoId } from './_id';
import { fuente } from './_fuente';
import { ciudadDestino } from './viajes';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/** Horas que tiene el conductor para responder antes de que la solicitud caduque. */
export const HORAS_PARA_RESPONDER = 4;

/** Dónde te recoge: una parada de la ruta, o una dirección que escribes tú. */
export type Punto = { paradaId: string } | { direccionPropia: string };

/** Lo que `7a` necesita antes de que el pasajero toque nada. */
export type ReservaPreparada = {
  viajeId: string;
  conductor: string;
  destino: string;
  salida: string;
  /**
   * La primera parada de la ruta, de donde arranca el carro — **y dónde
   * está**. Las coordenadas son lo que deja medir el desvío de un punto de
   * recogida (01-09-2026); nulas cuando el viaje no las trae, y entonces la
   * pantalla no promete ningún número.
   */
  origen: { etiqueta: string; hora: string; lat: number | null; lng: number | null };
  /** A dónde va, en coordenadas: un desvío se juzga contra el destino. */
  destinoPunto: { lat: number; lng: number } | null;
  /** Los kilómetros del viaje: el alargue es un porcentaje de esto. */
  distanciaKm: number;
  /** Lo que gasta el carro: sin esto no se puede poner precio a un desvío. */
  consumoL100km: number;
  /** El aporte de UN puesto. El total lo hace la pantalla: unidad × puestos. */
  aporteCentavos: number;
  /**
   * CUÁNTOS PUESTOS QUEDAN. Es el tope del ± de la pantalla.
   *
   * Sin esto el contador dejaría pedir tres puestos en un carro con uno
   * libre, y el error saldría al final — después de elegir punto y equipaje.
   */
  puestosLibres: number;

};

export async function prepararReserva(viajeId: string): Promise<ReservaPreparada> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);

  const conductor = fuente.perfiles.find((p) => p.id === viaje.driver_id);
  const origen = fuente.paradas
    .filter((p) => p.trip_id === viajeId)
    .sort((a, b) => a.sequence - b.sequence)[0];
  /* De dónde sale, en coordenadas. La parada guarda una etiqueta, no un
     punto; la ciudad del viaje sí lo tiene. */
  const ciudadDeSalida = fuente.ciudades.find((c) => c.id === viaje.origin_city_id);
  const ciudadDeLlegada = fuente.ciudades.find((c) => c.id === viaje.destination_city_id);

  return demora({
    viajeId,
    conductor: conductor?.first_name ?? 'El conductor',
    destino: ciudadDestino(viaje),
    salida: viaje.departure_at,
    origen: {
      etiqueta: origen?.custom_label ?? viaje.origin_label ?? '',
      hora: origen?.scheduled_at ?? viaje.departure_at,
      lat: ciudadDeSalida?.lat ?? null,
      lng: ciudadDeSalida?.lng ?? null,
    },
    destinoPunto:
      ciudadDeLlegada?.lat != null && ciudadDeLlegada?.lng != null
        ? { lat: ciudadDeLlegada.lat, lng: ciudadDeLlegada.lng }
        : null,
    distanciaKm: viaje.snap_distance_km ?? 0,
    consumoL100km:
      fuente.vehiculos.find((v) => v.owner_id === viaje.driver_id && v.is_active)
        ?.consumption_l_100km ?? 7.5,
    aporteCentavos: viaje.price_cents,
    puestosLibres: Math.max(
      0,
      viaje.seats_offered -
        fuente.reservas
          .filter(
            (r) => r.trip_id === viajeId && (r.status === 'pending' || r.status === 'confirmed'),
          )
          .reduce((t, r) => t + r.seats, 0),
    ),
    /* **YA NO HAY UN «+4 min» ESCRITO A MANO.** Era una constante que la
       pantalla enseñaba como si fuera una medida, en un viaje donde nadie
       había pedido todavía ningún desvío. Lo que cuesta ir a buscar a alguien
       se calcula ahora con su punto, cuando lo pone, en `dominio/desvio`. */
  });
}

/**
 * Pide un puesto. No se cobra: queda pendiente hasta que el conductor acepte.
 */
export async function pedirPuesto(
  viajeId: string,
  punto: Punto,
  equipaje: Equipaje,
  opciones: { pasajeroId: string; canal?: CanalDePago; puestos?: number } = { pasajeroId: '' },
): Promise<ReservaFila> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);

  /* Ya no hay nada que rechazar aquí: el conductor ve el equipaje en la
     solicitud y decide entonces (25-08-2026). Antes esto tiraba un error si
     el viaje traía el booleano en falso. */

  const canal = opciones.canal ?? 'yappy_app';
  /**
   * CUÁNTOS PUESTOS. Estaba clavado en 1 (28-08-2026, visto por el dueño):
   * se buscaba «2 pasajeros», la búsqueda filtraba bien los viajes con dos
   * sitios libres, y al pedir salía UNA reserva de un puesto. La otra
   * persona se quedaba fuera sin que nadie lo dijera.
   *
   * Se corta a lo que queda: pedir más puestos de los que hay sería una
   * sobreventa escrita por el cliente, y la base la rechazaría al final del
   * camino en vez de aquí.
   */
  const libres = Math.max(
    0,
    viaje.seats_offered -
      fuente.reservas
        .filter((r) => r.trip_id === viajeId && (r.status === 'pending' || r.status === 'confirmed'))
        .reduce((t, r) => t + r.seats, 0),
  );
  const puestos = Math.min(Math.max(1, Math.round(opciones.puestos ?? 1)), Math.max(1, libres));
  /**
   * `total_cents` ES EL APORTE, NO LO QUE PAGA EL PASAJERO.
   *
   * Aquí se escribía `aporte + tarifa`, y la base lo rechazaba: la
   * restricción `fee_is_fixed_pct` (migración 0018) exige
   * `service_fee_cents = round(total_cents * 0,05)`, así que meter la tarifa
   * dentro del total la volvía un 5 % de sí misma. Con 6,00 $ de aporte la
   * base pedía 32 centavos y la app escribía 30: **ninguna reserva entraba**,
   * ni la primera.
   *
   * La 0018 dice quién manda: «esta restricción es la autoridad». Y el sitio,
   * que es la implementación de referencia, hace `totalCents = unitCents *
   * seats` y calcula la tarifa sobre eso (`BookingPanel.tsx`). Lo que el
   * pasajero paga —aporte más tarifa— es un número de pantalla; no se guarda.
   * Así el conductor recibe su aporte completo, que es el invariante de R2.
   */
  const total = viaje.price_cents * puestos;
  const tarifa = tarifaDeServicio(total, canal);
  const ahora = new Date();

  const reserva: ReservaFila = {
    id: nuevoId(),
    trip_id: viajeId,
    passenger_id: opciones.pasajeroId,
    seats: puestos,
    unit_price_cents: viaje.price_cents,
    service_fee_cents: tarifa,
    total_cents: total,
    /* Vacío es «donde sale el carro», no una parada con id en blanco: sobre
       Supabase una cadena vacía en una columna uuid revienta la inserción. */
    trip_stop_id: 'paradaId' in punto && punto.paradaId ? punto.paradaId : null,
    proposed_point: 'direccionPropia' in punto ? punto.direccionPropia : null,
    proposal_accepted: null,
    status: 'pending',
    confirmed_at: null,
    completed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: ahora.toISOString(),
    updated_at: ahora.toISOString(),
    board_sequence: null,
    alight_sequence: null,
    offer_price_cents: null,
    offer_accepted: null,
    payment_channel: canal,
    boarding_code: nuevoCodigo(),
    /**
     * **NULO A PROPÓSITO.** `arrival_code` era el segundo código, el que el
     * conductor tecleaba al bajarte. Se retiró el 27-08-2026: cierra el
     * pasajero —«todo bien»— o se cierra solo a las 24 h (`dominio/cierre`).
     * La columna se queda para no arrastrar una migración detrás, pero ya no
     * se genera: un secreto que nadie usa es un secreto de más.
     */
    arrival_code: null,
    boarded_at: null,
    expires_at: new Date(ahora.getTime() + HORAS_PARA_RESPONDER * 3600_000).toISOString(),
    detour_minutes: null,
    released_at: null,
    ...aFilas(equipaje),
  };

  return demora(await fuente.guardarReserva(reserva));
}

export async function reservasDelViaje(viajeId: string): Promise<ReservaFila[]> {
  return demora(fuente.reservas.filter((r) => r.trip_id === viajeId));
}

/** El conductor marca a alguien al subir. Esta marca es lo que prueba que el viaje pasó. */
export async function marcarAbordaje(reservaId: string): Promise<ReservaFila> {
  return demora(await fuente.actualizarReserva(reservaId, { boarded_at: new Date().toISOString() }));
}

/** Nadie apareció. Sin marca de abordaje no se libera el aporte. */
export async function marcarNoShow(reservaId: string): Promise<ReservaFila> {
  return demora(await fuente.actualizarReserva(reservaId, { status: 'no_show_passenger' }));
}

/* ------------------------------------------------------------------ */

/** Cuatro dígitos. En producción los emite el servidor y se verifican ahí. */
function nuevoCodigo(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
