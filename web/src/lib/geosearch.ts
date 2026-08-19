/**
 * RECHERCHE DE LIEUX — TROIS FOURNISSEURS EN PARALLÈLE.
 *
 * Aucune base ne connaît tous les lieux du Panama. Mapbox rate des PH
 * que TomTom connaît ; TomTom rate des barriadas que la communauté
 * OpenStreetMap (LocationIQ) a cartographiées ; et inversement. Plutôt
 * que de parier sur un fournisseur, on interroge les trois EN MÊME
 * TEMPS et on fusionne : le lieu n'a besoin d'exister que dans UNE base
 * pour sortir.
 *
 *   · TomTom Search — référentiel commercial fort (POI, immeubles,
 *     commerces), coordonnées directes dans la réponse.
 *   · LocationIQ Autocomplete — OpenStreetMap : ce que les Panaméens
 *     ont cartographié eux-mêmes, coordonnées directes.
 *   · Mapbox Search Box — déjà en place ; ses coordonnées demandent
 *     l'étape retrieve, faite au clic.
 *
 * Chaque fournisseur qui échoue (clé absente, quota, réseau) disparaît
 * en silence : Promise.allSettled, jamais de rejet global. Les clés
 * sont des clés PUBLIQUES côté client, comme le jeton Mapbox — à
 * restreindre par domaine dans chaque console.
 */

import {
  geocodePlaces,
  suggestPlaces,
  MAPBOX_TOKEN,
  type GeocodedPlace,
} from "./mapbox";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import {
  adivinarKind,
  ciudadDe,
  contextoDe,
  deduplicar,
  ordenar,
  type PlaceRef,
} from "./place";

const TOMTOM_KEY = process.env.NEXT_PUBLIC_TOMTOM_KEY ?? "";
const LOCATIONIQ_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY ?? "";

/** Un lieu trouvé, quel que soit le fournisseur. lat/lng à 0 = inconnues
 *  pour l'instant (Mapbox suggest) — `mapboxId` permet de les obtenir. */
export type FoundPlace = GeocodedPlace & { mapboxId?: string };

/**
 * BRUT → MODÈLE. C'est ici que « Multiplaza » cesse d'être une chaîne de
 * caractères pour devenir un lieu qui connaît son type et sa ville — donc
 * qui peut survivre au changement d'écran sans se faire remplacer par
 * « Ciudad de Panamá ». Voir l'en-tête de place.ts.
 *
 * `lat/lng` à 0 signifie « inconnu » chez Mapbox suggest, pas « au large
 * du golfe de Guinée » : on les traduit en `null` pour que le reste du
 * code puisse faire la différence.
 */
function comoPlaceRef(bruto: FoundPlace, fuente: PlaceRef["fuente"]): PlaceRef {
  const tienePunto =
    Number.isFinite(bruto.lat) &&
    Number.isFinite(bruto.lng) &&
    !(bruto.lat === 0 && bruto.lng === 0);
  const punto = tienePunto ? { lat: bruto.lat, lng: bruto.lng } : null;
  const citySlug = ciudadDe(punto, bruto.context ?? "");
  return {
    nombre: bruto.name.trim(),
    kind: adivinarKind(bruto.name, bruto.context ?? ""),
    citySlug,
    /* La ville connue l'emporte sur le contexte du fournisseur : « David
       · Chiriquí » se lit mieux que « Av. Central, Distrito de David ». */
    contexto: citySlug ? contextoDe(citySlug) : (bruto.context ?? ""),
    lat: punto?.lat ?? null,
    lng: punto?.lng ?? null,
    fuente,
    fuenteId: bruto.mapboxId,
  };
}

async function tomtomSearch(
  query: string,
  near?: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<FoundPlace[]> {
  if (!TOMTOM_KEY) return [];
  const params = new URLSearchParams({
    key: TOMTOM_KEY,
    countrySet: "PA",
    language: "es-MX",
    limit: "5",
    typeahead: "true",
  });
  if (near) {
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lng));
  }
  const res = await fetch(
    `https://api.tomtom.com/search/2/search/` +
      `${encodeURIComponent(query)}.json?${params}`,
    { signal },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results?: {
      poi?: { name?: string };
      address?: {
        freeformAddress?: string;
        municipality?: string;
        streetName?: string;
      };
      position?: { lat: number; lon: number };
    }[];
  };
  return (data.results ?? [])
    .filter((r) => r.position)
    .map((r) => {
      const name =
        r.poi?.name ??
        r.address?.freeformAddress ??
        r.address?.streetName ??
        query;
      const context = r.poi?.name
        ? (r.address?.freeformAddress ?? r.address?.municipality ?? "")
        : (r.address?.municipality ?? "");
      return {
        name,
        context: context.replace(/, Panam[aá]$/i, ""),
        lat: r.position!.lat,
        lng: r.position!.lon,
      };
    });
}

async function locationiqSearch(
  query: string,
  signal?: AbortSignal,
): Promise<FoundPlace[]> {
  if (!LOCATIONIQ_KEY) return [];
  const params = new URLSearchParams({
    key: LOCATIONIQ_KEY,
    q: query,
    countrycodes: "pa",
    limit: "5",
    dedupe: "1",
    "accept-language": "es",
  });
  const res = await fetch(
    `https://api.locationiq.com/v1/autocomplete?${params}`,
    { signal },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    display_place?: string;
    display_address?: string;
    display_name?: string;
    lat: string;
    lon: string;
  }[];
  if (!Array.isArray(data)) return [];
  return data.map((r) => ({
    name: r.display_place ?? (r.display_name ?? query).split(",")[0],
    context: (r.display_address ?? r.display_name ?? "")
      .replace(/, Panam[aá]$/i, "")
      .slice(0, 80),
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}

/**
 * NOTRE BASE À NOUS — interrogée EN PREMIER.
 *
 * La table `places` (migration 0013) contient l'extrait OpenStreetMap
 * du Panama plus tous les points que les utilisateurs ont écrits et
 * confirmés. C'est le seul fournisseur qui connaît « PH Torre Mistral »
 * parce que quelqu'un l'a tapé chez nous. Elle répond en un aller-retour
 * et ne coûte rien par requête ; les trois fournisseurs externes ne
 * servent plus qu'à combler ce qu'elle ignore encore.
 *
 * Tant que Supabase n'est pas branché, elle rend une liste vide et la
 * recherche se comporte exactement comme avant.
 */
async function ownPlaces(
  query: string,
  citySlug?: string,
  signal?: AbortSignal,
): Promise<FoundPlace[]> {
  const client = isSupabaseConfigured ? getSupabase() : null;
  if (!client) return [];
  try {
    const query$ = client.rpc("search_places", {
      q: query,
      near_city: citySlug ?? null,
      max_results: 6,
    });
    const { data, error } = await (signal
      ? query$.abortSignal(signal)
      : query$);
    if (error || !data) return [];
    return (data as {
      name: string;
      address: string | null;
      city_slug: string;
      lat: number;
      lng: number;
    }[]).map((row) => ({
      name: row.name,
      context: row.address ?? "",
      lat: row.lat,
      lng: row.lng,
    }));
  } catch {
    return [];
  }
}

/**
 * La recherche combinée. L'ordre de fusion privilégie les fournisseurs
 * à coordonnées directes (TomTom, LocationIQ) puis Mapbox ; les
 * doublons se reconnaissent au nom normalisé. Six résultats maximum —
 * au-delà, une liste de suggestions devient une liste de lecture.
 */
export async function searchEverywhere(
  query: string,
  near?: { lat: number; lng: number },
  signal?: AbortSignal,
  /** Ville de la recherche : elle départage deux « Super 99 ». */
  citySlug?: string,
): Promise<PlaceRef[]> {
  if (query.trim().length < 3) return [];
  const settled = await Promise.allSettled([
    ownPlaces(query, citySlug, signal),
    tomtomSearch(query, near, signal),
    locationiqSearch(query, signal),
    MAPBOX_TOKEN
      ? suggestPlaces(query, near, signal)
      : Promise.resolve([] as FoundPlace[]),
  ]);
  /* LA FUSION — et la correction du bug « Super 99 ».

     L'ancienne version dédoublonnait sur le NOM normalisé, dans l'ordre
     où les fournisseurs répondaient. Deux conséquences, toutes deux
     mauvaises : les quinze Super 99 du pays s'effondraient en un seul,
     arbitrairement celui du réseau le plus rapide ; et le classement
     était le hasard, pas la pertinence.

     Maintenant : on convertit tout en `PlaceRef` (donc chaque lieu sait
     son TYPE et sa VILLE), on dédoublonne sur nom + proximité, puis on
     classe. Voir place.ts et sa batterie de tests. */
  const FUENTES = ["propia", "tomtom", "locationiq", "mapbox"] as const;
  const todos: PlaceRef[] = [];
  settled.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    for (const bruto of result.value) {
      if (!bruto.name?.trim()) continue;
      todos.push(comoPlaceRef(bruto, FUENTES[i] ?? "libre"));
    }
  });
  const merged = ordenar(deduplicar(todos), query, near);
  /* Personne n'a répondu ? Le géocodeur v5 de Mapbox reste un dernier
     filet pour les rues. */
  if (merged.length === 0 && MAPBOX_TOKEN) {
    try {
      const brutos = await geocodePlaces(query, near, signal);
      return ordenar(
        deduplicar(brutos.map((b) => comoPlaceRef(b, "mapbox"))),
        query,
        near,
      ).slice(0, 6);
    } catch {
      return [];
    }
  }
  return merged.slice(0, 6);
}

/**
 * LES LIEUX AUTOUR D'UN POINT — pour proposer un ramassage qui ait du sens.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Demande répétée : « quand je sélectionne une course, je devrais avoir
 * trois ou quatre recommandations de lieux communs autour de moi ».
 * Elle n'était pas satisfaite parce qu'aucune source ne savait répondre
 * à « qu'est-ce qu'il y a près d'ici ? » — les autres fonctions de ce
 * fichier cherchent un NOM, pas un voisinage.
 *
 * `/nearby` de LocationIQ le fait, sur OpenStreetMap, pour tout le
 * Panama et sans base à tenir à jour. On se limite à des catégories qui
 * font de vrais points de rendez-vous : une station-service, un mall, un
 * supermarché ou un parc se trouvent de nuit, se décrivent au téléphone
 * et ont un parking. Une pharmacie ou un salon de coiffure, non.
 *
 * TOUT ÉCHEC REND UNE LISTE VIDE. Pas de clé, quota dépassé, réseau
 * coupé, format inattendu : l'écran retombe sur ce qu'il faisait avant —
 * la personne écrit son point elle-même. Une recommandation absente est
 * un confort en moins ; une recommandation fausse envoie quelqu'un
 * attendre au mauvais endroit.
 * ─────────────────────────────────────────────────────────────────────
 */
export async function lugaresCerca(
  centro: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<PlaceRef[]> {
  if (!LOCATIONIQ_KEY) return [];
  const params = new URLSearchParams({
    key: LOCATIONIQ_KEY,
    lat: String(centro.lat),
    lon: String(centro.lng),
    /* Des points de rendez-vous, pas des commerces au hasard. */
    tag: "amenity:fuel,shop:mall,shop:supermarket,leisure:park",
    radius: "4000",
    limit: "12",
    format: "json",
  });
  try {
    const res = await fetch(`https://api.locationiq.com/v1/nearby?${params}`, {
      signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    const salida: PlaceRef[] = [];
    for (const bruto of data) {
      {
        const r = bruto as {
          name?: string;
          display_name?: string;
          lat?: string | number;
          lon?: string | number;
        };
        const nombre = (r.name ?? r.display_name ?? "").split(",")[0].trim();
        const lat = Number(r.lat);
        const lng = Number(r.lon);
        if (!nombre || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const citySlug = ciudadDe({ lat, lng });
        salida.push({
          nombre,
          kind: adivinarKind(nombre),
          citySlug,
          contexto: citySlug ? contextoDe(citySlug) : "",
          lat,
          lng,
          fuente: "locationiq",
        });
      }
    }
    return salida;
  } catch {
    return [];
  }
}

export const GEOSEARCH_ENABLED = Boolean(
  TOMTOM_KEY || LOCATIONIQ_KEY || MAPBOX_TOKEN,
);
