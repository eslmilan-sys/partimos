import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type ReservaCerrable,
  VENTANA_PARA_CONFIRMAR_MS,
  cuandoSeCierraSola,
  estadoDelCierre,
  sePuedeConfirmar,
} from './cierre.ts';

const LLEGADA = '2026-08-27T14:00:00.000Z';
const en = (ms: number) => new Date(new Date(LLEGADA).getTime() + ms);

const reserva = (r: Partial<ReservaCerrable> = {}): ReservaCerrable => ({
  boardedAt: '2026-08-27T11:00:00.000Z',
  releasedAt: null,
  llegadaPrevista: LLEGADA,
  ...r,
});

test('quien no se ha subido no tiene nada que confirmar', () => {
  assert.equal(estadoDelCierre(reserva({ boardedAt: null }), en(0)), 'sin-subir');
  assert.equal(sePuedeConfirmar(reserva({ boardedAt: null }), en(0)), false);
});

test('en camino todavía no se pregunta: no se da por bueno lo que no ha pasado', () => {
  assert.equal(estadoDelCierre(reserva(), en(-60 * 60_000)), 'en-camino');
  assert.equal(sePuedeConfirmar(reserva(), en(-60 * 60_000)), false);
});

test('al llegar se puede decir que todo fue bien', () => {
  assert.equal(estadoDelCierre(reserva(), en(0)), 'por-confirmar');
  assert.equal(estadoDelCierre(reserva(), en(3600_000)), 'por-confirmar');
  assert.equal(sePuedeConfirmar(reserva(), en(3600_000)), true);
});

test('a las 24 h se da por bueno solo', () => {
  const justoAntes = en(VENTANA_PARA_CONFIRMAR_MS - 1000);
  const justoDespues = en(VENTANA_PARA_CONFIRMAR_MS);
  assert.equal(estadoDelCierre(reserva(), justoAntes), 'por-confirmar');
  assert.equal(estadoDelCierre(reserva(), justoDespues), 'se-cierra-sola');
  // Y el botón sigue valiendo: el reloj se adelantó, no cambió de opinión.
  assert.equal(sePuedeConfirmar(reserva(), justoDespues), true);
});

test('una reserva cerrada se queda cerrada', () => {
  const cerrada = reserva({ releasedAt: '2026-08-27T15:00:00.000Z' });
  assert.equal(estadoDelCierre(cerrada, en(0)), 'cerrada');
  assert.equal(sePuedeConfirmar(cerrada, en(0)), false);
  assert.equal(cuandoSeCierraSola(cerrada), null);
});

test('sin hora de llegada se puede confirmar desde que subió', () => {
  // Una ruta libre publicada sin duración: existe, y no puede quedarse
  // abierta para siempre por no tener reloj del que colgar las 24 h.
  const sinReloj = reserva({ llegadaPrevista: null });
  assert.equal(estadoDelCierre(sinReloj, en(0)), 'por-confirmar');
  assert.equal(cuandoSeCierraSola(sinReloj), null);
});

test('el momento en que se cerraría sola se puede decir en voz alta', () => {
  assert.equal(
    cuandoSeCierraSola(reserva()),
    new Date(new Date(LLEGADA).getTime() + VENTANA_PARA_CONFIRMAR_MS).toISOString(),
  );
  assert.equal(cuandoSeCierraSola(reserva({ boardedAt: null })), null);
});
