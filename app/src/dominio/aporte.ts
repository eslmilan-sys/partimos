/**
 * El cálculo del aporte, el costo del viaje y el tope de la ruta.
 *
 * Todo en centavos enteros, como la base (`*_cents`). El formato «6,00 $» vive
 * en ui/Dinero.tsx y en ningún otro sitio.
 *
 * Viaje de referencia — Albrook → Chitré, 250 km, peaje 3,00 $, sedán:
 *   costo 29,19 $ · tope 10 $ · aporte por defecto con 3 puestos 8 $.
 * (El traspaso de diseño decía 20,60 / 7 / 6: eran las cifras con la
 * gasolina a 0,80 $/L, que nunca fue el precio panameño. Corregido el
 * 24-08-2026 con la decisión de `supabase/CONSUMO.md`.)
 */

export type CategoriaVehiculo = 'economy' | 'standard' | 'suv';

/**
 * Litros a los 100 km por categoría — los de `supabase/CONSUMO.md`, EN
 * CARRETERA y no en ciudad: un interurbano rueda estable por la
 * Interamericana, y tomar el consumo urbano inflaría el tope. En la duda,
 * el valor bajo: equivocarse hacia abajo le cuesta centavos al conductor;
 * hacia arriba, el estatuto jurídico del producto.
 *
 * Los CÓDIGOS siguen siendo los de `vehicle_categories` en la base
 * (economy/standard/suv); el renombre a compacto/sedán/SUV — y las dos
 * categorías nuevas, 4×4 e híbrido — llegan con la migración que también
 * retira `rate_per_km_cents`. Los VALORES ya son los decididos.
 */
export const CONSUMO_L_100KM: Record<CategoriaVehiculo, number> = {
  /** Compacto — Picanto, Yaris, March. */
  economy: 6.5,
  /** Sedán — Corolla, Sentra, Civic. El carro de referencia del tope. */
  standard: 7.5,
  /** SUV dos ruedas — CR-V, Tucson, Kicks. */
  suv: 9.5,
};

/**
 * Precio de la gasolina en centavos por litro.
 *
 * 1,27 $/L (≈ 4,82 $ el galón) — el precio panameño real a 24-08-2026,
 * todavía de un resumen y no del boletín de la Secretaría Nacional de
 * Energía: A CONFIRMAR contra la publicación oficial, por tipo (91/95/
 * diésel), antes del primer aporte enseñado a un pasajero de verdad.
 *
 * En Panamá cambia por resolución cada quincena: esto es un dato fechado,
 * no una constante del código. Vive aquí hasta que exista la fila
 * versionada en la base (`fuel_prices`, ver CONSUMO.md).
 */
export const PRECIO_GASOLINA_CENTAVOS_POR_LITRO = 127;

/** Margen sobre el recorrido para cubrir los desvíos de recogida. `price_rules.detour_tolerance_pct`. */
export const MARGEN_DESVIO_PCT = 10;

/** Suelo del aporte. Por debajo no se publica, aunque el reparto dé menos. */
export const APORTE_MINIMO_CENTAVOS = 300;

/**
 * Puestos de pago del carro de referencia con el que se calcula el tope de una ruta.
 * El tope es de la ruta, no del carro: quien maneja una camioneta tiene más costo
 * y un aporte calculado mayor, pero no puede cobrarle al pasajero su camioneta.
 */
export const OCUPACION_DE_REFERENCIA = 3;

/** Redondeo al dólar hacia arriba. El producto no enseña centavos en el aporte. */
const aDolarArriba = (centavos: number): number => Math.ceil(centavos / 100) * 100;

/** Centavos por kilómetro que gasta un carro: litros a los 100 km × precio del litro. */
export function tasaPorKm(
  consumoL100km: number,
  precioLitroCentavos = PRECIO_GASOLINA_CENTAVOS_POR_LITRO,
): number {
  return (consumoL100km / 100) * precioLitroCentavos;
}

export type EntradaDeCosto = {
  distanciaKm: number;
  peajeCentavos: number;
  consumoL100km: number;
  precioLitroCentavos?: number;
  margenDesvioPct?: number;
};

/**
 * Lo que cuesta el camino: gasolina por la distancia, más el margen de desvío,
 * más los peajes. Es lo que la pantalla llama «Gasolina y peajes».
 */
export function costoDelViaje({
  distanciaKm,
  peajeCentavos,
  consumoL100km,
  precioLitroCentavos = PRECIO_GASOLINA_CENTAVOS_POR_LITRO,
  margenDesvioPct = MARGEN_DESVIO_PCT,
}: EntradaDeCosto): number {
  const gasolina = distanciaKm * tasaPorKm(consumoL100km, precioLitroCentavos);
  return Math.round(gasolina * (1 + margenDesvioPct / 100)) + peajeCentavos;
}

/**
 * El tope de la ruta: el costo repartido entre los puestos del carro de referencia,
 * al dólar de arriba. Nadie puede pedir más, y ni pidiendo el tope se gana plata.
 */
export function topeDeRuta(costoDeReferenciaCentavos: number): number {
  return aDolarArriba(costoDeReferenciaCentavos / OCUPACION_DE_REFERENCIA);
}

/**
 * El aporte que proponemos: el costo entre los ocupantes — el conductor cuenta
 * como uno más que paga — sujeto al suelo de 3 $ y al tope de la ruta.
 */
export function aporteCalculado(
  costoCentavos: number,
  puestos: number,
  topeCentavos: number,
): number {
  const reparto = aDolarArriba(costoCentavos / (puestos + 1));
  return Math.min(topeCentavos, Math.max(APORTE_MINIMO_CENTAVOS, reparto));
}

export type OrigenDelAporte = 'calculado' | 'lo pusiste tú' | 'tope de la ruta';

/** La pastilla que va al lado de la cifra en `5c`. */
export function origenDelAporte(
  elegidoPorElConductor: number | null,
  aporteCentavos: number,
  topeCentavos: number,
): OrigenDelAporte {
  if (elegidoPorElConductor == null) return 'calculado';
  return aporteCentavos >= topeCentavos ? 'tope de la ruta' : 'lo pusiste tú';
}

/** Lo que el conductor recupera si se llena el carro. */
export function loQueRecuperas(aporteCentavos: number, puestos: number): number {
  return aporteCentavos * puestos;
}

/** Lo que el conductor pone de su bolsillo aunque lo llene. Nunca baja de cero. */
export function loQuePonesDeTuBolsillo(costoCentavos: number, recuperaCentavos: number): number {
  return Math.max(0, costoCentavos - recuperaCentavos);
}
