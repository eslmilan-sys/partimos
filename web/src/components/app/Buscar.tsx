"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { deParams } from "@/lib/place";
import { Estrella, BadgeTop } from "@/components/ui/Reputacion";
import { bonusReputacion } from "@/lib/conductor";
import { Icon } from "@/components/ui/Icon";
import { EnRuta } from "@/components/trip/EnRuta";
import { ALL_CITIES } from "@/lib/corridors";
import {
  formatDayLabel,
  formatTime,
  localIso,
  searchTrips,
  type TripMatch,
} from "@/lib/trips";
import { formatUsd } from "@/lib/pricing";

/**
 * BUSCAR — les résultats, d'après la maquette du propriétaire.
 *
 * Il lit les mêmes données que la page du site (`searchTrips`) : une
 * seule source, deux présentations. Dupliquer la recherche aurait
 * dupliqué l'inventaire par tronçon, qui est la partie la plus délicate
 * du produit — une place vendue jusqu'à Santiago se libère après
 * Santiago, et personne ne veut deux implémentations de ça.
 *
 * Ce que la carte de résultat montre, et pourquoi :
 *   · l'HEURE en premier — c'est le critère qui tranche ;
 *   · le CONDUCTEUR avec sa note et son badge vérifié : on monte dans la
 *     voiture de quelqu'un, pas dans un véhicule ;
 *   · la TIMELINE des arrêts, parce que « directo » ou « avec una parada »
 *     change le trajet vécu ;
 *   · l'APORTE par puesto, jamais un total — c'est l'unité du produit.
 *
 * Le tri « más barato » existe, mais AUCUN tri ne fait monter un prix :
 * l'aporte sort de la distance et du carro, jamais de la demande.
 */

const nombreCorto = (slug: string) =>
  ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;

type Orden = "coincidencia" | "barato" | "temprano" | "valoracion";

const ORDENES: { id: Orden; label: string }[] = [
  { id: "coincidencia", label: "Mejor coincidencia" },
  { id: "barato", label: "Menor aporte" },
  { id: "temprano", label: "Más temprano" },
  { id: "valoracion", label: "Mejor valoración" },
];


/** Une carte de résultat. */
function Tarjeta({ m }: { m: TripMatch }) {
  const t = m.trip;
  /* Les arrêts RÉELLEMENT traversés par ce passager : la tranche de
     `servedStops` entre sa montée et sa descente. Le segment ne porte
     que ses deux extrémités et leurs index — c'est ici qu'on retrouve ce
     qu'il y a au milieu. */
  const paradas = t.servedStops.slice(
    m.segment.fromIndex,
    m.segment.toIndex + 1,
  );
  /* « SIN PARADAS » ET NON « DIRECTO ».
     Le mot disait vrai — aucun arrêt entre la montée et la descente,
     donc un trajet plus court vécu — et il MENTAIT quand même. Posé
     juste au-dessus de « viene desde Panamá », « Directo » se lit comme
     « le conducteur part d'ici », c'est-à-dire l'exact contraire. Deux
     lignes qui se contredisent dans la même carte font douter des deux.
     « Sin paradas en tu tramo » dit la même chose sans promettre un
     départ qui n'existe pas. */
  const sinParadas = paradas.length <= 2;

  return (
    <li>
      <Link
        href={`/viaje/${t.id}?desde=${m.segment.from.citySlug}&hacia=${m.segment.to.citySlug}`}
        className="block rounded-[18px] border border-ink-200 bg-white p-4 transition-colors hover:border-naranja"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="tnum font-display text-[15.5px] font-bold text-naranja">
            {formatTime(m.boardingAt)}
          </span>
          <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11.5px] font-bold text-ink-600">
            {m.seatsFree} {m.seatsFree === 1 ? "puesto" : "puestos"}
          </span>
        </div>

        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[17px] leading-tight font-bold">
              {nombreCorto(m.segment.from.citySlug)} → {nombreCorto(m.segment.to.citySlug)}
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              {sinParadas
                ? "Sin paradas en tu tramo"
                : paradas.length === 3
                  ? "1 parada intermedia"
                  : `${paradas.length - 2} paradas intermedias`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="tnum font-display text-[21px] leading-none font-extrabold">
              {formatUsd(m.priceCents)}
            </p>
            <p className="text-[11.5px] text-ink-500">por puesto</p>
          </div>
        </div>

        {/* LE CONDUCTEUR — aucune photo n'est inventée : l'initiale. */}
        <div className="mt-3 flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-verde-perfil font-display text-[14px] font-bold text-white">
            {t.driver.initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold">
              {t.driver.firstName} {t.driver.lastInitial}.
            </span>
            <span className="flex items-center gap-1 text-[12px] text-ink-500">
              <Estrella className="size-[13px] text-ambar-fuerte" />
              <span className="tnum">{t.driver.rating.toFixed(1)}</span>
              <span>({t.driver.ridesCount})</span>
            </span>
          </span>
          {/* SEUL « TOP » RESTE SUR LA CARTE, parce que lui SE MÉRITE et
              se perd (voir lib/conductor.ts). « Verificado » ne
              distinguait personne : tout le monde l'est, sinon on ne
              publie pas. Il est monté en tête de liste, où une garantie
              collective a sa place. */}
          <BadgeTop conductor={t.driver} />
        </div>

        {/* MONTER EN COURS DE ROUTE. Sans cette ligne, l'heure de la
            carte se lit comme une heure de départ, et quelqu'un attend
            pour rien au bord de la route. */}
        {m.segment.fromIndex > 0 && (
          <div className="mt-3 border-t border-ink-100 pt-3">
            <EnRuta match={m} variante="linea" />
          </div>
        )}

        {/* LA TIMELINE des arrêts servis. */}
        <ul className="mt-3 grid gap-1.5 border-t border-ink-100 pt-3">
          {paradas.map((p, i) => (
            <li key={p.citySlug} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`size-[7px] shrink-0 rounded-full ${
                  i === 0
                    ? "bg-verde-ok"
                    : i === paradas.length - 1
                      ? "bg-naranja"
                      : "bg-ink-300"
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-600">
                {nombreCorto(p.citySlug)}
              </span>
            </li>
          ))}
        </ul>

        {/* LE VÉHICULE, en chips — ce qui décide si la maleta rentre. */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-ink-50 px-2.5 py-1 text-[11.5px] text-ink-600">
            {t.vehicle.make} {t.vehicle.model}
          </span>
          <span className="rounded-full bg-ink-50 px-2.5 py-1 text-[11.5px] text-ink-600">
            {t.vehicle.year}
          </span>
          {t.instantBooking && (
            <span className="rounded-full bg-naranja-suave px-2.5 py-1 text-[11.5px] font-semibold text-naranja">
              Reserva al instante
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

export function Buscar() {
  const router = useRouter();
  const params = useSearchParams();

  const desde = params.get("desde") ?? "panama-city";
  const hacia = params.get("hacia") ?? "";
  /* LES LIEUX CHOISIS, relus depuis l'URL. Le matching se fait toujours
     sur la ville — c'est elle que le moteur comprend — mais l'en-tête
     doit dire ce que la personne a demandé. Sans ça, on cherche
     « Multiplaza » et la page de résultats titre « Panamá » : elle a
     l'air de ne pas avoir compris. */
  const lugarDesde = deParams(params, "o");
  const lugarHacia = deParams(params, "d");
  const fecha = params.get("fecha") ?? localIso();
  const puestos = Number(params.get("puestos") ?? "1");

  const [orden, setOrden] = useState<Orden>("coincidencia");
  /* LE FILTRE « IDENTIDAD VERIFICADA » A ÉTÉ RETIRÉ, et c'est une
     correction, pas une simplification. Publier exige déjà cédula et
     licencia vérifiées : le filtre ne retirait donc jamais une seule
     carte. Un filtre qui ne filtre rien est pire qu'inutile — il laisse
     croire que la liste contient des conducteurs non vérifiés, c'est-à-
     dire exactement le contraire de ce qui est vrai. La garantie est
     maintenant ÉCRITE une fois, en tête de liste. */
  const [soloDirectos, setSoloDirectos] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const matches = useMemo(
    () => (hacia ? searchTrips(desde, hacia, fecha, puestos) : []),
    [desde, hacia, fecha, puestos],
  );

  const visibles = useMemo(() => {
    let v = matches;
    if (soloDirectos)
      v = v.filter((m) => m.segment.toIndex - m.segment.fromIndex === 1);
    const copia = [...v];
    switch (orden) {
      case "barato":
        return copia.sort((a, b) => a.priceCents - b.priceCents);
      case "temprano":
        return copia.sort((a, b) => a.boardingAt.localeCompare(b.boardingAt));
      case "valoracion":
        return copia.sort((a, b) => b.trip.driver.rating - a.trip.driver.rating);
      default:
        /* « COINCIDENCIA » MET EN AVANT LES MEILLEURS CONDUCTEURS, sans
           renverser la pertinence. Le bonus de réputation s'ajoute à
           l'ordre de départ, il ne le remplace pas : un top conductor à
           18 h ne doit pas passer devant un viaje ordinaire à 8 h quand
           on cherche le matin. Voir lib/conductor.ts, où le poids est
           borné et testé — y compris la règle qui protège les nouveaux
           d'être enterrés. */
        return copia.sort(
          (a, b) => bonusReputacion(b.trip.driver) - bonusReputacion(a.trip.driver),
        );
    }
  }, [matches, orden, soloDirectos]);

  return (
    <div className="mx-auto w-full max-w-[520px]">
      {/* EN-TÊTE — d'où à où, quand, et de quoi corriger sans repartir. */}
      <header /* EN VERRE, et pas seulement pour l'effet : les résultats
              défilent DESSOUS, et les voir passer derrière la vitre est
              ce qui dit que la liste continue. Un bandeau opaque, lui,
              se lit comme le bord de l'écran. */
            className="glass sticky top-0 z-30 rounded-b-[20px] px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-2.5">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100"
          >
            <Icon name="arrowRight" className="size-5 rotate-180" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[17px] leading-tight font-bold">
              {lugarDesde?.nombre ?? nombreCorto(desde)} →{" "}
              {lugarHacia?.nombre ?? (hacia ? nombreCorto(hacia) : "…")}
            </p>
            {/* LA VILLE EN DESSOUS, quand un lieu précis a été choisi :
                on ne cache pas d'où part réellement le viaje, on arrête
                juste de le faire passer pour ce qui a été demandé. */}
            {(lugarDesde || lugarHacia) && (
              <p className="truncate text-[12px] leading-tight text-ink-400">
                {nombreCorto(desde)} → {hacia ? nombreCorto(hacia) : "…"}
              </p>
            )}
            <p className="truncate text-[12.5px] text-ink-500">
              {formatDayLabel(fecha)} · {puestos}{" "}
              {puestos === 1 ? "pasajero" : "pasajeros"}
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 pt-1 text-[13.5px] font-semibold text-naranja hover:underline"
          >
            Editar
          </Link>
        </div>

        {/* FILTRES ET TRI */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setFiltrosAbiertos((v) => !v)}
            aria-expanded={filtrosAbiertos}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              soloDirectos
                ? "border-naranja bg-naranja-suave text-naranja"
                : "border-ink-200 bg-white text-ink-600"
            }`}
          >
            <Icon name="swap" className="size-[15px]" />
            Filtros
            {soloDirectos && <span className="tnum">1</span>}
          </button>

          {/* LE TRI. Le `select` est un vrai `select` — sur téléphone il
              ouvre la roue native, qu'aucun menu maison n'égale — mais il
              est posé TRANSPARENT par-dessus la pastille, et c'est nous
              qui dessinons l'étiquette et le chevron. `appearance: none`
              ne suffisait pas : Chromium continuait de peindre sa flèche
              par-dessus le texte, en plein milieu du mot. */}
          <label className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-600">
            <span className="sr-only">Ordenar por</span>
            <span aria-hidden className="whitespace-nowrap">
              {ORDENES.find((o) => o.id === orden)?.label}
            </span>
            <Icon name="chevronDown" className="size-[15px] shrink-0 text-ink-400" />
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              {ORDENES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {/* LA VUE CARTE A ÉTÉ RETIRÉE, sur demande explicite et répétée
              du propriétaire (« la mapo franchement tu peux l'enlever »,
              puis « delete opcion search in map, everywhere »).

              Elle promettait plus qu'elle ne tenait : sans tracé réel
              des routes, elle montrait des points reliés en ligne
              droite — donc « par où on passe » était une invention. Une
              carte qui ment sur l'itinéraire est pire qu'une liste
              honnête, surtout sur un produit où le passager décide de
              monter dans la voiture d'un inconnu à partir de ce qu'il
              voit à l'écran. */}
        </div>

        {filtrosAbiertos && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSoloDirectos((v) => !v)}
              aria-pressed={soloDirectos}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                soloDirectos
                  ? "border-naranja bg-naranja text-white"
                  : "border-ink-200 bg-white text-ink-600"
              }`}
            >
              Sin paradas intermedias
            </button>
          </div>
        )}
      </header>

      <div className="px-4 pt-3 pb-4">
        {/* LE BANDEAU DE RÉSULTAT — il compte, il ne se félicite pas. */}
        <div className="mb-3 rounded-[16px] bg-verde-suave px-4 py-3">
          <p className="font-display text-[15.5px] font-bold text-verde-ok">
            {visibles.length}{" "}
            {visibles.length === 1 ? "viaje disponible" : "viajes disponibles"}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-ink-600">
            El aporte por puesto sale de la distancia y del carro. No cambia con
            la hora ni con la fecha.
          </p>
          {/* LA GARANTIE, DITE UNE FOIS ET POUR TOUTE LA LISTE.
              Elle était une pastille « Verificado » sur chaque carte, ce
              qui laissait entendre qu'il pouvait y en avoir sans. Il ne
              peut pas y en avoir sans : publier exige cédula et licencia
              vérifiées. Une garantie qui vaut pour tout le monde
              s'annonce en haut ; répétée sur chaque ligne, elle se lit
              comme une distinction et sème le doute sur les autres. */}
          {visibles.length > 0 && (
            <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-snug font-semibold text-verde-ok">
              <Icon name="shield" className="mt-px size-3.5 shrink-0" />
              Todos con cédula y licencia verificadas — sin eso no se puede
              publicar.
            </p>
          )}
        </div>

        {visibles.length === 0 ? (
          <div className="rounded-[18px] border border-ink-200 bg-white px-5 py-8 text-center">
            <p className="font-display text-[16.5px] font-bold">
              Nadie va por ahí ese día
            </p>
            <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-500">
              {matches.length > 0
                ? "Con esos filtros no queda ninguno. Quita uno y vuelve a mirar."
                : "Prueba otra fecha, o avísanos y le decimos a los conductores que hay demanda en esta ruta."}
            </p>
            <Link
              href="/ya"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-naranja px-5 py-2.5 text-[14px] font-bold text-white"
            >
              Ver otras fechas
            </Link>
          </div>
        ) : (
          <ul className="grid gap-2.5">
            {visibles.map((m) => (
              <Tarjeta key={`${m.trip.id}-${m.segment.from.citySlug}-${m.segment.to.citySlug}`} m={m} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
