import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sePuedeCancelar } from './reembolsos.ts';

/* ── ¿Se puede todavía cancelar? ─────────────────────────────────────── */

const AHORA_C = new Date('2026-08-27T12:00:00Z');
const enHoras = (h: number) => new Date(AHORA_C.getTime() + h * 3_600_000).toISOString();

test('se cancela mientras el puesto vive y el viaje no ha salido', () => {
  assert.equal(sePuedeCancelar({ status: 'confirmed', salida: enHoras(6) }, AHORA_C), true);
  // pendiente también: pedirlo y arrepentirse es lo más normal del mundo
  assert.equal(sePuedeCancelar({ status: 'pending', salida: enHoras(6) }, AHORA_C), true);
  // y a menos de 2 h SIGUE pudiéndose: cuesta 1 $, no está prohibido
  assert.equal(sePuedeCancelar({ status: 'confirmed', salida: enHoras(1) }, AHORA_C), true);
});

test('montado, cumplido, cancelado o ya salido: no se ofrece', () => {
  assert.equal(
    sePuedeCancelar({ status: 'confirmed', boarded_at: enHoras(-1), salida: enHoras(1) }, AHORA_C),
    false,
  );
  assert.equal(sePuedeCancelar({ status: 'completed', salida: enHoras(6) }, AHORA_C), false);
  assert.equal(
    sePuedeCancelar({ status: 'cancelled_passenger', salida: enHoras(6) }, AHORA_C),
    false,
  );
  assert.equal(sePuedeCancelar({ status: 'confirmed', salida: enHoras(-1) }, AHORA_C), false);
});
