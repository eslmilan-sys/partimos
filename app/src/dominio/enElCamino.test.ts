/**
 * Las pruebas usan coordenadas REALES de Panamá, las mismas de la semilla.
 * Un caso inventado no habría atrapado el defecto que las trajo: David
 * ofrecido como parada de Panamá → Chitré.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cuantoAlarga, cuantoSeAparta, estaEnElCamino, paradasEnElCamino } from './enElCamino.ts';

const PANAMA = { lat: 8.9824, lng: -79.5199 };
const CHITRE = { lat: 7.9614, lng: -80.4292 };
const DAVID = { lat: 8.4273, lng: -82.4308 };

const LA_CHORRERA = { lat: 8.8803, lng: -79.7833 };
const PENONOME = { lat: 8.5194, lng: -80.3572 };
const AGUADULCE = { lat: 8.2422, lng: -80.5442 };
const DIVISA = { lat: 8.1333, lng: -80.6833 };
const SANTIAGO = { lat: 8.1004, lng: -80.9803 };
const COLON = { lat: 9.3592, lng: -79.9014 };

test('la vía a Azuero: las cuatro paradas reales entran', () => {
  for (const ciudad of [LA_CHORRERA, PENONOME, AGUADULCE, DIVISA]) {
    assert.equal(estaEnElCamino(PANAMA, ciudad, CHITRE), true);
  }
});

test('David no está de camino a Chitré — el defecto que trajo esto', () => {
  assert.equal(estaEnElCamino(PANAMA, DAVID, CHITRE), false);
  // Y no por poco: pasar por David casi triplica el viaje.
  assert.ok(cuantoAlarga(PANAMA, DAVID, CHITRE) > 2);
});

test('Santiago se pasa de largo yendo a Chitré', () => {
  assert.equal(estaEnElCamino(PANAMA, SANTIAGO, CHITRE), false);
});

test('pero Santiago sí está de camino a David', () => {
  assert.equal(estaEnElCamino(PANAMA, SANTIAGO, DAVID), true);
});

test('Colón: el caso que obliga a mirar el rumbo, no solo el alargue', () => {
  // A vuelo de pájaro apenas alarga —la carretera a Colón es un ramal sin
  // salida que la línea recta no ve—, así que el alargue solo lo aceptaría.
  assert.ok(cuantoAlarga(PANAMA, COLON, DAVID) < 0.12);
  // El rumbo lo delata: sale al norte, no al oeste.
  assert.ok(cuantoSeAparta(PANAMA, COLON, DAVID) > 45);
  assert.equal(estaEnElCamino(PANAMA, COLON, DAVID), false);
  assert.equal(estaEnElCamino(PANAMA, COLON, CHITRE), false);
});

test('el límite conocido: lo que está justo pasado el destino se cuela', () => {
  // Divisa (el cruce de Azuero, antes de Chitré) y Las Tablas (35 km
  // después) caen a la misma distancia de Panamá. La regla las acepta a
  // las dos, y es a propósito: quitar Las Tablas quitaría también Divisa.
  // Queda escrito para que nadie lo «arregle» sin saber lo que cuesta.
  const DIVISA = { lat: 8.1333, lng: -80.6833 };
  const LAS_TABLAS = { lat: 7.7667, lng: -80.2833 };
  assert.equal(estaEnElCamino(PANAMA, DIVISA, CHITRE), true);
  assert.equal(estaEnElCamino(PANAMA, LAS_TABLAS, CHITRE), true);
});

test('las paradas vuelven en el orden en que se pasan', () => {
  const candidatas = [
    { nombre: 'Aguadulce', ...AGUADULCE },
    { nombre: 'David', ...DAVID },
    { nombre: 'La Chorrera', ...LA_CHORRERA },
    { nombre: 'Penonomé', ...PENONOME },
    { nombre: 'Colón', ...COLON },
  ];
  assert.deepEqual(
    paradasEnElCamino(PANAMA, CHITRE, candidatas).map((p) => p.nombre),
    ['La Chorrera', 'Penonomé', 'Aguadulce'],
  );
});

test('cada parada dice a qué fracción del trayecto cae, creciendo', () => {
  const candidatas = [
    { nombre: 'Aguadulce', ...AGUADULCE },
    { nombre: 'La Chorrera', ...LA_CHORRERA },
  ];
  const [primera, segunda] = paradasEnElCamino(PANAMA, CHITRE, candidatas);
  assert.ok(primera.fraccion > 0 && primera.fraccion < segunda.fraccion);
  assert.ok(segunda.fraccion <= 1);
});

test('el mismo sitio no alarga nada, y dos puntos iguales no dan ruta', () => {
  assert.equal(cuantoAlarga(PANAMA, PANAMA, CHITRE), 0);
  assert.equal(paradasEnElCamino(PANAMA, PANAMA, [{ ...CHITRE }]).length, 0);
});

/**
 * PANAMÁ → LAS TABLAS, la ruta con la que el dueño encontró el defecto del
 * 29-08-2026: la pantalla decía «esta ruta no pasa por ninguna otra ciudad de
 * la lista» y ofrecía cero paradas.
 *
 * La regla nunca estuvo de acuerdo con esa frase, y esto lo deja escrito: por
 * esa carretera se pasa por media Panamá Oeste y media Coclé. El defecto no
 * era la regla — era que las rutas sin corredor declarado no la llamaban
 * nunca (`servicios/viajes.ts`, `paradasQueSeOfrecen`).
 */
test('Panamá → Las Tablas atraviesa la vía entera, no «ninguna ciudad»', () => {
  const LAS_TABLAS = { lat: 7.7667, lng: -80.2833 };
  const CAPIRA = { lat: 8.7561, lng: -79.8811 };
  const RIO_HATO = { lat: 8.3789, lng: -80.1711 };

  const candidatas = [
    { nombre: 'Aguadulce', ...AGUADULCE },
    { nombre: 'Capira', ...CAPIRA },
    { nombre: 'Chitré', ...CHITRE },
    { nombre: 'Colón', ...COLON },
    { nombre: 'David', ...DAVID },
    { nombre: 'La Chorrera', ...LA_CHORRERA },
    { nombre: 'Penonomé', ...PENONOME },
    { nombre: 'Río Hato', ...RIO_HATO },
  ];

  assert.deepEqual(
    paradasEnElCamino(PANAMA, LAS_TABLAS, candidatas).map((p) => p.nombre),
    ['La Chorrera', 'Capira', 'Río Hato', 'Penonomé', 'Aguadulce', 'Chitré'],
  );
});
