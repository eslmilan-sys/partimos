/**
 * LA LICENCIA DE CONDUCIR QUE SE VENCE — la regla, sin base y sin pantalla.
 *
 * En Panamá la licencia se renueva cada pocos años y **se vence sin avisar**:
 * no llega ninguna carta. Quien maneja con la licencia vencida no está
 * cubierto por su seguro, y llevar a alguien en esas condiciones es
 * exactamente lo que este producto no puede permitirse — no por la multa,
 * sino porque el pasajero no tendría a quién reclamar.
 *
 * ── Lo que hacemos, y lo que NO ─────────────────────────────────────────
 *
 * **No guardamos la licencia.** Ni foto, ni número: sólo la FECHA en que se
 * vence. Es la misma regla que la cédula (R6) por la misma razón — de un
 * documento sólo hace falta el veredicto, y una fecha no identifica a nadie.
 *
 * **Se avisa antes, no después.** Treinta días es el plazo en el que todavía
 * se puede pedir cita y renovar sin perder viajes. Avisar el día que vence
 * es avisar tarde.
 *
 * **Vencida, no se publica.** No se cancela lo ya publicado —los pasajeros
 * que ya tienen puesto no pagan el papeleo de nadie— pero no se abren viajes
 * nuevos hasta que la fecha esté al día.
 *
 * **Sin fecha no se bloquea nada.** Todo el mundo que publicó antes de que
 * esto existiera la tiene nula, y tratarlos como vencidos sería inventarles
 * un problema. Se les pide, y hasta entonces se les deja en paz.
 *
 * Puro, sin IO: la fecha llega en argumento.
 */

/** Cuánto antes se empieza a avisar. */
export const DIAS_PARA_AVISAR = 30;

const DIA_MS = 24 * 3600_000;

export type EstadoDeLicencia =
  /** Nunca la dijo. No se bloquea; se pregunta. */
  | 'sin-decir'
  /** Al día, y con tiempo de sobra. */
  | 'al-dia'
  /** Se vence dentro de `DIAS_PARA_AVISAR`. Todavía se puede renovar. */
  | 'por-vencer'
  /** Ya pasó la fecha. */
  | 'vencida';

export type Licencia = {
  /** Cuándo se vence, en 'AAAA-MM-DD'. Nula si nunca la dijo. */
  vence: string | null;
};

/** Cuántos días faltan; negativo si ya pasó. Nulo sin fecha. */
export function diasQueFaltan(l: Licencia, ahora: Date = new Date()): number | null {
  if (!l.vence) return null;
  /* A mediodía UTC para que un huso horario no mueva el resultado un día
     entero: lo que se compara son fechas, no instantes. */
  const vence = new Date(`${l.vence}T12:00:00Z`).getTime();
  const hoy = new Date(`${aDia(ahora)}T12:00:00Z`).getTime();
  return Math.round((vence - hoy) / DIA_MS);
}

export function estadoDeLicencia(l: Licencia, ahora: Date = new Date()): EstadoDeLicencia {
  const faltan = diasQueFaltan(l, ahora);
  if (faltan == null) return 'sin-decir';
  if (faltan < 0) return 'vencida';
  return faltan <= DIAS_PARA_AVISAR ? 'por-vencer' : 'al-dia';
}

/**
 * ¿PUEDE PUBLICAR UN VIAJE?
 *
 * Sólo lo VENCIDO bloquea. Sin fecha se deja publicar a propósito: nadie
 * pierde el acceso por una columna que no existía cuando se hizo su cuenta.
 */
export function puedePublicar(l: Licencia, ahora: Date = new Date()): boolean {
  return estadoDeLicencia(l, ahora) !== 'vencida';
}

/**
 * Lo que se le dice, ya escrito. Nulo cuando no hay nada que decir — que es
 * la mayoría de los días, y por eso no se enseña una fila «todo bien».
 */
export function comoSeDice(l: Licencia, ahora: Date = new Date()): string | null {
  const estado = estadoDeLicencia(l, ahora);
  if (estado === 'al-dia') return null;
  if (estado === 'sin-decir') return 'Dinos cuándo se vence tu licencia';
  if (estado === 'vencida') return 'Tu licencia está vencida. Renuévala para volver a publicar.';

  const faltan = diasQueFaltan(l, ahora)!;
  if (faltan === 0) return 'Tu licencia se vence hoy';
  if (faltan === 1) return 'Tu licencia se vence mañana';
  return `Tu licencia se vence en ${faltan} días`;
}

/* ------------------------------------------------------------------ */

/** El día de una fecha, en 'AAAA-MM-DD' y en la hora de Panamá. */
const aDia = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Panama' }).format(d);

/* ── Escribirla y leerla ─────────────────────────────────────────────── */

/**
 * DE LO QUE SE TECLEA A LA FECHA DE LA BASE.
 *
 * Se pide en `DD/MM/AAAA` porque es como está impreso en la licencia
 * panameña — copiarla no debería obligar a nadie a reordenar nada. La base
 * la guarda en `AAAA-MM-DD`, que es lo que `date` entiende.
 *
 * Nulo cuando todavía no es una fecha: mientras se teclea, la mitad de las
 * pulsaciones dan algo incompleto, y eso no es un error que enseñar.
 */
export function deTexto(escrito: string): string | null {
  const d = escrito.replace(/\D/g, '');
  if (d.length !== 8) return null;
  const dia = Number(d.slice(0, 2));
  const mes = Number(d.slice(2, 4));
  const anio = Number(d.slice(4, 8));
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const iso = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  /* Un 31 de febrero pasa las comprobaciones de arriba y no existe: se
     construye la fecha y se comprueba que sea la que se pidió. */
  const fecha = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(fecha.getTime()) || fecha.getUTCDate() !== dia) return null;
  return iso;
}

/** De la fecha de la base a lo que se enseña en el campo. */
export function aTexto(vence: string | null): string {
  if (!vence) return '';
  const [a, m, d] = vence.split('-');
  return `${d}/${m}/${a}`;
}
