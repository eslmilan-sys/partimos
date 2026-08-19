"use client";

/**
 * ALLER EN HAUT DE LA PAGE SUIVANTE.
 *
 * ─────────────────────────────────────────────────────────────────────
 * LE BUG. « Quand j'appuie sur Buscar viaje, je tombe tout en bas de la
 * page. » Reproduit : la carte de recherche du site vit au milieu d'une
 * page longue. On défile jusqu'à elle, on cherche — et la page de
 * résultats s'ouvre en conservant le décalage vertical. Comme elle est
 * plus courte, ce décalage tombe dans son pied de page.
 *
 * Le routeur remonte normalement en haut, mais pas quand la page
 * d'arrivée se peint APRÈS la navigation : au moment où il regarde, le
 * document ne fait pas encore la hauteur nécessaire, il n'a rien à
 * remonter, et le décalage revient quand le contenu arrive.
 *
 * POURQUOI PAS UN « SCROLL TO TOP » GLOBAL sur chaque changement
 * d'adresse : ça casserait le bouton retour. Revenir sur une liste de
 * résultats doit rendre la position qu'on avait — c'est le routeur qui
 * la restaure, et un remontage automatique l'écraserait. On remonte donc
 * seulement là où l'on part VOLONTAIREMENT vers un nouvel écran.
 * ─────────────────────────────────────────────────────────────────────
 */

/**
 * Remonte en haut, maintenant et après la peinture.
 *
 * Deux temps parce qu'un seul ne suffit pas : l'appel immédiat traite la
 * page déjà rendue, celui d'après traite celle qui arrive. `behavior:
 * "instant"` et pas `smooth` — une page de résultats qui défile toute
 * seule pendant qu'on la lit donne l'impression d'un bug, pas d'une
 * animation.
 */
export function irArriba(): void {
  if (typeof window === "undefined") return;
  const arriba = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  arriba();
  requestAnimationFrame(() => {
    arriba();
    /* Un troisième passage au tour suivant : les écrans qui lisent
       l'adresse pour se peindre (les résultats, le viaje) ne prennent
       leur hauteur définitive qu'à ce moment-là. */
    requestAnimationFrame(arriba);
  });
}
