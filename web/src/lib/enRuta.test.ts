/**
 * LA BATTERIE DE LA MONTÉE EN COURS DE ROUTE.
 *
 * Ce que ces tests protègent n'est pas un calcul, c'est une PROMESSE :
 * l'heure qu'on affiche à quelqu'un qui attend au bord de la route. S'ils
 * cassent, quelqu'un attend pour rien un matin à Penonomé.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  franja,
  explicacion,
  hora,
  margenDeEspera,
  minutosDesdeLaSalida,
} from "./enRuta.ts";

const salida = "2026-08-20T06:00:00-05:00";
const enPunto = (minutos: number) =>
  new Date(new Date(salida).getTime() + minutos * 60_000).toISOString();

test("au départ du conducteur, il n'y a AUCUNE marge à annoncer", () => {
  /* Le conducteur est chez lui : c'est la seule heure ferme du produit.
     Y coller une fenêtre ferait douter de tout le reste. */
  assert.equal(
    margenDeEspera({ departureAt: salida, boardingAt: salida, enRuta: false }),
    null,
  );
});

test("en cours de route, la marge existe toujours", () => {
  const m = margenDeEspera({
    departureAt: salida,
    boardingAt: enPunto(20),
    enRuta: true,
  });
  assert.ok(m !== null && m >= 5, `marge ${m}`);
});

test("plus on monte tard, plus la marge est large", () => {
  const cerca = margenDeEspera({
    departureAt: salida,
    boardingAt: enPunto(30),
    enRuta: true,
  })!;
  const lejos = margenDeEspera({
    departureAt: salida,
    boardingAt: enPunto(200),
    enRuta: true,
  })!;
  assert.ok(lejos > cerca, `${lejos} devrait dépasser ${cerca}`);
});

test("elle est plafonnée : au-delà, un chiffre n'informe plus", () => {
  const m = margenDeEspera({
    departureAt: salida,
    boardingAt: enPunto(900),
    enRuta: true,
  });
  assert.equal(m, 40);
});

test("elle tombe toujours sur un multiple de cinq minutes", () => {
  for (const rodado of [7, 23, 61, 118, 217, 340]) {
    const m = margenDeEspera({
      departureAt: salida,
      boardingAt: enPunto(rodado),
      enRuta: true,
    })!;
    assert.equal(m % 5, 0, `${rodado} min → marge ${m}`);
  }
});

test("les minutes déjà roulées se comptent depuis le départ", () => {
  assert.equal(
    minutosDesdeLaSalida({ departureAt: salida, boardingAt: enPunto(95) }),
    95,
  );
  /* Une montée AVANT le départ n'existe pas ; elle ne doit surtout pas
     rendre un nombre négatif qui élargirait la marge à l'envers. */
  assert.equal(
    minutosDesdeLaSalida({ departureAt: salida, boardingAt: enPunto(-40) }),
    0,
  );
});

/* ── La fenêtre affichée ─────────────────────────────────────────── */

test("la fenêtre ne va QUE vers l'avant", () => {
  /* « 07:50 – 08:20 » ferait arriver le passager trente minutes trop
     tôt. Un conducteur n'arrive pas en avance à un point intermédiaire. */
  const texto = franja(enPunto(120), 15);
  const [inicio] = texto.split(" – ");
  assert.equal(inicio, hora(enPunto(120)));
  assert.match(texto, / – /);
});

test("sans marge, la fenêtre est une heure toute simple", () => {
  assert.equal(franja(salida, null), hora(salida));
  assert.ok(!franja(salida, null).includes("–"));
});

test("la fin de la fenêtre est bien la marge plus tard", () => {
  const texto = franja(enPunto(60), 20);
  const [, fin] = texto.split(" – ");
  assert.equal(fin, hora(enPunto(80)));
});

/* ── Ce qu'on écrit ──────────────────────────────────────────────── */

test("l'explication nomme d'où vient le conducteur et combien ça peut décaler", () => {
  const t = explicacion({ conductor: "Ana", origen: "Panamá", margenMin: 15 });
  assert.match(t, /Ana/);
  assert.match(t, /Panamá/);
  assert.match(t, /15/);
});

test("au départ, elle ne parle NI de retard NI d'approximation", () => {
  const t = explicacion({ conductor: "Ana", origen: "Panamá", margenMin: null });
  assert.ok(!/aproximada/i.test(t), t);
  assert.ok(!/después/i.test(t), t);
});

test("elle ne promet jamais au nom du conducteur (R4)", () => {
  /* « llega a las » serait un engagement de la plateforme sur l'horaire
     de quelqu'un d'autre. On décrit, on ne garantit pas. */
  for (const m of [null, 10, 40]) {
    const t = explicacion({ conductor: "Ana", origen: "Panamá", margenMin: m });
    assert.ok(!/garantiza|puntual|llega a las/i.test(t), t);
  }
});
