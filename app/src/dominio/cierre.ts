/**
 * CÓMO SE CIERRA UN VIAJE.
 *
 * ── Lo que había, y por qué no servía ────────────────────────────────────
 *
 * Dos códigos de cuatro dígitos: uno al subir y otro al bajar, los dos
 * tecleados por el conductor. El segundo era el que cerraba la reserva y
 * soltaba el aporte.
 *
 * Tenía dos defectos, y el dueño dio con los dos el 27-08-2026:
 *
 * 1. **El pasajero veía el de llegada antes de subirse.** Nada más pedir
 *    puesto la app le enseñaba «llegaste» con un código — el del final del
 *    viaje— cuando todavía no se había montado en el carro.
 * 2. **Cerrar dependía de que el conductor teclease.** Al bajar, con la
 *    maleta en la mano y el carro en doble fila, nadie saca el teléfono para
 *    teclear cuatro dígitos. Si no lo hacía, la reserva se quedaba abierta
 *    para siempre.
 *
 * ── Lo que hay ───────────────────────────────────────────────────────────
 *
 * **Un solo código, y es el de subir.** Se teclea al entrar en el carro y es
 * la prueba de que el viaje pasó — el hecho sobre el que se apoya el
 * reembolso por «el conductor no llegó».
 *
 * **El cierre lo dice el pasajero**: «todo bien». Es quien sabe si llegó.
 *
 * **Y si no dice nada, se cierra sola a las 24 h.** No es dejadez: un viaje
 * que pasó no puede quedarse abierto porque a nadie le apeteciera abrir la
 * app. Las 24 h son el margen para decir que algo fue mal antes de que se dé
 * por bueno.
 *
 * Puro, sin IO: las fechas llegan en argumentos.
 */

/** Lo que se espera al pasajero antes de dar el viaje por bueno. */
export const VENTANA_PARA_CONFIRMAR_MS = 24 * 3600_000;

export type ReservaCerrable = {
  /** Cuándo se subió al carro. Nulo si no llegó a subirse. */
  boardedAt: string | null;
  /** Cuándo se cerró. Nulo mientras siga abierta. */
  releasedAt: string | null;
  /** La llegada estimada del viaje. De ahí cuentan las 24 h. */
  llegadaPrevista: string | null;
};

export type EstadoDelCierre =
  /** Todavía no se ha subido: no hay nada que confirmar. */
  | 'sin-subir'
  /** Subió y el viaje sigue en marcha: aún no toca preguntar. */
  | 'en-camino'
  /** Llegó la hora: se le puede pedir que diga si todo fue bien. */
  | 'por-confirmar'
  /** Pasaron las 24 h sin decir nada: se da por bueno. */
  | 'se-cierra-sola'
  /** Ya está cerrada. */
  | 'cerrada';

export function estadoDelCierre(r: ReservaCerrable, ahora: Date = new Date()): EstadoDelCierre {
  if (r.releasedAt) return 'cerrada';
  if (!r.boardedAt) return 'sin-subir';

  const llegada = cuandoLlega(r);
  if (llegada == null) {
    /* Sin llegada estimada no hay reloj del que colgar las 24 h, así que se
       cuenta desde que subió: un viaje sin hora de llegada existe —una ruta
       libre publicada sin duración— y no puede quedarse abierto por eso. */
    return 'por-confirmar';
  }

  const t = ahora.getTime();
  if (t < llegada) return 'en-camino';
  if (t >= llegada + VENTANA_PARA_CONFIRMAR_MS) return 'se-cierra-sola';
  return 'por-confirmar';
}

/** Cuándo se dará por bueno solo. Nulo si no hay nada que esperar. */
export function cuandoSeCierraSola(r: ReservaCerrable): string | null {
  if (r.releasedAt || !r.boardedAt) return null;
  const llegada = cuandoLlega(r);
  if (llegada == null) return null;
  return new Date(llegada + VENTANA_PARA_CONFIRMAR_MS).toISOString();
}

/**
 * ¿Se puede pulsar «todo bien» ya?
 *
 * Sí desde que el viaje llega —no antes: confirmar a mitad de camino sería
 * dar por bueno lo que no ha pasado— y también cuando ya venció, porque el
 * botón sigue teniendo sentido aunque el reloj se le haya adelantado.
 */
export function sePuedeConfirmar(r: ReservaCerrable, ahora: Date = new Date()): boolean {
  const estado = estadoDelCierre(r, ahora);
  return estado === 'por-confirmar' || estado === 'se-cierra-sola';
}

/* ------------------------------------------------------------------ */

function cuandoLlega(r: ReservaCerrable): number | null {
  if (!r.llegadaPrevista) return null;
  const t = new Date(r.llegadaPrevista).getTime();
  return Number.isFinite(t) ? t : null;
}
