import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type Equipaje,
  CLASES,
  COMO_LO_DICE,
  SIN_EQUIPAJE,
  TOPE_POR_CLASE,
  aFilas,
  cambiar,
  comoLoVeElConductor,
  cuantasPiezas,
  decideElMaletero,
  deFilas,
  resumenCorto,
} from './equipaje.ts';

const con = (bolsos: number, pequenas: number, grandes: number): Equipaje => ({
  bolsos,
  pequenas,
  grandes,
});

test('las tres clases, en el orden en que se leen', () => {
  assert.deepEqual(CLASES, ['bolsos', 'pequenas', 'grandes']);
});

test('el contador no baja de cero ni pasa del tope', () => {
  assert.equal(cambiar(SIN_EQUIPAJE, 'bolsos', -1).bolsos, 0);
  let e = SIN_EQUIPAJE;
  for (let i = 0; i < 10; i++) e = cambiar(e, 'grandes', +1);
  assert.equal(e.grandes, TOPE_POR_CLASE);
});

test('cambiar una clase no toca las otras', () => {
  const e = cambiar(con(1, 1, 1), 'pequenas', +1);
  assert.deepEqual(e, con(1, 2, 1));
});

test('lo que va al maletero hace pensar al conductor; un bolso nunca', () => {
  assert.equal(decideElMaletero(con(0, 0, 1)), true);
  assert.equal(decideElMaletero(con(0, 1, 0)), true, 'la pequeña también va al baúl de un carro');
  assert.equal(decideElMaletero(con(3, 0, 0)), false);
  assert.equal(decideElMaletero(SIN_EQUIPAJE), false);
});

test('ida y vuelta a las columnas de la base, sin perder nada', () => {
  for (let b = 0; b <= TOPE_POR_CLASE; b++)
    for (let p = 0; p <= TOPE_POR_CLASE; p++)
      for (let g = 0; g <= TOPE_POR_CLASE; g++) {
        const e = con(b, p, g);
        assert.deepEqual(deFilas(aFilas(e)), e, `${b}/${p}/${g} no sobrevive el viaje a la base`);
      }
});

test('una reserva de antes de la 0042 se lee sin maleta pequeña, no rota', () => {
  // `maletas_pequenas` nace con la 0042: lo guardado antes no la trae.
  assert.deepEqual(deFilas({ mochilas: 1, maletas: 2 }), con(1, 0, 2));
  assert.deepEqual(deFilas({ mochilas: 0, maletas: 0, maletas_pequenas: null }), SIN_EQUIPAJE);
});

test('un número imposible en la base no se cree: se acota', () => {
  assert.deepEqual(deFilas({ mochilas: 99, maletas: -4 }), con(TOPE_POR_CLASE, 0, 0));
});

test('se cuenta lo que hay, no las clases', () => {
  assert.equal(cuantasPiezas(SIN_EQUIPAJE), 0);
  assert.equal(cuantasPiezas(con(1, 0, 2)), 3);
});

test('el conductor lo lee en castellano, con singular y plural', () => {
  assert.equal(comoLoVeElConductor(SIN_EQUIPAJE), 'Sin equipaje');
  assert.equal(comoLoVeElConductor(con(1, 0, 0)), 'Un bolso');
  assert.equal(comoLoVeElConductor(con(0, 0, 2)), 'Dos maletas grandes');
  assert.equal(comoLoVeElConductor(con(1, 0, 1)), 'Un bolso y una maleta grande');
  assert.equal(
    comoLoVeElConductor(con(2, 1, 3)),
    'Dos bolsos, una maleta pequeña y tres maletas grandes',
  );
});

test('la versión corta va en minúscula y dice algo aunque no lleve nada', () => {
  assert.equal(resumenCorto(SIN_EQUIPAJE), 'sin equipaje');
  assert.equal(resumenCorto(con(0, 1, 0)), 'una maleta pequeña');
});

test('el conductor puede distinguir las dos que importan', () => {
  assert.notEqual(comoLoVeElConductor(con(0, 1, 0)), comoLoVeElConductor(con(0, 0, 1)));
});

test('ningún texto del producto lleva signo de exclamación', () => {
  const todos: string[] = [
    ...CLASES.flatMap((c) => [
      COMO_LO_DICE[c].titulo,
      COMO_LO_DICE[c].detalle,
      COMO_LO_DICE[c].uno,
      COMO_LO_DICE[c].varios,
    ]),
    comoLoVeElConductor(con(1, 1, 1)),
    resumenCorto(con(1, 1, 1)),
  ];
  for (const t of todos) assert.ok(!t.includes('!'), `«${t}» lleva exclamación`);
});
