#!/usr/bin/env node
/**
 * BATTERIE DE L'ÉCRAN « BUSCAR » — dans un vrai navigateur.
 *
 *   node scripts/verify-buscar.mjs [url]     (défaut : http://localhost:3100)
 *
 * Ce qu'elle protège :
 *
 *   · le SITE garde sa page de résultats large — l'app ne la remplace pas,
 *     elle s'ajoute à côté, et le HTML servi reste le même pour Google ;
 *   · l'APP montre bien SA page : en-tête de route, filtres, tri, cartes ;
 *   · la carte de résultat dit l'heure, l'aporte PAR PUESTO, le conducteur
 *     et les arrêts traversés — c'est le minimum pour choisir ;
 *   · les filtres retirent vraiment des résultats, et le tri « menor
 *     aporte » ordonne vraiment ;
 *   · aucun résultat ≠ page vide : il reste une sortie ;
 *   · le lien d'une carte emporte le TRONÇON choisi (`?desde=&hacia=`),
 *     sans quoi la fiche viaje afficherait le prix du trajet entier.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

/** La date du jour, en local : les viajes de démonstration sont générés
 *  autour d'aujourd'hui, une date en dur périmerait la batterie. */
const d = new Date();
const HOY = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const RUTA = `desde=panama-city&hacia=chitre&fecha=${HOY}&puestos=1`;

/* UNE DATE PASSÉE sur une route qui existe : c'est le vrai cas « rien ce
   jour-là ». Une date lointaine ne l'est pas — l'inventaire de
   démonstration est déterministe et remplit n'importe quel jour futur. */
const a = new Date(d.getTime() - 30 * 86_400_000);
const AYER = `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, "0")}-${String(a.getDate()).padStart(2, "0")}`;

/** ÉMOJI, mais pas « tout ce qui est pictographique ».
 *  `\p{Extended_Pictographic}` attrape aussi ©, ® et ™ — le pied de page
 *  a fait tomber la batterie entière pour un signe de copyright. On ne
 *  garde donc que ce qui s'AFFICHE en émoji : présentation émoji par
 *  défaut, ou forcée par le sélecteur de variante U+FE0F. */
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;

const navegador = await chromium.launch({ executablePath: CHROME });

async function abrir(query, { modo = "app" } = {}) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/buscar?${query}`, { waitUntil: "load" });

  /* ON ATTEND L'HYDRATATION AVANT DE FORCER LE MODE APP.
     Deux raisons, et les deux ont mordu :
       · la page de résultats est entièrement cliente (elle lit l'URL) —
         avant hydratation il n'y a qu'un squelette, et tout est « absent » ;
       · `PWA.tsx` REPOSE la classe `app-instalada` selon sa détection au
         montage. Posée trop tôt, elle est effacée une seconde plus tard,
         et l'app reste masquée alors que son DOM est bien là — un piège
         parfait, puisque `textContent` répond quand même.
     `.solo-app header` n'existe que quand le composant de l'app a rendu. */
  await p
    .locator(".solo-app header")
    .first()
    .waitFor({ state: "attached", timeout: 20_000 })
    .catch(() => {});

  if (modo === "app") {
    await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  }
  await p.waitForTimeout(400);
  return { ctx, p };
}

/** TOUT CE QUI EST « APP » EST SCOPÉ.
 *  Le HTML servi contient les DEUX pages — le mode app ne masque qu'à
 *  l'affichage. Un `select` ou un `header` non scopé attrape celui du
 *  site, invisible, et la batterie mesure alors le mauvais élément. */
const app = (p) => p.locator(".solo-app");
const web = (p) => p.locator(".solo-web");

console.log(`\nBuscar — ${BASE}\n`);

/* 1. LE SITE n'a rien perdu. */
{
  const { ctx, p } = await abrir(RUTA, { modo: "sitio" });
  /* La page du site n'a pas le buscador du Hero (`#desde` n'existe qu'à
     l'accueil) : ce qui la caractérise, c'est son résumé de recherche et
     sa liste de cartes larges. */
  ok(
    "site — la liste large est là",
    await web(p).locator("a[href*='/viaje/']").first().isVisible().catch(() => false),
  );
  ok(
    "site — l'en-tête d'app est masqué",
    !(await p.getByRole("button", { name: "Filtros" }).first().isVisible().catch(() => false)),
  );
  await ctx.close();
}

/* 2. L'APP montre sa page. */
{
  const { ctx, p } = await abrir(RUTA);
  ok(
    "app — la liste du site est masquée",
    !(await web(p).locator("a[href*='/viaje/']").first().isVisible().catch(() => false)),
  );

  const cabecera = app(p).locator("header").first();
  const th = (await cabecera.textContent().catch(() => "")) ?? "";
  ok("app — la route est nommée en haut", /Panam.*→/.test(th), th.replace(/\s+/g, " ").slice(0, 40));
  ok("app — on peut corriger sans repartir", th.includes("Editar"));
  ok("app — les filtres sont là", await app(p).locator("button:has-text('Filtros')").first().isVisible().catch(() => false));
  ok("app — le tri est là", await app(p).locator("select").first().isVisible().catch(() => false));

  /* L'en-tête doit rester collé en haut au défilement : c'est là que se
     trouve le retour et la route, sur un écran qui défile beaucoup. */
  await p.evaluate(() => window.scrollBy(0, 900));
  await p.waitForTimeout(250);
  const y = (await cabecera.boundingBox())?.y ?? -999;
  ok("app — l'en-tête reste collé en haut", Math.abs(y) <= 2, `y = ${Math.round(y)} px`);
  await p.evaluate(() => window.scrollTo(0, 0));

  const tarjetas = app(p).locator("ul > li > a[href*='/viaje/']");
  const n = await tarjetas.count();
  ok("app — il y a des résultats", n > 0, `${n} carte(s)`);

  const t0 = (await tarjetas.first().textContent().catch(() => "")) ?? "";
  ok("carte — l'heure", /\d{1,2}:\d{2}/.test(t0));
  ok("carte — l'aporte par puesto", /\$\s?\d/.test(t0) && t0.includes("por puesto"));
  /* Le badge de puestos libres, mesuré SUR le badge : dans le texte
     concaténé d'une carte, « por puesto » suffirait à faire passer un
     test naïf alors que le badge aurait disparu. */
  ok(
    "carte — le badge de puestos libres",
    /^\d+ puestos?$/.test(
      ((await tarjetas.first().locator("span.rounded-full").first().textContent()) ?? "").trim(),
    ),
  );
  ok("carte — le conducteur et sa note", /\d\.\d/.test(t0));
  /* « DIRECTO » A ÉTÉ RENOMMÉ, et c'est une correction de fond.
     Posé au-dessus de « viene desde Panamá », il se lisait comme « le
     conducteur part d'ici » — l'exact contraire. « Sin paradas en tu
     tramo » dit la même chose sans promettre un départ qui n'existe pas. */
  ok("carte — sin paradas ou parada", /Sin paradas|parada/.test(t0));

  /* LE TRONÇON EST DANS LE LIEN. Sans lui, la fiche afficherait le prix
     du trajet entier — c'est la faute la plus coûteuse de cet écran. */
  const href = (await tarjetas.first().getAttribute("href")) ?? "";
  ok("carte — le lien porte le tronçon", /desde=[a-z-]+&hacia=[a-z-]+/.test(href), href.slice(0, 64));

  /* LE BANDEAU COMPTE ce qui est affiché, il ne se félicite pas. */
  const banda = (await app(p).getByText(/viajes? disponibles?/).first().textContent()) ?? "";
  ok("bandeau — le compte correspond", banda.trim().startsWith(String(n)), `${banda.trim().slice(0, 24)} / ${n} cartes`);

  /* LE TRI trie vraiment. */
  const precios = async () =>
    (await tarjetas.evaluateAll((els) =>
      els.map((e) => {
        const m = e.textContent.match(/\$\s?([\d.,]+)/);
        return m ? parseFloat(m[1].replace(",", "")) : NaN;
      }),
    ));
  await app(p).locator("select").first().selectOption("barato");
  await p.waitForTimeout(300);
  const pr = await precios();
  ok(
    "tri — « menor aporte » ordonne vraiment",
    pr.every((v, i) => i === 0 || pr[i - 1] <= v),
    pr.join(" ≤ "),
  );

  /* LES FILTRES retirent vraiment. */
  const directosAntes = (await tarjetas.allTextContents()).filter((t) =>
    t.includes("Sin paradas"),
  ).length;
  await app(p).getByRole("button", { name: /Filtros/ }).first().click();
  await p.waitForTimeout(200);
  await app(p).getByRole("button", { name: "Sin paradas intermedias" }).click();
  await p.waitForTimeout(300);
  const nDir = await tarjetas.count();
  const textos = await tarjetas.allTextContents();
  ok("filtre — « sin paradas » ne laisse que ceux-là",
    textos.every((t) => t.includes("Sin paradas")),
    `${nDir} carte(s)`);
  /* Le filtre et l'étiquette doivent dire la MÊME chose : le nombre de
     cartes qui restent est exactement le nombre de cartes étiquetées
     « Directo » avant filtrage. Deux définitions de « direct » qui
     divergent, c'est un écran qui ment. */
  ok("filtre — le compte suit l'étiquette", nDir === directosAntes, `${nDir} restantes / ${directosAntes} étiquetées`);
  await app(p).getByRole("button", { name: "Sin paradas intermedias" }).click();
  await p.waitForTimeout(250);
  ok("filtre — se retire aussi", (await tarjetas.count()) === n);
  /* « VOUS ÊTES ICI » : l'onglet Buscar doit être allumé sur la page
     de résultats — sinon la barre ne dit pas où on est — et lui seul. */
  const barra = p.locator('nav[aria-label="Navegación principal"]');
  const activos = await barra.locator('a[aria-current="page"]').allTextContents();
  ok("barre — l'onglet Buscar est allumé", activos.length === 1 && activos[0].includes("Buscar"), activos.join(", ") || "aucun");
  await ctx.close();
}

/* 2 bis. LA CARTE — la même recherche, vue sur le pays. */
{
  /* LA VUE CARTE A ÉTÉ RETIRÉE du produit, à la demande répétée du
     propriétaire. Ce bloc vérifiait ses seize propriétés ; il vérifie
     maintenant qu'elle ne revient pas.

     On ne supprime pas simplement les tests : une fonctionnalité retirée
     qui repousse en silence est exactement ce qu'une batterie doit
     attraper. Et les propriétés de prix qu'elle contrôlait — l'aporte
     monte avec la distance, la carte et la liste disent le même montant —
     restent couvertes par verify-viaje sur l'écran du viaje. */
  const { ctx, p } = await abrir(RUTA);
  const zona = app(p).first();
  ok(
    "carte — le segmenté Lista/Mapa a disparu",
    (await zona.getByRole("button", { name: "Mapa" }).count()) === 0,
  );
  ok(
    "carte — aucun tracé de résultats",
    (await zona.locator("ul[aria-label='Viajes en el mapa']").count()) === 0,
  );
  ok(
    "carte — la liste est la seule vue, et elle est là",
    (await zona.locator("ul > li > a[href*='/viaje/']").count()) > 0,
  );
  await ctx.close();
}

/* 3. AUCUN RÉSULTAT : il reste une sortie. */
{
  const { ctx, p } = await abrir(`desde=panama-city&hacia=chitre&fecha=${AYER}&puestos=1`);
  ok("vide — le message est là", await app(p).getByText("Nadie va por ahí ese día").first().isVisible().catch(() => false));
  ok("vide — une sortie est offerte", await app(p).locator("a[href*='/ya']").first().isVisible().catch(() => false));
  ok("vide — aucune carte", (await app(p).locator("ul > li > a[href*='/viaje/']").count()) === 0);
  await ctx.close();
}

/* 4. LES INTERDITS DE LA MAISON, sur l'écran qui parle d'argent. */
{
  const { ctx, p } = await abrir(RUTA);
  /* `.solo-app` marque PLUSIEURS blocs (la page, le pied, la barre
     d'onglets) : on les lit tous, sinon le mode strict de Playwright
     refuse — et lire un seul aurait laissé passer le reste. */
  const cuerpo = (await app(p).allTextContents()).join(" ");
  ok("règles — aucun « gratis »", !/gratis/i.test(cuerpo));
  ok("règles — aucune « tarifa de reserva »", !/tarifa de reserva/i.test(cuerpo));
  ok("règles — aucun émoji", !EMOJI.test(cuerpo));
  ok("règles — le prix est dit PAR PUESTO", cuerpo.includes("por puesto"));
  await ctx.close();
}

/* 5. LE HTML SERVI ne dépend pas du mode — la règle de la maison. */
{
  const brut = await fetch(`${BASE}/buscar`).then((r) => r.text());
  const h1 = (brut.match(/<h1[\s>]/g) ?? []).length;
  ok("SEO — au plus un h1 dans le HTML servi", h1 <= 1, `${h1} trouvé(s)`);
  for (const id of ["desde", "hacia"]) {
    const n = (brut.match(new RegExp(`id="${id}"`, "g")) ?? []).length;
    ok(`id « ${id} » unique dans le HTML`, n <= 1, `${n} occurrence(s)`);
  }
}

await navegador.close();

console.log(fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`);
process.exit(fallos === 0 ? 0 : 1);
