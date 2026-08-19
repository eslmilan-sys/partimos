/**
 * La droite du catalogue doit passer EXACTEMENT par les trois taux du
 * barème §7. Si ce test casse, quelqu'un a déplacé la droite — et le
 * calcul par carro réel ne prolonge plus le barème, il le contredit.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RATE_LINE,
  agedConsumption,
  categoryFromConsumption,
  rateFromConsumption,
  CAR_CATALOG,
  findCar,
} from "./cars.ts";
import { RATE_PER_KM_CENTS, computePriceCap } from "./pricing.ts";

test("les trois taux du barème sont des points de la droite", () => {
  assert.equal(rateFromConsumption(6.5), RATE_PER_KM_CENTS.economy); // 22
  assert.equal(rateFromConsumption(8.0), RATE_PER_KM_CENTS.standard); // 25
  assert.equal(rateFromConsumption(11), RATE_PER_KM_CENTS.suv); // 32
});

test("le taux est borné, même pour une Urus ou un scooter", () => {
  assert.equal(rateFromConsumption(0), RATE_LINE.minCents);
  assert.equal(rateFromConsumption(99), RATE_LINE.maxCents);
});

test("un carro plus vieux coûte un peu plus, jamais plus de +15 %", () => {
  assert.equal(agedConsumption(8.0, 2024), 8.0); // récent : inchangé
  assert.equal(agedConsumption(8.0, 2015), 8.4); // +5 %
  assert.equal(agedConsumption(8.0, 1998), 9.2); // plafonné à +15 %
});

test("le Sportage du client coûte moins que sa Lamborghini", () => {
  const sportage = findCar("Kia", "Sportage")!;
  const urus = findCar("Lamborghini", "Urus")!;
  const rSportage = rateFromConsumption(agedConsumption(sportage.l100, 2018));
  const rUrus = rateFromConsumption(agedConsumption(urus.l100, 2024));
  assert.ok(rSportage < rUrus);
  // Et les deux restent des partages de frais : la formule du plafond ne
  // change pas, seul le taux entre dedans.
  const cap = computePriceCap(251, 800, rUrus, 3);
  assert.equal(cap.ratePerKmCents, rUrus);
  assert.ok(cap.driverShareCents > 0); // R1 : le conducteur paie sa part
});

test("le catalogue est cohérent : conso plausible, catégories couvertes", () => {
  for (const car of CAR_CATALOG) {
    assert.ok(
      car.l100 >= 4 && car.l100 <= 16,
      `${car.make} ${car.model} : conso ${car.l100} hors plage`,
    );
  }
  // Les trois catégories du barème restent atteignables depuis le catalogue.
  const cats = new Set(CAR_CATALOG.map((c) => categoryFromConsumption(c.l100)));
  assert.deepEqual([...cats].sort(), ["economy", "standard", "suv"]);
});

test("un taux numérique explicite donne le même calcul que sa catégorie", () => {
  const byCategory = computePriceCap(251, 800, "standard", 3);
  const byRate = computePriceCap(251, 800, 25, 3);
  assert.deepEqual(byCategory, byRate);
});
