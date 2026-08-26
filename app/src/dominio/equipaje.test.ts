import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type Equipaje,
  COMO_LO_DICE,
  EQUIPAJES,
  aFilas,
  comoLoVeElConductor,
  decideElMaletero,
  deFilas,
  resumenCorto,
} from './equipaje.ts';

test('las tres opciones, y sólo tres', () => {
  assert.deepEqual(EQUIPAJES, ['nada', 'bolso', 'maleta']);
});

test('sólo la maleta hace pensar al conductor: un bolso nunca estorba', () => {
  assert.equal(decideElMaletero('maleta'), true);
  assert.equal(decideElMaletero('bolso'), false);
  assert.equal(decideElMaletero('nada'), false);
});

test('ida y vuelta a las columnas de la base, sin perder nada', () => {
  for (const e of EQUIPAJES) {
    assert.equal(deFilas(aFilas(e)), e, `${e} no sobrevive el viaje a la base`);
  }
});

test('una reserva vieja con varias maletas se lee como maleta', () => {
  // La migración 0026 dejó enteros: lo que ya está guardado tiene que leerse.
  assert.equal(deFilas({ mochilas: 2, maletas: 3 }), 'maleta');
  assert.equal(deFilas({ mochilas: 2, maletas: 0 }), 'bolso');
  assert.equal(deFilas({ mochilas: 0, maletas: 0 }), 'nada');
});

test('cada opción se dice en primera persona al pasajero y en tercera al conductor', () => {
  for (const e of EQUIPAJES) {
    assert.ok(COMO_LO_DICE[e].titulo.length > 0);
    assert.ok(COMO_LO_DICE[e].detalle.length > 0);
    assert.ok(comoLoVeElConductor(e).length > 0);
    assert.ok(resumenCorto(e).length > 0);
  }
  // El conductor tiene que poder distinguir las dos que importan.
  assert.notEqual(comoLoVeElConductor('bolso'), comoLoVeElConductor('maleta'));
});

test('ningún texto del producto lleva signo de exclamación', () => {
  const todos: string[] = EQUIPAJES.flatMap((e: Equipaje) => [
    COMO_LO_DICE[e].titulo,
    COMO_LO_DICE[e].detalle,
    comoLoVeElConductor(e),
    resumenCorto(e),
  ]);
  for (const t of todos) assert.ok(!t.includes('!'), `«${t}» lleva exclamación`);
});
