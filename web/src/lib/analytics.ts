"use client";

import { getSupabase, isSupabaseConfigured } from "./supabase";

/**
 * LA MESURE — ce qu'on regarde, et ce qu'on refuse de regarder.
 *
 * Sans données, « le site marche bien » est une opinion. Avec la table
 * `events` (migration 0015), c'est une phrase vérifiable : combien sont
 * entrés, combien ont cherché, combien sont repartis les mains vides,
 * et quelle route manque d'un conducteur.
 *
 * Ce qu'on N'ENVOIE PAS, délibérément : aucune IP, aucun user-agent,
 * jamais l'URL complète du referent — seulement son domaine. Une IP est
 * une donnée personnelle, et pour savoir si Chitré convertit mieux que
 * David elle ne sert à rien. Pas de cookie non plus : un identifiant de
 * session aléatoire dans `localStorage`, que l'utilisateur efface avec
 * son historique.
 *
 * Sans Supabase configuré, TOUT ce module est un no-op silencieux : la
 * démonstration ne mesure personne.
 */

const SESSION_KEY = "partimos.session-id";
const ORIGIN_KEY = "partimos.origen";

type Origin = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_host?: string;
};

/**
 * L'IDENTIFIANT ANONYME DU NAVIGATEUR.
 *
 * Exporté parce qu'un deuxième module en a besoin : la señal de demanda
 * (`lib/publicar.ts`) s'en sert pour ne PAS compter dix fois la même
 * personne qui rafraîchit. Le chiffre « N búsquedas de esta ruta » est
 * montré à un conducteur pour le décider à publier — un chiffre qu'on
 * peut gonfler en appuyant sur F5 serait un mensonge à retardement.
 *
 * C'est le même identifiant que celui des événements, à dessein : deux
 * identifiants pour la même personne, ce serait deux traces au lieu
 * d'une, donc plus de données pour moins de sens.
 */
export function idDeSesion(): string {
  return sessionId();
}

function sessionId(): string {
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "sin-almacenamiento";
  }
}

/**
 * D'où vient cette personne — capturé UNE fois, à la première visite.
 *
 * Réécrire l'origine à chaque page ferait dire « ils viennent tous de
 * notre propre site » : le referent d'une navigation interne, c'est
 * nous. La première réponse est la seule vraie.
 */
function origin(): Origin {
  try {
    const stored = window.localStorage.getItem(ORIGIN_KEY);
    if (stored) return JSON.parse(stored) as Origin;

    const params = new URLSearchParams(window.location.search);
    const ref = document.referrer;
    let referrer_host: string | undefined;
    if (ref) {
      const host = new URL(ref).hostname;
      // Une visite depuis nos propres pages n'est pas une provenance.
      if (host !== window.location.hostname) referrer_host = host;
    }
    const next: Origin = {
      utm_source: params.get("utm_source") ?? undefined,
      utm_medium: params.get("utm_medium") ?? undefined,
      utm_campaign: params.get("utm_campaign") ?? undefined,
      referrer_host,
    };
    window.localStorage.setItem(ORIGIN_KEY, JSON.stringify(next));
    return next;
  } catch {
    return {};
  }
}

export type EventName =
  | "pagina_vista"
  | "busqueda_hecha"
  | "busqueda_vacia"
  | "viaje_visto"
  | "reserva_pedida"
  /* CHAQUE ÉTAPE DE LA PUBLICATION, une par une. Sans ça, on savait
     seulement combien de viajes étaient publiés — jamais où les autres
     s'arrêtaient. Un formulaire qui perd 60 % des gens à l'étape « tu
     carro » et un formulaire qui les perd à « aporte » demandent deux
     corrections opposées, et rien ne permettait de les distinguer. */
  | "publicacion_paso"
  | "publicacion_hecha"
  | "cuenta_creada"
  | "sesion_iniciada";

type Context = {
  origin_slug?: string;
  destination_slug?: string;
  props?: Record<string, unknown>;
};

/**
 * Envoie un événement. Ne rend jamais d'erreur, n'attend jamais : la
 * mesure ne doit pas pouvoir ralentir ni casser une réservation.
 */
export function track(name: EventName, context: Context = {}): void {
  if (typeof window === "undefined") return;
  const client = isSupabaseConfigured ? getSupabase() : null;
  if (!client) return;

  const row = {
    name,
    session_id: sessionId(),
    ...origin(),
    path: window.location.pathname,
    origin_slug: context.origin_slug ?? null,
    destination_slug: context.destination_slug ?? null,
    device: window.matchMedia("(max-width: 899px)").matches
      ? "movil"
      : "escritorio",
    props: context.props ?? {},
  };

  void client
    .from("events")
    .insert(row)
    .then(
      () => undefined,
      () => undefined,
    );
}
