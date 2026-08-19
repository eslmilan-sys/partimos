"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { countUnread, fetchMessages } from "@/lib/chat";
import { bookingKey, useSession } from "@/lib/session";

/**
 * CE QUI RÉCLAME L'ATTENTION — un seul calcul, deux lecteurs.
 *
 * La pastille de la barre d'onglets et l'écran Mensajes doivent afficher
 * LE MÊME nombre. Deux comptages séparés finissent toujours par se
 * contredire, et une pastille qui annonce « 1 » au-dessus d'une liste
 * sans rien à lire est pire que pas de pastille du tout.
 *
 * DEUX SOURCES, ET ELLES NE SE MÉLANGENT PAS :
 *   · les MESSAGES non lus d'une reserva ;
 *   · le mot de bienvenue de Partimos, tant qu'on ne l'a pas ouvert.
 *
 * Les papiers manquants (cédula, permis, carro, plaque) ne comptent PAS
 * ici : ce ne sont pas des messages, ils ont leur propre bandeau. Les
 * empiler dans le même compteur ferait chercher une conversation qui
 * n'existe pas.
 */

const VISTO_BIENVENIDA = "partimos.bienvenida-leida";
const EVENTO = "partimos:avisos";

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

function leerBienvenida(): boolean {
  try {
    return window.localStorage.getItem(VISTO_BIENVENIDA) === "1";
  } catch {
    return true;
  }
}

/** Vrai tant que le mot de bienvenue n'a pas été ouvert. */
export function useBienvenidaSinLeer(): boolean {
  return !useSyncExternalStore(suscribir, leerBienvenida, () => true);
}

export function marcarBienvenidaLeida(): void {
  try {
    window.localStorage.setItem(VISTO_BIENVENIDA, "1");
  } catch {
    /* sans stockage, elle restera en surbrillance. Pas grave. */
  }
  window.dispatchEvent(new Event(EVENTO));
}

/**
 * LE NOMBRE À AFFICHER SUR L'ONGLET.
 *
 * `fetchMessages` est asynchrone (elle interroge Supabase quand la base
 * est branchée), donc ce compte ne peut pas se lire pendant le rendu :
 * il arrive après. Un effet qui pose le résultat dans un état est ici le
 * bon outil — c'est une donnée qui vient de l'extérieur, pas un calcul
 * qu'on aurait pu faire sur place.
 *
 * Il vaut 0 avant d'avoir la réponse. Une pastille qui apparaît en
 * retard est discrète ; une pastille qui affiche un chiffre faux puis se
 * corrige sous les yeux ne l'est pas.
 */
export function useSinLeer(): number {
  const { session } = useSession();
  const bienvenida = useBienvenidaSinLeer();
  const [mensajes, setMensajes] = useState(0);
  /* Remis à zéro dès que la liste des reservas change de forme : sans ça,
     le compte de l'ancienne liste resterait affiché le temps de la
     nouvelle requête. La clé du rendu, c'est `firma`. */

  /* La signature des reservas : l'effet ne doit se relancer que si la
     LISTE change, pas à chaque nouveau rendu de la session. */
  const firma = (session?.bookings ?? []).map((b) => bookingKey(b)).join("|");

  useEffect(() => {
    let vivo = true;
    const claves = firma ? firma.split("|") : [];
    /* PAS DE `setState` SYNCHRONE ICI. Sans reserva le compte est zéro,
       et zéro est déjà l'état initial : écrire tout de suite déclencherait
       un second rendu pour rien — c'est le motif que le compilateur
       React refuse, à juste titre. On sort. */
    if (claves.length === 0) return;
    void Promise.all(claves.map((k) => fetchMessages(k, null)))
      .then((listas) => {
        if (!vivo) return;
        setMensajes(listas.reduce((n, l) => n + countUnread(l), 0));
      })
      .catch(() => {
        /* Pas de réponse : pas de pastille. Un chiffre inventé serait pire. */
      });
    return () => {
      vivo = false;
    };
  }, [firma]);

  return mensajes + (session && bienvenida ? 1 : 0);
}
