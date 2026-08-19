import Link from "next/link";
import { CORRIDORS } from "@/lib/corridors";
import { LEGAL_FOOTER } from "@/lib/content";
import { LogoMark } from "./Logo";
import { AppBadges } from "./AppBadges";

const COLUMNS = [
  {
    title: "Viajar",
    links: [
      { href: "/ya", label: "Buscar un viaje" },
      { href: "/como-funciona", label: "Cómo se paga un viaje" },
      { href: "/seguridad", label: "Seguridad" },
    ],
  },
  {
    title: "Manejar",
    links: [
      { href: "/publicar/nuevo", label: "Publicar un viaje" },
      { href: "/publicar", label: "Cómo funciona para conductores" },
      { href: "/publicar#calculadora", label: "Calcular el aporte" },
      { href: "/ayuda", label: "Preguntas frecuentes" },
    ],
  },
  {
    title: "Partimos",
    links: [
      { href: "/cuenta", label: "Mi cuenta" },
      { href: "/ayuda#contacto", label: "Contacto" },
      { href: "/terminos", label: "Términos de uso" },
      { href: "/privacidad", label: "Aviso de privacidad" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-5 bg-night-900 pt-13 pb-8 text-night-300">
      <div className="mx-auto w-full max-w-[1120px] px-5">
        {/* LE PLAN DU SITE EST `solo-web`. Quatre colonnes de liens et le
            catalogue des rutas servent le référencement et le visiteur qui
            explore ; dans l'app, la barre d'onglets mène déjà où il faut, et
            ce pavé ne serait qu'un mur à faire défiler après chaque écran.
            La mention légale, elle, reste partout — c'est le §8, pas une
            préférence de mise en page. */}
        <div className="solo-web mb-9 grid gap-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="Partimos — inicio"
            >
              <LogoMark gradientId="brand-footer" dotColor="#0E2A35" />
              <span className="font-display text-[22px] font-extrabold tracking-[-0.03em] text-ink-50">
                Partimos
              </span>
            </Link>
            <p className="mt-3.5 max-w-[32ch] text-sm leading-snug">
              Viajes compartidos entre particulares en Panamá. Alguien ya va
              para allá.
            </p>
            <AppBadges />
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3.5 font-display text-sm font-bold text-white">
                {col.title}
              </h2>
              <ul>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block py-1 text-sm transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Maillage interne : chaque page pointe vers tous les corridors.
            C'est ce qui fait remonter les pages SEO les unes les autres. */}
        <nav
          aria-label="Rutas"
          className="solo-web mb-8 border-t border-white/10 pt-7"
        >
          <h2 className="mb-3 font-display text-sm font-bold text-white">
            Rutas populares
          </h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
            {CORRIDORS.map((corridor) => (
              <li key={corridor.slug}>
                <Link
                  href={`/viajes/${corridor.slug}`}
                  className="block py-1 text-[13.5px] transition-colors hover:text-white"
                >
                  {corridor.origin.shortName} → {corridor.destination.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* PAS DE PIED DE PAGE DANS L'APP. Les trois liens légaux
            vivaient encore ici : trois mots gris sur une bande sombre,
            au bas de chaque écran, sous la barre d'onglets. Un pied de
            page est une convention du WEB — on y arrive en défilant
            jusqu'au bout d'une page qu'on lit une fois. Dans une app on
            ne défile pas « jusqu'au bout », on change d'écran ; ce qui
            traîne en bas n'est pas consulté, il encombre.
            Ils ont leur écran : Perfil → Legal. */}

        {/* LE PAVÉ DE CONFORMITÉ EST `solo-web`, ET C'EST RÉFLÉCHI.
            Le §8 l'impose sur toutes les pages du SITE, et il y reste
            entier : une page web se lit une fois, son pied porte les
            mentions. Dans l'app on revient sur les mêmes écrans vingt
            fois par jour, et six lignes de conformité sous chaque liste
            de viajes deviennent du bruit qu'on apprend à ne plus voir —
            la pire chose qui puisse arriver à un texte légal. Il n'a pas
            disparu de l'app : il a une page, « Legal », et le profil y
            mène. */}
        <div className="solo-web flex flex-wrap items-start justify-between gap-5 border-t border-white/12 pt-6">
          {/* Interligne resserré : un pavé légal en 12,5 px avec un
              interligne « relaxed » prenait plus de place que le contenu
              utile du footer. « snug » reste lisible à cette taille. */}
          <p className="max-w-[70ch] text-[12.5px] leading-snug text-night-300">
            {LEGAL_FOOTER}
          </p>
          <span className="text-[12.5px] whitespace-nowrap">
            © {new Date().getFullYear()} Partimos — hecho para las carreteras de
            Panamá
          </span>
        </div>
      </div>
    </footer>
  );
}
