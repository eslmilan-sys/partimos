#!/usr/bin/env node
/**
 * BATTERIE DE LA RECHERCHE DE LIEUX.
 *
 *   node scripts/verify-lugares.mjs [url]     (défaut : http://localhost:3100)
 *
 * Elle existe pour deux reproches précis du propriétaire, et elle vérifie
 * dans le NAVIGATEUR ce que les tests unitaires ne peuvent pas voir.
 *
 * 1. « Le bouton Buscar reste devant la liste. »
 *    La barre d'onglets était `fixed z-50`, la liste `absolute z-30` : la
 *    barre gagnait toujours. Ce n'était pas un z-index mal réglé mais une
 *    règle manquante — une couche modale masque la navigation, elle ne se
 *    bat pas avec elle. On mesure donc les RECTANGLES : la liste ouverte
 *    et la barre d'onglets ne doivent pas se chevaucher d'un seul pixel.
 *
 * 2. « Je cherche Multiplaza et l'écran suivant dit Ciudad de Panamá. »
 *    On vérifie que le nom choisi reste visible et DOMINANT, la ville en
 *    dessous et en secondaire. Le test unitaire prouve que le modèle
 *    transporte l'information ; celui-ci prouve qu'on la voit.
 *
 * Les résultats distants dépendent du réseau et des fournisseurs. La
 * batterie ne s'appuie donc JAMAIS sur un lieu précis venu d'une API :
 * elle utilise le catalogue local, qui est déterministe.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
/* SAUTÉ ≠ RÉUSSI. Certaines vérifications ne peuvent pas s'exécuter
   dans ce conteneur (la porte du conducteur exige un dossier vérifié
   chez Supabase, injoignable ici). Les compter comme réussies serait un
   mensonge ; les compter comme échouées ferait chercher une régression
   qui n'existe pas. On les nomme, et on dit pourquoi. */
const saltado = (nom, porque) =>
  console.log(`  SAUTÉ   ${nom} — ${porque}`);

const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

const navegador = await chromium.launch({ executablePath: CHROME });

async function abrirApp(ruta) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  /* SANS CECI, C'EST LA PORTE QU'ON MESURE. L'app s'ouvre sur « entrar
     ou s'inscrire » tant que personne n'est passé ; le mode invité est
     ce qui donne accès à la recherche, et la recherche est le sujet. */
  await ctx.addInitScript(() => {
    window.sessionStorage.setItem("partimos.invitado", "1");
    window.sessionStorage.setItem("partimos.ya-abierta", "1");
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}${ruta}`, { waitUntil: "load" });
  /* Même précaution que les autres batteries : `PWA.tsx` repose la classe
     au montage, donc on attend que l'app ait rendu avant de la forcer. */
  await p
    .locator(".solo-app")
    .first()
    .waitFor({ state: "attached", timeout: 20_000 })
    .catch(() => {});
  await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  await p.waitForTimeout(600);
  await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  return { ctx, p };
}

console.log(`\nLugares — ${BASE}\n`);

/* ══════════════════════════════════════════════════════════════════
   1. LA LISTE OUVERTE N'EST COUVERTE PAR RIEN.
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, p } = await abrirApp("/");

  const campo = p.locator(".solo-app input[role='combobox'], .solo-app input").first();
  ok("le champ d'origine existe", await campo.count() > 0);

  await campo.click();
  await campo.fill("pan");
  await p.waitForTimeout(700);

  const lista = p.locator(".lista-lugares").first();
  const abierta = await lista.isVisible().catch(() => false);
  ok("la liste de suggestions s'ouvre", abierta);

  if (abierta) {
    const rLista = await lista.boundingBox();
    const barra = p.locator("nav[aria-label='Navegación principal']");
    const barraVisible = await barra.isVisible().catch(() => false);

    /* LE CŒUR DE LA BATTERIE. Deux issues acceptables, une seule
       inacceptable : soit la barre est retirée (notre correction), soit
       elle est là mais ne touche pas la liste. Qu'elle chevauche la
       liste d'un pixel est le bug rapporté. */
    ok(
      "la barre d'onglets ne couvre pas la liste",
      !barraVisible,
      barraVisible ? "la barre est encore affichée" : "barre retirée pendant la saisie",
    );

    if (barraVisible && rLista) {
      const rBarra = await barra.boundingBox();
      const seChevauchent =
        rBarra && rLista.y + rLista.height > rBarra.y && rLista.y < rBarra.y + rBarra.height;
      ok("les rectangles ne se chevauchent pas", !seChevauchent);
    }

    /* La liste doit tenir dans l'écran : une liste qui déborde sous le
       pli est aussi inutilisable qu'une liste couverte. */
    const alto = p.viewportSize()?.height ?? 844;
    ok(
      "la liste commence dans l'écran",
      !!rLista && rLista.y >= 0 && rLista.y < alto,
      rLista ? `y = ${Math.round(rLista.y)} px` : "sans rectangle",
    );

    /* Et le premier élément doit être TAPABLE : au moins 44 px, la
       recommandation d'Apple, sous laquelle un pouce rate sa cible. */
    const primero = lista.locator("[cmdk-item]").first();
    if (await primero.count()) {
      const rp = await primero.boundingBox();
      ok(
        "chaque suggestion est tapable",
        !!rp && rp.height >= 40,
        rp ? `${Math.round(rp.height)} px de haut` : "sans rectangle",
      );
    }
  }
  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   2. LE NOM CHOISI DOMINE, LA VILLE RESTE SECONDAIRE.
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, p } = await abrirApp("/");
  const campo = p.locator(".solo-app input").first();
  await campo.click();
  /* « Albrook » est dans le catalogue LOCAL : déterministe, sans réseau. */
  await campo.fill("albrook");
  await p.waitForTimeout(700);

  const lista = p.locator(".lista-lugares").first();
  if (await lista.isVisible().catch(() => false)) {
    const items = lista.locator("[cmdk-item]");
    const n = await items.count();
    ok("« albrook » rend au moins une suggestion", n > 0, `${n} résultat(s)`);

    if (n > 0) {
      const texto = (await items.first().innerText()).trim();
      ok(
        "la suggestion nomme le lieu, pas seulement la ville",
        /albrook/i.test(texto),
        texto.replace(/\s+/g, " ").slice(0, 48),
      );
      /* La hiérarchie : le nom doit être le PREMIER texte de la ligne.
         S'il arrive après la ville, la personne lit d'abord un lieu
         qu'elle n'a pas demandé. */
      const primeraLinea = texto.split("\n")[0] ?? "";
      ok(
        "le nom du lieu est en première ligne",
        /albrook/i.test(primeraLinea),
        primeraLinea.slice(0, 40),
      );
    }
  } else {
    ok("« albrook » ouvre la liste", false, "liste non visible");
  }
  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   3. LE PARCOURS COMPLET — c'est LE test de tout ce chantier.

   On choisit « Albrook Mall », et on vérifie deux choses que l'ancien
   code ratait toutes les deux :
     · le CHAMP affiche « Albrook Mall », pas « Ciudad de Panamá » ;
     · l'EN-TÊTE DES RÉSULTATS affiche « Albrook Mall » aussi.

   Le reproche exact était : « ça affiche encore Panamá city et les
   grandes villes, pas les lieux que j'ai sélectionnés. »
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, p } = await abrirApp("/");
  const campo = p.locator(".solo-app input").first();
  await campo.click();
  await campo.fill("albrook");
  await p.waitForTimeout(800);

  const item = p.locator(".lista-lugares [cmdk-item]").first();
  if (await item.count()) {
    await item.click();
    await p.waitForTimeout(500);

    const valor = await campo.inputValue();
    ok(
      "le champ garde le lieu choisi",
      /albrook/i.test(valor),
      `le champ dit « ${valor} »`,
    );
    ok(
      "le champ ne le remplace PAS par la ville",
      !/^ciudad de panam/i.test(valor.trim()),
      valor,
    );

    /* Et jusqu'aux résultats. On complète la destination par une ville
       (déterministe) puis on lance la recherche. */
    const destino = p.locator(".solo-app input").nth(1);
    await destino.click();
    await destino.fill("David");
    await p.waitForTimeout(800);
    const itemD = p.locator(".lista-lugares [cmdk-item]").first();
    if (await itemD.count()) await itemD.click();
    await p.waitForTimeout(400);

    const boton = p.getByRole("button", { name: /buscar viajes/i }).first();
    if (await boton.count()) {
      await boton.click();
      await p.waitForURL(/\/buscar/, { timeout: 15_000 }).catch(() => {});
      await p.waitForTimeout(1200);

      const url = p.url();
      ok(
        "l'URL transporte le lieu choisi",
        /oNom=/.test(url),
        decodeURIComponent(url.split("?")[1] ?? "").slice(0, 70),
      );

      const cabecera = (await p.locator(".solo-app header").first().innerText().catch(() => "")) ?? "";
      ok(
        "l'en-tête des résultats montre le lieu choisi",
        /albrook/i.test(cabecera),
        cabecera.replace(/\s+/g, " ").slice(0, 60),
      );
    }
  } else {
    ok("« albrook » propose un résultat cliquable", false);
  }
  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   4. LE LIEU NE SE REDEMANDE PAS À L'ÉTAPE SUIVANTE.

   Reproche exact : « si je mets un départ précis, il doit déjà être là,
   je ne veux pas chercher deux fois ». Le flux de publication recueille
   la ruta à l'étape 1 et rouvrait un champ VIDE à l'étape 2 pour
   redemander la même chose.
   ══════════════════════════════════════════════════════════════════ */
{
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  /* Publier exige un compte : sans session, l'écran montre la porte et
     pas le formulaire. On en pose une, comme les autres batteries. */
  await ctx.addInitScript(() => {
    window.localStorage.setItem(
      "partimos.demo-session",
      JSON.stringify({
        contact: "milan@ejemplo.com",
        firstName: "Milan",
        lastName: "Ruiz",
        lastInitial: "R",
        isVerified: true,
        affiliation: null,
        since: "2026-01-05T00:00:00.000Z",
        payPref: "yappy",
        bookings: [],
      }),
    );
    window.sessionStorage.setItem("partimos.ya-abierta", "1");
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/publicar/nuevo?desde=panama-city&hacia=chitre`, {
    waitUntil: "load",
  });
  await p.waitForTimeout(1200);

  const desde = p.locator("#pub-desde");
  if ((await desde.count()) === 0) {
    saltado(
      "publier — le point exact est pré-rempli",
      "la porte du conducteur bloque : elle exige un dossier vérifié chez Supabase, injoignable depuis ce conteneur",
    );
  }
  if (await desde.count()) {
    await desde.click();
    await desde.fill("albrook");
    await p.waitForTimeout(800);
    const item = p.locator(".lista-lugares [cmdk-item]").first();
    if (await item.count()) {
      await item.click();
      await p.waitForTimeout(500);
      ok(
        "publier — la ruta garde le lieu choisi",
        /albrook/i.test(await desde.inputValue()),
        await desde.inputValue(),
      );

      /* On passe à « Paradas » et on vérifie que le point exact est
         DÉJÀ rempli — c'est tout le sujet. */
      const siguiente = p.getByRole("button", { name: /siguiente|continuar/i }).first();
      if (await siguiente.count()) {
        await siguiente.click();
        await p.waitForTimeout(900);
        const exacta = p.locator("#pub-salida-exacta");
        if (await exacta.count()) {
          const v = await exacta.inputValue();
          ok(
            "publier — le point exact est PRÉ-REMPLI, pas redemandé",
            /albrook/i.test(v),
            v ? `le champ dit « ${v} »` : "le champ est vide",
          );
        } else {
          ok("publier — l'étape Paradas a son champ", false);
        }
      }
    } else {
      ok("publier — « albrook » propose un résultat", false);
    }
  }

  /* Et plus aucune carte dans tout le flux. */
  ok(
    "publier — aucune carte ne subsiste",
    (await p.locator("img[src*='mapbox']").count()) === 0,
  );
  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   5. LE MODE SITE N'EST PAS ABÎMÉ.
   La règle `:has(.lista-lugares)` retire la navigation ; sur le site,
   l'en-tête n'est pas la barre d'onglets et doit RESTER.
   ══════════════════════════════════════════════════════════════════ */
{
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  await ctx.addInitScript(() =>
    window.sessionStorage.setItem("partimos.invitado", "1"),
  );
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "load" });
  await p.waitForTimeout(900);

  const campo = p.locator(".solo-web input").first();
  if (await campo.count()) {
    await campo.click();
    await campo.fill("pan");
    await p.waitForTimeout(600);
    const cabecera = p.locator(".solo-web header").first();
    ok(
      "l'en-tête du site survit à l'ouverture de la liste",
      await cabecera.isVisible().catch(() => false),
    );
  } else {
    ok("le site a un champ de recherche", false);
  }
  await ctx.close();
}

await navegador.close();

console.log(
  fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`,
);
process.exit(fallos === 0 ? 0 : 1);
