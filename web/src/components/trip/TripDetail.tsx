"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BookingPanel } from "@/components/trip/BookingPanel";
import { EnRuta } from "@/components/trip/EnRuta";
import { track } from "@/lib/analytics";
import type { Corridor } from "@/lib/corridors";
import { formatDuration, formatUsd } from "@/lib/pricing";
import { findSegment, segmentCap } from "@/lib/segments";
import { routePoints } from "@/lib/desvio";
import {
  formatDayLabel,
  formatTime,
  fullMatch,
  matchFor,
  type Trip,
  type TripMatch,
} from "@/lib/trips";

/**
 * PAGE DU TRAJET, VUE PAR SEGMENT
 *
 * Un même trajet se lit différemment selon d'où l'on vient. Celui qui cherche
 * Penonomé → Santiago ne veut pas voir « Panamá → David » en titre : il veut
 * savoir à quelle heure on passe le prendre, où on le laisse, et combien il
 * donne pour CES kilomètres-là.
 *
 * Mais il doit aussi voir le trajet complet — c'est ce qui rend l'horaire
 * crédible et permet de juger d'un retard possible. On affiche donc tout
 * l'itinéraire, avec la portion réservée en évidence et le reste en retrait.
 *
 * Le segment vient de l'URL (`?desde=&hacia=`). Sans paramètres, ou avec des
 * villes que ce conducteur ne dessert pas, on retombe sur le trajet complet :
 * un lien partagé ou tronqué ne doit jamais mener à une page cassée.
 */
export function TripDetail({
  trip,
  corridor,
  children,
}: {
  trip: Trip;
  corridor: Corridor;
  /** La fiche du conducteur, rendue côté serveur. */
  children: React.ReactNode;
}) {
  const params = useSearchParams();
  const requested = findSegment(
    trip.servedStops,
    params.get("desde") ?? "",
    params.get("hacia") ?? "",
  );

  const match: TripMatch | null =
    (requested && matchFor(trip, requested)) ?? fullMatch(trip);

  /* La mesure, AVANT le retour anticipé : un hook qui ne s'exécute pas
     toujours est un hook cassé. */
  const seenFrom = match?.segment.from.citySlug;
  const seenTo = match?.segment.to.citySlug;
  useEffect(() => {
    if (!seenFrom || !seenTo) return;
    track("viaje_visto", {
      origin_slug: seenFrom,
      destination_slug: seenTo,
      props: { viaje: trip.id },
    });
  }, [trip.id, seenFrom, seenTo]);

  if (!match) return null;

  const { segment } = match;
  const date = trip.departureAt.slice(0, 10);
  const cap = segmentCap(segment, trip.vehicle.ratePerKmCents, trip.seatsOffered);
  const durationMin = Math.round(
    (new Date(match.droppingAt).getTime() -
      new Date(match.boardingAt).getTime()) /
      60_000,
  );

  return (
    <div className="grid gap-5 min-[900px]:grid-cols-[1.35fr_1fr] min-[900px]:items-start">
      <div className="grid gap-5">
        {/* MONTER EN COURS DE ROUTE — EN PREMIER, ET C'EST VOULU.
            C'est l'information qui change la façon dont tout le reste se
            lit : l'heure du point n'est pas une heure de départ, c'est un
            passage. Placée en bas de page, elle serait lue après la
            décision — donc jamais. Elle disparaît d'elle-même quand le
            passager monte là où le conducteur démarre. */}
        <EnRuta match={match} />

        {/* --- Itinéraire --- */}
        <section className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6">
          <p className="mb-1 text-[11.5px] font-bold tracking-[0.14em] text-ink-500 uppercase">
            {formatDayLabel(date)}
          </p>
          <h1 className="mb-1 font-display text-[clamp(24px,4.6vw,32px)] leading-tight font-extrabold tracking-[-0.035em]">
            {segment.from.name} → {segment.to.name}
          </h1>
          <p className="tnum mb-5 text-[14.5px] text-ink-500">
            {segment.km} km · {formatDuration(durationMin)} de camino
            {match.isPartial && (
              <>
                {" "}
                · tramo de un viaje {trip.servedStops[0].name} →{" "}
                {trip.servedStops[trip.servedStops.length - 1].name}
              </>
            )}
          </p>

          <ol className="relative">
            <span
              aria-hidden
              className="absolute top-4 bottom-4 left-[62px] w-0.5 rounded-full bg-ink-200 sm:left-[70px]"
            />
            {trip.servedStops.map((stop, index) => {
              const inSegment =
                index >= segment.fromIndex && index <= segment.toIndex;
              const isBoarding = index === segment.fromIndex;
              const isDropping = index === segment.toIndex;

              const passesAt = timeAt(trip, corridor, stop.km);
              return (
                <Stop
                  key={stop.citySlug}
                  time={formatTime(passesAt)}
                  nextDay={crossesMidnight(trip.departureAt, passesAt)}
                  title={stop.name}
                  detail={
                    isBoarding
                      ? index === 0
                        ? `Salida · ${trip.stops[0] ?? "punto por confirmar"}`
                        : "Aquí te recoge"
                      : isDropping
                        ? index === trip.servedStops.length - 1
                          ? "Llegada estimada"
                          : "Aquí te bajas"
                        : inSegment
                          ? "Parada en el camino"
                          : "Pasa por aquí sin ti"
                  }
                  tone={
                    isBoarding
                      ? "start"
                      : isDropping
                        ? "end"
                        : inSegment
                          ? "on"
                          : "off"
                  }
                />
              );
            })}
          </ol>
        </section>

        {children}

        {/* --- Comment se calcule le montant --- */}
        <section className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 font-display text-[19px] font-bold">
            De dónde sale ese monto
          </h2>
          <dl className="text-[14.5px]">
            <Row
              label={
                segment.tollCents > 0
                  ? `${segment.km} km de recorrido, más peajes`
                  : `${segment.km} km de recorrido, sin peajes en ese tramo`
              }
            >
              {formatUsd(cap.costTotalCents)}
            </Row>
            <Row label={`Entre ${cap.occupants} ocupantes, con el conductor`}>
              {formatUsd(cap.maxPriceCents)}
            </Row>
            <Row label="Tope de la plataforma" strong>
              {formatUsd(cap.maxPriceCents)}
            </Row>
            <Row label={`${trip.driver.firstName} pide`} strong>
              {formatUsd(match.priceCents)}
            </Row>
          </dl>
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-500">
            {match.isPartial
              ? `Pagas los kilómetros que viajas, no el viaje completo de ${trip.driver.firstName}. `
              : ""}
            {trip.driver.firstName} no gana plata con este viaje. El monto cubre
            gasolina y peajes, y la app lo limita para que así sea.
          </p>
        </section>
      </div>

      <BookingPanel
        /* La clé purge l'état du panneau (place choisie, « confirmé »,
           offre) quand on change de viaje OU de segment : en navigation
           SPA, React réutiliserait l'instance et l'état suivrait — le
           même mal que le formulaire de publication. */
        key={`${trip.id}-${segment.fromIndex}-${segment.toIndex}`}
        tripId={trip.id}
        initialPoint={params.get("punto") ?? ""}
        fromSlug={segment.from.citySlug}
        toSlug={segment.to.citySlug}
        boardingAt={match.boardingAt}
        driverName={trip.driver.firstName}
        priceCents={match.priceCents}
        seatsLeft={match.seatsFree}
        // Les points de rendez-vous sont ceux de la ville où l'on monte. Au
        // départ, ce sont ceux que le conducteur a déclarés ; en cours de
        // route, ceux de la ville — proposer Costa del Este à quelqu'un qui
        // monte à Penonomé n'a aucun sens.
        citySlug={segment.from.citySlug}
        baseKm={segment.km}
        tollCents={segment.tollCents}
        category={trip.vehicle.ratePerKmCents}
        seatsOffered={trip.seatsOffered}
        instantBooking={trip.instantBooking}
        flexibleStops={trip.flexibleStops}
        /* Le tracé complet du conducteur : le détour se mesure par rapport
           au CHEMIN, pas par rapport à la ville où l'on monte. */
        route={routePoints(trip.servedStops.map((s) => s.citySlug))}
      />
    </div>
  );
}

/** Vrai quand l'heure de passage tombe le LENDEMAIN du départ (viajes de
 *  nuit) : sans le marqueur « +1 », un 00:45 sous un 23:15 se lit comme
 *  la veille et l'horaire paraît cassé. Comparaison en heure LOCALE. */
function crossesMidnight(departureAt: string, at: string): boolean {
  return (
    new Date(at).toDateString() !== new Date(departureAt).toDateString()
  );
}

/** Heure de passage à un kilomètre du corridor — même règle que la recherche. */
function timeAt(trip: Trip, corridor: Corridor, km: number): string {
  const minutes = Math.round(
    (km / corridor.distanceKm) * corridor.typicalDurationMin,
  );
  return new Date(
    new Date(trip.departureAt).getTime() + minutes * 60_000,
  ).toISOString();
}

function Stop({
  time,
  nextDay = false,
  title,
  detail,
  tone,
}: {
  time: string;
  /** L'heure tombe le lendemain du départ — viaje de nuit. */
  nextDay?: boolean;
  title: string;
  detail: string;
  tone: "start" | "end" | "on" | "off";
}) {
  // Les arrêts hors du segment réservé s'effacent : ils expliquent l'horaire
  // sans se disputer l'attention avec la montée et la descente, les deux
  // seules lignes que le passager doit retenir.
  //
  // Effacer par la COULEUR et non par l'opacité : un `opacity-55` sur un texte
  // déjà secondaire le fait tomber sous le contraste AA, et axe le signalait.
  // Un ton du nuancier reste sous contrôle.
  const off = tone === "off";
  const dot = {
    start: "bg-accent",
    end: "bg-brand-green-deep",
    on: "bg-ink-300",
    off: "bg-ink-200",
  }[tone];

  return (
    <li className="flex gap-4">
      <span
        className={`tnum w-[50px] shrink-0 pt-0.5 text-right font-display text-[16.5px] font-bold sm:w-[58px] ${
          off ? "text-ink-500" : ""
        }`}
      >
        {time}
        {nextDay && (
          <span className="block text-[10px] leading-none font-bold tracking-[0.08em] text-ink-400 uppercase">
            +1 día
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={`relative z-[1] mt-1.5 size-3.5 shrink-0 rounded-full border-[3px] border-white ${dot}`}
      />
      <span className="min-w-0 flex-1 pb-3">
        <span
          className={`block font-display text-[16.5px] ${
            off ? "font-semibold text-ink-500" : "font-bold"
          }`}
        >
          {title}
        </span>
        <span className="block text-[13.5px] text-ink-500">{detail}</span>
      </span>
    </li>
  );
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
      className={`flex justify-between gap-4 py-2 ${strong ? "border-t border-ink-200 font-semibold" : ""}`}
    >
      <dt className={strong ? "text-ink-900" : "text-ink-500"}>{label}</dt>
      <dd className="tnum text-right whitespace-nowrap">{children}</dd>
    </div>
  );
}
