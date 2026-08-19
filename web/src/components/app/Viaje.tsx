"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { deParams } from "@/lib/place";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import { EnRuta } from "@/components/trip/EnRuta";
import { Nota, BadgeTop } from "@/components/ui/Reputacion";
import { esTopConductor } from "@/lib/conductor";
import { BookingPanel } from "@/components/trip/BookingPanel";
import { routePoints } from "@/lib/desvio";
import { ALL_CITIES } from "@/lib/corridors";
import { findSegment } from "@/lib/segments";
import { formatDuration, formatUsd } from "@/lib/pricing";
import {
  formatDayLabel,
  formatTime,
  fullMatch,
  matchFor,
  type Trip,
} from "@/lib/trips";
import type { Corridor } from "@/lib/corridors";

/**
 * VIAJE — la fiche, version app.
 *
 * Elle répond dans cet ordre aux questions qu'on se pose vraiment avant
 * de monter dans la voiture d'un inconnu : par où on passe, à quelle
 * heure on me prend, qui conduit, dans quoi, et combien.
 *
 * L'EN-TÊTE N'EST PAS UNE PHOTO. La maquette montre une image ; nous
 * n'avons pas de photo de CE conducteur ni de CETTE voiture, et poser
 * une image de banque d'images en tête d'une fiche revient à laisser
 * croire que c'est la sienne. On met le trajet à la place — c'est ce
 * qu'on a de vrai, et c'est même plus utile.
 *
 * ELLE NE RÉIMPLÉMENTE RIEN. Le prix vient de `matchFor`, comme la
 * recherche et la carte ; la réservation est le `BookingPanel` du site,
 * tel quel, dans une feuille. Trois canaux de paiement, un plafond de
 * prix, un calcul de détour : c'est le code le plus délicat du produit,
 * et il n'en existe qu'un exemplaire.
 */

export function Viaje({ trip, corridor }: { trip: Trip; corridor: Corridor }) {
  const router = useRouter();
  const params = useSearchParams();
  const [abierto, setAbierto] = useState(false);

  const pedido = findSegment(
    trip.servedStops,
    params.get("desde") ?? "",
    params.get("hacia") ?? "",
  );
  /* Un lien tronqué ou partagé ne doit jamais mener à une page cassée :
     sans segment lisible, on retombe sur le trajet complet. */
  const match = (pedido && matchFor(trip, pedido)) ?? fullMatch(trip);
  if (!match) return null;

  const { segment } = match;
  const paradas = trip.servedStops.slice(
    segment.fromIndex,
    segment.toIndex + 1,
  );

  const minutos = Math.round(
    (new Date(match.droppingAt).getTime() -
      new Date(match.boardingAt).getTime()) /
      60_000,
  );
  /* LE POINT DE DÉPART DÉCLARÉ par le conducteur, avec ses coordonnées.
     `Waypoint` ne porte qu'un slug ; le catalogue des villes porte le
     point. C'est la seule option dont on sait avec certitude qu'elle ne
     fait dévier de rien : c'est là que le conducteur part déjà. */
  const ciudadSalida = ALL_CITIES.find((c) => c.slug === segment.from.citySlug);
  const puntoConductor = ciudadSalida
    ? {
        nombre: segment.from.name,
        punto: { lat: ciudadSalida.lat, lng: ciudadSalida.lng },
      }
    : null;

  const fecha = trip.departureAt.slice(0, 10);

  return (
    <div className="pb-[104px]">
      {/* L'EN-TÊTE — TYPOGRAPHIQUE, PLUS DE FAUSSE CARTE.

          Il portait un tracé du segment : des villes reliées en LIGNE
          DROITE. Sur un viaje long, ça ressemblait vaguement à une
          route ; sur Panamá → La Chorrera, deux points côte à côte, ça
          donnait une tache orange sur fond vert dont personne ne pouvait
          dire ce qu'elle représentait. Photographiée, signalée.

          Le fond du problème est le même que pour les deux autres
          cartes retirées : sans tracé routier réel, dessiner un
          itinéraire c'est l'inventer. Le titre dit déjà d'où à où, et il
          le dit exactement. */}
      <div className="relative bg-verde-perfil pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="mt-3 ml-4 flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <Icon name="arrowRight" className="size-5 rotate-180" />
        </button>

        <div className="px-5 pt-3 pb-5 text-white">
          <p className="font-display text-[24px] leading-tight font-extrabold tracking-[-0.03em]">
            {segment.from.name} → {segment.to.name}
          </p>
          {/* « SALE » EST FAUX QUAND ON MONTE EN COURS DE ROUTE.
              Le conducteur n'est pas parti d'ici : il PASSE. Un seul mot,
              et il change ce qu'on comprend d'une heure — c'est la même
              confusion qui fait attendre quelqu'un pour rien au bord de
              la route. */}
          <p className="mt-1 text-[13.5px] text-white/75">
            {formatDayLabel(fecha)} ·{" "}
            {match.segment.fromIndex > 0 ? "pasa" : "sale"}{" "}
            {formatTime(match.boardingAt)} · {formatDuration(minutos)}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[520px] px-4 pt-4">
        {/* MONTER EN COURS DE ROUTE — EN PREMIER. C'est ce qui change la
            lecture de tout le reste : l'heure du point est un passage,
            pas un départ. Le bloc s'efface tout seul quand le passager
            monte là où le conducteur démarre. */}
        <div className="mb-3">
          <EnRuta match={match} />
        </div>

        {/* QUI MANEJA — avant le prix : on choisit une personne. */}
        <section className="rounded-[18px] border border-ink-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-verde-perfil font-display text-[18px] font-bold text-white">
              {trip.driver.initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[17px] font-bold">
                {trip.driver.firstName} {trip.driver.lastInitial}.
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Nota
                  rating={trip.driver.rating}
                  viajes={trip.driver.ridesCount}
                  size="md"
                />
                <BadgeTop conductor={trip.driver} />
              </p>
            </div>
            {/* PAS DE CONDITION. Publier exige cédula et licencia
                vérifiées : ce conducteur l'est forcément, comme tous les
                autres. Le montrer « seulement s'il l'est » laissait
                croire à un tri qui n'existe pas. */}
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-verde-suave px-2.5 py-1 text-[11.5px] font-bold text-verde-ok">
              <Icon name="shield" className="size-3.5" />
              Verificado
            </span>
          </div>

          <ul className="mt-3 grid gap-1.5 border-t border-ink-100 pt-3">
            {/* LE BADGE SE MÉRITE MAINTENANT. Avant, `isSuperDriver`
                était un booléen écrit à la main dans le jeu de
                démonstration : personne ne le gagnait, personne ne
                pouvait le perdre. La règle vit dans lib/conductor.ts. */}
            {esTopConductor(trip.driver) && (
              <Linea icon="shield">
                Top conductor — {trip.driver.ridesCount} viajes, {trip.driver.rating.toFixed(1)} de nota
              </Linea>
            )}
            <Linea icon="car">
              {trip.vehicle.make} {trip.vehicle.model} {trip.vehicle.year},{" "}
              {trip.vehicle.color}
            </Linea>
            {trip.womenOnly && (
              <Linea icon="users">Este viaje es solo para mujeres</Linea>
            )}
            <Linea icon="chat">
              El chat se abre en Mis viajes. Nadie da su número.
            </Linea>
          </ul>
        </section>

        {/* EL RECORRIDO — les heures de passage, arrêt par arrêt. */}
        <section className="mt-3 rounded-[18px] border border-ink-200 bg-white p-4">
          <h2 className="mb-3 font-display text-[16px] font-bold">
            El recorrido
          </h2>
          <ol className="grid gap-0">
            {paradas.map((p, i) => {
              const seg = findSegment(
                trip.servedStops,
                paradas[0].citySlug,
                p.citySlug,
              );
              const hasta = seg ? matchFor(trip, seg) : null;
              const ultimo = i === paradas.length - 1;
              return (
                <li key={p.citySlug} className="flex gap-3">
                  <span className="flex w-3 flex-col items-center">
                    <span
                      className={`mt-1.5 size-[9px] shrink-0 rounded-full ${
                        i === 0
                          ? "bg-verde-ok"
                          : ultimo
                            ? "bg-naranja"
                            : "bg-ink-300"
                      }`}
                    />
                    {!ultimo && <span className="w-px flex-1 bg-ink-200" />}
                  </span>
                  <span className={`min-w-0 flex-1 ${ultimo ? "" : "pb-4"}`}>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[14.5px] font-semibold">
                        {p.name}
                      </span>
                      <span className="tnum shrink-0 text-[13px] text-ink-500">
                        {hasta ? formatTime(hasta.droppingAt) : ""}
                      </span>
                    </span>
                    {/* CE QUE ÇA COÛTE DE DESCENDRE LÀ. Le même calcul que
                        la carte des résultats — un seul moteur de prix. */}
                    {i > 0 && hasta && (
                      <span className="tnum block text-[12.5px] text-ink-400">
                        {formatUsd(hasta.priceCents)} desde {paradas[0].name}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* EL APORTE — d'où il sort, en une phrase. */}
        <section className="mt-3 rounded-[18px] bg-naranja-suave p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[15.5px] font-bold text-naranja-hondo">
              Aporte por puesto
            </span>
            <span className="tnum font-display text-[24px] font-extrabold text-naranja-hondo">
              {formatUsd(match.priceCents)}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-600">
            Sale de los {Math.round(segment.km)} km de este tramo, del carro y
            de los peajes, repartidos entre los ocupantes. No sube con la
            demanda ni con la fecha.
          </p>
        </section>

        <p className="mt-3 px-1 text-[12px] leading-snug text-ink-400">
          {corridor.origin.shortName} → {corridor.destination.shortName} es el
          recorrido completo de {trip.driver.firstName}; tú vas de{" "}
          {segment.from.name} a {segment.to.name}.
        </p>
      </div>

      {/* LA BARRE DE RÉSERVATION. Elle est au-dessus de la barre
          d'onglets — sur cet écran, l'action est réserver, pas naviguer. */}
      <div className="barra-accion glass fixed inset-x-0 bottom-0 z-[60] rounded-t-[22px] px-4 pt-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex w-full max-w-[520px] items-center gap-3">
          <span className="min-w-0">
            <span className="tnum block font-display text-[21px] leading-none font-extrabold">
              {formatUsd(match.priceCents)}
            </span>
            <span className="block text-[12px] text-ink-500">
              por puesto ·{" "}
              {match.seatsFree === 1
                ? "queda 1 puesto"
                : `quedan ${match.seatsFree} puestos`}
            </span>
          </span>
          <Dialog.Root open={abierto} onOpenChange={setAbierto}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                disabled={match.seatsFree < 1}
                className="cta-naranja ml-auto flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[16px] font-display text-[15.5px] font-bold text-white disabled:opacity-45"
              >
                {trip.instantBooking ? "Reservar" : "Pedir el puesto"}
                <Icon name="arrowRight" className="size-[17px]" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink-900/45" />
              <Dialog.Content className="hoja-abajo glass fixed inset-x-0 bottom-0 z-[80] max-h-[92vh] overflow-y-auto rounded-t-[24px] p-4">
                <div className="mx-auto w-full max-w-[520px]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Dialog.Title className="font-display text-[18px] font-bold">
                      Tu reserva
                    </Dialog.Title>
                    <Dialog.Close
                      aria-label="Cerrar"
                      className="flex size-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
                    >
                      <Icon name="cross" className="size-5" />
                    </Dialog.Close>
                  </div>
                  <Dialog.Description className="sr-only">
                    Escoge cuántos puestos, dónde te recoge y cómo pagas.
                  </Dialog.Description>

                  {/* LE PANNEAU DU SITE, TEL QUEL. Les trois canaux de
                      paiement, le plafond de prix et le calcul de détour
                      vivent là — les recopier pour l'app aurait créé une
                      deuxième vérité sur l'argent. */}
                  <BookingPanel
                    key={`${trip.id}-${segment.fromIndex}-${segment.toIndex}`}
                    tripId={trip.id}
                    initialPoint={params.get("punto") ?? ""}
                    /* LE LIEU CHOISI À LA RECHERCHE arrive enfin jusqu'ici.
                       Sans lui, le panneau démarrait sans position, donc
                       sans recommandations — d'où « je n'ai aucune
                       proposition de lieu ». La personne avait pourtant
                       DÉJÀ dit d'où elle part, deux écrans plus tôt. */
                    lugarBuscado={deParams(params, "o")}
                    /* Le point de départ DÉCLARÉ par le conducteur : il
                       devient une option à part entière (zéro détour). */
                    puntoConductor={puntoConductor}
                    fromSlug={segment.from.citySlug}
                    toSlug={segment.to.citySlug}
                    boardingAt={match.boardingAt}
                    driverName={trip.driver.firstName}
                    priceCents={match.priceCents}
                    seatsLeft={match.seatsFree}
                    citySlug={segment.from.citySlug}
                    baseKm={segment.km}
                    tollCents={segment.tollCents}
                    category={trip.vehicle.ratePerKmCents}
                    seatsOffered={trip.seatsOffered}
                    instantBooking={trip.instantBooking}
                    flexibleStops={trip.flexibleStops}
                    route={routePoints(trip.servedStops.map((s) => s.citySlug))}
                  />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* La sortie de secours vers la recherche : sur un lien ouvert de
          l'extérieur, `router.back()` n'a nulle part où revenir. */}
      <Link href="/" className="sr-only">
        Volver al inicio
      </Link>
    </div>
  );
}

function Linea({
  icon,
  children,
}: {
  icon: "star" | "car" | "users" | "chat" | "shield";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink-600">
      <Icon name={icon} className="mt-0.5 size-4 shrink-0 text-ink-400" />
      {children}
    </li>
  );
}
