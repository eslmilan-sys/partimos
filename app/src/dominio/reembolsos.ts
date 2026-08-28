/**
 * Las cuatro reglas de reembolso — pantallas `7d` (el motivo) y `14a` (cancelar).
 *
 * La regla de fondo: la tarifa se retiene solo cuando la cancelación es tuya.
 * Si falla el otro — canceló, no llegó, el viaje no pasó — vuelve todo, tarifa incluida.
 */

export type MotivoDeReembolso = 'yo' | 'conductor' | 'novino' | 'nopaso';

/** Por debajo de estas horas antes de la salida, el conductor se queda 1 $. */
export const HORAS_PARA_CANCELAR_ENTERO = 2;

/** Lo que se queda el conductor por el puesto que ya no puede vender. */
export const RETENCION_TARDIA_CENTAVOS = 100;

/** A las 2 h de la hora de salida, si nadie marcó la salida, el aporte vuelve solo. */
export const HORAS_PARA_DEVOLUCION_AUTOMATICA = 2;

export type EntradaDeReembolso = {
  motivo: MotivoDeReembolso;
  aporteCentavos: number;
  tarifaCentavos: number;
  /** Horas que faltan para la salida. Solo cuenta cuando cancela el pasajero. */
  horasAntesDeLaSalida: number;
  /** Para el texto de la regla. */
  nombreDelConductor?: string;
};

export type Reembolso = {
  titulo: string;
  texto: string;
  /** Lo que le vuelve al pasajero. */
  montoCentavos: number;
  /** Lo que no vuelve. */
  retenidoCentavos: number;
  /** La parte de lo retenido que se queda el conductor. */
  paraElConductorCentavos: number;
  plazo: string;
};

export function calcularReembolso({
  motivo,
  aporteCentavos,
  tarifaCentavos,
  horasAntesDeLaSalida,
  nombreDelConductor = 'El conductor',
}: EntradaDeReembolso): Reembolso {
  const todo = aporteCentavos + tarifaCentavos;

  switch (motivo) {
    case 'yo': {
      const aTiempo = horasAntesDeLaSalida >= HORAS_PARA_CANCELAR_ENTERO;
      // A tiempo vuelve **todo, tarifa incluida**: no retenemos nada por algo
      // que todavía no nos ha costado nada. Tarde vuelve el aporte menos 1 $,
      // que se queda el conductor por el puesto que ya no vende, y la tarifa
      // tampoco vuelve porque el cobro ya se hizo.
      return {
        titulo: 'Completo si faltan más de 2 h',
        texto: aTiempo
          ? `Faltan ${textoDeHoras(horasAntesDeLaSalida)}, así que vuelve entero. A menos de 2 h se devuelve menos 1 $, que se queda el conductor.`
          : `Faltan menos de 2 h, así que se devuelve menos 1 $, que se queda el conductor por el puesto que ya no vende.`,
        montoCentavos: aTiempo ? todo : aporteCentavos - RETENCION_TARDIA_CENTAVOS,
        retenidoCentavos: aTiempo ? 0 : tarifaCentavos + RETENCION_TARDIA_CENTAVOS,
        paraElConductorCentavos: aTiempo ? 0 : RETENCION_TARDIA_CENTAVOS,
        plazo: '3 a 5 días hábiles',
      };
    }

    case 'conductor':
      return {
        titulo: 'Completo, y te buscamos puesto',
        texto: 'Vuelve todo, tarifa incluida. Si hay otro carro a tu hora te lo proponemos antes.',
        montoCentavos: todo,
        retenidoCentavos: 0,
        paraElConductorCentavos: 0,
        plazo: '3 a 5 días hábiles',
      };

    case 'novino':
      return {
        titulo: 'Completo, tras revisar el código',
        texto: `El código de abordaje nunca se marcó. Lo revisamos y ${nombreDelConductor.toLowerCase() === 'el conductor' ? 'el conductor' : nombreDelConductor} no recibe el aporte.`,
        montoCentavos: todo,
        retenidoCentavos: 0,
        paraElConductorCentavos: 0,
        plazo: 'En 24 h',
      };

    case 'nopaso':
      return {
        titulo: 'Automático a las 2 h de la salida',
        texto: 'Si nadie marca la salida, el aporte vuelve solo. No hace falta que hagas nada.',
        montoCentavos: todo,
        retenidoCentavos: 0,
        paraElConductorCentavos: 0,
        plazo: 'Automático',
      };
  }
}

function textoDeHoras(horas: number): string {
  const enteras = Math.floor(horas);
  if (enteras >= 24) {
    const dias = Math.floor(enteras / 24);
    return dias === 1 ? '1 día' : `${dias} días`;
  }
  return enteras === 1 ? '1 h' : `${enteras} h`;
}

/* ── ¿Se puede todavía cancelar? (27-08-2026) ────────────────────────── */

/** Lo que hay que saber de la reserva para decidirlo. */
export type PuestoCancelable = {
  status: string;
  /** Cuándo se marcó el código de abordaje, si se marcó. */
  boarded_at?: string | null;
  /** La salida del viaje. */
  salida: string;
};

/**
 * CANCELAR SE OFRECE MIENTRAS SIRVA DE ALGO, Y NO DESPUÉS.
 *
 * Tres condiciones, y las tres son la misma idea dicha de tres maneras: que
 * el puesto todavía exista y el viaje todavía no haya pasado.
 *
 * 1. El puesto está vivo — `pending` o `confirmed`. Un puesto ya cumplido o
 *    ya cancelado no se cancela otra vez.
 * 2. **No te has montado.** Marcado el código de abordaje, el viaje ocurrió:
 *    lo que queda no es cancelar, es reclamar.
 * 3. No ha salido. Pasada la hora sin haber subido, el aporte vuelve solo a
 *    las 2 h (`HORAS_PARA_DEVOLUCION_AUTOMATICA`) y ofrecer un botón sería
 *    hacer trabajar a alguien por algo que ya está en marcha.
 *
 * Fuera de esos casos el botón **no se enseña apagado, no se enseña**: un
 * botón que no hace nada es peor que ninguno.
 */
export function sePuedeCancelar(puesto: PuestoCancelable, ahora: Date = new Date()): boolean {
  if (puesto.status !== 'pending' && puesto.status !== 'confirmed') return false;
  if (puesto.boarded_at) return false;
  return new Date(puesto.salida).getTime() > ahora.getTime();
}
