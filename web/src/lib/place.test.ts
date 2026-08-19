/**
 * LA BATTERIE DE LA RECHERCHE DE LIEUX PANAMÉENNE.
 *
 * Elle existe parce qu'un reproche précis a été formulé : « je cherche
 * Multiplaza et l'écran suivant me dit Ciudad de Panamá ». Chaque test
 * ici correspond à un cas réel du Panama, pas à une propriété abstraite.
 *
 * Le cas le plus instructif est `Super 99` : l'ancien dédoublonnage se
 * faisait sur le nom, donc les quinze Super 99 du pays s'effondraient en
 * un seul. Deux lieux homonymes à trente kilomètres sont deux lieux.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizar,
  distanciaKm,
  adivinarKind,
  ciudadDe,
  contextoDe,
  esElMismo,
  deduplicar,
  ordenar,
  aParams,
  deParams,
  desdeCiudad,
  libre,
  type PlaceRef,
} from "./place.ts";

const lugar = (p: Partial<PlaceRef> & { nombre: string }): PlaceRef => ({
  kind: "poi",
  citySlug: null,
  contexto: "",
  lat: null,
  lng: null,
  fuente: "libre",
  ...p,
});

/* ── Normalisation ──────────────────────────────────────────────── */

test("les accents disparaissent — « chiriqui » trouve « Chiriquí »", () => {
  assert.equal(normalizar("Chiriquí"), "chiriqui");
  assert.equal(normalizar("CHIRIQUÍ"), "chiriqui");
  assert.equal(normalizar("Panamá"), "panama");
  assert.equal(normalizar("  Multiplaza   Pacific "), "multiplaza pacific");
  /* Le test qui compte vraiment : les deux graphies se rejoignent. */
  assert.equal(normalizar("Chiriquí Mall"), normalizar("chiriqui mall"));
});

/* ── Typage des lieux ───────────────────────────────────────────── */

test("le type de lieu est deviné correctement pour les cas panaméens", () => {
  assert.equal(adivinarKind("David"), "ciudad");
  assert.equal(adivinarKind("Santiago"), "ciudad");
  assert.equal(adivinarKind("Multiplaza"), "mall");
  assert.equal(adivinarKind("Albrook Mall"), "mall");
  assert.equal(adivinarKind("Chiriquí Mall"), "mall");
  assert.equal(adivinarKind("Metromall"), "mall");
  assert.equal(adivinarKind("PTY"), "aeropuerto");
  assert.equal(adivinarKind("Aeropuerto Internacional de Tocumen"), "aeropuerto");
  assert.equal(adivinarKind("Terminal de Albrook"), "terminal");
  assert.equal(adivinarKind("PH Pacific Hills"), "residencial");
  assert.equal(adivinarKind("Residencial Costa Verde"), "residencial");
  assert.equal(adivinarKind("Torres del Mar"), "residencial");
});

test("une ville reste une ville même si son nom ressemble à autre chose", () => {
  /* « Santiago » existe aussi comme nom de commerce ; la ville gagne. */
  assert.equal(adivinarKind("Santiago"), "ciudad");
});

/* ── Rattachement à une ville ───────────────────────────────────── */

test("un point proche est rattaché à sa ville", () => {
  /* Multiplaza, Ciudad de Panamá. */
  assert.equal(ciudadDe({ lat: 8.9824, lng: -79.5199 }), "panama-city");
});

test("un point lointain n'est rattaché à AUCUNE ville", () => {
  /* Au large du Pacifique : rattacher ça à Panamá produirait des
     résultats de recherche faux, ce qui est pire que rien. */
  assert.equal(ciudadDe({ lat: 5.0, lng: -85.0 }), null);
});

test("faute de coordonnées, le contexte textuel suffit", () => {
  assert.equal(ciudadDe(null, "Chiriquí Mall, David, Chiriquí"), "david");
  assert.equal(ciudadDe(null, "quelque part d'inconnu"), null);
});

test("le contexte affiché ne répète jamais le nom du lieu", () => {
  const ctx = contextoDe("panama-city");
  assert.ok(!/multiplaza/i.test(ctx));
  assert.ok(ctx.length > 0);
});

/* ── Dédoublonnage : le cas Super 99 ────────────────────────────── */

test("deux Super 99 éloignés restent DEUX lieux", () => {
  const a = lugar({ nombre: "Super 99", lat: 8.98, lng: -79.52, citySlug: "panama-city" });
  const b = lugar({ nombre: "Super 99", lat: 8.43, lng: -82.43, citySlug: "david" });
  assert.equal(esElMismo(a, b), false);
  assert.equal(deduplicar([a, b]).length, 2);
});

test("le même lieu vu par deux fournisseurs n'apparaît qu'une fois", () => {
  const a = lugar({ nombre: "Multiplaza", lat: 8.9824, lng: -79.5199, fuente: "tomtom" });
  const b = lugar({ nombre: "multiplaza", lat: 8.9826, lng: -79.5201, fuente: "mapbox" });
  assert.equal(esElMismo(a, b), true);
  assert.equal(deduplicar([a, b]).length, 1);
});

test("le doublon complète le gardé au lieu d'être jeté", () => {
  /* Mapbox « suggest » ne rend pas de coordonnées ; un autre fournisseur
     si. Garder le premier et perdre le point serait absurde. */
  const sinPunto = lugar({ nombre: "Multiplaza", citySlug: "panama-city" });
  const conPunto = lugar({ nombre: "Multiplaza", lat: 8.9824, lng: -79.5199 });
  const [unico] = deduplicar([sinPunto, conPunto]);
  assert.equal(unico.lat, 8.9824);
});

/* ── Classement ─────────────────────────────────────────────────── */

test("la correspondance exacte passe devant la correspondance partielle", () => {
  const exacto = lugar({ nombre: "David", kind: "ciudad" });
  const parcial = lugar({ nombre: "Davidson Tienda", kind: "poi" });
  const [primero] = ordenar([parcial, exacto], "David");
  assert.equal(primero.nombre, "David");
});

test("« multi » rend les Multiplaza, le plus court d'abord", () => {
  const pacific = lugar({ nombre: "Multiplaza Pacific", kind: "mall" });
  const multi = lugar({ nombre: "Multiplaza", kind: "mall" });
  const otro = lugar({ nombre: "Tienda Multicolor", kind: "poi" });
  const orden = ordenar([otro, pacific, multi], "multi").map((l) => l.nombre);
  assert.equal(orden[0], "Multiplaza");
  assert.ok(orden.indexOf("Multiplaza Pacific") < orden.indexOf("Tienda Multicolor"));
});

test("notre propre base passe devant les fournisseurs externes", () => {
  const propia = lugar({ nombre: "PH Torre Mistral", fuente: "propia" });
  const externo = lugar({ nombre: "PH Torre Mistral", fuente: "locationiq", lat: 9.9, lng: -79.9 });
  const [primero] = ordenar([externo, propia], "PH Torre Mistral");
  assert.equal(primero.fuente, "propia");
});

test("un terminal passe devant un magasin à correspondance égale", () => {
  const terminal = lugar({ nombre: "Albrook", kind: "terminal" });
  const tienda = lugar({ nombre: "Albrook", kind: "poi" });
  const [primero] = ordenar([tienda, terminal], "Albrook");
  assert.equal(primero.kind, "terminal");
});

test("la proximité départage sans écraser la correspondance du nom", () => {
  /* Un nom EXACT loin doit battre un nom PARTIEL proche : sinon
     chercher « David » depuis Panamá rendrait des boutiques de Panamá. */
  const exactoLejos = lugar({ nombre: "David", kind: "ciudad", lat: 8.43, lng: -82.43 });
  const parcialCerca = lugar({ nombre: "David Tienda", kind: "poi", lat: 8.98, lng: -79.52 });
  const [primero] = ordenar(
    [parcialCerca, exactoLejos],
    "David",
    { lat: 8.98, lng: -79.52 },
  );
  assert.equal(primero.nombre, "David");
});

/* ── Le contexte survit au changement d'écran ───────────────────── */

test("MULTIPLAZA SURVIT À L'ALLER-RETOUR PAR L'URL", () => {
  /* LE test de ce module. C'est exactement le parcours qui échouait. */
  const origen: PlaceRef = {
    nombre: "Multiplaza",
    kind: "mall",
    citySlug: "panama-city",
    contexto: "Panamá",
    lat: 8.9824,
    lng: -79.5199,
    fuente: "tomtom",
  };
  const params = new URLSearchParams(aParams(origen, "o"));
  const vuelta = deParams(params, "o");

  assert.ok(vuelta);
  assert.equal(vuelta.nombre, "Multiplaza", "le nom choisi ne doit JAMAIS devenir la ville");
  assert.equal(vuelta.citySlug, "panama-city", "la ville reste disponible pour le matching");
  assert.equal(vuelta.kind, "mall");
  assert.ok(vuelta.lat !== null && Math.abs(vuelta.lat - 8.9824) < 0.001);
});

test("Chiriquí Mall survit aussi, accents compris", () => {
  const destino: PlaceRef = {
    nombre: "Chiriquí Mall",
    kind: "mall",
    citySlug: "david",
    contexto: "David · Chiriquí",
    lat: 8.4333,
    lng: -82.4333,
    fuente: "locationiq",
  };
  const vuelta = deParams(new URLSearchParams(aParams(destino, "d")), "d");
  assert.equal(vuelta?.nombre, "Chiriquí Mall");
  assert.equal(vuelta?.citySlug, "david");
});

test("une ville choisie comme ville garde son nom de ville", () => {
  /* Le seul cas où la ville EST légitimement le libellé. */
  const ciudad = desdeCiudad("david");
  assert.ok(ciudad);
  const vuelta = deParams(new URLSearchParams(aParams(ciudad, "o")), "o");
  assert.equal(vuelta?.kind, "ciudad");
  assert.ok(/david/i.test(vuelta?.nombre ?? ""));
});

test("une URL vide ne fabrique pas un lieu fantôme", () => {
  assert.equal(deParams(new URLSearchParams(""), "o"), null);
});

test("une URL ancienne (ville seule) reste lisible", () => {
  /* Compatibilité : les liens déjà partagés portent `?o=david` sans nom.
     Ils doivent continuer à marcher, sinon on casse le partage WhatsApp. */
  const vuelta = deParams(new URLSearchParams("o=david"), "o");
  assert.equal(vuelta?.citySlug, "david");
  assert.equal(vuelta?.kind, "ciudad");
  assert.ok((vuelta?.nombre ?? "").length > 0);
});

/* ── Saisie libre ───────────────────────────────────────────────── */

test("un lieu qu'aucune base ne connaît reste un lieu valable", () => {
  const l = libre("frente a la casa amarilla", "chitre");
  assert.equal(l.nombre, "frente a la casa amarilla");
  assert.equal(l.citySlug, "chitre");
  assert.equal(l.kind, "libre");
  /* Il hérite du point de la ville : le matching fonctionne quand même. */
  assert.ok(l.lat !== null);
});

test("la distance haversine est plausible sur une route réelle", () => {
  /* Panamá → David : environ 440 km par la route, ~350 à vol d'oiseau. */
  const km = distanciaKm({ lat: 8.9824, lng: -79.5199 }, { lat: 8.4333, lng: -82.4333 });
  assert.ok(km > 300 && km < 400, `attendu 300–400 km, obtenu ${km.toFixed(0)}`);
});
