/**
 * LO QUE CUESTA IR A BUSCARTE — el desvío de un punto de recogida.
 *
 * Pedido del dueño el 01-09-2026: *«j'arrive sur la page et j'ai l'option de
 * mettre mon point où je veux qu'il me cherche. Ça doit être une option. De
 * base je dois aller au point d'où il part. Puis en bas option. Avec calcul en
 * fonction de la distance depuis le point de départ.»*
 *
 * Antes la pantalla de reservar abría con un campo de búsqueda ya relleno
 * —«Vía Argentina, Riba Smith», escrito a mano en el código— y una línea de
 * raíl que decía «Tu punto · +4 min», también a mano. Dos datos inventados en
 * la pantalla donde se acuerda dónde te vas a plantar a las cinco de la
 * mañana. **Lo normal es ir al punto del que sale el carro**; pedir otro es
 * una opción, y una opción tiene un costo que hay que poder decir.
 *
 * ── Cómo se mide, y por qué así ──────────────────────────────────────────
 *
 * Con `cuantoAlarga(salida, tuPunto, destino)`, que ya existe y ya está
 * probado: cuánto crece el camino por pasar por un sitio. Es la medida
 * correcta porque un punto que queda **en la dirección del viaje** casi no
 * alarga nada —recoger en Vía Argentina yendo a Chitré son dos kilómetros—
 * mientras que uno que queda al otro lado dispara la cuenta.
 *
 * (El primer intento contaba ida y vuelta al punto, sin mirar a dónde se va:
 * un punto a tres kilómetros salía como dieciséis minutos de desvío y se
 * rechazaba, cuando es exactamente la recogida más normal que hay.)
 *
 * ── Y lo que NO es ───────────────────────────────────────────────────────
 *
 * **Esto no es un recargo por recogida a domicilio.** `PRODUCT.md` es
 * explícito: un servicio de ramassage tarifado es transporte comercial. Lo que
 * pasa aquí es que el viaje **se alarga**, así que cuesta más gasolina, y esa
 * gasolina la pone quien pidió el desvío — con la misma fórmula de siempre y
 * ni un centavo más. La pantalla dice «tu punto añade 6,4 km», nunca «recogida
 * a domicilio: +2 $». Mismo dinero, naturaleza jurídica opuesta.
 *
 * El tope del 15 % es el garde-fou de `PRODUCT.md`: más allá, quien maneja
 * deja de ir a un sitio llevando gente de camino.
 */

import { tasaPorKm } from './aporte.ts';
import { cuantoAlarga } from './enElCamino.ts';

/** Velocidad media de puerta a puerta, para pasar kilómetros a minutos. */
export const KMH_DE_VIAJE = 45;

/** El garde-fou de `PRODUCT.md`: más de esto ya no es «de camino». */
export const MAXIMO_ALARGUE = 0.15;

export type Desvio = {
  /** Kilómetros que se le añaden al viaje por pasar por tu punto. */
  km: number;
  /** Lo que esos kilómetros tardan. */
  minutos: number;
  /** La gasolina de esos kilómetros. La pone quien pidió el desvío. */
  costoCentavos: number;
  /** Cuánto crece el camino, en tanto por uno. Es lo que juzga el tope. */
  alargue: number;
  /** Falso por encima del tope: entonces no es un desvío, es otro viaje. */
  cabe: boolean;
};

export function desvioDeRecogida(
  salidaDelCarro: { lat: number; lng: number },
  tuPunto: { lat: number; lng: number },
  destino: { lat: number; lng: number },
  distanciaDelViajeKm: number,
  consumoL100km: number,
): Desvio {
  const alargue = Math.max(0, cuantoAlarga(salidaDelCarro, tuPunto, destino));
  const km = Math.round(alargue * distanciaDelViajeKm * 10) / 10;
  return {
    km,
    minutos: Math.round((km / KMH_DE_VIAJE) * 60),
    costoCentavos: Math.round(km * tasaPorKm(consumoL100km)),
    alargue,
    cabe: alargue <= MAXIMO_ALARGUE,
  };
}

/** «6,4 km» — un decimal, con coma, como el resto del producto. */
export function enKilometros(km: number): string {
  return `${km.toFixed(1).replace('.', ',')} km`;
}
