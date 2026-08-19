/**
 * CALCUL DU PLAFOND — Formule A
 *
 *   plafond = (km × taux véhicule × tolérance détour + péages) ÷ (sièges + 1)
 *
 * Le « + 1 » est le conducteur : il paie sa part. Le retirer transformerait
 * un partage de frais en transport rémunéré. NE JAMAIS le retirer.
 *
 * Cette fonction reproduit exactement `compute_price_cap()` de schema.sql.
 * La base de données reste l'autorité (contrainte CHECK price_within_cap) ;
 * ce module ne sert qu'à afficher le même chiffre côté client.
 *
 * Tous les montants circulent en CENTIMES entiers. Aucun flottant ne touche
 * un montant : l'arithmétique décimale de JavaScript n'est pas fiable pour
 * de l'argent (0.1 + 0.2 !== 0.3).
 */

export type VehicleCategory = "economy" | "standard" | "suv";

/** Taux au kilomètre, en centimes. Miroir de la table `vehicle_categories`. */
export const RATE_PER_KM_CENTS: Record<VehicleCategory, number> = {
  economy: 22,
  standard: 25,
  suv: 32,
};

export const VEHICLE_LABELS: Record<VehicleCategory, string> = {
  economy: "Económico",
  standard: "Estándar",
  suv: "SUV o pick-up",
};

/** Miroir de `price_rules` (version en vigueur PA-2026-01). */
export const PRICE_RULE = {
  versionLabel: "PA-2026-01",
  /** Le +1. Passer ce drapeau à false casserait le modèle juridique. */
  divisorIncludesDriver: true,
  /** Marge de 10 % pour les détours de ramassage, intégrée au coût. */
  detourTolerancePct: 10,
  /** Arrondi au demi-dollar, vers le bas. */
  roundingCents: 50,
  maxStops: 4,
} as const;

/** Péage moyen retenu par le calculateur public, en centimes. */
export const AVERAGE_TOLL_CENTS = 300;

/**
 * TARIFA DE SERVICIO — le paiement EN LIGNE, optionnel.
 *
 * Elle rémunère le service de réservation (cobro protégé, comprobante,
 * remboursements selon les règles d'annulation), PAS le transport :
 * c'est la distinction qui garde le partage de frais intact. Trois
 * garde-fous structurels :
 *   · elle se cobra AU PASSAGER, en sus — l'aporte du conducteur ne
 *     bouge pas d'un centime et reste sous le tope (R1) ;
 *   · payer EFECTIVO (ou Yappy directo au conducteur) reste toujours
 *     possible et coûte 0 — la tarifa n'est jamais un péage obligatoire ;
 *   · pourcentage FIXE PAR CANAL — il reflète le coût du canal (Yappy
 *     commerçant ~1 %, processeur carte ~3,5–4 %), jamais la demande,
 *     la date ni la rareté (R3). Yappy est moins cher PARCE QU'IL coûte
 *     moins cher — c'est aussi pourquoi il se recommande en premier.
 */
export type PayChannel = "yappy" | "tarjeta" | "efectivo";

/** L'ordre d'affichage partout : le recommandé d'abord, le cash en dernier. */
export const PAY_CHANNELS: PayChannel[] = ["yappy", "tarjeta", "efectivo"];

export const SERVICE_FEE_PCT: Record<PayChannel, number> = {
  yappy: 5,
  tarjeta: 8,
  efectivo: 0,
};

export function serviceFeeCents(
  totalCents: number,
  channel: PayChannel,
): number {
  return Math.round((totalCents * SERVICE_FEE_PCT[channel]) / 100);
}

export type PriceBreakdown = {
  /** Coût total estimé du trajet, détour inclus. */
  costTotalCents: number;
  /** Nombre d'occupants qui se partagent le coût — conducteur compris. */
  occupants: number;
  /** Plafond par siège. Un conducteur peut demander moins, jamais plus. */
  maxPriceCents: number;
  /** Ce que le conducteur récupère si tous les sièges sont pris. */
  recoveredCents: number;
  /** Ce qu'il paie encore de sa poche. Toujours strictement positif. */
  driverShareCents: number;
  ratePerKmCents: number;
  tollCents: number;
  distanceKm: number;
};

/**
 * @param distanceKm  distance du corridor
 * @param tollCents   péages du corridor, en centimes
 * @param category    catégorie du barème, OU un taux au km explicite en
 *                    centimes — celui du carro réel, calculé par
 *                    `rateFromConsumption()` (src/lib/cars.ts) sur la même
 *                    droite que le barème. La formule ne change pas.
 * @param seats       sièges OFFERTS aux passagers (le conducteur n'y est pas)
 */
export function computePriceCap(
  distanceKm: number,
  tollCents: number,
  category: VehicleCategory | number,
  seats: number,
): PriceBreakdown {
  const ratePerKmCents =
    typeof category === "number" ? category : RATE_PER_KM_CENTS[category];

  // Même ordre d'opérations que la fonction SQL : on arrondit le coût
  // kilométrique au centime avant d'ajouter les péages.
  const costTotalCents =
    Math.round(
      distanceKm * ratePerKmCents * (1 + PRICE_RULE.detourTolerancePct / 100),
    ) + tollCents;

  const occupants = seats + (PRICE_RULE.divisorIncludesDriver ? 1 : 0);

  const maxPriceCents =
    Math.floor(costTotalCents / occupants / PRICE_RULE.roundingCents) *
    PRICE_RULE.roundingCents;

  const recoveredCents = maxPriceCents * seats;

  return {
    costTotalCents,
    occupants,
    maxPriceCents,
    recoveredCents,
    // Jamais négatif : le plafond arrondi vers le bas le garantit, mais on
    // ne fait pas reposer une garantie juridique sur une propriété implicite.
    driverShareCents: Math.max(0, costTotalCents - recoveredCents),
    ratePerKmCents,
    tollCents,
    distanceKm,
  };
}

/** Formatage monétaire. Les prix s'écrivent toujours avec deux décimales. */
export function formatUsd(cents: number, opts?: { compact?: boolean }): string {
  const value = cents / 100;
  if (opts?.compact && cents % 100 === 0) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(2)}`;
}

/** « 3 h 40 » — jamais « 220 min », que personne ne lit. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}
