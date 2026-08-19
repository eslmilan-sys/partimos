import type { IconName } from "@/components/ui/Icon";

/**
 * Le plan du site, en un seul endroit.
 *
 * Il alimente le menu mobile, le menu déroulant du bureau et le pied de page.
 * Une seule source : trois listes qui divergent, c'est exactement comme ça
 * qu'un site finit avec des pages que personne ne trouve.
 *
 * Le groupement est par INTENTION, pas par type de contenu : on arrive ici
 * soit pour voyager, soit pour conduire. « Blog / Produit / Société » ne
 * répond à aucune des deux questions.
 */

export type NavLink = {
  href: string;
  label: string;
  hint: string;
  icon: IconName;
};

export type NavSection = { title: string; links: NavLink[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Viajar",
    links: [
      /* UNE seule entrée de recherche (décision du propriétaire) : trois
         portes pour le même geste, c'est deux de trop. /ya cherche, et
         renvoie vers /buscar pour les autres dates. La page « Todas las
         rutas » a été supprimée — les pages corridor restent pour le
         SEO, liées depuis l'accueil et le pied de page. */
      {
        href: "/ya",
        label: "Buscar un viaje",
        hint: "Quién ya va para allá — hoy o mañana",
        icon: "search",
      },
      {
        href: "/como-funciona",
        label: "Cómo se paga un viaje",
        hint: "Del primer clic al pago, paso a paso",
        icon: "cash",
      },
      {
        href: "/seguridad",
        label: "Seguridad",
        hint: "Con quién viajas y qué no guardamos",
        icon: "shield",
      },
    ],
  },
  {
    title: "Manejar",
    links: [
      {
        href: "/publicar/nuevo",
        label: "Publicar mi viaje",
        hint: "Cuatro pasos, menos de un minuto",
        icon: "car",
      },
      /* UNE entrée d'explication, pas deux : « Cómo funciona » et
         « Calcular el aporte » menaient à la même page — deux libellés
         pour une porte font croire à deux pages (audit B5). La
         calculadora vit dans /publicar, la page l'annonce elle-même. */
      {
        href: "/publicar",
        label: "Cuánto recuperas y cómo",
        hint: "El tope del aporte, con la calculadora",
        icon: "compass",
      },
    ],
  },
  {
    title: "Partimos",
    links: [
      {
        href: "/cuenta",
        label: "Mi cuenta",
        hint: "Tus viajes, tu perfil, tu verificación",
        icon: "users",
      },
      {
        href: "/ayuda",
        label: "Ayuda",
        hint: "Las preguntas de siempre",
        icon: "chat",
      },
      {
        href: "/terminos",
        label: "Términos de uso",
        hint: "Qué es la plataforma y qué no es",
        icon: "id",
      },
      {
        href: "/privacidad",
        label: "Aviso de privacidad",
        hint: "Qué guardamos y qué no",
        icon: "shield",
      },
    ],
  },
];

/** Les entrées visibles en permanence sur grand écran. */
export const PRIMARY_LINKS = [
  { href: "/ya", label: "Buscar" },
  { href: "/como-funciona", label: "Cómo se paga" },
  { href: "/seguridad", label: "Seguridad" },
];
