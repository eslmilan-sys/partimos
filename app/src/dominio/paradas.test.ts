import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MAXIMO_PARADAS_INTERMEDIAS, MAXIMO_PUNTOS_DE_RECOGIDA } from './paradas.ts';

/**
 * El límite de `PRODUCT.md` convertido en prueba: más de cuatro sitios donde
 * subirse deja de ser un viaje compartido y empieza a ser una ruta.
 */
test('nunca más de cuatro puntos donde alguien se sube', () => {
  assert.equal(MAXIMO_PUNTOS_DE_RECOGIDA, 4);
  // El origen es uno de los cuatro: por eso las intermedias son tres.
  assert.equal(MAXIMO_PARADAS_INTERMEDIAS, 3);
  assert.equal(1 + MAXIMO_PARADAS_INTERMEDIAS, MAXIMO_PUNTOS_DE_RECOGIDA);
});
