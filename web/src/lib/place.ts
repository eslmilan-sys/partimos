/**
 * LE LIEU — l'objet qui garde l'intention de la personne.
 *
 * ─────────────────────────────────────────────────────────────────────
 * LE BUG QUE CE MODULE EXISTE POUR TUER.
 *
 * Avant lui, l'origine et la destination étaient des SLUGS DE VILLE.
 * `CityCombobox` rendait `onChange("panama-city")`, `LastSearch` gardait
 * `{ from, to }`, l'URL portait `?desde=panama-city`. Conséquence vécue :
 * on cherchait « Multiplaza », on validait, et l'écran suivant affichait
 * « Ciudad de Panamá ». Rien n'était cassé au sens technique — le type
 * n'avait simplement NULLE PART où ranger « Multiplaza ».
 *
 * On ne répare pas ça dans l'affichage. On le répare en transportant
 * trois informations distinctes, et en interdisant qu'elles se
 * remplacent l'une l'autre :
 *
 *   · CE QU'ON A CHOISI   `nombre`         montré, toujours, tel quel
 *   · OÙ ÇA SE TROUVE     `citySlug`       contexte secondaire
 *   · OÙ C'EST EXACTEMENT `lat`/`lng`      matching, jamais affiché
 *
 * La règle tient en une phrase : NEVER HIDE USER INTENT. La ville est un
 * complément d'adresse, jamais un remplaçant.
 * ─────────────────────────────────────────────────────────────────────
 */

import { ALL_CITIES } from "./corridors.ts";

/**
 * LE TYPE DE LIEU. Il n'existait pas, et son absence coûtait cher : sans
 * lui, impossible de classer un mall avant une rue, de choisir une icône,
 * ou de distinguer « David » (une ville) de « Chiriquí Mall » (un lieu
 * DANS une ville). Trois besoins, un champ.
 */
export type PlaceKind =
  | "ciudad"
  | "poi"
  | "mall"
  | "terminal"
  | "aeropuerto"
  | "residencial"
  | "barrio"
  | "libre";

/** L'ordre de préséance quand deux résultats se valent par ailleurs.
 *  Un aéroport ou un terminal AVANT un magasin : dans une app de
 *  mobilité, ce sont des points de rendez-vous, pas des adresses. */
const PESO_TIPO: Record<PlaceKind, number> = {
  ciudad: 100,
  terminal: 90,
  aeropuerto: 88,
  mall: 80,
  poi: 60,
  residencial: 55,
  barrio: 40,
  libre: 10,
};

export type PlaceRef = {
  /** CE QUE LA PERSONNE A CHOISI. Jamais réécrit, jamais remplacé par la
   *  ville — c'est la raison d'être de tout ce fichier. */
  nombre: string;
  kind: PlaceKind;
  /** La ville qui SERT AU MATCHING. `null` pour un lieu qu'aucune ville
   *  connue ne couvre : on le garde quand même, on ne le jette pas. */
  citySlug: string | null;
  /** Le complément affiché SOUS le nom (« Panamá · Panamá »). */
  contexto: string;
  lat: number | null;
  lng: number | null;
  /** D'où vient ce lieu — sert au classement et au dédoublonnage. */
  fuente: "propia" | "tomtom" | "locationiq" | "mapbox" | "catalogo" | "libre";
  /** L'identifiant chez la source, quand elle en donne un. */
  fuenteId?: string;
};

/* ══════════════════════════════════════════════════════════════════════
   NORMALISATION — la base de tout le reste.
   ══════════════════════════════════════════════════════════════════════ */

/** Sans accents, sans casse, sans espaces superflus. « Chiriquí » et
 *  « chiriqui » sont le même mot : un Panaméen qui tape vite n'accentue
 *  pas, et lui rendre zéro résultat pour ça serait absurde. */
export function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** La distance en kilomètres entre deux points (haversine). Sert au
 *  dédoublonnage et au classement par proximité. */
export function distanciaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ══════════════════════════════════════════════════════════════════════
   DEVINER LE TYPE — sans base de POI typée, on lit le nom.

   Ce n'est pas de la magie : c'est un repli honnête. Les fournisseurs
   externes ne rendent pas tous une catégorie exploitable, et un mauvais
   type dégrade seulement le classement — il ne casse jamais la recherche.
   ══════════════════════════════════════════════════════════════════════ */

const REGLAS: { patron: RegExp; kind: PlaceKind }[] = [
  { patron: /\b(aeropuerto|airport|tocumen|albrook field)\b|^pty$/i, kind: "aeropuerto" },
  { patron: /\b(terminal|piquera|parada de buses)\b/i, kind: "terminal" },
  { patron: /\b(mall|multiplaza|metromall|megamall|centro comercial|plaza)\b/i, kind: "mall" },
  { patron: /\bph\b|\b(residencial|urbanizaci[oó]n|barriada|condominio|torre[s]?)\b/i, kind: "residencial" },
  { patron: /\b(corregimiento|barrio)\b/i, kind: "barrio" },
];

export function adivinarKind(nombre: string, contexto = ""): PlaceKind {
  /* Une ville connue reste une ville, quoi que dise le nom. */
  const n = normalizar(nombre);
  if (ALL_CITIES.some((c) => normalizar(c.name) === n || normalizar(c.shortName) === n)) {
    return "ciudad";
  }
  for (const { patron, kind } of REGLAS) {
    if (patron.test(nombre) || patron.test(contexto)) return kind;
  }
  return "poi";
}

/* ══════════════════════════════════════════════════════════════════════
   RATTACHER À UNE VILLE — la moitié « matching » du problème.
   ══════════════════════════════════════════════════════════════════════ */

/** La ville connue la plus proche, à condition d'être VRAIMENT proche.
 *  Au-delà de 45 km on rend `null` plutôt que de rattacher Boquete à
 *  David : un rattachement faux produit des résultats de recherche faux,
 *  ce qui est pire qu'un lieu sans ville. */
export function ciudadDe(
  punto: { lat: number; lng: number } | null,
  contexto = "",
): string | null {
  if (punto && Number.isFinite(punto.lat) && Number.isFinite(punto.lng)) {
    let mejor: { slug: string; km: number } | null = null;
    for (const c of ALL_CITIES) {
      const km = distanciaKm(punto, { lat: c.lat, lng: c.lng });
      if (!mejor || km < mejor.km) mejor = { slug: c.slug, km };
    }
    if (mejor && mejor.km <= 45) return mejor.slug;
  }
  /* Pas de coordonnées : on lit le contexte (« …, David, Chiriquí »). */
  const ctx = normalizar(contexto);
  if (ctx) {
    for (const c of ALL_CITIES) {
      if (ctx.includes(normalizar(c.name)) || ctx.includes(normalizar(c.shortName))) {
        return c.slug;
      }
    }
  }
  return null;
}

/** Le libellé secondaire, celui qui vit SOUS le nom. On ne répète jamais
 *  le nom dedans : « Multiplaza / Multiplaza, Panamá » est du bruit. */
export function contextoDe(citySlug: string | null, bruto = ""): string {
  const ciudad = ALL_CITIES.find((c) => c.slug === citySlug);
  if (ciudad) {
    return ciudad.province && ciudad.province !== ciudad.shortName
      ? `${ciudad.shortName} · ${ciudad.province}`
      : ciudad.shortName;
  }
  return bruto.replace(/,\s*Panam[aá]\s*$/i, "").trim();
}

/* ══════════════════════════════════════════════════════════════════════
   DÉDOUBLONNAGE — le bug « Super 99 ».

   L'ancienne règle dédoublonnait sur le NOM normalisé. Conséquence : les
   quinze « Super 99 » du pays s'effondraient en UN SEUL, arbitrairement
   celui du fournisseur le plus rapide. Deux lieux qui portent le même nom
   à trente kilomètres l'un de l'autre sont deux lieux différents.
   ══════════════════════════════════════════════════════════════════════ */

/** Même nom ET moins de 2 km : c'est le même endroit vu par deux
 *  fournisseurs. Même nom mais loin : deux endroits homonymes, on garde
 *  les deux. Sans coordonnées des deux côtés, on retombe sur la ville. */
export function esElMismo(a: PlaceRef, b: PlaceRef): boolean {
  if (normalizar(a.nombre) !== normalizar(b.nombre)) return false;
  if (a.lat !== null && a.lng !== null && b.lat !== null && b.lng !== null) {
    return distanciaKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }) < 2;
  }
  /* L'UN DES DEUX NE SAIT PAS OÙ IL EST. C'est le cas courant : Mapbox
     « suggest » rend des noms sans coordonnées, TomTom rend les deux.
     Deux villes DIFFÉRENTES et connues tranchent — sinon, l'absence
     d'information n'est pas une preuve de différence, et on fusionne.
     Se tromper ici coûte un doublon dans la liste ; l'inverse coûtait
     les coordonnées du lieu, donc le matching. */
  if (a.citySlug && b.citySlug) return a.citySlug === b.citySlug;
  return true;
}

export function deduplicar(lugares: PlaceRef[]): PlaceRef[] {
  const salida: PlaceRef[] = [];
  for (const lugar of lugares) {
    const gemelo = salida.find((y) => esElMismo(y, lugar));
    if (!gemelo) {
      salida.push(lugar);
      continue;
    }
    /* Le doublon peut être MEILLEUR que le gardé : s'il apporte des
       coordonnées que l'autre n'a pas, on complète au lieu de jeter. */
    if (gemelo.lat === null && lugar.lat !== null) {
      gemelo.lat = lugar.lat;
      gemelo.lng = lugar.lng;
      if (!gemelo.citySlug) gemelo.citySlug = lugar.citySlug;
    }
  }
  return salida;
}

/* ══════════════════════════════════════════════════════════════════════
   CLASSEMENT — « quel résultat Partimos montre EN PREMIER ».

   Il n'y en avait aucun : l'ordre était celui où les fournisseurs
   répondaient, c'est-à-dire le hasard du réseau.
   ══════════════════════════════════════════════════════════════════════ */

export function puntuar(
  lugar: PlaceRef,
  consulta: string,
  cerca?: { lat: number; lng: number } | null,
): number {
  const q = normalizar(consulta);
  const n = normalizar(lugar.nombre);
  let p = 0;

  /* 1. La correspondance du nom domine tout le reste. Quelqu'un qui tape
        « David » veut David, pas « Davidson Tienda ». */
  if (n === q) p += 1000;
  else if (n.startsWith(q)) p += 600;
  else if (n.includes(q)) p += 300;
  else p += 50;

  /* À CORRESPONDANCE ÉGALE, LE PLUS COURT GAGNE. Quelqu'un qui tape
     « multi » veut « Multiplaza » avant « Multiplaza Pacific » : le nom
     le plus court est celui qui contient le moins de choses qu'il n'a
     PAS demandées. Plafonné pour rester un départage, pas un critère. */
  p -= Math.min(40, Math.max(0, n.length - q.length) * 1.5);

  /* 2. Le type : points de rendez-vous d'abord. */
  p += PESO_TIPO[lugar.kind];

  /* 3. Notre propre base passe devant : elle contient ce que les gens
        d'ici ont réellement écrit et réutilisé. */
  if (lugar.fuente === "propia") p += 120;
  else if (lugar.fuente === "catalogo") p += 90;

  /* 4. Un lieu situable vaut mieux qu'un lieu flottant. */
  if (lugar.citySlug) p += 40;
  if (lugar.lat !== null) p += 25;

  /* 5. La proximité, en dernier et en douceur : elle départage, elle ne
        décide pas. 200 km de distance coûtent 40 points, pas 400. */
  if (cerca && lugar.lat !== null && lugar.lng !== null) {
    const km = distanciaKm(cerca, { lat: lugar.lat, lng: lugar.lng });
    p += Math.max(-60, 40 - km / 5);
  }
  return p;
}

export function ordenar(
  lugares: PlaceRef[],
  consulta: string,
  cerca?: { lat: number; lng: number } | null,
): PlaceRef[] {
  return [...lugares].sort(
    (a, b) => puntuar(b, consulta, cerca) - puntuar(a, consulta, cerca),
  );
}

/* ══════════════════════════════════════════════════════════════════════
   L'URL — la source de vérité du contexte de recherche.

   Pourquoi l'URL plutôt qu'un état React ou le localStorage : le retour
   du navigateur fonctionne alors gratuitement, et une recherche se
   partage par WhatsApp. Au Panama, ce deuxième point n'est pas un détail.

   On écrit le NOM à côté de l'identifiant, volontairement redondant :
   l'écran suivant peut afficher « Multiplaza » AVANT le moindre appel
   réseau. Un écran qui affiche d'abord « Panamá » puis se corrige est
   pire qu'un écran lent — il donne l'impression de s'être trompé.
   ══════════════════════════════════════════════════════════════════════ */

export function aParams(lugar: PlaceRef | null, prefijo: "o" | "d"): Record<string, string> {
  if (!lugar) return {};
  const out: Record<string, string> = {
    [prefijo]: lugar.citySlug ?? "",
    [`${prefijo}Nom`]: lugar.nombre,
    [`${prefijo}Tipo`]: lugar.kind,
  };
  if (lugar.lat !== null && lugar.lng !== null) {
    out[`${prefijo}Pos`] = `${lugar.lat.toFixed(5)},${lugar.lng.toFixed(5)}`;
  }
  return out;
}

export function deParams(
  params: URLSearchParams | Record<string, string | undefined>,
  prefijo: "o" | "d",
): PlaceRef | null {
  const leer = (k: string) =>
    params instanceof URLSearchParams ? params.get(k) : (params[k] ?? null);

  const citySlug = leer(prefijo) || null;
  const nombre = leer(`${prefijo}Nom`) || "";
  if (!citySlug && !nombre) return null;

  let lat: number | null = null;
  let lng: number | null = null;
  const pos = leer(`${prefijo}Pos`);
  if (pos) {
    const [a, b] = pos.split(",").map(Number);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      lat = a;
      lng = b;
    }
  }

  /* SANS NOM, LA VILLE FAIT OFFICE DE NOM — et c'est le seul cas où
     c'est légitime : la personne a bel et bien choisi une ville. */
  const ciudad = ALL_CITIES.find((c) => c.slug === citySlug);
  const tipo = (leer(`${prefijo}Tipo`) as PlaceKind | null) ?? null;

  return {
    nombre: nombre || ciudad?.name || citySlug || "",
    kind: tipo ?? (nombre ? adivinarKind(nombre) : "ciudad"),
    citySlug,
    contexto: nombre ? contextoDe(citySlug) : "",
    lat: lat ?? ciudad?.lat ?? null,
    lng: lng ?? ciudad?.lng ?? null,
    fuente: "libre",
  };
}

/** Un lieu fabriqué à partir d'une ville connue — le cas le plus courant
 *  et le plus simple. */
export function desdeCiudad(citySlug: string): PlaceRef | null {
  const c = ALL_CITIES.find((x) => x.slug === citySlug);
  if (!c) return null;
  return {
    nombre: c.name,
    kind: "ciudad",
    citySlug: c.slug,
    contexto: c.province ?? "",
    lat: c.lat,
    lng: c.lng,
    fuente: "catalogo",
  };
}

/** Ce que la personne a tapé et qu'aucune base ne connaît. On l'accepte :
 *  « frente a la casa amarilla » est un vrai rendez-vous panaméen. */
export function libre(texto: string, citySlug: string | null): PlaceRef {
  const c = citySlug ? ALL_CITIES.find((x) => x.slug === citySlug) : null;
  return {
    nombre: texto.trim(),
    kind: "libre",
    citySlug: citySlug ?? null,
    contexto: contextoDe(citySlug),
    lat: c?.lat ?? null,
    lng: c?.lng ?? null,
    fuente: "libre",
  };
}
