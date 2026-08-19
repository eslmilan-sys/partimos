/**
 * Les deux invariants des segments. Ce sont eux qui cassent en premier quand
 * on ajoute des arrêts intermédiaires à un produit qui n'était pas prévu pour.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findSegment,
  seatsFreeOnSegment,
  seatsTakenOnSegment,
  segmentCap,
  servedPairs,
  type SeatHold,
  type Waypoint,
} from "./segments.ts";

/** Panamá → David, avec ses quatre villes de passage réelles.
 *  Les points de rendez-vous ne comptent pas ici : ces tests portent sur les
 *  kilomètres et l'inventaire des sièges, pas sur l'affichage. */
const stop = (
  citySlug: string,
  name: string,
  km: number,
  tollCents: number,
): Waypoint => ({ citySlug, name, km, tollCents, pickupPoints: [] });

const DAVID: Waypoint[] = [
  stop("panama-city", "Ciudad de Panamá", 0, 0),
  stop("coronado", "Coronado", 85, 200),
  stop("penonome", "Penonomé", 145, 300),
  stop("santiago", "Santiago", 250, 300),
  stop("david", "David", 440, 300),
];

test("un trajet à cinq arrêts dessert dix paires de villes", () => {
  const pairs = servedPairs(DAVID);
  assert.equal(pairs.length, 10);
  assert.deepEqual(pairs[0], ["panama-city", "coronado"]);
  assert.deepEqual(pairs[9], ["santiago", "david"]);
});

test("un segment ne se parcourt que dans le sens du trajet", () => {
  assert.ok(findSegment(DAVID, "panama-city", "santiago"));
  // À contresens : le conducteur ne fait pas demi-tour.
  assert.equal(findSegment(DAVID, "santiago", "coronado"), null);
  // Ville absente du parcours.
  assert.equal(findSegment(DAVID, "panama-city", "chitre"), null);
  // Même point de montée et de descente.
  assert.equal(findSegment(DAVID, "santiago", "santiago"), null);
});

test("le kilométrage et les péages sont ceux du segment, pas du trajet", () => {
  const segment = findSegment(DAVID, "penonome", "santiago")!;
  assert.equal(segment.km, 105);
  // Les péages entre Penonomé et Santiago sont déjà tous payés avant.
  assert.equal(segment.tollCents, 0);

  const complet = findSegment(DAVID, "panama-city", "david")!;
  assert.equal(complet.km, 440);
  assert.equal(complet.tollCents, 300);
});

test("R1 — le conducteur paie encore sa part sur CHAQUE segment", () => {
  for (const [from, to] of servedPairs(DAVID)) {
    const segment = findSegment(DAVID, from, to)!;
    for (const seats of [1, 2, 3, 4]) {
      for (const category of ["economy", "standard", "suv"] as const) {
        const cap = segmentCap(segment, category, seats);
        assert.ok(
          cap.driverShareCents > 0,
          `${from}→${to} seats=${seats} ${category} : le conducteur ne paie plus rien`,
        );
        assert.equal(cap.occupants, seats + 1);
      }
    }
  }
});

test("un segment coûte moins que le trajet complet qui le contient", () => {
  const partiel = segmentCap(
    findSegment(DAVID, "panama-city", "santiago")!,
    "standard",
    3,
  );
  const complet = segmentCap(
    findSegment(DAVID, "panama-city", "david")!,
    "standard",
    3,
  );
  assert.ok(
    partiel.maxPriceCents < complet.maxPriceCents,
    "descendre à mi-chemin devrait coûter moins cher",
  );
});

test("la somme de deux segments consécutifs ne dépasse pas le trajet entier", () => {
  // Sinon on facturerait plus cher un trajet découpé que le même trajet
  // d'une traite, ce qui serait un tarif déguisé.
  const a = segmentCap(
    findSegment(DAVID, "panama-city", "santiago")!,
    "standard",
    3,
  );
  const b = segmentCap(findSegment(DAVID, "santiago", "david")!, "standard", 3);
  const entier = segmentCap(
    findSegment(DAVID, "panama-city", "david")!,
    "standard",
    3,
  );
  assert.ok(
    a.maxPriceCents + b.maxPriceCents <= entier.maxPriceCents + 100,
    "découper le trajet ne doit pas le rendre plus cher",
  );
});

test("une place se libère au point de descente", () => {
  // Deux passagers montent à Panamá et descendent à Santiago (indices 0 → 3).
  const holds: SeatHold[] = [{ fromIndex: 0, toIndex: 3, seats: 2 }];

  const avant = findSegment(DAVID, "panama-city", "santiago")!;
  assert.equal(seatsTakenOnSegment(holds, avant), 2);

  // Après Santiago, le carro est vide.
  const apres = findSegment(DAVID, "santiago", "david")!;
  assert.equal(seatsTakenOnSegment(holds, apres), 0);
  assert.equal(seatsFreeOnSegment(3, holds, apres), 3);
});

test("le tronçon le plus chargé commande, pas le premier", () => {
  // Une place occupée seulement au milieu du parcours doit bloquer un trajet
  // complet, même si le départ et l'arrivée sont libres.
  const holds: SeatHold[] = [{ fromIndex: 1, toIndex: 2, seats: 3 }];
  const complet = findSegment(DAVID, "panama-city", "david")!;

  assert.equal(seatsTakenOnSegment(holds, complet), 3);
  assert.equal(seatsFreeOnSegment(3, holds, complet), 0);

  // Mais le tronçon Santiago → David reste disponible.
  const fin = findSegment(DAVID, "santiago", "david")!;
  assert.equal(seatsFreeOnSegment(3, holds, fin), 3);
});

test("des réservations qui ne se chevauchent pas ne s'additionnent pas", () => {
  const holds: SeatHold[] = [
    { fromIndex: 0, toIndex: 1, seats: 2 },
    { fromIndex: 3, toIndex: 4, seats: 2 },
  ];
  // Sur le trajet entier, le pire tronçon porte 2 places, pas 4.
  const complet = findSegment(DAVID, "panama-city", "david")!;
  assert.equal(seatsTakenOnSegment(holds, complet), 2);
});
