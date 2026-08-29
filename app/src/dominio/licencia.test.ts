import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DIAS_PARA_AVISAR,
  aTexto,
  comoSeDice,
  deLaVerificacion,
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

test('la fecha sale de la verificación, y sólo si está verificada', () => {
  assert.deepEqual(
    deLaVerificacion({ status: 'verified', expires_at: '2029-04-30T00:00:00Z' }),
    { vence: '2029-04-30' },
  );
  // Sin verificar no hay licencia, aunque la fila traiga una fecha: una
  // sesión rechazada o abandonada no prueba nada.
  assert.deepEqual(deLaVerificacion({ status: 'rejected', expires_at: '2029-04-30' }), { vence: null });
  assert.deepEqual(deLaVerificacion({ status: 'pending', expires_at: '2029-04-30' }), { vence: null });
  assert.deepEqual(deLaVerificacion(undefined), { vence: null });
});

test('verificada pero sin fecha: verificada no es lo mismo que fechada', () => {
  assert.deepEqual(deLaVerificacion({ status: 'verified', expires_at: null }), { vence: null });
});

test('la fecha se enseña como está impresa en la licencia', () => {
  assert.equal(aTexto('2029-04-30'), '30/04/2029');
  assert.equal(aTexto(null), '');
});
