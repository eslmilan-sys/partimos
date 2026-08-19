import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import { TripDetail } from "@/components/trip/TripDetail";
import { Viaje } from "@/components/app/Viaje";
import { getCorridor } from "@/lib/corridors";
import { demoTripIds, getTrip } from "@/lib/trips";
import { esTopConductor } from "@/lib/conductor";

export const dynamicParams = false;

export function generateStaticParams() {
  return demoTripIds().map((id) => ({ id }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const trip = getTrip(id);
  const corridor = trip && getCorridor(trip.corridorSlug);
  if (!trip || !corridor) return {};
  return {
    title: `${corridor.origin.shortName} → ${corridor.destination.shortName} con ${trip.driver.firstName}`,
    robots: { index: false, follow: true },
  };
}

export default async function TripPage({ params }: Params) {
  const { id } = await params;
  const trip = getTrip(id);
  if (!trip) notFound();
  const corridor = getCorridor(trip.corridorSlug);
  if (!corridor) notFound();

  const date = trip.departureAt.slice(0, 10);

  return (
    <main id="contenido" className="bg-ink-50 pb-16">
      {/* LA FICHE, VERSION APP. Même trajet, même moteur de prix, même
          panneau de réservation — une autre mise en page, celle d'un
          écran qu'on tient à la main. Le HTML servi contient les deux :
          `.solo-app` / `.solo-web` ne choisissent qu'à l'affichage. */}
      <div className="solo-app">
        <Suspense fallback={<DetailSkeleton />}>
          <Viaje trip={trip} corridor={corridor} />
        </Suspense>
      </div>

      <Container className="solo-web pt-5">
        <nav
          aria-label="Ruta de navegación"
          className="mb-4 text-[13.5px] text-ink-500"
        >
          <Link
            href={`/buscar?desde=${corridor.origin.slug}&hacia=${corridor.destination.slug}&fecha=${date}`}
            className="inline-flex items-center gap-1.5 py-1 font-semibold hover:text-ink-900"
          >
            <Icon name="arrowRight" className="size-4 rotate-180" />
            Volver a los resultados
          </Link>
        </nav>

        {/* Le segment réservé vient de l'URL, donc du client. Le repli montre
            la structure de la page pendant l'hydratation plutôt qu'un vide qui
            ferait sauter la mise en page. */}
        <Suspense fallback={<DetailSkeleton />}>
          <TripDetail trip={trip} corridor={corridor}>
            <section className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 font-display text-[19px] font-bold">
                Quién maneja
              </h2>
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-full font-display text-[22px] font-bold text-ink-50 bg-ink-900"
                >
                  {trip.driver.initial}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[19px] font-bold">
                    {trip.driver.firstName} {trip.driver.lastInitial}.
                  </p>
                  <p className="tnum flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13.5px] text-ink-500">
                    <Rating
                      value={trip.driver.rating}
                      count={trip.driver.ridesCount}
                      size="md"
                    />
                  </p>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 border-t border-ink-200 pt-4">
                {/* Sans condition : personne ne publie sans cédula ET
                    licencia vérifiées. La ligne énonce la règle de la
                    maison, elle ne distingue pas ce conducteur-ci. */}
                <Badge icon="id">
                  Cédula y licencia verificadas por un proveedor externo — sin
                  eso no se puede publicar
                </Badge>
                {esTopConductor(trip.driver) && (
                  <Badge icon="star">
                    Top conductor — {trip.driver.ridesCount} viajes,{" "}
                    {trip.driver.rating.toFixed(1)} de nota
                  </Badge>
                )}
                <Badge icon="car">
                  {trip.vehicle.make} {trip.vehicle.model} {trip.vehicle.year},{" "}
                  {trip.vehicle.color} — el aporte se calcula con este carro
                </Badge>
                {trip.womenOnly && (
                  <Badge icon="users">Este viaje es solo para mujeres</Badge>
                )}
              </ul>
            </section>
          </TripDetail>
        </Suspense>
      </Container>
    </main>
  );
}

function DetailSkeleton() {
  return (
    <div
      aria-hidden
      className="grid gap-5 min-[900px]:grid-cols-[1.35fr_1fr] min-[900px]:items-start"
    >
      <div className="grid gap-5">
        <div className="h-[340px] rounded-[20px] border border-ink-200 bg-white" />
        <div className="h-[220px] rounded-[20px] border border-ink-200 bg-white" />
        <div className="h-[260px] rounded-[20px] border border-ink-200 bg-white" />
      </div>
      <div className="h-[520px] rounded-[20px] border border-ink-200 bg-white" />
    </div>
  );
}

function Badge({
  icon,
  children,
}: {
  icon: "id" | "star" | "car" | "users";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5 text-[14.5px] text-ink-600">
      <Icon name={icon} className="size-4.5 shrink-0 text-ink-500" />
      {children}
    </li>
  );
}
