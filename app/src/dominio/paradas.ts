/**
 * CUÁNTAS PARADAS CABEN EN UN VIAJE, y por qué ese número y no otro.
 *
 * Estaba escrito `const MAX_INTERMEDIAS = 2` dentro de la pantalla de
 * publicar. Dos cosas mal: era un número sin razón al lado, y era el número
 * equivocado — el dueño lo pidió el 01-09-2026, *«should be able to select
 * more paradas, not just 2»*.
 *
 * **El techo no es de diseño, es de producto.** `PRODUCT.md` lo dice sin
 * matices: nunca más de **cuatro puntos de recogida** por viaje. No es una
 * comodidad de pantalla: un carro que para en media docena de sitios deja de
 * ser alguien que va a un sitio y lleva gente de camino, y empieza a
 * parecerse a una ruta de transporte — que es exactamente la frontera que
 * este producto no cruza. Y en lo pequeño: cada parada es un desvío, y el
 * margen del 10 % sobre el recorrido (`MARGEN_DESVIO_PCT`) no da para más.
 *
 * **El origen ES un punto de recogida.** De ahí la resta: cuatro puntos donde
 * alguien se sube son el origen más tres paradas en el camino. El destino no
 * cuenta — ahí nadie sube, todo el mundo baja.
 */

/** El techo de `PRODUCT.md`: cuatro sitios donde alguien puede subirse. */
export const MAXIMO_PUNTOS_DE_RECOGIDA = 4;

/** Las que se eligen en `5c`: los puntos de recogida menos el origen. */
export const MAXIMO_PARADAS_INTERMEDIAS = MAXIMO_PUNTOS_DE_RECOGIDA - 1;
