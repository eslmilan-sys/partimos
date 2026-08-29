/**
 * ¿ESTÁ VERIFICADA ESTA CÉDULA? — la regla, sin base y sin pantalla.
 *
 * `identity_verifications` no impide dos filas por persona, y en la base real
 * las hay: cada intento de Didit escribe la suya. Mirando el 28-08-2026, una
 * cuenta tiene CUATRO filas — dos `verified` y dos `expired`.
 *
 * ── El error que esto corrige ────────────────────────────────────────────
 *
 * `servicios/seguridad.ts` se quedaba con **la de `updated_at` más reciente**.
 * Parecía lo prudente, y con estas filas da lo contrario de la verdad:
 *
 *     expired   creada 16-08   tocada 23-08   ← la que ganaba
 *     expired   creada 15-08   tocada 22-08
 *     verified  creada 17-08   tocada 17-08   ← la que dice la verdad
 *     verified  creada 17-08   tocada 17-08
 *
 * La persona se verificó el 17. Los días 22 y 23, un barrido marcó
 * `expired` dos SESIONES ABANDONADAS del 15 y el 16 — anteriores a que se
 * verificara. Al ordenar por `updated_at`, ese barrido ganaba, la app decía
 * «Pendiente» y le ofrecía «Verificar mi cédula» a alguien ya verificado.
 * Didit, preguntado en el mismo momento, respondía `already_verified`.
 *
 * ── La regla ─────────────────────────────────────────────────────────────
 *
 * `status = 'expired'` es de la SESIÓN, no del documento: quiere decir «este
 * intento no se terminó», no «tu cédula caducó». Lo que caduca de verdad
 * tiene su propia columna, `expires_at`.
 *
 * Así que: **una verificación conseguida y no caducada por FECHA manda sobre
 * cualquier intento posterior que no llegó a nada.** Sin ninguna verificada
 * en pie, se mira la más reciente, que es donde el orden por fecha sí dice
 * algo — si te rechazaron ayer, estás rechazado.
 *
 * Puro, sin IO: las filas llegan en argumentos.
 */

/** Lo que hace falta de una fila para decidir. Subconjunto de la tabla. */
export type Verificacion = {
  status: string;
  /**
   * QUÉ DOCUMENTO ES. `ID` la cédula, `DL` la licencia de conducir — los
   * nombres que usa Didit y que `identity_verifications.document_type` ya
   * guarda. Dos documentos, dos verificaciones, dos vidas separadas: tener la
   * cédula al día no dice nada de la licencia.
   */
  document_type?: string | null;
  /** Cuándo deja de valer el documento. Nulo = no caduca. */
  expires_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type EstadoDeVerificacion = 'pendiente' | 'en revisión' | 'verificada' | 'rechazada';

/** Cómo se lee cada `status` de la tabla. */
const COMO_SE_LEE: Record<string, EstadoDeVerificacion> = {
  pending: 'en revisión',
  verified: 'verificada',
  rejected: 'rechazada',
  /* Una sesión abandonada no es un veredicto: no hay nada que contar todavía. */
  expired: 'pendiente',
};

/** ¿Esta fila dice que la persona está verificada AHORA? */
export function vale(v: Verificacion, ahora: Date): boolean {
  if (v.status !== 'verified') return false;
  return v.expires_at == null || new Date(v.expires_at) > ahora;
}

/**
 * LA FILA QUE MANDA. Una verificada y en pie gana; si no hay ninguna, la más
 * reciente.
 */
export function laQueVale<T extends Verificacion>(
  filas: T[],
  ahora: Date = new Date(),
): T | undefined {
  const porFecha = filas.slice().sort((a, b) => cuando(b).localeCompare(cuando(a)));
  return porFecha.find((v) => vale(v, ahora)) ?? porFecha[0];
}

/** El estado que la pantalla enseña, de todas las filas de una persona. */
export function estadoDe(filas: Verificacion[], ahora: Date = new Date()): EstadoDeVerificacion {
  const v = laQueVale(filas, ahora);
  if (!v) return 'pendiente';
  /* Verificada pero pasada de fecha: vuelve a estar pendiente, diga lo que
     diga su `status`. La columna existía y nadie la miraba. */
  if (v.status === 'verified' && !vale(v, ahora)) return 'pendiente';
  return COMO_SE_LEE[v.status] ?? 'pendiente';
}

/* ------------------------------------------------------------------ */

const cuando = (v: Verificacion) => v.updated_at ?? v.created_at ?? '';

/**
 * SÓLO LAS DE UN DOCUMENTO.
 *
 * Sin este filtro, la licencia verificada haría pasar por buena una cédula
 * rechazada y al revés — es exactamente el fallo que `didit-start` ya
 * corrigió de su lado («respondía already_verified para un documento jamás
 * presentado»), y que aquí faltaba.
 */
export function soloDe<T extends Verificacion>(filas: T[], documento: string): T[] {
  return filas.filter((v) => (v.document_type ?? 'ID') === documento);
}
