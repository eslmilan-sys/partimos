import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONSUMO_L_100KM,
  aporteCalculado,
  costoDelViaje,
  loQuePonesDeTuBolsillo,
  loQueRecuperas,
  elTopeMuerde,
  origenDelAporte,
  rangoRecomendado,
  tasaPorKm,
  topeDeRuta,
} from './aporte.ts';
import { tarifaDeServicio, totalQuePagaElPasajero } from './tarifas.ts';
import { calcularReembolso } from './reembolsos.ts';

/** Albrook → Chitré, el viaje de referencia de `5d`. */
const CHITRE = {
  distanciaKm: 250,
  peajeCentavos: 300,
  consumoL100km: CONSUMO_L_100KM.standard,
};

/* La tabla de referencia es la de CONSUMO.md (24-08-2026): gasolina a
   1,27 $/L y el sedán a 7,5 L/100 km. Las cifras viejas —20,60 / 7 / 6—
   salían de 0,80 $/L, que nunca fue el precio panameño. */

test('un sedán gasta 9,5 centavos por kilómetro', () => {
  assert.equal(Math.round(tasaPorKm(CONSUMO_L_100KM.standard) * 1000) / 1000, 9.525);
});

test('el costo del viaje de referencia es 29,19 $', () => {
  assert.equal(costoDelViaje(CHITRE), 2919);
});

test('el tope de la ruta a Chitré es 10 $', () => {
  assert.equal(topeDeRuta(costoDelViaje(CHITRE)), 1000);
});

test('el aporte por defecto con 3 puestos es 7,29 $', () => {
  const costo = costoDelViaje(CHITRE);
  // 29,19 entre los cuatro que van son 7,2975: al centavo de ABAJO, 7,29.
  // Los tres centavos que no se dividen los pone quien maneja.
  assert.equal(aporteCalculado(costo, 3, topeDeRuta(costo)), 729);
});

test('el aporte baja al añadir puestos y nunca pasa del tope', () => {
  const costo = costoDelViaje(CHITRE);
  const tope = topeDeRuta(costo);
  assert.deepEqual(
    [1, 2, 3, 4].map((p) => aporteCalculado(costo, p, tope)),
    [1000, 973, 729, 583],
  );
});

/**
 * LA PREGUNTA DEL DUEÑO, 01-09-2026: «why we redondean like this? all pay
 * exact the same brother».
 *
 * El invariante de abajo —«el conductor nunca pone menos»— sólo pedía una
 * desigualdad, y el redondeo al dólar la cumplía dejando al conductor 2,19 $
 * por encima de cada pasajero. Éste pide lo otro: que la diferencia sea de
 * centavos y no de dólares. **Nunca más de un centavo por puesto**, que es
 * exactamente lo que sobra al dividir.
 */
test('todos ponen lo mismo: la diferencia es de centavos, no de dólares', () => {
  for (let costo = 500; costo <= 9000; costo += 37) {
    const tope = topeDeRuta(costo);
    for (let puestos = 1; puestos <= 4; puestos++) {
      const aporte = aporteCalculado(costo, puestos, tope);
      if (elTopeMuerde(costo, puestos, tope)) continue; // ahí manda el tope, no el reparto
      const suyo = costo - loQueRecuperas(aporte, puestos);
      assert.ok(
        suyo - aporte <= puestos,
        `con ${costo} y ${puestos} puestos: pasajero ${aporte}, conductor ${suyo}`,
      );
    }
  }
});

/**
 * LA PREGUNTA DEL DUEÑO, 30-08-2026, convertida en invariante:
 * «si todos ponen 7, ¿por qué yo pago 4,86?».
 *
 * Con el redondeo hacia arriba que había, lo que le quedaba al conductor caía
 * SIEMPRE por debajo de lo que ponía cada pasajero — no era un caso raro,
 * era la aritmética. Esto lo barre: cualquier costo, cualquier número de
 * puestos.
 */
test('el conductor nunca pone menos que un pasajero', () => {
  for (let costo = 500; costo <= 9000; costo += 37) {
    const tope = topeDeRuta(costo);
    for (let puestos = 1; puestos <= 4; puestos++) {
      const aporte = aporteCalculado(costo, puestos, tope);
      const suyo = costo - loQueRecuperas(aporte, puestos);
      assert.ok(
        suyo >= aporte,
        `con ${costo} y ${puestos} puestos: cada pasajero pone ${aporte} y el conductor ${suyo}`,
      );
    }
  }
});

/**
 * R1 POR LA PUERTA DE ATRÁS. El tope se calcula sobre TRES puestos de
 * referencia; un carro que ofrece cuatro podía pedirlo en los cuatro y
 * recuperar más de lo que gastó. Alcanzable con el deslizador de `5c`.
 */
test('ni con el carro lleno y el aporte al máximo se recupera el viaje entero', () => {
  for (let costo = 500; costo <= 9000; costo += 37) {
    const tope = topeDeRuta(costo);
    for (let puestos = 1; puestos <= 4; puestos++) {
      const aporte = aporteCalculado(costo, puestos, tope);
      assert.ok(loQueRecuperas(aporte, puestos) < costo, `${costo} con ${puestos} puestos`);
    }
  }
});

test('el suelo de 3 $ no sube el reparto: subirlo haría ganar dinero', () => {
  const coronado = costoDelViaje({ distanciaKm: 85, peajeCentavos: 200, consumoL100km: 8 });
  assert.equal(coronado, 1150);
  // El reparto entre cinco da 2,30. A 3 $ el conductor recuperaría 12 de 11,50.
  const aporte = aporteCalculado(coronado, 4, topeDeRuta(coronado));
  assert.equal(aporte, 230);
  assert.ok(loQueRecuperas(aporte, 4) < coronado);
});

test('con el carro lleno el conductor recupera 21,87 $ de 29,19 $ y pone 7,32 $', () => {
  const costo = costoDelViaje(CHITRE);
  const recupera = loQueRecuperas(729, 3);
  assert.equal(recupera, 2187);
  // R1 en una línea: ni lleno recupera lo que gastó. Y pone tres centavos más
  // que cada pasajero — los que no se dividen entre cuatro.
  assert.equal(loQuePonesDeTuBolsillo(costo, recupera), 732);
});

test('la pastilla dice de dónde sale la cifra', () => {
  assert.equal(origenDelAporte(null, 600, 700), 'sugerido');
  assert.equal(origenDelAporte(500, 500, 700), 'lo cambiaste');
  assert.equal(origenDelAporte(700, 700, 700), 'tope de la ruta');
  // Topado SIN que nadie haya tocado la cifra: la pastilla dice el tope, no
  // «sugerido». Es la pregunta de «¿por qué de 1 a 2 puestos no cambia?».
  assert.equal(origenDelAporte(null, 700, 700), 'tope de la ruta');
});

test('ofrecer menos puestos NO sube el aporte: sería un recargo por el último', () => {
  const costo = costoDelViaje(CHITRE);
  const tope = topeDeRuta(costo);
  const conUno = aporteCalculado(costo, 1, tope);
  const conDos = aporteCalculado(costo, 2, tope);
  // El reparto crudo sí sube al ofrecer menos…
  assert.ok(costo / 2 > costo / 3);
  // …pero el tope de la ruta lo corta antes de que se dispare: con un solo
  // puesto el reparto daría 14,59 y sale el tope, 10.
  assert.equal(conUno, tope);
  assert.ok(conUno - conDos <= 100);
  // Y la pantalla puede decir por qué.
  assert.equal(elTopeMuerde(costo, 1, tope), true);
  assert.equal(elTopeMuerde(costo, 3, tope), false);
});

test('el tope no sube porque el conductor maneje una camioneta', () => {
  const sedan = costoDelViaje(CHITRE);
  const suv = costoDelViaje({ ...CHITRE, consumoL100km: CONSUMO_L_100KM.suv });
  assert.ok(suv > sedan);
  // el tope es de la ruta: se calcula con el carro de referencia, no con el suyo
  assert.equal(topeDeRuta(sedan), 1000);
});

test('las tarifas sobre un aporte de 6 $', () => {
  assert.equal(tarifaDeServicio(600, 'yappy_app'), 30);
  assert.equal(tarifaDeServicio(600, 'card'), 48);
  assert.equal(tarifaDeServicio(600, 'external'), 0);
  assert.equal(totalQuePagaElPasajero(600, 'yappy_app'), 630);
});

// El traspaso es explícito: a más de 2 h vuelve **entero, tarifa incluida**,
// 6,30 $ sobre un viaje de 6 $ con Yappy. No retenemos nada por algo que
// todavía no nos ha costado nada.
test('cancelo yo con tiempo: vuelve todo, tarifa incluida', () => {
  const r = calcularReembolso({
    motivo: 'yo',
    aporteCentavos: 600,
    tarifaCentavos: 30,
    horasAntesDeLaSalida: 19,
  });
  assert.equal(r.montoCentavos, 630);
  assert.equal(r.retenidoCentavos, 0);
  assert.equal(r.paraElConductorCentavos, 0);
});

test('cancelo yo a última hora: el conductor se queda 1 $', () => {
  const r = calcularReembolso({
    motivo: 'yo',
    aporteCentavos: 600,
    tarifaCentavos: 30,
    horasAntesDeLaSalida: 1,
  });
  assert.equal(r.montoCentavos, 500);
  assert.equal(r.paraElConductorCentavos, 100);
});

test('si falla el otro, vuelve todo con tarifa incluida', () => {
  for (const motivo of ['conductor', 'novino', 'nopaso'] as const) {
    const r = calcularReembolso({
      motivo,
      aporteCentavos: 600,
      tarifaCentavos: 30,
      horasAntesDeLaSalida: 19,
    });
    assert.equal(r.montoCentavos, 630, motivo);
    assert.equal(r.retenidoCentavos, 0, motivo);
  }
});

/**
 * LA BANDA RECOMENDADA (01-09-2026). El dueño pidió poder pedir un 10 % MÁS
 * que lo calculado, con BlaBlaCar delante. Por arriba no se puede —el reparto
 * ES el tope de R1— así que el margen va hacia abajo: la banda buena termina
 * exactamente en el reparto y empieza un 10 % antes.
 */
test('el rango recomendado nunca pasa del reparto: por arriba está R1', () => {
  const costo = costoDelViaje(CHITRE);
  const tope = topeDeRuta(costo);
  for (let puestos = 1; puestos <= 4; puestos++) {
    const calculado = aporteCalculado(costo, puestos, tope);
    const { desde, hasta } = rangoRecomendado(calculado);
    assert.equal(hasta, calculado, 'el techo de la banda es el aporte calculado');
    assert.ok(desde < hasta && desde >= calculado * 0.89);
    // Y ni en el extremo alto de la banda se recupera el viaje entero.
    assert.ok(loQueRecuperas(hasta, puestos) < costo);
  }
});
