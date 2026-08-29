/**
 * LA NOTA DE UNA PERSONA — la fórmula, sin base y sin pantalla.
 *
 * Hasta hoy no había fórmula: la vista `driver_ratings` (0007) hacía
 * `AVG(rating)` de todo lo que hubiera, y la app enseñaba ese número tal
 * cual. Un promedio de por vida sin mínimo tiene cuatro defectos, y en un
 * mercado pequeño —donde alguien lleva tres viajes, no trescientos— los
 * cuatro se notan enseguida:
 *
 * 1. **Una nota mala arruina a quien empieza.** Con dos reseñas, un 1 te
 *    lleva de 5,0 a 3,0. Con cuarenta es ruido. El mismo comportamiento con
 *    consecuencias opuestas según cuánto lleves, que es lo contrario de una
 *    nota justa.
 * 2. **Un 5,0 de una sola reseña se lee igual que un 5,0 de cuarenta.** El
 *    número miente por omisión.
 * 3. **No olvida nunca.** Quien lo hizo mal hace dos años y bien desde
 *    entonces sigue cargándolo.
 * 4. Todo el mundo acaba entre 4,8 y 5,0, y el número deja de distinguir.
 *
 * ── Lo que hacemos ──────────────────────────────────────────────────────
 *
 * **Un promedio encogido hacia la media de la plataforma** (el «promedio
 * bayesiano», el mismo truco de IMDb):
 *
 *     nota = (PESO_DEL_PRIOR × MEDIA_DE_LA_PLATAFORMA + Σ notas) / (PESO + n)
 *
 * Es decir: se empieza con cinco reseñas imaginarias en la media, y las de
 * verdad las van desplazando. Quien lleva tres viajes se mueve poco —lo
 * justo, porque de tres viajes se sabe poco—; quien lleva cuarenta manda
 * sobre su número casi por completo. Arregla 1 y 2.
 *
 * **Y una ventana**: sólo cuentan las últimas `CUANTAS_CUENTAN`. Arregla 3
 * sin inventar decaimientos que nadie sabría explicar — «las últimas
 * cincuenta» se dice en una frase, «medio peso a los seis meses» no.
 *
 * **Debajo de `MINIMO_PARA_ENSEÑAR` no se enseña ningún número.** No es un
 * detalle de dibujo: es el invariante 7 del sistema —una afirmación lleva su
 * razón— llevado hasta el final. «4,9» de una reseña no es una afirmación
 * con razón, es una cifra sin sujeto. Se dice lo que sí se sabe: cuántos
 * viajes lleva.
 *
 * ── Lo que NO hacemos, y por qué ────────────────────────────────────────
 *
 * · **No hay eje de precio.** El tope es la regla de la plataforma, no un
 *   mérito de quien maneja; puntuarlo devolvería la presión tarifaria por
 *   la puerta de atrás (R3). Ya estaba decidido en la 0007 y sigue.
 * · **La nota no ordena los resultados ni cambia el aporte.** Aquí nadie
 *   gana dinero (R1), así que la nota no puede ser una palanca de ingreso:
 *   es una señal de confianza y nada más.
 * · **La misma fórmula para quien maneja y para quien viaja.** En Partimos
 *   no hay un proveedor y un cliente —hay dos personas repartiendo un
 *   costo—, así que medir a una con más severidad que a la otra no tendría
 *   con qué justificarse. Lo que cambia son los EJES, no la fórmula.
 *
 * Puro, sin IO: las reseñas llegan en argumentos.
 */

/** Lo que hace falta de una reseña para calcular. Subconjunto de `Review`. */
export type ResenaContable = {
  rating: number;
  created_at: string;
};

/**
 * LA MEDIA DE LA PLATAFORMA, hacia la que se encoge todo.
 *
 * **No es 5.** Con un prior en 5 todo el mundo nace perfecto y sólo puede
 * bajar, que es exactamente el número halagador e inútil que se quería
 * evitar. 4,6 es una media realista de un servicio entre conocidos.
 *
 * Es una constante MIENTRAS NO HAYA DATOS. Cuando haya unas cientas de
 * reseñas se mide de verdad y se pone aquí — no se calcula al vuelo, porque
 * un prior que se mueve solo hace que la nota de alguien cambie sin que esa
 * persona haya hecho nada.
 */
export const MEDIA_DE_LA_PLATAFORMA = 4.6;

/**
 * Cuánto pesa esa media, en reseñas imaginarias.
 *
 * Cinco es el punto donde una reseña de verdad ya se nota pero no manda:
 * con una sola reseña de 1, la nota cae de 4,6 a 4,0 — se ve, y no destroza.
 */
export const PESO_DEL_PRIOR = 5;

/** Debajo de esto no se enseña número: se dice cuántos viajes lleva. */
export const MINIMO_PARA_ENSENAR = 3;

/** Sólo cuentan las últimas: es lo que deja que alguien se recupere. */
export const CUANTAS_CUENTAN = 50;

export type Nota = {
  /** La nota, o `null` si todavía no hay con qué decirla. */
  valor: number | null;
  /**
   * Cuántas RESEÑAS la sostienen — la razón que acompaña a la cifra.
   *
   * No son «viajes»: alguien puede llevar treinta y cuatro viajes y tres
   * opiniones, porque calificar no es obligatorio. Escribir «34 viajes» al
   * lado de la nota daría a entender que sale de treinta y cuatro juicios, y
   * saldría de tres. La palabra importa.
   */
  cuantas: number;
  /**
   * Lo que se escribe al lado, ya en palabras. Nunca una cifra sola: el
   * invariante 7 pide que la afirmación lleve su razón, y aquí la razón es
   * de cuántas opiniones sale.
   */
  comoSeLee: string;
};

/**
 * LA NOTA DE ALGUIEN, a partir de sus reseñas.
 *
 * Da igual el orden en que lleguen: se ordenan aquí y se toman las últimas.
 */
export function notaDe(resenas: ResenaContable[]): Nota {
  const cuentan = lasQueCuentan(resenas);
  const cuantas = cuentan.length;

  if (cuantas < MINIMO_PARA_ENSENAR) {
    return {
      valor: null,
      cuantas,
      comoSeLee: cuantas === 0 ? 'Todavía sin nota' : `Todavía sin nota · ${enOpiniones(cuantas)}`,
    };
  }

  const suma = cuentan.reduce((t, r) => t + r.rating, 0);
  const encogida =
    (PESO_DEL_PRIOR * MEDIA_DE_LA_PLATAFORMA + suma) / (PESO_DEL_PRIOR + cuantas);
  const valor = Math.round(encogida * 10) / 10;

  return { valor, cuantas, comoSeLee: `${enTexto(valor)} · ${enOpiniones(cuantas)}` };
}

/**
 * La media CRUDA, sin encoger, para cuando hay que enseñar la cuenta.
 *
 * No es la nota: es lo que la gente dijo. Sirve para explicar por qué la
 * nota es la que es —«te pusieron 4,8; tu nota es 4,7 porque llevas cuatro
 * viajes»— y para nada más. Nunca se enseña en lugar de `notaDe`.
 */
export function mediaCruda(resenas: ResenaContable[]): number | null {
  const cuentan = lasQueCuentan(resenas);
  if (cuentan.length === 0) return null;
  const suma = cuentan.reduce((t, r) => t + r.rating, 0);
  return Math.round((suma / cuentan.length) * 10) / 10;
}

/**
 * ¿CUÁNTAS LE FALTAN PARA TENER NOTA? Cero si ya la tiene.
 *
 * Es lo que se le dice a quien empieza en lugar de dejarle un guion: «dos
 * viajes más y tienes nota» es una frase que se puede actuar.
 */
export function cuantasFaltan(resenas: ResenaContable[]): number {
  return Math.max(0, MINIMO_PARA_ENSENAR - lasQueCuentan(resenas).length);
}

/* ------------------------------------------------------------------ */

/** Las últimas `CUANTAS_CUENTAN`, de la más nueva a la más vieja. */
function lasQueCuentan(resenas: ResenaContable[]): ResenaContable[] {
  return resenas
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, CUANTAS_CUENTAN);
}

/** «4,9» — coma decimal, como se escribe en español. */
export function enTexto(valor: number): string {
  return valor.toFixed(1).replace('.', ',');
}

const enOpiniones = (n: number) => (n === 1 ? '1 opinión' : `${n} opiniones`);
