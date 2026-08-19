/**
 * LES DEUX MOYENS DE PAIEMENT
 *
 * Le paiement se fait hors plateforme, en espèces ou par Yappy. Ces deux
 * marques sont de l'information de premier plan, pas de la décoration :
 * c'est la réponse à « et je paie comment, concrètement ? ».
 *
 * ── SUR LE LOGO YAPPY ─────────────────────────────────────────────────────
 * Yappy est une marque déposée de Banco General. Le tracé ci-dessous est une
 * APPROXIMATION dessinée à la main d'après le logo fourni : deux bulles de
 * conversation, la petite bleue à gauche, la grande orange à droite, et le
 * mot-symbole en bleu marine.
 *
 * Ce n'est pas le fichier officiel et il ne faut pas le prendre pour tel. Dès
 * que tu obtiens le vrai auprès de Banco General :
 *
 *   1. dépose-le dans `public/marks/yappy.svg` ;
 *   2. remplace le contenu de `<YappyMark>` par
 *      `<img src={asset("/marks/yappy.svg")} alt="Yappy" className="h-5" />`.
 *
 * Les couleurs de marque gardent leurs dégradés d'origine. C'est la seule
 * exception à la règle « aucun dégradé » du système : un logo tiers se
 * reproduit tel qu'il est, il ne se réinterprète pas.
 */

/** Une carte bancaire générique — puce et bande, aucune marque de réseau.
 *  Elle existe depuis que le paiement dans l'app accepte la tarjeta. */
export function TarjetaMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 9.6h20" />
      <path d="M5.5 14.6h4" strokeWidth={1.6} />
    </svg>
  );
}

/** Un billet ET une pièce. Aucune marque, donc dessinable sans réserve. */
export function CashMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="1.8" y="6.4" width="16.4" height="10.6" rx="2" />
      <circle cx="10" cy="11.7" r="2.4" />
      <path d="M5.2 11.7h.01M14.8 11.7h.01" />
      {/* La pièce derrière : c'est elle qui fait lire « efectivo ». Un
          rectangle seul se lit comme une carte bancaire — exactement ce que
          Partimos n'accepte pas. */}
      <circle cx="18.6" cy="15.4" r="3.6" />
      <path d="M18.6 13.9v3M17.7 14.7h1.6M17.9 16.1h1.6" strokeWidth={1.5} />
    </svg>
  );
}

/** Les deux bulles, sans le mot-symbole. Pour les usages compacts. */
export function YappyBubbles({ className = "h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 62"
      className={className}
      role="img"
      aria-label="Yappy"
    >
      <defs>
        <linearGradient id="yappy-blue" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#38b6f0" />
          <stop offset="1" stopColor="#1b8fd6" />
        </linearGradient>
        <linearGradient id="yappy-orange" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#fbab3f" />
          <stop offset="1" stopColor="#f47b20" />
        </linearGradient>
      </defs>

      {/* La grande bulle orange, à droite et plus haute. Sa queue descend
          vers la gauche, à la rencontre de l'autre. */}
      <path
        d="M64 4a25 25 0 1 1-16.6 43.7l-9.7 3.1a1.6 1.6 0 0 1-1.9-2.2l3.6-8.2A25 25 0 0 1 64 4z"
        fill="url(#yappy-orange)"
      />

      {/* La petite bulle bleue, à gauche et plus basse. Sa queue pointe vers
          la droite. Dessinée APRÈS, donc par-dessus : c'est l'ordre du logo. */}
      <path
        d="M20 16a17.5 17.5 0 1 1 11.7 30.5l6.9 2.4a1.2 1.2 0 0 0 1.4-1.7l-2.7-6A17.5 17.5 0 0 1 20 16z"
        fill="url(#yappy-blue)"
      />
    </svg>
  );
}

/**
 * Le mot-symbole seul, composé dans la police de titre.
 *
 * Le vrai est un lettrage propriétaire ; celui-ci s'en approche par la
 * rondeur de Gabarito et la bonne couleur de marque, ce qui suffit à le faire
 * lire comme un nom de marque et non comme un mot de la phrase.
 */
export function YappyWord({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-[16.5px] leading-none font-extrabold tracking-[-0.035em] ${className}`}
      style={{ color: "#17529e" }}
    >
      yappy
    </span>
  );
}

/** Le verrou horizontal : bulles + mot, tel qu'il s'emploie dans une puce. */
export function YappyMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <YappyBubbles className="h-[18px] w-auto" />
      <YappyWord />
    </span>
  );
}

/**
 * Le trio, partout où l'on explique le paiement — dans l'ORDRE de la
 * maison : Yappy d'abord (recommandé, tarifa la plus basse), la tarjeta
 * ensuite, l'efectivo en dernier. Le cash reste possible, il n'ouvre
 * plus la marche.
 *
 * Les puces sont sur fond BLANC même dans la section sombre : une marque
 * tierce garde ses couleurs, et l'orange de Yappy sur le brun de la section
 * deviendrait illisible. Un fond blanc est aussi la façon dont un logo se pose
 * partout ailleurs — sur un terminal, sur une vitrine.
 */
export function PayMarks() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2.5">
      <li className="flex items-center gap-2.5 rounded-[14px] border border-ink-200 bg-white px-4 py-2.5 text-ink-900">
        <YappyMark />
        <span className="text-[13.5px] font-semibold text-ink-600">
          en la app o a su número
        </span>
      </li>
      <li className="flex items-center gap-2.5 rounded-[14px] border border-ink-200 bg-white px-4 py-2.5 text-ink-900">
        <TarjetaMark className="size-5 shrink-0 text-ink-600" />
        <span className="text-[13.5px] font-semibold">Tarjeta en la app</span>
      </li>
      <li className="flex items-center gap-2.5 rounded-[14px] border border-ink-200 bg-white px-4 py-2.5 text-ink-900">
        <CashMark className="size-5 shrink-0 text-ink-600" />
        <span className="text-[13.5px] font-semibold">
          Efectivo el día del viaje
        </span>
      </li>
    </ul>
  );
}
