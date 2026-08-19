import type { ReactNode } from "react";
import { Container } from "./Section";

/**
 * Gabarit des pages légales : une colonne de 68 caractères, une hiérarchie
 * de deux niveaux, rien d'autre. Un texte juridique se lit, il ne se décore
 * pas.
 */
export function LegalPage({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  updatedAt: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <>
      <main id="contenido">
        <div className="noche cima-app pt-10 pb-11 text-white">
          <Container>
            <h1 className="mb-4 max-w-[18ch] text-[clamp(30px,5.6vw,44px)] leading-[1.05] font-extrabold tracking-[-0.04em]">
              {title}
            </h1>
            <p className="max-w-[56ch] text-[16.5px] leading-relaxed text-night-200">
              {intro}
            </p>
            <p className="mt-5 text-[12.5px] tracking-wide text-night-300 uppercase">
              Última actualización: {updatedAt}
            </p>
          </Container>
        </div>

        <div className="py-12 md:py-16">
          <Container>
            <div className="max-w-[68ch] [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:first:mt-0 [&_li]:mb-1.5 [&_p]:mb-4 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-ink-500 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-[15px] [&_ul]:leading-relaxed [&_ul]:text-ink-500">
              {children}
            </div>
          </Container>
        </div>
      </main>
    </>
  );
}

/**
 * Bandeau de relecture juridique. La consultation d'un avocat spécialisé en
 * droit du transport panaméen est une étape ⛔ HUMAIN du brief (§9.6) : tant
 * qu'elle n'a pas eu lieu, ces textes sont un point de départ rédigé à partir
 * du modèle, pas un avis juridique. Retirer ce bandeau une fois validé.
 */
export function PendingLegalReview() {
  return (
    <div className="mb-8 rounded-[14px] border border-ink-200 bg-ink-50 px-5 py-4">
      <p className="text-[14.5px] leading-relaxed text-ink-500">
        <b className="font-semibold text-ink-900">
          Borrador pendiente de revisión.
        </b>{" "}
        Este texto describe fielmente cómo funciona la plataforma, pero todavía
        no ha sido validado por un abogado especializado en transporte en
        Panamá. No lo publiques como versión definitiva sin esa revisión.
      </p>
    </div>
  );
}
