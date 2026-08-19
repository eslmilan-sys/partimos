/**
 * LA BATTERIE DU BADGE « TOP ».
 *
 * Un badge de confiance est une promesse faite à quelqu'un qui va monter
 * dans la voiture d'un inconnu. Les seuils se testent, et surtout leur
 * REVERSIBILITÉ : ce qui se gagne doit pouvoir se perdre, sinon ce n'est
 * pas une réputation, c'est un privilège.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  esTopConductor,
  faltaParaTop,
  bonusReputacion,
  TOP_MINIMO,
} from "./conductor.ts";

const c = (rating: number, ridesCount: number, isVerified = true) => ({
  rating,
  ridesCount,
  isVerified,
});

test("il faut la note ET les viajes ET la vérification", () => {
  assert.equal(esTopConductor(c(4.9, 60)), true);
  assert.equal(esTopConductor(c(4.9, 60, false)), false, "non vérifié");
  assert.equal(esTopConductor(c(4.5, 60)), false, "note trop basse");
  assert.equal(esTopConductor(c(4.9, 3)), false, "pas assez de viajes");
});

test("un 5,0 sur deux courses n'est PAS un top conductor", () => {
  /* Le cas qui justifie le seuil de viajes : deux avis ne sont pas une
     réputation, c'est un échantillon. */
  assert.equal(esTopConductor(c(5.0, 2)), false);
});

test("le badge se PERD si la note redescend", () => {
  const antes = c(4.9, 120);
  assert.equal(esTopConductor(antes), true);
  const despues = c(4.6, 130);
  assert.equal(esTopConductor(despues), false);
});

test("les seuils sont pile aux bornes annoncées", () => {
  assert.equal(esTopConductor(c(TOP_MINIMO.nota, TOP_MINIMO.viajes)), true);
  assert.equal(esTopConductor(c(TOP_MINIMO.nota - 0.1, TOP_MINIMO.viajes)), false);
  assert.equal(esTopConductor(c(TOP_MINIMO.nota, TOP_MINIMO.viajes - 1)), false);
});

test("on dit CE QU'IL MANQUE, jamais rien", () => {
  assert.equal(faltaParaTop(c(4.9, 120)), null, "déjà top");
  assert.match(faltaParaTop(c(4.9, 20)) ?? "", /5 viajes/);
  assert.match(faltaParaTop(c(4.9, 24)) ?? "", /1 viaje\b/, "singulier");
  assert.match(faltaParaTop(c(4.2, 90)) ?? "", /4\.8/);
  assert.match(faltaParaTop(c(4.9, 90, false)) ?? "", /[Vv]erifica/);
});

/* ── Le poids dans la recherche ─────────────────────────────────── */

test("un top conductor pèse plus qu'un conducteur ordinaire", () => {
  assert.ok(bonusReputacion(c(4.9, 120)) > bonusReputacion(c(4.3, 40)));
});

test("un nouveau conducteur n'est PAS enterré", () => {
  /* La règle qui protège la marketplace : si la réputation écrasait
     tout, un nouveau n'aurait jamais l'occasion d'en construire une. Son
     écart avec un vétéran reste inférieur au poids d'un bon horaire. */
  const nuevo = bonusReputacion(c(0, 0, true));
  const veterano = bonusReputacion(c(4.9, 300));
  assert.ok(nuevo > 0, "un nouveau vérifié compte quand même");
  assert.ok(veterano - nuevo < 30, `écart ${veterano - nuevo}`);
});

test("l'expérience s'aplatit — 200 à 400 viajes vaut moins que 5 à 50", () => {
  const a = bonusReputacion(c(4.9, 50)) - bonusReputacion(c(4.9, 5));
  const b = bonusReputacion(c(4.9, 400)) - bonusReputacion(c(4.9, 200));
  assert.ok(a > b, `${a} devrait dépasser ${b}`);
});

test("la vérification pèse toujours, même sans note", () => {
  assert.ok(bonusReputacion(c(0, 0, true)) > bonusReputacion(c(0, 0, false)));
});
