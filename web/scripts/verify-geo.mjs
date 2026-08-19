#!/usr/bin/env node
/**
 * BATTERIE DU GÉOCODAGE — la recherche d'adresses, de bout en bout.
 *
 *   node scripts/verify-geo.mjs [url]     (défaut : http://localhost:3100)
 *
 * Elle existe à cause d'une panne signalée ainsi : « les adresses ne
 * s'affichent pas quand je tape une lettre, ni deux, ni trois ». Cause
 * unique, remontée au navigateur : les trois clés de géocodage étaient
 * vides, donc `GEOSEARCH_ENABLED` était faux et la requête ne partait
 * JAMAIS. Le même défaut expliquait le second symptôme — le curseur de
 * desvío, qui n'est que le repli affiché quand le point n'a pas de
 * coordonnées, s'affichait donc en permanence.
 *
 * LA RÉPONSE DU FOURNISSEUR EST SIMULÉE, et c'est délibéré :
 *
 *   · une batterie qui appelle une API payante à chaque exécution consomme
 *     un quota et échoue le jour où le réseau tousse — elle mesurerait
 *     LocationIQ, pas notre code ;
 *   · ce qu'on veut fixer ici est notre chaîne : la clé arrive-t-elle dans
 *     le bundle, la requête part-elle avec les bons paramètres, et la
 *     réponse s'affiche-t-elle en options choisissables.
 *
 * Ce qu'elle ne prouve PAS, et qu'il faut vérifier sur un vrai téléphone :
 * que la clé est valide et que LocationIQ répond. Ici, tout appel sortant
 * est intercepté.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

/** Ce que LocationIQ renvoie vraiment pour « calle 50 » au Panama, réduit
 *  aux champs que `locationiqSearch` lit. */
const RESPUESTA = [
  {
    display_place: "Calle 50",
    display_address: "San Francisco, Ciudad de Panamá",
    display_name: "Calle 50, San Francisco, Ciudad de Panamá, Panamá",
    lat: "8.9824",
    lon: "-79.5199",
  },
  {
    display_place: "Calle 50 Este",
    display_address: "Bella Vista, Ciudad de Panamá",
    display_name: "Calle 50 Este, Bella Vista, Ciudad de Panamá",
    lat: "8.9871",
    lon: "-79.5265",
  },
];

const navegador = await chromium.launch({ executablePath: CHROME });
const ctx = await navegador.newContext({ ...devices["iPhone 13"] });

/** On intercepte le fournisseur et on note ce qui lui a été demandé. */
const llamadas = [];
await ctx.route("**/api.locationiq.com/**", async (route) => {
  llamadas.push(route.request().url());
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(RESPUESTA),
  });
});

const p = await ctx.newPage();
await p.goto(`${BASE}/`, { waitUntil: "networkidle" });

console.log(`\nGéocodage — ${BASE}\n`);

const campo = p.locator("#hacia");
await campo.click();
await p.waitForTimeout(250);

/* Les VILLES marchaient déjà : elles sortent de la liste locale, sans
   réseau. On le garde sous surveillance — c'est ce qui doit continuer de
   répondre même quand le fournisseur est en panne. */
await campo.fill("");
await campo.type("dav", { delay: 40 });
await p.waitForTimeout(600);
const ciudades = await p.locator('[cmdk-item], [role="option"]').allTextContents();
ok("les villes répondent sans réseau", ciudades.some((t) => /David/i.test(t)), `${ciudades.length} résultat(s)`);

/* LES ADRESSES : le cas de la panne. */
await campo.fill("");
await campo.type("calle 50", { delay: 40 });
await p.waitForTimeout(900);

ok("le fournisseur est appelé", llamadas.length > 0, `${llamadas.length} appel(s)`);
if (llamadas.length) {
  const u = new URL(llamadas[llamadas.length - 1]);
  ok("la clé part avec la requête", (u.searchParams.get("key") ?? "").startsWith("pk."));
  ok("la recherche est bornée au Panama", u.searchParams.get("countrycodes") === "pa");
  ok("la requête porte le texte tapé", (u.searchParams.get("q") ?? "").includes("calle 50"));
}

const opciones = await p.locator('[cmdk-item], [role="option"]').allTextContents();
ok(
  "l'adresse s'affiche comme option",
  opciones.some((t) => /Calle 50/i.test(t)),
  opciones.slice(0, 2).map((s) => s.trim().slice(0, 30)).join(" | ") || "aucune",
);

await navegador.close();

console.log(fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`);
process.exit(fallos === 0 ? 0 : 1);
