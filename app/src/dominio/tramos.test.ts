import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CONSUMO_L_100KM, aporteCalculado, costoDelViaje, topeDeRuta } from './aporte.ts';
import { aporteDeTramo, desdeCadaParada, tramosDelViaje } from './tramos.ts';

/** Panamá → Chitré: 250 km por carretera, 3 $ de peaje. */
const KM = 250;
const PEAJE = 300;
const SEDAN = CONSUMO_L_100KM.standard;
/** Las cuatro paradas del corredor, por fracción de camino recorrida. */
const PARADAS = [0, 0.18, 0.44, 1];

test('medio camino cuesta la mitad: la fórmula no mira quién pide', () => {
  const entero = aporteDeTramo({ desde: 0, hasta: 1, km: KM, peajeCentavos: PEAJE }, 3, SEDAN);
  const mitad = aporteDeTramo(
    { desde: 0, hasta: 1, km: KM / 2, peajeCentavos: PEAJE / 2 },
    3,
    SEDAN,
  );
  // Al dólar de arriba, así que se comprueba con holgura de un dólar.
  assert.ok(Math.abs(mitad.aporteCentavos * 2 - entero.aporteCentavos) <= 200);
});

test('cada tramo lleva SU tope, y nunca es el del viaje entero', () => {
  const corto = aporteDeTramo({ desde: 0, hasta: 1, km: 45, peajeCentavos: 0 }, 3, SEDAN);
  const entero = aporteDeTramo({ desde: 0, hasta: 3, km: KM, peajeCentavos: PEAJE }, 3, SEDAN);
  assert.ok(corto.topeCentavos < entero.topeCentavos);
  assert.ok(corto.aporteCentavos <= corto.topeCentavos);
});

test('partir el viaje NO lo encarece: la parada no es un peaje disfrazado', () => {
  const entero = aporteDeTramo({ desde: 0, hasta: 3, km: KM, peajeCentavos: PEAJE }, 3, SEDAN);
  const todos = tramosDelViaje(PARADAS, KM, PEAJE, 3, SEDAN);
  // Un camino completo partido en trozos consecutivos: 0→1, 1→2, 2→3.
  const encadenado = [
    todos.find((t) => t.desde === 0 && t.hasta === 1)!,
    todos.find((t) => t.desde === 1 && t.hasta === 2)!,
    todos.find((t) => t.desde === 2 && t.hasta === 3)!,
  ];
  const suma = encadenado.reduce((n, t) => n + t.aporteCentavos, 0);
  /* Sólo puede pasarse por el redondeo al dólar de cada trozo, que es
     como mucho un dólar por tramo. Más que eso sería cobrar por parar. */
  assert.ok(
    suma <= entero.aporteCentavos + 100 * encadenado.length,
    `partirlo cuesta ${suma} contra ${entero.aporteCentavos} de una sola vez`,
  );
});

test('en un tramo cortísimo manda el tope, no el suelo de 3 $', () => {
  /* El suelo es del PRODUCTO —por debajo de 3 $ no vale la pena publicar—
     y el tope es de la LEY: por encima, quien maneja gana plata. Cuando
     chocan, gana el tope. Dos kilómetros no cuestan tres dólares, y
     cobrarlos porque «es el mínimo» rompería R1 sin que la fórmula se
     entere. Lo que sí hay que hacer es no ofrecer paradas así de cerca —
     de eso se encarga `enElCamino`. */
  const migaja = aporteDeTramo({ desde: 0, hasta: 1, km: 2, peajeCentavos: 0 }, 3, SEDAN);
  assert.ok(migaja.aporteCentavos <= migaja.topeCentavos);
  assert.ok(migaja.aporteCentavos < 300);
});

test('la camioneta gasta más pero no cobra su camioneta', () => {
  const sedan = aporteDeTramo({ desde: 0, hasta: 1, km: 120, peajeCentavos: 0 }, 3, SEDAN);
  const suv = aporteDeTramo(
    { desde: 0, hasta: 1, km: 120, peajeCentavos: 0 },
    3,
    CONSUMO_L_100KM.suv,
  );
  // Mismo tope: sale del carro de referencia, no del suyo.
  assert.equal(sedan.topeCentavos, suv.topeCentavos);
  assert.ok(suv.aporteCentavos <= suv.topeCentavos);
});

test('con cuatro paradas hay seis tramos, y tres empiezan en una parada', () => {
  assert.equal(tramosDelViaje(PARADAS, KM, PEAJE, 3, SEDAN).length, 6);
  const hastaElFinal = desdeCadaParada(PARADAS, KM, PEAJE, 3, SEDAN);
  assert.equal(hastaElFinal.length, 3);
  assert.deepEqual(
    hastaElFinal.map((t) => t.desde),
    [0, 1, 2],
  );
});

test('cuanto más tarde subes, menos aportas', () => {
  const [dePanama, deLaChorrera, dePenonome] = desdeCadaParada(PARADAS, KM, PEAJE, 3, SEDAN);
  assert.ok(dePanama.aporteCentavos >= deLaChorrera.aporteCentavos);
  assert.ok(deLaChorrera.aporteCentavos >= dePenonome.aporteCentavos);
});

test('el tramo entero coincide con el cálculo del viaje entero', () => {
  const costo = costoDelViaje({ distanciaKm: KM, peajeCentavos: PEAJE, consumoL100km: SEDAN });
  const tope = topeDeRuta(costo);
  const delViaje = aporteCalculado(costo, 3, tope);
  const delTramo = aporteDeTramo({ desde: 0, hasta: 3, km: KM, peajeCentavos: PEAJE }, 3, SEDAN);
  assert.equal(delTramo.aporteCentavos, delViaje);
  assert.equal(delTramo.topeCentavos, tope);
});
