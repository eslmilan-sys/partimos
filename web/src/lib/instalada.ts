"use client";

import { useSyncExternalStore } from "react";

/**
 * EST-ON DANS L'APP INSTALLÉE ?
 *
 * ─────────────────────────────────────────────────────────────────────
 * POURQUOI LE PRODUIT A BESOIN DE LE SAVOIR — une seule raison, et elle
 * est sérieuse.
 *
 * « Quand j'envoie le code par courriel, ça ouvre le SITE, donc je ne
 * peux pas entrer dans l'app. » Ce n'est pas un réglage mal mis : sur
 * iPhone, une app installée sur l'écran d'accueil a son propre bac à
 * sable. Mail ouvre le lien dans Safari, la session naît là-bas, et
 * l'app ne la verra jamais — même origine, même compte, deux mondes.
 *
 * Le seul chemin par courriel qui traverse ce mur est un CODE, qu'on
 * recopie à la main là où l'on veut entrer. L'écran doit donc savoir où
 * il s'exécute pour proposer le bon geste en premier. C'est la seule
 * chose que ce module sert à décider : jamais une couleur, jamais une
 * disposition — la CSS s'en charge, et elle le fait mieux.
 *
 * ─────────────────────────────────────────────────────────────────────
 * DEUX SIGNAUX, PARCE QU'AUCUN NE SUFFIT.
 *
 *   · `display-mode: standalone` — la vérité du navigateur, mais elle
 *     n'existe que sur une app RÉELLEMENT installée ;
 *   · la classe `app-instalada` sur `<html>` — posée par `PWA.tsx`, et
 *     c'est elle qui permet d'inspecter le mode app depuis un
 *     navigateur ordinaire (les batteries s'en servent).
 *
 * `useSyncExternalStore` et pas un effet : ces deux signaux vivent
 * DEHORS de React. Les lire dans un effet pour appeler `setState`
 * produirait un rendu de plus à chaque montage — et le compilateur React
 * le refuse, à juste titre.
 *
 * Le serveur rend toujours « non installée », et c'est le bon défaut :
 * le HTML servi doit être identique pour tout le monde, robots compris.
 */

function leer(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      document.documentElement.classList.contains("app-instalada")
    );
  } catch {
    return false;
  }
}

function suscribir(avisar: () => void): () => void {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", avisar);
  /* La classe peut arriver APRÈS le premier rendu : `PWA.tsx` la pose au
     montage. Sans cet observateur, l'écran resterait sur sa première
     réponse et proposerait le lien là où seul le code marche. */
  const obs = new MutationObserver(avisar);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => {
    mq.removeEventListener("change", avisar);
    obs.disconnect();
  };
}

export function useInstalada(): boolean {
  return useSyncExternalStore(suscribir, leer, () => false);
}
