import type { NextConfig } from "next";

/**
 * Deux modes de construction.
 *
 * · Par défaut : application Next complète, destinée à Vercel. La route
 *   `POST /api/demanda` fonctionne, les pages corridor se revalident.
 *
 * · `STATIC_EXPORT=1` : export HTML pur, destiné à GitHub Pages pour faire
 *   circuler une démonstration cliquable sans serveur. Il n'y a alors plus de
 *   route d'API — `scripts/build-static.mjs` l'écarte le temps du build — et
 *   le formulaire de préinscription le dit franchement au lieu d'échouer.
 *
 * `BASE_PATH` sert aux Pages de projet, servies depuis /<repo>/.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        // GitHub Pages sert /a/b/ et non /a/b : sans cette option, chaque
        // lien interne tomberait sur un 404.
        trailingSlash: true,
        basePath: process.env.BASE_PATH || undefined,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
