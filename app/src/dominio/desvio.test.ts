import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CONSUMO_L_100KM } from './aporte.ts';
import { MAXIMO_ALARGUE, desvioDeRecogida, enKilometros } from './desvio.ts';

/** Albrook, de donde sale el carro del recorrido. */
const ALBROOK = { lat: 8.9733, lng: -79.5547 };
/** Vía Argentina, El Cangrejo — a un par de kilómetros, y de camino. */
const CANGREJO = { lat: 8.9861, lng: -79.5324 };
const CHITRE = { lat: 7.9614, lng: -80.4292 };
const KM_A_CHITRE = 250;

/**
 * LA RECOGIDA MÁS NORMAL QUE HAY. Un punto a tres kilómetros, en la ciudad de
 * la que sale el carro. El primer intento la medía como «ida y vuelta» y la
 * rechazaba por dieciséis minutos de desvío; lo que hay que medir es cuánto
 * ALARGA el camino, y en un viaje de 250 km eso es casi nada.
 */
test('un punto de la misma ciudad cabe, y cuesta la gasolina de lo que alarga', () => {
  const d = desvioDeRecogida(ALBROOK, CANGREJO, CHITRE, KM_A_CHITRE, CONSUMO_L_100KM.standard);
  assert.ok(d.cabe, `alarga ${d.alargue}`);
  assert.ok(d.km < 12, `${d.km} km`);
  // La gasolina de esos kilómetros, ni un centavo más: R1 en una línea.
  assert.equal(d.costoCentavos, Math.round(d.km * 9.525));
});

test('un punto al otro lado no cabe: ya no es un desvío, es otro viaje', () => {
  const alOtroLado = { lat: 9.35, lng: -78.9 }; // hacia el Caribe, en contra
  const d = desvioDeRecogida(ALBROOK, alOtroLado, CHITRE, KM_A_CHITRE, CONSUMO_L_100KM.standard);
  assert.ok(d.alargue > MAXIMO_ALARGUE, `alarga ${d.alargue}`);
  assert.equal(d.cabe, false);
});

test('el mismo punto de salida no alarga nada y no cuesta nada', () => {
  const d = desvioDeRecogida(ALBROOK, ALBROOK, CHITRE, KM_A_CHITRE, CONSUMO_L_100KM.standard);
  assert.equal(d.km, 0);
  assert.equal(d.costoCentavos, 0);
  assert.ok(d.cabe);
});

test('los kilómetros se escriben con coma, como el resto del producto', () => {
  assert.equal(enKilometros(6.4), '6,4 km');
  assert.equal(enKilometros(2), '2,0 km');
});
