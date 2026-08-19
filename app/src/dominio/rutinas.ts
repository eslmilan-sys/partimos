/**
 * Las franjas del día y cómo se lee una rutina.
 *
 * Dos cosas que se estaban resolviendo con texto escrito a mano en el
 * simulado y que en producción salían vacías:
 *
 * 1 · **La etiqueta de una rutina.** `routines` guarda `days` —números ISO— y
 *     `departure_time`. La frase «Viernes por la tarde» era un campo pendiente
 *     que solo existía en el simulado, así que contra la base `15a` enseñaba
 *     una fila con la ruta y **nada** donde va el cuándo.
 *
 * 2 · **La franja de una salida.** Los resultados se leen mejor partidos en
 *     mañana, tarde y noche que como una lista de siete horas seguidas.
 *
 * Vive en `dominio/` porque no consulta nada: entra un número, sale una
 * palabra. Así lo pueden usar tanto los servicios como el almacén.
 */

export type Franja = 'manana' | 'tarde' | 'noche';

/** Hasta las 12 es mañana; hasta las 18, tarde; de ahí, noche. */
export function franjaDe(hora: number): Franja {
  if (hora < 12) return 'manana';
  if (hora < 18) return 'tarde';
  return 'noche';
}

export const NOMBRE_DE_FRANJA: Record<Franja, string> = {
  manana: 'la mañana',
  tarde: 'la tarde',
  noche: 'la noche',
};

/** Lunes = 1, como en la base. */
const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * `HH:MM` a la franja, con una excepción escrita: **las 00:00 quieren decir
 * «a cualquier hora»**. Es lo que se guarda cuando alguien pide que le avisen
 * de una ruta sin haber elegido hora, y guardar las seis de la mañana en su
 * lugar sería inventarle un dato que nunca dio.
 */
export function etiquetaDeRutina(dias: number[], hora: string): string {
  const nombres = [...dias].sort((a, b) => a - b).map((d) => DIAS[d] ?? '').filter(Boolean);
  const cuando =
    nombres.length === 0
      ? 'Cualquier día'
      : nombres.length === 1
        ? nombres[0]
        : nombres.length === 7
          ? 'Todos los días'
          : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;

  const h = Number(hora.slice(0, 2));
  if (!hora || Number.isNaN(h) || hora.startsWith('00:00')) return `${cuando}, a cualquier hora`;
  return `${cuando} por ${NOMBRE_DE_FRANJA[franjaDe(h)]}`;
}

/** Lo que se guarda cuando no se ha elegido hora. Ver arriba. */
export const A_CUALQUIER_HORA = '00:00:00';
