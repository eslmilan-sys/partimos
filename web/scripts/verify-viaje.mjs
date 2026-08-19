#!/usr/bin/env node
/**
 * BATTERIE DE LA FICHE VIAJE ET DE LA RÉSERVATION — dans un vrai navigateur.
 *
 *   node scripts/verify-viaje.mjs [url]     (défaut : http://localhost:3100)
 *
 * Ce qu'elle protège :
 *
 *   · le SITE garde sa fiche large ; l'app a la sienne, et le HTML servi
 *     contient les deux — la règle de la maison ;
 *   · le TRONÇON de l'URL décide de tout : un lien Penonomé → Santiago ne
 *     doit pas afficher le prix de Panamá → David ;
 *   · le PRIX de la fiche est celui de la liste et celui de la feuille de
 *     réservation — un seul moteur, trois affichages ;
 *   · la feuille propose les TROIS canaux de paiement, et ne dit jamais
 *     « gratis » ni « tarifa de reserva » (demande du propriétaire) ;
 *   · aucun émoji dans l'interface.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

/** ÉMOJI, mais pas « tout ce qui est pictographique ».
 *  `\p{Extended_Pictographic}` attrape aussi ©, ® et ™ — le pied de page
 *  a fait tomber la batterie entière pour un signe de copyright. On ne
 *  garde donc que ce qui s'AFFICHE en émoji : présentation émoji par
 *  défaut, ou forcée par le sélecteur de variante U+FE0F. */
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;

const navegador = await chromium.launch({ executablePath: CHROME });

/** Un viaje du jour, trouvé par la recherche elle-même : un identifiant
 *  en dur périmerait la batterie au premier changement de calendrier. */
const d = new Date();
const HOY = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

async function primerViaje() {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  const p = await ctx.newPage();
  await p.goto(
    `${BASE}/buscar?desde=panama-city&hacia=chitre&fecha=${HOY}&puestos=1`,
    { waitUntil: "load" },
  );
  await p.locator(".solo-app header").first().waitFor({ state: "attached", timeout: 20_000 });
  /* UN VIAJE AVEC DES ARRÊTS INTERMÉDIAIRES. L'inventaire tourne avec
     la date : « le premier résultat » est parfois direct, et la ligne de
     temps n'a alors qu'un seul prix à montrer. On cherche donc celui qui
     en porte, et on le reconnaît à son COMPTE.

     Le mot « parada » seul ne suffit plus : la carte directe s'appelle
     maintenant « Sin paradas en tu tramo » (« Directo » se lisait comme
     « le conducteur part d'ici », juste au-dessus de « viene desde
     Panamá »). Chercher le mot attrapait donc exactement la carte qu'on
     voulait éviter. Un chiffre devant, et l'ambiguïté disparaît. */
  const todas = p.locator(".solo-app ul > li > a[href*='/viaje/']");
  const textos = await todas.allTextContents();
  const i = textos.findIndex((t) => /\d+ paradas? intermedia/.test(t));
  const carta = todas.nth(i >= 0 ? i : 0);
  const href = await carta.getAttribute("href");
  const precio = (((await carta.textContent()) ?? "").match(/\$\s?[\d.,]+/) ?? [""])[0];
  await ctx.close();
  return { href, precio };
}

async function abrir(href, { modo = "app" } = {}) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  const p = await ctx.newPage();
  await p.goto(`${BASE}${href}`, { waitUntil: "load" });
  /* On attend l'hydratation AVANT de forcer le mode app : `PWA.tsx`
     repose la classe au montage et effacerait la nôtre. */
  await p
    .locator(".solo-app h2")
    .first()
    .waitFor({ state: "attached", timeout: 20_000 })
    .catch(() => {});
  if (modo === "app") {
    await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  }
  await p.waitForTimeout(400);
  return { ctx, p };
}

const app = (p) => p.locator(".solo-app").first();

/** L'APORTE DU TRONÇON, lu dans SON bloc. Prendre « le premier montant
 *  de la page » aurait attrapé le premier prix de la timeline — et le
 *  test aurait mesuré autre chose que ce qu'il annonce. */
const aporte = async (p) => {
  const t = ((await app(p).textContent()) ?? "").replace(/\s+/g, " ");
  return (t.match(/Aporte por puesto\s*(\$\s?[\d.,]+)/) ?? [null, ""])[1];
};

console.log(`\nViaje — ${BASE}\n`);

const { href, precio } = await primerViaje();
ok("on trouve un viaje depuis la recherche", Boolean(href), href ?? "aucun");

/* 1. LE SITE garde sa fiche. */
{
  const { ctx, p } = await abrir(href, { modo: "sitio" });
  ok(
    "site — la fiche large est là",
    await p.locator(".solo-web").first().isVisible().catch(() => false),
  );
  ok(
    "site — la barre de réservation de l'app est masquée",
    !(await app(p).getByRole("button", { name: /Reservar|Pedir el puesto/ }).first().isVisible().catch(() => false)),
  );
  await ctx.close();
}

/* 2. L'APP montre sa fiche, et elle dit le nécessaire. */
{
  const { ctx, p } = await abrir(href);
  const texto = ((await app(p).textContent()) ?? "").replace(/\s+/g, " ");

  ok("app — la route est en titre", /Panam.*→.*Chitr/.test(texto));
  ok("app — le tracé est dessiné", (await app(p).locator("svg").count()) > 0);
  ok("app — qui maneja, avec sa note", /\d\.\d/.test(texto));
  ok("app — el recorrido", texto.includes("El recorrido"));
  /* Les arrêts sont NOMMÉS — lesquels dépend du viaje et du jour. Ce
     qu'on vérifie, c'est que la ligne de temps porte au moins les deux
     extrémités, avec leurs vrais noms. */
  ok("app — les paradas sont nommées",
    /Panam/.test(texto) && /Chitr|David|Santiago|Penonom|Coronado|Las Tablas/.test(texto));
  ok("app — le carro est dit", /\d{4}/.test(texto) && /Kia|Toyota|Hyundai|Nissan|Honda|Mitsubishi|Suzuki|Chevrolet|Mazda|Kia/.test(texto));
  ok("app — l'aporte est par puesto", texto.includes("Aporte por puesto") && texto.includes("por puesto"));
  ok("app — d'où sort l'aporte est expliqué", /km de este tramo/.test(texto));
  ok("app — le chat remplace le numéro", /Nadie da su n/.test(texto));

  /* LE PRIX EST LE MÊME QU'À LA LISTE. Deux chemins de calcul qui
     divergent sur l'argent, c'est le bug le plus coûteux du produit. */
  ok("app — le prix est celui de la liste", (await aporte(p)) === precio, `${await aporte(p)} / ${precio}`);

  /* LA BARRE DE RÉSERVATION est ancrée en bas et atteint le pouce. */
  const barra = app(p).getByRole("button", { name: /Reservar|Pedir el puesto/ }).first();
  const b = await barra.boundingBox();
  const vp = p.viewportSize();
  ok("app — le bouton réserver est visible", b !== null);
  ok("app — il est dans le bas de l'écran", b !== null && b.y + b.height <= vp.height + 1 && b.y > vp.height * 0.6, b ? `y ${Math.round(b.y)} / ${vp.height}` : "absent");
  ok("app — cible ≥ 44 px", b !== null && b.height >= 44, b ? `${Math.round(b.height)} px` : "");

  await ctx.close();
}

/* 3. LA FEUILLE DE RÉSERVATION — les trois canaux, et les interdits. */
{
  const { ctx, p } = await abrir(href);
  await app(p).getByRole("button", { name: /Reservar|Pedir el puesto/ }).first().click();
  await p.waitForTimeout(700);

  const hoja = p.locator("[role=dialog]").first();
  ok("feuille — elle s'ouvre", await hoja.isVisible().catch(() => false));
  const t = ((await hoja.textContent()) ?? "").replace(/\s+/g, " ");

  ok("feuille — le prix par puesto", t.includes(precio) && t.includes("por puesto"), precio);
  ok("feuille — on choisit combien de puestos", /Cuántos puestos/i.test(t));
  ok("feuille — on choisit où on monte", /Dónde te recoge/i.test(t));

  /* LES TROIS CANAUX, dans l'ordre de la maison. */
  ok("feuille — Yappy", /Yappy/i.test(t));
  ok("feuille — tarjeta", /Tarjeta/i.test(t));
  ok("feuille — efectivo", /Efectivo/i.test(t));

  /* LES INTERDITS DU PROPRIÉTAIRE, mot pour mot. */
  ok("feuille — jamais « gratis »", !/gratis/i.test(t));
  ok("feuille — jamais « tarifa de reserva »", !/tarifa de reserva/i.test(t));
  ok("feuille — aucun émoji", !EMOJI.test(t));

  /* On peut la refermer : une feuille sans sortie est un piège. */
  await p.getByRole("button", { name: "Cerrar" }).first().click();
  await p.waitForTimeout(400);
  ok("feuille — elle se referme", !(await hoja.isVisible().catch(() => false)));
  await ctx.close();
}

/* 4. DESCENDRE PLUS TÔT COÛTE MOINS — lu SUR la page, pas deviné.
      La version d'avant demandait `?hacia=penonome` en dur : dès que le
      premier résultat du jour changeait de corridor, elle mesurait le
      repli sur le trajet complet et se comparait à elle-même. On lit
      donc la ligne de temps, qui porte le prix jusqu'à CHAQUE arrêt de
      ce viaje-là. */
{
  const { ctx, p } = await abrir(href);
  const texto = ((await app(p).textContent()) ?? "").replace(/\s+/g, " ");
  const montos = [...texto.matchAll(/\$\s?([\d.,]+) desde /g)].map((m) =>
    parseFloat(m[1].replace(",", "")),
  );
  ok("recorrido — chaque parada porte son prix", montos.length >= 2, montos.join(" "));
  ok(
    "recorrido — el aporte sube parada tras parada",
    montos.every((v, i) => i === 0 || montos[i - 1] < v),
    montos.join(" < "),
  );
  /* Et le dernier de la ligne de temps est bien l'aporte du tronçon. */
  ok(
    "recorrido — le dernier est celui du bloc aporte",
    `$${montos[montos.length - 1].toFixed(2)}` === (await aporte(p)),
    `${montos[montos.length - 1]} / ${await aporte(p)}`,
  );
  await ctx.close();

  /* Un lien sans paramètres ne doit pas casser : on retombe sur le
     trajet complet plutôt que sur une page vide. */
  const { ctx: c2, p: p2 } = await abrir(href.split("?")[0]);
  const solo = ((await app(p2).textContent()) ?? "").replace(/\s+/g, " ");
  ok("tronçon — un lien nu retombe sur le trajet complet", /Aporte por puesto/.test(solo));
  await c2.close();
}

/* 5. LE HTML SERVI ne dépend pas du mode. */
{
  const brut = await fetch(`${BASE}${href.split("?")[0]}`).then((r) => r.text());
  const h1 = (brut.match(/<h1[\s>]/g) ?? []).length;
  ok("SEO — au plus un h1 dans le HTML servi", h1 <= 1, `${h1} trouvé(s)`);
  ok("SEO — la barre d'onglets est servie à tous", brut.includes("Navegación principal"));
}

await navegador.close();

console.log(fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`);
process.exit(fallos === 0 ? 0 : 1);
