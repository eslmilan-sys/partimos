/**
 * El modelo de equipaje.
 *
 * ── Historia corta, porque ha cambiado dos veces y conviene saber por qué ──
 *
 * **Al principio** el conductor ponía un booleano al publicar («acepto
 * maletas») y el formulario del pasajero se adaptaba a él. Obligaba a decidir
 * en abstracto, meses antes de saber quién pide puesto y con qué.
 *
 * **El 25-08-2026** eso se retiró: el pasajero DICE lo que lleva y el conductor
 * lo ve en la solicitud, del mismo gesto con el que ya acepta o rechaza. Se
 * dejaron tres opciones sueltas —nada, un bolso, una maleta— con el argumento
 * de que contar era una contabilidad de maletero que nadie iba a llevar.
 *
 * **El 27-08-2026 el dueño lo corrigió**: hacen falta las cantidades (0, +1,
 * +2…) y una maleta pequeña, que no es lo mismo que una grande. Y tiene razón
 * en lo que el argumento anterior no vio: dos personas con una maleta cada una
 * llenan un baúl que una sola no llena, y «una maleta» no distinguía a quien
 * lleva un carry-on de quien lleva un baúl entero. Contar no es burocracia
 * cuando el número es el dato.
 *
 * Tres clases y un tope de tres piezas por clase. El tope no es decorativo:
 * por encima de eso ya no es equipaje de pasajero, es una mudanza, y eso se
 * habla por el chat antes de pedir puesto.
 *
 * **El precio no lo toca.** El aporte sale de la gasolina y los peajes
 * divididos entre los ocupantes (R1, R3); el equipaje no entra en el cálculo
 * ni puede cobrarse aparte. Este archivo no devuelve dinero, a propósito.
 */

/** Lo que el pasajero declara al pedir puesto: cuántas piezas de cada clase. */
export type Equipaje = {
  /** Va contigo en el asiento y nunca estorba. */
  bolsos: number;
  /** Cabe a tus pies o encima de otra: es la de cabina. */
  pequenas: number;
  /** Va al maletero, y ahí sí puede no caber. */
  grandes: number;
};

export type ClaseDeEquipaje = keyof Equipaje;

export const SIN_EQUIPAJE: Equipaje = { bolsos: 0, pequenas: 0, grandes: 0 };

/**
 * Tres piezas de una misma clase es el techo. Más que eso no cabe en el
 * hueco de nadie, y ofrecer un número que el conductor va a rechazar siempre
 * es hacerle perder el viaje a los dos.
 */
export const TOPE_POR_CLASE = 3;

/** Las tres clases, en el orden en que se leen: de lo que no estorba a lo que sí. */
export const CLASES: ClaseDeEquipaje[] = ['bolsos', 'pequenas', 'grandes'];

/** Cómo lo elige el pasajero, en primera persona (invariante 8 del v6). */
export const COMO_LO_DICE: Record<
  ClaseDeEquipaje,
  { titulo: string; detalle: string; uno: string; varios: string }
> = {
  bolsos: {
    titulo: 'Bolsos',
    detalle: 'Mochila o cartera. Va contigo en el asiento.',
    uno: 'un bolso',
    varios: 'bolsos',
  },
  pequenas: {
    titulo: 'Maletas pequeñas',
    detalle: 'De cabina. Cabe a tus pies o encima de otra.',
    uno: 'una maleta pequeña',
    varios: 'maletas pequeñas',
  },
  grandes: {
    titulo: 'Maletas grandes',
    detalle: 'Va al maletero, y ahí puede no caber.',
    uno: 'una maleta grande',
    varios: 'maletas grandes',
  },
};

/** Cuántas piezas en total. */
export function cuantasPiezas(equipaje: Equipaje): number {
  return CLASES.reduce((n, clase) => n + Math.max(0, equipaje[clase]), 0);
}

/** Sube o baja una clase sin salirse de 0…TOPE_POR_CLASE. */
export function cambiar(equipaje: Equipaje, clase: ClaseDeEquipaje, paso: number): Equipaje {
  const n = Math.min(TOPE_POR_CLASE, Math.max(0, equipaje[clase] + paso));
  return { ...equipaje, [clase]: n };
}

/**
 * Cómo se lo lee el conductor en la solicitud, en tercera persona y en
 * castellano de verdad: «Un bolso y dos maletas grandes», no «bolsos: 1».
 */
export function comoLoVeElConductor(equipaje: Equipaje): string {
  const trozos = enPalabras(equipaje);
  if (!trozos.length) return 'Sin equipaje';
  return mayuscula(unirCon(trozos, ' y '));
}

/** La versión corta, para una fila estrecha: sin mayúscula y con comas. */
export function resumenCorto(equipaje: Equipaje): string {
  const trozos = enPalabras(equipaje);
  return trozos.length ? unirCon(trozos, ' y ') : 'sin equipaje';
}

/**
 * Lo único que el conductor tiene que pensar antes de responder: si algo va
 * al maletero, puede no caber. Un bolso nunca es motivo de nada.
 *
 * **La pequeña cuenta.** Es de cabina en un avión, pero en un carro va al
 * baúl igual que la grande — sólo ocupa menos.
 */
export function decideElMaletero(equipaje: Equipaje): boolean {
  return equipaje.pequenas > 0 || equipaje.grandes > 0;
}

/* ── El puente con la base ────────────────────────────────────────────────
 *
 * `bookings` guardaba `mochilas` y `maletas` (enteros, migración 0026), que
 * ya eran cantidades: sólo estaban desaprovechados. `maletas_pequenas` nace
 * con la 0042 porque el tamaño no cabía en ninguna de las dos sin mentir.
 */

export function aFilas(equipaje: Equipaje): {
  mochilas: number;
  maletas: number;
  maletas_pequenas: number;
} {
  return {
    mochilas: acotar(equipaje.bolsos),
    maletas: acotar(equipaje.grandes),
    maletas_pequenas: acotar(equipaje.pequenas),
  };
}

export function deFilas(fila: {
  mochilas: number;
  maletas: number;
  maletas_pequenas?: number | null;
}): Equipaje {
  return {
    bolsos: acotar(fila.mochilas),
    pequenas: acotar(fila.maletas_pequenas ?? 0),
    grandes: acotar(fila.maletas),
  };
}

/* ------------------------------------------------------------------ */

const acotar = (n: number): number =>
  Number.isFinite(n) ? Math.min(TOPE_POR_CLASE, Math.max(0, Math.trunc(n))) : 0;

/** «un bolso», «dos maletas grandes»… Sólo las clases que llevan algo. */
function enPalabras(equipaje: Equipaje): string[] {
  return CLASES.filter((clase) => acotar(equipaje[clase]) > 0).map((clase) => {
    const n = acotar(equipaje[clase]);
    return n === 1 ? COMO_LO_DICE[clase].uno : `${CIFRA[n] ?? n} ${COMO_LO_DICE[clase].varios}`;
  });
}

/** Hasta tres, la cifra se escribe con letra: es como se habla. */
const CIFRA: Record<number, string> = { 2: 'dos', 3: 'tres' };

/** «a», «a y b», «a, b y c» — la coma sólo aparece cuando hay tres. */
function unirCon(trozos: string[], ultimo: string): string {
  if (trozos.length <= 1) return trozos[0] ?? '';
  return `${trozos.slice(0, -1).join(', ')}${ultimo}${trozos[trozos.length - 1]}`;
}

const mayuscula = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
