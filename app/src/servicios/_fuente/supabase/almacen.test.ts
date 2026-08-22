/**
 * El almacén partido sostiene la sesión de todo el mundo: si pierde un trozo,
 * la persona queda fuera; si deja trozos viejos, lee una sesión de ayer.
 *
 * El llavero de mentira comprueba además el límite real: ningún valor escrito
 * puede pasar de 2048 bytes, que es lo que rechaza el llavero de verdad.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { type Llavero, crearAlmacenPartido } from './almacen.ts';

/** Llavero en memoria que se planta ante un valor de más de 2048 bytes. */
function llaveroDeMentira() {
  const caja = new Map<string, string>();
  const llavero: Llavero = {
    async getItemAsync(clave) {
      return caja.has(clave) ? caja.get(clave)! : null;
    },
    async setItemAsync(clave, valor) {
      const bytes = Buffer.byteLength(valor, 'utf8');
      if (bytes > 2048) throw new Error(`el llavero rechaza ${bytes} bytes`);
      caja.set(clave, valor);
    },
    async deleteItemAsync(clave) {
      caja.delete(clave);
    },
  };
  return { llavero, caja };
}

const CLAVE = 'sb-abcdefgh-auth-token';

test('un valor corto va tal cual, sin partir', async () => {
  const { llavero, caja } = llaveroDeMentira();
  const a = crearAlmacenPartido(llavero);
  await a.setItem(CLAVE, 'hola');
  assert.equal(await a.getItem(CLAVE), 'hola');
  assert.equal(caja.size, 1);
});

test('una sesión de verdad, más grande que el tope, va y vuelve entera', async () => {
  const { llavero, caja } = llaveroDeMentira();
  const a = crearAlmacenPartido(llavero);
  // Un JWT de Supabase con datos de usuario ronda esto.
  const sesion = JSON.stringify({ access_token: 'x'.repeat(3200), user: { id: 'u' } });
  await a.setItem(CLAVE, sesion);
  assert.ok(caja.size > 1, 'debió partirse');
  assert.equal(await a.getItem(CLAVE), sesion);
});

test('ningún trozo pasa del límite del llavero, ni con acentos', async () => {
  const { llavero } = llaveroDeMentira();
  const a = crearAlmacenPartido(llavero);
  // Cada emoji ocupa 4 bytes: el caso peor que justifica cortar en 500.
  const pesado = '🔐'.repeat(2000);
  await a.setItem(CLAVE, pesado); // el llavero de mentira lanza si se pasa
  assert.equal(await a.getItem(CLAVE), pesado);
});

test('un valor más corto no deja trozos del anterior', async () => {
  const { llavero, caja } = llaveroDeMentira();
  const a = crearAlmacenPartido(llavero);
  await a.setItem(CLAVE, 'y'.repeat(4000));
  await a.setItem(CLAVE, 'corto');
  assert.equal(await a.getItem(CLAVE), 'corto');
  assert.equal(caja.size, 1, 'quedaron trozos viejos');
});

test('borrar deja el llavero vacío', async () => {
  const { llavero, caja } = llaveroDeMentira();
  const a = crearAlmacenPartido(llavero);
  await a.setItem(CLAVE, 'z'.repeat(4000));
  await a.removeItem(CLAVE);
  assert.equal(await a.getItem(CLAVE), null);
  assert.equal(caja.size, 0);
});

test('si falta un trozo no se devuelve una sesión a medias', async () => {
  const { llavero, caja } = llaveroDeMentira();
  const a = crearAlmacenPartido(llavero);
  await a.setItem(CLAVE, 'w'.repeat(4000));
  caja.delete(`${CLAVE}.p1`);
  assert.equal(await a.getItem(CLAVE), null);
});

test('un llavero que falla no tumba la app', async () => {
  const roto: Llavero = {
    async getItemAsync() {
      throw new Error('llavero bloqueado');
    },
    async setItemAsync() {},
    async deleteItemAsync() {},
  };
  assert.equal(await crearAlmacenPartido(roto).getItem(CLAVE), null);
});
