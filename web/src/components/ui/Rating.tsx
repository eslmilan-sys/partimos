import { Icon } from "./Icon";

/**
 * LA NOTE DU CONDUCTEUR — la seule étoile dorée du site.
 *
 * Sur toutes les cartes, la note était un chiffre gris à côté d'une
 * étoile grise : la chose qui rassure le plus se lisait comme un détail
 * technique. L'or lui rend son poids — et comme c'est la SEULE chose
 * dorée de l'interface, il n'a besoin d'être ni gros ni clignotant pour
 * se voir.
 *
 * Le dégradé va du jaune chaud au bronze : une étoile en aplat jaune
 * fait autocollant, un dégradé fait métal. Le contour légèrement plus
 * sombre lui donne son arête, et le chiffre reste en encre — c'est une
 * information, pas une décoration.
 */
export function Rating({
  value,
  count,
  size = "sm",
  className = "",
}: {
  value: number;
  /** Nombre de viajes, si on veut dire sur quoi repose la note. */
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  if (value <= 0) return null;
  const star = size === "md" ? "size-[17px]" : "size-3.5";
  const text = size === "md" ? "text-[15px]" : "text-[12.5px]";

  return (
    <span
      className={`tnum inline-flex items-center gap-1 ${text} ${className}`}
    >
      <span aria-hidden className={`relative inline-flex ${star}`}>
        {/* Le dégradé vit dans un SVG à part, en dessous : l'icône par
            -dessus sert de masque par sa forme pleine. Deux couches, un
            seul objet à l'œil. */}
        <svg viewBox="0 0 24 24" className={`absolute inset-0 ${star}`}>
          <defs>
            <linearGradient id="oro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="45%" stopColor="#f5b32a" />
              <stop offset="100%" stopColor="#b8791a" />
            </linearGradient>
          </defs>
          <path
            fill="url(#oro)"
            stroke="#8a5a12"
            strokeWidth="1.1"
            strokeLinejoin="round"
            d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.44l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95z"
          />
        </svg>
      </span>
      <span className="font-semibold text-ink-900">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="font-normal text-ink-500">· {count} viajes</span>
      )}
    </span>
  );
}

/** L'étoile seule, pour les endroits où le chiffre est déjà écrit. */
export function GoldStar({ className = "size-3.5" }: { className?: string }) {
  return (
    <span aria-hidden className={`relative inline-flex ${className}`}>
      <svg viewBox="0 0 24 24" className={`absolute inset-0 ${className}`}>
        <defs>
          <linearGradient id="oro-solo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="45%" stopColor="#f5b32a" />
            <stop offset="100%" stopColor="#b8791a" />
          </linearGradient>
        </defs>
        <path
          fill="url(#oro-solo)"
          stroke="#8a5a12"
          strokeWidth="1.1"
          strokeLinejoin="round"
          d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.44l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95z"
        />
      </svg>
    </span>
  );
}

/** Gardé exporté pour que l'icône grise reste disponible ailleurs. */
export { Icon };
