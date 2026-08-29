import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CUANTAS_CUENTAN,
  MEDIA_DE_LA_PLATAFORMA,
  MINIMO_PARA_ENSENAR,
  PESO_DEL_PRIOR,
  cuantasFaltan,
  mediaCruda,
  notaDe,
} from './notas.ts';

/** Reseñas de una nota dada, una por día hacia atrás desde una fecha fija. */
const resenas = (...notas: number[]) =>
  notas.map((rating, i) => ({
    rating,
    created_at: new Date(Date.UTC(2026, 7, 28 - i)).toISOString(),
  }));

test('sin reseñas no hay nota, y se dice', () => {
  const n = notaDe([]);
  assert.equal(n.valor, null);
  assert.equal(n.cuantas, 0);
  assert.equal(n.comoSeLee, 'Todavía sin nota');
});

test('debajo del mínimo tampoco se enseña número, pero sí los viajes', () => {
  const n = notaDe(resenas(5, 5));
  assert.equal(n.valor, null);
  assert.equal(n.comoSeLee, 'Todavía sin nota · 2 opiniones');
  // Y se dice cuántas faltan, que es lo único accionable.
  assert.equal(cuantasFaltan(resenas(5, 5)), 1);
  assert.equal(cuantasFaltan(resenas(5, 5, 5)), 0);
});

test('la cifra nunca va sola: siempre lleva de cuántas sale', () => {
  const n = notaDe(resenas(5, 5, 5));
  assert.match(n.comoSeLee, /^\d,\d · 3 opiniones$/);
});

test('nadie llega a 5,0 con tres reseñas — y ésa es la idea', () => {
  const n = notaDe(resenas(5, 5, 5));
  // (5 × 4,6 + 15) / 8 = 4,75
  assert.equal(n.valor, 4.8);
  assert.ok(n.valor! < 5);
});

test('con muchas reseñas perfectas sí se acerca a 5', () => {
  const n = notaDe(resenas(...Array(40).fill(5)));
  // (23 + 200) / 45 = 4,955…
  assert.equal(n.valor, 5);
  assert.equal(n.cuantas, 40);
});

test('UNA nota mala no destroza a quien empieza', () => {
  const n = notaDe(resenas(5, 5, 1));
  // (23 + 11) / 8 = 4,25 — se ve, y no es un 3,7 de promedio crudo
  assert.equal(n.valor, 4.3);
  assert.equal(mediaCruda(resenas(5, 5, 1)), 3.7);
});

test('…pero tampoco se esconde: muchas malas hunden la nota', () => {
  const n = notaDe(resenas(...Array(20).fill(2)));
  // (23 + 40) / 25 = 2,52
  assert.equal(n.valor, 2.5);
});

test('sólo cuentan las últimas, para que alguien pueda recuperarse', () => {
  /* Cincuenta cincos recientes y, detrás, diez unos viejos: los viejos
     quedan fuera de la ventana y no cuentan. */
  const viejas = Array.from({ length: 10 }, (_, i) => ({
    rating: 1,
    created_at: new Date(Date.UTC(2020, 0, 1 + i)).toISOString(),
  }));
  const nuevas = resenas(...Array(CUANTAS_CUENTAN).fill(5));
  const n = notaDe([...viejas, ...nuevas]);
  assert.equal(n.cuantas, CUANTAS_CUENTAN);
  assert.equal(n.valor, 5);
});

test('el orden en que llegan las reseñas no cambia nada', () => {
  const unas = resenas(5, 4, 5, 3, 5);
  const alReves = unas.slice().reverse();
  assert.deepEqual(notaDe(unas), notaDe(alReves));
});

test('la media cruda es lo que dijo la gente, no la nota', () => {
  assert.equal(mediaCruda([]), null);
  assert.equal(mediaCruda(resenas(5, 4)), 4.5);
  // Y nunca coincide con la nota mientras el prior pese algo.
  assert.notEqual(notaDe(resenas(5, 5, 5)).valor, mediaCruda(resenas(5, 5, 5)));
});

test('las constantes dicen lo que la fórmula supone', () => {
  // El prior NO es 5: con 5 todo el mundo nace perfecto y sólo puede bajar.
  assert.ok(MEDIA_DE_LA_PLATAFORMA < 5);
  assert.ok(PESO_DEL_PRIOR > 0);
  assert.ok(MINIMO_PARA_ENSENAR >= 3);
});
