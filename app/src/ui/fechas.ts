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

const soloNumero = new Intl.DateTimeFormat('es-PA', { day: 'numeric', timeZone: ZONA });
const soloMes = new Intl.DateTimeFormat('es-PA', { month: 'short', timeZone: ZONA });
const soloDia = new Intl.DateTimeFormat('es-PA', { weekday: 'long', timeZone: ZONA });

/** «25» — el número del día, para el bloque de fecha de una ficha de viaje. */
export function numeroDeDia(d: Date | string): string {
  return soloNumero.format(new Date(d));
}

const mesEntero = new Intl.DateTimeFormat('es-PA', { month: 'long', timeZone: ZONA });

/** «agosto» — el mes entero en minúscula, para meterlo en una frase. */
export function mesLargo(d: Date | string): string {
  return mesEntero.format(new Date(d));
}

/** «Sep» — el mes en tres letras, con mayúscula y sin punto. */
export function mesAbrev(d: Date | string): string {
  const m = soloMes.format(new Date(d)).replace('.', '');
  return m.charAt(0).toUpperCase() + m.slice(1);
}

/** «Viernes» — el día de la semana entero, con mayúscula. */
export function diaSemana(d: Date | string): string {
  const s = soloDia.format(new Date(d));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * «6 h», «6 h 30» — una duración en minutos, dicha como se dice.
 *
 * **Vivía escrita cuatro veces.** Tres copias correctas —`resultados`,
 * `puestos`, `destino`— y una cuarta, en el detalle del viaje, que se había
 * escrito sin el caso de los minutos en cero: Panamá → David salía como
 * «6 h 0». Lo vio el dueño en su teléfono (26-08-2026). Una duración se
 * formatea en un sitio, como el dinero.
 */
export function enHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

/** La duración entre dos instantes, ya dicha. Vacía si no hay llegada. */
export function duracionEntre(salida: string, llegada: string | null): string {
  if (!llegada) return '';
  return enHoras(Math.round((new Date(llegada).getTime() - new Date(salida).getTime()) / 60_000));
}
