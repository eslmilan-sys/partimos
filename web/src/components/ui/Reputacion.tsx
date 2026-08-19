import { Icon } from "./Icon";
import { esTopConductor, type Reputacion as Rep } from "@/lib/conductor";

/**
 * LA NOTE ET LE BADGE — un seul endroit, pour que les cinq écrans qui
 * parlent d'un conducteur racontent la même chose.
 *
 * ─────────────────────────────────────────────────────────────────────
 * L'ÉTOILE, REDESSINÉE. L'ancienne était l'icône générique, en orange
 * vif, à la même taille que le texte : elle criait plus fort que la note
 * elle-même, et l'orange est déjà la couleur des actions de l'app — une
 * étoile orange ressemblait à quelque chose qu'on peut appuyer.
 *
 * La nouvelle est PLEINE, ambrée, légèrement plus petite que le chiffre,
 * et posée sur une ligne de base commune avec lui. Le chiffre domine,
 * l'étoile le qualifie. C'est l'ordre de lecture qu'on veut : « 4,8 »
 * d'abord, « sur cinq » ensuite.
 * ─────────────────────────────────────────────────────────────────────
 */

export function Estrella({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`shrink-0 ${className}`}
      fill="currentColor"
    >
      {/* Une étoile à cinq branches courtes et à pointes arrondies : à
          13 px, les pointes fines de l'icône générique se transformaient
          en bouillie de sous-pixels. */}
      <path
        d="M12 2.6c.4 0 .77.23.95.6l2.4 4.86 5.37.78c.4.06.74.35.87.74.12.4.02.83-.27 1.12l-3.89 3.79.92 5.35c.07.4-.1.81-.43 1.05-.33.24-.77.27-1.13.08L12 18.4l-4.8 2.52c-.36.19-.8.16-1.13-.08a1.06 1.06 0 0 1-.43-1.05l.92-5.35-3.89-3.79a1.06 1.06 0 0 1-.27-1.12c.13-.39.47-.68.87-.74l5.37-.78 2.4-4.86c.18-.37.55-.6.95-.6Z"
      />
    </svg>
  );
}

/**
 * La note d'un conducteur. `viajes` reste optionnel : sur une carte de
 * résultat, la place manque, et le nombre de courses n'est pas ce qui
 * fait choisir à cet instant.
 */
export function Nota({
  rating,
  viajes,
  size = "sm",
}: {
  rating: number;
  viajes?: number;
  size?: "sm" | "md";
}) {
  const chiffre = size === "md" ? "text-[14.5px]" : "text-[13px]";
  const estrella = size === "md" ? "size-[15px]" : "size-[13px]";
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <Estrella className={`${estrella} text-ambar-fuerte`} />
      <span className={`tnum font-semibold text-ink-800 ${chiffre}`}>
        {rating.toFixed(1)}
      </span>
      {viajes !== undefined && (
        <span className={`text-ink-500 ${chiffre}`}>({viajes})</span>
      )}
    </span>
  );
}

/**
 * LE BADGE. Il ne s'affiche que s'il est MÉRITÉ — la règle vit dans
 * lib/conductor.ts et se teste là-bas.
 *
 * Vert et pas orange : l'orange est la couleur de ce qu'on peut appuyer.
 * Un badge n'est pas un bouton, et le confondre avec un fait perdre les
 * deux.
 */
export function BadgeTop({ conductor }: { conductor: Rep }) {
  if (!esTopConductor(conductor)) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-verde-suave px-2 py-0.5 text-[11px] font-bold text-verde-ok">
      <Icon name="shield" className="size-3" />
      Top
    </span>
  );
}
