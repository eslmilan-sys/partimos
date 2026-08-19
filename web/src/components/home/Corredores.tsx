import Link from "next/link";
import { Container } from "@/components/site/Section";
import { CORRIDORS, corridorCap } from "@/lib/corridors";
import { formatDuration, formatUsd } from "@/lib/pricing";

/**
 * LES SIX ROUTES — une échelle, pas un tableau.
 *
 * Le tableau à cinq colonnes obligeait à défiler vers la droite sur
 * téléphone, et les deux colonnes qui le justifiaient — l'aporte et le
 * comparatif bus — étaient précisément celles qu'on ne voyait jamais.
 *
 * Passer en cartes aurait ramené la grille de cartes identiques, déjà
 * rejetée deux fois. Deux constats ont donné la forme :
 *
 *   1. La liste montre les six ALLERS — chaque retour a sa page, dite une
 *      fois en tête. Douze lignes où six suffisent seraient du bruit, et
 *      chaque ligne n'a qu'une destination à porter.
 *   2. Ce qu'on compare ici, c'est une distance et un aporte. Une piste de
 *      largeur FIXE, remplie proportionnellement, se compare d'un coup d'œil —
 *      un trait de longueur variable, lui, laissait une demi-ligne morte
 *      entre sa fin et le prix.
 *
 * David remplit la piste entière, Coronado un cinquième : on lit l'échelle du
 * pays sans lire un seul chiffre. C'est l'un des DEUX seuls usages du trait
 * pointillé ambre (l'autre : le geste Tú ──▸ A du paiement). Un motif répété
 * partout cesse d'être une signature — le client l'a dit.
 */
export function Corredores() {
  const rows = CORRIDORS.filter((c) => !c.isReturn).sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );
  const maxKm = Math.max(...rows.map((c) => c.distanceKm));

  return (
    <section className="border-t border-ink-200 py-14 sm:py-20">
      <Container>
        <div className="relative z-[2]">
          <div className="mb-8 max-w-[52ch]">
            <h2 className="font-display text-[clamp(28px,4.2vw,40px)] leading-[1.08] font-extrabold tracking-[-0.03em]">
              Las seis rutas abiertas
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
              Conectan Ciudad de Panamá con el interior, y cada una tiene su
              vuelta con página propia. El tope se calcula con un carro estándar
              y tres puestos — con menos puestos sube, porque hay menos gente
              entre quien repartir el mismo costo.
            </p>
          </div>

          <ul>
            {rows.map((corridor) => {
              const cap = corridorCap(corridor);
              const pct = (corridor.distanceKm / maxKm) * 100;

              return (
                <li key={corridor.slug} className="border-t border-ink-200">
                  <Link
                    href={`/viajes/${corridor.slug}`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 py-4 transition-colors hover:bg-ink-100/70 sm:grid-cols-[minmax(132px,1.1fr)_minmax(120px,2fr)_auto] sm:py-[18px]"
                  >
                    <span className="min-w-0">
                      <b className="block font-display text-[17px] leading-tight font-bold tracking-[-0.02em] decoration-action decoration-2 underline-offset-4 group-hover:underline">
                        {corridor.destination.shortName}
                      </b>
                      <span className="tnum mt-0.5 block text-[12.5px] text-ink-500">
                        {corridor.distanceKm} km ·{" "}
                        {formatDuration(corridor.typicalDurationMin)}
                      </span>
                    </span>

                    {/* LA PISTE. Largeur fixe, remplissage proportionnel : les
                        six lignes se comparent sur la même règle. Ordre 3 sur
                        téléphone pour qu'elle passe sous les deux colonnes.

                        Ce qui la rend agréable à regarder, dans l'ordre :
                          · le rail creux est un trait FIN et clair, la route
                            un trait ÉPAIS — c'est le contraste d'épaisseur qui
                            fait lire le remplissage, pas la couleur ;
                          · la route est un dégradé ambre clair → ambre profond
                            dans le sens de la marche, donc elle a une
                            direction ; les tirets sont découpés au `mask`, ce
                            qui les garde nets à toutes les largeurs ;
                          · les deux extrémités ne sont pas le même objet : un
                            anneau creux pour le départ, un disque plein cerclé
                            de blanc pour l'arrivée. On sait où on va. */}
                    <span
                      aria-hidden
                      className="relative order-3 col-span-2 flex h-4 items-center sm:order-none sm:col-span-1"
                    >
                      <i className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-ink-200" />
                      <i
                        className="ruta-trait absolute top-1/2 left-0 h-[5px] -translate-y-1/2 rounded-full transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                      <i className="absolute top-1/2 left-0 size-[11px] -translate-y-1/2 rounded-full border-[2.5px] border-ink-900 bg-ink-50" />
                      <i
                        className="pista-llegada absolute top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-action-deep shadow-[0_0_0_3px_var(--color-ink-50),0_2px_6px_rgb(180_83_9/0.35)] transition-transform duration-300 group-hover:scale-115"
                        style={{ left: `${pct}%` }}
                      />
                    </span>

                    <span className="text-right">
                      <span className="tnum block font-display text-[22px] leading-none font-extrabold tracking-[-0.03em] text-action-ink">
                        {formatUsd(cap.maxPriceCents)}
                      </span>
                      <span className="mt-1 block text-[11.5px] text-ink-500">
                        aporte máx.
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 max-w-[62ch] border-t border-ink-200 pt-5 text-[13.5px] leading-relaxed text-ink-500">
            Vas sentado desde el primer minuto, con tu maleta atrás y una sola
            parada: la tuya. Cada viaje sale a la hora que puso su conductor al
            publicarlo — tú escoges el que te calce, y el aporte no cambia ni
            por la fecha ni por la demanda.
          </p>
        </div>
      </Container>
    </section>
  );
}
