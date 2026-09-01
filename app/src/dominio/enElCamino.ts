/**
 * QUÉ CIUDADES ESTÁN DE CAMINO — y cuáles no.
 *
 * **El defecto que trajo esto.** Publicando Ciudad de Panamá → Chitré, la
 * app ofrecía parar en **David**: 400 km al oeste, pasada de largo la
 * desviación de Azuero. La fuente real repartía TODOS los `pickup_points`
 * del país en TODAS las rutas, quitando sólo los dos extremos. Visto en el
 * teléfono del dueño el 25-08-2026.
 *
 * **Dos medidas, porque una sola no basta.** No hay geometría de carretera
 * en la base, así que no se puede preguntar «¿pasa la vía por aquí?». Se
 * miden dos cosas con las coordenadas que ya están, y hacen falta las dos —
 * lo dicen los números, medidos sobre la semilla:
 *
 * 1. **Cuánto ALARGA** pasar por ahí. Panamá → Chitré mide 151 km a vuelo:
 *    La Chorrera lo alarga un 2,8 %, Penonomé un 11, Aguadulce un 14,5,
 *    Divisa un 27,5 — las cuatro paradas reales de esa vía. Santiago lo
 *    alarga un 65,8 y David un 265. El corte va en **35 %**.
 *
 * 2. **Hacia dónde queda**, comparando el rumbo de salida. Sólo con el
 *    alargue, Colón se colaba en Panamá → David: a vuelo de pájaro apenas
 *    lo alarga un 9,2 % — porque la carretera a Colón es un ramal sin
 *    salida que la línea recta no ve. Pero sale a 56° del rumbo a David,
 *    mientras las paradas de verdad de esa vía salen entre 11° y 26°. El
 *    corte va en **45°**.
 *
 * Juntas aciertan las dos rutas medidas: Panamá → Chitré devuelve la vía a
 * Azuero, y Panamá → David la Interamericana sin Colón.
 *
 * **LO QUE ESTA REGLA NO PUEDE.** Distinguir «justo antes» de «justo
 * después» del destino, cuando el destino está lejos. Medido: yendo de
 * Panamá a Chitré, Divisa —el cruce por donde se entra a Azuero, la parada
 * más útil de la vía— avanza un 103 % del trayecto, y Las Tablas, que está
 * 35 km PASADO Chitré, un 104 %. A 150 km de distancia las dos caen
 * prácticamente en el mismo sitio, y ninguna medida sobre líneas rectas las
 * separa. Se intentó exigir que la parada quedara entre los dos extremos:
 * echaba a Las Tablas, sí, pero también a Divisa.
 *
 * Se prefiere ofrecer de más a quitar el cruce: una parada de sobra el
 * conductor simplemente no la elige. La cura de verdad es declarar las
 * paradas de cada corredor en la base.
 *
 * **Esto es una red de seguridad, no la verdad.** La verdad es declarar las
 * paradas de cada corredor en la base; mientras esa migración no exista,
 * esta regla impide lo absurdo. Vive en el dominio y no en el servicio a
 * propósito: se prueba sola, sin base y sin red, y las dos fuentes —la
 * simulada y la real— la comparten.
 */

import { distanciaKm } from './lugar.ts';

export type Punto = { lat: number; lng: number };

/** Cuánto alarga el viaje pasar por `x`, en tanto por uno. 0 = ni un metro. */
export function cuantoAlarga(a: Punto, x: Punto, b: Punto): number {
  const directo = distanciaKm(a, b);
  if (directo <= 0) return Infinity;
  return (distanciaKm(a, x) + distanciaKm(x, b)) / directo - 1;
}

/** El rumbo de `a` a `b`, en grados desde el norte. */
function rumbo(a: Punto, b: Punto): number {
  const aRad = (g: number) => (g * Math.PI) / 180;
  const y = Math.sin(aRad(b.lng - a.lng)) * Math.cos(aRad(b.lat));
  const x =
    Math.cos(aRad(a.lat)) * Math.sin(aRad(b.lat)) -
    Math.sin(aRad(a.lat)) * Math.cos(aRad(b.lat)) * Math.cos(aRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Cuántos grados se aparta `x` del rumbo de salida hacia `b`. */
export function cuantoSeAparta(a: Punto, x: Punto, b: Punto): number {
  const diferencia = Math.abs(rumbo(a, x) - rumbo(a, b));
  return diferencia > 180 ? 360 - diferencia : diferencia;
}

/** Los dos cortes, medidos. Ver la cabecera para de dónde salen. */
export const MARGEN = 0.35;
export const GRADOS = 45;

export function estaEnElCamino(a: Punto, x: Punto, b: Punto): boolean {
  return cuantoAlarga(a, x, b) <= MARGEN && cuantoSeAparta(a, x, b) <= GRADOS;
}

/**
 * Las que están de camino, EN EL ORDEN EN QUE SE PASAN — de la salida a la
 * llegada. El orden importa: una lista de paradas desordenada no es un
 * itinerario, y el conductor la lee como el camino que va a hacer.
 *
 * Cada una vuelve con la fracción del trayecto a la que cae, que es lo que
 * deja poner una hora de paso sin inventarla.
 *
 * **La fracción NO se recorta a 1** (01-09-2026). Se recortaba, y entonces
 * todo lo que cae al final o pasado el destino salía con la MISMA fracción —
 * y por tanto con la misma hora de paso. Con dos paradas por viaje casi no se
 * veía; desde que se pueden poner todas, un Panamá → Chitré enseñaba cuatro
 * ciudades seguidas a las 02:40 clavadas, que es una hora inventada cuatro
 * veces.
 *
 * Por encima de 1 la línea recta ya no sabe ordenar —lo dice la nota de
 * arriba: Divisa avanza un 103 % y Las Tablas, que está 35 km PASADO Chitré,
 * un 104 %—, así que **quien consuma esto no debe escribir una hora para
 * ellas**. Se siguen ofreciendo, porque quitarlas se llevaba por delante el
 * cruce de Divisa; lo que no se hace es fingir que sabemos cuándo se pasa.
 */
export function paradasEnElCamino<T extends Punto>(
  a: Punto,
  b: Punto,
  candidatas: readonly T[],
): (T & { fraccion: number })[] {
  const directo = distanciaKm(a, b);
  if (directo <= 0) return [];

  return candidatas
    .filter((c) => estaEnElCamino(a, c, b))
    .map((c) => ({ ...c, fraccion: distanciaKm(a, c) / directo }))
    .sort((uno, otro) => uno.fraccion - otro.fraccion);
}
