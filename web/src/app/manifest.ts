import type { MetadataRoute } from "next";

/**
 * LE MANIFESTE — ce qui décide si iOS installe une APP ou un signet.
 *
 * `display: "standalone"` retire la barre de Safari : l'écran entier est à
 * nous, et c'est ce qui fait la différence entre « un site ouvert dans le
 * navigateur » et « mon app ». Les raccourcis (`shortcuts`) apparaissent
 * sur un appui long de l'icône — chercher un puesto ou publier sans
 * traverser l'accueil.
 *
 * Le chemin de base doit être ÉCRIT ici : à l'export statique, les URLs
 * relatives d'un manifeste sont résolues contre le manifeste lui-même, et
 * une Page de projet vit sous /test/partimos.
 */
/* L'export statique exige de le dire : cette route est un fichier, pas
   un point d'API. Sans cette ligne, `output: export` refuse de construire. */
export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Partimos — viaja con quien ya va para allá",
    short_name: "Partimos",
    description:
      "Encuentra a quien ya va para tu destino y compartan los gastos del camino.",
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf9f7",
    theme_color: "#faf9f7",
    lang: "es-PA",
    categories: ["travel", "navigation"],
    icons: [
      { src: `${BASE}/icono-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${BASE}/icono-512.png`, sizes: "512x512", type: "image/png" },
      {
        /* `maskable` : Android peut rogner l'icône à sa guise sans manger
           le pin, parce qu'on a laissé la marge de sécurité. */
        src: `${BASE}/icono-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Buscar un puesto",
        short_name: "Buscar",
        url: `${BASE}/ya`,
        icons: [{ src: `${BASE}/icono-192.png`, sizes: "192x192" }],
      },
      {
        name: "Publicar mi viaje",
        short_name: "Publicar",
        url: `${BASE}/publicar/nuevo`,
        icons: [{ src: `${BASE}/icono-192.png`, sizes: "192x192" }],
      },
    ],
  };
}
