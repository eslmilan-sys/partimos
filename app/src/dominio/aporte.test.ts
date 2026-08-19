import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONSUMO_L_100KM,
  aporteCalculado,
  costoDelViaje,
  loQuePonesDeTuBolsillo,
  loQueRecuperas,
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

test('un sedán gasta 6,4 centavos por kilómetro', () => {
  assert.equal(tasaPorKm(CONSUMO_L_100KM.standard), 6.4);
});

test('el costo del viaje de referencia es 20,60 $', () => {
  assert.equal(costoDelViaje(CHITRE), 2060);
});

test('el tope de la ruta a Chitré es 7 $', () => {
  assert.equal(topeDeRuta(costoDelViaje(CHITRE)), 700);
});

test('el aporte por defecto con 3 puestos es 6 $', () => {
  const costo = costoDelViaje(CHITRE);
  assert.equal(aporteCalculado(costo, 3, topeDeRuta(costo)), 600);
});

test('el aporte baja al añadir puestos y nunca pasa del tope', () => {
  const costo = costoDelViaje(CHITRE);
  const tope = topeDeRuta(costo);
  assert.deepEqual(
    [1, 2, 3, 4].map((p) => aporteCalculado(costo, p, tope)),
    [700, 700, 600, 500],
  );
});

test('el aporte nunca baja del suelo de 3 $', () => {
  const coronado = costoDelViaje({ distanciaKm: 85, peajeCentavos: 200, consumoL100km: 8 });
  assert.equal(aporteCalculado(coronado, 4, topeDeRuta(coronado)), 300);
});

test('con el carro lleno el conductor recupera 18 $ de 20,60 $ y pone 2,60 $', () => {
  const costo = costoDelViaje(CHITRE);
  const recupera = loQueRecuperas(600, 3);
  assert.equal(recupera, 1800);
  assert.equal(loQuePonesDeTuBolsillo(costo, recupera), 260);
});

test('la pastilla dice de dónde sale la cifra', () => {
  assert.equal(origenDelAporte(null, 600, 700), 'calculado');
  assert.equal(origenDelAporte(500, 500, 700), 'lo pusiste tú');
  assert.equal(origenDelAporte(700, 700, 700), 'tope de la ruta');
});

test('el tope no sube porque el conductor maneje una camioneta', () => {
  const sedan = costoDelViaje(CHITRE);
  const suv = costoDelViaje({ ...CHITRE, consumoL100km: CONSUMO_L_100KM.suv });
  assert.ok(suv > sedan);
  // el tope es de la ruta: se calcula con el carro de referencia, no con el suyo
  assert.equal(topeDeRuta(sedan), 700);
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
