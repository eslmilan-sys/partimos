import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cuandoCaduca, estadoDeSolicitud, porQueCaduco, sePuedeAceptar } from './solicitud.ts';

const AHORA = new Date('2026-08-28T12:00:00Z');
const enHoras = (h: number) => new Date(AHORA.getTime() + h * 3_600_000).toISOString();

test('viva mientras queden las dos cosas: plazo y viaje por delante', () => {
  const s = { expiraEn: enHoras(3), salida: enHoras(20) };
  assert.equal(estadoDeSolicitud(s, AHORA), 'pendiente');
  assert.equal(sePuedeAceptar(s, AHORA), true);
  assert.equal(porQueCaduco(s, AHORA), null);
});

test('EL VIAJE YA SALIÓ: caducada aunque queden horas de plazo', () => {
  /* Éste es el fallo que el dueño vio el 28-08: la solicitud se enseñaba
     pendiente —sus cuatro horas seguían corriendo— y se dejaba aceptar un
     puesto en un carro que se había ido. */
  const s = { expiraEn: enHoras(3), salida: enHoras(-2) };
  assert.equal(estadoDeSolicitud(s, AHORA), 'caducada');
  assert.equal(sePuedeAceptar(s, AHORA), false);
  assert.equal(porQueCaduco(s, AHORA), 'ya-salio');
});

test('se pasaron las cuatro horas: caducada aunque el viaje sea mañana', () => {
  const s = { expiraEn: enHoras(-1), salida: enHoras(20) };
  assert.equal(estadoDeSolicitud(s, AHORA), 'caducada');
  assert.equal(porQueCaduco(s, AHORA), 'sin-responder');
});

test('manda el reloj que llegue primero, no el que quede más lejos', () => {
  // La salida antes que el plazo
  assert.equal(cuandoCaduca({ expiraEn: enHoras(5), salida: enHoras(2) }), enHoras(2));
  // El plazo antes que la salida
  assert.equal(cuandoCaduca({ expiraEn: enHoras(2), salida: enHoras(5) }), enHoras(2));
});

test('con los dos vencidos, la razón que se dice es la que se entiende', () => {
  /* Las cuatro horas también pasaron, pero lo que la persona ve al mirar el
     reloj es que el viaje era ayer. Ésa es la que se cuenta. */
  const s = { expiraEn: enHoras(-6), salida: enHoras(-2) };
  assert.equal(porQueCaduco(s, AHORA), 'ya-salio');
});

test('justo en la hora de salida ya no se acepta', () => {
  assert.equal(sePuedeAceptar({ expiraEn: enHoras(3), salida: enHoras(0) }, AHORA), false);
});
