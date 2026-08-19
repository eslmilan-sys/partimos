/**
 * CATÁLOGO DE CARROS — le taux au kilomètre sort du carro réel.
 *
 * Le barème du §7 donne trois catégories : 22, 25 et 32 ¢/km. Mais un
 * « SUV », c'est un vieux Kia Sportage OU une Lamborghini Urus — le coût
 * réel du kilomètre n'est pas le même, et un partage de frais honnête
 * doit refléter le carro qui roule vraiment.
 *
 * L'observation qui rend l'extension légitime : les trois taux du barème
 * sont EXACTEMENT trois points d'une droite en fonction de la consommation
 * combinée de référence de chaque catégorie —
 *
 *     taux (¢/km) = 7,5 + 2,2 × conso (L/100 km)
 *
 *     económico  ~6,5 L/100 → 21,8 → 22 ¢   ✓ barème
 *     estándar   ~8,0 L/100 → 25,1 → 25 ¢   ✓ barème
 *     SUV        ~11  L/100 → 31,7 → 32 ¢   ✓ barème
 *
 * L'ordonnée (7,5 ¢) est l'usure fixe — pneus, entretien, dépréciation
 * plancher — et la pente (2,2 ¢ par L/100 km) le carburant plus l'usure
 * corrélée à la cylindrée. On ne change donc PAS le barème : on lit la
 * droite qu'il définit à d'autres abscisses. R1 et R3 restent intacts —
 * le plafond suit le COÛT du véhicule, jamais la demande.
 *
 * Les consommations sont des valeurs combinées DE RÉFÉRENCE (approchées,
 * arrondies au dixième) pour les modèles courants au Panama. Elles servent
 * à estimer un coût de partage, pas à certifier une fiche technique — le
 * chiffre exact varie selon l'année, le moteur et la conduite, et l'UI
 * l'annonce comme référence.
 */

import type { VehicleCategory } from "./pricing";

/** La droite calibrée sur le barème PA-2026-01. */
export const RATE_LINE = {
  interceptCents: 7.5,
  slopePerL100: 2.2,
  /** Bornes de sécurité : rien en dessous du plus sobre plausible, rien
      au-dessus du déraisonnable — même pour une Urus. */
  minCents: 18,
  maxCents: 60,
} as const;

/** Taux au km (centimes) pour une consommation combinée donnée. */
export function rateFromConsumption(l100: number): number {
  const raw = RATE_LINE.interceptCents + RATE_LINE.slopePerL100 * l100;
  return Math.min(
    RATE_LINE.maxCents,
    Math.max(RATE_LINE.minCents, Math.round(raw)),
  );
}

/**
 * Un carro plus vieux consomme et s'use un peu plus : +1 % par année
 * avant 2020, plafonné à +15 %. C'est une estimation d'usure, annoncée
 * comme telle — pas une mesure.
 */
export function agedConsumption(l100: number, year: number): number {
  const age = Math.max(0, 2020 - year);
  const factor = 1 + Math.min(0.15, age * 0.01);
  return Math.round(l100 * factor * 10) / 10;
}

/** La catégorie du barème la plus proche — pour la base (`vehicles.category_code`). */
export function categoryFromConsumption(l100: number): VehicleCategory {
  if (l100 < 7.3) return "economy";
  if (l100 < 9.5) return "standard";
  return "suv";
}

export type CarModel = {
  make: string;
  model: string;
  /** Consommation combinée de référence, L/100 km (approchée). */
  l100: number;
};

/**
 * Modèles courants au Panama, plus quelques haut de gamme — parce que le
 * mec à la Urus existe, et que son kilomètre coûte objectivement plus
 * cher que celui du Picanto. Trié par marque puis modèle.
 */
export const CAR_CATALOG: CarModel[] = [
  { make: "Audi", model: "A3", l100: 6.8 },
  { make: "Audi", model: "A4", l100: 7.3 },
  { make: "Audi", model: "Q3", l100: 8.0 },
  { make: "Audi", model: "Q5", l100: 8.8 },
  { make: "BMW", model: "Serie 3", l100: 7.4 },
  { make: "BMW", model: "X1", l100: 7.8 },
  { make: "BMW", model: "X3", l100: 8.9 },
  { make: "BMW", model: "X5", l100: 10.5 },
  { make: "Chevrolet", model: "Colorado", l100: 10.6 },
  { make: "Chevrolet", model: "Onix", l100: 6.4 },
  { make: "Chevrolet", model: "Spark", l100: 6.1 },
  { make: "Chevrolet", model: "Tahoe", l100: 14.0 },
  { make: "Chevrolet", model: "Tracker", l100: 7.3 },
  { make: "Ford", model: "Escape", l100: 8.5 },
  { make: "Ford", model: "Explorer", l100: 11.2 },
  { make: "Ford", model: "F-150", l100: 12.6 },
  { make: "Ford", model: "Fiesta", l100: 6.5 },
  { make: "Ford", model: "Focus", l100: 7.1 },
  { make: "Ford", model: "Ranger", l100: 9.8 },
  { make: "Honda", model: "City", l100: 6.3 },
  { make: "Honda", model: "Civic", l100: 6.9 },
  { make: "Honda", model: "CR-V", l100: 8.0 },
  { make: "Honda", model: "Fit", l100: 6.4 },
  { make: "Honda", model: "HR-V", l100: 7.4 },
  { make: "Honda", model: "Pilot", l100: 10.7 },
  { make: "Hyundai", model: "Accent", l100: 6.6 },
  { make: "Hyundai", model: "Creta", l100: 7.5 },
  { make: "Hyundai", model: "Elantra", l100: 7.0 },
  { make: "Hyundai", model: "Grand i10", l100: 5.9 },
  { make: "Hyundai", model: "Kona", l100: 7.0 },
  { make: "Hyundai", model: "Santa Fe", l100: 9.5 },
  { make: "Hyundai", model: "Tucson", l100: 8.4 },
  { make: "Kia", model: "Cerato", l100: 7.4 },
  { make: "Kia", model: "Picanto", l100: 5.8 },
  { make: "Kia", model: "Rio", l100: 6.5 },
  { make: "Kia", model: "Seltos", l100: 7.4 },
  { make: "Kia", model: "Soluto", l100: 6.3 },
  { make: "Kia", model: "Sorento", l100: 9.8 },
  { make: "Kia", model: "Sportage", l100: 8.7 },
  { make: "Lamborghini", model: "Urus", l100: 14.5 },
  { make: "Mazda", model: "2", l100: 6.1 },
  { make: "Mazda", model: "3", l100: 7.0 },
  { make: "Mazda", model: "6", l100: 7.7 },
  { make: "Mazda", model: "BT-50", l100: 9.9 },
  { make: "Mazda", model: "CX-3", l100: 7.2 },
  { make: "Mazda", model: "CX-30", l100: 7.5 },
  { make: "Mazda", model: "CX-5", l100: 8.3 },
  { make: "Mercedes-Benz", model: "Clase A", l100: 6.9 },
  { make: "Mercedes-Benz", model: "Clase C", l100: 7.8 },
  { make: "Mercedes-Benz", model: "GLA", l100: 7.9 },
  { make: "Mercedes-Benz", model: "GLC", l100: 9.0 },
  { make: "Mercedes-Benz", model: "GLE", l100: 10.8 },
  { make: "Mitsubishi", model: "ASX", l100: 7.8 },
  { make: "Mitsubishi", model: "L200", l100: 9.9 },
  { make: "Mitsubishi", model: "Lancer", l100: 7.4 },
  { make: "Mitsubishi", model: "Mirage", l100: 5.7 },
  { make: "Mitsubishi", model: "Montero Sport", l100: 10.8 },
  { make: "Mitsubishi", model: "Outlander", l100: 8.5 },
  { make: "Nissan", model: "Frontier", l100: 10.2 },
  { make: "Nissan", model: "Kicks", l100: 7.2 },
  { make: "Nissan", model: "March", l100: 6.2 },
  { make: "Nissan", model: "Pathfinder", l100: 10.5 },
  { make: "Nissan", model: "Sentra", l100: 7.0 },
  { make: "Nissan", model: "Versa", l100: 6.7 },
  { make: "Nissan", model: "X-Trail", l100: 8.4 },
  { make: "Porsche", model: "911", l100: 11.0 },
  { make: "Porsche", model: "Cayenne", l100: 11.5 },
  { make: "Suzuki", model: "Alto", l100: 5.2 },
  { make: "Suzuki", model: "Baleno", l100: 6.0 },
  { make: "Suzuki", model: "Ertiga", l100: 6.6 },
  { make: "Suzuki", model: "Jimny", l100: 7.4 },
  { make: "Suzuki", model: "Swift", l100: 5.9 },
  { make: "Suzuki", model: "Vitara", l100: 6.9 },
  { make: "Toyota", model: "Agya", l100: 5.8 },
  { make: "Toyota", model: "Corolla", l100: 6.7 },
  { make: "Toyota", model: "Corolla Cross", l100: 6.9 },
  { make: "Toyota", model: "Fortuner", l100: 10.5 },
  { make: "Toyota", model: "Hilux", l100: 9.8 },
  { make: "Toyota", model: "Land Cruiser", l100: 13.5 },
  { make: "Toyota", model: "Prado", l100: 11.8 },
  { make: "Toyota", model: "RAV4", l100: 7.8 },
  { make: "Toyota", model: "Rush", l100: 6.9 },
  { make: "Toyota", model: "Yaris", l100: 6.2 },
  { make: "Volkswagen", model: "Amarok", l100: 10.2 },
  { make: "Volkswagen", model: "Gol", l100: 6.6 },
  { make: "Volkswagen", model: "Jetta", l100: 7.0 },
  { make: "Volkswagen", model: "Polo", l100: 6.4 },
  { make: "Volkswagen", model: "T-Cross", l100: 7.0 },
  { make: "Volkswagen", model: "Tiguan", l100: 8.5 },
];

export const CAR_MAKES: string[] = [
  ...new Set(CAR_CATALOG.map((c) => c.make)),
].sort((a, b) => a.localeCompare(b));

export function modelsForMake(make: string): CarModel[] {
  return CAR_CATALOG.filter((c) => c.make === make);
}

export function findCar(make: string, model: string): CarModel | undefined {
  return CAR_CATALOG.find((c) => c.make === make && c.model === model);
}

/** Les années proposées au choix. Avant 1998, le carro appartient à un
    musée plus qu'à un covoiturage quotidien — mais le champ reste libre
    côté base, ceci n'est que l'UI. */
export const CAR_YEARS: number[] = Array.from(
  { length: 2026 - 1998 + 1 },
  (_, i) => 2026 - i,
);
