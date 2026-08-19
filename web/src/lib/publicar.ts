"use client";

/**
 * PUBLIER POUR DE VRAI — le chemin d'écriture du viaje.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QUE CE MODULE RÉPARE.
 *
 * Jusqu'ici, « Publicar el viaje » finissait sur `updateSession()` :
 * l'objet partait dans le `localStorage` du navigateur et n'allait nulle
 * part. Le conducteur voyait son écran de confirmation, fermait
 * l'application, changeait de téléphone — et son viaje n'avait jamais
 * existé. La base, elle, avait les tables, les règles et le tope depuis
 * le premier jour ; il manquait les vingt lignes qui écrivent dedans.
 *
 * ─────────────────────────────────────────────────────────────────────
 * TROIS CHOSES QUI SE PASSENT DANS L'ORDRE, ET POURQUOI.
 *
 * 1. LE CARRO D'ABORD. `trips.vehicle_id` est NOT NULL. Or l'app gardait
 *    les carros… dans le navigateur, et la table `vehicles` avait zéro
 *    ligne. On ne peut donc pas publier sans d'abord faire exister le
 *    carro côté serveur — et on le retrouve avant de le recréer, sinon
 *    chaque publication ajouterait un doublon.
 *
 * 2. L'INSTANTANÉ DU BARÈME ENSUITE. Les six colonnes `snap_*` ne sont
 *    pas de la décoration : la contrainte `price_within_cap` les compare
 *    au prix demandé et REFUSE la ligne si elle dépasse. C'est la règle
 *    R1 appliquée par la base, pas par le code — c'est-à-dire la seule
 *    façon qu'elle tienne quand le code se trompe.
 *
 * 3. LE VIAJE, ENFIN. Avec son corridor quand il en a un, et sinon avec
 *    ses deux libellés (migration 0022) : « Multiplaza », pas « Ciudad
 *    de Panamá ». Le nom choisi n'est jamais remplacé par sa ville.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ET QUAND ÇA NE MARCHE PAS.
 *
 * Rien ici ne lève d'exception vers l'appelant. Sans base configurée,
 * sans session serveur, ou si l'écriture est refusée, on rend un
 * `{ donde: "navegador" }` avec le MOTIF — l'écran de confirmation le
 * dit alors en toutes lettres au lieu de faire croire à un viaje publié.
 * Un produit qui ment sur ce qu'il a enregistré se paie une seule fois,
 * très cher.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { idDeSesion } from "./analytics";
import { PANAMA_UTC_OFFSET } from "./trips";
import type { PriceBreakdown, VehicleCategory } from "./pricing";
import type { PlaceRef } from "./place";

export type Recurrencia = "una-vez" | "diario" | "semanal" | "mensual";

/** Les quatre valeurs de l'énumération `trip_recurrence` en base. */
const RECURRENCIA_SQL: Record<Recurrencia, string> = {
  "una-vez": "none",
  diario: "daily",
  semanal: "weekly",
  mensual: "monthly",
};

/** Le carro tel que le flux de publication le connaît au moment de publier. */
export type CarroDelViaje = {
  make: string;
  model: string;
  year: number;
  color?: string | null;
  /** La placa complète, telle que saisie dans Mi cuenta. SEULS SES TROIS
   *  DERNIERS CARACTÈRES partent en base (colonne `plate_last3`) : c'est
   *  assez pour reconnaître le carro au point de rencontre, et ça évite
   *  de constituer un registre d'immatriculations à protéger. */
  plate?: string | null;
  /** Catégorie du barème — le repli quand le modèle n'est pas au catalogue. */
  category: VehicleCategory;
  /** Consommation de référence corrigée de l'âge, si on connaît le modèle. */
  l100: number | null;
  /** Taux au km retenu pour CE viaje, en centimes. */
  ratePerKmCents: number;
  /** Places totales du carro, conducteur compris. */
  seatsTotal: number;
};

export type BorradorViaje = {
  /** Slugs de ville — ce sur quoi le matching travaille. */
  from: string;
  to: string;
  /** Le lieu EXACT choisi, quand il y en a un. C'est lui qu'on affiche. */
  origen: PlaceRef | null;
  destino: PlaceRef | null;
  /** Le libellé retenu (lieu exact, ou nom de ville à défaut). */
  origenLabel: string;
  destinoLabel: string;
  cityStops: string[];
  pickups: string[];
  dropAnywhere: boolean;
  /** AAAA-MM-JJ, heure locale du Panama. */
  date: string;
  /** HH:MM. */
  hour: string;
  seats: number;
  recurrence: Recurrencia;
  priceCents: number;
  aceptaFuera: ("yappy" | "efectivo")[];
  carro: CarroDelViaje;
  cap: PriceBreakdown;
  /** Slug de la ruta. Un corridor éditorial quand il existe, sinon
   *  `origen-destino` — qui n'a PAS de ligne en base, et c'est prévu. */
  corridorSlug: string;
  esCorredorEditorial: boolean;
  typicalDurationMin: number;
};

export type MotivoLocal =
  | "sin-base"
  | "sin-sesion"
  | "sin-carro"
  | "sin-barema"
  | "rechazado";

export type ResultadoPublicacion =
  | { donde: "base"; tripId: string }
  | { donde: "navegador"; porque: MotivoLocal; detalle?: string };

/** Ce qu'on montre à l'utilisateur pour chaque motif. Jamais un code. */
export const MOTIVO_TEXTO: Record<MotivoLocal, string> = {
  "sin-base":
    "Tu viaje quedó guardado en este dispositivo. Todavía no viaja contigo a otro teléfono.",
  "sin-sesion":
    "Tu viaje quedó guardado en este dispositivo. Vuelve a entrar a tu cuenta para que quede en tu perfil.",
  "sin-carro":
    "Tu viaje quedó guardado en este dispositivo: no pudimos registrar tu carro. Revísalo en Mi cuenta e inténtalo otra vez.",
  "sin-barema":
    "Tu viaje quedó guardado en este dispositivo. No pudimos leer el baremo vigente — vuelve a intentarlo en un momento.",
  rechazado:
    "Tu viaje quedó guardado en este dispositivo. La base no aceptó la publicación — vuelve a intentarlo en un momento.",
};

/** ISO complet de la salida, à l'heure du Panama. */
export function salidaIso(date: string, hour: string): string {
  return `${date}T${hour.length === 5 ? hour : `${hour}:00`.slice(0, 5)}:00${PANAMA_UTC_OFFSET}`;
}

/**
 * LE CARRO CÔTÉ SERVEUR — retrouvé, ou créé.
 *
 * Retrouvé d'abord : un conducteur qui publie trois fois avec le même
 * carro doit avoir UN carro en base, pas trois. La clé de rapprochement
 * est ce qui l'identifie pour un humain (marque, modèle, année), pas un
 * identifiant que le navigateur aurait inventé et perdu au premier
 * changement de téléphone.
 */
async function asegurarCarro(
  client: SupabaseClient,
  ownerId: string,
  carro: CarroDelViaje,
): Promise<string | null> {
  const placa = (carro.plate ?? "").trim();
  const plateLast3 = placa ? placa.slice(-3).toUpperCase() : null;

  const { data: existente } = await client
    .from("vehicles")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("make", carro.make)
    .eq("model", carro.model)
    .eq("year", carro.year)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (existente?.id) {
    /* La placa ou la couleur ont pu changer depuis. On met à jour sans
       bloquer : un échec ici ne doit pas empêcher de publier. */
    await client
      .from("vehicles")
      .update({
        color: carro.color ?? null,
        plate_last3: plateLast3,
        seats_total: carro.seatsTotal,
        consumption_l_100km: carro.l100,
        rate_per_km_cents: carro.ratePerKmCents,
      })
      .eq("id", existente.id as string);
    return existente.id as string;
  }

  const { data, error } = await client
    .from("vehicles")
    .insert({
      owner_id: ownerId,
      category_code: carro.category,
      make: carro.make,
      model: carro.model,
      color: carro.color ?? null,
      year: carro.year,
      seats_total: carro.seatsTotal,
      plate_last3: plateLast3,
      consumption_l_100km: carro.l100,
      rate_per_km_cents: carro.ratePerKmCents,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id as string;
}

/** L'identifiant du corridor éditorial, quand la ruta en est un. */
async function idDelCorredor(
  client: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data } = await client
    .from("corridors")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/** La version du barème en vigueur. NULL = on ne publie pas en base :
 *  sans elle, l'instantané ne prouverait rien. */
async function idDelBaremo(client: SupabaseClient): Promise<string | null> {
  const { data } = await client
    .from("price_rules")
    .select("id")
    .is("effective_to", null)
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/**
 * PUBLIER. Le seul point d'entrée.
 *
 * Ne lève jamais. Rend où le viaje a atterri, pour que l'écran de
 * confirmation dise la vérité.
 */
export async function publicarViaje(
  b: BorradorViaje,
): Promise<ResultadoPublicacion> {
  if (!isSupabaseConfigured) return { donde: "navegador", porque: "sin-base" };
  const client = getSupabase();
  if (!client) return { donde: "navegador", porque: "sin-base" };

  let userId: string | null = null;
  try {
    const { data } = await client.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }
  if (!userId) return { donde: "navegador", porque: "sin-sesion" };

  const vehicleId = await asegurarCarro(client, userId, b.carro);
  if (!vehicleId) return { donde: "navegador", porque: "sin-carro" };

  const priceRuleId = await idDelBaremo(client);
  if (!priceRuleId) return { donde: "navegador", porque: "sin-barema" };

  const corridorId = b.esCorredorEditorial
    ? await idDelCorredor(client, b.corridorSlug)
    : null;

  const salida = salidaIso(b.date, b.hour);
  const llegada = new Date(
    new Date(salida).getTime() + b.typicalDurationMin * 60_000,
  ).toISOString();

  /* LE PRIX NE PEUT PAS DÉPASSER LE TOPE. La base le refuserait
     (`price_within_cap`) ; on le borne ici pour que le refus n'arrive
     jamais — une erreur évitée vaut mieux qu'une erreur bien affichée. */
  const precio = Math.max(0, Math.min(b.priceCents, b.cap.maxPriceCents));

  const { data, error } = await client
    .from("trips")
    .insert({
      driver_id: userId,
      vehicle_id: vehicleId,
      corridor_id: corridorId,
      departure_at: salida,
      arrival_estimate_at: llegada,
      seats_offered: b.seats,
      price_cents: precio,
      status: "published",
      published_at: new Date().toISOString(),
      recurrence: RECURRENCIA_SQL[b.recurrence],
      accepts_yappy_direct: b.aceptaFuera.includes("yappy"),
      accepts_cash: b.aceptaFuera.includes("efectivo"),

      /* L'instantané du barème — figé, daté, opposable. */
      price_rule_id: priceRuleId,
      snap_distance_km: Math.round(b.cap.distanceKm * 10) / 10,
      snap_rate_per_km_cents: b.cap.ratePerKmCents,
      snap_toll_cents: b.cap.tollCents,
      snap_cost_total_cents: b.cap.costTotalCents,
      snap_occupants: b.cap.occupants,
      snap_max_price_cents: b.cap.maxPriceCents,

      /* Le lieu tel qu'il a été choisi — la ville est en dessous, pas à
         la place (migration 0022). */
      origin_label: b.origenLabel,
      destination_label: b.destinoLabel,
      origin_lat: b.origen?.lat ?? null,
      origin_lng: b.origen?.lng ?? null,
      destination_lat: b.destino?.lat ?? null,
      destination_lng: b.destino?.lng ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      donde: "navegador",
      porque: "rechazado",
      detalle: error?.message,
    };
  }

  const tripId = data.id as string;
  await guardarParadas(client, tripId, b);
  return { donde: "base", tripId };
}

/**
 * LES ARRÊTS. Écrits après le viaje, et sans le faire échouer.
 *
 * Un viaje publié dont les paradas n'ont pas pu s'écrire reste un viaje
 * publié : le conducteur est joignable, la ruta est connue, le prix est
 * figé. Faire tomber la publication entière pour une ligne accessoire
 * serait échanger un défaut visible contre une perte totale.
 */
async function guardarParadas(
  client: SupabaseClient,
  tripId: string,
  b: BorradorViaje,
): Promise<void> {
  const filas: {
    trip_id: string;
    custom_label: string;
    kind: "origin" | "waypoint" | "destination";
    sequence: number;
  }[] = [];

  filas.push({
    trip_id: tripId,
    custom_label: b.origenLabel,
    kind: "origin",
    sequence: 0,
  });

  /* Les points de recogida déclarés, puis les villes ouvertes. Un même
     libellé ne rentre qu'une fois : `trip_stops` a une unicité sur
     (trip_id, sequence), pas sur le nom, et deux lignes identiques
     donneraient deux fois le même choix au passager. */
  const vistos = new Set([b.origenLabel, b.destinoLabel]);
  for (const punto of [...b.pickups, ...b.cityStops]) {
    const etiqueta = punto.trim();
    if (!etiqueta || vistos.has(etiqueta)) continue;
    vistos.add(etiqueta);
    filas.push({
      trip_id: tripId,
      custom_label: etiqueta,
      kind: "waypoint",
      sequence: filas.length,
    });
  }

  filas.push({
    trip_id: tripId,
    custom_label: b.destinoLabel,
    kind: "destination",
    sequence: filas.length,
  });

  await client.from("trip_stops").insert(filas);
}

/* ── LA SEÑAL DE DEMANDA ───────────────────────────────────────────────
 *
 * « Cuánta gente busca esta ruta » est le seul argument honnête pour
 * demander à quelqu'un de publier : il ne promet aucun revenu (R5), il
 * constate une demande. Encore fallait-il la mesurer — la table existait
 * depuis le premier jour avec zéro ligne, parce que personne ne l'écrivait.
 *
 * Les deux fonctions passent par des RPC (migration 0023) et jamais par
 * la table : le navigateur ne choisit pas qui a cherché, et il ne lit
 * jamais les lignes — seulement un nombre.
 */

/** Enregistre une recherche. Silencieux en cas d'échec : mesurer ne doit
 *  jamais pouvoir casser une recherche. */
export function registrarBusqueda(args: {
  from: string;
  to: string;
  date: string;
  seats: number;
  resultados: number;
}): void {
  if (typeof window === "undefined") return;
  const client = isSupabaseConfigured ? getSupabase() : null;
  if (!client) return;
  void client
    .rpc("registrar_busqueda", {
      p_origen: args.from,
      p_destino: args.to,
      p_fecha: args.date,
      p_puestos: args.seats,
      p_resultados: args.resultados,
      p_sesion: idDeSesion(),
    })
    .then(
      () => undefined,
      () => undefined,
    );
}

/** Combien de recherches distinctes cette ruta a eues récemment.
 *  `null` = on ne sait pas (pas de base, requête échouée) — et dans ce
 *  cas l'interface n'affiche RIEN plutôt qu'un zéro qui découragerait. */
export async function demandaDeRuta(
  from: string,
  to: string,
  dias = 14,
): Promise<number | null> {
  const client = isSupabaseConfigured ? getSupabase() : null;
  if (!client || !from || !to || from === to) return null;
  try {
    const { data, error } = await client
      .rpc("demanda_reciente", {
        p_origen: from,
        p_destino: to,
        p_dias: dias,
      })
      .abortSignal(AbortSignal.timeout(6000));
    if (error || typeof data !== "number") return null;
    return data;
  } catch {
    return null;
  }
}
