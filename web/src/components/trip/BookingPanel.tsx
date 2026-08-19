"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PlacePicker } from "@/components/ui/PlacePicker";
import { Icon } from "@/components/ui/Icon";
import { AuthDialog } from "@/components/site/AuthDialog";
import { newDemoBookingId, useSession } from "@/lib/session";
import {
  formatUsd,
  serviceFeeCents,
  PAY_CHANNELS,
  SERVICE_FEE_PCT,
  type PayChannel,
  type VehicleCategory,
} from "@/lib/pricing";
import { CashMark, TarjetaMark, YappyBubbles } from "@/components/ui/PayMark";
import { quoteDetour } from "@/lib/detour";
import { detourKm, type Punto } from "@/lib/desvio";
import { proponerPuntos, type Propuesta } from "@/lib/recogida";
import type { PlaceRef } from "@/lib/place";
import { lugaresCerca } from "@/lib/geosearch";
import { bookingDisclaimer } from "@/lib/content";
import { TRIPS_ARE_DEMO } from "@/lib/config";
import { track } from "@/lib/analytics";

/**
 * Panneau de réservation.
 *
 * Trois choses doivent tenir ensemble sans que l'utilisateur ait à chercher :
 * le montant, le point de prise en charge, et le canal de paiement avec sa
 * tarifa affichée AVANT le bouton — jamais découverte après. L'ordre des
 * canaux est celui de la maison : Yappy (recommandé), tarjeta, efectivo.
 *
 * La connexion est demandée AU MOMENT de réserver, pas à l'entrée du site :
 * on laisse chercher, comparer et calculer sans compte. Un mur de connexion
 * à l'accueil coûte plus de visiteurs qu'il n'en qualifie.
 */

type Props = {
  tripId: string;
  driverName: string;
  priceCents: number;
  seatsLeft: number;
  baseKm: number;
  tollCents: number;
  category: VehicleCategory | number;
  /** Ville où le passager monte — nourrit le sélecteur de lieu exact. */
  citySlug: string;
  seatsOffered: number;
  instantBooking: boolean;
  /** Le conducteur dépose PARTOUT sur son chemin : proposer son point
   *  n'est plus une négociation tant qu'on reste sur la route. */
  flexibleStops?: boolean;
  /** Adresse exacte venue de /ya (?punto=) : présélectionne « Propongo
   *  mi punto » avec le texte déjà écrit. */
  initialPoint?: string;
  /** Identité du segment réservé — c'est elle qui entre dans la reserva
   *  de « Mis viajes » : d'où à où, et l'ISO de la montée. */
  fromSlug: string;
  toSlug: string;
  boardingAt: string;
  /** Le TRACÉ du conducteur, en coordonnées : c'est par rapport à lui
   *  qu'on mesure le détour d'un point proposé — pas par rapport à la
   *  ville. Vide, on retombe sur le curseur manuel. */
  route?: Punto[];
  /** LE LIEU CHOISI À LA RECHERCHE. La personne a déjà dit d'où elle
   *  part ; le lui redemander pour pouvoir enfin lui proposer des points
   *  était absurde, et c'est ce qui faisait qu'aucune recommandation
   *  n'apparaissait jamais. */
  lugarBuscado?: PlaceRef | null;
  /** Le point de départ DÉCLARÉ par le conducteur. */
  puntoConductor?: { nombre: string; punto: Punto } | null;
};

export function BookingPanel({
  tripId,
  driverName,
  citySlug,
  priceCents,
  seatsLeft,
  baseKm,
  tollCents,
  category,
  seatsOffered,
  instantBooking,
  flexibleStops = false,
  initialPoint = "",
  fromSlug,
  toSlug,
  boardingAt,
  route = [],
  lugarBuscado = null,
  puntoConductor = null,
}: Props) {
  const { session, isDemo, updateSession } = useSession();
  const [seats, setSeats] = useState(1);
  /* L'adresse exacte peut arriver de /ya (?punto=) : elle présélectionne
     « Propongo mi punto » avec le texte déjà écrit — l'utilisateur qui a
     tapé son PH une fois ne le retape jamais. */
  const [customPoint, setCustomPoint] = useState(initialPoint);
  /* Le point exact, en coordonnées, dès que le sélecteur les connaît.
     C'est LUI qui commande le prix : le détour n'est plus une supposition
     du passager, c'est une mesure. */
  const [pointCoords, setPointCoords] = useState<Punto | null>(null);
  const [booked, setBooked] = useState(false);
  /* L'offre du passager : MOINS que l'aporte publié, jamais plus. Offrir
     plus serait enchérir — le prix suivrait la demande, exactement ce que
     la règle R3 interdit. Vers le bas, c'est une négociation entre
     particuliers : le conducteur accepte ou refuse. */
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerCents, setOfferCents] = useState<number | null>(null);
  /* Trois façons de payer, dans l'ordre de la maison : Yappy d'abord
     (recommandé — tarifa la plus basse), la tarjeta ensuite, l'efectivo
     en dernier. La tarifa de servicio paie la réservation protégée, PAS
     le transport : le conducteur reçoit son aporte complet dans tous les
     cas, et l'efectivo reste gratuit (R2). Le favori du compte
     présélectionne ; tant que l'utilisateur n'a pas cliqué, on suit sa
     préférence — dérivée, pas copiée, pour éviter tout setState en effet. */
  const [channelChoice, setChannelChoice] = useState<PayChannel | null>(null);

  /* TOUJOURS « proposé » : il n'y a plus de liste de points fabriquée à
     choisir. Conséquence assumée et conforme à R4 — le conducteur
     tranche, sauf s'il a déclaré s'arrêter partout sur son chemin et que
     le point ne le fait pas dévier. */
  const isCustom = true;
  /* MESURÉ quand on a le point, DEVINÉ sinon — dérivé, jamais recopié
     dans un état par un effet. Zéro est une réponse valable et c'est même
     la meilleure nouvelle du panneau : le point est SUR son chemin, il ne
     coûte rien de plus. */
  /* LES RECOMMANDATIONS AUTOUR DE TOI.
     ─────────────────────────────────────────────────────────────────
     Reproche : « dès que je sélectionne une course, je n'ai aucune
     recommandation de lieu, je devrais en avoir ».

     La formule, puisque le choix m'était laissé : on part du point de la
     personne, on demande au géocodeur ce qu'il y a autour (stations,
     malls, supermarchés, parcs — des endroits qui se trouvent de nuit et
     se décrivent au téléphone), et on ne garde que ceux qui sont sur le
     chemin du conducteur SANS le faire reculer. `recogida.ts` classe :
     le plus proche de toi d'abord, le moindre détour pour départager.

     Deux passagers à cent et à quatre cents mètres verront donc deux
     listes différentes, chacune calculée depuis SA position — ce qui
     était tout le sujet. Et le détour affiché sur chaque ligne dit
     honnêtement ce que ça coûte : zéro quand c'est sur la route. */
  const [sugeridos, setSugeridos] = useState<Propuesta[]>([]);
  /* DÉRIVÉ, pas remis à zéro par un effet : vider l'état de façon
     synchrone dans l'effet déclenche des rendus en cascade (le
     compilateur React le refuse, à raison). Sans point, il n'y a rien à
     proposer — ça se lit, ça ne s'écrit pas. */
  /* LA POSITION DE DÉPART pour les recommandations : celle qu'on vient
     de saisir, sinon celle de la recherche. C'est ce repli qui fait
     apparaître les propositions DÈS l'ouverture de l'écran, au lieu
     d'attendre qu'on retape ce qu'on a déjà dit. */
  const latBuscada = lugarBuscado?.lat ?? null;
  const lngBuscada = lugarBuscado?.lng ?? null;
  /* MÉMOÏSÉ : un objet recréé à chaque rendu relancerait la requête de
     lieux proches en boucle. Ce sont les deux nombres qui comptent, pas
     l'identité de l'objet. */
  const origenPropuestas = useMemo(
    () =>
      pointCoords ??
      (latBuscada !== null && lngBuscada !== null
        ? { lat: latBuscada, lng: lngBuscada }
        : null),
    [pointCoords, latBuscada, lngBuscada],
  );
  const cercanos = origenPropuestas ? sugeridos : [];
  useEffect(() => {
    if (!origenPropuestas || route.length === 0) return;
    const ctrl = new AbortController();
    let vivo = true;
    void lugaresCerca(origenPropuestas, ctrl.signal).then((lugares) => {
      if (!vivo) return;
      setSugeridos(
        proponerPuntos(
          origenPropuestas,
          route,
          lugares
            .filter((l) => l.lat !== null && l.lng !== null)
            .map((l) => ({ nombre: l.nombre, punto: { lat: l.lat!, lng: l.lng! } })),
          4,
        ),
      );
    });
    return () => {
      vivo = false;
      ctrl.abort();
    };
  }, [origenPropuestas, route]);

  const measuredKm =
    pointCoords && route.length > 0 ? detourKm(pointCoords, route) : null;
  /* PAS DE MESURE, PAS DE KILOMÈTRES INVENTÉS. Zéro veut dire « on
     n'ajoute rien au calcul » — le point part quand même au conducteur,
     qui décide. Fabriquer une valeur ici gonflerait l'aporte sur une
     estimation que personne n'a faite. */
  const extraKm = measuredKm ?? 0;
  const quote = quoteDetour(baseKm, tollCents, extraKm, category, seatsOffered);
  const activeOffer = offerOpen && offerCents !== null && offerCents < priceCents;
  const baseCents = activeOffer ? offerCents : priceCents;
  /* Les km de détour restent en sus de l'offre : ils compensent un coût
     réel, ils ne se négocient pas. */
  const unitCents = isCustom ? baseCents + quote.extraCents : baseCents;
  const totalCents = unitCents * seats;
  const payChannel: PayChannel = channelChoice ?? session?.payPref ?? "yappy";
  const inApp = payChannel !== "efectivo";
  const feeCents = serviceFeeCents(totalCents, payChannel);
  const chargedCents = totalCents + feeCents;
  const blocked = isCustom && !quote.accepted;
  /* Une offre retire toujours la réservation instantanée : il y a une
     décision humaine de l'autre côté. Un point proposé aussi — SAUF si
     le conducteur a déclaré qu'il dépose partout sur son chemin et que
     le point ne le fait pas dévier (quote.accepted, desvío compris dans
     ce qu'il a ouvert). C'est sa déclaration qui décide, pas nous. */
  const pointNeedsOk = isCustom && !flexibleStops;
  const needsDriverOk = !instantBooking || pointNeedsOk || activeOffer;

  /* Réserver ÉCRIT : la reserva entre en session et « Mis viajes » la
     liste avec son état. Avant ça, « Pedir mi puesto » était un geste
     sans lendemain — le trou de logique n° 1 de l'audit. */
  function confirmBooking() {
    const booking = {
      /* L'identité de la reserva, et donc de son fil de discussion. */
      id: newDemoBookingId(),
      tripId,
      from: fromSlug,
      to: toSlug,
      boardingAt,
      seats,
      totalCents,
      feeCents,
      channel: payChannel,
      driverName,
      point: customPoint.trim() || "Punto propuesto",
      status: (needsDriverOk ? "pendiente" : "confirmado") as
        | "pendiente"
        | "confirmado",
    };
    updateSession({ bookings: [...(session?.bookings ?? []), booking] });
    track("reserva_pedida", {
      origin_slug: fromSlug,
      destination_slug: toSlug,
      props: {
        puestos: seats,
        canal: payChannel,
        total_centavos: totalCents,
        punto_propio: isCustom,
        estado: booking.status,
      },
    });
    setBooked(true);
  }

  if (booked) {
    return (
      <aside className="rounded-[20px] border border-ink-200 bg-white p-6 min-[900px]:sticky min-[900px]:top-[80px]">
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-ink-900 text-white">
          <Icon name="check" className="size-5" />
        </span>
        <h2 className="mb-2 font-display text-[19px] font-bold">
          {needsDriverOk ? "Solicitud enviada" : "Puesto confirmado"}
        </h2>
        <p className="mb-4 text-[14.5px] leading-relaxed text-ink-500">
          {needsDriverOk
            ? `${driverName} tiene 24 horas para responder${
                activeOffer ? ` a tu oferta de ${formatUsd(unitCents)}` : ""
              }${pointNeedsOk ? " y a tu punto propuesto" : ""}. Te avisamos apenas decida.`
            : `Ya tienes tu puesto. Coordina la hora y el punto exacto con ${driverName} por el chat de esta reserva.`}
        </p>
        {/* PLUS DE NUMÉRO. On affichait le celular du conducteur dès la
            confirmation — c'était sortir la coordination de la plateforme
            à la première minute : plus aucune trace de ce qui a été
            convenu le jour où quelqu'un réclame, et la porte ouverte à
            « arreglemos por fuera ». Le fil de la reserva le remplace, et
            il est écrit, daté, non modifiable des deux côtés. */}
        {!needsDriverOk && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-[10px] bg-ink-50 px-3 py-2 text-[13.5px] leading-snug text-ink-500">
            <Icon name="chat" className="size-4 shrink-0" />
            El chat con {driverName} está en Mis viajes. Nadie necesita dar su
            número.
          </p>
        )}
        <p className="rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
          {inApp ? (
            <>
              <b className="font-semibold text-ink-900">
                {payChannel === "yappy" ? "Pago por Yappy" : "Pago con tarjeta"}
                {needsDriverOk ? " al confirmar" : ""}: {formatUsd(chargedCents)}
              </b>{" "}
              ({formatUsd(totalCents)} de aporte + {formatUsd(feeCents)} de
              tarifa).{" "}
              {needsDriverOk &&
                `El cobro sale solo si ${driverName} acepta. `}
              {driverName} recibe su aporte completo. En esta demostración no
              se cobró nada:{" "}
              {payChannel === "yappy"
                ? "el Botón de Pago Yappy se activa cuando el comercio esté conectado."
                : "el cobro con tarjeta se activa cuando la pasarela esté conectada."}
            </>
          ) : (
            <>
              <b className="font-semibold text-ink-900">
                No pagaste nada aquí.
              </b>{" "}
              Le entregas {formatUsd(totalCents)} a {driverName} el día del
              viaje, en efectivo o por Yappy a su número.
            </>
          )}
        </p>
        {/* La boucle se referme ICI : la reserva vient d'entrer en session,
            « Mis viajes » la liste — et on le dit, sinon la fonctionnalité
            n'existe pas pour l'utilisateur. */}
        <Link
          href="/cuenta"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold transition-colors hover:border-accent hover:text-accent-ink"
        >
          Ver en Mis viajes
          <Icon name="arrowRight" className="size-4" />
        </Link>
      </aside>
    );
  }

  return (
    <aside className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6 min-[900px]:sticky min-[900px]:top-[80px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="tnum font-display text-[30px] font-extrabold tracking-[-0.035em]">
          {formatUsd(unitCents)}
        </span>
        <span className="text-[13.5px] text-ink-500">por puesto</span>
      </div>
      <p className="mt-1 mb-5 text-[13.5px] text-ink-500">
        {seatsLeft === 1 ? "Queda 1 puesto" : `Quedan ${seatsLeft} puestos`} ·{" "}
        {instantBooking ? "Reserva al instante" : "El conductor confirma"}
      </p>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
          Cuántos puestos
        </span>
        <select
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full cursor-pointer rounded-[14px] border border-ink-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
        >
          {Array.from({ length: seatsLeft }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "puesto" : "puestos"}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mb-4">
        <legend className="mb-1.5 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
          Dónde te recoge
        </legend>
        {flexibleStops && (
          <p className="mb-2 flex items-start gap-2 rounded-[10px] bg-ink-50 px-3 py-2 text-[12.5px] leading-snug text-ink-600">
            <Icon name="pin" className="mt-0.5 size-3.5 shrink-0 text-ink-500" />
            <span>
              <b className="font-semibold text-ink-900">
                {driverName} para en cualquier punto de su camino.
              </b>{" "}
              Escoge uno de los suyos o propón el tuyo.
            </span>
          </p>
        )}
        {/* LES TROIS CARTES FIXES ONT ÉTÉ RETIRÉES.

            Elles proposaient « Costa del Este », « Albrook », « Vía
            Centenario » à TOUT LE MONDE, quel que soit l'endroit où l'on
            se trouve — c'était une constante par ville, pas la
            déclaration du conducteur. D'où le reproche : « la personne ne
            va jamais aller là ».

            Et ce n'était pas seulement inutile, c'était trompeur : ces
            trois lignes ressemblaient à des points que le conducteur
            avait choisis (R4), alors qu'elles étaient écrites en dur dans
            le code, sans une seule coordonnée.

            Il reste donc UN chemin, et il est vrai : tu dis où tu es, on
            mesure le détour quand on peut, et le conducteur décide — ce
            qui est sa prérogative. */}
      </fieldset>

      {isCustom && (
        <div className="mb-4 rounded-[14px] bg-ink-50 p-4">
          <div className="mb-3">
            <PlacePicker
              id="book-punto"
              label="Tu punto exacto"
              citySlug={citySlug}
              value={customPoint}
              onChange={setCustomPoint}
              onCoords={setPointCoords}
              placeholder="Ej. Multiplaza, Vía Israel, frente al parque…"
            />
            {/* « JE VAIS AU POINT DU CONDUCTEUR » — l'option qui manquait,
                et elle est la plus honnête de toutes : c'est là qu'il
                part DÉJÀ. Zéro détour, zéro négociation, zéro kilomètre
                ajouté au calcul. Elle passe donc en premier, avant les
                lieux proches : quand elle convient, plus rien d'autre
                n'a besoin d'être décidé. */}
            {puntoConductor && (
              <button
                type="button"
                onClick={() => {
                  setCustomPoint(puntoConductor.nombre);
                  setPointCoords(puntoConductor.punto);
                }}
                className={`mt-2.5 flex w-full items-center gap-2.5 rounded-[12px] border px-3.5 py-2.5 text-left transition-colors ${
                  customPoint === puntoConductor.nombre
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-200 bg-white hover:border-accent"
                }`}
              >
                <Icon name="pin" className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">
                    Voy al punto de {driverName}
                  </span>
                  <span
                    className={`block text-[12.5px] ${
                      customPoint === puntoConductor.nombre
                        ? "text-white/70"
                        : "text-ink-500"
                    }`}
                  >
                    {puntoConductor.nombre} · sin desvío
                  </span>
                </span>
              </button>
            )}
            {cercanos.length > 0 && (
              <div className="mt-2.5">
                <p className="mb-1.5 text-[11.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
                  Cerca de ti, en su camino
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cercanos.map((c) => (
                    <button
                      key={`${c.nombre}-${c.avanceKm.toFixed(2)}`}
                      type="button"
                      onClick={() => {
                        setCustomPoint(c.nombre);
                        setPointCoords(c.punto);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-left text-[13px] transition-colors ${
                        customPoint === c.nombre
                          ? "border-ink-900 bg-ink-900 text-white"
                          : "border-ink-200 bg-white hover:border-accent"
                      }`}
                    >
                      <span className="font-semibold">{c.nombre}</span>
                      <span
                        className={
                          customPoint === c.nombre
                            ? "ml-1.5 text-white/70"
                            : "ml-1.5 text-ink-500"
                        }
                      >
                        {c.desvioKm === 0
                          ? "sin desvío"
                          : `+${c.desvioKm.toFixed(1)} km`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-2 text-[12.5px] leading-snug text-ink-500">
              {flexibleStops
                ? `${driverName} deja en cualquier punto de su camino: si te queda de paso, no hay nada que negociar. Un desvío de verdad sí lo decide ${driverName}.`
                : `${driverName} decide si le queda de paso — el recorrido es suyo.`}
            </p>
          </div>
          {/* LE CURSEUR A ÉTÉ RETIRÉ.

              C'était le seul chiffre du produit qu'on demandait à
              quelqu'un d'INVENTER — et il commandait le prix. Personne
              ne sait de tête si son PH fait dévier de deux ou de huit
              kilomètres. Un curseur réglé au hasard, c'est un aporte
              calculé au hasard, sur une formule qui se veut vérifiable.

              Quand le lieu a des coordonnées, on MESURE (desvio.ts).
              Quand il n'en a pas, on ne devine plus : on le dit, et
              c'est le conducteur qui tranche — ce qui est de toute façon
              sa prérogative (R4, le recorrido est le sien). Mieux vaut
              « il décidera » que trois décimales fabriquées. */}
          {measuredKm !== null ? (
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500">
                <Icon name="pin" className="size-3.5 shrink-0" />
                {extraKm === 0 ? "Te queda de paso" : "Se desvía de su camino"}
              </span>
              <b className="tnum text-[14.5px]">
                {extraKm === 0 ? "Sin desvío" : `+${extraKm.toFixed(1)} km`}
              </b>
            </div>
          ) : customPoint.trim() ? (
            <div className="flex items-start gap-1.5 text-[12.5px] leading-snug text-ink-500">
              <Icon name="pin" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                No ubicamos ese punto en el mapa, así que no calculamos el
                desvío. {driverName} lo revisa y te dice.
              </span>
            </div>
          ) : null}
          <p
            className="mt-2 text-[12.5px] leading-relaxed text-ink-500"
            aria-live="polite"
          >
            {quote.accepted ? (
              measuredKm === 0 ? (
                <>
                  Tu punto está sobre el camino de {driverName}: no le suma
                  kilómetros, así que{" "}
                  <b className="font-semibold text-ink-900">
                    no cambia el aporte
                  </b>
                  .
                </>
              ) : (
                <>
                  {measuredKm !== null
                    ? `Medido desde tu punto hasta el camino de ${driverName}, ida y vuelta: `
                    : "Los kilómetros de más los pones tú, no el conductor: "}
                  <b className="font-semibold text-ink-900">
                    +{formatUsd(quote.extraCents)}
                  </b>{" "}
                  sobre el aporte de la ruta. No es un cargo por recogerte.
                </>
              )
            ) : (
              <span className="text-danger">{quote.reason}</span>
            )}
          </p>
        </div>
      )}

      {/* L'offre : vers le bas seulement. Le curseur ne PEUT pas dépasser
          l'aporte publié — enchérir n'existe pas ici (R3). */}
      <div className="mb-4">
        <button
          type="button"
          aria-expanded={offerOpen}
          onClick={() => {
            setOfferOpen((v) => !v);
            if (offerCents === null) setOfferCents(priceCents);
          }}
          className="text-[13.5px] font-semibold text-accent-ink hover:underline"
        >
          {offerOpen ? "Quitar mi oferta" : "Ofrecer otro aporte"}
        </button>
        {offerOpen && (
          <div className="mt-2.5 rounded-[14px] bg-ink-50 p-4">
            <div className="mb-1 flex items-baseline justify-between">
              <label
                htmlFor="book-oferta"
                className="text-[12.5px] font-semibold text-ink-500"
              >
                Tu oferta por puesto
              </label>
              <b className="tnum text-[16.5px]">
                {formatUsd(offerCents ?? priceCents)}
              </b>
            </div>
            <input
              id="book-oferta"
              type="range"
              min={0}
              max={priceCents}
              step={50}
              value={offerCents ?? priceCents}
              onChange={(e) => setOfferCents(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white"
            />
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
              {activeOffer ? (
                <>
                  {driverName} decide si la acepta — la reserva queda en
                  solicitud hasta que responda.
                </>
              ) : (
                <>
                  Puedes ofrecer menos, nunca más: subir el aporte porque hay
                  demanda es justo lo que aquí no existe.
                </>
              )}
            </p>
          </div>
        )}
      </div>

      <fieldset className="mb-4">
        <legend className="mb-1.5 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
          Cómo pagas
        </legend>
        <div className="grid gap-1.5">
          {PAY_CHANNELS.map((channel) => {
            const active = payChannel === channel;
            return (
              <label
                key={channel}
                className={`flex cursor-pointer items-start gap-2.5 rounded-[14px] border px-3.5 py-2.5 transition-colors ${
                  active
                    ? "border-ink-900 bg-ink-50"
                    : "border-ink-200 hover:border-accent"
                }`}
              >
                <input
                  type="radio"
                  name="pago"
                  checked={active}
                  onChange={() => setChannelChoice(channel)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={`mt-1 size-3.5 shrink-0 rounded-full border-[3px] ${
                    active ? "border-ink-900 bg-white" : "border-ink-200"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14.5px] font-semibold">
                    {channel === "yappy" ? (
                      <>
                        <YappyBubbles className="h-4 w-auto" />
                        Yappy en la app
                        <span className="rounded-full bg-action px-2 py-0.5 text-[11.5px] font-bold tracking-[0.06em] text-ink-900 uppercase">
                          Recomendado
                        </span>
                      </>
                    ) : channel === "tarjeta" ? (
                      <>
                        <TarjetaMark className="size-4.5 text-ink-600" />
                        Tarjeta en la app
                      </>
                    ) : (
                      <>
                        <CashMark className="size-4.5 text-ink-600" />
                        Efectivo el día del viaje
                      </>
                    )}
                  </span>
                  <span className="block text-[12.5px] leading-snug text-ink-500">
                    {channel === "yappy" &&
                      `Cobro protegido, comprobante y reembolso según las reglas de cancelación. Tarifa de servicio del ${SERVICE_FEE_PCT.yappy}% — la más baja.`}
                    {channel === "tarjeta" &&
                      `Cobro protegido por una pasarela certificada — tu tarjeta nunca pasa por nuestros servidores. Tarifa de servicio del ${SERVICE_FEE_PCT.tarjeta}%.`}
                    {channel === "efectivo" &&
                      "Le pagas en la mano (o Yappy directo a su número). Sin tarifa, pero también sin cobro protegido ni comprobante."}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <dl className="mb-4 border-t border-ink-200 pt-3.5 text-[14.5px]">
        <div className="flex justify-between gap-3 py-1">
          <dt className="text-ink-500">
            {seats} × {formatUsd(unitCents)}
            {activeOffer && " (tu oferta)"}
          </dt>
          <dd className="tnum font-semibold">{formatUsd(totalCents)}</dd>
        </div>
        <div className="flex justify-between gap-3 py-1">
          <dt className="text-ink-500">
            {inApp
              ? `Tarifa de servicio (${SERVICE_FEE_PCT[payChannel]}%)`
              : "Tarifa de servicio"}
          </dt>
          <dd className="tnum font-semibold">{formatUsd(feeCents)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-ink-200 py-2">
          <dt className="font-semibold">
            {inApp ? "Pagas en la app" : "Le entregas al conductor"}
          </dt>
          <dd className="tnum font-display text-[19px] font-bold">
            {formatUsd(inApp ? chargedCents : totalCents)}
          </dd>
        </div>
      </dl>

      {/* Le bouton dit ce qu'il fait. Yappy a SON bouton — le bleu marine
          de la marque, les deux bulles — c'est le Botón de Pago que le
          passager retrouvera dans son app. Quand le conducteur doit encore
          accepter, on ne « paie » pas : on demande, le cobro part après
          son OK. */}
      {session ? (
        needsDriverOk || !inApp ? (
          <Button
            size="lg"
            full
            disabled={blocked}
            onClick={confirmBooking}
          >
            {needsDriverOk ? "Pedir el puesto" : "Reservar mi puesto"}
          </Button>
        ) : (
          <button
            disabled={blocked}
            onClick={confirmBooking}
            className={`inline-flex w-full items-center justify-center gap-2.5 rounded-[14px] px-7 py-4 font-display text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 ${
              payChannel === "yappy" ? "bg-[#17529e]" : "bg-ink-900"
            }`}
          >
            {payChannel === "yappy" ? (
              <>
                <YappyBubbles className="h-5 w-auto" />
                Pagar con Yappy · {formatUsd(chargedCents)}
              </>
            ) : (
              <>
                <TarjetaMark className="size-5" />
                Pagar con tarjeta · {formatUsd(chargedCents)}
              </>
            )}
          </button>
        )
      ) : (
        <AuthDialog
          trigger={
            <button
              disabled={blocked}
              className="inline-flex w-full items-center justify-center rounded-[14px] bg-ink-900 px-7 py-4 font-display text-[17px] font-bold text-white transition-colors hover:bg-ink-800 disabled:pointer-events-none disabled:opacity-50"
            >
              Conectarme y reservar
            </button>
          }
        />
      )}

      {/* Pas de « pregúntale al conductor » AVANT de réserver — décision du
          propriétaire : un canal ouvert avant la reserva, c'est la porte à
          « mejor te pago afuera ». Le contact (número, coordination) arrive
          APRÈS la réservation, quand le viaje existe dans la plataforma. */}
      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-ink-500">
        Sin cobros escondidos: lo que ves aquí es exactamente lo que pagas.
      </p>

      <p className="mt-4 rounded-[14px] bg-ink-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-500">
        {bookingDisclaimer(driverName)}
      </p>

      {TRIPS_ARE_DEMO && (
        <p className="mt-3 text-center text-[12.5px] leading-snug text-ink-500">
          {isDemo
            ? "Modo demostración: no se crea ninguna cuenta ni reserva real."
            : "Este conductor es de demostración: tu reserva queda guardada en tu cuenta, pero nadie va a pasar a recogerte todavía."}
        </p>
      )}
    </aside>
  );
}
