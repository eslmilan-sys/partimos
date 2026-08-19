#!/usr/bin/env node
/**
 * BATTERIE DE L'ENTRÉE — LA MÊME PORTE DES DEUX CÔTÉS.
 *
 *   node scripts/verify-acceso.mjs [url]     (défaut : http://localhost:3100)
 *
 * Le reproche était : « in app and web is not the same ». Il ne portait
 * pas sur un détail — il y avait deux produits. L'app avait sa porte
 * blanche et orange, ses six écrans d'une question, et un mot de passe
 * pour seule porte. Le site avait une carte bleu nuit, une inscription
 * en un seul formulaire, et le lien par courriel caché derrière du texte
 * souligné.
 *
 * Le code est maintenant partagé (`components/auth/`), et c'est
 * précisément pour ça qu'il faut une batterie : un composant partagé
 * peut être rendu dans deux cadres, et rien n'empêche un cadre de le
 * déformer. On compare donc ce qui est RENDU, des deux côtés, dans un
 * vrai navigateur.
 *
 * Elle vérifie quatre choses, et pas une de plus :
 *   1. la même première porte, avec les mêmes mots et les mêmes boutons ;
 *   2. la même connexion, avec les DEUX chemins en boutons ;
 *   3. la même palette — plus une trace du bleu d'avant, nulle part ;
 *   4. une seule fermeture par écran (deux croix font hésiter).
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(
    `  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`,
  );
  if (!cond) fallos++;
};

const navegador = await chromium.launch({ executablePath: CHROME });
const limpio = (t) => (t ?? "").replace(/\s+/g, " ").trim();

/** L'app : écran plein, personne de connecté, pas encore invité. */
async function enApp() {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  await ctx.addInitScript(() =>
    window.sessionStorage.setItem("partimos.ya-abierta", "1"),
  );
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "load" });
  await p.waitForTimeout(700);
  await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  await p.waitForTimeout(900);
  /* `.puerta` et non `.solo-app` : la porte est posée EN PLEIN ÉCRAN
     par-dessus l'app, qui continue d'exister derrière elle. Mesurer
     `.solo-app` ramenait aussi le texte de l'écran caché — et faisait
     échouer la comparaison sur une différence qui n'en était pas une. */
  return { ctx, p, zona: () => p.locator(".puerta").first() };
}

/** Le site : la feuille d'entrée, ouverte depuis « Mi cuenta ». */
async function enSitio() {
  const ctx = await navegador.newContext({ viewport: { width: 1180, height: 900 } });
  await ctx.addInitScript(() =>
    window.sessionStorage.setItem("partimos.invitado", "1"),
  );
  const p = await ctx.newPage();
  await p.goto(`${BASE}/cuenta`, { waitUntil: "load" });
  await p.waitForTimeout(1100);
  /* La page monte les DEUX moitiés — celle de l'app est simplement
     masquée par la CSS. Sans `:visible`, on viserait le bouton du
     fantôme et le clic partirait dans le vide. */
  const abrir = p
    .locator("button:visible", { hasText: /Conectarme o crear cuenta/ })
    .first();
  await abrir.click();
  await p.waitForTimeout(900);
  return { ctx, p, zona: () => p.locator("[role=dialog]").first() };
}

console.log(`\nAcceso — ${BASE}\n`);

/* ══════════════════════════════════════════════════════════════════
   1. LA MÊME PREMIÈRE PORTE.
   ══════════════════════════════════════════════════════════════════ */
const textos = {};
for (const [nombre, abrir] of [
  ["app", enApp],
  ["sitio", enSitio],
]) {
  const { ctx, zona } = await abrir();
  const t = limpio(await zona().innerText());
  textos[nombre] = t;

  ok(`${nombre} — la porte s'ouvre sur la promesse`, /Alguien ya va/.test(t), t.slice(0, 46));
  ok(
    `${nombre} — les trois arguments, nommés`,
    /Viaja a donde quieras/.test(t) &&
      /Viaja protegido/.test(t) &&
      /Paga mucho menos/.test(t),
  );
  ok(`${nombre} — « Crear cuenta » en premier`, /Crear cuenta/.test(t));
  ok(`${nombre} — « Iniciar sesión » en second`, /Iniciar sesión/.test(t));

  /* UNE SEULE FERMETURE. La feuille du site porte déjà sa croix ; la
     portada posait la sienne par-dessus, et deux croix au même endroit
     font hésiter au lieu de rassurer. */
  const cierres = await zona()
    .locator('button[aria-label="Cerrar"], button[aria-label="Seguir sin cuenta"]')
    .count();
  ok(`${nombre} — une seule fermeture`, cierres <= 1, `${cierres} trouvée(s)`);

  await ctx.close();
}

/* LE MÊME TEXTE, MOT POUR MOT. C'est la vérification qui tient toutes
   les autres : si les deux moitiés divergent un jour, c'est ici que ça
   se verra, sans qu'il faille l'avoir prévu. */
{
  /* Deux textes ne comptent pas dans la comparaison, et pour deux
     raisons opposées :
       · « Solo quiero buscar viajes » n'existe que dans l'app, où la
         porte s'interpose. Sur le site on est déjà en train de chercher.
       · le titre et la description de la feuille sont en `sr-only` : ils
         existent pour les lecteurs d'écran, qui ont besoin d'un nom de
         dialogue, et ne sont vus par personne d'autre. `innerText` les
         rend quand même (ils sont rognés, pas retirés du flux). */
  const quitar = (t) =>
    t
      .replace(/Solo quiero buscar viajes/, "")
      .replace(/Entrar o crear tu cuenta/, "")
      .replace(/Con tu contraseña o con un enlace por correo\./, "")
      .replace(/\s+/g, " ")
      .trim();
  const a = quitar(textos.app);
  const s = quitar(textos.sitio);
  ok(
    "les deux portes disent EXACTEMENT la même chose",
    a === s,
    a === s
      ? ""
      : (() => {
          const i = [...a].findIndex((c, k) => c !== s[k]);
          return `divergent au caractère ${i} — app «${a.slice(Math.max(0, i - 20), i + 40)}» / sitio «${s.slice(Math.max(0, i - 20), i + 40)}»`;
        })(),
  );
}

/* ══════════════════════════════════════════════════════════════════
   2. LA MÊME CONNEXION, ET SES DEUX CHEMINS.
   ══════════════════════════════════════════════════════════════════ */
for (const [nombre, abrir] of [
  ["app", enApp],
  ["sitio", enSitio],
]) {
  const { ctx, p, zona } = await abrir();
  await zona().getByRole("button", { name: "Iniciar sesión" }).first().click();
  await p.waitForTimeout(600);
  const t = limpio(await zona().innerText());

  ok(`${nombre} — l'écran de connexion`, /Entra a tu cuenta/.test(t), t.slice(0, 40));
  ok(`${nombre} — il demande un mot de passe`, /contraseña/i.test(t));
  ok(
    `${nombre} — le lien par correo est un BOUTON`,
    await zona()
      .getByRole("button", { name: /Mándame un enlace/ })
      .first()
      .isVisible()
      .catch(() => false),
  );
  ok(
    `${nombre} — et il dit à qui il sert`,
    /nunca escogiste una contraseña/.test(t),
  );
  ok(`${nombre} — la sortie vers l'inscription`, /Crear cuenta/.test(t));

  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   3. UNE SEULE PALETTE, ET PLUS AUCUN BLEU.
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, p, zona } = await enSitio();
  /* La feuille du site était une carte bleu nuit. On mesure sa couleur
     de fond RÉELLE : c'est ce que voit l'utilisateur, pas ce que dit une
     classe. Un fond clair a une luminance haute — on la calcule plutôt
     que de comparer une chaîne, parce que la valeur exacte a le droit
     de bouger et le CARACTÈRE clair n'en a pas le droit. */
  const fondo = await zona().evaluate((el) => getComputedStyle(el).backgroundColor);
  const [r, g, b] = (fondo.match(/\d+/g) ?? [0, 0, 0]).map(Number);
  const luz = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  ok("la feuille d'entrée est CLAIRE, plus une carte bleu nuit", luz > 0.8, fondo);
  /* Bleu = le canal bleu domine nettement. Sur une surface chaude c'est
     l'inverse qui doit être vrai. */
  ok("…et sa teinte est chaude", r >= b, `r${r} b${b}`);

  const azul = await p.evaluate(() => {
    const c = getComputedStyle(document.documentElement);
    return [
      "--color-accent",
      "--color-accent-ink",
      "--color-accent-soft",
      "--color-action",
      "--color-action-ink",
      "--color-naranja",
    ]
      .map((v) => c.getPropertyValue(v).trim())
      .join(" ");
  });
  ok("aucun jeton d'accent n'est resté bleu", !/0284c7|0369a1|e0f2fe/i.test(azul), azul);
  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   4. LES RÈGLES DE LA MAISON TIENNENT SUR LA PORTE AUSSI.
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, zona } = await enSitio();
  const t = limpio(await zona().innerText());
  ok("aucun « gratis »", !/\bgratis\b/i.test(t));
  ok("aucune « tarifa de reserva »", !/sin\s+tarifa\s+de\s+reserva/i.test(t));
  ok(
    "aucun émoji",
    !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t),
  );
  await ctx.close();
}

await navegador.close();

console.log(
  fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`,
);
process.exit(fallos === 0 ? 0 : 1);
