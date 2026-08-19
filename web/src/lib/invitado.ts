"use client";

import { useSyncExternalStore } from "react";

/**
 * LE MODE INVITÉ — « je ferme la porte, je veux juste chercher ».
 *
 * Décision du propriétaire : l'app s'ouvre sur entrer ou s'inscrire, et
 * la croix en haut à gauche mène à un état où SEULE la recherche est
 * disponible. Tout ce qui engage quelqu'un — réserver, publier, écrire,
 * son profil — ramène à la porte.
 *
 * POURQUOI `sessionStorage` ET NON `localStorage`. Refuser de se
 * connecter n'est pas une préférence durable, c'est une humeur du
 * moment : à la prochaine ouverture de l'app, la porte se repose. Un
 * refus mémorisé pour toujours transformerait un « pas maintenant » en
 * « plus jamais », et l'app n'aurait plus aucune occasion de proposer.
 *
 * POURQUOI `useSyncExternalStore`. `sessionStorage` est un système
 * extérieur à React. Le lire dans un effet puis appeler `setState`
 * produit un premier rendu faux suivi d'un second — le clignotement — et
 * le compilateur React refuse ce motif. Ici l'instantané est lu au
 * moment du rendu, et `getServerSnapshot` répond « non » : le HTML servi
 * est le même pour tout le monde, robots compris.
 */

const CLAVE = "partimos.invitado";
/** Un évènement à nous : `storage` ne se déclenche que dans les AUTRES
 *  onglets, jamais dans celui qui écrit. Sans lui, la barre d'onglets ne
 *  se mettrait pas à jour dans l'onglet où l'on vient de fermer la porte. */
const EVENTO = "partimos:invitado";

const oyentes = new Set<() => void>();

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  const alCambiar = () => avisar();
  window.addEventListener(EVENTO, alCambiar);
  window.addEventListener("storage", alCambiar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener(EVENTO, alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

function leer(): boolean {
  try {
    return window.sessionStorage.getItem(CLAVE) === "1";
  } catch {
    /* Navigation privée sur iOS : l'accès jette. On considère alors que
       la porte n'a pas été fermée — le pire cas est de la reproposer. */
    return false;
  }
}

export function useInvitado(): boolean {
  return useSyncExternalStore(suscribir, leer, () => false);
}

/** Ferme la porte pour cette session. */
export function entrarComoInvitado(): void {
  try {
    window.sessionStorage.setItem(CLAVE, "1");
  } catch {
    /* Sans stockage, la porte se reposera au prochain rendu. C'est
       désagréable, ce n'est pas cassé. */
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Rouvre la porte — appelé quand on touche une fonction qui exige un
 *  compte, pour que l'app ne reste pas coincée en invité. */
export function salirDeInvitado(): void {
  try {
    window.sessionStorage.removeItem(CLAVE);
  } catch {
    /* idem */
  }
  window.dispatchEvent(new Event(EVENTO));
}
