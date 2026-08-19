/**
 * Accès Supabase — tolérant à l'absence de configuration.
 *
 * Le site public doit rendre et se déployer avant que le projet Supabase
 * existe (c'est une étape ⛔ HUMAIN du brief). Chaque fonction d'accès
 * renvoie donc un repli explicite plutôt que de lever une exception : une
 * page corridor sans base affiche son contenu éditorial et masque la liste
 * des départs, au lieu de rendre une erreur 500.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let browserClient: SupabaseClient | null = null;

/**
 * Client du NAVIGATEUR — lecture publique (RLS active) ET session.
 *
 * `persistSession: false` était juste tant que ce client ne servait qu'à
 * lire des données publiques. Depuis que les comptes sont réels, c'est
 * un piège : la session ne survivait pas au rechargement qui suit la
 * saisie du code, et la personne se retrouvait déconnectée une seconde
 * après s'être connectée. Elle se garde donc, se rafraîchit toute seule,
 * et le retour d'un OAuth (Google) est reconnu dans l'URL.
 */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  browserClient ??= createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      /* IMPLICITE, ET C'EST UN CHOIX RÉFLÉCHI.
         PKCE garde un « code_verifier » dans le stockage du navigateur qui
         a DEMANDÉ le lien : le lien ne vaut alors que là. Or le chemin
         réel de nos gens est un iPhone — on demande le lien dans Safari,
         Mail l'ouvre dans son propre navigateur, et le vérificateur n'y
         est pas. La connexion échouait sans rien dire.
         En implicite, le lien porte lui-même les jetons : il marche dans
         n'importe quel navigateur, sur n'importe quel appareil. Les jetons
         passent par le dièse de l'URL — ils ne partent donc jamais vers un
         serveur — et supabase-js nettoie l'adresse aussitôt lue. */
      flowType: "implicit",
    },
  });
  return browserClient;
}

/**
 * QUELS BOUTONS SOCIAUX EXISTENT VRAIMENT.
 *
 * Google et Apple s'affichaient toujours. Or ils ne sont pas activés dans
 * le projet : les toucher envoyait sur une page d'erreur de Supabase
 * (« provider is not enabled »), c'est-à-dire une impasse au milieu de
 * l'écran de connexion. Supabase expose sa configuration publique sur
 * /auth/v1/settings — on la lit et on n'affiche que ce qui marche.
 *
 * En cas de doute (réseau coupé, réponse illisible) on laisse tout
 * affiché : mieux vaut un bouton de trop qu'un écran amputé par une
 * requête ratée.
 */
export type Proveedores = Record<string, boolean>;

export async function fetchProveedores(): Promise<Proveedores | null> {
  if (!url || !anonKey) return null;
  try {
    const r = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { external?: Record<string, boolean> };
    if (!j.external) return null;
    /* On rend la table ENTIÈRE et non deux booléens choisis d'avance.
       Les deux moitiés du produit ne proposaient pas les mêmes portes —
       Google et Apple sur le site, Google et LinkedIn dans l'app — parce
       que chacune avait codé sa propre liste. Une seule source, et
       l'écran affiche ce qui existe vraiment. */
    return j.external;
  } catch {
    return null;
  }
}

/**
 * Client serveur avec la clé de service. Réservé aux écritures que le
 * visiteur anonyme ne peut pas faire lui-même (journalisation des recherches
 * infructueuses, préinscription). Jamais importé dans un composant client :
 * la clé ne doit pas franchir la frontière réseau.
 */
export function getServiceSupabase(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/** Un départ publié, tel qu'affiché sur une page corridor. */
export type UpcomingTrip = {
  id: string;
  departureAt: string;
  priceCents: number;
  seatsAvailable: number;
  driverFirstName: string;
  driverLastInitial: string | null;
  driverIsVerified: boolean;
};

/**
 * Prochains départs d'un corridor, lus dans la vue `available_trips`.
 * Renvoie un tableau vide si la base n'est pas configurée ou si la requête
 * échoue : une page SEO ne tombe jamais à cause d'un service.
 */
export async function getUpcomingTrips(
  corridorSlug: string,
  limit = 6,
): Promise<UpcomingTrip[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("available_trips")
    .select(
      "id, departure_at, price_cents, seats_available, first_name, last_initial, is_id_verified",
    )
    .eq("corridor_slug", corridorSlug)
    .order("departure_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    departureAt: row.departure_at as string,
    priceCents: Number(row.price_cents),
    seatsAvailable: Number(row.seats_available),
    driverFirstName: row.first_name as string,
    driverLastInitial: (row.last_initial as string | null) ?? null,
    driverIsVerified: Boolean(row.is_id_verified),
  }));
}
