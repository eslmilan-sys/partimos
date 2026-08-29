/**
 * LA LICENCIA DE CONDUCIR QUE SE VENCE — la regla, sin base y sin pantalla.
 *
 * **LA FECHA NO SE TECLEA: LA VERIFICA DIDIT** (confirmado por el dueño el
 * 28-08-2026). Se había hecho como un campo `DD/MM/AAAA` en el perfil, y eso
 * no se sostiene en cuanto la fecha decide algo: una fecha que uno mismo se
 * pone no es una prueba — quien la tiene vencida escribe 2035 y publica
 * igual. Si va a cerrar la publicación, tiene que venir del documento.
 *
 * Así que la licencia es una verificación más, con su propia fila en
 * `identity_verifications` (`document_type = 'DL'`, que `didit-start` ya
 * sabe pedir) y su `expires_at`. Dos documentos, dos vidas: tener la cédula
 * al día no dice nada de la licencia.
 *
 * Sigue sin guardarse ni la foto ni el número (R6). Lo que se añade es UNA
 * FECHA, que no identifica a nadie y sin la cual esto no puede existir.
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
  /**
   * Cuándo se vence, en 'AAAA-MM-DD'. Nula si todavía no la ha verificado.
   * Sale de `identity_verifications.expires_at` de la fila `DL`.
   */
  vence: string | null;
};

/**
 * De una verificación de Didit a la licencia que este módulo entiende.
 *
 * Verificada y con fecha, la fecha manda. **Sin verificar no hay licencia**,
 * aunque exista una fila: una sesión abandonada o rechazada no prueba nada, y
 * tomar su `expires_at` sería creerle a un documento que nadie miró.
 */
export function deLaVerificacion(
  v: { status: string; expires_at?: string | null } | undefined,
): Licencia {
  if (!v || v.status !== 'verified') return { vence: null };
  return { vence: v.expires_at ? v.expires_at.slice(0, 10) : null };
}

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
 * Sólo lo VENCIDO bloquea. Sin fecha se deja publicar **a propósito y por
 * ahora**: mientras el flujo de licencia de Didit no esté contratado, nadie
 * puede verificarla, y bloquear por algo que no se puede hacer sería cerrar
 * la puerta y tirar la llave. El día que el flujo exista, esto se vuelve
 * `estado === 'al-dia' || estado === 'por-vencer'` y se cambia aquí, en una
 * línea, con su prueba.
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
 * `DD/MM/AAAA`, para ENSEÑARLA. Ya no para escribirla: la fecha viene de
 * Didit, y el campo donde se tecleaba se retiró el 28-08-2026.
 */
export function aTexto(vence: string | null): string {
  if (!vence) return '';
  const [a, m, d] = vence.split('-');
  return `${d}/${m}/${a}`;
}
