/**
 * LA BATTERIE DES POINTS DE RÉCUPÉRATION.
 *
 * Ce module décide de ce que les gens paient et de l'endroit où ils
 * attendent un inconnu, la nuit, au bord d'une route. Il se prouve.
 *
 * Les coordonnées sont celles des villes réelles du corridor Panamá →
 * Chitré, dans l'ordre où on les traverse. Les distances attendues sont
 * larges à dessein : on vérifie des PROPRIÉTÉS (l'ordre, le signe, la
 * monotonie), pas des décimales que la projection ferait bouger.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  proyectar,
  kmRecorridos,
  proponerPuntos,
  diferenciaKm,
  type Candidato,
} from "./recogida.ts";
import type { Punto } from "./desvio.ts";

/* Le corridor, d'est en ouest : Panamá → Coronado → Penonomé → Chitré. */
const PANAMA: Punto = { lat: 8.9824, lng: -79.5199 };
const CORONADO: Punto = { lat: 8.5333, lng: -79.9333 };
const PENONOME: Punto = { lat: 8.5194, lng: -80.3572 };
const CHITRE: Punto = { lat: 7.9614, lng: -80.4297 };
const RUTA: Punto[] = [PANAMA, CORONADO, PENONOME, CHITRE];

/* ── Projection ─────────────────────────────────────────────────── */

test("un point sur la route se projette avec un écart quasi nul", () => {
  const p = proyectar(CORONADO, RUTA);
  assert.ok(p);
  assert.ok(p.distanciaKm < 1, `écart ${p.distanciaKm.toFixed(2)} km`);
});

test("l'avancement croît le long de la route", () => {
  const a = proyectar(PANAMA, RUTA);
  const b = proyectar(CORONADO, RUTA);
  const c = proyectar(PENONOME, RUTA);
  const d = proyectar(CHITRE, RUTA);
  assert.ok(a && b && c && d);
  assert.ok(a.avanceKm < b.avanceKm);
  assert.ok(b.avanceKm < c.avanceKm);
  assert.ok(c.avanceKm < d.avanceKm);
});

test("un point à l'écart garde sa distance à la route", () => {
  /* ~40 km au nord de Coronado, hors de la Panaméricaine. */
  const lejos: Punto = { lat: 8.9, lng: -79.9333 };
  const p = proyectar(lejos, RUTA);
  assert.ok(p);
  assert.ok(p.distanciaKm > 15, `${p.distanciaKm.toFixed(1)} km`);
});

test("une route vide ne fabrique pas de projection", () => {
  assert.equal(proyectar(PANAMA, []), null);
});

/* ── Kilomètres réellement parcourus ────────────────────────────── */

test("descendre plus tôt fait moins de kilomètres", () => {
  const completo = kmRecorridos(PANAMA, CHITRE, RUTA);
  const corto = kmRecorridos(PANAMA, PENONOME, RUTA);
  assert.ok(completo !== null && corto !== null);
  assert.ok(corto < completo, `${corto} devrait être < ${completo}`);
});

test("monter plus loin fait aussi moins de kilomètres", () => {
  const completo = kmRecorridos(PANAMA, CHITRE, RUTA);
  const tarde = kmRecorridos(PENONOME, CHITRE, RUTA);
  assert.ok(completo !== null && tarde !== null);
  assert.ok(tarde < completo);
});

test("la distance ne dépend pas de l'ordre de saisie", () => {
  const ida = kmRecorridos(PANAMA, PENONOME, RUTA);
  const vuelta = kmRecorridos(PENONOME, PANAMA, RUTA);
  assert.equal(ida, vuelta);
});

test("les kilomètres du corridor complet sont plausibles", () => {
  /* Panamá → Chitré : 250 km par la route, moins à vol d'oiseau cumulé. */
  const km = kmRecorridos(PANAMA, CHITRE, RUTA);
  assert.ok(km !== null);
  assert.ok(km > 150 && km < 260, `${km.toFixed(0)} km`);
});

/* ── L'écart de prix, dans les DEUX sens ────────────────────────── */

test("parcourir moins donne un écart NÉGATIF", () => {
  /* Le point qui manquait : « ça le rapproche, on devrait lui décompter
     un peu ». Un écart négatif fait baisser l'aporte. */
  assert.ok(diferenciaKm(180, 250) < 0);
  assert.equal(diferenciaKm(180, 250), -70);
});

test("parcourir plus donne un écart positif", () => {
  assert.equal(diferenciaKm(258, 250), 8);
});

test("l'écart est arrondi au demi-kilomètre", () => {
  assert.equal(diferenciaKm(250.3, 250), 0.5);
  assert.equal(diferenciaKm(250.1, 250), 0);
});

/* ── Les points proposés ────────────────────────────────────────── */

const cerca = (nom: string, lat: number, lng: number): Candidato => ({
  nombre: nom,
  punto: { lat, lng },
});

test("on ne propose QUE des points proches", () => {
  const pasajero: Punto = { lat: 8.9824, lng: -79.5199 };
  const candidatos = [
    cerca("A 2 km", 8.9924, -79.5299),
    cerca("À l'autre bout du pays", 8.4333, -82.4333),
  ];
  const props = proponerPuntos(pasajero, RUTA, candidatos);
  assert.equal(props.length, 1);
  assert.equal(props[0].nombre, "A 2 km");
});

test("ON NE FAIT JAMAIS RECULER quelqu'un", () => {
  /* LE test du reproche. Le passager est à Penonomé ; un point situé à
     Coronado (bien en amont) ne doit pas être proposé, même s'il était
     géographiquement plausible : la personne ne va pas revenir en
     arrière pour monter. */
  /* LA ROUTE VA D'EST EN OUEST : Panamá (-79,5) → Chitré (-80,43). Donc
     « devant » = longitude PLUS NÉGATIVE, « derrière » = moins négative.
     Se tromper de sens ici, c'est écrire un test qui passe pour de
     mauvaises raisons. */
  const pasajero = PENONOME;
  const candidatos = [
    cerca("Penonomé, más adelante", 8.5194, -80.372),
    /* Assez près pour passer le filtre de distance : c'est bien la règle
       du SENS qui doit l'éliminer, pas celle de l'éloignement. */
    cerca("Atrás, hacia Coronado", 8.5194, -80.31),
  ];
  const props = proponerPuntos(pasajero, RUTA, candidatos);
  const nombres = props.map((p) => p.nombre);
  assert.ok(nombres.includes("Penonomé, más adelante"), nombres.join(", "));
  assert.ok(
    !nombres.includes("Atrás, hacia Coronado"),
    `on propose un point en arrière : ${nombres.join(", ")}`,
  );
});

test("le plus proche passe devant", () => {
  /* Les deux DEVANT le passager (longitude plus négative). */
  const pasajero: Punto = { lat: 8.5194, lng: -80.3572 };
  const candidatos = [
    cerca("A 4 km", 8.5194, -80.394),
    cerca("A 1 km", 8.5194, -80.366),
  ];
  const props = proponerPuntos(pasajero, RUTA, candidatos);
  assert.equal(props.length, 2, props.map((p) => p.nombre).join(", "));
  assert.equal(props[0].nombre, "A 1 km");
});

test("à distance égale, le moindre détour gagne", () => {
  /* Deux points à la même distance du passager : celui qui fait le moins
     dévier le conducteur passe devant. */
  const pasajero: Punto = { lat: 8.5294, lng: -80.3572 };
  const candidatos = [
    cerca("Sur la route", 8.5194, -80.3572),
    cerca("À l'écart", 8.5394, -80.3572),
  ];
  const props = proponerPuntos(pasajero, RUTA, candidatos);
  assert.equal(props[0].nombre, "Sur la route");
  assert.ok(props[0].desvioKm <= props[1].desvioKm);
});

test("on n'en propose jamais plus que demandé", () => {
  const pasajero: Punto = { lat: 8.5194, lng: -80.3572 };
  const candidatos = Array.from({ length: 9 }, (_, i) =>
    cerca(`P${i}`, 8.5194 + i * 0.002, -80.3572 - i * 0.002),
  );
  assert.ok(proponerPuntos(pasajero, RUTA, candidatos).length <= 4);
  assert.ok(proponerPuntos(pasajero, RUTA, candidatos, 2).length <= 2);
});

test("un point SUR la route ne coûte aucun détour", () => {
  const props = proponerPuntos(
    { lat: 8.5194, lng: -80.3572 },
    RUTA,
    [cerca("Penonomé", 8.5194, -80.3572)],
  );
  assert.equal(props[0].desvioKm, 0);
});

test("aucun candidat ne rend une liste vide, pas une erreur", () => {
  assert.deepEqual(proponerPuntos(PANAMA, RUTA, []), []);
});

test("sans route, on ne propose rien plutôt que n'importe quoi", () => {
  assert.deepEqual(proponerPuntos(PANAMA, [], [cerca("X", 8.98, -79.52)]), []);
});
