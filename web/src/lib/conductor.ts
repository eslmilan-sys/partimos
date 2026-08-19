/**
 * CE QUI FAIT UN CONDUCTEUR DE CONFIANCE — une règle, pas un drapeau.
 *
 * ─────────────────────────────────────────────────────────────────────
 * `isSuperDriver` existait déjà… en dur dans le jeu de démonstration.
 * Personne ne le méritait, personne ne pouvait le perdre : c'était une
 * décoration. Un badge de confiance qui ne se gagne pas est pire qu'une
 * absence de badge — il ment sur ce qu'il certifie.
 *
 * Ici il se calcule, et il se PERD si la note redescend.
 *
 * ─────────────────────────────────────────────────────────────────────
 * LES TROIS CONDITIONS, ET POURQUOI CHACUNE.
 *
 *   · La NOTE (≥ 4,8). C'est le jugement des passagers, la seule mesure
 *     qui vienne d'eux.
 *   · Le NOMBRE DE VIAJES (≥ 25). Sans lui, un 5,0 obtenu sur deux
 *     courses vaudrait autant qu'un 4,9 sur deux cents. Deux avis ne
 *     sont pas une réputation, c'est un échantillon.
 *   · L'IDENTITÉ VÉRIFIÉE. Non négociable : mettre en avant quelqu'un
 *     dont on n'a pas confirmé qui il est, c'est exactement l'inverse de
 *     ce que le badge promet.
 *
 * On n'invente aucun seuil sur l'ancienneté ni sur le taux d'annulation
 * tant qu'on ne les mesure pas honnêtement — un critère qu'on ne sait
 * pas calculer ne doit pas entrer dans une promesse.
 * ─────────────────────────────────────────────────────────────────────
 */

export const TOP_MINIMO = {
  nota: 4.8,
  viajes: 25,
} as const;

export type Reputacion = {
  rating: number;
  ridesCount: number;
  isVerified: boolean;
};

export function esTopConductor(c: Reputacion): boolean {
  return (
    c.isVerified &&
    c.rating >= TOP_MINIMO.nota &&
    c.ridesCount >= TOP_MINIMO.viajes
  );
}

/**
 * COMBIEN IL RESTE À FAIRE — pour que le badge soit un objectif, pas
 * une loterie. Rend `null` quand il est déjà obtenu.
 *
 * Un conducteur qui voit « te faltan 7 viajes » sait quoi faire. Un
 * conducteur qui voit un badge chez les autres et rien chez lui suppose
 * que c'est arbitraire — et il a raison de le supposer si on ne le dit
 * pas.
 */
export function faltaParaTop(c: Reputacion): string | null {
  if (esTopConductor(c)) return null;
  if (!c.isVerified) return "Verifica tu identidad";
  if (c.ridesCount < TOP_MINIMO.viajes) {
    const faltan = TOP_MINIMO.viajes - c.ridesCount;
    return `Te ${faltan === 1 ? "falta" : "faltan"} ${faltan} ${faltan === 1 ? "viaje" : "viajes"}`;
  }
  return `Mantén tu nota en ${TOP_MINIMO.nota.toFixed(1)} o más`;
}

/**
 * LE POIDS DANS LA RECHERCHE.
 *
 * Demande explicite : mettre en avant les meilleurs conducteurs. Mais un
 * classement qui ne regarderait QUE la réputation enterrerait les
 * nouveaux, qui n'auraient alors jamais l'occasion d'en construire une —
 * la marketplace se fermerait sur elle-même.
 *
 * Le poids reste donc modeste et il s'ajoute à la pertinence de l'heure
 * et du prix ; il ne les remplace pas. Un top conductor à 18 h ne doit
 * pas passer devant un viaje ordinaire à 8 h quand on cherche le matin.
 */
export function bonusReputacion(c: Reputacion): number {
  let p = 0;
  if (esTopConductor(c)) p += 12;
  if (c.isVerified) p += 6;
  /* La note au-dessus de 4 rapporte, mais seulement une fois qu'elle
     repose sur assez de courses pour vouloir dire quelque chose. */
  if (c.ridesCount >= 10) p += Math.max(0, (c.rating - 4) * 8);
  /* L'expérience compte, en s'aplatissant : le pas de 5 à 50 viajes vaut
     plus que celui de 200 à 400. */
  p += Math.min(6, Math.log10(Math.max(1, c.ridesCount)) * 3);
  return p;
}
