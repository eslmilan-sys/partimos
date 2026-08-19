import type { ReactNode } from "react";

/**
 * Deux tons, et deux seulement : `light` sur fond blanc ou niebla, `dark` sur
 * fond asphalte. Le ton est une propriété explicite plutôt qu'une classe
 * ajoutée à l'appel — deux classes de couleur sur le même élément se
 * départagent par l'ordre de la feuille de style, pas par l'intention, et
 * c'est comme ça qu'un texte finit gris foncé sur fond gris foncé.
 */
export type Tone = "light" | "dark";

/** Conteneur unique du site : 1120 px, gouttière de 20 px. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1120px] px-5 ${className}`}>
      {children}
    </div>
  );
}

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Apparition à l'entrée dans le champ. À couper au-dessus de la ligne de
   *  flottaison, où il n'y a rien à révéler. */
  reveal?: boolean;
};

export function Section({
  id,
  children,
  className = "",
  reveal = true,
}: SectionProps) {
  return (
    <section id={id} className={`relative py-16 md:py-[76px] ${className}`}>
      <Container>
        <div
          className={["relative z-[2]", reveal && "reveal"]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </Container>
    </section>
  );
}

/** Sur-titre de section. Neutre : il informe, il ne décore pas. */
export function Eyebrow({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <p
      className={`mb-3 flex items-center gap-2.5 text-[11.5px] font-bold tracking-[0.16em] uppercase ${
        tone === "dark" ? "text-night-200" : "text-ink-500"
      }`}
    >
      <span aria-hidden className="h-0.5 w-5.5 rounded-full bg-brand-green" />
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mb-3.5 max-w-[17ch] text-[clamp(28px,5.2vw,44px)] leading-[1.05] font-extrabold ${className}`}
    >
      {children}
    </h2>
  );
}

export function Lead({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={`max-w-[54ch] text-[17px] leading-relaxed ${
        tone === "dark" ? "text-night-200" : "text-ink-500"
      } ${className}`}
    >
      {children}
    </p>
  );
}
