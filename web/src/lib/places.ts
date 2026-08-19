/**
 * LIEUX CONNUS — les points de rencontre que tout le monde sait trouver.
 *
 * « Frente al Machetazo » est une adresse panaméenne parfaitement valide :
 * les gens se donnent rendez-vous aux centres commerciaux, aux parques
 * centraux, aux supermercados — pas à des coordonnées. Ce catalogue liste
 * les repères CONNUS de chaque ville desservie, pour que le buscador et
 * les points de ramassage parlent la langue des passagers.
 *
 * Deux règles :
 *   · JAMAIS une terminal de buses (règle produit — on ne se pose pas là
 *     où opèrent les transports commerciaux).
 *   · Uniquement des lieux réels et notoires : parques centraux dont le
 *     nom est établi, chaînes présentes dans la ville (El Machetazo est
 *     LE grand magasin de l'intérieur du pays), malls qui existent.
 *
 * Le géocodeur Mapbox complète ce catalogue pour tout le reste (une
 * adresse, un coin de rue) — voir PlacePicker. Le catalogue, lui, marche
 * hors ligne et à la première frappe.
 */

export type PlaceKind = "mall" | "parque" | "tienda" | "referencia";

export type KnownPlace = {
  citySlug: string;
  name: string;
  kind: PlaceKind;
};

export const KNOWN_PLACES: KnownPlace[] = [
  // Ciudad de Panamá
  { citySlug: "panama-city", name: "Multiplaza Pacific", kind: "mall" },
  { citySlug: "panama-city", name: "Albrook Mall", kind: "mall" },
  { citySlug: "panama-city", name: "Metromall", kind: "mall" },
  { citySlug: "panama-city", name: "Megamall (Vía España)", kind: "mall" },
  { citySlug: "panama-city", name: "Parque Omar", kind: "parque" },
  {
    citySlug: "panama-city",
    name: "Universidad de Panamá",
    kind: "referencia",
  },
  {
    citySlug: "panama-city",
    name: "Costa del Este (entrada)",
    kind: "referencia",
  },
  {
    citySlug: "panama-city",
    name: "Westland Mall (Arraiján)",
    kind: "mall",
  },
  { citySlug: "panama-city", name: "Multicentro (Avenida Balboa)", kind: "mall" },
  { citySlug: "panama-city", name: "El Dorado (centro comercial)", kind: "mall" },
  { citySlug: "panama-city", name: "Parque Urracá", kind: "parque" },

  // La Chorrera
  { citySlug: "la-chorrera", name: "Parque Libertador", kind: "parque" },
  {
    citySlug: "la-chorrera",
    name: "El Machetazo de La Chorrera",
    kind: "tienda",
  },

  // Coronado
  { citySlug: "coronado", name: "Coronado Mall", kind: "mall" },
  { citySlug: "coronado", name: "El Rey de Coronado", kind: "tienda" },

  // Penonomé
  { citySlug: "penonome", name: "El Machetazo de Penonomé", kind: "tienda" },
  { citySlug: "penonome", name: "Parque 8 de Diciembre", kind: "parque" },

  // Aguadulce
  { citySlug: "aguadulce", name: "Parque Rodolfo Chiari", kind: "parque" },
  { citySlug: "aguadulce", name: "El Machetazo de Aguadulce", kind: "tienda" },

  // Santiago
  {
    citySlug: "santiago",
    name: "Parque Juan Demóstenes Arosemena",
    kind: "parque",
  },
  { citySlug: "santiago", name: "El Machetazo de Santiago", kind: "tienda" },

  // Chitré
  { citySlug: "chitre", name: "Parque Unión", kind: "parque" },
  { citySlug: "chitre", name: "El Machetazo de Chitré", kind: "tienda" },

  // Las Tablas
  { citySlug: "las-tablas", name: "Parque Porras", kind: "parque" },

  // David
  { citySlug: "david", name: "Parque Cervantes", kind: "parque" },
  { citySlug: "david", name: "Chiriquí Mall", kind: "mall" },
  { citySlug: "david", name: "Federal Mall", kind: "mall" },
  { citySlug: "david", name: "Súper Barú (David)", kind: "tienda" },
];

export const KIND_LABELS: Record<PlaceKind, string> = {
  mall: "Centro comercial",
  parque: "Parque",
  tienda: "Tienda",
  referencia: "Punto de referencia",
};

export function placesForCity(citySlug: string): KnownPlace[] {
  return KNOWN_PLACES.filter((p) => p.citySlug === citySlug);
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Recherche un lieu connu par son nom — le buscador s'en sert pour que
 *  « multiplaza » sélectionne Ciudad de Panamá. */
/**
 * La ville desservie la plus proche d'un point — c'est elle que la
 * recherche interroge quand on tape un VRAI lieu (une barriada, un
 * restaurant, une école) plutôt qu'un nom de ville. Haversine suffit :
 * à l'échelle d'un pays, l'erreur de la sphère est négligeable.
 */
export function nearestCity(
  lat: number,
  lng: number,
  cities: { slug: string; name: string; lat: number; lng: number }[],
): { slug: string; name: string; distanceKm: number } {
  let best = cities[0];
  let bestD = Infinity;
  for (const c of cities) {
    const dLat = ((c.lat - lat) * Math.PI) / 180;
    const dLng = ((c.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((c.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const d = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return { slug: best.slug, name: best.name, distanceKm: Math.round(bestD) };
}

/**
 * CE QUI COMMENCE PAR CE QU'ON TAPE PASSE DEVANT.
 *
 * Chercher « Mu » et voir d'abord « Plaza Comercial de Multicentro »
 * parce que le mot est au milieu, c'est ce qui fait dire « ça ne
 * comprend rien ». L'ordre est donc, dans cet ordre :
 *
 *   1. le NOM commence par ce qu'on tape        → « Multiplaza »
 *   2. un MOT du nom commence par ce qu'on tape → « Parque Omar » pour « Om »
 *   3. le reste, quelque part dedans            → filet de sécurité
 *
 * Une lettre suffit : à la première frappe on montre déjà quelque chose,
 * au lieu d'attendre deux caractères comme avant.
 */
export function searchPlaces(query: string, limit = 4): KnownPlace[] {
  const q = normalize(query.trim());
  if (q.length < 1) return [];

  const rank = (name: string): number => {
    const n = normalize(name);
    if (n.startsWith(q)) return 0;
    if (n.split(/[\s(),.–—-]+/).some((word) => word.startsWith(q))) return 1;
    return n.includes(q) ? 2 : 3;
  };

  return KNOWN_PLACES.map((p) => ({ p, r: rank(p.name) }))
    .filter(({ r }) => r < 3)
    .sort((a, b) => a.r - b.r || a.p.name.length - b.p.name.length)
    .slice(0, limit)
    .map(({ p }) => p);
}
