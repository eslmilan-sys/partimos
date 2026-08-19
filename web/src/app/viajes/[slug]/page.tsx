import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/site/Section";
import { RutaCard } from "@/components/home/Rutas";
import { FaqList, FaqJsonLd } from "@/components/home/Faq";
import { AvisameForm } from "@/components/AvisameForm";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StickyCta } from "@/components/StickyCta";
import {
  CORRIDORS,
  corridorCap,
  getCorridor,
  getRelatedCorridors,
  getReverseCorridor,
  type Corridor,
} from "@/lib/corridors";
import { formatDuration, formatUsd } from "@/lib/pricing";
import { getUpcomingTrips } from "@/lib/supabase";
import { canonical } from "@/lib/site";
import type { Faq } from "@/lib/content";

/**
 * PAGE CORRIDOR — le canal d'acquisition n°1.
 *
 * Générée statiquement depuis le référentiel des corridors, revalidée toutes
 * les heures : le contenu éditorial (distance, plafond, points de prise en
 * charge, FAQ) est figé au build, les départs réels sont rafraîchis.
 *
 * Une seule URL canonique par corridor. Le corridor inverse est une page
 * distincte avec son propre contenu — jamais deux URL pour le même contenu.
 */

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return CORRIDORS.map((corridor) => ({ slug: corridor.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const corridor = getCorridor(slug);
  if (!corridor) return {};

  const cap = corridorCap(corridor);
  const title = `Carro compartido ${corridor.origin.shortName} → ${corridor.destination.shortName}`;
  const description =
    `Viajes compartidos de ${corridor.origin.name} a ${corridor.destination.name}: ` +
    `${corridor.distanceKm} km, ${formatDuration(corridor.typicalDurationMin)} de camino y un aporte de hasta ` +
    `${formatUsd(cap.maxPriceCents, { compact: true })} por puesto. Le pagas directo al conductor.`;

  return {
    title,
    description,
    alternates: { canonical: canonical(`/viajes/${corridor.slug}`) },
    openGraph: {
      title: `${title} | Partimos`,
      description,
      url: canonical(`/viajes/${corridor.slug}`),
    },
  };
}

function corridorFaq(corridor: Corridor): Faq[] {
  const cap = corridorCap(corridor);
  const reverse = getReverseCorridor(corridor);

  return [
    {
      q: `¿Cuánto se aporta de ${corridor.origin.shortName} a ${corridor.destination.shortName}?`,
      a:
        `Hasta ${formatUsd(cap.maxPriceCents)} por puesto en un carro estándar con tres puestos ofrecidos. ` +
        `Ese es el tope: sale de dividir el costo real del recorrido — ${corridor.distanceKm} km más peajes — ` +
        `entre los ${cap.occupants} ocupantes del carro, incluido el conductor. Un conductor puede pedir menos, nunca más.`,
    },
    {
      q: `¿Cuánto se demora el viaje?`,
      a: `Unas ${formatDuration(corridor.typicalDurationMin)} de carretera en condiciones normales. Los viernes en la tarde y los domingos al final del día suele haber más tráfico saliendo y entrando a la ciudad.`,
    },
    {
      q: `¿Dónde recogen en ${corridor.origin.shortName}?`,
      a: `En los puntos por donde el conductor ya va a pasar: ${corridor.pickupPoints.slice(0, 3).join(", ")}. Cada viaje tiene máximo cuatro paradas y ninguna es una terminal de buses. Si ninguna te sirve, puedes proponer la tuya y el conductor te dice si le queda de paso.`,
    },
    {
      q: `¿Por qué ir en carro y no de otra forma?`,
      a: `Porque el viaje se te hace corto. Vas sentado desde que te montas, con tu maleta atrás, aire acondicionado y una sola parada: la tuya. Cada viaje sale a la hora que su conductor publicó: escoges el que te calce, te recogen cerca y te bajas cerca de donde vas.`,
    },
    {
      q: `¿Y para volver de ${corridor.destination.shortName}?`,
      a: reverse
        ? `Es otra ruta con su propia página: mira los viajes de ${corridor.destination.shortName} a ${corridor.origin.shortName}. Muchos conductores publican la ida y la vuelta el mismo fin de semana.`
        : `Muchos conductores publican también el regreso. Busca la ruta al revés en el buscador y, si todavía no hay nada, déjanos tu número y te avisamos.`,
    },
  ];
}

export default async function CorridorPage({ params }: Params) {
  const { slug } = await params;
  const corridor = getCorridor(slug);
  if (!corridor) notFound();

  const cap = corridorCap(corridor);
  const trips = await getUpcomingTrips(corridor.slug);
  const faq = corridorFaq(corridor);
  const related = getRelatedCorridors(corridor);
  const reverse = getReverseCorridor(corridor);

  const tripJsonLd = {
    "@context": "https://schema.org",
    "@type": "Trip",
    name: `Carro compartido ${corridor.origin.name} → ${corridor.destination.name}`,
    description: corridor.intro,
    url: canonical(`/viajes/${corridor.slug}`),
    provider: { "@type": "Organization", name: "Partimos" },
    itinerary: {
      "@type": "ItemList",
      numberOfItems: 2,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: { "@type": "City", name: corridor.origin.name },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: { "@type": "City", name: corridor.destination.name },
        },
      ],
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (cap.maxPriceCents / 100).toFixed(2),
      description:
        "Aporte máximo por puesto. Se paga directamente al conductor, en efectivo o por Yappy.",
    },
  };

  return (
    <>
      {/* ---------- En-tête ---------- */}
      <main id="contenido">
        <div id="ruta-hero" className="noche cima-app pt-8 pb-11 text-white">
          <Container>
            <nav
              aria-label="Ruta de navegación"
              className="mb-5 text-[13.5px] text-night-300"
            >
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="block py-1 hover:text-white">
                    Inicio
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/viajes" className="block py-1 hover:text-white">
                    Rutas
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-night-200">
                  {corridor.origin.shortName} → {corridor.destination.shortName}
                </li>
              </ol>
            </nav>

            <p className="mb-3 text-[11.5px] font-bold tracking-[0.16em] text-night-300 uppercase">
              {corridor.origin.province} → {corridor.destination.province}
            </p>
            <h1 className="mb-4 max-w-[18ch] text-[clamp(32px,6.4vw,54px)] leading-[1.02] font-extrabold tracking-[-0.04em]">
              Carro compartido {corridor.origin.shortName} →{" "}
              {corridor.destination.shortName}
            </h1>
            <p className="max-w-[58ch] text-[16.5px] leading-relaxed text-night-200">
              {corridor.intro}
            </p>

            {/* Les chiffres sur un plateau de verre, pas derrière un filet :
                même matière que le plateau de paiement de l'accueil — le
                verre est le langage des objets posés sur la nuit. */}
            <dl className="glass-noche mt-7 grid grid-cols-2 gap-x-5 gap-y-4 rounded-[20px] border border-white/20 px-5 py-5 min-[760px]:grid-cols-4">
              <Stat label="Distancia" value={`${corridor.distanceKm} km`} />
              <Stat
                label="Tiempo de camino"
                value={formatDuration(corridor.typicalDurationMin)}
              />
              <Stat
                label="Tope por puesto"
                value={formatUsd(cap.maxPriceCents)}
                hint="Carro estándar, 3 puestos"
              />
              <Stat label="Paradas" value="1" hint="La tuya. Sin transbordos" />
            </dl>
          </Container>
        </div>

        <div>
          {/* ---------- Prochains départs ---------- */}
          <section className="py-12 md:py-16">
            <Container>
              <Eyebrow>Próximas salidas</Eyebrow>
              <h2 className="mb-6 text-[clamp(24px,4vw,34px)] font-extrabold">
                {trips.length > 0
                  ? "Quién sale para allá"
                  : "Todavía no hay viajes publicados"}
              </h2>

              {trips.length > 0 ? (
                <ul className="grid gap-2.5 min-[760px]:grid-cols-2">
                  {trips.map((trip) => (
                    <li
                      key={trip.id}
                      className="flex items-center gap-3.5 rounded-[14px] border border-ink-200 px-4.5 py-4"
                    >
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full font-display font-bold text-ink-50 bg-ink-900"
                      >
                        {trip.driverFirstName.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block font-display text-[15px] font-bold">
                          {trip.driverFirstName}{" "}
                          {trip.driverLastInitial
                            ? `${trip.driverLastInitial}.`
                            : ""}
                        </b>
                        <span className="tnum text-[12.5px] text-ink-500">
                          {new Intl.DateTimeFormat("es-PA", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(trip.departureAt))}{" "}
                          ·{" "}
                          {trip.seatsAvailable === 1
                            ? "1 puesto"
                            : `${trip.seatsAvailable} puestos`}
                        </span>
                      </span>
                      <b className="tnum shrink-0 font-display text-base font-bold">
                        {formatUsd(trip.priceCents, { compact: true })}
                      </b>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="max-w-[560px] rounded-[20px] border border-ink-200 bg-ink-50 p-6">
                  <p className="mb-4 text-[15px] leading-relaxed text-ink-500">
                    Nadie ha publicado esta ruta todavía. Déjanos tu número: le
                    avisamos a los conductores que hacen{" "}
                    {corridor.origin.shortName} →{" "}
                    {corridor.destination.shortName} que hay gente esperando, y
                    te escribimos apenas alguien salga.
                  </p>
                  <AvisameForm
                    originSlug={corridor.origin.slug}
                    destinationSlug={corridor.destination.slug}
                    corridorSlug={corridor.slug}
                    requestedDate={new Date().toISOString().slice(0, 10)}
                    source={`corridor:${corridor.slug}`}
                  />
                </div>
              )}
            </Container>
          </section>

          {/* ---------- Prix + points de prise en charge ---------- */}
          <section className="bg-ink-50 py-12 md:py-16">
            <Container>
              <div className="grid gap-9 min-[900px]:grid-cols-2 min-[900px]:gap-12">
                <div>
                  <Eyebrow>El aporte</Eyebrow>
                  <h2 className="mb-4 text-[clamp(24px,4vw,34px)] font-extrabold">
                    Cómo se calcula el tope
                  </h2>
                  <p className="mb-6 max-w-[46ch] text-[15px] leading-relaxed text-ink-500">
                    El costo real del recorrido se reparte entre todos los
                    ocupantes del carro, incluido el conductor. Nadie gana
                    plata: el conductor recupera una parte de lo que iba a
                    gastar igual.
                  </p>

                  <dl className="rounded-[20px] border border-ink-200 bg-white p-5 text-[14.5px]">
                    <CalcRow label={`${corridor.distanceKm} km × $0.25/km`}>
                      {formatUsd(Math.round(corridor.distanceKm * 25))}
                    </CalcRow>
                    <CalcRow label="Margen 10 % por desvíos de recogida">
                      {formatUsd(
                        Math.round(corridor.distanceKm * 25 * 1.1) -
                          Math.round(corridor.distanceKm * 25),
                      )}
                    </CalcRow>
                    <CalcRow label="Peajes del corredor">
                      {formatUsd(corridor.tollCents)}
                    </CalcRow>
                    <CalcRow label="Costo total del viaje" strong>
                      {formatUsd(cap.costTotalCents)}
                    </CalcRow>
                    <CalcRow
                      label={`Dividido entre ${cap.occupants} ocupantes`}
                      strong
                    >
                      {formatUsd(cap.maxPriceCents)} por puesto
                    </CalcRow>
                    <CalcRow label="El conductor sigue poniendo">
                      {formatUsd(cap.driverShareCents)}
                    </CalcRow>
                  </dl>

                  <p className="mt-4 text-[13.5px] leading-relaxed text-ink-500">
                    El «+1» del divisor es el conductor. Por eso, aunque lleve
                    el carro lleno, siempre termina poniendo parte del viaje de
                    su bolsillo — y por eso esto es compartir gastos y no cobrar
                    un pasaje.
                  </p>
                </div>

                <div>
                  <Eyebrow>Dónde te recogen</Eyebrow>
                  <h2 className="mb-4 text-[clamp(24px,4vw,34px)] font-extrabold">
                    Puntos habituales
                  </h2>
                  {/* La vraie carte, en image statique : le tracé ambre sur
                      le pays réel, rendu par Mapbox et mis en cache par son
                      CDN — zéro JavaScript embarqué. Le langage est celui du
                      site : bleu = origine, vert = destination. */}
                  {/* LE SÉLECTEUR DE POINTS A ÉTÉ RETIRÉ, avec la liste
                      fabriquée qu'il affichait.

                      C'était une SECONDE implémentation des trois mêmes
                      points en dur — « Costa del Este », « Albrook »,
                      « Vía Centenario » — sur une page dont le rôle est
                      d'amener quelqu'un à s'inscrire. Elle annonçait donc
                      une expérience qui n'existe plus dans l'app, ce qui
                      est pire que de ne rien annoncer : la promesse se
                      découvre fausse à la première réservation. */}
                  <p className="mb-6 max-w-[46ch] text-[15px] leading-relaxed text-ink-500">
                    Dices dónde estás exactamente y el conductor te dice si le
                    queda de paso. Máximo cuatro paradas por viaje, y ninguna
                    en una terminal.
                  </p>

                  <div className="mt-5 flex items-start gap-3.5 rounded-[20px] border border-ink-200 bg-white px-5 py-4.5">
                    <Icon
                      name="car"
                      className="mt-0.5 size-5 shrink-0 text-action-ink"
                    />
                    <p className="text-[14.5px] leading-relaxed text-ink-500">
                      <b className="font-semibold text-ink-900">
                        Te recogen y te dejan
                      </b>
                      <br />
                      Sin cargar la maleta hasta una terminal ni esperar de pie.
                      Te montas donde acordaron y te bajas cerca de donde vas.
                    </p>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* ---------- FAQ locale ---------- */}
          <section className="py-12 md:py-16">
            <Container>
              <Eyebrow>Preguntas sobre esta ruta</Eyebrow>
              <h2 className="text-[clamp(24px,4vw,34px)] font-extrabold">
                {corridor.origin.shortName} → {corridor.destination.shortName},
                en corto
              </h2>
              <FaqList items={faq} />
            </Container>
          </section>

          {/* ---------- Maillage interne ---------- */}
          <section className="pb-16">
            <Container>
              <h2 className="mb-5 font-display text-xl font-bold">
                Otras rutas
              </h2>
              <div className="grid gap-2.5 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
                {related.map((item) => (
                  <RutaCard key={item.slug} slug={item.slug} />
                ))}
              </div>
              {reverse && (
                <p className="mt-5 text-[15px] text-ink-500">
                  ¿Buscas el regreso?{" "}
                  <Link
                    href={`/viajes/${reverse.slug}`}
                    className="font-semibold text-accent-ink hover:underline"
                  >
                    {reverse.origin.shortName} → {reverse.destination.shortName}
                  </Link>
                </p>
              )}

              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/ya" size="lg">
                  Buscar puesto
                </ButtonLink>
                <ButtonLink
                  href={`/publicar/nuevo?ruta=${corridor.slug}`}
                  variant="secondary"
                  size="lg"
                >
                  Publicar este viaje
                </ButtonLink>
              </div>
            </Container>
          </section>
        </div>
      </main>

      <StickyCta watch="#ruta-hero" />
      <FaqJsonLd items={faq} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd) }}
      />
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold tracking-[0.11em] text-night-200 uppercase">
        {label}
      </dt>
      <dd className="tnum font-display text-[22px] font-bold tracking-[-0.02em]">
        {value}
      </dd>
      {hint && <dd className="text-[12.5px] text-night-200">{hint}</dd>}
    </div>
  );
}

function CalcRow({
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
