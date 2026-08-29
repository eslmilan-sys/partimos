import assert from 'node:assert/strict';
import { test } from 'node:test';

import { atajosDe, ejesDe } from './ejes.ts';

test('a quien maneja se le juzga el manejo y el carro; a quien viaja, no', () => {
  const delConductor = atajosDe('conductor').map((a) => a.eje);
  assert.ok(delConductor.includes('manejo'));
  assert.ok(delConductor.includes('carro'));

  const delPasajero = atajosDe('pasajero').map((a) => a.eje);
  assert.equal(delPasajero.includes('manejo'), false);
  assert.equal(delPasajero.includes('carro'), false);
});

test('los tres ejes comunes valen en los dos sentidos', () => {
  for (const eje of ['puntualidad', 'trato', 'encuentro'] as const) {
    assert.ok(atajosDe('conductor').some((a) => a.eje === eje), `conductor: ${eje}`);
    assert.ok(atajosDe('pasajero').some((a) => a.eje === eje), `pasajero: ${eje}`);
  }
});

test('ningún lado tiene un eje de precio (R3)', () => {
  const todos = [...atajosDe('conductor'), ...atajosDe('pasajero')];
  assert.equal(
    todos.some((a) => /precio|barato|caro|aporte/i.test(a.texto)),
    false,
  );
});

test('un atajo marcado se lleva la nota; el resto queda en null', () => {
  const e = ejesDe('conductor', ['puntual', 'carro'], 4);
  assert.deepEqual(e, {
    puntualidad: 4,
    manejo: null,
    trato: null,
    carro: 4,
    encuentro: null,
  });
});

test('null NO es un cero: es «no opinó»', () => {
  const e = ejesDe('conductor', [], 5);
  assert.equal(Object.values(e).every((v) => v === null), true);
  assert.equal(Object.values(e).includes(0), false);
});

test('un atajo que no existe en ese lado no ensucia nada', () => {
  /* «manejo» es del conductor. Marcado al calificar a un pasajero —por un
     enlace viejo, por un error— no puede escribir en su eje. */
  const e = ejesDe('pasajero', ['manejo', 'carro'], 5);
  assert.equal(e.manejo, null);
  assert.equal(e.carro, null);
});

test('el pasajero se juzga en su propia voz, no con las palabras del otro', () => {
  const p = atajosDe('pasajero').map((a) => a.texto);
  assert.ok(p.includes('Estaba a la hora'));
  assert.equal(p.includes('Puntual'), false);
});
