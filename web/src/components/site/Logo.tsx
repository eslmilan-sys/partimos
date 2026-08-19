import Link from "next/link";

/**
 * La marque : goutte + point de rendez-vous. C'est le seul endroit de
 * l'interface où le dégradé porte systématiquement du sens.
 *
 * `gradientId` doit être unique par instance : deux `<linearGradient>` de
 * même id dans un document et le navigateur n'en applique qu'un.
 */
export function LogoMark({
  className = "h-[31px] w-[26px]",
  gradientId = "partimos-brand",
  dotColor = "#fff",
}: {
  className?: string;
  gradientId?: string;
  dotColor?: string;
}) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#20A8F8" />
          <stop offset="1" stopColor="#A0D838" />
        </linearGradient>
      </defs>
      <path
        d="M50 3C26 3 7 22 7 46c0 32 43 71 43 71s43-39 43-71C93 22 74 3 50 3z"
        fill={`url(#${gradientId})`}
      />
      <circle cx="50" cy="43" r="15" fill={dotColor} />
    </svg>
  );
}

export function Logo({
  gradientId,
  dotColor,
  className = "",
}: {
  gradientId?: string;
  dotColor?: string;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-2.5 ${className}`}
      aria-label="Partimos — inicio"
    >
      <LogoMark gradientId={gradientId} dotColor={dotColor} />
      <span className="font-display text-[22px] font-extrabold tracking-[-0.03em]">
        Partimos
      </span>
    </Link>
  );
}
