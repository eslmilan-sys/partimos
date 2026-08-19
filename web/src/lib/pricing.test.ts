/**
 * Table de référence du §7 du brief. « Si tes chiffres diffèrent, c'est un bug. »
 *
 * Ce test n'est pas décoratif : c'est le garde-fou qui empêche qu'une
 * « simplification » du calcul — retirer le +1, arrondir autrement, facturer
 * le détour — passe inaperçue. Il tourne sans dépendance, avec le lanceur de
 * tests intégré à Node : `npm test`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AVERAGE_TOLL_CENTS,
  computePriceCap,
  formatUsd,
  PAY_CHANNELS,
  PRICE_RULE,
  SERVICE_FEE_PCT,
  serviceFeeCents,
} from "./pricing.ts";

const REFERENCE = [
  { name: "Coronado", km: 85, cap: 650, driverShare: 688 },
  { name: "Penonomé", km: 145, cap: 1050, driverShare: 1138 },
  { name: "Chitré", km: 250, cap: 1750, driverShare: 1925 },
  { name: "Las Tablas", km: 285, cap: 2000, driverShare: 2138 },
  { name: "David", km: 440, cap: 3100, driverShare: 3100 },
];

test("§7 — plafonds de référence (carro estándar, 3 puestos)", () => {
  for (const row of REFERENCE) {
    const result = computePriceCap(row.km, AVERAGE_TOLL_CENTS, "standard", 3);

    assert.equal(
      result.maxPriceCents,
      row.cap,
      `${row.name} : plafond attendu ${formatUsd(row.cap)}, obtenu ${formatUsd(result.maxPriceCents)}`,
    );

    // La table du brief arrondit au centime supérieur pour l'affichage ;
    // on tolère un centime d'écart sur cette colonne uniquement.
    assert.ok(
      Math.abs(result.driverShareCents - row.driverShare) <= 1,
      `${row.name} : le conducteur devrait encore payer ~${formatUsd(row.driverShare)}, obtenu ${formatUsd(result.driverShareCents)}`,
    );
  }
});

test("R1 — le conducteur paie toujours une part, même carro lleno", () => {
  for (const seats of [1, 2, 3, 4]) {
    for (const km of [60, 85, 145, 250, 285, 440]) {
      for (const category of ["economy", "standard", "suv"] as const) {
        const result = computePriceCap(km, AVERAGE_TOLL_CENTS, category, seats);
        assert.ok(
          result.driverShareCents > 0,
          `km=${km} seats=${seats} ${category} : le conducteur ne paie plus rien`,
        );
        assert.ok(
          result.recoveredCents < result.costTotalCents,
          `km=${km} seats=${seats} ${category} : le conducteur récupère 100 % du coût`,
        );
      }
    }
  }
});

test("R1 — le divisor inclut le conducteur", () => {
  assert.equal(PRICE_RULE.divisorIncludesDriver, true);
  const result = computePriceCap(250, AVERAGE_TOLL_CENTS, "standard", 3);
  assert.equal(result.occupants, 4);
});

test("R3 — le plafond ne dépend que du coût, jamais de la demande", () => {
  // Deux appels identiques rendent le même résultat : aucune entrée
  // temporelle, aucune notion de rareté n'entre dans le calcul.
  const a = computePriceCap(250, 300, "standard", 3);
  const b = computePriceCap(250, 300, "standard", 3);
  assert.deepEqual(a, b);
});

test("Le plafond est arrondi au demi-dollar inférieur", () => {
  for (const km of [61, 97, 133, 218, 349, 447]) {
    const { maxPriceCents } = computePriceCap(km, 300, "standard", 3);
    assert.equal(maxPriceCents % 50, 0, `km=${km} : arrondi non respecté`);
  }
});

test("Plus de sièges offerts ne fait jamais monter le plafond", () => {
  let previous = Infinity;
  for (const seats of [1, 2, 3, 4]) {
    const { maxPriceCents } = computePriceCap(250, 300, "standard", seats);
    assert.ok(
      maxPriceCents <= previous,
      `seats=${seats} : le plafond a augmenté avec le nombre de puestos`,
    );
    previous = maxPriceCents;
  }
});

/* ── La tarifa de servicio — fixe PAR CANAL, jamais par la demande ────────
   R2 amendée : Yappy 5 % (recommandé), tarjeta 8 %, efectivo 0. Les
   pourcentages suivent le coût du canal ; s'ils changent ici sans changer
   la contrainte `fee_is_fixed_pct` (migration 0010), c'est un bug. */

test("La tarifa par canal : 5 % Yappy, 8 % tarjeta, 0 efectivo", () => {
  assert.equal(serviceFeeCents(1000, "yappy"), 50);
  assert.equal(serviceFeeCents(1000, "tarjeta"), 80);
  assert.equal(serviceFeeCents(1000, "efectivo"), 0);
  // Le montant réel d'un Panamá → David à 18 $ : arrondi au centime.
  assert.equal(serviceFeeCents(1800, "yappy"), 90);
  assert.equal(serviceFeeCents(1800, "tarjeta"), 144);
});

test("L'ordre des canaux : le recommandé d'abord, l'efectivo en dernier", () => {
  assert.deepEqual(PAY_CHANNELS, ["yappy", "tarjeta", "efectivo"]);
  // Le recommandé est aussi le moins cher des canaux en ligne — c'est ce
  // qui rend la recommandation honnête.
  assert.ok(SERVICE_FEE_PCT.yappy < SERVICE_FEE_PCT.tarjeta);
  assert.equal(SERVICE_FEE_PCT.efectivo, 0);
});
