#!/usr/bin/env node
/**
 * BATTERIE DU FLUX DE PUBLICATION — une question par écran.
 *
 *   node scripts/verify-publicar.mjs [url]    (défaut : http://localhost:3100)
 *
 * Le flux a été redécoupé : douze écrans, UNE question chacun, sur la
 * MÊME adresse (décision du propriétaire). Ce choix crée trois risques
 * qu'aucun test unitaire ne peut voir, et ce sont exactement les trois
 * que cette batterie mesure dans un vrai navigateur.
 *
 * 1. DEUX QUESTIONS SUR UN MÊME ÉCRAN. C'est le défaut qu'on vient de
 *    corriger, et c'est celui qui revient le plus vite quand on ajoute
 *    un champ « pendant qu'on y est ». On compte donc les titres.
 *
 * 2. L'ADRESSE QUI BOUGE. « Ça peut être la même url et ça devrait
 *    d'ailleurs » : si une étape se met à pousser `/paso-3`, le partage
 *    d'un lien et le référencement changent de sens sans prévenir.
 *
 * 3. LE BOUTON RETOUR QUI QUITTE LE FORMULAIRE. C'est le prix normal de
 *    « la même adresse », et il est payé par `history.pushState`. S'il
 *    casse, on perd onze réponses en un geste — le pire bug possible
 *    sur un formulaire long, parce qu'on ne le refait jamais deux fois.
 *
 * Le compte des étapes n'est PAS codé en dur ici : la batterie lit
 * « Paso 1 de N » et vérifie que le formulaire tient sa propre promesse.
 * Ajouter une étape ne doit pas casser la batterie ; en oublier une dans
 * la barre de progression, si.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";
const RUTA = "/publicar/nuevo";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(
    `  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`,
  );
  if (!cond) fallos++;
};

const navegador = await chromium.launch({ executablePath: CHROME });

async function abrir(query = "") {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  /* Le mode invité ouvre la porte de l'app ; le brouillon est effacé
     pour que chaque scénario parte d'un formulaire vierge — sinon le
     deuxième reprendrait là où le premier s'est arrêté, ce qui est
     précisément le comportement voulu du produit et le pire des
     comportements pour un test. */
  await ctx.addInitScript(() => {
    window.sessionStorage.setItem("partimos.invitado", "1");
    window.sessionStorage.setItem("partimos.ya-abierta", "1");
    try {
      /* UNE SEULE FOIS PAR SCÉNARIO. `addInitScript` est rejoué à
         CHAQUE navigation, rechargement compris : sans ce drapeau, le
         test du brouillon effaçait lui-même ce qu'il venait vérifier et
         accusait le produit d'un bug qui était le sien. */
      if (!window.sessionStorage.getItem("partimos.test-limpio")) {
        window.localStorage.removeItem("partimos.borrador-publicar");
        window.sessionStorage.setItem("partimos.test-limpio", "1");
      }
    } catch {
      /* stockage refusé : rien à nettoyer */
    }
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}${RUTA}${query}`, { waitUntil: "load" });
  await p.waitForTimeout(900);
  return { ctx, p };
}

/** « Paso 3 de 12 » → { actual: 3, total: 12 }. */
async function paso(p) {
  /* `innerText` rend le texte TEL QU'IL S'AFFICHE : la ligne porte
     `uppercase`, donc elle arrive en « PASO 1 DE 12 ». Chercher « Paso »
     avec une majuscule seule ne trouvait rien — et la batterie
     annonçait un formulaire cassé alors qu'il marchait. */
  const texto = await p
    .locator("text=/paso \\d+ de \\d+/i")
    .first()
    .innerText()
    .catch(() => "");
  const m = texto.match(/paso (\d+) de (\d+)/i);
  return m ? { actual: Number(m[1]), total: Number(m[2]) } : null;
}

/* LA PAGE MONTE LE FLUX DEUX FOIS — une version app, une version site,
   et le CSS n'en montre qu'une. C'est voulu : les deux moitiés reçoivent
   le MÊME HTML, ce qui est tout l'intérêt pour le référencement. Une
   batterie qui ne filtre pas sur `:visible` compte donc tout en double
   et croit voir deux titres là où l'utilisateur en voit un. */
const continuar = (p) =>
  p.locator("button:visible", { hasText: /^Continuar$/ }).first();

/**
 * L'ÉCRAN DU CARRO EXIGE UNE RÉPONSE, ET C'EST NORMAL.
 *
 * Sans session, aucun carro n'est enregistré : « Continuar » reste
 * inactif tant qu'on n'a pas dit avec quoi on roule. C'est le produit qui
 * a raison — le taux au km sort du carro. La batterie répond donc comme
 * le ferait quelqu'un dont le modèle n'est pas au catalogue.
 */
async function responderCarro(p) {
  const marca = p.locator('select[aria-label="Marca del carro"]:visible').first();
  if ((await marca.count()) === 0) return;

  /* DEUX FORMULAIRES PEUVENT ÊTRE LÀ, ET C'EST NORMAL.
     Depuis que le carro se déclare DANS la page (le lien vers Mi cuenta
     était un abandon déguisé), l'étape montre le formulaire complet
     quand aucun carro n'est enregistré. Ce formulaire n'a pas d'option
     « Otro » : il écrit un vrai carro, et écrire un vrai carro exige un
     compte — que cette batterie n'a pas.
     Elle emprunte donc le chemin du visiteur sans compte : « mi carro no
     está en la lista », puis une catégorie. C'est un vrai parcours du
     produit, pas un contournement de test. */
  const sinLista = p
    .locator("button:visible", { hasText: /Mi carro no está en la lista/ })
    .first();
  if (await sinLista.count()) {
    await sinLista.click();
    await p.waitForTimeout(300);
  }

  const conOtro = p.locator('select[aria-label="Marca del carro"]:visible').first();
  if ((await conOtro.count()) === 0) return;
  const valores = await conOtro
    .locator("option")
    .evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
  if (!valores.includes("otro")) return;
  await conOtro.selectOption("otro");
  await p.waitForTimeout(250);
}

console.log(`\nPublicar — ${BASE}\n`);

/* ══════════════════════════════════════════════════════════════════
   1. UNE QUESTION PAR ÉCRAN, DU PREMIER AU DERNIER.
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, p } = await abrir();

  const primero = await paso(p);
  ok(
    "le compteur d'étapes est là",
    primero !== null,
    primero ? `Paso ${primero.actual} de ${primero.total}` : "absent",
  );

  if (primero) {
    ok("on entre par la première étape", primero.actual === 1);
    ok(
      "il y a plus de quatre étapes — le flux a bien été découpé",
      primero.total >= 8,
      `${primero.total} étapes`,
    );

    const titulos = [];
    let visitados = 0;
    /* On avance tant que « Continuar » existe. La borne haute est le
       total annoncé : si le formulaire n'y arrive jamais, c'est une
       étape qui bloque, et c'est ce qu'on veut savoir. */
    for (let i = 0; i < primero.total + 2; i++) {
      const h1 = p.locator("h1:visible");
      const cuantos = await h1.count();
      if (cuantos !== 1) {
        ok(
          `écran ${i + 1} — un seul titre`,
          false,
          `${cuantos} h1 trouvé(s)`,
        );
        break;
      }
      titulos.push((await h1.first().innerText()).trim());
      visitados++;

      await responderCarro(p);
      const boton = continuar(p);
      if ((await boton.count()) === 0) break;
      if (await boton.isDisabled()) {
        ok(
          `écran ${i + 1} — « Continuar » est utilisable`,
          false,
          titulos[titulos.length - 1],
        );
        break;
      }
      await boton.click();
      await p.waitForTimeout(350);
    }

    ok(
      "on traverse tout le formulaire sans blocage",
      visitados === primero.total,
      `${visitados}/${primero.total} écrans`,
    );

    /* CHAQUE ÉCRAN POSE SA PROPRE QUESTION. Deux titres identiques
       voudraient dire qu'un écran se répète — ou qu'on n'a pas avancé. */
    ok(
      "aucun titre ne se répète",
      new Set(titulos).size === titulos.length,
      `${new Set(titulos).size} titres distincts sur ${titulos.length}`,
    );

    /* Une question par écran : le titre est la question. Le dernier
       écran est le récapitulatif, il n'en pose aucune. */
    const preguntas = titulos.filter((t) => t.includes("?")).length;
    ok(
      "chaque écran sauf le récapitulatif pose une question",
      preguntas >= titulos.length - 1,
      `${preguntas} questions sur ${titulos.length} écrans`,
    );

    ok(
      "le dernier écran est la relecture",
      /revisa/i.test(titulos[titulos.length - 1] ?? ""),
      titulos[titulos.length - 1],
    );
  }

  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   2. L'ADRESSE NE BOUGE PAS.
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, p } = await abrir();
  const antes = p.url();

  for (let i = 0; i < 4; i++) {
    await responderCarro(p);
    const boton = continuar(p);
    if ((await boton.count()) === 0 || (await boton.isDisabled())) break;
    await boton.click();
    await p.waitForTimeout(300);
  }

  const despues = p.url();
  ok("l'adresse reste la même d'un bout à l'autre", antes === despues, despues);

  const ahora = await paso(p);
  ok("…et pourtant on a bien avancé", (ahora?.actual ?? 1) > 1, `paso ${ahora?.actual}`);

  /* ═══ 3. LE BOUTON RETOUR REVIENT À L'ÉTAPE D'AVANT ═══ */
  const marca = ahora?.actual ?? 0;
  await p.goBack();
  await p.waitForTimeout(400);
  const atras = await paso(p);
  ok(
    "le retour du navigateur revient à l'étape d'avant, pas hors du formulaire",
    atras !== null && atras.actual === marca - 1,
    atras ? `paso ${atras.actual} (venait de ${marca})` : "sorti du formulaire",
  );
  ok(
    "…sans changer d'adresse non plus",
    p.url() === antes,
    p.url(),
  );

  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   4. LE BROUILLON SURVIT AU RECHARGEMENT.
      C'est la contrepartie de « la même adresse » : rien dans l'URL ne
      dit où on en était. Sans lui, un appel qui arrive coûte onze
      réponses.
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, p } = await abrir();
  for (let i = 0; i < 3; i++) {
    await responderCarro(p);
    const boton = continuar(p);
    if ((await boton.count()) === 0 || (await boton.isDisabled())) break;
    await boton.click();
    await p.waitForTimeout(300);
  }
  const antes = await paso(p);

  await p.reload({ waitUntil: "load" });
  await p.waitForTimeout(1200);
  const despues = await paso(p);

  ok(
    "après un rechargement, on retrouve son étape",
    antes !== null && despues !== null && despues.actual === antes.actual,
    `${antes?.actual} → ${despues?.actual}`,
  );
  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   5. LE RÉCAPITULATIF EST COMPLET ET RÉPARABLE.
      Douze écrans ne sont supportables que si l'on voit tout à la fin
      et qu'une correction ramène EXACTEMENT à sa question.
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, p } = await abrir();
  let total = (await paso(p))?.total ?? 12;
  for (let i = 0; i < total + 2; i++) {
    await responderCarro(p);
    const boton = continuar(p);
    if ((await boton.count()) === 0 || (await boton.isDisabled())) break;
    await boton.click();
    await p.waitForTimeout(300);
  }

  const cambiar = p.locator("button:visible", { hasText: /^Cambiar$/ });
  const cuantos = await cambiar.count();
  ok(
    "le récapitulatif reprend toutes les réponses",
    cuantos >= total - 2,
    `${cuantos} lignes pour ${total} étapes`,
  );

  if (cuantos > 0) {
    /* La troisième ligne est « Llegas a » : la toucher doit ramener à
       la question de la llegada, pas au début du formulaire. */
    await cambiar.nth(2).click();
    await p.waitForTimeout(350);
    const destino = await paso(p);
    const titulo = await p.locator("h1:visible").first().innerText();
    ok(
      "« Cambiar » ramène à SA question, pas au début",
      destino !== null && destino.actual > 1,
      `paso ${destino?.actual} — « ${titulo.trim()} »`,
    );
  }

  await ctx.close();
}

/* ══════════════════════════════════════════════════════════════════
   6. LES RÈGLES DE LA MAISON TIENNENT SUR TOUS LES ÉCRANS.
   ══════════════════════════════════════════════════════════════════ */
{
  const { ctx, p } = await abrir();
  let texto = "";
  const total = (await paso(p))?.total ?? 12;
  for (let i = 0; i < total + 2; i++) {
    texto += "\n" + (await p.locator("main").innerText());
    await responderCarro(p);
    const boton = continuar(p);
    if ((await boton.count()) === 0 || (await boton.isDisabled())) break;
    await boton.click();
    await p.waitForTimeout(300);
  }

  ok("aucun « gratis » nulle part", !/\bgratis\b/i.test(texto));
  ok(
    "aucune « tarifa de reserva »",
    !/sin\s+tarifa\s+de\s+reserva/i.test(texto),
  );
  ok(
    "aucun émoji dans l'interface",
    !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(texto),
  );
  /* R5 : on ne promet jamais un revenu. « Recuperas » est un
     remboursement de frais, « ganas » serait une rémunération. */
  ok(
    "aucune promesse de gain",
    !/\bgana(r|s)?\s+(dinero|plata)\b/i.test(texto),
  );

  await ctx.close();
}

await navegador.close();

console.log(
  fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`,
);
process.exit(fallos === 0 ? 0 : 1);
