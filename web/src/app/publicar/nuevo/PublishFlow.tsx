"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  RequisitosConductor,
  type Requisito,
} from "@/components/publicar/RequisitosConductor";
import { CarroInline } from "@/components/publicar/CarroInline";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { PlacePicker } from "@/components/ui/PlacePicker";
import { libre, type PlaceRef } from "@/lib/place";
import { AuthDialog } from "@/components/site/AuthDialog";
import { carsOf, useSession } from "@/lib/session";
import { ALL_CITIES, buildRoute, getCorridor } from "@/lib/corridors";
import { saveLastSearch, useLastSearch } from "@/lib/lastsearch";
import { track } from "@/lib/analytics";
import { getVerificationState, isSupabaseConfigured } from "@/lib/didit";
import {
  demandaDeRuta,
  publicarViaje,
  MOTIVO_TEXTO,
  type ResultadoPublicacion,
} from "@/lib/publicar";
import * as borrador from "@/lib/borrador";
import {
  computePriceCap,
  formatUsd,
  VEHICLE_LABELS,
  PRICE_RULE,
  type VehicleCategory,
} from "@/lib/pricing";
import { formatDayLabel, localIso, servedPairCount } from "@/lib/trips";
import {
  CAR_MAKES,
  CAR_YEARS,
  agedConsumption,
  categoryFromConsumption,
  findCar,
  modelsForMake,
  rateFromConsumption,
} from "@/lib/cars";

/**
 * PUBLIER — UNE QUESTION PAR ÉCRAN, SUR LA MÊME ADRESSE.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QUI A CHANGÉ, ET POURQUOI C'EST LA BONNE FORME.
 *
 * Avant : quatre étapes, mais l'étape « Hora y puestos » posait quatre
 * questions d'un coup (le jour, l'heure, les puestos, la récurrence, le
 * carro), et l'étape « Paradas » en posait trois. Sur un téléphone, cela
 * donnait des écrans de deux mille pixels où l'on ne savait plus ce qui
 * restait à faire. Un formulaire long n'effraie pas parce qu'il est
 * long : il effraie parce qu'on n'en voit pas le bout.
 *
 * Maintenant : douze écrans, UNE question chacun, un titre qui est la
 * question, et un compteur qui dit exactement où l'on en est. On répond
 * plus vite à douze questions posées une par une qu'à quatre écrans qui
 * en cachent douze — c'est contre-intuitif et c'est mesuré partout.
 *
 * ─────────────────────────────────────────────────────────────────────
 * LA MÊME ADRESSE — décision du propriétaire, et elle est juste.
 *
 * Une adresse par étape aurait rempli l'historique de douze entrées, et
 * partager `/publicar/nuevo/paso-7` n'a aucun sens. On garde donc
 * `/publicar/nuevo`, et on paie les deux dettes que ça crée :
 *
 *   · LE BOUTON RETOUR. `history.pushState` pose une entrée d'historique
 *     SANS changer l'adresse : le retour Android revient à l'étape
 *     d'avant au lieu de quitter le formulaire. L'état de Next est
 *     recopié dans l'objet poussé — l'écraser casserait son routeur.
 *   · LE RECHARGEMENT. Rien dans l'URL ne dit où l'on en était, donc le
 *     brouillon est gardé dans le navigateur (lib/borrador.ts) et rendu
 *     au retour. Sept jours, puis il périme.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ET IL ÉCRIT DANS LA BASE.
 *
 * Le bouton « Publicar » finissait sur `updateSession()` : le viaje
 * n'existait que dans ce navigateur-là. Il passe maintenant par
 * `publicarViaje()` (lib/publicar.ts), qui crée le carro s'il le faut,
 * fige l'instantané du barème et insère le viaje. La copie locale reste
 * — c'est elle qui alimente « repetir mi último viaje » — mais l'écran
 * de confirmation dit désormais LEQUEL des deux s'est produit.
 */

const PASOS = [
  { clave: "ruta", titulo: "¿Por dónde vas?" },
  { clave: "salida", titulo: "¿De dónde sales exactamente?" },
  { clave: "llegada", titulo: "¿Hasta dónde llegas?" },
  { clave: "paradas", titulo: "¿Dónde puedes dejar a alguien?" },
  { clave: "recogida", titulo: "¿Por dónde puedes recoger?" },
  { clave: "cuando", titulo: "¿Cuándo sales?" },
  { clave: "repite", titulo: "¿Se repite?" },
  { clave: "puestos", titulo: "¿Cuántos puestos ofreces?" },
  { clave: "carro", titulo: "¿Con qué carro vas?" },
  { clave: "aporte", titulo: "¿Cuánto pides por puesto?" },
  { clave: "cobro", titulo: "¿Cómo aceptas el aporte?" },
  { clave: "revisar", titulo: "Revisa y publica" },
] as const;

const P = Object.fromEntries(PASOS.map((p, i) => [p.clave, i])) as Record<
  (typeof PASOS)[number]["clave"],
  number
>;

/**
 * LE BUG DE LA VILLE QUI NE CHANGE PAS : l'état du flux s'initialise
 * depuis l'URL UNE fois. Arriver depuis l'accueil avec Coronado, revenir,
 * repartir avec une autre ville — même instance, vieilles valeurs, et les
 * paradas ne bougent pas. La clé remonte le composant à chaque nouvelle
 * combinaison de paramètres : nouvel itinéraire, état neuf.
 */
export function PublishFlowKeyed() {
  const params = useSearchParams();
  const key = `${params.get("ruta") ?? ""}|${params.get("desde") ?? ""}|${params.get("hacia") ?? ""}`;
  return <PublishFlow key={key} />;
}

/**
 * LA MESURE DES ÉTAPES, COMPTÉE UNE SEULE FOIS.
 *
 * La page monte le flux DEUX fois — une version pour l'app, une pour le
 * site — et le CSS n'en montre qu'une (c'est ce qui permet de servir le
 * même HTML aux moteurs et aux gens). Les deux instances vivent, donc les
 * deux effets tirent. Sans cette garde, chaque étape serait comptée deux
 * fois : les taux resteraient justes, les volumes seraient faux, et on
 * n'aurait aucun moyen de le deviner en lisant le tableau de bord.
 *
 * L'état vit au niveau du MODULE, hors de React, précisément parce qu'il
 * doit être partagé par les deux instances.
 */
let ultimoPasoMedido = -1;
function medirPaso(paso: number, from: string, to: string): void {
  if (ultimoPasoMedido === paso) return;
  ultimoPasoMedido = paso;
  track("publicacion_paso", {
    origin_slug: from,
    destination_slug: to,
    props: { paso: PASOS[paso]?.clave ?? "?", indice: paso },
  });
}

function nextDays(count = 14) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = localIso(d);
    return { value, label: formatDayLabel(value) };
  });
}

export function PublishFlow() {
  const params = useSearchParams();
  const { session, updateSession } = useSession();
  const days = useMemo(() => nextDays(), []);

  /* La route peut arriver par ?ruta= (pages corridor) OU par
     ?desde=&hacia= (la carte de la première page). Les deux comptent :
     c'est le bug qui empêchait le saut d'étape — la carte envoyait
     desde/hacia et le flux ne lisait que ruta. */
  const presetPair = buildRoute(
    params.get("desde") ?? "",
    params.get("hacia") ?? "",
  );
  const preset = getCorridor(params.get("ruta") ?? "") ?? presetPair;

  /* Route déjà choisie ? On ne la redemande pas : on entre directement
     sur le point de salida, et « Atrás » ramène à la ruta si besoin. */
  const [paso, setPaso] = useState(preset ? P.salida : P.ruta);
  const last = useLastSearch();
  const [fromChoice, setFromChoice] = useState<string | null>(
    preset ? preset.origin.slug : null,
  );
  const [toChoice, setToChoice] = useState<string | null>(
    preset ? preset.destination.slug : null,
  );
  const from = fromChoice ?? last?.from ?? "panama-city";
  const to = toChoice ?? last?.to ?? "chitre";
  const [stops, setStops] = useState<string[]>([]);
  /* LE LIEU PRÉCIS NE SE REDEMANDE PAS.
     ─────────────────────────────────────────────────────────────────
     Le reproche, mot pour mot : « si je mets un départ précis, il doit
     déjà être là — je ne veux pas chercher deux fois, c'est frustrant ».
     Exact. L'écran « ruta » recueille déjà « Ph Metropolitan Park », et
     l'écran « salida » le retrouve pré-rempli, modifiable. Les deux
     états restent distincts : le lieu de la recherche et le point de
     ramassage exact PEUVENT différer (« je pars de chez moi mais je
     récupère à Multiplaza »), et les confondre enlèverait cette
     liberté. */
  const [exactFromTocado, setExactFromTocado] = useState<string | null>(null);
  const [exactToTocado, setExactToTocado] = useState<string | null>(null);
  const [lugarFrom, setLugarFrom] = useState<PlaceRef | null>(null);
  const [lugarTo, setLugarTo] = useState<PlaceRef | null>(null);
  const [coordsFrom, setCoordsFrom] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [coordsTo, setCoordsTo] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const exactFrom = exactFromTocado ?? lugarFrom?.nombre ?? "";
  const exactTo = exactToTocado ?? lugarTo?.nombre ?? "";
  const [cityStops, setCityStops] = useState<string[]>([]);
  /* « Dejo en cualquier punto del camino » — un seul geste au lieu de
     cocher dix villes. Il coche TOUT le trajet d'un coup et le déclare
     au passager : celui-ci peut proposer son point sans que ça devienne
     une négociation, tant que ça reste sur la route. Le recorrido reste
     celui du conducteur (R4) : un vrai détour se paie et s'accepte. */
  const [dropAnywhere, setDropAnywhere] = useState(false);
  const [date, setDate] = useState(days[1].value);
  const [hour, setHour] = useState("06:00");
  const [seats, setSeats] = useState(3);
  /* Le trajet du lundi est souvent celui de TOUS les lundis : la
     récurrence évite de republier le même viaje chaque semaine. Chaque
     occurrence reste un viaje à part entière (sa page, ses réservations,
     son instantané de barème) — et elle est enfin ENREGISTRÉE : la
     colonne `trips.recurrence` existait depuis la migration 0008 et
     personne ne l'écrivait. */
  const [recurrence, setRecurrence] = useState<
    "una-vez" | "diario" | "semanal" | "mensual"
  >("una-vez");
  const [category, setCategory] = useState<VehicleCategory>("standard");
  /* Comment le conducteur ACCEPTE l'aporte hors app. Le cobro dans l'app
     est toujours là (il n'a rien à gérer, l'argent lui arrive complet) ;
     le reste, c'est SON choix — dérivé de la session tant qu'il n'a pas
     cliqué, comme le canal du passager côté réservation. */
  const [outsideChoice, setOutsideChoice] = useState<
    ("yappy" | "efectivo")[] | null
  >(null);
  const acceptsOutside = outsideChoice ??
    session?.acceptsOutside ?? ["yappy", "efectivo"];
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState(2020);
  const [priceCents, setPriceCents] = useState<number | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPublicacion | null>(null);
  const [showPueblos, setShowPueblos] = useState(false);

  /* CE QU'IL FAUT POUR PUBLIER — décision du propriétaire.
     Un passager monte dans le carro d'un inconnu : celui qui conduit
     prouve qui il est (cédula), qu'il a le droit de conduire (licencia)
     et quel carro il amène (marca, modelo, placa). Les deux documents
     passent par Didit et n'y laissent qu'un verdict ; la placa reste
     chez nous, et ne se montre qu'au passager dont la reserva est
     confirmée. */
  const [docs, setDocs] = useState<{
    cedula: boolean;
    licencia: boolean;
  } | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    let cancelled = false;
    void Promise.all([
      getVerificationState("cedula"),
      getVerificationState("licencia"),
    ]).then(([cedula, licencia]) => {
      if (cancelled) return;
      setDocs({
        cedula: cedula.status === "verified",
        licencia: licencia.status === "verified",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  /* Le carro réel prime sur la catégorie : sa consommation de référence,
     corrigée de l'âge, donne le taux au km sur la MÊME droite que le
     barème (voir src/lib/cars.ts). Le carro ENREGISTRÉ dans Mi cuenta
     arrive prérempli — publier ne redemande pas ce qu'on sait déjà.
     « Otro carro » retombe sur les trois catégories — jamais bloquant. */
  const registeredCars = carsOf(session).filter((c) =>
    findCar(c.make, c.model),
  );
  const [useSavedCar, setUseSavedCar] = useState(true);
  const [carIndex, setCarIndex] = useState(0);
  const savedCar =
    registeredCars[Math.min(carIndex, registeredCars.length - 1)] ?? null;
  const pickerCar = carMake === "otro" ? undefined : findCar(carMake, carModel);
  const activeCar =
    savedCar && useSavedCar
      ? {
          ref: findCar(savedCar.make, savedCar.model)!,
          year: savedCar.year,
          color: savedCar.color ?? null,
          plate: savedCar.plate ?? null,
        }
      : pickerCar
        ? { ref: pickerCar, year: carYear, color: null, plate: null }
        : null;
  const carL100 = activeCar
    ? agedConsumption(activeCar.ref.l100, activeCar.year)
    : null;
  const carRate = carL100 !== null ? rateFromConsumption(carL100) : null;

  /* N'IMPORTE QUELLE paire de villes marche : la ruta s'arme toute seule
     sur le réseau routier (corridor prédéfini quand il existe, synthèse
     par tronçons sinon). Il n'y a pas de « rutas cerradas ». */
  const corridor = buildRoute(from, to);
  const cap = corridor
    ? computePriceCap(
        corridor.distanceKm,
        corridor.tollCents,
        carRate ?? category,
        seats,
      )
    : null;
  const price = priceCents ?? cap?.maxPriceCents ?? 0;

  /** Villes traversées entre l'origine et la destination — les arrêts possibles. */
  const innerStops = corridor ? corridor.waypoints.slice(1, -1) : [];
  /* TROIS VILLES, PAS SEIZE.
     La liste complète d'un trajet Colón → Las Tablas fait seize cases à
     cocher : un mur. On montre le grand bouton « partout » d'abord —
     c'est le geste que 80 % des conducteurs veulent — puis trois villes,
     et le reste derrière « Ver más ». */
  const PREVIEW = 3;
  const visibleStops = showPueblos ? innerStops : innerStops.slice(0, PREVIEW);
  const hiddenCount = innerStops.length - visibleStops.length;
  /** Combien de recherches distinctes les arrêts cochés rendent possibles. */
  const pairCount = servedPairCount(2 + cityStops.length);

  const carroCompleto = registeredCars.some(
    (c) => c.make && c.model && (c.plate ?? "").trim().length >= 4,
  );
  const faltantes: Requisito[] = !isSupabaseConfigured
    ? []
    : ([
        !docs?.cedula && {
          que: "Verificar tu cédula",
          porQue: "Dice quién eres. Dos minutos, con Didit.",
          doc: "cedula" as const,
        },
        !docs?.licencia && {
          que: "Verificar tu licencia de conducir",
          porQue: "Dice que puedes conducir. El mismo recorrido.",
          doc: "licencia" as const,
        },
        !carroCompleto && {
          que: "Tu carro: marca, modelo y placa",
          porQue:
            "Con eso te reconocen en el punto. No pedimos fotos, y la placa no se muestra en público.",
          carro: true as const,
        },
      ].filter(Boolean) as Requisito[]);
  const puedePublicar = faltantes.length === 0;

  /* ── LA SEÑAL DE DEMANDA ──────────────────────────────────────────
     « Cuánta gente busca esta ruta » est le seul argument honnête pour
     demander à quelqu'un de publier : il ne promet aucun revenu (R5), il
     constate une demande. `null` = on ne sait pas, et dans ce cas on
     n'affiche RIEN — un « 0 búsquedas » découragerait sur une base qui
     vient d'ouvrir, et découragerait à tort. */
  /* La ruta voyage AVEC le chiffre. Sans elle il aurait fallu remettre
     l'état à zéro au début de l'effet — un `setState` synchrone dans un
     effet, que le compilateur React refuse à juste titre : il provoque
     un rendu en cascade à chaque changement de ville. Ici, un chiffre
     qui ne correspond pas à la ruta affichée est simplement ignoré. */
  const [demanda, setDemanda] = useState<{ ruta: string; n: number } | null>(
    null,
  );
  useEffect(() => {
    let vivo = true;
    if (!from || !to || from === to) return;
    void demandaDeRuta(from, to).then((n) => {
      if (vivo && n !== null) setDemanda({ ruta: `${from}|${to}`, n });
    });
    return () => {
      vivo = false;
    };
  }, [from, to]);
  const demandaAqui = demanda?.ruta === `${from}|${to}` ? demanda.n : null;

  /* ── L'HISTORIQUE, SANS CHANGER D'ADRESSE ─────────────────────────
     Chaque avancée pose une entrée d'historique qui garde la MÊME URL :
     le retour du téléphone revient à l'étape d'avant au lieu de quitter
     le formulaire. L'état de Next est recopié — l'écraser casserait son
     routeur, qui lit ses propres clés là-dedans. */
  const volviendo = useRef(false);
  useEffect(() => {
    const alVolver = (e: PopStateEvent) => {
      const estado = e.state as { partimosPaso?: number } | null;
      volviendo.current = true;
      setPaso(typeof estado?.partimosPaso === "number" ? estado.partimosPaso : 0);
    };
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  useEffect(() => {
    if (volviendo.current) {
      volviendo.current = false;
      return;
    }
    if (paso === 0) return;
    try {
      window.history.pushState(
        { ...(window.history.state ?? {}), partimosPaso: paso },
        "",
      );
    } catch {
      /* Historique refusé : le bouton « Atrás » de l'écran suffit. */
    }
  }, [paso]);

  /* ── LA MESURE, ÉTAPE PAR ÉTAPE ───────────────────────────────────
     On savait combien de viajes étaient publiés, jamais où les autres
     s'arrêtaient. Un formulaire qui perd les gens sur « tu carro » et un
     formulaire qui les perd sur « aporte » demandent deux corrections
     opposées, et rien ne permettait de les distinguer. */
  useEffect(() => {
    medirPaso(paso, from, to);
    /* La ruta ne change pas la nature de l'étape : on ne remesure pas
       une étape parce que la ville a bougé. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  /* ── LE BROUILLON ─────────────────────────────────────────────────
     Contrepartie de « la même adresse » : rien dans l'URL ne dit où l'on
     en était. On le garde ici, et on le rend au retour. */
  /* `listo` garde l'ORDRE : on ne réécrit pas le brouillon avant d'avoir
     tenté de le lire. Sans lui, la sauvegarde du montage (étape 0)
     écrasait le brouillon avant que la restauration ne l'ait ouvert — et
     revenir sur la page renvoyait toujours à la première question. Le
     bug était invisible en développement, parce qu'on ne recharge jamais
     au milieu d'un formulaire quand on est en train de l'écrire. */
  const [listo, setListo] = useState(false);
  const restaurado = useRef(false);
  useEffect(() => {
    if (restaurado.current) return;
    restaurado.current = true;
    /* HORS DU RENDU, EXPRÈS. Le brouillon vient du `localStorage`, une
       source extérieure à React : le lire ne peut pas se faire au rendu
       (le serveur n'y a pas accès, l'hydratation casserait), et le poser
       de façon SYNCHRONE dans un effet déclenche un rendu en cascade que
       le compilateur React refuse. Une micro-tâche : le premier rendu
       reste celui d'un formulaire vierge, la restauration arrive juste
       après, en un seul lot. */
    queueMicrotask(() => {
      /* Une ruta arrive par l'URL : elle est plus récente que n'importe
         quel brouillon, et l'écraser par un vieux formulaire serait
         ignorer le geste qu'on vient de faire. */
      const b = preset ? null : borrador.leer();
      setListo(true);
      if (!b) return;
      setPaso(Math.min(Math.max(0, b.paso), PASOS.length - 1));
      setFromChoice(b.from);
      setToChoice(b.to);
      setLugarFrom((b.origen as PlaceRef | null) ?? null);
      setLugarTo((b.destino as PlaceRef | null) ?? null);
      setExactFromTocado(b.exactFrom);
      setExactToTocado(b.exactTo);
      setCityStops(b.cityStops ?? []);
      setStops(b.pickups ?? []);
      setDropAnywhere(Boolean(b.dropAnywhere));
      setDate(b.date);
      setHour(b.hour);
      setSeats(b.seats);
      setRecurrence(b.recurrence as typeof recurrence);
      setPriceCents(b.priceCents);
      setOutsideChoice(
        (b.aceptaFuera as ("yappy" | "efectivo")[] | null) ?? null,
      );
      setCarMake(b.carMake ?? "");
      setCarModel(b.carModel ?? "");
      setCarYear(b.carYear ?? 2020);
      setCategory((b.category as VehicleCategory) ?? "standard");
      setUseSavedCar(b.useSavedCar ?? true);
      setCarIndex(b.carIndex ?? 0);
    });
  }, [preset]);

  useEffect(() => {
    if (resultado || !listo) return;
    borrador.guardar({
      paso,
      from,
      to,
      origen: lugarFrom,
      destino: lugarTo,
      exactFrom: exactFromTocado,
      exactTo: exactToTocado,
      cityStops,
      pickups: stops,
      dropAnywhere,
      date,
      hour,
      seats,
      recurrence,
      priceCents,
      aceptaFuera: outsideChoice,
      carMake,
      carModel,
      carYear,
      category,
      useSavedCar,
      carIndex,
    });
  }, [
    listo,
    resultado,
    paso,
    from,
    to,
    lugarFrom,
    lugarTo,
    exactFromTocado,
    exactToTocado,
    cityStops,
    stops,
    dropAnywhere,
    date,
    hour,
    seats,
    recurrence,
    priceCents,
    outsideChoice,
    carMake,
    carModel,
    carYear,
    category,
    useSavedCar,
    carIndex,
  ]);

  /* Le libellé retenu pour chaque bout : le lieu exact s'il existe, le
     nom de la ville sinon. C'est ce qui part en base. */
  const origenLabel = exactFrom.trim() || corridor?.origin.shortName || "";
  const destinoLabel = exactTo.trim() || corridor?.destination.shortName || "";

  /* Pas de `useCallback` : la moitié de ce dont cette fonction dépend est
     dérivée à chaque rendu (le carro actif, les paradas de la ruta), et
     la liste de dépendances devenait un mensonge que le compilateur
     React refusait de préserver. Lui sait mémoriser ça tout seul. */
  const publicar = async () => {
    if (!corridor || !cap || publicando) return;
    setPublicando(true);

    const snapshot = {
      from,
      to,
      cityStops,
      pickups: stops,
      date,
      hour,
      seats,
      recurrence,
      priceCents: price,
      dropAnywhere,
    };

    /* Le lieu exact tapé à la main devient un lieu « libre » : il n'a pas
       de coordonnées propres, seulement celles que le géocodeur a bien
       voulu rendre. L'absence n'est pas un problème — le matching sait
       retomber sur la ville. */
    const origenRef: PlaceRef | null = exactFromTocado
      ? {
          ...libre(exactFromTocado, corridor.origin.slug),
          lat: coordsFrom?.lat ?? null,
          lng: coordsFrom?.lng ?? null,
        }
      : lugarFrom;
    const destinoRef: PlaceRef | null = exactToTocado
      ? {
          ...libre(exactToTocado, corridor.destination.slug),
          lat: coordsTo?.lat ?? null,
          lng: coordsTo?.lng ?? null,
        }
      : lugarTo;

    const r = await publicarViaje({
      from,
      to,
      origen: origenRef,
      destino: destinoRef,
      origenLabel,
      destinoLabel,
      cityStops: innerStops
        .filter((s) => cityStops.includes(s.citySlug))
        .map((s) => s.name),
      pickups: stops,
      dropAnywhere,
      date,
      hour,
      seats,
      recurrence,
      priceCents: price,
      aceptaFuera: acceptsOutside,
      carro: {
        make: activeCar?.ref.make ?? "Otro",
        model: activeCar?.ref.model ?? VEHICLE_LABELS[category],
        year: activeCar?.year ?? carYear,
        color: activeCar?.color ?? null,
        plate: activeCar?.plate ?? null,
        category:
          carL100 !== null ? categoryFromConsumption(carL100) : category,
        l100: carL100,
        ratePerKmCents: cap.ratePerKmCents,
        seatsTotal: Math.min(8, Math.max(2, seats + 1)),
      },
      cap,
      corridorSlug: corridor.slug,
      esCorredorEditorial: Boolean(getCorridor(corridor.slug)),
      typicalDurationMin: corridor.typicalDurationMin,
    });

    track("publicacion_hecha", {
      origin_slug: from,
      destination_slug: to,
      props: {
        puestos: seats,
        paradas: cityStops.length,
        recurrencia: recurrence,
        abre_todo_el_camino: dropAnywhere,
        precio_centavos: price,
        guardado_en: r.donde,
        motivo: r.donde === "navegador" ? r.porque : null,
      },
    });

    /* La copie locale reste, quoi qu'il arrive : c'est elle qui alimente
       « repetir mi último viaje » et le compteur de Mi cuenta. Elle n'est
       plus la SEULE trace, c'est toute la différence. */
    updateSession({
      acceptsOutside,
      lastPublish: snapshot,
      published: [...(session?.published ?? []), snapshot],
    });
    borrador.olvidar();
    setResultado(r);
    setPublicando(false);
  };

  /* ── L'ÉCRAN DE CONFIRMATION ──────────────────────────────────────── */
  if (resultado && corridor && cap) {
    const enBase = resultado.donde === "base";
    return (
      <Container className="cima-app pt-10">
        <div className="mx-auto max-w-[560px] rounded-[20px] border border-ink-200 bg-white p-7 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-ink-900 text-white">
            <Icon name="check" className="size-6" />
          </span>
          <h1 className="mb-2 font-display text-[26px] font-extrabold tracking-[-0.03em]">
            {enBase ? "Tu viaje está publicado" : "Tu viaje quedó guardado"}
          </h1>
          <p className="mb-6 text-[15px] leading-relaxed text-ink-500">
            {origenLabel} → {destinoLabel}, {formatDayLabel(date)} a las {hour}.{" "}
            {seats} {seats === 1 ? "puesto" : "puestos"} a {formatUsd(price)}
            {recurrence === "diario" && ", repetido cada día"}
            {recurrence === "semanal" && ", repetido cada semana"}
            {recurrence === "mensual" && ", repetido cada mes"}. Te avisamos por
            WhatsApp en cuanto alguien pida un puesto — cada quien te propone su
            punto y tú decides si te queda de paso.
          </p>
          <p className="mb-6 rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
            Aceptas el aporte{" "}
            {acceptsOutside.length === 0
              ? "solo por la app — todo llega cobrado, con comprobante"
              : `por la app${
                  acceptsOutside.includes("yappy") ? ", por Yappy directo" : ""
                }${acceptsOutside.includes("efectivo") ? " y en efectivo" : ""}`}
            . Te llega completo en todos los casos.
          </p>
          {cityStops.length > 0 && (
            <p className="mb-6 rounded-[14px] bg-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-accent-ink">
              Como paras en{" "}
              {innerStops
                .filter((s) => cityStops.includes(s.citySlug))
                .map((s) => s.name)
                .join(" y ")}
              , tu viaje sale en {pairCount} búsquedas distintas y no solo en la
              de {corridor.origin.shortName} → {corridor.destination.shortName}.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/cuenta"
              className="rounded-[14px] bg-ink-900 px-5 py-3 font-display text-[15px] font-bold text-white shadow-[0_8px_20px_-8px_rgb(14_42_53/0.5)] transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-ink-800 active:scale-[0.97]"
            >
              Ver mis viajes
            </Link>
            {/* La page /viajes n'existe que pour les corridors éditoriaux ;
                une ruta synthétisée n'a pas de page dédiée — pas de lien
                mort. */}
            {getCorridor(corridor.slug) && (
              <Link
                href={`/viajes/${corridor.slug}`}
                className="rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold"
              >
                Ver la ruta
              </Link>
            )}
          </div>
          {/* CE QUI S'EST VRAIMENT PASSÉ. Un produit qui laisse croire
              qu'il a enregistré ce qu'il n'a pas enregistré se paie une
              seule fois, très cher. */}
          <p className="mt-5 text-[12.5px] leading-snug text-ink-500">
            {enBase
              ? "Quedó guardado en tu cuenta. Todavía no aparece en las búsquedas de los demás — la búsqueda sigue leyendo el catálogo de demostración, y eso llega en el siguiente paso."
              : MOTIVO_TEXTO[resultado.porque]}
          </p>
        </div>
      </Container>
    );
  }

  /* LE CONTRÔLE DES PAPIERS PASSE DEVANT TOUT.
     Décision du propriétaire : on ne remplit pas un viaje pour découvrir
     à la fin qu'il manque la cédula. Tant que les trois choses ne sont pas
     là, le formulaire n'existe pas — on ne voit QUE ce qu'il faut faire,
     et chaque ligne porte son geste. */
  if (session && !puedePublicar) {
    return (
      <Container className="cima-app pt-6">
        <div className="mx-auto max-w-[620px]">
          <h1 className="mb-2 font-display text-[clamp(24px,5vw,32px)] leading-[1.08] font-extrabold tracking-[-0.03em]">
            Primero, confirmemos quién eres
          </h1>
          <p className="mb-6 text-[15px] leading-relaxed text-ink-500">
            Alguien va a subirse a tu carro. Estas tres cosas se piden una sola
            vez, y después publicar toma menos de un minuto.
          </p>
          <RequisitosConductor faltantes={faltantes} tono="bloqueo" />
          <p className="mt-4 text-center text-[13.5px] text-ink-500">
            ¿Ya lo hiciste y sigue apareciendo aquí?{" "}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-semibold text-accent-ink hover:underline"
            >
              Vuelve a revisar
            </button>
            . La verificación puede tardar un par de minutos.
          </p>
        </div>
      </Container>
    );
  }

  const clave = PASOS[paso].clave;
  const esUltimo = clave === "revisar";

  /* Ce qui autorise à passer à l'écran suivant. Une seule question par
     écran, donc une seule condition par écran — et la plupart sont
     facultatives à dessein : un formulaire qui bloque sur un détail
     facultatif est un formulaire qu'on abandonne. */
  const puedeSeguir: Record<string, boolean> = {
    ruta: Boolean(corridor),
    salida: true,
    llegada: true,
    paradas: true,
    recogida: true,
    cuando: Boolean(date && hour),
    repite: true,
    puestos: seats > 0,
    carro: Boolean(activeCar) || carMake === "otro",
    aporte: Boolean(cap),
    cobro: true,
    revisar: puedePublicar,
  };

  const irA = (destino: number) => setPaso(destino);

  return (
    <Container className="cima-app pt-6">
      <div className="mx-auto max-w-[620px]">
        {/* LA PROGRESSION. Douze traits côte à côte seraient illisibles
            sur un téléphone : une barre, un compteur, et le nom de
            l'étape. On sait où on en est et combien il reste. */}
        <div className="mb-5">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
              Paso {paso + 1} de {PASOS.length}
            </span>
            {paso > 0 && (
              <button
                type="button"
                onClick={() => irA(0)}
                className="text-[12.5px] font-semibold text-ink-500 hover:text-accent-ink hover:underline"
              >
                Volver al inicio
              </button>
            )}
          </div>
          <span
            className="block h-1.5 overflow-hidden rounded-full bg-ink-200"
            role="progressbar"
            aria-valuenow={paso + 1}
            aria-valuemin={1}
            aria-valuemax={PASOS.length}
            aria-label="Progreso de la publicación"
          >
            <span
              className="block h-full rounded-full bg-ink-900 transition-[width] duration-300"
              style={{ width: `${((paso + 1) / PASOS.length) * 100}%` }}
            />
          </span>
        </div>

        <div className="glass liquid rounded-[20px] p-5 sm:p-6 [--glass-alpha:0.88]">
          <h1 className="mb-1.5 font-display text-[24px] leading-[1.15] font-extrabold tracking-[-0.03em]">
            {PASOS[paso].titulo}
          </h1>

          {/* ─── 1. LA RUTA ─────────────────────────────────────────── */}
          {clave === "ruta" && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Tu salida y tu destino — cualquier par de ciudades. La ruta se
                arma sola, con sus paradas en el camino.
              </p>

              {/* LE raccourci : republier son dernier viaje sans rien
                  resaisir. Seule la DATE reste à choisir. */}
              {!preset && session?.lastPublish && (
                <button
                  type="button"
                  onClick={() => {
                    const ultimo = session.lastPublish!;
                    setFromChoice(ultimo.from);
                    setToChoice(ultimo.to);
                    setCityStops(ultimo.cityStops);
                    setDropAnywhere(Boolean(ultimo.dropAnywhere));
                    setStops(ultimo.pickups);
                    setHour(ultimo.hour);
                    setSeats(ultimo.seats);
                    setRecurrence(ultimo.recurrence);
                    setPriceCents(null);
                    irA(P.cuando);
                  }}
                  className="mb-5 flex w-full items-center gap-3 rounded-[14px] bg-ink-900 px-4 py-3.5 text-left text-white transition-colors hover:bg-ink-800"
                >
                  <Icon name="route" className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">
                      Repetir mi último viaje
                    </span>
                    <span className="tnum block text-[12.5px] text-white/70">
                      {
                        ALL_CITIES.find(
                          (c) => c.slug === session.lastPublish!.from,
                        )?.shortName
                      }{" "}
                      →{" "}
                      {
                        ALL_CITIES.find(
                          (c) => c.slug === session.lastPublish!.to,
                        )?.shortName
                      }{" "}
                      · {session.lastPublish.hour} · {session.lastPublish.seats}{" "}
                      {session.lastPublish.seats === 1 ? "puesto" : "puestos"} —
                      solo eliges la fecha
                    </span>
                  </span>
                  <Icon name="arrowRight" className="size-4 shrink-0" />
                </button>
              )}

              <div className="relative mb-3 rounded-[20px] border border-ink-200 bg-white">
                <CityCombobox
                  id="pub-desde"
                  label="Desde"
                  value={from}
                  exclude={to}
                  tone="origin"
                  lugar={lugarFrom}
                  onPlaceRef={(l) => {
                    setLugarFrom(l);
                    setExactFromTocado(null);
                    setCoordsFrom(
                      l && l.lat !== null && l.lng !== null
                        ? { lat: l.lat, lng: l.lng }
                        : null,
                    );
                  }}
                  onChange={(slug) => {
                    setFromChoice(slug);
                    if (slug === to) setToChoice("");
                    setStops([]);
                    setCityStops([]);
                  }}
                />
                <button
                  type="button"
                  aria-label="Invertir salida y destino"
                  onClick={() => {
                    setFromChoice(to);
                    setToChoice(from);
                    setStops([]);
                    setCityStops([]);
                  }}
                  className="absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition-colors hover:border-accent hover:text-accent-ink"
                >
                  <Icon name="swap" className="size-4" />
                </button>
                <div className="border-t border-ink-200">
                  <CityCombobox
                    id="pub-hacia"
                    label="Hacia"
                    value={to}
                    exclude={from}
                    tone="destination"
                    lugar={lugarTo}
                    onPlaceRef={(l) => {
                      setLugarTo(l);
                      setExactToTocado(null);
                      setCoordsTo(
                        l && l.lat !== null && l.lng !== null
                          ? { lat: l.lat, lng: l.lng }
                          : null,
                      );
                    }}
                    onChange={(slug) => {
                      setToChoice(slug);
                      setStops([]);
                      setCityStops([]);
                    }}
                  />
                </div>
              </div>

              {corridor && (
                <p className="tnum mt-3 rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
                  <b className="font-semibold text-ink-900">
                    {corridor.origin.shortName} →{" "}
                    {corridor.destination.shortName}
                  </b>
                  {" — "}
                  {corridor.distanceKm} km
                  {corridor.waypoints.length > 2 && (
                    <>
                      , pasando por{" "}
                      {corridor.waypoints
                        .slice(1, -1)
                        .map((w) => w.name)
                        .join(", ")}
                    </>
                  )}
                  .
                </p>
              )}

              {/* LA DEMANDE RÉELLE. Elle ne promet rien (R5) : elle dit
                  combien de fois cette ruta a été cherchée. Absente ou
                  nulle, on ne montre rien — un zéro sur une base qui
                  vient d'ouvrir découragerait à tort. */}
              {demandaAqui !== null && demandaAqui > 0 && (
                <p
                  className="tnum mt-2.5 rounded-[14px] bg-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-accent-ink"
                  aria-live="polite"
                >
                  <b className="font-semibold">
                    {demandaAqui}{" "}
                    {demandaAqui === 1 ? "búsqueda" : "búsquedas"} de esta ruta
                  </b>{" "}
                  en los últimos 14 días. Nadie te promete que se llene — es
                  simplemente gente que la buscó.
                </p>
              )}
            </>
          )}

          {/* ─── 2. LA SALIDA EXACTA ────────────────────────────────── */}
          {clave === "salida" && corridor && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                El punto donde arrancas de verdad. Tú decides el recorrido: los
                pasajeros propondrán el suyo y tú aceptas si te queda de paso.
              </p>
              <PlacePicker
                id="pub-salida-exacta"
                label={`En ${corridor.origin.shortName}`}
                citySlug={corridor.origin.slug}
                value={exactFrom}
                onChange={setExactFromTocado}
                onCoords={setCoordsFrom}
                onCityResolved={(slug) => {
                  if (slug !== to) {
                    setFromChoice(slug);
                    setStops([]);
                    setCityStops([]);
                  }
                }}
                placeholder="Ej. Multiplaza, Parque Omar…"
              />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
                Si lo dejas vacío, tu viaje sale como{" "}
                <b className="font-semibold text-ink-900">
                  {corridor.origin.shortName}
                </b>{" "}
                a secas — se puede, pero cuesta más ponerse de acuerdo el día
                del viaje.
              </p>
            </>
          )}

          {/* ─── 3. LA LLEGADA EXACTA ───────────────────────────────── */}
          {clave === "llegada" && corridor && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Hasta dónde llegas tú. Quien se baje antes aporta por menos
                kilómetros — no por menos comodidad.
              </p>
              <PlacePicker
                id="pub-llegada-exacta"
                label={`En ${corridor.destination.shortName}`}
                citySlug={corridor.destination.slug}
                value={exactTo}
                onChange={setExactToTocado}
                onCoords={setCoordsTo}
                onCityResolved={(slug) => {
                  if (slug !== from) {
                    setToChoice(slug);
                    setStops([]);
                    setCityStops([]);
                  }
                }}
                placeholder="Ej. el parque central, tu barriada…"
              />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
                Si lo dejas vacío, tu viaje llega a{" "}
                <b className="font-semibold text-ink-900">
                  {corridor.destination.shortName}
                </b>{" "}
                a secas.
              </p>
            </>
          )}

          {/* ─── 4. LAS PARADAS ─────────────────────────────────────── */}
          {clave === "paradas" && corridor && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Marca solo lo que ya te queda de paso. Es opcional — y es lo que
                hace que un mismo viaje salga en varias búsquedas.
              </p>

              {innerStops.length === 0 ? (
                <p className="rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
                  Esta ruta va directo: no pasa por ninguna otra ciudad del
                  camino. Sigue al paso siguiente.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    aria-pressed={dropAnywhere}
                    onClick={() => {
                      const next = !dropAnywhere;
                      setDropAnywhere(next);
                      if (next) {
                        setCityStops(innerStops.map((s) => s.citySlug));
                        setShowPueblos(false);
                      }
                    }}
                    className={`mb-4 flex w-full items-start gap-3 rounded-[20px] border-[1.5px] px-4 py-3.5 text-left transition-colors ${
                      dropAnywhere
                        ? "border-ink-900 bg-ink-900 text-white"
                        : "border-ink-200 hover:border-accent"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 ${
                        dropAnywhere
                          ? "border-white bg-white text-ink-900"
                          : "border-ink-200"
                      }`}
                    >
                      {dropAnywhere && <Icon name="check" className="size-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">
                        Puedo dejar en cualquier punto del camino
                      </span>
                      <span
                        className={`block text-[13px] leading-snug ${
                          dropAnywhere ? "text-white/75" : "text-ink-500"
                        }`}
                      >
                        Marca de una vez todas las ciudades de tu ruta. Si
                        alguien te pide un punto que te queda de paso, no tienes
                        que negociar nada — un desvío de verdad sí lo decides
                        tú.
                      </span>
                    </span>
                  </button>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {visibleStops.map((stop) => {
                      const active = cityStops.includes(stop.citySlug);
                      return (
                        <button
                          key={stop.citySlug}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            /* Décocher une ville, c'est dire « pas
                               partout » : le grand bouton doit suivre,
                               sinon il mentirait au passager. */
                            if (active) setDropAnywhere(false);
                            setCityStops((s) =>
                              active
                                ? s.filter((c) => c !== stop.citySlug)
                                : [...s, stop.citySlug],
                            );
                          }}
                          className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors ${
                            active
                              ? "border-ink-900 bg-ink-50"
                              : "border-ink-200 hover:border-accent"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 ${
                              active
                                ? "border-ink-900 bg-ink-900 text-white"
                                : "border-ink-200"
                            }`}
                          >
                            {active && <Icon name="check" className="size-3" />}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`block text-[15px] ${active ? "font-semibold" : ""}`}
                            >
                              {stop.name}
                            </span>
                            <span className="tnum block text-[12.5px] text-ink-500">
                              km {stop.km} de tu ruta
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      aria-expanded={showPueblos}
                      onClick={() => setShowPueblos(true)}
                      className="mt-2.5 w-full rounded-[14px] border-[1.5px] border-ink-200 px-4 py-3 text-[14.5px] font-bold transition-colors hover:border-accent hover:text-accent-ink"
                    >
                      Ver las {hiddenCount} ciudades que faltan
                    </button>
                  )}
                  {showPueblos && innerStops.length > PREVIEW && (
                    <button
                      type="button"
                      onClick={() => setShowPueblos(false)}
                      className="mt-2.5 text-[13.5px] font-semibold text-accent-ink hover:underline"
                    >
                      Ver menos
                    </button>
                  )}
                  <p
                    className="mt-3 rounded-[14px] bg-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-accent-ink"
                    aria-live="polite"
                  >
                    {pairCount === 1 ? (
                      <>
                        Tu viaje aparece en <b>1 búsqueda</b>. Marcando una
                        parada aparecería en 3.
                      </>
                    ) : (
                      <>
                        Con {cityStops.length}{" "}
                        {cityStops.length === 1 ? "parada" : "paradas"}, tu
                        viaje aparece en <b>{pairCount} búsquedas distintas</b>.
                        Mismo recorrido, misma hora.
                      </>
                    )}
                  </p>
                </>
              )}
            </>
          )}

          {/* ─── 5. LOS PUNTOS DE RECOGIDA ──────────────────────────── */}
          {clave === "recogida" && corridor && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Puntos por donde ya vas a pasar. Máximo {PRICE_RULE.maxStops}, y
                ninguno en una terminal de buses. También es opcional: cada
                pasajero te propondrá el suyo y tú decides.
              </p>
              <div className="grid gap-2">
                {corridor.pickupPoints.map((point) => {
                  const active = stops.includes(point);
                  const full = stops.length >= PRICE_RULE.maxStops && !active;
                  return (
                    <button
                      key={point}
                      type="button"
                      aria-pressed={active}
                      disabled={full}
                      onClick={() =>
                        setStops((s) =>
                          active ? s.filter((p) => p !== point) : [...s, point],
                        )
                      }
                      className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-[15px] transition-colors disabled:opacity-40 ${
                        active
                          ? "border-ink-900 bg-ink-50 font-semibold"
                          : "border-ink-200 hover:border-accent"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 ${
                          active
                            ? "border-ink-900 bg-ink-900 text-white"
                            : "border-ink-200"
                        }`}
                      >
                        {active && <Icon name="check" className="size-3" />}
                      </span>
                      {point}
                    </button>
                  );
                })}
              </div>
              <p className="tnum mt-3 text-[13.5px] text-ink-500">
                {stops.length}/{PRICE_RULE.maxStops} paradas.
              </p>
            </>
          )}

          {/* ─── 6. CUÁNDO ──────────────────────────────────────────── */}
          {clave === "cuando" && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Tú pones la hora. Nadie te asigna un viaje ni te cambia el
                recorrido.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                    Día
                  </span>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full cursor-pointer rounded-[14px] border border-ink-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
                  >
                    {days.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                    Hora de salida
                  </span>
                  <input
                    type="time"
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="tnum w-full rounded-[14px] border border-ink-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
            </>
          )}

          {/* ─── 7. LA RECURRENCIA ──────────────────────────────────── */}
          {clave === "repite" && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                El viaje del lunes suele ser el de todos los lunes. Dilo una vez
                y no vuelvas a publicarlo cada semana.
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["una-vez", "Solo esta vez"],
                    ["diario", "Cada día"],
                    ["semanal", "Cada semana"],
                    ["mensual", "Cada mes"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={recurrence === value}
                    onClick={() => setRecurrence(value)}
                    className={pill(recurrence === value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {recurrence !== "una-vez" && (
                <p className="mt-3 rounded-[14px] bg-ink-50 px-4 py-3 text-[13px] leading-relaxed text-ink-500">
                  Cada salida se publica como su propio viaje: puedes cancelar
                  una sin tocar las demás, y el aporte se congela viaje por
                  viaje.
                </p>
              )}
            </>
          )}

          {/* ─── 8. LOS PUESTOS ─────────────────────────────────────── */}
          {clave === "puestos" && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Cuántas personas caben cómodas. Cuantos más puestos, más se
                reparte el gasto — y más baja el tope por puesto.
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={seats === n}
                    onClick={() => {
                      setSeats(n);
                      setPriceCents(null);
                    }}
                    className={pill(seats === n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {cap && (
                <p className="tnum mt-3 rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
                  Con {seats} {seats === 1 ? "puesto" : "puestos"}, el gasto se
                  reparte entre {cap.occupants} ocupantes —{" "}
                  <b className="font-semibold text-ink-900">tú incluido</b>. El
                  tope queda en {formatUsd(cap.maxPriceCents)} por puesto.
                </p>
              )}
            </>
          )}

          {/* ─── 9. EL CARRO ────────────────────────────────────────── */}
          {clave === "carro" && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Lo que gasta TU carro fija el tope. Un carro que consume más
                puede pedir más; uno ahorrador, menos.
              </p>

              {/* AUCUN CARRO ENREGISTRÉ ? ON LE DEMANDE ICI, PAS AILLEURS.
                  Le formulaire menait à Mi cuenta, et quitter la
                  publication à cet instant, c'est ne pas revenir. Une fois
                  enregistré, il devient LE carro du viaje : son modèle et
                  son année fixent le taux au km, donc le tope. */}
              {registeredCars.length === 0 && carMake !== "otro" && (
                <div className="mb-4 rounded-[18px] border border-ink-200 bg-white p-4">
                  <CarroInline
                    compacto
                    onGuardado={() => {
                      setUseSavedCar(true);
                      setCarIndex(0);
                      setPriceCents(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCarMake("otro");
                      setPriceCents(null);
                    }}
                    className="mt-3 text-[13.5px] font-semibold text-sol-700 underline-offset-2 hover:underline"
                  >
                    Mi carro no está en la lista
                  </button>
                </div>
              )}

              {savedCar && useSavedCar ? (
                <>
                  {registeredCars.length > 1 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {registeredCars.map((c, i) => (
                        <button
                          key={`${c.make}-${c.model}-${c.year}-${i}`}
                          type="button"
                          aria-pressed={i === carIndex}
                          onClick={() => {
                            setCarIndex(i);
                            setPriceCents(null);
                          }}
                          className={pill(i === carIndex)}
                        >
                          {c.make} {c.model}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-ink-200 px-4 py-3">
                    <Icon name="car" className="size-6 text-ink-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">
                        {savedCar.make} {savedCar.model} {savedCar.year}
                      </span>
                      {carRate !== null && (
                        <span className="tnum block text-[12.5px] text-ink-500">
                          {formatUsd(carRate)} por km — tu carro registrado
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUseSavedCar(false);
                        setPriceCents(null);
                      }}
                      className="text-[13.5px] font-semibold text-accent-ink hover:underline"
                    >
                      Usar otro
                    </button>
                  </div>
                </>
              ) : registeredCars.length > 0 || carMake === "otro" ? (
                <>
                  {savedCar && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseSavedCar(true);
                        setPriceCents(null);
                      }}
                      className="mb-2 text-[13.5px] font-semibold text-accent-ink hover:underline"
                    >
                      ← Volver a mi carro registrado ({savedCar.make}{" "}
                      {savedCar.model})
                    </button>
                  )}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select
                      value={carMake}
                      onChange={(e) => {
                        setCarMake(e.target.value);
                        setCarModel("");
                        setPriceCents(null);
                      }}
                      aria-label="Marca del carro"
                      className={carSelect()}
                    >
                      <option value="">Marca…</option>
                      {CAR_MAKES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value="otro">Otro / no está</option>
                    </select>

                    <select
                      value={carModel}
                      onChange={(e) => {
                        setCarModel(e.target.value);
                        setPriceCents(null);
                      }}
                      disabled={!carMake || carMake === "otro"}
                      aria-label="Modelo del carro"
                      className={carSelect()}
                    >
                      <option value="">Modelo…</option>
                      {carMake !== "otro" &&
                        modelsForMake(carMake).map((m) => (
                          <option key={m.model} value={m.model}>
                            {m.model}
                          </option>
                        ))}
                    </select>

                    <select
                      value={carYear}
                      onChange={(e) => {
                        setCarYear(Number(e.target.value));
                        setPriceCents(null);
                      }}
                      disabled={!pickerCar}
                      aria-label="Año del carro"
                      className={carSelect()}
                    >
                      {CAR_YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {pickerCar && carL100 !== null && carRate !== null && (
                    <p className="tnum mt-2.5 rounded-[14px] bg-ink-50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink-500">
                      <b className="font-semibold text-ink-900">
                        {pickerCar.make} {pickerCar.model} {carYear}
                      </b>
                      {" — consumo de referencia ~"}
                      {carL100.toFixed(1).replace(".", ",")} L/100 km, o sea{" "}
                      <b className="font-semibold text-ink-900">
                        {formatUsd(carRate)} por km
                      </b>
                      .
                    </p>
                  )}

                  {carMake === "otro" && (
                    <div className="mt-2.5">
                      <p className="mb-2 text-[13.5px] text-ink-500">
                        Sin problema — elige la categoría que más se parece:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(["economy", "standard", "suv"] as const).map(
                          (code) => (
                            <button
                              key={code}
                              type="button"
                              aria-pressed={category === code}
                              onClick={() => {
                                setCategory(code);
                                setPriceCents(null);
                              }}
                              className={pill(category === code)}
                            >
                              {VEHICLE_LABELS[code]}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </>
          )}

          {/* ─── 10. EL APORTE ──────────────────────────────────────── */}
          {clave === "aporte" && cap && corridor && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Puedes pedir menos que el tope. Más no, y no es la app siendo
                estricta: es lo que separa compartir gastos de cobrar un pasaje.
              </p>

              <div className="rounded-[20px] bg-ink-50 p-5">
                <p className="text-center text-[11.5px] font-bold tracking-[0.13em] text-ink-500 uppercase">
                  Aporte por puesto
                </p>
                <p className="tnum text-center font-display text-[44px] leading-tight font-extrabold tracking-[-0.04em] text-action-deep">
                  {formatUsd(price)}
                </p>
                <input
                  type="range"
                  min={0}
                  max={cap.maxPriceCents}
                  step={50}
                  value={price}
                  onChange={(e) => setPriceCents(Number(e.target.value))}
                  aria-label="Aporte por puesto"
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white"
                />
                <p className="tnum mt-1 flex justify-between text-[12.5px] text-ink-500">
                  <span>{formatUsd(0)}</span>
                  <span>Tope {formatUsd(cap.maxPriceCents)}</span>
                </p>
              </div>

              <dl className="mt-4 text-[14.5px]">
                <Row
                  label={
                    activeCar
                      ? `Tu ${activeCar.ref.make} ${activeCar.ref.model} ${activeCar.year}, por km`
                      : `Categoría ${VEHICLE_LABELS[category]}, por km`
                  }
                >
                  {formatUsd(cap.ratePerKmCents)}
                </Row>
                <Row label={`${corridor.distanceKm} km, peajes y desgaste`}>
                  {formatUsd(cap.costTotalCents)}
                </Row>
                <Row label={`Entre ${cap.occupants} ocupantes, tú incluido`}>
                  {formatUsd(cap.maxPriceCents)}
                </Row>
                <Row label="Recuperas con el carro lleno" strong>
                  {formatUsd(price * seats)}
                </Row>
                <Row label="Sigues poniendo de tu bolsillo">
                  {formatUsd(Math.max(0, cap.costTotalCents - price * seats))}
                </Row>
              </dl>
            </>
          )}

          {/* ─── 11. EL COBRO ───────────────────────────────────────── */}
          {clave === "cobro" && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                El cobro por la app siempre está activo — a ti te llega
                completo, sin gestionar nada. Lo demás lo decides tú.
              </p>
              <div className="grid gap-1.5">
                <div className="flex items-start gap-3 rounded-[14px] border border-ink-900 bg-ink-50 px-4 py-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 border-ink-900 bg-ink-900 text-white"
                  >
                    <Icon name="check" className="size-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">
                      En la app — Yappy o tarjeta, siempre
                    </span>
                    <span className="block text-[12.5px] leading-snug text-ink-500">
                      El pasajero paga al confirmar, el cobro ya está hecho
                      antes de salir, y tu aporte te llega completo — la tarifa
                      la paga él.
                    </span>
                  </span>
                </div>
                {(
                  [
                    [
                      "yappy",
                      "Yappy directo a tu número",
                      "Te lo manda él mismo, el día del viaje.",
                    ],
                    [
                      "efectivo",
                      "Efectivo en la mano",
                      "Como toda la vida. Si prefieres no manejar plata, desmárcalo.",
                    ],
                  ] as const
                ).map(([method, title, body]) => {
                  const active = acceptsOutside.includes(method);
                  return (
                    <button
                      key={method}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setOutsideChoice(
                          active
                            ? acceptsOutside.filter((m) => m !== method)
                            : [...acceptsOutside, method],
                        )
                      }
                      className={`flex items-start gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-ink-900 bg-ink-50"
                          : "border-ink-200 hover:border-accent"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 ${
                          active
                            ? "border-ink-900 bg-ink-900 text-white"
                            : "border-ink-200"
                        }`}
                      >
                        {active && <Icon name="check" className="size-3" />}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-[15px] ${active ? "font-semibold" : ""}`}
                        >
                          {title}
                        </span>
                        <span className="block text-[12.5px] leading-snug text-ink-500">
                          {body}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {acceptsOutside.length === 0 && (
                <p className="mt-2.5 rounded-[14px] bg-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-accent-ink">
                  Solo por la app: nadie te paga en la mano, todo llega cobrado
                  y con comprobante. Los pasajeros lo verán antes de reservar.
                </p>
              )}
            </>
          )}

          {/* ─── 12. REVISAR ────────────────────────────────────────── */}
          {clave === "revisar" && corridor && cap && (
            <>
              <p className="mb-5 text-[14.5px] leading-relaxed text-ink-500">
                Todo en una pantalla. Toca cualquier línea para cambiarla —
                vuelves justo a esa pregunta.
              </p>
              <dl className="overflow-hidden rounded-[14px] border border-ink-200 bg-white">
                <Resumen
                  label="Ruta"
                  valor={`${corridor.origin.shortName} → ${corridor.destination.shortName}`}
                  onEditar={() => irA(P.ruta)}
                />
                <Resumen
                  label="Sales de"
                  valor={origenLabel}
                  onEditar={() => irA(P.salida)}
                />
                <Resumen
                  label="Llegas a"
                  valor={destinoLabel}
                  onEditar={() => irA(P.llegada)}
                />
                <Resumen
                  label="Paradas"
                  valor={
                    dropAnywhere
                      ? "Cualquier punto del camino"
                      : cityStops.length > 0
                        ? innerStops
                            .filter((s) => cityStops.includes(s.citySlug))
                            .map((s) => s.name)
                            .join(", ")
                        : "Sin paradas declaradas"
                  }
                  onEditar={() => irA(P.paradas)}
                />
                <Resumen
                  label="Recoges en"
                  valor={
                    stops.length > 0
                      ? stops.join(", ")
                      : "Donde acuerdes con cada pasajero"
                  }
                  onEditar={() => irA(P.recogida)}
                />
                <Resumen
                  label="Sales"
                  valor={`${formatDayLabel(date)} a las ${hour}`}
                  onEditar={() => irA(P.cuando)}
                />
                <Resumen
                  label="Se repite"
                  valor={
                    {
                      "una-vez": "Solo esta vez",
                      diario: "Cada día",
                      semanal: "Cada semana",
                      mensual: "Cada mes",
                    }[recurrence]
                  }
                  onEditar={() => irA(P.repite)}
                />
                <Resumen
                  label="Puestos"
                  valor={`${seats} ${seats === 1 ? "puesto" : "puestos"}`}
                  onEditar={() => irA(P.puestos)}
                />
                <Resumen
                  label="Carro"
                  valor={
                    activeCar
                      ? `${activeCar.ref.make} ${activeCar.ref.model} ${activeCar.year}`
                      : VEHICLE_LABELS[category]
                  }
                  onEditar={() => irA(P.carro)}
                />
                <Resumen
                  label="Aporte por puesto"
                  valor={`${formatUsd(price)} — tope ${formatUsd(cap.maxPriceCents)}`}
                  onEditar={() => irA(P.aporte)}
                />
                <Resumen
                  label="Aceptas"
                  valor={
                    acceptsOutside.length === 0
                      ? "Solo por la app"
                      : `App${acceptsOutside.includes("yappy") ? ", Yappy directo" : ""}${
                          acceptsOutside.includes("efectivo")
                            ? ", efectivo"
                            : ""
                        }`
                  }
                  onEditar={() => irA(P.cobro)}
                />
              </dl>
            </>
          )}

          {/* ─── LA BARRE DE NAVIGATION ─────────────────────────────── */}
          <div className="mt-6 flex items-center gap-3 border-t border-ink-200 pt-5">
            {paso > 0 && (
              <button
                type="button"
                onClick={() => setPaso((s) => Math.max(0, s - 1))}
                className="rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold transition-[transform,border-color,color] duration-150 hover:border-accent hover:text-accent-ink active:scale-[0.97]"
              >
                Atrás
              </button>
            )}

            {!esUltimo ? (
              <Button
                className="ml-auto"
                disabled={!puedeSeguir[clave]}
                onClick={() => {
                  if (clave === "ruta" && corridor) saveLastSearch({ from, to });
                  setPaso((s) => Math.min(PASOS.length - 1, s + 1));
                }}
              >
                Continuar
              </Button>
            ) : session ? (
              <Button
                className="ml-auto"
                disabled={!puedePublicar || publicando}
                onClick={() => void publicar()}
              >
                {publicando ? "Publicando…" : "Publicar el viaje"}
              </Button>
            ) : (
              <AuthDialog
                trigger={
                  <button className="ml-auto inline-flex items-center justify-center gap-2 rounded-[14px] bg-ink-900 px-5.5 py-3.5 font-display text-[16.5px] font-bold text-white shadow-[0_8px_20px_-8px_rgb(14_42_53/0.5)] transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-ink-800 active:scale-[0.97]">
                    Conectarme y publicar
                  </button>
                }
              />
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[12.5px] leading-relaxed text-ink-500">
          Publicar no te cuesta nada y tu aporte te llega completo — en la mano,
          o por la app si el pasajero eligió pagar en línea (la tarifa de
          servicio la paga él, nunca tú).
        </p>
      </div>
    </Container>
  );
}

function carSelect() {
  return [
    "w-full appearance-none rounded-[14px] border-[1.5px] border-ink-200 bg-white",
    "px-3.5 py-2.5 text-[14.5px] font-semibold text-ink-900 transition-colors",
    "hover:border-accent focus:border-accent focus:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");
}

function pill(active: boolean) {
  return [
    "rounded-[14px] border-[1.5px] px-4 py-2.5 text-[14.5px] font-semibold transition-colors",
    active
      ? "border-ink-900 bg-ink-900 text-white"
      : "border-ink-200 text-ink-500 hover:border-accent hover:text-accent-ink",
  ].join(" ");
}

function Row({
  label,
  children,
  strong = false,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 py-1.5 ${strong ? "border-t border-ink-200 pt-2 font-semibold" : ""}`}
    >
      <dt className={strong ? "text-ink-900" : "text-ink-500"}>{label}</dt>
      <dd className="tnum text-right whitespace-nowrap">{children}</dd>
    </div>
  );
}

/**
 * UNE LIGNE DU RÉCAPITULATIF, ET SON BOUTON « CAMBIAR ».
 *
 * C'est ce qui rend douze écrans supportables : à la fin, on voit tout,
 * et corriger une réponse ramène EXACTEMENT à sa question — pas au début
 * du formulaire. Sans ça, découper aurait ajouté onze allers-retours.
 */
function Resumen({
  label,
  valor,
  onEditar,
}: {
  label: string;
  valor: string;
  onEditar: () => void;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-ink-200 px-4 py-3 last:border-b-0">
      <dt className="w-[38%] shrink-0 text-[12.5px] leading-snug font-semibold text-ink-500">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-[14px] leading-snug text-ink-900">
        {valor || "—"}
      </dd>
      <button
        type="button"
        onClick={onEditar}
        className="shrink-0 text-[12.5px] font-bold text-accent-ink hover:underline"
      >
        Cambiar
      </button>
    </div>
  );
}
