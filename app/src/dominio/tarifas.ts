/**
 * La tarifa de servicio de Partimos.
 *
 * Se suma encima del aporte: el conductor recibe siempre el aporte completo,
 * con cualquier método. Los nombres son los del enum `payment_channel` de la base.
 */

export type CanalDePago = 'yappy_app' | 'card' | 'external';

export const TARIFA_PCT: Record<CanalDePago, number> = {
  yappy_app: 5,
  card: 8,
  external: 0,
};

/** Cómo se llama cada canal en pantalla. */
export const NOMBRE_DEL_CANAL: Record<CanalDePago, string> = {
  yappy_app: 'Yappy',
  card: 'Tarjeta',
  external: 'Efectivo',
};

/** La tarifa se calcula sobre el aporte, nunca sobre el total. 6 $ → 0,30 $ por Yappy. */
export function tarifaDeServicio(aporteCentavos: number, canal: CanalDePago): number {
  return Math.round((aporteCentavos * TARIFA_PCT[canal]) / 100);
}

/** Lo que paga el pasajero: el aporte más la tarifa. */
export function totalQuePagaElPasajero(aporteCentavos: number, canal: CanalDePago): number {
  return aporteCentavos + tarifaDeServicio(aporteCentavos, canal);
}

/** El efectivo no se cobra en la app: se paga en la mano al subir. */
export function seCobraEnLaApp(canal: CanalDePago): boolean {
  return canal !== 'external';
}
