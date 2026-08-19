import type { MetadataRoute } from "next";
import { canonical } from "@/lib/site";

// Fichier entièrement dérivé du référentiel : rien à recalculer à la
// demande. `force-static` le dit explicitement, ce qu'exige aussi l'export
// statique de la démonstration.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Les routes d'API ne portent aucun contenu indexable et reçoivent des
      // données personnelles : on ne les propose pas au crawl.
      disallow: ["/api/"],
    },
    sitemap: canonical("/sitemap.xml"),
    host: canonical("/"),
  };
}
