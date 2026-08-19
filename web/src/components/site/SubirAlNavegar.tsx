"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * REMONTER EN HAUT QUAND ON CHANGE D'ÉCRAN — mais pas en revenant.
 *
 * ─────────────────────────────────────────────────────────────────────
 * LE BUG, ET POURQUOI LA PREMIÈRE CORRECTION N'A PAS SUFFI.
 *
 * « Quand j'appuie sur un lien, ça m'emmène en bas de page. » Vrai, et
 * ma première correction ne traitait que les trois endroits qui
 * appellent `router.push` — les boutons de recherche. Or l'application
 * compte SOIXANTE-DIX `<Link>`, et aucun ne passait par là. J'avais
 * corrigé le cas que j'avais sous les yeux, pas le bug.
 *
 * La cause reste la même : le routeur remonte en haut au moment de la
 * navigation, mais les écrans de ce produit se peignent APRÈS (ils
 * lisent l'adresse pour savoir quoi afficher). Quand il regarde, le
 * document n'a pas encore sa hauteur ; il n'a rien à remonter ; et le
 * décalage précédent réapparaît avec le contenu.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QU'IL NE FAUT SURTOUT PAS FAIRE : remonter à CHAQUE changement
 * d'adresse. Le bouton retour doit rendre la position qu'on avait dans
 * la liste de résultats — c'est le routeur qui la restaure, et un
 * remontage aveugle l'écraserait. On échangerait un bug contre un pire.
 *
 * D'où la distinction : `popstate` ne se déclenche QUE sur retour et
 * suivant. On lève un drapeau, et ce passage-là ne remonte pas.
 * ─────────────────────────────────────────────────────────────────────
 */
export function SubirAlNavegar() {
  const pathname = usePathname();
  const volviendo = useRef(false);
  /* Le premier rendu n'est pas une navigation : arriver sur une page
     avec une ancre (#tarifas) doit rester sur l'ancre. */
  const primero = useRef(true);

  useEffect(() => {
    const marcar = () => {
      volviendo.current = true;
    };
    window.addEventListener("popstate", marcar);
    return () => window.removeEventListener("popstate", marcar);
  }, []);

  useEffect(() => {
    if (primero.current) {
      primero.current = false;
      return;
    }
    if (volviendo.current) {
      volviendo.current = false;
      return;
    }
    /* Une adresse avec une ancre veut aller à l'ancre, pas en haut. */
    if (window.location.hash) return;

    const arriba = () =>
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    arriba();
    /* Deux passages de plus : l'écran d'arrivée prend sa hauteur
       définitive au tour suivant, parfois à celui d'après. Sans eux, on
       remonte un document vide et le décalage revient avec le contenu. */
    const a = requestAnimationFrame(() => {
      arriba();
      requestAnimationFrame(arriba);
    });
    return () => cancelAnimationFrame(a);
  }, [pathname]);

  return null;
}
