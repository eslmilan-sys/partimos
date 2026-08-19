/**
 * TRAJETS
 *
 * Le site public doit pouvoir montrer une liste de résultats avant que
 * Supabase existe — sinon la boucle « chercher → choisir → réserver » ne se
 * démontre pas, et c'est justement la boucle principale du produit.
 *
 * On génère donc un jeu de trajets DÉTERMINISTE à partir des corridors. Rien
 * n'est aléatoire : le même corridor et la même date rendent toujours les
 * mêmes trajets, sur le serveur comme dans le navigateur. Un `Math.random()`
 * ici produirait un décalage d'hydratation à chaque chargement.
 *
 * Ces trajets sont marqués comme démonstration dans l'interface tant que
 * `NEXT_PUBLIC_SUPABASE_URL` n'est pas renseignée. Afficher de faux conducteurs
 * sans le dire serait un mensonge, pas une maquette.
 */

import {
  CORRIDORS,
  corridorsServing,
  getCorridor,
  type Corridor,
} from "./corridors.ts";
import { computePriceCap, type VehicleCategory } from "./pricing.ts";
import {
  agedConsumption,
  categoryFromConsumption,
  findCar,
  rateFromConsumption,
} from "./cars.ts";
import {
  findSegment,
  seatsFreeOnSegment,
  segmentCap,
  type SeatHold,
  type Segment,
  type Waypoint,
} from "./segments.ts";

export type Trip = {
  id: string;
  corridorSlug: string;
  /** ISO, heure locale du Panama. */
  departureAt: string;
  arrivalAt: string;
  seatsOffered: number;
  /** Sièges pris sur le tronçon le plus chargé — la borne du trajet entier. */
  seatsTaken: number;
  priceCents: number;
  /** Écart entre le plafond et ce que le conducteur demande. Reporté tel quel
   *  sur les segments, pour qu'un trajet à prix réduit le reste par morceaux. */
  discountCents: number;
  /** Villes où ce conducteur accepte de prendre ou de laisser quelqu'un.
   *  Sous-ensemble ordonné des `waypoints` du corridor, extrémités comprises. */
  servedStops: Waypoint[];
  /** Réservations déjà posées, par intervalle d'arrêts. Une place vendue
   *  jusqu'à Santiago se libère après Santiago : c'est un inventaire, pas un
   *  compteur. */
  holds: SeatHold[];
  driver: {
    firstName: string;
    lastInitial: string;
    rating: number;
    ridesCount: number;
    isVerified: boolean;
    isSuperDriver: boolean;
    /** Initiale affichée dans l'avatar — aucune photo n'est inventée. */
    initial: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    category: VehicleCategory;
    /** Taux au km du carro réel, sur la droite du barème (src/lib/cars.ts).
     *  C'est LUI qui entre dans le calcul : deux carros sur le même trajet
     *  donnent deux topes différents — le coût, jamais la demande. */
    ratePerKmCents: number;
  };
  stops: string[];
  womenOnly: boolean;
  instantBooking: boolean;
  /** Le conducteur a déclaré qu'il dépose PARTOUT sur son chemin — pas
   *  seulement aux points listés. Le passager peut donc proposer son
   *  point sans que ça devienne une négociation, tant que ça reste sur
   *  la route (un vrai détour, lui, se paie et s'accepte : R4). */
  flexibleStops: boolean;
};

/* TOUS VÉRIFIÉS, ET CE N'EST PAS UNE FACILITÉ DE DÉMONSTRATION.
   ─────────────────────────────────────────────────────────────────────
   On ne peut pas publier un viaje sans cédula ET licencia vérifiées : la
   porte du conducteur le refuse (voir PublishFlow). Donc tout conducteur
   qui apparaît dans une recherche EST vérifié, par construction.

   Un des conducteurs de démonstration ne l'était pas, et ça se voyait :
   certaines cartes portaient « Verificado », d'autres non — ce qui
   racontait au passager qu'il pouvait tomber sur quelqu'un de non
   vérifié. C'est faux, et c'est le pire genre de faux : celui qui rend
   la promesse de la maison moins crédible qu'elle ne l'est. */
const DRIVERS = [
  {
    firstName: "Ana",
    lastInitial: "M",
    rating: 4.9,
    ridesCount: 62,
    isVerified: true,
    isSuperDriver: true,
  },
  {
    firstName: "Javier",
    lastInitial: "R",
    rating: 4.8,
    ridesCount: 38,
    isVerified: true,
    isSuperDriver: false,
  },
  {
    firstName: "Yaritza",
    lastInitial: "C",
    rating: 5.0,
    ridesCount: 91,
    isVerified: true,
    isSuperDriver: true,
  },
  {
    firstName: "Carlos",
    lastInitial: "B",
    rating: 4.6,
    ridesCount: 14,
    isVerified: true,
    isSuperDriver: false,
  },
  {
    firstName: "Rita",
    lastInitial: "G",
    rating: 4.9,
    ridesCount: 47,
    isVerified: true,
    isSuperDriver: false,
  },
  {
    firstName: "Moisés",
    lastInitial: "D",
    rating: 4.7,
    ridesCount: 23,
    isVerified: true,
    isSuperDriver: false,
  },
  {
    firstName: "Lourdes",
    lastInitial: "P",
    rating: 5.0,
    ridesCount: 8,
    isVerified: true,
    isSuperDriver: false,
  },
];

/** Les carros de la démo viennent du catalogue : le taux de chacun sort de
 *  sa consommation réelle (corrigée de l'âge), et c'est pour ça que le même
 *  corridor affiche des aportes différents d'une carte à l'autre. */
const DEMO_CARS: { make: string; model: string; year: number; color: string }[] =
  [
    { make: "Toyota", model: "Corolla", year: 2021, color: "gris" },
    { make: "Hyundai", model: "Accent", year: 2016, color: "blanco" },
    { make: "Kia", model: "Sportage", year: 2018, color: "negro" },
    { make: "Nissan", model: "Sentra", year: 2023, color: "azul" },
    { make: "Toyota", model: "Hilux", year: 2020, color: "plata" },
    { make: "Kia", model: "Picanto", year: 2019, color: "rojo" },
    { make: "Toyota", model: "Prado", year: 2022, color: "blanco" },
  ];

const VEHICLES: Trip["vehicle"][] = DEMO_CARS.map((c) => {
  const ref = findCar(c.make, c.model)!;
  const l100 = agedConsumption(ref.l100, c.year);
  return {
    ...c,
    category: categoryFromConsumption(l100),
    ratePerKmCents: rateFromConsumption(l100),
  };
});

/** Heures de départ typiques : tôt le matin, midi, fin d'après-midi, nuit. */
const DEPARTURE_HOURS = [5, 6, 8, 11, 14, 16, 17, 19, 21];

/** Panamá vit à UTC−5 toute l'année (pas d'heure d'été). Les horaires de
 *  la démonstration s'ancrent dessus pour que le serveur de build et le
 *  navigateur parlent du même instant. */
export const PANAMA_UTC_OFFSET = "-05:00";

/** Empreinte stable d'une chaîne. Remplace un générateur aléatoire. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Les arrêts que CE conducteur déclare, parmi ceux du corridor.
 *
 * Tout le monde ne s'arrête pas partout : celui qui va à David d'une traite
 * ne déclare rien, celui qui a le temps déclare Penonomé et Santiago. Le tirage
 * est déterministe, un bit par ville intermédiaire — sinon la même page rendue
 * deux fois donnerait deux itinéraires différents.
 */
function pickServedStops(corridor: Corridor, seed: number): Waypoint[] {
  const inner = corridor.waypoints.slice(1, -1);
  const kept = inner.filter((_, i) => ((seed >> i) & 1) === 1);
  return [
    corridor.waypoints[0],
    ...kept,
    corridor.waypoints[corridor.waypoints.length - 1],
  ];
}

/**
 * Les réservations déjà posées, en intervalles d'arrêts.
 *
 * Chacune occupe un seul siège sur une portion du trajet. Comme il y en a au
 * plus `seatsOffered`, aucun tronçon ne peut être survendu, quel que soit le
 * tirage — l'invariant tient par construction, pas par vérification après coup.
 */
function buildHolds(
  stopCount: number,
  seatsOffered: number,
  seed: number,
): SeatHold[] {
  const legCount = stopCount - 1;
  const count = (seed >> 3) % (seatsOffered + 1);

  return Array.from({ length: count }, (_, k) => {
    const h = hash(`hold|${seed}|${k}`);
    const fromIndex = h % legCount;
    const toIndex = fromIndex + 1 + ((h >> 7) % (legCount - fromIndex));
    return { fromIndex, toIndex, seats: 1 };
  });
}

function buildTrip(corridor: Corridor, date: string, index: number): Trip {
  const seed = hash(`${corridor.slug}|${date}|${index}`);
  const driver = DRIVERS[seed % DRIVERS.length];
  const vehicle = VEHICLES[(seed >> 3) % VEHICLES.length];
  /* Le trajet 0 de chaque corridor/jour offre TOUJOURS 4 puestos libres
     (voir plus bas : zéro reserva). Sans cette garantie, chercher « 4
     personas » vidait la démo entière — vécu par le propriétaire comme
     « il n'y a plus aucun viaje ». La démo doit toujours avoir une
     réponse. */
  const seatsOffered = index === 0 ? 4 : 2 + ((seed >> 5) % 3);

  const servedStops = pickServedStops(
    corridor,
    hash(`paradas|${corridor.slug}|${date}|${index}`),
  );
  const holds =
    index === 0
      ? []
      : buildHolds(
          servedStops.length,
          seatsOffered,
          hash(`reservas|${corridor.slug}|${date}|${index}`),
        );
  const seatsTaken =
    seatsOffered -
    seatsFreeOnSegment(seatsOffered, holds, {
      fromIndex: 0,
      toIndex: servedStops.length - 1,
    });

  /* Le trajet 0 part TARD (23 h 15) : c'est lui qui garde la démo
     vivante en soirée — sans lui, après 21 h « Hoy » se vidait partout
     et le site semblait mort. Les autres suivent le tirage. */
  const hour = index === 0 ? 23 : DEPARTURE_HOURS[(seed >> 11) % DEPARTURE_HOURS.length];
  const minute = index === 0 ? 15 : [0, 15, 30, 45][(seed >> 14) % 4];
  /* L'HEURE EST ANCRÉE À PANAMÁ, pas au fuseau de la machine.
     Sans le décalage explicite, `new Date("…T23:15:00")` se lit dans le
     fuseau du runtime : au prérendu statique (serveur en UTC) le viaje
     partait à 23:15 UTC, et le navigateur panaméen l'affichait à 18:15 —
     la carte de recherche (calculée dans le navigateur) disait 23:15 et
     la page du viaje 18:15, pour le MÊME viaje. Panamá n'a pas d'heure
     d'été : −05:00 toute l'année. */
  const departure = new Date(
    `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${PANAMA_UTC_OFFSET}`,
  );
  const arrival = new Date(
    departure.getTime() + corridor.typicalDurationMin * 60_000,
  );

  // Le plafond dépend du nombre de sièges offerts. Le conducteur demande le
  // plafond ou un demi-dollar en dessous — jamais plus, la base le refuserait.
  const cap = computePriceCap(
    corridor.distanceKm,
    corridor.tollCents,
    vehicle.ratePerKmCents,
    seatsOffered,
  ).maxPriceCents;
  const discount = (seed >> 17) % 3 === 0 ? 50 : 0;

  return {
    id: `${corridor.slug}-${date}-${index}`,
    corridorSlug: corridor.slug,
    departureAt: departure.toISOString(),
    arrivalAt: arrival.toISOString(),
    seatsOffered,
    seatsTaken,
    priceCents: Math.max(0, cap - discount),
    discountCents: discount,
    servedStops,
    holds,
    driver: { ...driver, initial: driver.firstName.charAt(0) },
    vehicle,
    stops: corridor.pickupPoints.slice(0, 2 + ((seed >> 19) % 3)),
    womenOnly: (seed >> 23) % 7 === 0,
    instantBooking: (seed >> 25) % 3 !== 0,
    flexibleStops: (seed >> 9) % 3 !== 0,
  };
}

/**
 * « Desde $X » d'une paire de villes : le plafond le plus bas que la
 * flotte de démonstration peut afficher sur ce segment — carro le plus
 * sobre, carro le plus rempli. Indépendant de la date, donc identique au
 * build et à l'hydratation : pas de « desde » qui clignote.
 */
export function minPriceForPair(
  fromSlug: string,
  toSlug: string,
): number | null {
  let best: number | null = null;
  for (const corridor of corridorsServing(fromSlug, toSlug)) {
    const segment = findSegment(corridor.waypoints, fromSlug, toSlug);
    if (!segment) continue;
    for (const vehicle of VEHICLES) {
      for (let seats = 2; seats <= 4; seats++) {
        const cap = segmentCap(
          segment,
          vehicle.ratePerKmCents,
          seats,
        ).maxPriceCents;
        if (best === null || cap < best) best = cap;
      }
    }
  }
  return best;
}

/**
 * Tous les trajets d'un corridor pour une date, sans filtre.
 *
 * Séparé de `getTripsFor` parce que la recherche par segment a besoin des
 * trajets bruts : un trajet parti de Panamá il y a une heure n'est pas passé
 * pour qui monte à Santiago dans quatre heures, et un trajet complet jusqu'à
 * Penonomé peut être vide après.
 */
export function buildTripsFor(corridorSlug: string, date: string): Trip[] {
  const corridor = getCorridor(corridorSlug);
  if (!corridor) return [];

  // Entre deux et cinq trajets, selon le corridor et le jour : un corridor
  // prioritaire un vendredi bouge plus qu'un mardi vers David.
  const seed = hash(`${corridorSlug}|${date}`);
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const busy = weekday === 5 || weekday === 0;
  const count = (corridor.isPriority ? 5 : 3) + (busy ? 2 : 0) + (seed % 2);

  return Array.from({ length: count }, (_, i) => buildTrip(corridor, date, i));
}

/** Trajets d'un corridor pour une date, triés par heure de départ. */
export function getTripsFor(corridorSlug: string, date: string): Trip[] {
  // Un départ déjà passé n'est pas un résultat : il fait croire que la
  // plateforme est vide alors qu'elle a des trajets plus tard dans la journée.
  const now = Date.now();

  return buildTripsFor(corridorSlug, date)
    .filter((trip) => trip.seatsOffered - trip.seatsTaken > 0)
    .filter((trip) => new Date(trip.departureAt).getTime() > now)
    .sort((a, b) => a.departureAt.localeCompare(b.departureAt));
}

export function getTrip(id: string): Trip | undefined {
  const match = /^(.+)-(\d{4}-\d{2}-\d{2})-(\d+)$/.exec(id);
  if (!match) return undefined;
  const [, corridorSlug, date, index] = match;
  const corridor = getCorridor(corridorSlug);
  if (!corridor) return undefined;
  return buildTrip(corridor, date, Number(index));
}

/**
 * Combien de jours la recherche propose. Les sélecteurs de date et la
 * génération des pages lisent la MÊME constante : la faire diverger produit
 * des résultats qui pointent vers des pages inexistantes, et c'est exactement
 * ce qui arrivait avant les arrêts intermédiaires.
 */
export const SEARCH_HORIZON_DAYS = 10;

/**
 * La date demandée tombe-t-elle dans la fenêtre dont les fiches ont été
 * pré-générées ? Hier compris — un visiteur du Panama en soirée vit
 * encore « hier » au sens UTC, et son viaje du soir doit rester lisible.
 */
export function dentroDelHorizonte(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const hoy = new Date(`${localIso()}T12:00:00`);
  const pedida = new Date(`${date}T12:00:00`);
  if (Number.isNaN(pedida.getTime())) return false;
  const dias = Math.round(
    (pedida.getTime() - hoy.getTime()) / 86_400_000,
  );
  return dias >= -1 && dias <= SEARCH_HORIZON_DAYS;
}

/**
 * Identifiants pré-générés, pour que l'export statique ait des pages.
 *
 * Aucun filtre ici, volontairement. Un trajet complet de bout en bout peut
 * rester réservable sur un tronçon, et un trajet déjà parti de Panamá peut
 * encore prendre quelqu'un à Santiago : dès qu'un trajet EXISTE, la recherche
 * peut le montrer, donc sa page doit exister aussi. Deux jours de marge au-delà
 * de l'horizon proposé absorbent le décalage entre la date de compilation et
 * celle de la visite.
 */
export function demoTripIds(days = SEARCH_HORIZON_DAYS + 2): string[] {
  const ids: string[] = [];
  const today = new Date();
  /* d = -1 : la veille du jour UTC du build. Un visiteur de Panamá en
     soirée vit encore « hier » au sens UTC — ses fiches doivent exister. */
  for (let d = -1; d < days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const iso = date.toISOString().slice(0, 10);
    for (const corridor of CORRIDORS) {
      ids.push(...buildTripsFor(corridor.slug, iso).map((t) => t.id));
    }
  }
  return ids;
}

export function seatsLeft(trip: Trip): number {
  return trip.seatsOffered - trip.seatsTaken;
}

/* ────────────────────────────────────────────────────────────────────────────
 * RECHERCHE PAR SEGMENT
 *
 * Un trajet publié Panamá → David qui déclare Penonomé et Santiago répond à
 * six recherches, pas une. C'est le levier le plus fort dont dispose une place
 * de marché qui démarre : l'offre ne change pas, la couverture est multipliée.
 *
 * Ce qu'un résultat doit porter en plus du trajet : où on monte, où on
 * descend, à quelle heure, combien de places restent SUR CE SEGMENT, et
 * combien on donne — le plafond des kilomètres réellement parcourus, jamais
 * celui du trajet entier.
 * ──────────────────────────────────────────────────────────────────────────── */

export type TripMatch = {
  trip: Trip;
  segment: Segment;
  /** Faux dès que le passager monte après le départ ou descend avant l'arrivée. */
  isPartial: boolean;
  priceCents: number;
  seatsFree: number;
  /** Heure au point de montée, pas au départ du conducteur. */
  boardingAt: string;
  /** Heure au point de descente, pas à l'arrivée du conducteur. */
  droppingAt: string;
};

/**
 * Heure de passage à un kilomètre donné du corridor.
 *
 * Interpolation linéaire sur la durée annoncée. Approximation assumée : la
 * vitesse n'est pas constante sur la Panamericana. L'affichage doit donc rester
 * une estimation, et le conducteur reste seul maître de son horaire (R4).
 */
function timeAtKm(trip: Trip, corridor: Corridor, km: number): string {
  const fraction = corridor.distanceKm > 0 ? km / corridor.distanceKm : 0;
  const minutes = Math.round(fraction * corridor.typicalDurationMin);
  return new Date(
    new Date(trip.departureAt).getTime() + minutes * 60_000,
  ).toISOString();
}

/** Le résultat correspondant à un trajet pris sur un segment donné. */
export function matchFor(trip: Trip, segment: Segment): TripMatch | null {
  const corridor = getCorridor(trip.corridorSlug);
  if (!corridor) return null;

  const cap = segmentCap(segment, trip.vehicle.ratePerKmCents, trip.seatsOffered);

  return {
    trip,
    segment,
    isPartial:
      segment.fromIndex > 0 || segment.toIndex < trip.servedStops.length - 1,
    // Le rabais que le conducteur consent sur le trajet entier le suit sur le
    // segment. Le plafond n'est jamais dépassé : on ne fait que soustraire.
    priceCents: Math.max(0, cap.maxPriceCents - trip.discountCents),
    seatsFree: seatsFreeOnSegment(trip.seatsOffered, trip.holds, segment),
    boardingAt: timeAtKm(trip, corridor, segment.from.km),
    droppingAt: timeAtKm(trip, corridor, segment.to.km),
  };
}

/** Le trajet vu de bout en bout — ce qu'affiche la page du trajet par défaut. */
export function fullMatch(trip: Trip): TripMatch | null {
  const segment = findSegment(
    trip.servedStops,
    trip.servedStops[0].citySlug,
    trip.servedStops[trip.servedStops.length - 1].citySlug,
  );
  return segment ? matchFor(trip, segment) : null;
}

/**
 * Tous les trajets d'une date qui peuvent emmener quelqu'un d'une ville à
 * l'autre, directement ou en cours de route.
 */
export function searchTrips(
  fromCitySlug: string,
  toCitySlug: string,
  date: string,
  seats = 1,
): TripMatch[] {
  /* ON NE MONTRE QUE CE DONT LA FICHE EXISTE.
     ─────────────────────────────────────────────────────────────────
     Trouvé par l'audit du site : une recherche sur une date lointaine
     (`?fecha=2026-12-24`, une adresse partagée, un signet, un lien
     d'un moteur) rendait de vrais résultats… qui menaient tous à un
     404. `demoTripIds` ne pré-génère les fiches que sur l'horizon, et
     l'export statique n'a aucun moyen d'en fabriquer une à la volée.

     Les sélecteurs de date s'arrêtent déjà à `SEARCH_HORIZON_DAYS` ;
     ce qui manquait, c'est que le MOTEUR s'y arrête aussi, pour les
     adresses qui ne passent pas par un sélecteur. Au-delà, la
     recherche est vide — et vide est la vérité : il n'y a rien de
     publié ce jour-là. L'écran vide propose déjà de laisser son
     besoin, ce qui vaut mieux qu'une page morte. */
  if (!dentroDelHorizonte(date)) return [];

  const now = Date.now();
  const matches: TripMatch[] = [];

  for (const corridor of corridorsServing(fromCitySlug, toCitySlug)) {
    for (const trip of buildTripsFor(corridor.slug, date)) {
      const segment = findSegment(trip.servedStops, fromCitySlug, toCitySlug);
      if (!segment) continue;

      const match = matchFor(trip, segment);
      if (!match) continue;
      if (match.seatsFree < seats) continue;
      // C'est l'heure de MONTÉE qui décide, pas celle du départ.
      if (new Date(match.boardingAt).getTime() <= now) continue;

      matches.push(match);
    }
  }

  return matches.sort((a, b) => a.boardingAt.localeCompare(b.boardingAt));
}

/** Combien de recherches distinctes une liste d'arrêts rend possibles. */
export function servedPairCount(stopCount: number): number {
  return (stopCount * (stopCount - 1)) / 2;
}

/**
 * La date d'aujourd'hui DE L'UTILISATEUR — jamais celle d'UTC.
 * `toISOString()` rend la date UTC : à 20 h à Panamá (UTC−5) c'est déjà
 * « demain », et tout le site se décalait d'un jour le soir. Toute
 * construction de date de recherche passe par ici.
 */
export function localIso(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-PA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDayLabel(date: string): string {
  const today = localIso();
  const tomorrow = localIso(new Date(Date.now() + 86_400_000));
  if (date === today) return "Hoy";
  if (date === tomorrow) return "Mañana";
  const label = new Intl.DateTimeFormat("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
