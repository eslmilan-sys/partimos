/**
 * DÉTOUR DEMANDÉ PAR UN PASSAGER
 *
 * Règle du §7 du brief, à appliquer littéralement :
 *
 *   « Le détour ne se facture pas en supplément — il change la distance.
 *     Jamais "prise en charge à domicile : +2 $" (ce serait un service
 *     tarifé, donc du transport commercial), mais "ton point ajoute 8,4 km". »
 *
 * La nuance n'est pas cosmétique. Un supplément est le prix d'un service
 * rendu : c'est du transport rémunéré. Un kilométrage supplémentaire est un
 * coût réel du trajet, qui se répartit selon la même formule que le reste.
 * Le montant que paie le passager peut être le même ; ce qui change, c'est
 * qu'il correspond à un coût constaté et non à une prestation vendue.
 *
 * Deuxième règle : le surcoût est porté par LE PASSAGER QUI L'A DEMANDÉ,
 * jamais par le conducteur — sinon il perd de l'argent à rendre service et
 * cesse d'accepter.
 */

import { computePriceCap, type VehicleCategory } from "./pricing";

/** Plafonds au-delà desquels un détour se refuse (§7). */
export const DETOUR_LIMITS = {
  maxExtraKmPct: 15,
  maxExtraMinutes: 15,
  /** Au-delà, les passagers déjà réservés sont prévenus et peuvent annuler. */
  notifyPassengersAfterMinutes: 10,
} as const;

export type DetourQuote = {
  extraKm: number;
  extraMinutes: number;
  /** Aporte de référence, sans détour. */
  baseCents: number;
  /** Aporte du passager qui a demandé le détour. */
  requesterCents: number;
  /** Écart porté par le demandeur, jamais par le conducteur. */
  extraCents: number;
  accepted: boolean;
  /** Motif du refus, prêt à afficher. Vide si accepté. */
  reason: string;
};

/**
 * @param baseKm      distance du corridor
 * @param tollCents   péages du corridor
 * @param extraKm     kilomètres ajoutés par le point demandé
 * @param seats       sièges offerts par le conducteur
 */
export function quoteDetour(
  baseKm: number,
  tollCents: number,
  extraKm: number,
  category: VehicleCategory | number,
  seats: number,
): DetourQuote {
  // Vitesse moyenne interurbaine au Panama, pour convertir des kilomètres
  // en minutes. Approximation assumée : elle ne sert qu'au garde-fou.
  const extraMinutes = Math.round((extraKm / 65) * 60);
  const extraPct = (extraKm / baseKm) * 100;

  const base = computePriceCap(baseKm, tollCents, category, seats);

  // Le trajet allongé coûte plus cher. On calcule le plafond de ce trajet-là,
  // puis on n'impute la différence qu'au demandeur : les autres passagers
  // gardent l'aporte du trajet qu'ils avaient accepté.
  const detoured = computePriceCap(
    baseKm + extraKm,
    tollCents,
    category,
    seats,
  );
  const extraCents = Math.max(0, detoured.maxPriceCents - base.maxPriceCents);

  let accepted = true;
  let reason = "";
  if (extraPct > DETOUR_LIMITS.maxExtraKmPct) {
    accepted = false;
    reason = `Ese punto agrega ${extraKm.toFixed(1)} km, más del ${DETOUR_LIMITS.maxExtraKmPct} % del recorrido. El conductor no puede desviarse tanto.`;
  } else if (extraMinutes > DETOUR_LIMITS.maxExtraMinutes) {
    accepted = false;
    reason = `Ese punto agrega unos ${extraMinutes} minutos, más de los ${DETOUR_LIMITS.maxExtraMinutes} permitidos.`;
  }

  return {
    extraKm,
    extraMinutes,
    baseCents: base.maxPriceCents,
    requesterCents: base.maxPriceCents + extraCents,
    extraCents,
    accepted,
    reason,
  };
}
