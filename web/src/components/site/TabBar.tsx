"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useSinLeer } from "@/lib/avisos";

/**
 * LA BARRE D'ONGLETS — visible seulement dans l'app installée.
 *
 * Elle est TOUJOURS dans le HTML ; c'est `.solo-app` (globals.css) qui
 * décide de la montrer. Le site n'en veut pas — il a sa barre haute et
 * son pied de page — et surtout la page servie doit rester la même pour
 * tout le monde, robots d'indexation compris.
 *
 * SA FORME : une pilule qui FLOTTE au-dessus du contenu, en verre, avec
 * l'onglet actif dans sa propre pastille. Demande explicite du
 * propriétaire, exemple à l'appui. Ce n'est pas qu'esthétique : une
 * barre pleine largeur collée au bord se lit comme un morceau de la
 * page, alors qu'une pilule détachée se lit comme un objet posé DESSUS —
 * et c'est ce qu'elle est, puisqu'elle survit au défilement.
 *
 * Le verre n'est pas décoratif non plus : on doit deviner que la liste
 * continue dessous, sinon on croit être arrivé au bas de l'écran.
 *
 * CINQ ONGLETS, ET C'EST LA LISTE DU PROPRIÉTAIRE, mot pour mot :
 * rechercher, publier, mes viajes, messages, profil. Il n'y a plus de
 * bouton d'action central : publier EST une destination, au même titre
 * que le reste, et lui donner une pastille orange qui déborde en faisait
 * une exception qu'aucune règle ne justifiait.
 *
 * Plus d'onglet « Inicio » non plus, et ce n'est pas une perte : la
 * page d'accueil de l'app EST la recherche. Deux onglets qui mènent au
 * même geste, c'est un onglet gaspillé sur cinq.
 *
 * Les libellés restent sous les icônes. Une icône seule est une
 * devinette — « route » et « chat » ne veulent rien dire hors contexte —
 * et le coût d'un mot de sept lettres est nul.
 */

/**
 * `rutas` dit quelles ADRESSES allument l'onglet — ce n'est pas toujours
 * celle où il mène. « Buscar » mène aux salidas du jour, mais la page de
 * résultats et les pages de ruta font partie du même geste : chercher.
 * Un onglet éteint sur l'écran qu'il a ouvert, c'est une carte de métro
 * sans « vous êtes ici ».
 */
type Tab = { href: string; label: string; icon: IconName; rutas: string[] };

const TABS: Tab[] = [
  {
    href: "/",
    label: "Buscar",
    icon: "search",
    rutas: ["=", "/ya", "/buscar", "/viajes", "/viaje"],
  },
  {
    href: "/publicar/nuevo",
    label: "Publicar",
    icon: "plusCircle",
    rutas: ["/publicar"],
  },
  /* `/cuenta` EXACTEMENT — pas en préfixe. Les panneaux ont maintenant
     leurs propres routes (`/cuenta/perfil`, `/cuenta/mensajes`) : un
     préfixe allumerait « Mis viajes » sur les trois, et trois onglets
     actifs disent moins que zéro. */
  { href: "/cuenta", label: "Mis viajes", icon: "route", rutas: ["="] },
  { href: "/cuenta/mensajes", label: "Mensajes", icon: "chat", rutas: ["/cuenta/mensajes"] },
  {
    href: "/cuenta/perfil",
    label: "Perfil",
    icon: "userCircle",
    /* Le profil coiffe ses sous-écrans : vérification et légal s'ouvrent
       depuis lui, et l'onglet doit rester allumé pendant qu'on y est. */
    rutas: ["/cuenta/perfil", "/cuenta/verificacion", "/cuenta/legal"],
  },
];

export function TabBar() {
  const pathname = usePathname();
  const sinLeer = useSinLeer();

  /* L'onglet actif se juge sur le PRÉFIXE, sauf l'accueil : « / » est
     préfixe de tout, et l'allumer partout ne dirait plus rien. */
  /* « = » demande une correspondance EXACTE avec le `href` de l'onglet ;
     tout le reste est un préfixe. Sans ce cas, « / » et « /cuenta »
     s'allumeraient partout, chacun étant préfixe de la moitié du site. */
  const activo = (t: Tab) =>
    t.rutas.some((r) =>
      r === "=" || r === "/" ? pathname === t.href.split("?")[0] : pathname.startsWith(r),
    );

  const item = (t: Tab) => {
    const on = activo(t);
    return (
      <li key={t.href} className="flex-1">
        <Link
          href={t.href}
          aria-current={on ? "page" : undefined}
          /* Le libellé descend à 10 px : « Mis viajes » doit tenir sur
             une ligne dans un cinquième de 390 px, et un mot coupé en
             deux se lit plus mal qu'un mot petit. */
          className={`mx-auto flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-[18px] px-0.5 text-[10px] font-semibold whitespace-nowrap transition-colors ${
            on ? "text-naranja" : "text-ink-500"
          }`}
        >
          {/* LA PASTILLE — sur l'icône, pas à côté du mot. C'est là que
              l'œil va, et c'est là qu'elle tient sans pousser le
              libellé. Au-delà de 9, « 9+ » : un nombre à trois chiffres
              dans un rond de 16 px ne se lit plus. */}
          <span className="relative">
            <Icon name={t.icon} className="size-[20px]" />
            {t.href === "/cuenta/mensajes" && sinLeer > 0 && (
              <span
                className="tnum absolute -top-1.5 -right-2 flex min-w-[16px] items-center justify-center rounded-full bg-naranja px-1 text-[10px] leading-[16px] font-bold text-white"
                aria-hidden
              >
                {sinLeer > 9 ? "9+" : sinLeer}
              </span>
            )}
          </span>
          {t.label}
          {t.href === "/cuenta/mensajes" && sinLeer > 0 && (
            <span className="sr-only">{sinLeer} sin leer</span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Navegación principal"
      /* Elle FLOTTE : `inset-x-3` la décolle des bords, et la réserve du
         bas tient compte de la barre d'accueil de l'iPhone. Le contenu
         passe dessous — d'où le verre. */
      className="solo-app fixed inset-x-3 bottom-0 z-50"
      style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      <ul className="glass relative mx-auto flex h-[64px] max-w-[440px] items-stretch rounded-[24px] px-1.5">
        {TABS.map(item)}
      </ul>
    </nav>
  );
}
