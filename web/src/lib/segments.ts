/**
 * ARRÊTS INTERMÉDIAIRES ET SEGMENTS
 *
 * Un conducteur qui va de Panamá à David passe par Coronado, Penonomé,
 * Aguadulce et Santiago. S'il déclare ces villes, le même trajet dessert
 * jusqu'à dix paires de villes au lieu d'une — n(n+1)/2 pour cinq points.
 * C'est le levier le plus fort d'une place de marché qui démarre : il remplit
 * les recherches vides avec l'offre qui existe déjà.
 *
 * Deux règles qui ne se négocient pas, et qui sont la vraie difficulté.
 *
 * ── 1. LE PRIX EST CELUI DU SEGMENT ────────────────────────────────────────
 * Le plafond ne peut pas être celui du trajet entier : quelqu'un qui descend
 * à Santiago n'occupe pas les 190 km restants. On applique donc la MÊME
 * formule aux kilomètres réellement parcourus :
 *
 *     plafond = (km du segment × taux × tolérance + péages du segment)
 *               ÷ (sièges + 1)
 *
 * Le « + 1 » reste. R1 tient segment par segment, et le résultat est plus
 * juste que de faire payer le trajet complet à qui descend à mi-chemin.
 *
 * ── 2. LES SIÈGES SONT UN INVENTAIRE PAR TRONÇON ───────────────────────────
 * Une place vendue Panamá → Santiago se LIBÈRE après Santiago. Compter les
 * sièges sur l'ensemble du trajet — ce que fait le trigger actuel de la base —
 * refuserait une réservation Santiago → David alors que le carro y est vide.
 * On compte donc tronçon par tronçon : une réservation occupe tous les
 * tronçons entre sa montée et sa descente, et rien d'autre.
 *
 * C'est le problème d'inventaire des compagnies aériennes, en plus petit. Le
 * traiter comme une option plutôt que comme le modèle de base est la façon
 * classique de se retrouver avec des sièges vendus deux fois.
 */

import { computePriceCap, type VehicleCategory } from "./pricing.ts";

/** Un point de passage déclaré, avec sa distance depuis l'origine. */
export type Waypoint = {
  citySlug: string;
  name: string;
  /** Kilomètres depuis l'origine du trajet. Croissant, strictement. */
  km: number;
  /** Péages cumulés depuis l'origine, en centimes. */
  tollCents: number;
  /** Points de rendez-vous habituels DANS cette ville. Jamais un terminal de
   *  bus. Sans eux, un passager qui monte en cours de route se verrait proposer
   *  les points de la ville de départ, où il n'est pas. */
  pickupPoints: string[];
};

export type Segment = {
  fromIndex: number;
  toIndex: number;
  from: Waypoint;
  to: Waypoint;
  km: number;
  tollCents: number;
};

/**
 * Retrouve le segment demandé dans la liste ordonnée des arrêts.
 * Renvoie `null` si l'une des villes manque, ou si elles sont dans le
 * mauvais sens — on ne remonte pas un trajet à contresens.
 */
export function findSegment(
  stops: Waypoint[],
  fromCitySlug: string,
  toCitySlug: string,
): Segment | null {
  const fromIndex = stops.findIndex((s) => s.citySlug === fromCitySlug);
  const toIndex = stops.findIndex((s) => s.citySlug === toCitySlug);

  if (fromIndex === -1 || toIndex === -1) return null;
  if (fromIndex >= toIndex) return null;

  const from = stops[fromIndex];
  const to = stops[toIndex];

  return {
    fromIndex,
    toIndex,
    from,
    to,
    km: Math.round((to.km - from.km) * 10) / 10,
    tollCents: Math.max(0, to.tollCents - from.tollCents),
  };
}

/**
 * Plafond du segment. Même formule que le trajet complet, appliquée aux
 * kilomètres du segment — donc `divisor = sièges + 1` intact. Comme elle,
 * accepte une catégorie du barème OU le taux au km du carro réel.
 */
export function segmentCap(
  segment: Segment,
  category: VehicleCategory | number,
  seats: number,
) {
  return computePriceCap(segment.km, segment.tollCents, category, seats);
}

/** Une réservation occupe un intervalle de tronçons, pas le trajet entier. */
export type SeatHold = { fromIndex: number; toIndex: number; seats: number };

/**
 * Sièges occupés sur le tronçon le plus chargé du segment demandé.
 *
 * On regarde chaque tronçon élémentaire [i, i+1] compris dans le segment et
 * on garde le maximum : c'est lui qui limite. Prendre la somme des
 * réservations, ou seulement le tronçon de départ, laisserait passer une
 * surréservation au milieu du parcours.
 */
export function seatsTakenOnSegment(
  holds: SeatHold[],
  segment: { fromIndex: number; toIndex: number },
): number {
  let worst = 0;
  for (let leg = segment.fromIndex; leg < segment.toIndex; leg++) {
    const onThisLeg = holds
      .filter((h) => h.fromIndex <= leg && h.toIndex > leg)
      .reduce((sum, h) => sum + h.seats, 0);
    if (onThisLeg > worst) worst = onThisLeg;
  }
  return worst;
}

export function seatsFreeOnSegment(
  seatsOffered: number,
  holds: SeatHold[],
  segment: { fromIndex: number; toIndex: number },
): number {
  return Math.max(0, seatsOffered - seatsTakenOnSegment(holds, segment));
}

/** Toutes les paires desservies par une liste d'arrêts, dans l'ordre. */
export function servedPairs(stops: Waypoint[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      pairs.push([stops[i].citySlug, stops[j].citySlug]);
    }
  }
  return pairs;
}
