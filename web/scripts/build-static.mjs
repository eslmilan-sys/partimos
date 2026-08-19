#!/usr/bin/env node
/**
 * Construit l'export statique destiné à GitHub Pages.
 *
 *   node scripts/build-static.mjs
 *
 * `output: "export"` refuse toute route d'API : un handler POST n'a aucun
 * sens sans serveur. Plutôt que de supprimer la route du dépôt — elle est
 * indispensable au déploiement réel — on la déplace le temps du build et on
 * la remet ensuite, y compris si le build échoue.
 *
 * Variables lues :
 *   BASE_PATH             préfixe d'URL (« /test » pour une Page de projet)
 *   NEXT_PUBLIC_SITE_URL  origine, pour les canoniques et le sitemap
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(root, "src/app/api");
const parked = join(root, ".api-parked");

function restore() {
  if (existsSync(parked)) {
    if (existsSync(apiDir)) rmSync(apiDir, { recursive: true, force: true });
    renameSync(parked, apiDir);
  }
}

/* ════════════════════════════════════════════════════════════════════
   LE PRÉFIXE DOIT ÊTRE UNE DÉCISION, PAS UN OUBLI.

   Un export construit sans `BASE_PATH` demande `/_next/...`, c'est-à-dire
   la racine du domaine. Servi depuis `/test/partimos/`, chaque CSS et
   chaque JS renvoie 404 — et la page s'affiche en Times New Roman avec
   des puces, sans une seule erreur au build. Ça s'est produit, deux
   déploiements de suite, et la seule façon de s'en apercevoir a été
   d'ouvrir le site sur un téléphone.

   On distingue donc « BASE_PATH oublié » de « BASE_PATH vide, à
   dessein » : `"BASE_PATH" in process.env` est vrai pour `BASE_PATH=`,
   faux quand la variable n'existe pas. Publier à la racine reste
   possible ; l'oublier ne l'est plus.
   ════════════════════════════════════════════════════════════════════ */
if (!("BASE_PATH" in process.env)) {
  console.error(
    "\nBASE_PATH n'est pas défini.\n\n" +
      "  Pour GitHub Pages ici :   npm run build:pages\n" +
      "  Pour un domaine racine :  BASE_PATH= npm run build:static\n",
  );
  process.exit(1);
}

process.on("exit", restore);
process.on("SIGINT", () => process.exit(130));

if (existsSync(apiDir)) renameSync(apiDir, parked);

const result = spawnSync("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    STATIC_EXPORT: "1",
    NEXT_PUBLIC_STATIC_PREVIEW: "1",
    // Lu par `asset()` pour préfixer les fichiers de public/.
    NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH ?? "",
  },
});

restore();

if (result.status !== 0) process.exit(result.status ?? 1);

// GitHub Pages passe le contenu dans Jekyll par défaut, qui ignore les
// dossiers commençant par un underscore — donc tout /_next/.
writeFileSync(join(root, "out/.nojekyll"), "");

// Une Page de projet n'a pas de réécriture côté serveur : une URL inconnue
// doit atterrir sur une vraie page 404, pas sur le listing d'Apache.
const notFound = join(root, "out/404.html");
if (!existsSync(notFound)) {
  writeFileSync(
    notFound,
    "<!doctype html><meta http-equiv=refresh content='0; url=./'>",
  );
}

/* ════════════════════════════════════════════════════════════════════
   LE CONTRÔLE DU PRÉFIXE — le seul qui ait déjà mis le site en ligne à
   terre.

   Ce qui s'est passé : un export construit SANS `BASE_PATH` demande
   `/_next/...`, c'est-à-dire la racine du domaine. Servi depuis
   `/test/partimos/`, chaque CSS et chaque JS renvoie 404 — et la page
   s'affiche en Times New Roman avec des puces, sans une seule erreur
   au build. Rien, dans les mille lignes de sortie de `next build`, ne
   le signale.

   Le contrôle est donc ici, sur le HTML PRODUIT, et il fait échouer le
   build : un export au mauvais préfixe ne doit jamais atteindre le
   dossier `out/`, parce que la seule façon de s'en apercevoir ensuite
   est d'ouvrir le site sur son téléphone.
   ════════════════════════════════════════════════════════════════════ */
const prefijo = process.env.BASE_PATH ?? "";

/** Toutes les pages exportées, en descendant `out/`. */
function paginas(dir) {
  const out = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const camino = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === "_next") continue;
      out.push(...paginas(camino));
    } else if (entrada.name.endsWith(".html")) {
      out.push(camino);
    }
  }
  return out;
}

const esperado = `"${prefijo}/_next/`;
const fautives = paginas(join(root, "out")).filter((f) => {
  const html = readFileSync(f, "utf8");
  if (!html.includes("/_next/")) return false;
  return !html.includes(esperado);
});

if (fautives.length > 0) {
  console.error(
    `\nBASE_PATH est « ${prefijo || "(vide)" } », mais ${fautives.length} page(s) ` +
      `ne demandent pas leurs fichiers sous « ${prefijo}/_next/ ».`,
  );
  console.error(fautives.slice(0, 5).map((f) => `  · ${f}`).join("\n"));
  console.error(
    "\nServi depuis un sous-dossier, ce site s'affichera sans styles.\n" +
      "Pour GitHub Pages ici :  BASE_PATH=/test/partimos npm run build:static\n",
  );
  process.exit(1);
}

console.log(
  `\nExport statique prêt dans out/ — fichiers servis depuis « ${prefijo || "/"} ».`,
);
