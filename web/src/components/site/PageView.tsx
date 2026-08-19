"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * La page vue — le dénominateur de tout le reste.
 *
 * Sans elle, « 40 réservations » ne veut rien dire : 40 sur combien de
 * visites ? Le chemin change à chaque navigation, y compris sans
 * rechargement (export statique, navigation côté client) : d'où
 * `usePathname` plutôt qu'un seul envoi au montage.
 *
 * Aucun rendu, aucun effet visible. Sans Supabase configuré, `track`
 * ne fait rien du tout.
 */
export function PageView() {
  const pathname = usePathname();
  useEffect(() => {
    track("pagina_vista");
  }, [pathname]);
  return null;
}
