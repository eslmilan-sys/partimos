/**
 * El reloj del simulado. Uno solo para todo el almacén.
 *
 * Todo lo que tiene fecha cuelga del momento en que arranca la app, no de
 * fechas fijas: así «expira en 3 h 40» significa algo al abrir, y no cuenta
 * meses. Y todo lo que se compara por día se compara **en hora de Panamá**,
 * porque el teléfono puede estar en cualquier zona pero la salida de un viaje
 * no.
 */

export const arranque = new Date();

export const enMinutos = (m: number) => new Date(arranque.getTime() + m * 60_000).toISOString();
export const haceMinutos = (m: number) => enMinutos(-m);
export const enDias = (d: number) => enMinutos(d * 24 * 60);
export const haceDias = (d: number) => enMinutos(-d * 24 * 60);

/**
 * Todas las salidas cuelgan del mismo día de Panamá, para que el filtro «hoy»
 * de los resultados las vea juntas. Si la primera hora del día ya pasó, el día
 * entero se corre a mañana — nunca se parte por la medianoche.
 */
const PRIMERA_HORA_PA = 6.5; // 06:30

export function aLaHoraDePanama(horas: number, diasDespues = 0): Date {
  const d = new Date(arranque);
  d.setUTCHours(Math.floor(horas) + 5, Math.round((horas % 1) * 60), 0, 0); // Panamá es UTC−5
  d.setUTCDate(d.getUTCDate() + diasDespues);
  return d;
}

const corrido =
  aLaHoraDePanama(PRIMERA_HORA_PA).getTime() - arranque.getTime() < 30 * 60_000 ? 1 : 0;

/** Una hora del día de hoy en Panamá, corrida a mañana si ya pasó. */
export const enPanama = (horas: number, diasDespues = 0) =>
  aLaHoraDePanama(horas, corrido + diasDespues).toISOString();

export const AHORA = arranque.toISOString();

/** La salida del viaje del recorrido del diseño: hoy a las 14:50. */
export const SALIDA = enPanama(14 + 50 / 60);
export const desdeLaSalida = (m: number) =>
  new Date(new Date(SALIDA).getTime() + m * 60_000).toISOString();
export const LLEGADA = desdeLaSalida(210);
