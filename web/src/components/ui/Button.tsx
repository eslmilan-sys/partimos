import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Boutons — trois variantes, pas plus.
 *
 * L'action principale est de l'ENCRE, pas de la couleur : un aplat d'asphalte
 * sur fond clair, du blanc sur fond sombre. C'est le contraste le plus élevé
 * possible, et cela libère le bleu pour signaler ce qui est cliquable ailleurs.
 * Le dégradé de marque ne sert jamais de fond de bouton — répété six fois sur
 * une page, il cesse d'être une signature et devient du bruit.
 */

type Variant = "primary" | "secondary" | "onDark";
type Size = "sm" | "md" | "lg";

/**
 * `inline-flex` est posé ici, donc passer `hidden` par `className` NE MARCHE
 * PAS : les deux utilitaires visent `display`, et c'est l'ordre de la feuille
 * de style qui tranche, pas l'ordre des classes. Pour masquer un bouton selon
 * la taille d'écran, envelopper l'appel dans un élément qui porte la règle.
 * `whitespace-nowrap` garantit qu'un libellé ne passe jamais sur deux lignes.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-bold tracking-[-0.01em] " +
  "rounded-[14px] transition-[transform,background-color,border-color,box-shadow] duration-150 " +
  "active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none select-none";

/**
 * L'action principale est de l'ENCRE — blanc sur asphalte (décision du
 * propriétaire, 2026-08-12 : « l'orange avec des lettres noires, c'est
 * moche »). Le contraste est maximal (14:1), le bouton sombre se
 * distingue de tout le reste de la page claire, et l'ambre redevient ce
 * qu'il est ailleurs : un ACCENT — le rectangle du hero, les insignes,
 * jamais un fond de bouton.
 *
 * `active:scale-[0.97]` : la réponse tactile recommandée par la base de
 * règles. Sur mobile il n'y a pas de survol — sans réponse au doigt, un
 * bouton donne l'impression de n'avoir rien fait.
 */
const VARIANTS: Record<Variant, string> = {
  /* L'ORANGE DE LA MARQUE, comme dans l'app. Il était noir ici : deux
     boutons principaux de deux couleurs sur le même produit, c'est la
     première chose qu'on remarque. Le relief vit dans `.cta-naranja`
     (globals.css), en un seul endroit pour les deux moitiés. */
  primary: "cta-naranja",
  secondary:
    "bg-white text-ink-900 border-[1.5px] border-ink-200 hover:border-accent hover:text-accent-ink active:scale-[0.97]",
  onDark:
    "bg-white text-ink-900 shadow-[0_10px_26px_-10px_rgb(0_0_0/0.55)] hover:bg-ink-50 hover:-translate-y-px active:scale-[0.97]",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2.5 text-[14.5px] rounded-[10px]",
  md: "px-5.5 py-3.5 text-[16.5px]",
  lg: "px-7 py-4 text-[17px]",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
  className?: string;
};

function classes({
  variant = "primary",
  size = "md",
  full,
  className,
}: BaseProps) {
  return [BASE, VARIANTS[variant], SIZES[size], full && "w-full", className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  full,
  className,
  children,
  ...rest
}: BaseProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button
      className={classes({ variant, size, full, className, children })}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  full,
  className,
  children,
  href,
  ...rest
}: BaseProps & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link
      href={href}
      className={classes({ variant, size, full, className, children })}
      {...rest}
    >
      {children}
    </Link>
  );
}
