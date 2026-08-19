/**
 * MAPBOX — EN IMAGES STATIQUES, PAS EN BIBLIOTHÈQUE.
 *
 * La vraie carte, le vrai tracé, et ZÉRO octet de JavaScript : l'API Static
 * Images rend la carte côté Mapbox et nous renvoie une image, mise en cache
 * par leur CDN. Sur un export statique visé par des téléphones en données
 * mobiles, c'est le bon échange — Mapbox GL JS coûterait ~230 Ko de bundle
 * plus les tuiles, pour des cartes qui n'ont pas besoin d'être manipulées.
 *
 * Le jeton est un jeton PUBLIC (`pk.`) — fait pour être embarqué côté
 * client. Il vit néanmoins en variable d'environnement et pas dans ce
 * fichier : la protection anti-secrets de GitHub reconnaît le motif Mapbox
 * et refuse tout push qui le contient. Tant que le dépôt n'a pas autorisé
 * ce jeton (bouton « allow » de l'alerte), les déploiements se font sans
 * lui — et la carte s'active toute seule dès qu'il est là au build.
 */

import { CITIES, type Corridor } from "./corridors.ts";
import { MAP_CAMERA } from "./map.ts";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Encodage « polyline » de Google, précision 5 — le format que Mapbox lit. */
function encodePolyline(points: [number, number][]): string {
  let out = "";
  let prevLat = 0;
  let prevLng = 0;
  for (const [lat, lng] of points) {
    for (const [value, prev] of [
      [Math.round(lat * 1e5), prevLat],
      [Math.round(lng * 1e5), prevLng],
    ] as const) {
      let d = value - prev;
      d = d < 0 ? ~(d << 1) : d << 1;
      while (d >= 0x20) {
        out += String.fromCharCode((0x20 | (d & 0x1f)) + 63);
        d >>= 5;
      }
      out += String.fromCharCode(d + 63);
    }
    prevLat = Math.round(lat * 1e5);
    prevLng = Math.round(lng * 1e5);
  }
  return out;
}

const cityBySlug = (slug: string) =>
  Object.values(CITIES).find((c) => c.slug === slug)!;

/**
 * L'image du corridor : le tracé ambre relie les villes traversées, un
 * anneau bleu au départ, une épingle verte à l'arrivée — le même langage
 * que partout ailleurs sur le site (bleu = origine, vert = destination,
 * ambre = la route). `auto` cadre sur le contenu, le padding respire.
 */
export function corridorMapUrl(
  corridor: Corridor,
  width = 760,
  height = 440,
): string {
  const points = corridor.waypoints.map((w) => {
    const city = cityBySlug(w.citySlug);
    return [city.lat, city.lng] as [number, number];
  });
  const path = `path-4+f59e0b-0.9(${encodeURIComponent(encodePolyline(points))})`;

  const origin = cityBySlug(corridor.origin.slug);
  const destination = cityBySlug(corridor.destination.slug);
  const pins =
    `pin-s+9e4409(${origin.lng},${origin.lat})` +
    `,pin-s+4d7c0f(${destination.lng},${destination.lat})`;

  return (
    `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
    `${path},${pins}/auto/${width}x${height}@2x` +
    `?padding=56&access_token=${MAPBOX_TOKEN}`
  );
}

/** Un résultat du géocodeur, réduit à ce que l'interface affiche. */
export type GeocodedPlace = {
  /** Nom court (« Multicentro ») */
  name: string;
  /** Contexte lisible (« Avenida Balboa, Panamá ») */
  context: string;
  lat: number;
  lng: number;
};

/**
 * Recherche de lieux via le géocodeur Mapbox — le jeton public suffit.
 *
 * Borné au Panama, en espagnol, centré sur la ville concernée pour que
 * « el rey » trouve le supermarché d'à côté et pas celui de David. Toute
 * erreur (réseau, quota, jeton absent) renvoie une liste vide : le
 * catalogue local et la saisie libre restent, rien ne casse jamais.
 */
export async function geocodePlaces(
  query: string,
  near?: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<GeocodedPlace[]> {
  if (!MAPBOX_TOKEN || query.trim().length < 3) return [];
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    country: "pa",
    language: "es",
    limit: "5",
    types: "poi,address,neighborhood,locality,place",
  });
  if (near) params.set("proximity", `${near.lng},${near.lat}`);
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
        `${encodeURIComponent(query.trim())}.json?${params}`,
      { signal },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      features?: {
        text_es?: string;
        text: string;
        place_name_es?: string;
        place_name: string;
        center: [number, number];
      }[];
    };
    return (data.features ?? []).map((f) => {
      const name = f.text_es ?? f.text;
      const full = f.place_name_es ?? f.place_name;
      const context = full
        .replace(`${name}, `, "")
        .replace(/, Panam[aá]$/i, "");
      return { name, context, lng: f.center[0], lat: f.center[1] };
    });
  } catch {
    return [];
  }
}

let searchSession: string | null = null;

/**
 * Suggestions via l'API Search Box — le référentiel RICHE de Mapbox.
 *
 * Le géocodeur v5 connaît les rues et les pueblos mais rate beaucoup de
 * bâtiments : un PH de la ville (les tours résidentielles s'appellent
 * « PH … » au Panama) n'y est souvent pas. Search Box couvre les POI,
 * les commerces et les immeubles. On ne demande que des LIBELLÉS — pas
 * besoin de l'étape retrieve ni de coordonnées pour un point de
 * rendez-vous. Le session_token regroupe les frappes d'une même
 * recherche pour la facturation Mapbox.
 */
export type SuggestedPlace = GeocodedPlace & { mapboxId: string };

export async function suggestPlaces(
  query: string,
  near?: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<SuggestedPlace[]> {
  if (!MAPBOX_TOKEN || query.trim().length < 3) return [];
  searchSession ??=
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Math.floor(Math.random() * 1e9)}`;
  const params = new URLSearchParams({
    q: query.trim(),
    access_token: MAPBOX_TOKEN,
    session_token: searchSession,
    language: "es",
    country: "pa",
    limit: "6",
  });
  if (near) params.set("proximity", `${near.lng},${near.lat}`);
  try {
    const res = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`,
      { signal },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      suggestions?: {
        name: string;
        place_formatted?: string;
        mapbox_id: string;
      }[];
    };
    return (data.suggestions ?? []).map((s) => ({
      name: s.name,
      context: (s.place_formatted ?? "").replace(/, Panam[aá]$/i, ""),
      lat: 0,
      lng: 0,
      mapboxId: s.mapbox_id,
    }));
  } catch {
    return [];
  }
}

/**
 * Les coordonnées d'une suggestion Search Box — l'étape « retrieve ».
 * Une seule requête, au moment où l'utilisateur CHOISIT : c'est elle qui
 * permet de rattacher un PH ou un commerce à la ville desservie la plus
 * proche. Renvoie null en cas d'échec — l'appelant décide du repli.
 */
export async function retrievePlace(
  mapboxId: string,
  signal?: AbortSignal,
): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN || !searchSession) return null;
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    session_token: searchSession,
  });
  try {
    const res = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/` +
        `${encodeURIComponent(mapboxId)}?${params}`,
      { signal },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: { geometry?: { coordinates?: [number, number] } }[];
    };
    const coords = data.features?.[0]?.geometry?.coordinates;
    return coords ? { lng: coords[0], lat: coords[1] } : null;
  } catch {
    return null;
  }
}

/**
 * La vue d'ensemble du pays pour le sélecteur de la recherche. PAS de
 * marqueurs dans l'image : les villes sont les boutons interactifs posés
 * par-dessus, projetés dans le MÊME Mercator par la MÊME caméra — c'est ce
 * qui les fait tomber au pixel. `@2x` : l'image sert un conteneur fluide.
 */
export function panamaOverviewUrl(activeCorridor?: Corridor): string {
  const { centerLng, centerLat, zoom, width, height } = MAP_CAMERA;
  /* Le tracé actif est DESSINÉ PAR L'API, dans l'image : il suit la
     chaîne des villes traversées (Panamá → La Chorrera → Coronado…),
     pas une courbe abstraite par-dessus. L'image change quand la
     sélection change — un simple échange de src. */
  const path = activeCorridor
    ? `path-4+f59e0b-0.92(${encodeURIComponent(
        encodePolyline(
          activeCorridor.waypoints.map((w) => {
            const city = cityBySlug(w.citySlug);
            return [city.lat, city.lng] as [number, number];
          }),
        ),
      )})/`
    : "";
  return (
    `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
    `${path}${centerLng.toFixed(5)},${centerLat.toFixed(5)},${zoom.toFixed(3)},0/` +
    `${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`
  );
}

/**
 * La carte du recorrido pendant la publication : le tracé, l'origine
 * (bleu), la destination (vert), et UNE épingle ambre par ville où le
 * conducteur accepte de s'arrêter — elle apparaît quand il coche, elle
 * disparaît quand il décoche. Dynamique par échange de src : zéro
 * bibliothèque, la carte suit l'état du formulaire.
 */
export function corridorStopsMapUrl(
  corridor: Corridor,
  selectedCitySlugs: string[],
  width = 720,
  height = 300,
): string {
  const points = corridor.waypoints.map((w) => {
    const city = cityBySlug(w.citySlug);
    return [city.lat, city.lng] as [number, number];
  });
  const path = `path-4+f59e0b-0.9(${encodeURIComponent(encodePolyline(points))})`;

  const origin = cityBySlug(corridor.origin.slug);
  const destination = cityBySlug(corridor.destination.slug);
  const stopPins = selectedCitySlugs
    .map((slug) => {
      const city = cityBySlug(slug);
      return city ? `,pin-s+f59e0b(${city.lng},${city.lat})` : "";
    })
    .join("");
  const pins =
    `pin-s+9e4409(${origin.lng},${origin.lat})` +
    `,pin-s+4d7c0f(${destination.lng},${destination.lat})` +
    stopPins;

  return (
    `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
    `${path},${pins}/auto/${width}x${height}@2x` +
    `?padding=48&access_token=${MAPBOX_TOKEN}`
  );
}
