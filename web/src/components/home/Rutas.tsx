import Link from "next/link";
import {
  Section,
  Eyebrow,
  SectionTitle,
  Lead,
} from "@/components/site/Section";
import { CORRIDORS, corridorCap } from "@/lib/corridors";
import { formatDuration, formatUsd } from "@/lib/pricing";
import { Icon } from "@/components/ui/Icon";

export function RutaCard({ slug }: { slug: string }) {
  const corridor = CORRIDORS.find((c) => c.slug === slug);
  if (!corridor) return null;
  const cap = corridorCap(corridor);

  return (
    <Link
      href={`/viajes/${corridor.slug}`}
      className="group flex items-center gap-3.5 rounded-[14px] border border-ink-200 px-4.5 py-4 transition-colors hover:border-accent hover:bg-ink-50"
    >
      <span className="min-w-0 flex-1">
        <b className="block font-display text-[15px] font-bold tracking-[-0.015em]">
          {corridor.origin.shortName} → {corridor.destination.shortName}
        </b>
        <span className="tnum text-[12.5px] text-ink-500">
          {corridor.distanceKm} km ·{" "}
          {formatDuration(corridor.typicalDurationMin)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <b className="tnum block font-display text-base font-bold">
          {formatUsd(cap.maxPriceCents, { compact: true })}
        </b>
        <span className="block text-[11.5px] tracking-wide text-ink-500 uppercase">
          Tope
        </span>
      </span>
      <Icon
        name="arrowRight"
        className="size-4.5 shrink-0 text-ink-300 transition-colors group-hover:text-accent-ink"
      />
    </Link>
  );
}

export function Rutas() {
  return (
    <Section id="rutas">
      <Eyebrow>Rutas</Eyebrow>
      <SectionTitle>Las rutas que más se mueven</SectionTitle>
      <Lead>
        Cada ruta tiene su página — y su vuelta tiene la suya. Quién sale esta
        semana, por dónde recogen y hasta cuánto se puede aportar.
      </Lead>

      <div className="mt-8 grid gap-2.5 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
        {CORRIDORS.filter((c) => !c.isReturn).map((corridor) => (
          <RutaCard key={corridor.slug} slug={corridor.slug} />
        ))}
      </div>

      <Link
        href="/ya"
        className="mt-6 inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline"
      >
        Buscar mi viaje
        <Icon name="arrowRight" className="size-4.5" />
      </Link>
    </Section>
  );
}
