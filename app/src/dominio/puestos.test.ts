import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ASIENTOS_POR_BANCO,
  MAXIMO_ATRAS,
  cambiarReparto,
  comodidadDeAtras,
  comoSeLee,
  cuantosPuestos,
  deFilas,
  puedeOfrecerSoloMujeres,
  repartoPorDefecto,
} from './puestos.ts';

test('un sedán de cinco ofrece cuatro: uno adelante y tres atrás', () => {
  /* Por defecto se ofrece lo que el carro da; bajar a dos atrás para ir
     cómodos es una decisión del conductor, no la nuestra. */
  assert.deepEqual(repartoPorDefecto(5), { adelante: 1, atras: 3 });
});

/**
 * LA VAN DE SIETE PLAZAS (01-09-2026). El catálogo ya decía que un Rush
 * ofrece seis, pero el dominio cortaba en cuatro: quien la registraba no
 * podía ofrecer su tercera fila.
 */
test('una van de siete ofrece seis: uno adelante y cinco atrás', () => {
  assert.deepEqual(repartoPorDefecto(7), { adelante: 1, atras: 5 });
  assert.equal(cuantosPuestos(repartoPorDefecto(7)), 6);
  // Y el sedán de siempre no se mueve.
  assert.deepEqual(repartoPorDefecto(5), { adelante: 1, atras: 3 });
});

test('con dos bancos no se promete «máx. 2 atrás»: sería falso', () => {
  // Cuatro atrás son tres en un banco y uno en el otro. Nadie va apretado,
  // pero tampoco es la promesa de un banco con el sitio del medio libre.
  assert.equal(comodidadDeAtras({ adelante: 1, atras: 4 }), null);
  assert.equal(comodidadDeAtras({ adelante: 1, atras: ASIENTOS_POR_BANCO }), null);
});

test('el conductor nunca se ofrece a sí mismo', () => {
  assert.equal(cuantosPuestos(repartoPorDefecto(5)), 4);
  assert.equal(cuantosPuestos(repartoPorDefecto(4)), 3);
  assert.equal(cuantosPuestos(repartoPorDefecto(2)), 1);
  assert.equal(cuantosPuestos(repartoPorDefecto(1)), 0);
});

test('las filas tienen su tope y no se pasan', () => {
  let r = { adelante: 0, atras: 0 };
  for (let i = 0; i < 9; i++) r = cambiarReparto(r, 'atras', +1);
  assert.equal(r.atras, MAXIMO_ATRAS);
  for (let i = 0; i < 9; i++) r = cambiarReparto(r, 'adelante', +1);
  assert.equal(r.adelante, 1, 'el otro asiento delantero es el del volante');
  assert.equal(cambiarReparto(r, 'atras', -9).atras, 0);
});

test('dos atrás es una comodidad que se puede prometer; tres no promete nada', () => {
  assert.equal(comodidadDeAtras({ adelante: 1, atras: 2 }), 'Máx. 2 personas atrás');
  assert.equal(comodidadDeAtras({ adelante: 0, atras: 1 }), 'Solo 1 persona atrás');
  assert.equal(comodidadDeAtras({ adelante: 1, atras: 3 }), null);
});

test('el reparto se lee en castellano y nunca queda en blanco', () => {
  assert.equal(comoSeLee({ adelante: 1, atras: 2 }), '1 adelante · 2 atrás');
  assert.equal(comoSeLee({ adelante: 0, atras: 3 }), '3 atrás');
  assert.equal(comoSeLee({ adelante: 0, atras: 0 }), 'ningún puesto');
});

test('un viaje de antes de la 0045 no se inventa el reparto', () => {
  // Sin las columnas: todo atrás, que es lo que la app enseñaba antes.
  assert.deepEqual(deFilas({ seats_offered: 3 }), { adelante: 0, atras: 3 });
  // Y entonces no promete comodidad ninguna.
  assert.equal(comodidadDeAtras(deFilas({ seats_offered: 3 })), null);
  assert.deepEqual(deFilas({ seats_offered: 3, seats_front: 1, seats_back: 2 }), {
    adelante: 1,
    atras: 2,
  });
});

test('«solo mujeres» sólo si quien maneja es mujer', () => {
  for (const si of ['f', 'F', 'female', 'mujer', 'Femenino']) {
    assert.equal(puedeOfrecerSoloMujeres(si), true, si);
  }
  for (const no of ['m', 'male', 'hombre', 'otro', '', null, undefined]) {
    assert.equal(puedeOfrecerSoloMujeres(no), false, String(no));
  }
});
