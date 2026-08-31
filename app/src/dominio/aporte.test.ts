import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONSUMO_L_100KM,
  aporteCalculado,
  costoDelViaje,
  loQuePonesDeTuBolsillo,
  loQueRecuperas,
  elTopeMuerde,
  origenDelAporte,
  tasaPorKm,
  topeDeRuta,
} from './aporte.ts';
import { tarifaDeServicio, totalQuePagaElPasajero } from './tarifas.ts';
import { calcularReembolso } from './reembolsos.ts';

/** Albrook → Chitré, el viaje de referencia de `5d`. */
const CHITRE = {
  distanciaKm: 250,
  peajeCentavos: 300,
  consumoL100km: CONSUMO_L_100KM.standard,
};

/* La tabla de referencia es la de CONSUMO.md (24-08-2026): gasolina a
   1,27 $/L y el sedán a 7,5 L/100 km. Las cifras viejas —20,60 / 7 / 6—
   salían de 0,80 $/L, que nunca fue el precio panameño. */

test('un sedán gasta 9,5 centavos por kilómetro', () => {
  assert.equal(Math.round(tasaPorKm(CONSUMO_L_100KM.standard) * 1000) / 1000, 9.525);
});

test('el costo del viaje de referencia es 29,19 $', () => {
  assert.equal(costoDelViaje(CHITRE), 2919);
});

test('el tope de la ruta a Chitré es 10 $', () => {
  assert.equal(topeDeRuta(costoDelViaje(CHITRE)), 1000);
});

test('el aporte por defecto con 3 puestos es 8 $', () => {
  const costo = costoDelViaje(CHITRE);
  assert.equal(aporteCalculado(costo, 3, topeDeRuta(costo)), 800);
});

test('el aporte baja al añadir puestos y nunca pasa del tope', () => {
  const costo = costoDelViaje(CHITRE);
  const tope = topeDeRuta(costo);
  assert.deepEqual(
    [1, 2, 3, 4].map((p) => aporteCalculado(costo, p, tope)),
    [1000, 1000, 800, 600],
  );
});

test('el aporte nunca baja del suelo de 3 $', () => {
  const coronado = costoDelViaje({ distanciaKm: 85, peajeCentavos: 200, consumoL100km: 8 });
  assert.equal(aporteCalculado(coronado, 4, topeDeRuta(coronado)), 300);
});

test('con el carro lleno el conductor recupera 24 $ de 29,19 $ y pone 5,19 $', () => {
  const costo = costoDelViaje(CHITRE);
  const recupera = loQueRecuperas(800, 3);
  assert.equal(recupera, 2400);
  // R1 en una línea: ni lleno recupera lo que gastó.
  assert.equal(loQuePonesDeTuBolsillo(costo, recupera), 519);
});

test('la pastilla dice de dónde sale la cifra', () => {
  assert.equal(origenDelAporte(null, 600, 700), 'sugerido');
  assert.equal(origenDelAporte(500, 500, 700), 'lo cambiaste');
  assert.equal(origenDelAporte(700, 700, 700), 'tope de la ruta');
  // Topado SIN que nadie haya tocado la cifra: la pastilla dice el tope, no
  // «sugerido». Es la pregunta de «¿por qué de 1 a 2 puestos no cambia?».
  assert.equal(origenDelAporte(null, 700, 700), 'tope de la ruta');
});

test('ofrecer menos puestos NO sube el aporte: sería un recargo por el último', () => {
  const costo = costoDelViaje(CHITRE);
  const tope = topeDeRuta(costo);
  const conUno = aporteCalculado(costo, 1, tope);
  const conDos = aporteCalculado(costo, 2, tope);
  // El reparto crudo sí sube al ofrecer menos…
  assert.ok(costo / 2 > costo / 3);
  // …pero el tope de la ruta lo corta, y el aporte se queda igual (R3).
  assert.equal(conUno, conDos);
  assert.equal(conUno, tope);
  // Y la pantalla puede decir por qué.
  assert.equal(elTopeMuerde(costo, 1, tope), true);
  assert.equal(elTopeMuerde(costo, 3, tope), false);
});

test('el tope no sube porque el conductor maneje una camioneta', () => {
  const sedan = costoDelViaje(CHITRE);
  const suv = costoDelViaje({ ...CHITRE, consumoL100km: CONSUMO_L_100KM.suv });
  assert.ok(suv > sedan);
  // el tope es de la ruta: se calcula con el carro de referencia, no con el suyo
  assert.equal(topeDeRuta(sedan), 1000);
});

test('las tarifas sobre un aporte de 6 $', () => {
  assert.equal(tarifaDeServicio(600, 'yappy_app'), 30);
  assert.equal(tarifaDeServicio(600, 'card'), 48);
  assert.equal(tarifaDeServicio(600, 'external'), 0);
  assert.equal(totalQuePagaElPasajero(600, 'yappy_app'), 630);
});

// El traspaso es explícito: a más de 2 h vuelve **entero, tarifa incluida**,
// 6,30 $ sobre un viaje de 6 $ con Yappy. No retenemos nada por algo que
// todavía no nos ha costado nada.
test('cancelo yo con tiempo: vuelve todo, tarifa incluida', () => {
  const r = calcularReembolso({
    motivo: 'yo',
    aporteCentavos: 600,
    tarifaCentavos: 30,
    horasAntesDeLaSalida: 19,
  });
  assert.equal(r.montoCentavos, 630);
  assert.equal(r.retenidoCentavos, 0);
  assert.equal(r.paraElConductorCentavos, 0);
});

test('cancelo yo a última hora: el conductor se queda 1 $', () => {
  const r = calcularReembolso({
    motivo: 'yo',
    aporteCentavos: 600,
    tarifaCentavos: 30,
    horasAntesDeLaSalida: 1,
  });
  assert.equal(r.montoCentavos, 500);
  assert.equal(r.paraElConductorCentavos, 100);
});

test('si falla el otro, vuelve todo con tarifa incluida', () => {
  for (const motivo of ['conductor', 'novino', 'nopaso'] as const) {
    const r = calcularReembolso({
      motivo,
      aporteCentavos: 600,
      tarifaCentavos: 30,
      horasAntesDeLaSalida: 19,
    });
    assert.equal(r.montoCentavos, 630, motivo);
    assert.equal(r.retenidoCentavos, 0, motivo);
  }
});
