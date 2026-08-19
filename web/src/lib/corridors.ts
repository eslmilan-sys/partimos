/**
 * RÉFÉRENTIEL DES CORRIDORS
 *
 * Un corridor = une paire de villes = une page SEO = un jeu de paramètres de
 * prix. C'est l'unité de pilotage du produit.
 *
 * Ces données reproduisent l'amorçage de schema.sql (§12). Elles servent de
 * repli quand Supabase n'est pas encore configuré : le site se construit et
 * se déploie sans base, puis bascule sur les données réelles dès que les
 * variables d'environnement existent. Aucune page ne dépend d'un service
 * tiers pour rendre — c'est la règle du §10 du brief.
 */

import { computePriceCap, type VehicleCategory } from "./pricing.ts";
import type { Waypoint } from "./segments.ts";

export type City = {
  slug: string;
  name: string;
  /** Nom court pour les fils d'Ariane et les cartes. */
  shortName: string;
  province: string;
  /** Coordonnées réelles, reprises de l'amorçage de schema.sql. Elles
   *  positionnent les villes sur la carte schématique. */
  lat: number;
  lng: number;
  /** Étiquetée sur la carte d'ensemble. Les ~30 villes desservies y
   *  tiendraient pas : seules les majeures s'affichent, les autres se
   *  choisissent en écrivant — et apparaissent sur la carte une fois
   *  choisies. */
  isMajor?: boolean;
};

export type Corridor = {
  slug: string;
  origin: City;
  destination: City;
  distanceKm: number;
  tollCents: number;
  typicalDurationMin: number;
  isPriority: boolean;
  /** Sens du trajet. La demande existe dans les deux sens — on descend le
   *  vendredi, on remonte le dimanche — donc chaque corridor a son retour,
   *  page à part entière avec son propre contenu. `isReturn` sert aux vues
   *  qui listent : montrer douze lignes où six suffisent serait du bruit. */
  isReturn?: boolean;
  /** Points de prise en charge habituels. Jamais un terminal (§10). */
  pickupPoints: string[];
  /** Deux ou trois phrases propres au corridor : c'est ce qui distingue la
   *  page d'un gabarit dupliqué aux yeux de Google comme des lecteurs. */
  intro: string;
  /** Villes traversées, origine et destination comprises, dans l'ordre du
   *  trajet. C'est le référentiel des arrêts intermédiaires : un conducteur
   *  ne peut déclarer que des points qui sont VRAIMENT sur sa route. */
  waypoints: Waypoint[];
};

export const CITIES = {
  panama: {
    slug: "panama-city",
    name: "Ciudad de Panamá",
    shortName: "Panamá",
    province: "Panamá",
    lat: 8.9824,
    lng: -79.5199,
    isMajor: true,
  },
  chitre: {
    slug: "chitre",
    name: "Chitré",
    shortName: "Chitré",
    province: "Herrera",
    lat: 7.9614,
    lng: -80.4297,
    isMajor: true,
  },
  lasTablas: {
    slug: "las-tablas",
    name: "Las Tablas",
    shortName: "Las Tablas",
    province: "Los Santos",
    lat: 7.7667,
    lng: -80.2833,
    isMajor: true,
  },
  david: {
    slug: "david",
    name: "David",
    shortName: "David",
    province: "Chiriquí",
    lat: 8.4333,
    lng: -82.4333,
    isMajor: true,
  },
  santiago: {
    slug: "santiago",
    name: "Santiago",
    shortName: "Santiago",
    province: "Veraguas",
    lat: 8.1,
    lng: -80.9833,
    isMajor: true,
  },
  penonome: {
    slug: "penonome",
    name: "Penonomé",
    shortName: "Penonomé",
    province: "Coclé",
    lat: 8.5194,
    lng: -80.3572,
    isMajor: true,
  },
  coronado: {
    slug: "coronado",
    name: "Coronado",
    shortName: "Coronado",
    province: "Panamá Oeste",
    lat: 8.5333,
    lng: -79.95,
    isMajor: true,
  },
  chorrera: {
    slug: "la-chorrera",
    name: "La Chorrera",
    shortName: "La Chorrera",
    province: "Panamá Oeste",
    lat: 8.8803,
    lng: -79.7833,
    isMajor: true,
  },

  /* ── Panamá Oeste y Coclé, sobre la Panamericana ──────────────────── */
  arraijan: {
    slug: "arraijan",
    name: "Arraiján",
    shortName: "Arraiján",
    province: "Panamá Oeste",
    lat: 8.9553,
    lng: -79.6633,
  },
  capira: {
    slug: "capira",
    name: "Capira",
    shortName: "Capira",
    province: "Panamá Oeste",
    lat: 8.7592,
    lng: -79.8825,
  },
  chame: {
    slug: "chame",
    name: "Chame",
    shortName: "Chame",
    province: "Panamá Oeste",
    lat: 8.5762,
    lng: -79.8879,
  },
  sanCarlos: {
    slug: "san-carlos",
    name: "San Carlos",
    shortName: "San Carlos",
    province: "Panamá Oeste",
    lat: 8.4726,
    lng: -79.9575,
  },
  rioHato: {
    slug: "rio-hato",
    name: "Río Hato",
    shortName: "Río Hato",
    province: "Coclé",
    lat: 8.3781,
    lng: -80.1672,
  },
  anton: {
    slug: "anton",
    name: "Antón",
    shortName: "Antón",
    province: "Coclé",
    lat: 8.3925,
    lng: -80.2603,
  },
  nata: {
    slug: "nata",
    name: "Natá",
    shortName: "Natá",
    province: "Coclé",
    lat: 8.3333,
    lng: -80.5167,
  },
  aguadulce: {
    slug: "aguadulce",
    name: "Aguadulce",
    shortName: "Aguadulce",
    province: "Coclé",
    lat: 8.2422,
    lng: -80.5442,
  },
  elValle: {
    slug: "el-valle",
    name: "El Valle de Antón",
    shortName: "El Valle",
    province: "Coclé",
    lat: 8.6,
    lng: -80.1272,
  },

  /* ── Azuero ───────────────────────────────────────────────────────── */
  parita: {
    slug: "parita",
    name: "Parita",
    shortName: "Parita",
    province: "Herrera",
    lat: 8.0011,
    lng: -80.5217,
  },
  losSantos: {
    slug: "los-santos",
    name: "La Villa de Los Santos",
    shortName: "Los Santos",
    province: "Los Santos",
    lat: 7.9358,
    lng: -80.4194,
  },
  guarare: {
    slug: "guarare",
    name: "Guararé",
    shortName: "Guararé",
    province: "Los Santos",
    lat: 7.8158,
    lng: -80.2847,
  },
  pedasi: {
    slug: "pedasi",
    name: "Pedasí",
    shortName: "Pedasí",
    province: "Los Santos",
    lat: 7.5289,
    lng: -80.0247,
  },

  /* ── Veraguas y Chiriquí ──────────────────────────────────────────── */
  sona: {
    slug: "sona",
    name: "Soná",
    shortName: "Soná",
    province: "Veraguas",
    lat: 8.0119,
    lng: -81.3211,
  },
  tole: {
    slug: "tole",
    name: "Tolé",
    shortName: "Tolé",
    province: "Chiriquí",
    lat: 8.2333,
    lng: -81.6667,
  },
  lasLajas: {
    slug: "las-lajas",
    name: "Las Lajas",
    shortName: "Las Lajas",
    province: "Chiriquí",
    lat: 8.2436,
    lng: -81.8703,
  },
  laConcepcion: {
    slug: "la-concepcion",
    name: "La Concepción (Bugaba)",
    shortName: "La Concepción",
    province: "Chiriquí",
    lat: 8.5121,
    lng: -82.6194,
  },
  pasoCanoas: {
    slug: "paso-canoas",
    name: "Paso Canoas",
    shortName: "Paso Canoas",
    province: "Chiriquí",
    lat: 8.5333,
    lng: -82.8383,
  },
  boquete: {
    slug: "boquete",
    name: "Boquete",
    shortName: "Boquete",
    province: "Chiriquí",
    lat: 8.7803,
    lng: -82.4408,
    isMajor: true,
  },
  volcan: {
    slug: "volcan",
    name: "Volcán",
    shortName: "Volcán",
    province: "Chiriquí",
    lat: 8.7681,
    lng: -82.6394,
  },

  /* ── Colón, el este y Bocas ───────────────────────────────────────── */
  colon: {
    slug: "colon",
    name: "Colón",
    shortName: "Colón",
    province: "Colón",
    lat: 9.3592,
    lng: -79.9014,
    isMajor: true,
  },
  chepo: {
    slug: "chepo",
    name: "Chepo",
    shortName: "Chepo",
    province: "Panamá Este",
    lat: 9.1706,
    lng: -79.1017,
  },
  almirante: {
    slug: "almirante",
    name: "Almirante",
    shortName: "Almirante",
    province: "Bocas del Toro",
    lat: 9.3,
    lng: -82.4028,
  },
  changuinola: {
    slug: "changuinola",
    name: "Changuinola",
    shortName: "Changuinola",
    province: "Bocas del Toro",
    lat: 9.4319,
    lng: -82.5182,
  },
} as const satisfies Record<string, City>;

/**
 * LA ROUTE, EN KILOMÈTRES CUMULÉS DEPUIS CIUDAD DE PANAMÁ
 *
 * Toutes ces villes sont sur la Panamericana, dans cet ordre. Les distances
 * sont celles des corridors du §12 : Coronado 85, Penonomé 145, Santiago 250,
 * David 440 — et l'embranchement d'Azuero à Divisa, qui mène à Chitré (250)
 * puis Las Tablas (285). Les corridors ne sont donc pas six routes séparées :
 * c'est un tronc commun avec une fourche, et c'est précisément ce qui permet
 * de découper les trajets.
 *
 * Les péages sont eux aussi cumulés. Ils se paient tous dans les 85 premiers
 * kilomètres (l'autopista vers La Chorrera) : au-delà de Coronado, un segment
 * n'ajoute plus de péage, et le calcul du plafond doit le refléter — sinon on
 * facturerait à un passager Penonomé → Santiago un péage qu'il ne franchit
 * jamais.
 */
const PANAMA_PICKUPS = [
  "Costa del Este — Town Center",
  "Albrook — salida hacia el interior",
  "Vía Centenario — entrada a la Panamericana",
];

const ROAD = {
  "panama-city": {
    km: 0,
    tollCents: 0,
    pickupPoints: PANAMA_PICKUPS,
  },
  "la-chorrera": {
    km: 37,
    tollCents: 200,
    pickupPoints: [
      "La Chorrera — salida oeste",
      "La Chorrera — Parque Libertador",
    ],
  },
  coronado: {
    km: 85,
    tollCents: 200,
    pickupPoints: [
      "Coronado — entrada de la urbanización",
      "El Rey de Coronado — estacionamiento",
    ],
  },
  penonome: {
    km: 145,
    tollCents: 300,
    pickupPoints: [
      "Penonomé — entrada del pueblo",
      "Penonomé — El Machetazo, sobre la vía",
    ],
  },
  santiago: {
    km: 250,
    tollCents: 300,
    pickupPoints: [
      "Santiago — parada de descanso en la Panamericana",
      "Santiago — entrada por la vía principal",
    ],
  },
  david: {
    km: 440,
    tollCents: 300,
    pickupPoints: [
      "David — entrada por la Panamericana",
      "David — Parque Cervantes",
    ],
  },
  chitre: {
    km: 250,
    tollCents: 300,
    pickupPoints: [
      "Chitré — entrada por la vía de Divisa",
      "Chitré — Parque Unión",
    ],
  },
  "las-tablas": {
    km: 285,
    tollCents: 300,
    pickupPoints: ["Las Tablas — entrada del pueblo"],
  },

  /* Les villes ajoutées avec l'extension du réseau. Leur km est le cumul
     depuis Panamá SUR LEUR PROPRE chemin — documentaire : la synthèse
     des rutas (`buildRoute`) ne lit que les TRONÇONS (ROAD_EDGES) et les
     pickupPoints ci-dessous. Points de rencontre : des repères publics
     que tout le monde connaît — entrées de pueblo, parques, cruces —
     jamais un terminal de buses (règle maison). */
  arraijan: {
    km: 20,
    tollCents: 100,
    pickupPoints: ["Arraiján — entrada por la Panamericana", "Arraiján — el parque central"],
  },
  capira: {
    km: 54,
    tollCents: 200,
    pickupPoints: ["Capira — entrada del pueblo", "Capira — sobre la Panamericana"],
  },
  chame: {
    km: 72,
    tollCents: 200,
    pickupPoints: ["Chame — cruce de la Panamericana", "Chame — entrada del pueblo"],
  },
  "san-carlos": {
    km: 95,
    tollCents: 200,
    pickupPoints: ["San Carlos — entrada del pueblo", "Las Uvas — cruce hacia El Valle"],
  },
  "rio-hato": {
    km: 115,
    tollCents: 200,
    pickupPoints: ["Río Hato — sobre la Panamericana", "Río Hato — entrada de la base"],
  },
  anton: {
    km: 130,
    tollCents: 200,
    pickupPoints: ["Antón — entrada del pueblo", "Antón — el parque central"],
  },
  nata: {
    km: 175,
    tollCents: 300,
    pickupPoints: ["Natá — entrada del pueblo", "Natá — la basílica, sobre la vía"],
  },
  aguadulce: {
    km: 190,
    tollCents: 300,
    pickupPoints: ["Aguadulce — cruce de la Panamericana", "Aguadulce — el parque central"],
  },
  "el-valle": {
    km: 123,
    tollCents: 200,
    pickupPoints: ["El Valle — el mercado", "El Valle — entrada del pueblo"],
  },
  parita: {
    km: 235,
    tollCents: 300,
    pickupPoints: ["Parita — entrada del pueblo", "Parita — sobre la vía de Divisa"],
  },
  "los-santos": {
    km: 255,
    tollCents: 300,
    pickupPoints: ["La Villa de Los Santos — entrada del pueblo", "Los Santos — el parque central"],
  },
  guarare: {
    km: 275,
    tollCents: 300,
    pickupPoints: ["Guararé — entrada del pueblo", "Guararé — sobre la vía nacional"],
  },
  pedasi: {
    km: 327,
    tollCents: 300,
    pickupPoints: ["Pedasí — entrada del pueblo", "Pedasí — el parque central"],
  },
  sona: {
    km: 300,
    tollCents: 300,
    pickupPoints: ["Soná — entrada del pueblo", "Soná — el parque central"],
  },
  tole: {
    km: 320,
    tollCents: 300,
    pickupPoints: ["Tolé — cruce de la Panamericana"],
  },
  "las-lajas": {
    km: 365,
    tollCents: 300,
    pickupPoints: ["Las Lajas — cruce de la Panamericana", "Las Lajas — entrada del pueblo"],
  },
  "la-concepcion": {
    km: 465,
    tollCents: 300,
    pickupPoints: ["La Concepción — el parque central", "La Concepción — cruce hacia Volcán"],
  },
  "paso-canoas": {
    km: 490,
    tollCents: 300,
    pickupPoints: ["Paso Canoas — entrada por la Panamericana"],
  },
  boquete: {
    km: 478,
    tollCents: 300,
    pickupPoints: ["Boquete — el parque central", "Boquete — entrada del pueblo"],
  },
  volcan: {
    km: 497,
    tollCents: 300,
    pickupPoints: ["Volcán — el parque central", "Volcán — cruce principal"],
  },
  colon: {
    km: 80,
    tollCents: 250,
    pickupPoints: ["Colón — Cuatro Altos", "Sabanitas — sobre la Transístmica"],
  },
  chepo: {
    km: 60,
    tollCents: 0,
    pickupPoints: ["Chepo — entrada del pueblo", "Chepo — sobre la vía Panamericana este"],
  },
  almirante: {
    km: 605,
    tollCents: 300,
    pickupPoints: ["Almirante — entrada del pueblo"],
  },
  changuinola: {
    km: 627,
    tollCents: 300,
    pickupPoints: ["Changuinola — el parque central", "Changuinola — entrada por la vía de Almirante"],
  },
} as const satisfies Record<
  string,
  { km: number; tollCents: number; pickupPoints: readonly string[] }
>;

/** Construit la liste ordonnée des points de passage d'un corridor. */
function road(...slugs: (keyof typeof ROAD)[]): Waypoint[] {
  return slugs.map((slug) => {
    const city = Object.values(CITIES).find((c) => c.slug === slug)!;
    const { km, tollCents, pickupPoints } = ROAD[slug];
    return {
      citySlug: slug,
      name: city.shortName,
      km,
      tollCents,
      pickupPoints: [...pickupPoints],
    };
  });
}

export const CORRIDORS: Corridor[] = [
  {
    slug: "panama-chitre",
    origin: CITIES.panama,
    destination: CITIES.chitre,
    distanceKm: 250,
    tollCents: 300,
    typicalDurationMin: 220,
    isPriority: true,
    pickupPoints: [...PANAMA_PICKUPS, "Divisa — cruce hacia Azuero"],
    intro:
      "La ruta de Azuero por excelencia. Los viernes en la tarde y los domingos al mediodía es cuando más gente se mueve, sobre todo en temporada de festivales. La mayoría de los conductores sale por la Panamericana y toma el cruce de Divisa.",
    waypoints: road("panama-city", "la-chorrera", "coronado", "penonome", "chitre"),
  },
  {
    slug: "panama-las-tablas",
    origin: CITIES.panama,
    destination: CITIES.lasTablas,
    distanceKm: 285,
    tollCents: 300,
    typicalDurationMin: 245,
    isPriority: true,
    pickupPoints: [...PANAMA_PICKUPS, "Chitré — si te queda de paso"],
    intro:
      "Media hora más allá de Chitré, por la misma carretera. Quien va a Las Tablas casi siempre puede dejarte antes en Chitré o en Guararé, así que vale la pena mirar los dos corredores cuando buscas puesto.",
    waypoints: road(
      "panama-city",
      "coronado",
      "penonome",
      "chitre",
      "las-tablas",
    ),
  },
  {
    slug: "panama-coronado",
    origin: CITIES.panama,
    destination: CITIES.coronado,
    distanceKm: 85,
    tollCents: 200,
    typicalDurationMin: 75,
    isPriority: true,
    pickupPoints: [
      "Costa del Este — Town Center",
      "Vía Centenario — entrada a la Panamericana",
    ],
    intro:
      "El corredor más corto y el más frecuente: mucha gente baja los viernes en la tarde y sube los domingos. Como el trayecto es de poco más de una hora, el aporte por puesto es pequeño y los conductores suelen tener horarios flexibles.",
    waypoints: road("panama-city", "la-chorrera", "coronado"),
  },
  {
    slug: "panama-santiago",
    origin: CITIES.panama,
    destination: CITIES.santiago,
    distanceKm: 250,
    tollCents: 300,
    typicalDurationMin: 210,
    isPriority: false,
    pickupPoints: [...PANAMA_PICKUPS, "Aguadulce — parada en carretera"],
    intro:
      "Santiago es el punto medio del país: mucha gente que va a Chiriquí para ahí, y muchos veragüenses suben a Panamá entre semana por trámites. Es de los corredores donde más se consigue puesto en días laborables.",
    waypoints: road("panama-city", "la-chorrera", "coronado", "penonome", "santiago"),
  },
  {
    slug: "panama-penonome",
    origin: CITIES.panama,
    destination: CITIES.penonome,
    distanceKm: 145,
    tollCents: 300,
    typicalDurationMin: 120,
    isPriority: false,
    pickupPoints: [...PANAMA_PICKUPS, "Penonomé — entrada del pueblo"],
    intro:
      "Dos horas de carretera y buena parte de los conductores que van a Chiriquí o a Veraguas pasan por aquí. Si no encuentras un viaje directo a Penonomé, mira también los que van más lejos: casi todos pueden dejarte en la entrada.",
    waypoints: road("panama-city", "la-chorrera", "coronado", "penonome"),
  },
  {
    slug: "panama-david",
    origin: CITIES.panama,
    destination: CITIES.david,
    distanceKm: 440,
    tollCents: 300,
    typicalDurationMin: 390,
    isPriority: false,
    pickupPoints: [...PANAMA_PICKUPS, "Santiago — parada de descanso"],
    intro:
      "Seis horas y media de carretera, casi siempre con una parada en Santiago para estirar las piernas. Muchos salen de madrugada para llegar con el día por delante; mira también los viajes de la tarde, que llegan de noche.",
    waypoints: road("panama-city", "la-chorrera", "coronado", "penonome", "santiago", "david"),
  },
];

/**
 * LES RETOURS — un point A vers un point B, pas seulement depuis Panamá.
 *
 * Le client l'a dit simplement : « les gens rentrent à la ville aussi ». On
 * descend le vendredi, on remonte le dimanche — la moitié de la demande est
 * dans l'autre sens, et elle n'avait aucune page.
 *
 * Chaque retour est DÉRIVÉ de son aller : mêmes villes, même distance, mêmes
 * péages totaux, points de passage inversés avec les cumuls recalculés depuis
 * la nouvelle origine (km' = total − km, péages' = total − péages — les
 * péages se paient tous près de Panamá, donc en montant ils tombent sur la
 * FIN du trajet, et le calcul des segments doit le savoir).
 *
 * Seul l'éditorial est écrit à la main : une page générée qui répète l'aller
 * mot pour mot serait du contenu dupliqué, pour Google comme pour le lecteur.
 */
const RETURN_EDITORIAL: Record<string, { intro: string; pickup: string[] }> = {
  "panama-chitre": {
    intro:
      "El domingo de vuelta es el viaje más compartido de Azuero: casi todos los que bajaron el viernes suben entre el mediodía y la noche. Busca temprano — los puestos de la tarde del domingo son los primeros en llenarse.",
    pickup: [...ROAD.chitre.pickupPoints, "Divisa — cruce de la Panamericana"],
  },
  "panama-las-tablas": {
    intro:
      "De Las Tablas a la capital casi todos pasan por Guararé y Chitré, así que un carro que sale de Las Tablas suele poder recogerte en el camino. El domingo sube más gente que cualquier otro día de la semana.",
    pickup: [...ROAD["las-tablas"].pickupPoints, "Chitré — de paso por la vía"],
  },
  "panama-coronado": {
    intro:
      "La subida del domingo desde la playa. Poco más de una hora de camino, aporte pequeño, y muchos carros que regresan a la ciudad con puestos vacíos después del fin de semana.",
    pickup: [...ROAD.coronado.pickupPoints],
  },
  "panama-santiago": {
    intro:
      "Muchos veragüenses suben a la capital entre semana por trámites o trabajo. Es de las rutas donde más fácil se consigue puesto un lunes en la mañana, y casi todos los carros que vienen de Chiriquí pasan por aquí.",
    pickup: [...ROAD.santiago.pickupPoints, "Aguadulce — parada en carretera"],
  },
  "panama-penonome": {
    intro:
      "Quien sube de Veraguas o de Chiriquí pasa por Penonomé, así que además de los carros que salen del pueblo puedes montarte en uno que ya viene en camino. La entrada del pueblo es el punto de siempre.",
    pickup: [...ROAD.penonome.pickupPoints],
  },
  "panama-david": {
    intro:
      "La subida larga: seis horas y media, casi siempre con parada en Santiago. Muchos conductores salen de madrugada para llegar a la capital a mediodía — mira también los viajes que salen la tarde anterior.",
    pickup: [...ROAD.david.pickupPoints, "Santiago — parada de descanso"],
  },
};

const RETURN_CORRIDORS: Corridor[] = CORRIDORS.map((outbound) => {
  const editorial = RETURN_EDITORIAL[outbound.slug];
  return {
    ...outbound,
    slug: `${outbound.slug.replace(/^panama-/, "")}-panama`,
    origin: outbound.destination,
    destination: outbound.origin,
    isReturn: true,
    pickupPoints: editorial.pickup,
    intro: editorial.intro,
    waypoints: [...outbound.waypoints].reverse().map((w) => ({
      ...w,
      km: outbound.distanceKm - w.km,
      tollCents: outbound.tollCents - w.tollCents,
    })),
  };
});

CORRIDORS.push(...RETURN_CORRIDORS);

export function getCorridor(slug: string): Corridor | undefined {
  return CORRIDORS.find((c) => c.slug === slug);
}

/** Le corridor inverse, quand il existe. Utile pour le maillage interne. */
export function getReverseCorridor(corridor: Corridor): Corridor | undefined {
  return CORRIDORS.find(
    (c) =>
      c.origin.slug === corridor.destination.slug &&
      c.destination.slug === corridor.origin.slug,
  );
}

/** Corridors qui partagent une ville — le maillage interne des pages SEO.
 *  Même sens de marche que la page courante, et jamais son propre retour :
 *  celui-ci a déjà son lien dédié dans la FAQ de la page. */
export function getRelatedCorridors(corridor: Corridor, limit = 3): Corridor[] {
  const reverse = getReverseCorridor(corridor);
  return CORRIDORS.filter(
    (c) =>
      c.slug !== corridor.slug &&
      c.slug !== reverse?.slug &&
      Boolean(c.isReturn) === Boolean(corridor.isReturn),
  )
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
    .slice(0, limit);
}

/**
 * Plafond de référence d'un corridor : véhicule standard, 3 sièges.
 * C'est le chiffre affiché sur les cartes de route et les pages corridor.
 */
export function corridorCap(
  corridor: Corridor,
  category: VehicleCategory = "standard",
  seats = 3,
) {
  return computePriceCap(
    corridor.distanceKm,
    corridor.tollCents,
    category,
    seats,
  );
}

export const ALL_CITIES: City[] = Object.values(CITIES);

/**
 * LE RÉSEAU ROUTIER EN TRONÇONS ÉLÉMENTAIRES
 *
 * Il n'y a PAS de « rutas cerradas » : toutes les villes desservies sont
 * reliées par la Panamericana et la fourche d'Azuero à Divisa. Un
 * conducteur peut donc publier N'IMPORTE QUELLE paire — Las Tablas →
 * David compris — et l'itinéraire s'arme tout seul en chaînant les
 * tronçons. Les km et les péages par tronçon reproduisent exactement les
 * cumuls de ROAD (les péages se paient tous près de la capitale : une
 * ruta qui ne s'en approche pas n'en facture aucun).
 *
 * « divisa » est le nœud de la fourche : un vrai croisement, pas une
 * ville desservie — il route, il n'apparaît jamais comme parada.
 */
const DIVISA = "divisa";

const ROAD_EDGES: {
  a: string;
  b: string;
  km: number;
  tollCents: number;
}[] = [
  /* Panamericana ouest — le tronc. Les cumuls historiques sont
     préservés au kilomètre : Chorrera 37, Coronado 85, Penonomé 145,
     Divisa 215, Santiago 250, David 440. Les péages restent tous près
     de la capitale (cumuls 200 à Chorrera, 300 à Penonomé). */
  { a: "panama-city", b: "arraijan", km: 20, tollCents: 100 },
  { a: "arraijan", b: "la-chorrera", km: 17, tollCents: 100 },
  { a: "la-chorrera", b: "capira", km: 17, tollCents: 0 },
  { a: "capira", b: "chame", km: 18, tollCents: 0 },
  { a: "chame", b: "coronado", km: 13, tollCents: 0 },
  { a: "coronado", b: "san-carlos", km: 10, tollCents: 0 },
  { a: "san-carlos", b: "rio-hato", km: 20, tollCents: 0 },
  { a: "rio-hato", b: "anton", km: 15, tollCents: 0 },
  { a: "anton", b: "penonome", km: 15, tollCents: 100 },
  { a: "penonome", b: "nata", km: 30, tollCents: 0 },
  { a: "nata", b: "aguadulce", km: 15, tollCents: 0 },
  { a: "aguadulce", b: DIVISA, km: 25, tollCents: 0 },
  { a: DIVISA, b: "santiago", km: 35, tollCents: 0 },
  { a: "santiago", b: "tole", km: 70, tollCents: 0 },
  { a: "tole", b: "las-lajas", km: 45, tollCents: 0 },
  { a: "las-lajas", b: "david", km: 75, tollCents: 0 },
  { a: "david", b: "la-concepcion", km: 25, tollCents: 0 },
  { a: "la-concepcion", b: "paso-canoas", km: 25, tollCents: 0 },

  /* La fourche d'Azuero, à Divisa. */
  { a: DIVISA, b: "parita", km: 20, tollCents: 0 },
  { a: "parita", b: "chitre", km: 15, tollCents: 0 },
  { a: "chitre", b: "los-santos", km: 5, tollCents: 0 },
  { a: "los-santos", b: "guarare", km: 20, tollCents: 0 },
  { a: "guarare", b: "las-tablas", km: 10, tollCents: 0 },
  { a: "las-tablas", b: "pedasi", km: 42, tollCents: 0 },

  /* Les embranchements. */
  { a: "san-carlos", b: "el-valle", km: 28, tollCents: 0 },
  { a: "santiago", b: "sona", km: 50, tollCents: 0 },
  { a: "david", b: "boquete", km: 38, tollCents: 0 },
  { a: "la-concepcion", b: "volcan", km: 32, tollCents: 0 },
  { a: "panama-city", b: "colon", km: 80, tollCents: 250 },
  { a: "panama-city", b: "chepo", km: 60, tollCents: 0 },
  /* Bocas : la route de la Fortuna, David → Almirante, puis la côte. */
  { a: "david", b: "almirante", km: 165, tollCents: 0 },
  { a: "almirante", b: "changuinola", km: 22, tollCents: 0 },
];

/** Le chemin de nœuds entre deux villes. Le réseau est un arbre : le
 *  chemin simple est unique, un parcours en largeur suffit. */
function roadPath(fromSlug: string, toSlug: string): string[] | null {
  const previous = new Map<string, string>([[fromSlug, fromSlug]]);
  const queue = [fromSlug];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === toSlug) {
      const path = [node];
      let cursor = node;
      while (cursor !== fromSlug) {
        cursor = previous.get(cursor)!;
        path.unshift(cursor);
      }
      return path;
    }
    for (const edge of ROAD_EDGES) {
      const next = edge.a === node ? edge.b : edge.b === node ? edge.a : null;
      if (next && !previous.has(next)) {
        previous.set(next, node);
        queue.push(next);
      }
    }
  }
  return null;
}

/**
 * LA RUTA ENTRE DEUX VILLES QUELCONQUES — toujours.
 *
 * Un corridor prédéfini existe ? On le rend tel quel : il porte sa page
 * SEO et son éditorial. Sinon, on le SYNTHÉTISE depuis le réseau : mêmes
 * villes, mêmes km, mêmes péages, mêmes points de prise en charge — la
 * seule chose qui manque est la page /viajes dédiée, et l'appelant le
 * sait via `getCorridor(slug)`. La formule de prix ne change pas d'un
 * iota : elle reçoit des km et des péages, d'où qu'ils viennent.
 */
export function buildRoute(
  fromSlug: string,
  toSlug: string,
): Corridor | null {
  if (!fromSlug || !toSlug || fromSlug === toSlug) return null;

  const origin = ALL_CITIES.find((c) => c.slug === fromSlug);
  const destination = ALL_CITIES.find((c) => c.slug === toSlug);
  if (!origin || !destination) return null;

  const path = roadPath(fromSlug, toSlug);
  if (!path) return null;

  // Cumuls le long du chemin, nœud par nœud — Divisa cumule mais ne
  // devient jamais un waypoint.
  let km = 0;
  let tollCents = 0;
  const waypoints: Waypoint[] = [];
  for (let i = 0; i < path.length; i++) {
    if (i > 0) {
      const edge = ROAD_EDGES.find(
        (e) =>
          (e.a === path[i - 1] && e.b === path[i]) ||
          (e.b === path[i - 1] && e.a === path[i]),
      )!;
      km += edge.km;
      tollCents += edge.tollCents;
    }
    const slug = path[i];
    if (slug === DIVISA) continue;
    const city = ALL_CITIES.find((c) => c.slug === slug)!;
    waypoints.push({
      citySlug: slug,
      name: city.shortName,
      km,
      tollCents,
      pickupPoints: [...ROAD[slug as keyof typeof ROAD].pickupPoints],
    });
  }

  /* Une paire prédéfinie garde son identité (slug, page /viajes,
     éditorial) mais reçoit les waypoints DENSES du réseau : le
     conducteur Panamá → Chitré doit se voir proposer Natá, Aguadulce ou
     Parita comme paradas, pas seulement les quatre villes historiques.
     Les corridors du référentiel, eux, ne bougent pas — les pages SEO
     et les viajes de démonstration continuent de les lire tels quels. */
  const predefined = CORRIDORS.find(
    (c) => c.origin.slug === fromSlug && c.destination.slug === toSlug,
  );
  if (predefined) return { ...predefined, waypoints };

  const crossed = waypoints.slice(1, -1).map((w) => w.name);
  return {
    slug: `${fromSlug}-${toSlug}`,
    origin,
    destination,
    distanceKm: km,
    tollCents,
    // Le rythme moyen observé sur les corridors du réseau (~0,9 min/km),
    // arrondi aux 5 minutes — une estimation, affichée comme telle.
    typicalDurationMin: Math.round((km * 0.9) / 5) * 5,
    isPriority: false,
    pickupPoints: [...ROAD[fromSlug as keyof typeof ROAD].pickupPoints],
    intro:
      crossed.length > 0
        ? `Ruta armada al momento: sigue la carretera y pasa por ${crossed.join(", ")}. Marca las paradas que te quedan de paso y tu viaje sale en más búsquedas.`
        : "Ruta armada al momento sobre la carretera que une las dos ciudades.",
    waypoints,
  };
}

/**
 * Corridors qui traversent les deux villes, dans le bon sens.
 *
 * C'est la requête qui change tout : Penonomé → Santiago n'est le corridor de
 * personne, mais trois corridors passent par les deux villes dans cet ordre.
 * Une recherche qui ne regardait que `origin`/`destination` renvoyait une page
 * vide alors que l'offre existait déjà.
 */
export function corridorsServing(
  fromCitySlug: string,
  toCitySlug: string,
): Corridor[] {
  return CORRIDORS.filter((corridor) => {
    const from = corridor.waypoints.findIndex(
      (w) => w.citySlug === fromCitySlug,
    );
    const to = corridor.waypoints.findIndex((w) => w.citySlug === toCitySlug);
    return from !== -1 && to !== -1 && from < to;
  });
}

/** Paires de villes desservies par au moins un corridor, arrêts compris. */
export function isPairServed(
  fromCitySlug: string,
  toCitySlug: string,
): boolean {
  return corridorsServing(fromCitySlug, toCitySlug).length > 0;
}
