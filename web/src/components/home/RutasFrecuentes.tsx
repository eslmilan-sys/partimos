import Link from "next/link";
import { Section, SectionTitle, Lead } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { ALL_CITIES } from "@/lib/corridors";
import { formatUsd } from "@/lib/pricing";
import { minPriceForPair } from "@/lib/trips";

/**
 * LES RUTAS QUE MÁS SE MUEVEN — la liste des trajets, en vraie section.
 *
 * Elle remplace le bandeau défilant du premier écran : un bandeau montre
 * qu'il se passe quelque chose mais ne se clique pas ; une section se lit,
 * se clique, et donne le chiffre qui décide — « desde $X ».
 *
 * Le « desde » n'est pas décoratif : c'est le PLAFOND le plus bas que la
 * formule autorise sur ce segment (carro le plus sobre, carro rempli),
 * calculé par le même moteur que tout le reste. Pas un prix inventé pour
 * l'affiche — le chiffre qu'on retrouve dans les résultats.
 *
 * Les paires vont du plus court au plus long : La Chorrera et Coronado en
 * tête, parce que ce sont les allers-retours du quotidien — le vendredi
 * soir vers l'intérieur, le dimanche vers la ville.
 */

const PAIRS: { from: string; to: string }[] = [
  { from: "panama-city", to: "la-chorrera" },
  { from: "panama-city", to: "coronado" },
  { from: "panama-city", to: "penonome" },
  { from: "panama-city", to: "santiago" },
  { from: "panama-city", to: "chitre" },
  { from: "panama-city", to: "david" },
];

export function RutasFrecuentes() {
  const rows = PAIRS.map((pair) => {
    const from = ALL_CITIES.find((c) => c.slug === pair.from)!;
    const to = ALL_CITIES.find((c) => c.slug === pair.to)!;
    return { ...pair, fromCity: from, toCity: to, min: minPriceForPair(pair.from, pair.to) };
  }).filter((r) => r.min !== null);

  return (
    <Section id="frecuentes">
      <SectionTitle>Las rutas que más se mueven</SectionTitle>
      <Lead>
        Toca una y ves quién sale, a qué hora y por cuánto. El regreso también
        existe: cada ruta se busca en los dos sentidos.
      </Lead>

      <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <li key={`${row.from}-${row.to}`}>
            <Link
              href={`/buscar?desde=${row.from}&hacia=${row.to}`}
              className="group flex items-center gap-3.5 rounded-[14px] border border-ink-200 bg-white px-4.5 py-3.5 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-card"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[16.5px] font-bold tracking-[-0.02em]">
                  {row.fromCity.shortName} → {row.toCity.shortName}
                </span>
                <span className="tnum block text-[13.5px] text-ink-500">
                  desde {formatUsd(row.min!, { compact: true })} por puesto
                </span>
              </span>
              <Icon
                name="arrowRight"
                className="size-4.5 shrink-0 text-ink-300 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-accent-ink"
              />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[13.5px] leading-relaxed text-ink-500">
        El «desde» sale de la misma fórmula que todo lo demás: el costo real
        del carro más sobrio, repartido con el carro lleno. Nunca sube por
        demanda.
      </p>
    </Section>
  );
}
