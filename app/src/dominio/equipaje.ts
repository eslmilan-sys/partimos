/**
 * El modelo de equipaje, a propósito simple.
 *
 * El conductor pone un booleano al publicar (`5c`). El formulario del pasajero
 * se adapta a ese booleano (`7a`). No hay contabilidad de espacio de maletero.
 * La mochila siempre viaja con el pasajero y nunca cuenta.
 */

export type Equipaje = {
  /** Va contigo en el asiento. Siempre permitida. */
  mochilas: number;
  /** Va al maletero. Solo si el conductor las acepta. */
  maletas: number;
};

export const SIN_EQUIPAJE: Equipaje = { mochilas: 0, maletas: 0 };

/** La cadena de la tarjeta de resultados. Solo puede ser una de estas dos. */
export function etiquetaDeMaletero(aceptaMaletas: boolean): 'Acepta maletas' | 'Solo mochila' {
  return aceptaMaletas ? 'Acepta maletas' : 'Solo mochila';
}

/** La línea de ayuda bajo los steppers de `7a`. */
export function notaDeEquipaje(
  aceptaMaletas: boolean,
  maletas: number,
  nombreDelConductor: string,
): string {
  if (!aceptaMaletas) {
    return `${nombreDelConductor} no lleva maletas en este viaje. Solo lo que va contigo en el asiento.`;
  }
  return maletas > 0
    ? `${nombreDelConductor} ve tu equipaje cuando le llega la solicitud.`
    : `${nombreDelConductor} acepta una maleta por pasajero.`;
}

/** Cómo se le resume el equipaje al conductor en `11a`. */
export function resumenDeEquipaje({ mochilas, maletas }: Equipaje): string {
  if (maletas === 0) return 'Solo mochila';
  if (mochilas === 0) return maletas === 1 ? 'Una maleta' : `${maletas} maletas`;
  return maletas === 1 ? 'Mochila y una maleta' : `Mochila y ${maletas} maletas`;
}

/** La versión corta, para una fila estrecha: «1 maleta» o «solo mochila». */
export function resumenCorto({ maletas }: Equipaje): string {
  if (maletas === 0) return 'solo mochila';
  return maletas === 1 ? '1 maleta' : `${maletas} maletas`;
}

/** Si el conductor deja de aceptar maletas y alguien ya reservó con una, hay que avisar en rojo (`14d`). */
export function hayConflictoDeEquipaje(aceptaMaletas: boolean, maletasReservadas: number): boolean {
  return !aceptaMaletas && maletasReservadas > 0;
}
