#!/usr/bin/env node
/**
 * BATTERIE DU SERVICE WORKER — cinq cas, dans un vrai navigateur.
 *
 *   node scripts/verify-sw.mjs [url]     (défaut : http://localhost:3100)
 *
 * Elle existe à cause d'un bug précis, signalé ainsi par le propriétaire :
 * « quand j'actualise, ça m'envoie vers une autre partie du site ». Le
 * service worker gardait la page d'accueil comme repli hors-ligne
 * universel ; toute page absente du cache renvoyait donc l'accueil, en 200,
 * à l'adresse demandée.
 *
 * Le cas 2 est CE bug. Les quatre autres sont les régressions qu'une
 * correction naïve provoquerait — couper le repli entièrement casserait le
 * hors-ligne (cas 3 et 4), et retirer le délai ferait pendre l'app sur un
 * réseau lent (cas 5).
 *
 * Prérequis : le site servi à l'adresse donnée, et Playwright disponible.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

const navegador = await chromium.launch({ executablePath: CHROME });

/** Un contexte neuf par cas : un service worker et un cache par scénario. */
async function conContexto(fn) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  try {
    return await fn(ctx, await ctx.newPage());
  } finally {
    await ctx.close();
  }
}

const esAccueil = (t) => t.includes("Gasta menos");

console.log(`\nService worker — ${BASE}\n`);

/* 1. En ligne : la page demandée est bien celle qui s'affiche. */
await conContexto(async (ctx, p) => {
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.goto(`${BASE}/seguridad`, { waitUntil: "networkidle" });
  const t = (await p.locator("h1").first().textContent()) ?? "";
  ok("en ligne, /seguridad rend /seguridad", !esAccueil(t) && t.length > 0, t.trim().slice(0, 40));
});

/* 2. LE BUG. Page atteinte par un lien (jamais vue par le SW), réseau
      coupé, rafraîchissement. Elle ne doit PAS rendre l'accueil. */
await conContexto(async (ctx, p) => {
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.evaluate(() => {
    const a = document.querySelector('a[href="/seguridad"]');
    if (a) a.click();
  });
  await p.waitForURL("**/seguridad", { timeout: 5000 }).catch(() => {});
  await ctx.setOffline(true);
  await p.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  const t = (await p.locator("body").textContent().catch(() => "")) ?? "";
  ok(
    "hors ligne, page non mise en cache → PAS l'accueil",
    !esAccueil(t),
    esAccueil(t) ? "l'accueil a été servi à la place" : "",
  );
  ok("hors ligne → écran « Se fue la conexión »", t.includes("Se fue la conexión"));
});

/* 3. Hors ligne, page DÉJÀ visitée : on doit la retrouver, pas l'écran
      hors-ligne. Sinon le cache ne sert à rien. */
await conContexto(async (ctx, p) => {
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.goto(`${BASE}/seguridad`, { waitUntil: "networkidle" });
  await ctx.setOffline(true);
  await p.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  const t = (await p.locator("body").textContent().catch(() => "")) ?? "";
  ok(
    "hors ligne, page déjà visitée → la vraie page",
    !t.includes("Se fue la conexión") && !esAccueil(t),
  );
});

/* 4. Hors ligne, l'accueil : il est pré-mis en cache à l'installation. */
await conContexto(async (ctx, p) => {
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.evaluate(() => navigator.serviceWorker.ready);
  await ctx.setOffline(true);
  await p.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  const t = (await p.locator("body").textContent().catch(() => "")) ?? "";
  ok("hors ligne, l'accueil s'ouvre quand même", esAccueil(t));
});

/* 5. Réseau qui PEND (4G en bord de couverture). Sans délai maximum, la
      page reste blanche indéfiniment ; avec, on bascule en secours. */
await conContexto(async (ctx, p) => {
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.goto(`${BASE}/seguridad`, { waitUntil: "networkidle" });

  /* Toute navigation suivante met 30 s à répondre. */
  await ctx.route("**/seguridad", async (route) => {
    await new Promise((r) => setTimeout(r, 30000));
    await route.abort();
  });

  const t0 = Date.now();
  await p.reload({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
  const ms = Date.now() - t0;
  const t = (await p.locator("body").textContent().catch(() => "")) ?? "";
  ok(`réseau qui pend → réponse en moins de 10 s`, ms < 10000, `${ms} ms`);
  ok("réseau qui pend → contenu utile, pas un écran blanc", t.trim().length > 50);
  ok("réseau qui pend → toujours pas l'accueil", !esAccueil(t));
});

await navegador.close();

console.log(
  fallos === 0
    ? "\nTout passe.\n"
    : `\n${fallos} vérification(s) en échec.\n`,
);
process.exit(fallos === 0 ? 0 : 1);
