/**
 * LO QUE APORTA QUIEN SUBE A MITAD DE CAMINO.
 *
 * Un viaje que declara sus ciudades de paso no sirve un trayecto: sirve
 * todos los pares de paradas. Panamá → La Chorrera → Penonomé → Chitré son
 * seis trayectos posibles, y quien sube en Penonomé no puede aportar lo
 * mismo que quien sale de Panamá: hace la mitad del camino.
 *
 * ── La diferencia con BlaBlaCar, y no es un detalle ──────────────────────
 *
 * Allá el conductor pone a mano el precio de cada tramo, y puede poner el
 * que quiera. Aquí **cada tramo lleva su propio tope**, con la MISMA
 * fórmula aplicada a los kilómetros de ESE tramo y con el mismo `+1` — el
 * conductor sigue pagando su parte. Sin eso, partir un viaje en trozos
 * sería la puerta de atrás para cobrar de más: cuatro tramos al precio del
 * viaje entero son cuatro veces el costo.
 *
 * Dos invariantes, y los dos se prueban:
 *
 * 1. **Partir nunca encarece.** La suma de los tramos de un camino nunca
 *    pasa del aporte del viaje entero por más de el redondeo al dólar.
 *    Si partirlo saliera más caro, la parada sería un peaje disfrazado.
 * 2. **El tramo es proporcional a lo que se ocupa.** Medio camino, medio
 *    costo — la fórmula no mira ni la demanda ni quién pide (R3).
 *
 * Puro, sin IO: los kilómetros y los peajes llegan en argumentos.
 */

import { CONSUMO_L_100KM, aporteCalculado, costoDelViaje, topeDeRuta } from './aporte.ts';

/** Un tramo: de qué parada a qué parada, y cuánto camino ocupa. */
export type Tramo = {
  desde: number;
  hasta: number;
  /** Kilómetros del tramo. */
  km: number;
  /** Los peajes que se pagan DENTRO del tramo. */
  peajeCentavos: number;
};

export type AporteDeTramo = {
  desde: number;
  hasta: number;
  km: number;
  /** Lo que proponemos cobrar en ese tramo. */
  aporteCentavos: number;
  /** Lo máximo que la base va a aceptar en ese tramo. */
  topeCentavos: number;
};

/**
 * El aporte de UN tramo, con su propio tope.
 *
 * `consumo` es el del carro de quien maneja —una camioneta gasta más— pero
 * el TOPE sale del sedán de referencia, igual que en el viaje entero: quien
 * maneja una camioneta no puede cobrarle su camioneta al pasajero.
 */
export function aporteDeTramo(
  tramo: Tramo,
  puestos: number,
  consumoL100km: number,
): AporteDeTramo {
  const costo = costoDelViaje({
    distanciaKm: tramo.km,
    peajeCentavos: tramo.peajeCentavos,
    consumoL100km,
  });
  const costoDeReferencia = costoDelViaje({
    distanciaKm: tramo.km,
    peajeCentavos: tramo.peajeCentavos,
    consumoL100km: CONSUMO_L_100KM.standard,
  });
  const tope = topeDeRuta(costoDeReferencia);
  return {
    desde: tramo.desde,
    hasta: tramo.hasta,
    km: tramo.km,
    aporteCentavos: aporteCalculado(costo, puestos, tope),
    topeCentavos: tope,
  };
}

/**
 * LOS TRAMOS DE UN VIAJE, repartiendo el camino entre las paradas.
 *
 * Sin geometría de carretera en la base, los kilómetros de cada tramo se
 * reparten por la FRACCIÓN de camino que hay entre dos paradas — que es lo
 * mismo que ya se usa para poner la hora de cada parada. Los peajes se
 * reparten igual: son de la carretera, no de un punto.
 *
 * `fracciones` va de 0 a 1, una por parada, en orden y empezando en 0.
 */
export function tramosDelViaje(
  fracciones: number[],
  kmTotales: number,
  peajeTotalCentavos: number,
  puestos: number,
  consumoL100km: number,
): AporteDeTramo[] {
  const salida: AporteDeTramo[] = [];
  for (let i = 0; i < fracciones.length - 1; i++) {
    for (let j = i + 1; j < fracciones.length; j++) {
      const parte = Math.max(0, fracciones[j] - fracciones[i]);
      salida.push(
        aporteDeTramo(
          {
            desde: i,
            hasta: j,
            km: kmTotales * parte,
            peajeCentavos: Math.round(peajeTotalCentavos * parte),
          },
          puestos,
          consumoL100km,
        ),
      );
    }
  }
  return salida;
}

/**
 * Sólo los tramos que EMPIEZAN en cada parada y llegan al final.
 *
 * Es lo que la pantalla de publicar necesita enseñar: «quien suba en
 * Penonomé aporta B/5». Los tramos intermedios existen y se calculan igual,
 * pero pedirle al conductor que revise quince cifras sería pedirle que no
 * publique.
 */
export function desdeCadaParada(
  fracciones: number[],
  kmTotales: number,
  peajeTotalCentavos: number,
  puestos: number,
  consumoL100km: number,
): AporteDeTramo[] {
  const ultimo = fracciones.length - 1;
  return tramosDelViaje(fracciones, kmTotales, peajeTotalCentavos, puestos, consumoL100km).filter(
    (t) => t.hasta === ultimo,
  );
}
