#!/usr/bin/env node
/**
 * BATTERIE DU MODE APP — dans un vrai navigateur.
 *
 *   node scripts/verify-app.mjs [url]     (défaut : http://localhost:3100)
 *
 * Ce qu'elle protège, cas par cas :
 *
 *   · le SITE ne doit RIEN gagner du mode app — le cockpit « Hoy » n'y
 *     apparaît jamais, et l'argumentaire reste entier pour Google ;
 *   · l'APP montre l'état avant la recherche quand il y a une reserva ;
 *   · la barre d'onglets est ancrée en bas, atteignable au pouce, et le
 *     contenu ne passe pas dessous ;
 *   · le HTML SERVI est identique dans les deux cas — c'est la règle de
 *     la maison (le SEO est le canal principal), et une régression ici
 *     serait invisible à l'œil.
 *
 * Le mode app est déclenché par la classe `.app-instalada`, celle que
 * `PWA.tsx` pose sur les iPhone antérieurs à 16.4 : ce sont exactement les
 * mêmes règles CSS que `@media (display-mode: standalone)`.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

/** Une reserva pour demain matin : de quoi faire exister le cockpit. */
const manana = new Date(Date.now() + 20 * 3_600_000).toISOString();
const SESSION = {
  contact: "ana@ejemplo.com",
  firstName: "Ana",
  lastName: "Ruiz",
  lastInitial: "R",
  isVerified: true,
  affiliation: null,
  since: "2026-01-05T00:00:00.000Z",
  payPref: "yappy",
  bookings: [
    {
      id: "demo-11111111-2222-3333-4444-555555555555",
      tripId: "panama-chitre-2026-08-15-2",
      from: "panama-city",
      to: "chitre",
      boardingAt: manana,
      seats: 1,
      totalCents: 950,
      feeCents: 48,
      channel: "yappy",
      driverName: "Carlos M",
      point: "Albrook, entrada norte",
      status: "confirmado",
    },
  ],
};

const navegador = await chromium.launch({ executablePath: CHROME });

async function abrir({ modo, conSesion }) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  if (conSesion) {
    await ctx.addInitScript((s) => {
      window.localStorage.setItem("partimos.demo-session", JSON.stringify(s));
    }, SESSION);
  }
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  if (modo === "app") {
    await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  }
  /* ON ATTEND LA FIN DE L'ANIMATION D'OUVERTURE. Elle dure 500 ms après
     un décalage de 260 : mesurer plus tôt attrape la barre en plein
     mouvement, et la position lue est fausse d'une dizaine de pixels.
     Ça a fait échouer « ancrée en bas » pour rien. */
  await p.waitForTimeout(1000);
  return { ctx, p };
}

const ve = (p, sel) => p.locator(sel).first().isVisible().catch(() => false);

/** Le titre marketing, repéré par son CONTENU et non par « le premier h1 » :
 *  l'app pose ses propres titres avant lui dans le DOM, et un sélecteur de
 *  position aurait mesuré le mauvais élément. */
const tituloMarketing = (p) =>
  p.locator("h1", { hasText: "Gasta menos" }).first().isVisible().catch(() => false);

console.log(`\nMode app — ${BASE}\n`);

/* 1. LE SITE reste le site, même avec une reserva en session. */
{
  const { ctx, p } = await abrir({ modo: "sitio", conSesion: true });
  ok("site — pas de cockpit « Hoy »", !(await ve(p, '[aria-label="Tu próximo viaje"]')));
  ok("site — pas de barre d'onglets", !(await ve(p, 'nav[aria-label="Navegación principal"]')));
  ok("site — titre marketing présent", await tituloMarketing(p));
  ok("site — barre haute présente", await ve(p, 'nav[aria-label="Principal"]'));
  ok("site — buscador du site", await ve(p, "#desde"));
  await ctx.close();
}

/* 2. L'APP avec une reserva : l'état passe AVANT la recherche. */
{
  const { ctx, p } = await abrir({ modo: "app", conSesion: true });
  const cockpit = p.locator('[aria-label="Tu próximo viaje"]');
  ok("app — le cockpit apparaît", await ve(p, '[aria-label="Tu próximo viaje"]'));
  ok("app — marketing masqué", !(await tituloMarketing(p)));
  ok("app — buscador propre à l'app", await ve(p, "#app-hacia"));

  const txt = (await cockpit.textContent().catch(() => "")) ?? "";
  ok("app — la route est nommée", /Panam|Chitr/i.test(txt), txt.replace(/\s+/g, " ").slice(0, 46));
  ok("app — le compte à rebours est là", /Sale en|En curso|·/.test(txt));
  ok("app — le point de recogida est là", txt.includes("Te recoge"));
  ok("app — le chat est à un geste", txt.includes("Chat con"));

  /* L'ORDRE DE LA MAQUETTE : la recherche d'abord — c'est le geste du
     quotidien — puis TON viaje, puis seulement les suggestions. Ce qui
     est fixé ici n'est pas une préférence de mise en page mais une
     hiérarchie : un trajet réel passe toujours devant une suggestion. */
  const yCockpit = (await cockpit.boundingBox())?.y ?? 1e9;
  const yRutas = (await p.getByText("Rutas populares").first().boundingBox())?.y ?? -1;
  ok(
    "app — ton viaje passe avant les suggestions",
    yCockpit < yRutas,
    `viaje ${Math.round(yCockpit)} px < rutas ${Math.round(yRutas)} px`,
  );

  /* La sécurité doit FAIRE quelque chose, pas décorer. */
  await p.getByRole("button", { name: "Seguridad" }).first().click();
  await p.waitForTimeout(400);
  const tel = await p.locator('a[href="tel:911"]').first().isVisible().catch(() => false);
  ok("app — Seguridad appelle vraiment le 911", tel);
  ok("app — Seguridad partage le viaje", await ve(p, "text=Compartir mi viaje"));
  await ctx.close();
}

/* 3. L'APP sans reserva : pas de carte vide, la recherche prend la place. */
{
  const { ctx, p } = await abrir({ modo: "app", conSesion: false });
  ok("app sans reserva — pas de carte vide", !(await ve(p, '[aria-label="Tu próximo viaje"]')));
  ok("app sans reserva — buscador présent", await ve(p, "#app-hacia"));
  await ctx.close();
}

/* 4. La barre d'onglets : ancrée en bas, et le contenu ne passe pas dessous. */
{
  const { ctx, p } = await abrir({ modo: "app", conSesion: true });
  const barra = p.locator('nav[aria-label="Navegación principal"]');
  ok("app — barre d'onglets visible", await ve(p, 'nav[aria-label="Navegación principal"]'));
  const b = await barra.boundingBox();
  const vp = p.viewportSize();
  ok(
    "app — barre ancrée au bas de l'écran",
    b !== null && Math.abs(b.y + b.height - vp.height) <= 2,
    b ? `bas = ${Math.round(b.y + b.height)} px / ${vp.height} px` : "absente",
  );
  /* CINQ DESTINATIONS, plus de bouton d'action central : publier est
     devenu un onglet comme les autres. Le détail des libellés et du
     « vous êtes ici » est vérifié par verify-puerta. */
  const destinos = await barra.locator("a").count();
  ok("app — 5 onglets", destinos === 5, `${destinos} trouvé(s)`);
  /* Chaque cible doit tenir le pouce : 44 px est le minimum d'Apple. */
  const altos = await barra.locator("a").evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().height)),
  );
  ok("app — cibles ≥ 44 px", altos.every((h) => h >= 44), altos.join(" / "));
  const pad = await p.evaluate(() => getComputedStyle(document.body).paddingBottom);
  ok("app — réserve sous le contenu", parseInt(pad, 10) >= 64, pad);
  await ctx.close();
}

/* 5. L'ANIMATION D'OUVERTURE NE DOIT JAMAIS CACHER LE CONTENU.
      C'est le travers classique : poser `opacity: 0` en état de départ, et
      livrer un écran blanc à qui a désactivé les animations. Ici elle vit
      sous `prefers-reduced-motion: no-preference` — donc sans mouvement,
      tout est déjà là, opaque et cliquable. */
{
  const ctx = await navegador.newContext({
    ...devices["iPhone 13"],
    reducedMotion: "reduce",
  });
  await ctx.addInitScript((s) => {
    window.localStorage.setItem("partimos.demo-session", JSON.stringify(s));
  }, SESSION);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  await p.waitForTimeout(300);

  const cockpit = p.locator('[aria-label="Tu próximo viaje"]');
  ok("mouvement réduit — le cockpit est là tout de suite", await ve(p, '[aria-label="Tu próximo viaje"]'));
  const op = await cockpit.evaluate((e) => getComputedStyle(e).opacity).catch(() => "0");
  ok("mouvement réduit — rien n'est transparent", op === "1", `opacity ${op}`);
  const barra = await p
    .locator('nav[aria-label="Navegación principal"]')
    .evaluate((e) => getComputedStyle(e).transform)
    .catch(() => null);
  ok("mouvement réduit — la barre n'est pas décalée", barra === "none" || barra === "matrix(1, 0, 0, 1, 0, 0)", String(barra));
  await ctx.close();
}

/* 6. LE POINT SEO : le HTML servi ne dépend pas du mode. */
{
  const brut = await fetch(`${BASE}/`).then((r) => r.text());
  ok("SEO — l'argumentaire est dans le HTML servi", brut.includes("Gasta menos"));
  ok("SEO — le balisage FAQ est là", brut.includes("FAQPage"));
  ok("SEO — la barre d'onglets est servie à tous", brut.includes("Navegación principal"));
  /* Un seul `h1` : l'app pose ses propres titres, et le HTML servi les
     contient TOUS — le mode app ne masque qu'à l'affichage. Un titre d'app
     promu en `h1` entrerait en concurrence avec celui que Google lit. */
  const h1 = (brut.match(/<h1[\s>]/g) ?? []).length;
  ok("SEO — un seul h1 dans le HTML servi", h1 === 1, `${h1} trouvé(s)`);
  /* Les deux cartes de recherche coexistent dans le HTML servi — le mode
     app ne masque qu'à l'affichage. Deux `id` identiques casseraient les
     `label` des deux, et c'est invisible à l'œil. */
  for (const id of ["desde", "hacia", "app-desde", "app-hacia"]) {
    const n = (brut.match(new RegExp(`id="${id}"`, "g")) ?? []).length;
    ok(`id « ${id} » unique dans le HTML`, n <= 1, `${n} occurrence(s)`);
  }
}

await navegador.close();

console.log(fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`);
process.exit(fallos === 0 ? 0 : 1);
