/* Extension explicite : ce module est couvert par `node --test`, qui
   résout les ESM à la lettre — sans le `.ts`, la suite ne démarre pas. */
import { ALL_CITIES } from "./corridors.ts";

/**
 * COMBIEN LE CONDUCTEUR DÉVIE POUR TON POINT — mesuré, pas deviné.
 *
 * Le panneau de réservation demandait au passager de régler lui-même un
 * curseur « cuánto se desvía ». C'était le seul chiffre du site qu'on
 * demandait à quelqu'un d'inventer, et il commande le prix : personne ne
 * sait, de tête, si le PH où il habite fait dévier de deux ou de huit
 * kilomètres.
 *
 * Quand le lieu tapé a des coordonnées (le géocodeur les donne), on
 * mesure : distance du point à la ROUTE du conducteur — pas à la ville,
 * à la route — puis aller-retour, parce qu'il doit revenir sur son
 * chemin.
 *
 * La projection est équirectangulaire, calée sur la latitude du point.
 * À l'échelle d'un détour panaméen (quelques kilomètres, 9° de
 * latitude), l'écart avec la vraie géodésique est sous le pour cent :
 * très en dessous de l'incertitude d'un « il passe par où ».
 */

export type Punto = { lat: number; lng: number };

const R_TERRE_KM = 6371;

/** Le tracé du conducteur, en coordonnées, depuis les villes qu'il dessert. */
export function routePoints(citySlugs: string[]): Punto[] {
  return citySlugs
    .map((slug) => ALL_CITIES.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ lat: c.lat, lng: c.lng }));
}

/** Distance d'un point à un SEGMENT (pas à ses extrémités). */
function kmToSegment(p: Punto, a: Punto, b: Punto): number {
  const cos = Math.cos((p.lat * Math.PI) / 180);
  const x = (q: Punto) => ((q.lng * Math.PI) / 180) * cos * R_TERRE_KM;
  const y = (q: Punto) => ((q.lat * Math.PI) / 180) * R_TERRE_KM;

  const px = x(p);
  const py = y(p);
  const ax = x(a);
  const ay = y(a);
  const bx = x(b);
  const by = y(b);

  const dx = bx - ax;
  const dy = by - ay;
  const long2 = dx * dx + dy * dy;
  /* Deux villes au même endroit : le segment est un point. */
  if (long2 === 0) return Math.hypot(px - ax, py - ay);

  /* Où tombe la perpendiculaire, bornée au segment : au-delà des bouts,
     c'est la distance au bout — sinon on mesurerait un raccourci qui
     n'existe pas sur la route. */
  let t = ((px - ax) * dx + (py - ay) * dy) / long2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Les kilomètres EN PLUS que ce point coûte au conducteur : distance à
 * la route, multipliée par deux (il y va et il revient), arrondie au
 * demi-kilomètre — précis au mètre près serait une fausse précision.
 */
export function detourKm(point: Punto, route: Punto[]): number {
  if (route.length === 0) return 0;
  if (route.length === 1) {
    const d = kmToSegment(point, route[0], route[0]);
    return Math.round(d * 2 * 2) / 2;
  }
  let best = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const d = kmToSegment(point, route[i], route[i + 1]);
    if (d < best) best = d;
  }
  return Math.round(best * 2 * 2) / 2;
}
