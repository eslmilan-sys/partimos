/**
 * PROJECTION DE LA CARTE — Web Mercator, la même que Mapbox.
 *
 * Le jour prévu par ce fichier est arrivé : la clé Mapbox existe, et la
 * vraie carte du pays passe SOUS les pastilles. Pour que les villes tombent
 * au pixel sur l'image, la projection maison est passée de l'équirectangulaire
 * au Web Mercator — celui dans lequel Mapbox rend — et la caméra de l'image
 * statique est calculée ICI, depuis le même cadre : une seule source de
 * vérité, l'image et l'interaction ne peuvent pas se désaccorder.
 *
 * Sans clé au build, rien ne change : les pastilles sur fond nu restent une
 * carte honnête — les positions sont les vraies. Un plan de métro ne ment
 * pas parce qu'il n'est pas une carte routière.
 */

import { ALL_CITIES, CORRIDORS, type City } from "./corridors";

/** Cadre de la zone couverte, avec une marge pour les étiquettes. Il a
 *  grandi avec le réseau : Changuinola à l'ouest-nord, Chepo à l'est,
 *  Pedasí au sud — tout le pays desservi tient dedans. */
const BOUNDS = {
  minLng: -82.95,
  maxLng: -78.9,
  minLat: 7.4,
  maxLat: 9.55,
};

const WIDTH = 1000;

/* Mercator « monde » à un zoom donné : x et y en pixels dans un monde de
   512 · 2^z px de côté. Formules standard, rien d'inventé. */
const mercX = (lng: number, world: number) => ((lng + 180) / 360) * world;
const mercY = (lat: number, world: number) => {
  const rad = (lat * Math.PI) / 180;
  return (
    (0.5 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / (2 * Math.PI)) * world
  );
};

/* Le zoom qui fait tenir exactement la largeur du cadre dans WIDTH px. */
const ZOOM = Math.log2((WIDTH * 360) / ((BOUNDS.maxLng - BOUNDS.minLng) * 512));
const WORLD = 512 * 2 ** ZOOM;
const LEFT = mercX(BOUNDS.minLng, WORLD);
const TOP = mercY(BOUNDS.maxLat, WORLD);
const HEIGHT = Math.round(mercY(BOUNDS.minLat, WORLD) - TOP);

export const MAP_VIEWBOX = { width: WIDTH, height: HEIGHT };

/** La caméra de l'image statique Mapbox — même cadre, même projection. */
export const MAP_CAMERA = {
  centerLng: (BOUNDS.minLng + BOUNDS.maxLng) / 2,
  /* Le centre VERTICAL se calcule en Mercator puis se reprojette en
     latitude : le milieu des latitudes n'est pas le milieu de l'image. */
  centerLat:
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * (TOP + HEIGHT / 2)) / WORLD))) *
      180) /
    Math.PI,
  zoom: ZOOM,
  width: WIDTH,
  height: HEIGHT,
};

export function project(lat: number, lng: number): { x: number; y: number } {
  const x = mercX(lng, WORLD) - LEFT;
  const y = mercY(lat, WORLD) - TOP;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export type MapCity = City & { x: number; y: number };

export const MAP_CITIES: MapCity[] = ALL_CITIES.map((city) => ({
  ...city,
  ...project(city.lat, city.lng),
}));

export function mapCity(slug: string): MapCity | undefined {
  return MAP_CITIES.find((c) => c.slug === slug);
}

/** Les corridors existants, prêts à tracer. */
export const MAP_LINKS = CORRIDORS.map((corridor) => {
  const from = mapCity(corridor.origin.slug)!;
  const to = mapCity(corridor.destination.slug)!;
  return { slug: corridor.slug, from, to, isPriority: corridor.isPriority };
});

/**
 * Une courbe douce plutôt qu'un segment : une route ne va pas tout droit, et
 * la courbure évite que deux corridors partant de Panamá se superposent.
 */
export function linkPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  // Perpendiculaire au segment, amplitude proportionnelle à sa longueur.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = Math.min(38, length * 0.12);
  const cx = mx + (-dy / length) * bend;
  const cy = my + (dx / length) * bend;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

/**
 * LE CADRAGE D'UN TRAJET — le viewBox qui contient une liste de villes.
 *
 * Deux écrans en ont besoin (la carte des résultats et l'en-tête de la
 * fiche viaje) et ils doivent cadrer PAREIL : deux calculs séparés
 * finiraient par diverger d'un pixel, puis d'un arrêt.
 *
 * On n'écrase jamais la projection. Quand le tracé est trop plat ou trop
 * étroit pour le cadre disponible — un Panamá → Chitré donnerait une
 * bande de quarante pixels de haut — on ÉLARGIT le cadre autour du
 * centre. Étirer aurait été plus court à écrire et aurait menti sur les
 * distances.
 */
export function encuadre(
  slugs: string[],
  {
    margen = 70,
    ratioMin = 0.85,
    ratioMax = 1.35,
  }: { margen?: number; ratioMin?: number; ratioMax?: number } = {},
): { x: number; y: number; w: number; h: number } | null {
  const puntos = slugs
    .map((s) => mapCity(s))
    .filter((c): c is MapCity => Boolean(c));
  if (puntos.length === 0) return null;

  let minX = Math.min(...puntos.map((p) => p.x)) - margen;
  const maxX = Math.max(...puntos.map((p) => p.x)) + margen;
  let minY = Math.min(...puntos.map((p) => p.y)) - margen;
  const maxY = Math.max(...puntos.map((p) => p.y)) + margen;

  let w = maxX - minX;
  let h = maxY - minY;

  if (w / h > ratioMax) {
    const objetivo = w / ratioMax;
    const extra = (objetivo - h) / 2;
    minY -= extra;
    h = objetivo;
  } else if (w / h < ratioMin) {
    const objetivo = h * ratioMin;
    const extra = (objetivo - w) / 2;
    minX -= extra;
    w = objetivo;
  }
  return { x: minX, y: minY, w, h };
}
