import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import { formatUsd, formatDuration } from "@/lib/pricing";
import { getCorridor } from "@/lib/corridors";
import { formatTime, type TripMatch } from "@/lib/trips";
import { esTopConductor } from "@/lib/conductor";
import { EnRuta } from "./EnRuta";

/**
 * Carte de trajet.
 *
 * La colonne de gauche est une échelle de temps : heure de départ, durée,
 * heure d'arrivée, reliées par un trait. On lit « quand je pars, quand
 * j'arrive » d'un seul coup d'œil, avant même le prix — c'est l'ordre dans
 * lequel on décide.
 *
 * Le prix est en gras à droite, aligné en chiffres tabulaires pour que les
 * montants se comparent verticalement d'une carte à l'autre.
 *
 * La carte affiche un SEGMENT, pas un trajet : les villes, les heures, le
 * montant et les places sont ceux du bout de route que le passager demande.
 * Quand le conducteur va plus loin ou vient de plus loin, on le dit en une
 * ligne — c'est rassurant plutôt que déroutant, à condition de l'écrire.
 */
export function TripCard({ match }: { match: TripMatch }) {
  const { trip, segment } = match;
  const corridor = getCorridor(trip.corridorSlug);
  if (!corridor) return null;

  const durationMin = Math.round(
    (new Date(match.droppingAt).getTime() -
      new Date(match.boardingAt).getTime()) /
      60_000,
  );

  const comesFrom = segment.fromIndex > 0;
  const goesOn = segment.toIndex < trip.servedStops.length - 1;
  const last = trip.servedStops[trip.servedStops.length - 1];

  /* CE QUI RESTE DANS CETTE LIGNE. L'amont — « viene desde X » — a été
     retiré d'ici : dire d'où vient le carro sans dire QUAND il passe
     donnait la moitié de l'information, celle qui inquiète sans aider.
     `<EnRuta variante="linea">` porte les deux, juste en dessous. Ici il
     ne reste que l'aval, qui n'a aucune conséquence pour le passager —
     c'est juste bon à savoir. */
  const context = goesOn ? `sigue hasta ${last.name}` : "";

  return (
    <Link
      href={`/viaje/${trip.id}?desde=${segment.from.citySlug}&hacia=${segment.to.citySlug}`}
      className="group block rounded-[20px] border border-ink-200 bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-card sm:p-5"
    >
      <div className="flex gap-4">
        {/* Échelle de temps */}
        <div className="flex shrink-0 flex-col items-center pt-1">
          <span className="tnum font-display text-[17px] font-bold">
            {formatTime(match.boardingAt)}
          </span>
          <span
            aria-hidden
            className="my-1 w-0.5 flex-1 rounded-full bg-ink-200"
            style={{ minHeight: 26 }}
          />
          <span className="tnum font-display text-[17px] font-bold">
            {formatTime(match.droppingAt)}
            {/* Viaje de nuit : sans « +1 », un 00:40 sous un 23:15 se lit
                comme une heure d'avant le départ. */}
            {new Date(match.droppingAt).toDateString() !==
              new Date(match.boardingAt).toDateString() && (
              <span className="block text-center text-[10px] leading-none font-bold tracking-[0.08em] text-ink-400 uppercase">
                +1 día
              </span>
            )}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-[16.5px] font-bold tracking-[-0.015em]">
                {segment.from.name}
              </p>
              <p className="tnum mb-1.5 text-[12.5px] text-ink-500">
                {formatDuration(durationMin)} de camino
              </p>
              <p className="truncate font-display text-[16.5px] font-bold tracking-[-0.015em]">
                {segment.to.name}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="tnum font-display text-[22px] font-extrabold tracking-[-0.03em]">
                {formatUsd(match.priceCents)}
              </p>
              <p className="text-[11.5px] text-ink-500">por puesto</p>
            </div>
          </div>

          {/* MONTER EN COURS DE ROUTE. Une carte qui affiche « 08:05 »
              sans dire que le carro roule depuis deux heures promet une
              ponctualité que personne ne peut tenir. */}
          {comesFrom && (
            <div className="mt-2.5">
              <EnRuta match={match} variante="linea" />
            </div>
          )}
          {context && (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-500">
              <Icon name="arrowRight" className="size-3.5 shrink-0" />
              Este viaje {context}
            </p>
          )}

          <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink-200 pt-3.5">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-[13.5px] font-bold text-ink-50"
            >
              {trip.driver.initial}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14.5px] font-semibold">
                {trip.driver.firstName} {trip.driver.lastInitial}.
              </span>
              <Rating
                value={trip.driver.rating}
                count={trip.driver.ridesCount}
                className="text-[12.5px]"
              />
              <span className="flex items-center gap-1 text-[12.5px] text-ink-500">
                <Icon name="car" className="size-3.5 shrink-0" />
                {trip.vehicle.make} {trip.vehicle.model} {trip.vehicle.year} ·{" "}
                {trip.vehicle.color}
              </span>
            </span>

            <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
              {/* « Super conductor » était `isSuperDriver`, un booléen
                  écrit à la main dans le jeu de démonstration : personne
                  ne le gagnait, personne ne pouvait le perdre. La règle
                  vit maintenant dans lib/conductor.ts et se PERD si la
                  note redescend. */}
              {esTopConductor(trip.driver) && (
                <Chip tone="brand">Top conductor</Chip>
              )}
              {trip.flexibleStops && <Chip>Deja en el camino</Chip>}
              {trip.womenOnly && <Chip>Solo mujeres</Chip>}
              {trip.instantBooking && <Chip>Reserva al instante</Chip>}
              <Chip tone={match.seatsFree === 1 ? "urgent" : "plain"}>
                {match.seatsFree === 1
                  ? "Queda 1 puesto"
                  : `${match.seatsFree} puestos`}
              </Chip>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Chip({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: "plain" | "brand" | "urgent";
}) {
  const styles = {
    plain: "bg-ink-50 text-ink-600",
    /* La distinction se dit en AMBRE — la couleur d'action de la maison.
       Le bleu la faisait ressembler à un lien : couleur orpheline (audit B4). */
    brand: "bg-action-soft text-action-ink",
    // Le seul état qui mérite d'être signalé par une couleur : il change
    // la décision (réserver maintenant ou pas).
    urgent: "bg-danger-soft text-danger",
  } as const;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
