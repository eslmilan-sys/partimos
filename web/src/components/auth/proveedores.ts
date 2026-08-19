"use client";

import { useEffect, useState } from "react";
import { fetchProveedores, type Proveedores } from "@/lib/supabase";

/**
 * QUELLES AUTRES PORTES EXISTENT VRAIMENT.
 *
 * Google, Apple et LinkedIn n'existent que si le projet les a activés.
 * Les afficher « au cas où » envoie sur une page d'erreur de Supabase au
 * milieu de l'écran de connexion — une impasse au moment précis où l'on
 * s'engage. On lit donc la configuration publique et on n'affiche que ce
 * qui marche.
 *
 * `null` veut dire « on ne sait pas encore » (ou « la requête a échoué »),
 * et ce n'est PAS la même chose que « aucune » : dans le doute on ne
 * montre aucun bouton social, parce que le courriel, lui, marche
 * toujours. Un bouton absent fait chercher ailleurs ; un bouton mort fait
 * croire que le produit est cassé.
 */

const PUERTAS_SOCIALES = ["google", "apple", "linkedin_oidc"] as const;

export function useProveedores(): {
  proveedores: Proveedores | null;
  hayOtrasPuertas: boolean;
} {
  const [proveedores, setProveedores] = useState<Proveedores | null>(null);

  useEffect(() => {
    let vivo = true;
    void fetchProveedores().then((p) => {
      if (vivo && p) setProveedores(p);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return {
    proveedores,
    hayOtrasPuertas: PUERTAS_SOCIALES.some((id) => proveedores?.[id]),
  };
}
