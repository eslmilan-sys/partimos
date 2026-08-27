/**
 * DÓNDE VAS SENTADO, y quién puede pedir el puesto.
 *
 * ── Adelante y atrás ─────────────────────────────────────────────────────
 *
 * `seats_offered` decía cuántos puestos hay y no dónde, y el sitio importa:
 * tres atrás van apretados, dos van cómodos, y el de adelante es otro viaje.
 * BlaBlaCar lo resuelve con una casilla suelta —«máx. 2 personas atrás»—;
 * aquí es más simple decir cuántos van en cada fila, y entonces «máx. 2
 * atrás» no es una casilla más: es haber puesto 2 atrás. Una cosa dicha una
 * vez, en vez de dos que pueden contradecirse.
 *
 * Pedido del dueño el 27-08-2026, con capturas de BlaBlaCar.
 *
 * ── «Solo mujeres» ───────────────────────────────────────────────────────
 *
 * Sólo tiene sentido si quien maneja es mujer. Un carro conducido por un
 * hombre que anuncia «solo mujeres» no cumple lo que la etiqueta promete —
 * promete un carro donde todas las personas a bordo son mujeres— y quien la
 * usa la usa justamente porque cuenta con eso. Ofrecerla a todo el mundo
 * era una promesa que el producto no podía sostener.
 *
 * Puro, sin IO.
 */

/** Como mucho uno adelante: el otro asiento delantero es el del volante. */
export const MAXIMO_ADELANTE = 1;
/** Tres atrás es el banco lleno. */
export const MAXIMO_ATRAS = 3;

export type Reparto = { adelante: number; atras: number };

/**
 * El reparto por defecto para un carro de N puestos totales.
 *
 * Menos el del conductor, y con el de adelante ocupado antes que el tercero
 * de atrás: en un sedán de cinco, tres puestos son uno adelante y dos atrás,
 * que es como viaja la gente cuando puede elegir.
 */
export function repartoPorDefecto(puestosDelCarro: number): Reparto {
  const ofrecibles = Math.max(0, Math.min(4, puestosDelCarro - 1));
  const adelante = Math.min(MAXIMO_ADELANTE, ofrecibles);
  return { adelante, atras: Math.min(MAXIMO_ATRAS, ofrecibles - adelante) };
}

/**
 * Un total suelto repartido en filas — para lo que llega sin decir dónde:
 * una plantilla de «publicar de nuevo», o un viaje de antes de la 0045.
 * Adelante primero, que es como se llena un carro.
 */
export function repartoDeUnTotal(total: number): Reparto {
  const n = acotar(total, MAXIMO_ADELANTE + MAXIMO_ATRAS);
  const adelante = Math.min(MAXIMO_ADELANTE, n);
  return { adelante, atras: n - adelante };
}

export function cuantosPuestos(r: Reparto): number {
  return acotar(r.adelante, MAXIMO_ADELANTE) + acotar(r.atras, MAXIMO_ATRAS);
}

/** Cambia una fila sin salirse de su máximo. */
export function cambiarReparto(r: Reparto, fila: keyof Reparto, paso: number): Reparto {
  const tope = fila === 'adelante' ? MAXIMO_ADELANTE : MAXIMO_ATRAS;
  return { ...r, [fila]: acotar(r[fila] + paso, tope) };
}

/**
 * Lo que el viaje puede prometer por cómo van sentados.
 *
 * Con dos atrás el asiento del medio queda libre, y eso es una comodidad de
 * verdad en tres horas de carretera: se dice. Con tres atrás no se dice
 * nada — no hay nada que prometer, y callarlo es más honesto que darle la
 * vuelta a la frase.
 */
export function comodidadDeAtras(r: Reparto): string | null {
  if (r.atras === 2) return 'Máx. 2 personas atrás';
  if (r.atras === 1) return 'Solo 1 persona atrás';
  return null;
}

/** Cómo se lee el reparto: «1 adelante · 2 atrás». */
export function comoSeLee(r: Reparto): string {
  const trozos: string[] = [];
  if (r.adelante > 0) trozos.push(`${r.adelante} adelante`);
  if (r.atras > 0) trozos.push(`${r.atras} atrás`);
  return trozos.join(' · ') || 'ningún puesto';
}

/**
 * De la fila de la base al reparto. Un viaje publicado antes de la 0045 no
 * dice cómo se repartía, y **no se inventa**: se pone todo atrás, que es lo
 * que la app enseñaba antes, y la pantalla no promete comodidad ninguna.
 */
export function deFilas(fila: {
  seats_offered: number;
  seats_front?: number | null;
  seats_back?: number | null;
}): Reparto {
  if (fila.seats_front == null || fila.seats_back == null) {
    return { adelante: 0, atras: Math.min(MAXIMO_ATRAS, fila.seats_offered) };
  }
  return {
    adelante: acotar(fila.seats_front, MAXIMO_ADELANTE),
    atras: acotar(fila.seats_back, MAXIMO_ATRAS),
  };
}

/* ── Solo mujeres ─────────────────────────────────────────────────────── */

/**
 * ¿Se le puede ofrecer «solo mujeres» a quien maneja?
 *
 * `gender` es texto libre en la base y puede faltar. Sin saberlo, NO se
 * ofrece: la etiqueta promete algo concreto a quien la busca, y una promesa
 * que no podemos sostener es peor que una opción que no está.
 */
export function puedeOfrecerSoloMujeres(genero: string | null | undefined): boolean {
  const g = (genero ?? '').trim().toLowerCase();
  return g === 'f' || g === 'female' || g === 'mujer' || g === 'femenino';
}

/* ------------------------------------------------------------------ */

const acotar = (n: number, tope: number): number =>
  Number.isFinite(n) ? Math.min(tope, Math.max(0, Math.trunc(n))) : 0;
