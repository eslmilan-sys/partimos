/**
 * LA RUTA ENTRE DEUX VILLES QUELCONQUES — il n'y a pas de « rutas
 * cerradas ». Ces tests verrouillent la synthèse par tronçons : les km
 * cumulés doivent retomber sur ceux du référentiel historique aux
 * villes historiques, et Divisa — le croisement d'Azuero — ne doit
 * jamais apparaître comme parada.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_CITIES, buildRoute } from "./corridors.ts";

const kmAt = (route: { waypoints: { citySlug: string; km: number }[] }, slug: string) =>
  route.waypoints.find((w) => w.citySlug === slug)?.km;

test("une paire prédéfinie garde son slug éditorial, avec les paradas denses", () => {
  const route = buildRoute("panama-city", "chitre");
  assert.ok(route);
  assert.equal(route.slug, "panama-chitre");
  assert.equal(route.distanceKm, 250);
  // Les cumuls historiques tiennent au kilomètre…
  assert.equal(kmAt(route, "la-chorrera"), 37);
  assert.equal(kmAt(route, "coronado"), 85);
  assert.equal(kmAt(route, "penonome"), 145);
  // …et les villes du réseau dense s'intercalent comme paradas possibles.
  assert.equal(kmAt(route, "aguadulce"), 190);
  assert.equal(kmAt(route, "parita"), 235);
});

test("Las Tablas → David s'arme tout seul à travers la fourche de Divisa", () => {
  const route = buildRoute("las-tablas", "david");
  assert.ok(route, "la ruta doit exister");
  assert.equal(route.waypoints[0].citySlug, "las-tablas");
  assert.equal(route.waypoints.at(-1)!.citySlug, "david");
  // 35 (Las Tablas→Chitré) + 35 (→Divisa) + 35 (→Santiago) + 190 (→David)
  assert.equal(route.distanceKm, 295);
  // Les péages se paient tous près de la capitale : cette ruta n'en a aucun.
  assert.equal(route.tollCents, 0);
  assert.equal(kmAt(route, "chitre"), 35);
  assert.equal(kmAt(route, "santiago"), 105);
  // Les pueblos du chemin sont proposés comme paradas.
  assert.equal(kmAt(route, "guarare"), 10);
  assert.equal(kmAt(route, "tole"), 175);
});

test("les km cumulés d'une synthèse retombent sur ceux du référentiel", () => {
  // Coronado → Santiago : 250 − 85 = 165 km, péage 100 (avant Penonomé).
  const route = buildRoute("coronado", "santiago");
  assert.ok(route);
  assert.equal(route.distanceKm, 165);
  assert.equal(route.tollCents, 100);
  assert.equal(kmAt(route, "penonome"), 60);
  assert.equal(kmAt(route, "aguadulce"), 105);
});

test("les embranchements se traversent : El Valle → Pedasí existe", () => {
  const route = buildRoute("el-valle", "pedasi");
  assert.ok(route);
  // El Valle→San Carlos 28, →Divisa 120 (10+20+15+15+30+15+25), →Las
  // Tablas 70 (20+15+5+20+10), →Pedasí 42 : 260 km, péage 100 à rebours ?
  // Non : le chemin repasse par Antón→Penonomé (100). 28+120+70+42 = 260.
  assert.equal(route.distanceKm, 260);
  assert.equal(kmAt(route, "chitre"), 183);
});

test("mêmes villes, ville inconnue ou champ vide : pas de ruta", () => {
  assert.equal(buildRoute("david", "david"), null);
  assert.equal(buildRoute("", "david"), null);
  assert.equal(buildRoute("david", "narnia"), null);
});

test("chaque paire des ~30 villes desservies a une ruta — aucune « cerrada »", () => {
  for (const a of ALL_CITIES) {
    for (const b of ALL_CITIES) {
      if (a.slug === b.slug) continue;
      const route = buildRoute(a.slug, b.slug);
      assert.ok(route, `${a.slug} → ${b.slug} doit avoir une ruta`);
      assert.ok(route.distanceKm > 0);
      assert.equal(route.waypoints[0].citySlug, a.slug);
      assert.equal(route.waypoints.at(-1)!.citySlug, b.slug);
      // Le croisement n'est pas une parada, et les km montent strictement.
      assert.ok(route.waypoints.every((w) => w.citySlug !== "divisa"));
      for (let i = 1; i < route.waypoints.length; i++) {
        assert.ok(route.waypoints[i].km > route.waypoints[i - 1].km);
      }
    }
  }
});
