"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { irArriba } from "@/lib/navegar";
import { saveLastSearch } from "@/lib/lastsearch";
import { track } from "@/lib/analytics";
import { registrarBusqueda } from "@/lib/publicar";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { SearchSummary } from "@/components/search/SearchSummary";
import { TripCard } from "@/components/trip/TripCard";
import { AvisameForm } from "@/components/AvisameForm";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { CORRIDORS, ALL_CITIES, corridorsServing } from "@/lib/corridors";
import { searchTrips, formatDayLabel, localIso } from "@/lib/trips";
import { TRIPS_ARE_DEMO } from "@/lib/config";

/**
 * PAGE DE RÉSULTATS — la boucle principale du produit.
 *
 * Elle manquait, et c'est ce qui rendait le site « flou » : on cherchait un
 * trajet et on tombait sur une page d'article. Ici on choisit une personne,
 * une heure et un montant.
 *
 * Depuis les arrêts intermédiaires, la recherche ne regarde plus seulement les
 * corridors dont la paire demandée est l'origine et la destination : elle
 * regarde tous ceux qui PASSENT par les deux villes dans le bon ordre. Une
 * recherche Penonomé → Santiago, qui ne renvoyait rien, remplit maintenant une
 * page avec l'offre qui existait déjà.
 *
 * Trois cas, et aucun n'est une impasse :
 *   · des trajets → la liste ;
 *   · une route ouverte mais rien ce jour-là → les jours voisins ;
 *   · une route inexistante → collecte du signal de demande.
 */

type SortKey = "hora" | "aporte" | "calificacion";

export function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();

  const today = useMemo(() => localIso(), []);
  const criteria = {
    from: params.get("desde") ?? "panama-city",
    to: params.get("hacia") ?? "chitre",
    date: params.get("fecha") ?? today,
    seats: Number(params.get("puestos")) || 1,
  };

  /* L'URL est la vérité de cette page : on la recopie dans la mémoire
     courte pour que l'accueil, /ya et la publication s'ouvrent sur la
     même ruta ensuite. */
  useEffect(() => {
    if (criteria.from !== criteria.to)
      saveLastSearch({
        from: criteria.from,
        to: criteria.to,
        seats: criteria.seats,
        date: criteria.date,
      });
  }, [criteria.from, criteria.to, criteria.seats, criteria.date]);

  const [sort, setSort] = useState<SortKey>("hora");
  const [onlyWomen, setOnlyWomen] = useState(false);
  const [onlyInstant, setOnlyInstant] = useState(false);
  const [onlyDirect, setOnlyDirect] = useState(false);

  /** Les corridors qui traversent les deux villes, dans le bon sens. */
  const serving = useMemo(
    () => corridorsServing(criteria.from, criteria.to),
    [criteria.from, criteria.to],
  );

  /** Le corridor direct s'il existe, sinon le plus long qui passe par là :
   *  c'est celui dont la page a le plus de chances d'être utile. */
  const corridor = useMemo(
    () =>
      CORRIDORS.find(
        (c) =>
          c.origin.slug === criteria.from && c.destination.slug === criteria.to,
      ) ?? serving[0],
    [criteria.from, criteria.to, serving],
  );

  const matches = useMemo(
    () =>
      searchTrips(criteria.from, criteria.to, criteria.date, criteria.seats),
    [criteria.from, criteria.to, criteria.date, criteria.seats],
  );

  const hasPartial = matches.some((m) => m.isPartial);
  /** Le filtre « part vraiment d'ici » n'a de sens que s'il reste quelque
   *  chose après. Le proposer quand tous les trajets sont de passage donnerait
   *  un bouton qui vide la page — un filtre qui ne filtre rien d'utile. */
  const canFilterDirect = hasPartial && matches.some((m) => !m.isPartial);

  /* La mesure : une recherche faite, et si elle est revenue vide. Une
     ruta très cherchée et toujours vide, c'est un conducteur qui manque
     — c'est le chiffre le plus actionnable du tableau de bord. */
  useEffect(() => {
    if (criteria.from === criteria.to) return;
    const context = {
      origin_slug: criteria.from,
      destination_slug: criteria.to,
      props: { puestos: criteria.seats, fecha: criteria.date },
    };
    track("busqueda_hecha", context);
    if (matches.length === 0) track("busqueda_vacia", context);
    /* LA SEÑAL DE DEMANDA. `events` mesure le produit ; `demand_signals`
       mesure le MARCHÉ — et c'est elle qu'on montre au conducteur au
       moment de publier (« 12 búsquedas de esta ruta »). La table
       existait depuis le premier jour avec zéro ligne, parce que
       personne ne l'écrivait. C'est ici que ça se répare : le seul
       endroit où quelqu'un exprime vraiment un besoin de trajet. */
    registrarBusqueda({
      from: criteria.from,
      to: criteria.to,
      date: criteria.date,
      seats: criteria.seats,
      resultados: matches.length,
    });
  }, [
    criteria.from,
    criteria.to,
    criteria.date,
    criteria.seats,
    matches.length,
  ]);

  const visible = useMemo(() => {
    const filtered = matches.filter(
      ({ trip, isPartial }) =>
        (!onlyWomen || trip.womenOnly) &&
        (!onlyInstant || trip.instantBooking) &&
        (!onlyDirect || !isPartial),
    );
    const sorted = [...filtered];
    if (sort === "aporte") sorted.sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "calificacion")
      sorted.sort((a, b) => b.trip.driver.rating - a.trip.driver.rating);
    return sorted;
  }, [matches, sort, onlyWomen, onlyInstant, onlyDirect]);

  /** Jours voisins qui, eux, ont des trajets. */
  const nearbyDays = useMemo(() => {
    if (serving.length === 0) return [];
    return [-2, -1, 1, 2, 3]
      .map((offset) => {
        const d = new Date(`${criteria.date}T12:00:00`);
        d.setDate(d.getDate() + offset);
        const iso = localIso(d);
        if (iso < today) return null;
        const count = searchTrips(
          criteria.from,
          criteria.to,
          iso,
          criteria.seats,
        ).length;
        return count > 0 ? { date: iso, count } : null;
      })
      .filter((v): v is { date: string; count: number } => v !== null)
      .slice(0, 3);
  }, [
    serving,
    criteria.from,
    criteria.to,
    criteria.date,
    criteria.seats,
    today,
  ]);

  function apply(next: typeof criteria) {
    const q = new URLSearchParams({
      desde: next.from,
      hacia: next.to,
      fecha: next.date,
      puestos: String(next.seats),
    });
    irArriba();
    router.push(`/buscar?${q}`);
  }

  const fromCity = ALL_CITIES.find((c) => c.slug === criteria.from);
  const toCity = ALL_CITIES.find((c) => c.slug === criteria.to);

  return (
    <>
      {/* Le résumé flotte SOUS la barre de navigation, dans le même système :
          une vitre détachée, les résultats défilent derrière. `--nav-space`
          et non une constante — l'ancien `top-[57px]` datait de la barre
          collée au bord et faisait glisser le résumé sous la pilule. */}
      <div className="sticky top-[calc(var(--nav-space)-0.25rem)] z-30 py-1.5">
        <Container>
          <SearchSummary criteria={criteria} onApply={apply} />
        </Container>
      </div>

      <Container className="pt-6">
        {TRIPS_ARE_DEMO && (
          <p className="mb-4 flex items-start gap-2.5 rounded-[14px] border border-ink-200 bg-white px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
            <Icon name="bell" className="mt-0.5 size-4 shrink-0" />
            <span>
              <b className="font-semibold text-ink-900">Viajes de ejemplo.</b>{" "}
              Todavía no hay conductores publicando, así que estos los
              generamos nosotros para que puedas recorrer la app. Tu cuenta,
              en cambio, es de verdad — y el cálculo del aporte, las reglas y
              los desvíos funcionan igual que el primer día real.
            </span>
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[19px] font-bold tracking-[-0.02em]">
              {serving.length > 0
                ? `${visible.length} ${visible.length === 1 ? "viaje" : "viajes"} · ${formatDayLabel(criteria.date)}`
                : "Sin resultados"}
            </h1>
            {hasPartial && (
              <p className="mt-0.5 text-[13.5px] text-ink-500">
                Incluye conductores que pasan por {toCity?.shortName} camino a
                otro lado.
              </p>
            )}
          </div>

          {matches.length > 0 && (
            <label className="flex items-center gap-2 text-[13.5px] text-ink-500">
              Ordenar por
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="cursor-pointer rounded-[10px] border border-ink-200 bg-white px-2.5 py-1.5 font-semibold text-ink-900 focus:border-accent focus:outline-none"
              >
                <option value="hora">Hora de salida</option>
                <option value="aporte">Aporte más bajo</option>
                <option value="calificacion">Mejor calificación</option>
              </select>
            </label>
          )}
        </div>

        {matches.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <Filter
              active={onlyInstant}
              onClick={() => setOnlyInstant((v) => !v)}
            >
              Reserva al instante
            </Filter>
            <Filter active={onlyWomen} onClick={() => setOnlyWomen((v) => !v)}>
              Solo mujeres
            </Filter>
            {canFilterDirect && (
              <Filter
                active={onlyDirect}
                onClick={() => setOnlyDirect((v) => !v)}
              >
                Sale de {fromCity?.shortName}
              </Filter>
            )}
          </div>
        )}

        {visible.length > 0 ? (
          <ul className="grid gap-3">
            {visible.map((match) => (
              <li key={`${match.trip.id}-${match.segment.fromIndex}`}>
                <TripCard match={match} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[20px] border border-ink-200 bg-white p-6">
            <h2 className="mb-2 font-display text-[19px] font-bold">
              {serving.length > 0
                ? "Nadie pasa por ahí ese día"
                : "Todavía no abrimos esa ruta"}
            </h2>
            <p className="mb-5 max-w-[54ch] text-[15px] leading-relaxed text-ink-500">
              {serving.length > 0
                ? "Los viajes se publican sobre la marcha, casi siempre con dos o tres días de anticipación. Déjanos tu número y te escribimos apenas alguien publique."
                : `Guardamos tu búsqueda de ${fromCity?.shortName} a ${toCity?.shortName}. Cuando varias personas piden la misma ruta, es la próxima que abrimos.`}
            </p>

            {nearbyDays.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 text-[13.5px] font-semibold text-ink-900">
                  Sí hay viajes estos días:
                </p>
                <div className="flex flex-wrap gap-2">
                  {nearbyDays.map((day) => (
                    <button
                      key={day.date}
                      onClick={() => apply({ ...criteria, date: day.date })}
                      className="rounded-[14px] border border-ink-200 px-3.5 py-2 text-[13.5px] font-semibold transition-colors hover:border-accent hover:text-accent-ink"
                    >
                      {formatDayLabel(day.date)} · {day.count}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AvisameForm
              originSlug={criteria.from}
              destinationSlug={criteria.to}
              corridorSlug={corridor?.slug}
              requestedDate={criteria.date}
              seats={criteria.seats}
              source="buscar"
            />
          </div>
        )}

        {corridor && (
          <div className="mt-8 rounded-[20px] border border-ink-200 bg-white p-5">
            <h2 className="mb-1.5 font-display text-[17px] font-bold">
              ¿Vas manejando por esta ruta?
            </h2>
            <p className="mb-4 max-w-[52ch] text-[14.5px] leading-relaxed text-ink-500">
              Hay gente buscando {fromCity?.shortName} → {toCity?.shortName}{" "}
              justo ahora. Si ese tramo te queda de paso, márcalo como parada al
              publicar y tu viaje aparece también en esta búsqueda.
            </p>
            <ButtonLink href={`/publicar/nuevo?ruta=${corridor.slug}`}>
              Publicar mi viaje
            </ButtonLink>
          </div>
        )}

        {corridor && (
          <p className="mt-6 text-center text-[13.5px] text-ink-500">
            ¿Quieres saber más de esta ruta?{" "}
            <Link
              href={`/viajes/${corridor.slug}`}
              className="font-semibold text-accent-ink hover:underline"
            >
              Puntos de recogida, tiempos y cómo se calcula el aporte
            </Link>
          </p>
        )}
      </Container>
    </>
  );
}

function Filter({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border-[1.5px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
        active
          ? "border-ink-900 bg-ink-900 text-white"
          : "border-ink-200 bg-white text-ink-500 hover:border-accent hover:text-accent-ink"
      }`}
    >
      {children}
    </button>
  );
}
