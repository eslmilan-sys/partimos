import type { MetadataRoute } from "next";
import { CORRIDORS } from "@/lib/corridors";
import { canonical } from "@/lib/site";

// Fichier entièrement dérivé du référentiel : rien à recalculer à la
// demande. `force-static` le dit explicitement, ce qu'exige aussi l'export
// statique de la démonstration.
export const dynamic = "force-static";

/**
 * Une seule URL par contenu. Les pages corridor portent la priorité la plus
 * haute après l'accueil : ce sont elles qui capturent les recherches du type
 * « carro compartido panamá chitré » ou « cómo llegar a Las Tablas ».
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: canonical("/"), changeFrequency: "daily", priority: 1 },
    {
      url: canonical("/como-funciona"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: canonical("/publicar"), changeFrequency: "weekly", priority: 0.8 },
    /* LE HUB DES RUTAS. Il relie les douze pages corridor entre elles ;
       sans lui, chacune ne se rejoint que par l'accueil — et il était
       déjà lié depuis leur pied de page, vers un 404. */
    { url: canonical("/viajes"), changeFrequency: "weekly", priority: 0.8 },
    { url: canonical("/seguridad"), changeFrequency: "monthly", priority: 0.6 },
    { url: canonical("/ayuda"), changeFrequency: "monthly", priority: 0.6 },
    { url: canonical("/terminos"), changeFrequency: "yearly", priority: 0.3 },
    { url: canonical("/privacidad"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const staticPages: MetadataRoute.Sitemap = pages.map((page) => ({
    ...page,
    lastModified: now,
  }));

  const corridorPages: MetadataRoute.Sitemap = CORRIDORS.map((corridor) => ({
    url: canonical(`/viajes/${corridor.slug}`),
    lastModified: now,
    changeFrequency: "hourly",
    priority: corridor.isPriority ? 0.9 : 0.8,
  }));

  return [...staticPages, ...corridorPages];
}
