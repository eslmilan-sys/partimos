"use client";

import { useSyncExternalStore } from "react";

/**
 * L'HEURE COURANTE, À LA MINUTE.
 *
 * Le temps est un système EXTÉRIEUR à React, au même titre que la session
 * de ce projet : `useSyncExternalStore` est l'outil prévu pour ça. Les deux
 * autres chemins sont fermés — un `useState` posé depuis un effet est
 * refusé par le compilateur (« cascading renders »), et un `Date.now()`
 * pendant le rendu est refusé par la règle de pureté.
 *
 * L'instantané est le NUMÉRO DE MINUTE, pas les millisecondes : React exige
 * que deux lectures sans changement rendent la même valeur, sinon il
 * reboucle à l'infini. La minute suffit — personne ne regarde les secondes
 * d'un compte à rebours de départ, ni le passage de 11 h 59 à midi.
 *
 * Sur le serveur : `null`. Le HTML pré-rendu est le même pour tout le
 * monde, robots compris — il ne connaît ni l'heure du client ni sa session.
 * Tout composant qui s'en sert doit donc savoir ne rien rendre.
 */

function suscribir(alCambiar: () => void) {
  /* 30 s pour une granularité d'une minute : sans ça, une minute affichée
     peut avoir près de 60 s de retard. */
  const reloj = window.setInterval(alCambiar, 30_000);
  return () => window.clearInterval(reloj);
}

const minutoActual = () => Math.floor(Date.now() / 60_000);
const sinMinuto = () => null;

/** Les millisecondes de la minute courante, ou `null` avant hydratation. */
export function useAhora(): number | null {
  const minuto = useSyncExternalStore(suscribir, minutoActual, sinMinuto);
  return minuto === null ? null : minuto * 60_000;
}
