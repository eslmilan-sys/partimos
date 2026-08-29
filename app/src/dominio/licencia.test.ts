import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DIAS_PARA_AVISAR,
  aTexto,
  deTexto,
  comoSeDice,
  diasQueFaltan,
  estadoDeLicencia,
  puedePublicar,
} from './licencia.ts';

/* Un mediodía de Panamá: 12:00 allá son las 17:00 UTC. */
const AHORA = new Date('2026-08-28T17:00:00Z');
const enDias = (n: number) => {
  const d = new Date(Date.UTC(2026, 7, 28 + n));
  return d.toISOString().slice(0, 10);
};

test('sin fecha no se bloquea a nadie: se pregunta', () => {
  assert.equal(estadoDeLicencia({ vence: null }, AHORA), 'sin-decir');
  assert.equal(puedePublicar({ vence: null }, AHORA), true);
  assert.equal(comoSeDice({ vence: null }, AHORA), 'Dinos cuándo se vence tu licencia');
});

test('al día no se dice nada: no hay fila «todo bien»', () => {
  const l = { vence: enDias(200) };
  assert.equal(estadoDeLicencia(l, AHORA), 'al-dia');
  assert.equal(comoSeDice(l, AHORA), null);
  assert.equal(puedePublicar(l, AHORA), true);
});

test('se avisa treinta días antes, cuando todavía se puede renovar', () => {
  assert.equal(estadoDeLicencia({ vence: enDias(DIAS_PARA_AVISAR) }, AHORA), 'por-vencer');
  assert.equal(estadoDeLicencia({ vence: enDias(DIAS_PARA_AVISAR + 1) }, AHORA), 'al-dia');
  // Y sigue pudiendo publicar: avisar no es castigar.
  assert.equal(puedePublicar({ vence: enDias(5) }, AHORA), true);
});

test('vencida bloquea publicar, y sólo eso', () => {
  const l = { vence: enDias(-1) };
  assert.equal(estadoDeLicencia(l, AHORA), 'vencida');
  assert.equal(puedePublicar(l, AHORA), false);
  assert.match(comoSeDice(l, AHORA)!, /vencida/);
});

test('el día que vence todavía vale', () => {
  const hoy = { vence: enDias(0) };
  assert.equal(diasQueFaltan(hoy, AHORA), 0);
  assert.equal(estadoDeLicencia(hoy, AHORA), 'por-vencer');
  assert.equal(puedePublicar(hoy, AHORA), true);
  assert.equal(comoSeDice(hoy, AHORA), 'Tu licencia se vence hoy');
});

test('hoy, mañana y los días: cada uno con sus palabras', () => {
  assert.equal(comoSeDice({ vence: enDias(1) }, AHORA), 'Tu licencia se vence mañana');
  assert.equal(comoSeDice({ vence: enDias(12) }, AHORA), 'Tu licencia se vence en 12 días');
});

test('la hora del día no mueve la cuenta', () => {
  /* Panamá va cinco horas detrás de UTC: a las 02:00 UTC allá son las 21:00
     del día anterior. Comparando instantes en vez de días, esto daría 11. */
  const deMadrugada = new Date('2026-08-29T02:00:00Z'); // 28-08, 21:00 en Panamá
  assert.equal(diasQueFaltan({ vence: enDias(12) }, deMadrugada), 12);
});

/* ── Escribirla y leerla ─────────────────────────────────────────────── */

test('se teclea como está impresa en la licencia y se guarda como la base quiere', () => {
  assert.equal(deTexto('30/04/2029'), '2029-04-30');
  assert.equal(deTexto('30042029'), '2029-04-30');
  assert.equal(aTexto('2029-04-30'), '30/04/2029');
  assert.equal(aTexto(null), '');
});

test('lo incompleto no es un error: todavía se está tecleando', () => {
  assert.equal(deTexto(''), null);
  assert.equal(deTexto('30/04'), null);
  assert.equal(deTexto('30/04/202'), null);
});

test('una fecha que no existe se rechaza, aunque los números encajen', () => {
  assert.equal(deTexto('31/02/2029'), null);
  assert.equal(deTexto('31/04/2029'), null);
  assert.equal(deTexto('00/04/2029'), null);
  assert.equal(deTexto('30/13/2029'), null);
  // …y el 29 de febrero SÍ existe en año bisiesto
  assert.equal(deTexto('29/02/2028'), '2028-02-29');
});

test('lo que se guarda se vuelve a leer igual', () => {
  const ida = deTexto('05/12/2030')!;
  assert.equal(deTexto(aTexto(ida)), ida);
});
