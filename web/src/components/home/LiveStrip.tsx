/**
 * Bandeau des viajes publiés — preuve de vie de la plateforme.
 *
 * Les cartes sont volontairement NON cliquables. Une cible qui défile en
 * continu se rate au doigt : au survol l'animation se met en pause, mais sur
 * un écran tactile il n'y a pas de survol, et la carte se dérobe sous le
 * pouce. Le bandeau montre qu'il se passe quelque chose ; la section « Rutas »
 * juste en dessous est là pour cliquer.
 *
 * La liste est dupliquée pour boucler sans saut, et le second jeu est masqué
 * aux lecteurs d'écran. L'animation disparaît sous `prefers-reduced-motion`.
 */

const TRIPS = [
  {
    initial: "A",
    route: "Panamá → Chitré",
    when: "Vie 6:00 · 2 puestos",
    price: "$13",
    slug: "panama-chitre",
  },
  {
    initial: "J",
    route: "Panamá → David",
    when: "Vie 5:30 · 3 puestos",
    price: "$21",
    slug: "panama-david",
  },
  {
    initial: "Y",
    route: "Panamá → Las Tablas",
    when: "Vie 17:00 · 2 puestos",
    price: "$14",
    slug: "panama-las-tablas",
  },
  {
    initial: "C",
    route: "Panamá → Penonomé",
    when: "Sáb 8:00 · 1 puesto",
    price: "$8",
    slug: "panama-penonome",
  },
  {
    initial: "R",
    route: "Panamá → Santiago",
    when: "Dom 15:00 · 3 puestos",
    price: "$13",
    slug: "panama-santiago",
  },
  {
    initial: "M",
    route: "Panamá → Coronado",
    when: "Sáb 7:30 · 2 puestos",
    price: "$5",
    slug: "panama-coronado",
  },
];

function Card({
  trip,
  clone,
}: {
  trip: (typeof TRIPS)[number];
  clone?: boolean;
}) {
  return (
    <li
      aria-hidden={clone}
      className="flex shrink-0 items-center gap-2.5 rounded-[14px] border border-ink-200 bg-white/70 px-3.5 py-2.5 whitespace-nowrap"
    >
      <span
        aria-hidden
        className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-[12.5px] font-bold text-ink-50"
      >
        {trip.initial}
      </span>
      <span>
        <span className="block text-[13.5px] font-semibold text-ink-900">
          {trip.route}
        </span>
        <span className="block text-[11.5px] text-ink-500">{trip.when}</span>
      </span>
      <span className="tnum ml-1 font-display text-base font-bold text-action-deep">
        {trip.price}
      </span>
    </li>
  );
}

export function LiveStrip() {
  return (
    /* `section` et non `div` : ARIA interdit `aria-label` sur un élément
       générique, et le poser dessus ne nomme donc rien. Une `section` nommée
       porte le rôle `region` — le libellé devient valide ET utile, puisque la
       zone apparaît alors dans la liste des repères d'un lecteur d'écran. */
    <section
      className="group mt-8 overflow-hidden border-t border-ink-200 pt-4 pb-7.5 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
      aria-label="Viajes publicados recientemente"
    >
      <p className="mb-3.5 flex items-center gap-2 text-[11.5px] font-bold tracking-[0.14em] text-ink-500 uppercase">
        <span
          aria-hidden
          className="size-1.5 animate-pulse rounded-full bg-brand-green"
        />
        Publicados hoy
      </p>
      <ul className="flex w-max animate-[strip_42s_linear_infinite] gap-2.5 group-hover:[animation-play-state:paused]">
        {TRIPS.map((trip) => (
          <Card key={trip.slug} trip={trip} />
        ))}
        {TRIPS.map((trip) => (
          <Card key={`${trip.slug}-clone`} trip={trip} clone />
        ))}
      </ul>
    </section>
  );
}
