/** Constantes du site. Une seule source pour les URL canoniques. */

export const SITE = {
  name: "Partimos",
  /** Domaine d'origine — à brancher une fois le domaine acheté (⛔ HUMAIN). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://partimos.com",
  locale: "es-PA",
  /* Tenue à ~155 signes : au-delà, Google coupe la phrase en plein milieu.
     Ne dit plus « este fin de semana » — il part des voitures tous les
     jours, et la page d'accueil l'annonce depuis longtemps. */
  description:
    "Comparte carro entre Ciudad de Panamá y el interior. Te recogen cerca y pagas como prefieras: Yappy, tarjeta o efectivo.",
} as const;

export function canonical(path = "/") {
  return new URL(path, SITE.url).toString();
}

/**
 * Préfixe des fichiers servis depuis `public/`.
 *
 * `basePath` de Next réécrit les liens et les routes, mais PAS les `src` bruts
 * d'une balise `<img>` ou d'un `<source>`. Sous une Page de projet GitHub, où
 * le site vit sous /test/partimos, un `/img/foto.jpg` écrit tel quel renvoie
 * un 404 — et une image absente ne se voit qu'une fois déployée.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}
