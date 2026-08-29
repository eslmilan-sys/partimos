import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LO_QUE_FALTA, quePuedeHacer } from './permiso.ts';

test('sin papeles todavía se calcula: es la regla del producto', () => {
  const nuevo = quePuedeHacer({ tieneCarroPropio: false, estadoDeCedula: 'pendiente' });
  assert.equal(nuevo.calcular, true);
  assert.equal(nuevo.publicar, false);
});

test('primero el carro, aunque falten las dos cosas', () => {
  // Sin carro la cuenta va con el sedán de referencia: el número que se
  // enseña no es el suyo, así que eso es lo primero que hay que arreglar.
  const r = quePuedeHacer({ tieneCarroPropio: false, estadoDeCedula: 'pendiente' });
  assert.equal(r.falta, 'carro');
});

test('con carro y sin cédula, falta la cédula', () => {
  const r = quePuedeHacer({ tieneCarroPropio: true, estadoDeCedula: 'pendiente' });
  assert.equal(r.falta, 'cedula');
  assert.equal(r.publicar, false);
});

test('la cédula en revisión no es lo mismo que sin mandar', () => {
  // Decir «verifica tu cédula» a quien ya la mandó lo manda a hacerlo otra
  // vez. Es un estado distinto y lleva otro texto y otro botón.
  const r = quePuedeHacer({ tieneCarroPropio: true, estadoDeCedula: 'en revisión' });
  assert.equal(r.falta, 'revision');
  assert.equal(r.publicar, false);
  assert.notEqual(LO_QUE_FALTA.revision.titulo, LO_QUE_FALTA.cedula.titulo);
});

test('rechazada tampoco publica, y se trata como sin verificar', () => {
  const r = quePuedeHacer({ tieneCarroPropio: true, estadoDeCedula: 'rechazada' });
  assert.equal(r.falta, 'cedula');
  assert.equal(r.publicar, false);
});

test('con carro propio y cédula verificada, publica y no falta nada', () => {
  const r = quePuedeHacer({ tieneCarroPropio: true, estadoDeCedula: 'verificada' });
  assert.equal(r.falta, null);
  assert.equal(r.publicar, true);
});

test('cada cosa que falta tiene su puerta, y ninguna es la misma pantalla vacía', () => {
  for (const clave of ['carro', 'cedula', 'revision'] as const) {
    const q = LO_QUE_FALTA[clave];
    assert.ok(q.ruta.startsWith('/('), `${clave} necesita una ruta de verdad`);
    assert.ok(q.boton.length > 0, `${clave} necesita un botón`);
    assert.ok(!q.texto.includes('!'), 'sin signos de admiración en el producto');
  }
});

/* ── La licencia (0047, 28-08-2026) ──────────────────────────────────── */

const AL_DIA = { tieneCarroPropio: true, estadoDeCedula: 'verificada' as const };
const AHORA_L = new Date('2026-08-28T17:00:00Z');

test('sin decir la licencia se publica igual: nadie pierde el acceso', () => {
  assert.equal(quePuedeHacer({ ...AL_DIA, licencia: { vence: null }, ahora: AHORA_L }).publicar, true);
  // Y quien ni siquiera la pasa —una pantalla vieja— tampoco se bloquea.
  assert.equal(quePuedeHacer(AL_DIA).publicar, true);
});

test('la licencia vencida bloquea publicar', () => {
  const r = quePuedeHacer({ ...AL_DIA, licencia: { vence: '2026-08-01' }, ahora: AHORA_L });
  assert.equal(r.publicar, false);
  assert.equal(r.falta, 'licencia');
  // Pero calcular sigue estando: la cuenta no depende de ningún papel.
  assert.equal(r.calcular, true);
});

test('por vencer avisa pero no bloquea', () => {
  const r = quePuedeHacer({ ...AL_DIA, licencia: { vence: '2026-09-05' }, ahora: AHORA_L });
  assert.equal(r.publicar, true);
  assert.equal(r.falta, null);
});

test('la cédula va ANTES que la licencia: se resuelve en minutos, no en semanas', () => {
  const r = quePuedeHacer({
    tieneCarroPropio: true,
    estadoDeCedula: 'pendiente',
    licencia: { vence: '2026-08-01' },
    ahora: AHORA_L,
  });
  assert.equal(r.falta, 'cedula');
});
