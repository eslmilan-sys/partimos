/**
 * El modelo de equipaje — REHECHO EL 25-08-2026 por decisión del dueño.
 *
 * **Antes.** El conductor ponía un booleano al publicar («acepto maletas») y
 * el formulario del pasajero se adaptaba a él. Tenía dos defectos: obligaba a
 * decidir en abstracto, meses antes de saber quién pide puesto y con qué; y
 * al pasajero le daba una puerta cerrada sin que nadie la hubiera mirado.
 *
 * **Ahora.** El pasajero DICE lo que lleva, y el conductor lo ve en la
 * solicitud y decide entonces — con la misma mano con la que ya acepta o
 * rechaza el puesto. Ninguna pantalla nueva: la decisión ya existía, sólo
 * le faltaba el dato.
 *
 * Tres cosas y no más. Contar maletas era una contabilidad de maletero que
 * nadie iba a llevar, y «pequeño o grande» es lo que de verdad cambia la
 * respuesta: un bolso va en el asiento y nunca estorba; una maleta va al
 * maletero y ahí sí puede no caber.
 *
 * **El precio no lo toca.** El aporte sale de la gasolina y los peajes
 * divididos entre los ocupantes (R1, R3); el equipaje no entra en el cálculo
 * ni puede cobrarse aparte. Este archivo no devuelve dinero, a propósito.
 */

/** Lo que el pasajero declara al pedir puesto. */
export type Equipaje = 'nada' | 'bolso' | 'maleta';

export const EQUIPAJES: Equipaje[] = ['nada', 'bolso', 'maleta'];

/** Cómo lo elige el pasajero, en primera persona (invariante 8 del v6). */
export const COMO_LO_DICE: Record<Equipaje, { titulo: string; detalle: string }> = {
  nada: { titulo: 'Nada', detalle: 'Voy sin equipaje' },
  bolso: { titulo: 'Un bolso', detalle: 'Va conmigo en el asiento' },
  maleta: { titulo: 'Una maleta', detalle: 'Va en el maletero' },
};

/** Cómo se lo lee el conductor en la solicitud, en tercera persona. */
export function comoLoVeElConductor(equipaje: Equipaje): string {
  return equipaje === 'nada'
    ? 'Sin equipaje'
    : equipaje === 'bolso'
      ? 'Un bolso, va con él en el asiento'
      : 'Una maleta grande, va al maletero';
}

/** La versión corta, para una fila estrecha. */
export function resumenCorto(equipaje: Equipaje): string {
  return equipaje === 'nada' ? 'sin equipaje' : equipaje === 'bolso' ? 'un bolso' : 'una maleta';
}

/**
 * Lo único que el conductor tiene que pensar antes de responder: si va al
 * maletero, puede no caber. Un bolso nunca es motivo de nada.
 */
export function decideElMaletero(equipaje: Equipaje): boolean {
  return equipaje === 'maleta';
}

/* ── El puente con la base ────────────────────────────────────────────────
 *
 * `bookings` guarda `mochilas` y `maletas` como enteros desde la migración
 * 0026. No hace falta tocarlos: las tres opciones caben de sobra en dos
 * columnas, y así el cambio no arrastra una migración detrás.
 */

export function aFilas(equipaje: Equipaje): { mochilas: number; maletas: number } {
  return equipaje === 'nada'
    ? { mochilas: 0, maletas: 0 }
    : equipaje === 'bolso'
      ? { mochilas: 1, maletas: 0 }
      : { mochilas: 0, maletas: 1 };
}

export function deFilas({ mochilas, maletas }: { mochilas: number; maletas: number }): Equipaje {
  if (maletas > 0) return 'maleta';
  if (mochilas > 0) return 'bolso';
  return 'nada';
}
