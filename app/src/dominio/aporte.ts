/**
 * El cálculo del aporte, el costo del viaje y el tope de la ruta.
 *
 * Todo en centavos enteros, como la base (`*_cents`). El formato «6,00 $» vive
 * en ui/Dinero.tsx y en ningún otro sitio.
 *
 * Viaje de referencia — Albrook → Chitré, 250 km, peaje 3,00 $, sedán:
 *   costo 29,19 $ · tope 10 $ · aporte por defecto con 3 puestos 7,29 $
 *   (29,19 entre los cuatro que van, el conductor incluido).
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

/**
 * Suelo del aporte: el fondo del deslizador de `5c`.
 *
 * **No sube el reparto** (30-08-2026). Decía «por debajo no se publica,
 * aunque el reparto dé menos», y se aplicaba con un `Math.max`: en un
 * Panamá → Coronado de 11,50 $ con cuatro puestos, el reparto justo da 2,30
 * y el suelo lo subía a 3 — cuatro por tres son 12, más de lo que costó el
 * viaje. El conductor ganaba 50 centavos. Ver `aporteCalculado`.
 */
export const APORTE_MINIMO_CENTAVOS = 300;

/**
 * Puestos de pago del carro de referencia con el que se calcula el tope de una ruta.
 * El tope es de la ruta, no del carro: quien maneja una camioneta tiene más costo
 * y un aporte calculado mayor, pero no puede cobrarle al pasajero su camioneta.
 */
export const OCUPACION_DE_REFERENCIA = 3;

/** Redondeo al dólar hacia arriba. El producto no enseña centavos en el aporte. */
const aDolarArriba = (centavos: number): number => Math.ceil(centavos / 100) * 100;

/**
 * EL REPARTO, AL CENTAVO DE ABAJO — el del aporte por puesto.
 *
 * **Historia de dos preguntas del dueño, la segunda mató a la primera.**
 *
 * *30-08-2026, «si todos ponen 7, ¿por qué yo pago 4,86?»* — el reparto de
 * un Panamá → Las Tablas de 32,86 $ entre cinco daba 6,57, y redondeando al
 * dólar de ARRIBA cada pasajero ponía 7 y al conductor le quedaban 4,86:
 * menos que cualquiera de los que llevaba. Se cambió a redondear al dólar de
 * ABAJO, que da la vuelta a la desigualdad.
 *
 * *01-09-2026, «why we redondean like this? all pay exact the same brother»*
 * — pero la desigualdad seguía ahí, sólo que del otro lado y a veces más
 * grande: 29,19 entre tres daba 9,73, el redondeo al dólar de abajo lo
 * bajaba a 9, y el conductor ponía 11,19 contra los 9 de cada pasajero.
 * **Dos dólares y pico de diferencia entre gente que va en el mismo carro,
 * por un redondeo que no defendía nada.**
 *
 * El redondeo al dólar existía por una regla de estilo del v6 —«el aporte no
 * enseña centavos»— y ninguna regla de estilo vale una desigualdad visible
 * entre las cuatro personas de un carro. Al centavo, el reparto es exacto:
 * `⌊costo/(ocupantes)⌋` para todos, y a quien maneja le quedan los ceros a
 * tres o cuatro centavos como mucho. **Todos ponen lo mismo, y cuando no cabe
 * exacto, los centavos sueltos los pone quien maneja** — que es la única
 * versión de «el conductor cuenta como uno más» que aguanta mirando la
 * pantalla.
 *
 * La desigualdad que arregló el cambio de agosto se conserva, porque es la
 * misma cuenta con otra unidad:
 * `costo − puestos × ⌊costo/(puestos+1)⌋ ≥ ⌊costo/(puestos+1)⌋`.
 */
const alCentavoAbajo = (centavos: number): number => Math.floor(centavos);

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
 * EL APORTE POR PUESTO: el costo entre los ocupantes —el conductor cuenta como
 * uno más que paga— al centavo de abajo, y nunca por encima del tope de la
 * ruta. Ver `alCentavoAbajo`: **todos ponen lo mismo**.
 *
 * **Es a la vez lo que proponemos y lo máximo que se puede pedir.** Antes eran
 * dos cifras: esta, y un techo aparte que era el tope de la ruta. El tope se
 * calcula sobre una ocupación de referencia de tres puestos
 * (`OCUPACION_DE_REFERENCIA`), así que un carro que ofrece CUATRO podía
 * ponerlo en los cuatro: 4 × 11 = 44 $ sobre un viaje de 32,86 $. El
 * conductor salía ganando 11 $ — R1 rota, y alcanzable con dos toques del
 * deslizador. `loQuePonesDeTuBolsillo` lo tapaba con un `Math.max(0, …)`.
 *
 * Ahora el techo es el reparto justo, y el tope de la ruta sólo baja: pedir
 * más que tu propia parte es exactamente lo que no se puede hacer aquí. Es
 * además, palabra por palabra, lo que promete el sitio — «puedes pedir menos,
 * nunca más».
 *
 * **El suelo de 3 $ no sube este número.** En una ruta corta con el carro
 * lleno el reparto puede dar 2,30, y subirlo a 3 pondría al conductor a
 * recuperar 12 $ de un viaje de 11,50: otra vez ganando. El suelo se queda
 * como lo que de verdad es —el fondo del deslizador y la señal de que un
 * viaje así igual no vale la pena publicarlo—, no como una corrección al
 * alza del reparto.
 */
export function aporteCalculado(
  costoCentavos: number,
  puestos: number,
  topeCentavos: number,
): number {
  const justo = alCentavoAbajo(costoCentavos / (puestos + 1));
  return Math.min(topeCentavos, justo);
}

/**
 * DE DÓNDE SALE LA CIFRA, dicho como se dice hablando.
 *
 * Eran «calculado», «lo pusiste tú» y «tope de la ruta» (30-08-2026, pedido
 * del dueño: «needs something that is more natural»). «Calculado» es el
 * participio de una máquina — nadie le dice a un amigo que su aporte está
 * calculado—, y «lo pusiste tú» hace de *poner* un verbo de precios que en
 * español no lo es; además señala a la persona en una pastilla que no acusa
 * a nadie, sólo dice de dónde viene el número.
 *
 * «Sugerido» y «lo cambiaste» son las dos frases que se dirían de verdad.
 * «Tope de la ruta» se queda: no es jerga nuestra sino el nombre propio de
 * una cosa que tiene su pantalla —`(conductor)/tope`— y su explicación.
 */
export type OrigenDelAporte = 'sugerido' | 'lo cambiaste' | 'tope de la ruta';

/**
 * La pastilla que va al lado de la cifra en `5c`.
 *
 * **Dice el tope aunque nadie haya tocado el número** (27-08-2026). Antes,
 * sin cifra escrita a mano devolvía siempre «calculado», también cuando el
 * reparto se había topado: con un puesto ofrecido el reparto da 15 $, el tope
 * lo baja a 10, y la pantalla lo llamaba «calculado». De ahí la pregunta del
 * dueño —«¿por qué de 1 a 2 puestos el precio no cambia?»—: cambiaba el
 * reparto, no el resultado, y nada en la pantalla lo decía.
 *
 * Que no cambie es la regla, no el fallo: si ofrecer menos puestos subiera el
 * aporte, ofrecer uno solo sería cobrar el doble — un recargo por el último
 * puesto, que es exactamente lo que R3 prohíbe. El tope es de la RUTA y se
 * calcula con una ocupación de referencia, así que no depende de cuántos
 * puestos ponga hoy quien maneja.
 */
export function origenDelAporte(
  elegidoPorElConductor: number | null,
  aporteCentavos: number,
  topeCentavos: number,
): OrigenDelAporte {
  if (aporteCentavos >= topeCentavos) return 'tope de la ruta';
  return elegidoPorElConductor == null ? 'sugerido' : 'lo cambiaste';
}

/**
 * ¿EL TOPE ESTÁ MORDIENDO? Es decir: el reparto entre los ocupantes da más de
 * lo que la ruta permite pedir, así que la cifra que se enseña es el tope.
 *
 * Sirve para poder explicarlo en la pantalla en vez de dejar un número quieto
 * sin razón (invariante 7 del v6: una afirmación lleva su porqué).
 */
export function elTopeMuerde(
  costoCentavos: number,
  puestos: number,
  topeCentavos: number,
): boolean {
  return alCentavoAbajo(costoCentavos / (puestos + 1)) > topeCentavos;
}

/** Lo que el conductor recupera si se llena el carro. */
export function loQueRecuperas(aporteCentavos: number, puestos: number): number {
  return aporteCentavos * puestos;
}

/**
 * Lo que el conductor pone de su bolsillo aunque lo llene.
 *
 * El `Math.max(0, …)` **ya no puede dispararse**: desde que el aporte no pasa
 * del reparto justo (`aporteCalculado`), lo que le queda es siempre al menos
 * una parte. Se queda como red: el día que alguien vuelva a tocar la fórmula,
 * es preferible enseñar un cero raro que un número negativo — pero si este
 * cero aparece, el fallo está arriba, no aquí.
 */
export function loQuePonesDeTuBolsillo(costoCentavos: number, recuperaCentavos: number): number {
  return Math.max(0, costoCentavos - recuperaCentavos);
}
