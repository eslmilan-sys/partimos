"use client";

import { useSyncExternalStore } from "react";

/**
 * LA DERNIÈRE RECHERCHE — la mémoire courte du site.
 *
 * Le bug vécu : « je choisis ma destination sur l'accueil, et la page
 * suivante me redemande où je vais ». Chaque écran gardait son état dans
 * son coin. Ce module est la solution : la dernière paire de villes (et
 * les puestos) vit dans localStorage, chaque écran de recherche la LIT
 * comme valeur de départ et l'ÉCRIT à chaque choix — accueil, /ya,
 * résultats et publication racontent enfin la même histoire.
 *
 * Même mécanique que la session : useSyncExternalStore, instantané
 * serveur null (l'export statique ne connaît personne), la valeur
 * arrive juste après l'hydratation sans désaccord serveur/client.
 * Les écrans l'utilisent en VALEUR DE REPLI (`choix ?? dernier ??
 * défaut`) — jamais en copie d'état, pour qu'aucun d'eux ne garde une
 * version rance.
 */

export type LastSearch = {
  from: string;
  to: string;
  seats?: number;
  /** ISO yyyy-mm-dd. Ignorée si passée. */
  date?: string;
};

const KEY = "partimos.last-search";
const listeners = new Set<() => void>();
let cache: LastSearch | null = null;
let cacheLoaded = false;

function load(): LastSearch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastSearch;
    if (!parsed?.from || !parsed?.to || parsed.from === parsed.to) return null;
    return parsed;
  } catch {
    return null;
  }
}

function snapshot(): LastSearch | null {
  if (!cacheLoaded) {
    cache = load();
    cacheLoaded = true;
  }
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveLastSearch(next: LastSearch): void {
  if (!next.from || !next.to || next.from === next.to) return;
  cache = { ...snapshot(), ...next };
  cacheLoaded = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* stockage plein ou bloqué : la mémoire courte devient mémoire nulle,
       rien ne casse. */
  }
  listeners.forEach((l) => l());
}

export function useLastSearch(): LastSearch | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

/**
 * Vrai après l'hydratation, faux dans le HTML prérendu. Pour le contenu
 * qui dépend de l'HEURE (résultats de recherche « hoy ») : le HTML du
 * build et le premier rendu client ne peuvent pas coïncider — on rend
 * un squelette côté serveur et le vrai contenu dès l'hydratation, sans
 * effet ni setState (React 19 friendly).
 */
const noopSubscribe = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
