import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type Verificacion, estadoDe, laQueVale, soloDe, vale } from './verificacion.ts';

const AHORA = new Date('2026-08-28T12:00:00Z');
const dia = (d: string) => `2026-08-${d}T12:00:00Z`;

/**
 * LAS FILAS DE VERDAD que destaparon el fallo, copiadas de la base el
 * 28-08-2026 (`identity_verifications`, perfil 13daedba…). Dos sesiones
 * abandonadas del 15 y el 16, barridas a `expired` los días 22 y 23 — o sea
 * DESPUÉS de que la persona se verificara, el 17.
 */
const LAS_DE_LA_BASE: Verificacion[] = [
  { status: 'expired', created_at: dia('16'), updated_at: dia('23'), expires_at: null },
  { status: 'expired', created_at: dia('15'), updated_at: dia('22'), expires_at: null },
  { status: 'verified', created_at: dia('17'), updated_at: dia('17'), expires_at: null },
  { status: 'verified', created_at: dia('17'), updated_at: dia('17'), expires_at: null },
];

test('un barrido posterior no descalifica una verificación conseguida', () => {
  /* Éste es EL caso: ordenando por `updated_at` ganaba una sesión abandonada
     y la app decía «Pendiente» a alguien que Didit daba por verificado. */
  assert.equal(estadoDe(LAS_DE_LA_BASE, AHORA), 'verificada');
  assert.equal(laQueVale(LAS_DE_LA_BASE, AHORA)?.status, 'verified');
});

test('sin ninguna fila, pendiente', () => {
  assert.equal(estadoDe([], AHORA), 'pendiente');
  assert.equal(laQueVale([], AHORA), undefined);
});

test('un rechazo reciente sí manda: no hay ninguna verificada en pie', () => {
  const filas: Verificacion[] = [
    { status: 'rejected', created_at: dia('20'), updated_at: dia('20') },
    { status: 'pending', created_at: dia('19'), updated_at: dia('19') },
  ];
  assert.equal(estadoDe(filas, AHORA), 'rechazada');
});

test('verificada pero pasada de fecha vuelve a estar pendiente', () => {
  const filas: Verificacion[] = [
    { status: 'verified', created_at: dia('10'), updated_at: dia('10'), expires_at: dia('20') },
  ];
  assert.equal(vale(filas[0], AHORA), false);
  assert.equal(estadoDe(filas, AHORA), 'pendiente');
});

test('…y si te volviste a verificar después de caducar, estás al día', () => {
  const filas: Verificacion[] = [
    { status: 'verified', created_at: dia('10'), updated_at: dia('10'), expires_at: dia('20') },
    { status: 'verified', created_at: dia('21'), updated_at: dia('21'), expires_at: null },
  ];
  assert.equal(estadoDe(filas, AHORA), 'verificada');
});

test('una sesión abandonada, sola, es «pendiente» y no un veredicto', () => {
  const filas: Verificacion[] = [{ status: 'expired', created_at: dia('20'), updated_at: dia('23') }];
  assert.equal(estadoDe(filas, AHORA), 'pendiente');
});

test('en revisión mientras Didit no ha contestado', () => {
  const filas: Verificacion[] = [{ status: 'pending', created_at: dia('27'), updated_at: dia('27') }];
  assert.equal(estadoDe(filas, AHORA), 'en revisión');
});

test('el orden en que llegan las filas no cambia el resultado', () => {
  assert.equal(estadoDe(LAS_DE_LA_BASE.slice().reverse(), AHORA), 'verificada');
});

/* ── Dos documentos, dos vidas (28-08-2026) ──────────────────────────── */

test('la licencia verificada no hace pasar por buena la cédula', () => {
  const filas: Verificacion[] = [
    { status: 'verified', document_type: 'DL', created_at: dia('20'), updated_at: dia('20') },
    { status: 'rejected', document_type: 'ID', created_at: dia('21'), updated_at: dia('21') },
  ];
  assert.equal(estadoDe(soloDe(filas, 'ID'), AHORA), 'rechazada');
  assert.equal(estadoDe(soloDe(filas, 'DL'), AHORA), 'verificada');
});

test('sin `document_type` se toma por cédula: es lo que había antes de Didit', () => {
  const viejas: Verificacion[] = [{ status: 'verified', created_at: dia('17'), updated_at: dia('17') }];
  assert.equal(soloDe(viejas, 'ID').length, 1);
  assert.equal(soloDe(viejas, 'DL').length, 0);
});

test('sin licencia presentada, el estado es «pendiente», no «verificada»', () => {
  const soloCedula: Verificacion[] = [
    { status: 'verified', document_type: 'ID', created_at: dia('17'), updated_at: dia('17') },
  ];
  assert.equal(estadoDe(soloDe(soloCedula, 'DL'), AHORA), 'pendiente');
});
