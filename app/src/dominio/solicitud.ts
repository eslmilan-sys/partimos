/**
 * ¿SIGUE VIVA ESTA SOLICITUD? — la regla, sin base y sin pantalla.
 *
 * Una solicitud de puesto muere por DOS relojes, y hasta hoy sólo se miraba
 * uno:
 *
 *   1. **Las cuatro horas para responder.** El conductor tiene ese plazo; si
 *      no contesta, el puesto se libera y quien lo pidió puede buscar otro.
 *      Es `bookings.expires_at`, y era el único que se consultaba.
 *   2. **La salida del viaje.** El carro se fue. Da igual que las cuatro
 *      horas no hayan pasado: no hay puesto que aceptar en un carro que ya
 *      no está.
 *
 * ── El fallo que esto corrige (visto por el dueño el 28-08-2026) ─────────
 *
 * Se podía **aceptar una solicitud de un viaje del pasado**. La pantalla la
 * enseñaba como pendiente —sus cuatro horas seguían corriendo— y el servicio
 * la confirmaba sin mirar la hora de salida. Resultado: una reserva
 * `confirmed` en un viaje que salió ayer, un aporte retenido por un viaje que
 * nadie va a hacer, y un pasajero que aparece en «Ya van contigo» de un carro
 * que ya volvió.
 *
 * **Manda el que llegue primero.** Ni el más lejano ni una regla aparte para
 * cada caso: la solicitud vive hasta el primero de los dos vencimientos, y
 * eso se dice en una frase.
 *
 * Puro, sin IO: las fechas llegan en argumentos.
 */

export type SolicitudViva = {
  /** Cuándo se acaban las cuatro horas del conductor. */
  expiraEn: string;
  /** Cuándo sale el viaje. */
  salida: string;
};

export type EstadoDeSolicitud = 'pendiente' | 'caducada';

/**
 * CUÁNDO SE MUERE DE VERDAD: el primero de los dos relojes.
 *
 * Devuelve la fecha, para que la pantalla pueda escribir «expira en 40 min»
 * con el plazo que de verdad manda y no con el que quede más lejos.
 */
export function cuandoCaduca(s: SolicitudViva): string {
  return new Date(s.expiraEn) < new Date(s.salida) ? s.expiraEn : s.salida;
}

export function estadoDeSolicitud(s: SolicitudViva, ahora: Date = new Date()): EstadoDeSolicitud {
  return new Date(cuandoCaduca(s)).getTime() <= ahora.getTime() ? 'caducada' : 'pendiente';
}

/** ¿Se puede aceptar? Es la misma pregunta, dicha como la hace el servicio. */
export function sePuedeAceptar(s: SolicitudViva, ahora: Date = new Date()): boolean {
  return estadoDeSolicitud(s, ahora) === 'pendiente';
}

/**
 * POR QUÉ CADUCÓ, para poder decirlo.
 *
 * «Se te pasaron las cuatro horas» y «el viaje ya salió» piden respuestas
 * distintas: la primera es culpa de quien no contestó, la segunda no es culpa
 * de nadie. Nulo mientras siga viva.
 */
export function porQueCaduco(
  s: SolicitudViva,
  ahora: Date = new Date(),
): 'sin-responder' | 'ya-salio' | null {
  if (estadoDeSolicitud(s, ahora) === 'pendiente') return null;
  /* Si el viaje ya salió, ésa es la razón que se dice — aunque las cuatro
     horas también hubieran pasado. Es la que la persona puede entender
     mirando el reloj. */
  return new Date(s.salida).getTime() <= ahora.getTime() ? 'ya-salio' : 'sin-responder';
}
