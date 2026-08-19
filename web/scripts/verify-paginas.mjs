#!/usr/bin/env node
/**
 * BATTERIE DE TOUTES LES PAGES EN MODE APP.
 *
 *   node scripts/verify-paginas.mjs [url]     (défaut : http://localhost:3100)
 *
 * Deux moitiés.
 *
 * A. LE BALAYAGE. Chaque route de l'app est ouverte sur un iPhone 13 et
 *    passée au même crible : pas de mot interdit, pas d'émoji, rien qui
 *    déborde à l'horizontale, et le premier contenu ne passe pas sous
 *    l'encoche. Ce sont les quatre fautes qui ne se voient jamais sur un
 *    écran de bureau et qui sautent aux yeux sur un téléphone.
 *
 * B. LES ÉCRANS que les autres batteries ne couvrent pas : Buscar (/ya),
 *    Seguridad, Ayuda, Publicar.
 *
 * « Gratis » et « tarifa de reserva » sont proscrits par le
 * propriétaire. Le balayage est la seule façon de tenir cette règle
 * quand vingt écrans partagent des composants.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

const manana = new Date(Date.now() + 20 * 3_600_000).toISOString();
const SESSION = {
  contact: "ana@ejemplo.com", firstName: "Ana", lastName: "Ruiz", lastInitial: "R",
  isVerified: true, affiliation: null, since: "2026-01-05T00:00:00.000Z", payPref: "yappy",
  bookings: [{
    id: "demo-11111111-2222-3333-4444-555555555555",
    tripId: "panama-chitre-2026-08-15-2", from: "panama-city", to: "chitre",
    boardingAt: manana, seats: 1, totalCents: 1900, feeCents: 95, channel: "yappy",
    driverName: "Carlos M", point: "Albrook, entrada norte", status: "confirmado",
  }],
};

const RUTAS = [
  "/", "/ya", "/buscar", "/cuenta", "/cuenta/mensajes", "/cuenta/perfil",
  "/como-funciona", "/seguridad", "/ayuda", "/publicar", "/publicar/nuevo",
  "/terminos", "/privacidad",
];

/** ÉMOJI, mais pas « tout ce qui est pictographique ».
 *  `\p{Extended_Pictographic}` attrape aussi ©, ® et ™ — le signe de
 *  copyright du pied de page a fait tomber la batterie entière. On ne
 *  garde donc que ce qui s'AFFICHE en émoji : présentation émoji par
 *  défaut, ou forcée par le sélecteur de variante U+FE0F. */
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;

const navegador = await chromium.launch({ executablePath: CHROME });

async function abrir(url, { conSesion = true } = {}) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  if (conSesion) {
    await ctx.addInitScript((s) => {
      window.localStorage.setItem("partimos.demo-session", JSON.stringify(s));
    }, SESSION);
  }
  const p = await ctx.newPage();
  await p.goto(`${BASE}${url}`, { waitUntil: "networkidle" }).catch(() => {});
  /* Après l'hydratation : `PWA.tsx` repose la classe au montage et
     effacerait la nôtre si on la posait trop tôt. */
  await p.waitForTimeout(700);
  await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  await p.waitForTimeout(400);
  return { ctx, p };
}

const app = (p) => p.locator(".solo-app").first();

console.log(`\nPages en mode app — ${BASE}\n`);

/* ═══ A. LE BALAYAGE ═══ */
console.log("  Balayage :\n");
for (const ruta of RUTAS) {
  const { ctx, p } = await abrir(ruta);

  /* On lit le corps VISIBLE : `.solo-web` est masqué, mais son texte
     reste dans `textContent`. `innerText` ne rend que le visible —
     c'est exactement la différence qui compte ici. */
  const visible = await p.evaluate(() => document.body.innerText ?? "");

  const prohibido =
    (/\bgratis\b/i.test(visible) ? "gratis " : "") +
    (/tarifa de reserva/i.test(visible) ? "tarifa-de-reserva " : "") +
    (EMOJI.test(visible) ? "émoji" : "");
  ok(`${ruta} — aucun mot ni signe interdit`, prohibido === "", prohibido);

  /* DÉBORDEMENT HORIZONTAL : sur 390 px, un tableau ou un titre trop
     long fait défiler la page entière de côté, et tout paraît cassé. */
  const desborde = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(`${ruta} — rien ne déborde à l'horizontale`, desborde <= 1, `${desborde} px`);

  /* SOUS L'ENCOCHE : la barre haute du site est masquée en mode app, et
     sans réserve le premier titre passe sous l'heure de l'iPhone. On
     mesure le premier TEXTE peint, pas le premier bloc : le conteneur
     extérieur commence à 0 par construction — il porte le rembourrage,
     il ne le subit pas — et le mesurer, lui, faisait échouer toutes les
     pages pour rien. */
  const cima = await p.evaluate(() => {
    const main = document.querySelector("main#contenido");
    if (!main) return null;
    const it = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = it.nextNode())) {
      if (!n.textContent.trim()) continue;
      const padre = n.parentElement;
      if (!padre) continue;
      const s = getComputedStyle(padre);
      if (s.display === "none" || s.visibility === "hidden") continue;
      const r = document.createRange();
      r.selectNodeContents(n);
      const caja = r.getBoundingClientRect();
      if (caja.height < 1) continue;
      return Math.round(caja.top);
    }
    return null;
  });
  ok(`${ruta} — le contenu ne colle pas au bord haut`, cima === null || cima >= 8, `${cima} px`);

  await ctx.close();
}

/* ═══ B. LES ÉCRANS ═══ */
console.log("\n  Buscar (/ya) :\n");
{
  const { ctx, p } = await abrir("/ya");
  const zona = app(p);
  ok("ya — la question est posée", /A dónde/.test((await zona.textContent()) ?? ""));
  ok("ya — le champ Desde", await zona.locator("#ya-desde").first().isVisible().catch(() => false));
  ok("ya — le champ Hacia", await zona.locator("#ya-hacia").first().isVisible().catch(() => false));
  ok("ya — hoy / mañana", await zona.getByRole("button", { name: "Mañana" }).first().isVisible().catch(() => false));

  /* LES RÉSULTATS SANS BOUTON : choisir, c'est chercher. C'est LA
     promesse de cet écran ; s'il fallait valider, il n'aurait pas de
     raison d'exister à côté de /buscar. */
  ok("ya — rien tant qu'on n'a pas dit où on va", (await zona.locator("ul > li > a[href*='/viaje/']").count()) === 0);
  await zona.locator("#ya-hacia").first().click();
  await p.waitForTimeout(250);
  await zona.locator("#ya-hacia").first().fill("Chitr");
  await p.waitForTimeout(500);
  await p.keyboard.press("Enter");
  await p.waitForTimeout(700);
  const n = await zona.locator("ul > li > a[href*='/viaje/']").count();
  ok("ya — les résultats arrivent sans bouton", n > 0, `${n} viaje(s)`);
  ok(
    "ya — la sortie vers la recherche complète",
    await zona.locator("a[href*='/buscar?']").first().isVisible().catch(() => false),
  );
  await ctx.close();
}

console.log("\n  Seguridad :\n");
{
  const { ctx, p } = await abrir("/seguridad");
  const zona = app(p);
  const t = ((await zona.textContent()) ?? "").replace(/\s+/g, " ");
  ok("seguridad — le 911 est un vrai appel", await zona.locator('a[href="tel:911"]').first().isVisible().catch(() => false));
  ok("seguridad — partager son viaje", await zona.getByRole("button", { name: "Compartir mi viaje" }).first().isVisible().catch(() => false));
  ok("seguridad — le viaje partagé est nommé", /Chitr/.test(t));
  ok("seguridad — ce qu'on ne garde pas est dit", /Lo que no guardamos/.test(t));
  /* CE QU'ELLE NE DOIT PAS PROMETTRE : tant que la position en direct
     n'existe pas de bout en bout, l'app ne l'annonce pas. */
  ok("seguridad — aucune promesse d'ubicación en vivo", !/ubicaci[oó]n en vivo/i.test(t));
  await ctx.close();
}

console.log("\n  Ayuda :\n");
{
  const { ctx, p } = await abrir("/ayuda");
  const zona = app(p);
  const todas = await zona.locator("details").count();
  ok("ayuda — la liste est là", todas > 4, `${todas} questions`);
  await zona.locator('input[type="search"]').first().fill("cancelar");
  await p.waitForTimeout(400);
  const filtradas = await zona.locator("details").count();
  ok("ayuda — le filtre réduit vraiment", filtradas > 0 && filtradas < todas, `${filtradas} / ${todas}`);

  /* SANS ACCENTS : personne ne tape « cuánto » avec l'accent au pouce. */
  await zona.locator('input[type="search"]').first().fill("cuanto");
  await p.waitForTimeout(400);
  ok("ayuda — le filtre ignore les accents", (await zona.locator("details").count()) > 0);

  await zona.locator('input[type="search"]').first().fill("zzzzzz");
  await p.waitForTimeout(400);
  ok("ayuda — rien trouvé n'est pas une page vide", /Nada con esas palabras/.test((await zona.textContent()) ?? ""));
  await ctx.close();
}

console.log("\n  Publicar :\n");
{
  const { ctx, p } = await abrir("/publicar/nuevo");
  const t = ((await p.locator("main").innerText()) ?? "").replace(/\s+/g, " ");
  ok("publicar — l'écran s'ouvre", t.length > 80, `${t.length} caractères`);
  ok("publicar — jamais « gratis »", !/\bgratis\b/i.test(t));
  /* La page est partagée entre le site et l'app : elle porte
     `.cima-app`, qui lui rend la place de l'encoche quand la barre
     haute est masquée. */
  const pad = await p.evaluate(() => {
    const el = document.querySelector(".cima-app");
    return el ? Math.round(parseFloat(getComputedStyle(el).paddingTop)) : -1;
  });
  ok("publicar — la réserve d'encoche est appliquée", pad >= 14, `${pad} px`);
  await ctx.close();
}

await navegador.close();

console.log(fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`);
process.exit(fallos === 0 ? 0 : 1);
