/* Extension explicite : ce module est couvert par `node --test`, qui
   résout les ESM à la lettre — sans le `.ts`, la suite ne démarre pas. */
import { type Punto } from "./desvio.ts";

/**
 * OÙ ON TE RÉCUPÈRE — et ce que ça change au prix.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * LE PROBLÈME, TEL QU'IL A ÉTÉ POSÉ.
 *
 * « Si c'est un endroit précis dans Panama City et que le conducteur ne
 *  passe pas par les endroits que tu proposes, ça n'a aucun sens. La
 *  personne ne va jamais aller plus loin. »
 *
 * C'était exact, et pire que ça : les points proposés étaient TROIS
 * CHAÎNES DE CARACTÈRES par ville, identiques pour tout le monde, sans
 * aucune coordonnée. Aucun classement par proximité n'était possible —
 * l'information n'existait pas. On ne proposait pas mal : on ne
 * proposait rien, on récitait une liste.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE FAIT.
 *
 * Il projette la position du passager sur la ROUTE du conducteur. De
 * cette projection découle tout le reste :
 *
 *   · quels points proposer — ceux qui sont près de la personne ET sur
 *     le chemin, jamais un point qui la ferait reculer ;
 *   · combien elle marche jusqu'au point ;
 *   · combien le conducteur dévie pour elle ;
 *   · et surtout COMBIEN DE KILOMÈTRES ELLE PARCOURT VRAIMENT.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * LE PRIX MONTE ET DESCEND — la remarque qui a manqué au premier jet.
 *
 * « S'il descend avant, ça le rapproche, on devrait lui décompter un peu.
 *  C'est en fonction de la distance. »
 *
 * Juste, et ça a déjà une maison dans ce produit : l'aporte sort des
 * KILOMÈTRES PARCOURUS. Quelqu'un qui monte plus loin ou descend plus
 * tôt fait un trajet plus court — il doit payer moins, sans que ce soit
 * une remise commerciale : c'est le même calcul appliqué à sa distance
 * réelle.
 *
 * D'où `kmRecorridos()` : la distance LE LONG DE LA ROUTE entre les deux
 * projections, et non la distance à vol d'oiseau ni celle du corridor
 * entier. C'est elle qui remplace `baseKm` dans le devis.
 *
 * Un détour hors route s'ajoute par-dessus (`desvio.ts`), et il reste à
 * la charge de qui l'a demandé — règle §7, jamais un supplément vendu.
 * ═══════════════════════════════════════════════════════════════════════
 */

const R_TERRE_KM = 6371;

/** Projection équirectangulaire calée sur une latitude de référence.
 *  À l'échelle du Panama, l'écart avec la géodésique est sous le pour
 *  cent — très en dessous de l'incertitude d'un « il passe par où ». */
function proyector(latRef: number) {
  const cos = Math.cos((latRef * Math.PI) / 180);
  return {
    x: (q: Punto) => ((q.lng * Math.PI) / 180) * cos * R_TERRE_KM,
    y: (q: Punto) => ((q.lat * Math.PI) / 180) * R_TERRE_KM,
  };
}

export type Proyeccion = {
  /** Index du segment de la route où tombe la projection. */
  indice: number;
  /** Position sur ce segment, de 0 (début) à 1 (fin). */
  t: number;
  /** Distance du point à la route, en km. Ce que le conducteur dévie
   *  (une fois — l'aller-retour se calcule dans desvio.ts). */
  distanciaKm: number;
  /** Distance parcourue LE LONG de la route depuis son début. C'est la
   *  coordonnée qui permet de dire « avant » et « après ». */
  avanceKm: number;
};

/** Longueurs cumulées de la route, en km. */
function acumulado(route: Punto[]): number[] {
  if (route.length === 0) return [];
  const { x, y } = proyector(route[0].lat);
  const out = [0];
  for (let i = 0; i < route.length - 1; i++) {
    const d = Math.hypot(x(route[i + 1]) - x(route[i]), y(route[i + 1]) - y(route[i]));
    out.push(out[i] + d);
  }
  return out;
}

/**
 * Où ce point tombe sur la route. C'est la brique de tout le module :
 * savoir non seulement À QUELLE DISTANCE de la route on est, mais aussi
 * OÙ le long de la route — sans quoi on ne peut pas distinguer un point
 * en amont d'un point en aval, donc pas éviter de faire reculer
 * quelqu'un.
 */
export function proyectar(punto: Punto, route: Punto[]): Proyeccion | null {
  if (route.length === 0) return null;
  const { x, y } = proyector(route[0].lat);
  const acum = acumulado(route);

  if (route.length === 1) {
    return {
      indice: 0,
      t: 0,
      distanciaKm: Math.hypot(x(punto) - x(route[0]), y(punto) - y(route[0])),
      avanceKm: 0,
    };
  }

  let mejor: Proyeccion | null = null;
  const px = x(punto);
  const py = y(punto);

  for (let i = 0; i < route.length - 1; i++) {
    const ax = x(route[i]);
    const ay = y(route[i]);
    const dx = x(route[i + 1]) - ax;
    const dy = y(route[i + 1]) - ay;
    const long2 = dx * dx + dy * dy;
    let t = long2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / long2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (!mejor || d < mejor.distanciaKm) {
      mejor = {
        indice: i,
        t,
        distanciaKm: d,
        avanceKm: acum[i] + t * Math.sqrt(long2),
      };
    }
  }
  return mejor;
}

/**
 * LES KILOMÈTRES RÉELLEMENT PARCOURUS par le passager, le long de la
 * route — pas à vol d'oiseau, pas le corridor entier.
 *
 * C'est ce nombre qui doit nourrir le prix. Descendre plus tôt le fait
 * baisser ; monter plus loin aussi. Ce n'est pas une remise, c'est la
 * même formule appliquée à la vraie distance.
 *
 * Rend `null` si l'un des deux points ne se projette pas — on ne devine
 * pas un prix à partir d'une position qu'on ignore.
 */
export function kmRecorridos(
  subida: Punto,
  bajada: Punto,
  route: Punto[],
): number | null {
  const a = proyectar(subida, route);
  const b = proyectar(bajada, route);
  if (!a || !b) return null;
  /* Valeur absolue : si la personne a inversé les deux, la distance
     reste la distance. C'est le sens du viaje qui décide de l'ordre,
     pas l'ordre de saisie. */
  return Math.abs(b.avanceKm - a.avanceKm);
}

export type Candidato = {
  nombre: string;
  punto: Punto;
};

export type Propuesta = {
  nombre: string;
  punto: Punto;
  /** Ce que la personne parcourt jusqu'au point, à vol d'oiseau. On ne
   *  prétend pas connaître le trajet à pied — d'où « à environ ». */
  distanciaKm: number;
  /** Ce que le conducteur dévie pour ce point (aller-retour). */
  desvioKm: number;
  /** Où le point tombe le long de la route. Sert à ordonner et à
   *  éliminer ceux qui font reculer. */
  avanceKm: number;
};

/** Au-delà, ce n'est plus « à côté » : c'est un autre quartier, et
 *  proposer un point qu'on ne peut pas rejoindre à pied ou en cinq
 *  minutes de taxi n'aide personne. */
const RADIO_MAX_KM = 6;

/**
 * LES POINTS À PROPOSER, dans l'ordre.
 *
 * Trois règles, et la deuxième est celle qui manquait :
 *
 *   1. près de la personne (moins de RADIO_MAX_KM) ;
 *   2. JAMAIS EN ARRIÈRE — un point situé avant l'endroit où la personne
 *      rejoint la route la ferait revenir sur ses pas pour monter. C'est
 *      exactement le reproche : « elle ne va jamais aller plus loin » ;
 *   3. le moins de détour possible pour le conducteur, à distance égale.
 *
 * On tolère une petite marge en arrière (`TOLERANCIA_ATRAS_KM`) : un
 * point cinq cents mètres en amont sur la même avenue reste raisonnable,
 * et l'exclure au kilomètre près donnerait des listes vides.
 */
/* Deux kilomètres, pas un. Le reproche visait des points À DES DIZAINES
   DE KILOMÈTRES dans le mauvais sens — pas le terminal qui se trouve à
   un carrefour un peu en amont. Trop serrer produit des listes vides,
   ce qui est un pire service que de proposer une petite marche. */
const TOLERANCIA_ATRAS_KM = 2;

export function proponerPuntos(
  pasajero: Punto,
  route: Punto[],
  candidatos: Candidato[],
  cuantos = 4,
): Propuesta[] {
  const yo = proyectar(pasajero, route);
  if (!yo) return [];
  const { x, y } = proyector(pasajero.lat);

  return candidatos
    .map((c) => {
      const p = proyectar(c.punto, route);
      if (!p) return null;
      return {
        nombre: c.nombre,
        punto: c.punto,
        distanciaKm: Math.hypot(x(c.punto) - x(pasajero), y(c.punto) - y(pasajero)),
        /* Aller-retour, comme desvio.ts — c'est le même coût réel. */
        desvioKm: Math.round(p.distanciaKm * 2 * 2) / 2,
        avanceKm: p.avanceKm,
      };
    })
    .filter((p): p is Propuesta => p !== null)
    .filter((p) => p.distanciaKm <= RADIO_MAX_KM)
    .filter((p) => p.avanceKm >= yo.avanceKm - TOLERANCIA_ATRAS_KM)
    .sort((a, b) => {
      /* La proximité décide, le détour départage. Les deux comptent,
         mais marcher trois kilomètres de plus se sent tout de suite,
         alors qu'un demi-kilomètre de détour ne se voit pas. */
      const d = a.distanciaKm - b.distanciaKm;
      if (Math.abs(d) > 0.3) return d;
      return a.desvioKm - b.desvioKm;
    })
    .slice(0, cuantos);
}

/**
 * L'ÉCART DE KILOMÈTRES par rapport à ce que le viaje annonce.
 *
 * Positif : la personne parcourt plus que le trajet de référence — elle
 * paie plus. Négatif : elle parcourt moins — elle paie moins, et c'est
 * la moitié qui manquait.
 *
 * On arrondit au demi-kilomètre : afficher « +0,3 km » sur une mesure
 * dont l'incertitude dépasse le kilomètre serait une fausse précision.
 */
export function diferenciaKm(kmReales: number, kmDeReferencia: number): number {
  return Math.round((kmReales - kmDeReferencia) * 2) / 2;
}
