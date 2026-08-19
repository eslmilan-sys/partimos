/**
 * Fechas y horas, siempre en la hora de Panamá.
 *
 * El teléfono del pasajero puede estar en cualquier zona; la hora de salida de
 * un viaje no. Todo se formatea con `America/Panama` a propósito.
 *
 * Reloj de 24 h con cero delante, y minúsculas: «sábado 14, 14:50».
 */

export const ZONA = 'America/Panama';

const hhmm = new Intl.DateTimeFormat('es-PA', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: ZONA,
});

const diaYNumero = new Intl.DateTimeFormat('es-PA', {
  weekday: 'long',
  day: 'numeric',
  timeZone: ZONA,
});

const fechaLarga = new Intl.DateTimeFormat('es-PA', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: ZONA,
});

/** «14:50» */
export function hora(d: Date | string): string {
  return hhmm.format(new Date(d));
}

/** «sábado 14» */
export function diaCorto(d: Date | string): string {
  return diaYNumero.format(new Date(d)).replace(',', '');
}

const diaAbreviado = new Intl.DateTimeFormat('es-PA', {
  weekday: 'short',
  timeZone: ZONA,
});

/**
 * «Sáb» — el día en tres letras, con mayúscula, para las filas donde no cabe
 * el nombre entero. `Intl` lo devuelve con punto en algunas versiones; se
 * quita, porque en una fila de resultados el punto es ruido.
 */
export function diaAbrev(d: Date | string): string {
  const corto = diaAbreviado.format(new Date(d)).replace('.', '');
  return corto.charAt(0).toUpperCase() + corto.slice(1);
}

/** «sábado 14 de noviembre» */
export function diaLargo(d: Date | string): string {
  return fechaLarga.format(new Date(d)).replace(',', '');
}

/** Suma minutos y devuelve una fecha nueva. */
export function mas(d: Date | string, minutos: number): Date {
  return new Date(new Date(d).getTime() + minutos * 60_000);
}

const diaISO = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: ZONA,
});

/** Mismo día en Panamá, no en la zona del teléfono. */
export function esHoy(d: Date | string, ahora: Date = new Date()): boolean {
  return diaISO.format(new Date(d)) === diaISO.format(ahora);
}

/** «Hoy 14:50» cuando sale hoy; si no, «sábado 14 14:50». */
export function cuando(d: Date | string): string {
  return `${esHoy(d) ? 'Hoy' : diaCorto(d)} ${hora(d)}`;
}
