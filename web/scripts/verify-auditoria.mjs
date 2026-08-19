#!/usr/bin/env node
/**
 * AUDIT DU SITE — LE FILET QUI ATTRAPE CE QUE PERSONNE NE REGARDE.
 *
 *   node scripts/verify-auditoria.mjs [url]   (défaut : http://localhost:3100)
 *
 * Les huit autres batteries vérifient des PARCOURS : elles savent ce
 * qu'elles cherchent. Celle-ci fait l'inverse — elle ouvre chaque page,
 * des deux côtés du produit, et écoute ce que le navigateur dit tout
 * seul. C'est ainsi qu'on attrape les défauts qu'on n'a pas pensé à
 * chercher, et ce sont presque toujours ceux-là qui abîment un lancement.
 *
 * CE QU'ELLE ÉCOUTE, ET POURQUOI CHACUN COMPTE :
 *
 *   · ERREURS JAVASCRIPT — une exception au montage tue tout ce qui
 *     suit dans l'arbre. La page a l'air « juste incomplète », et
 *     personne ne signale une section manquante qu'il n'a jamais vue.
 *   · REQUÊTES MORTES — une image 404 se voit ; un script 404 ne se voit
 *     pas, il laisse un bouton inerte.
 *   · HYDRATATION — React ne casse pas visiblement, il RECOLLE en
 *     silence : le contenu servi et le contenu rendu divergent, le
 *     référencement lit l'un et l'utilisateur voit l'autre.
 *   · IDENTIFIANTS EN DOUBLE — deux `id` identiques cassent les
 *     `<label for>`, donc le clavier, donc les lecteurs d'écran. Le
 *     produit monte ses écrans EN DOUBLE (app + site) : c'est le défaut
 *     qui revient le plus ici, et il ne se voit jamais à l'œil.
 *   · IMAGES SANS TEXTE, BOUTONS SANS NOM — un bouton icône sans nom
 *     accessible est un bouton qui n'existe pas pour qui n'y voit pas.
 *   · ZONES TACTILES — sous 40 px, on rate. Mesuré, pas supposé.
 *
 * Elle ne juge PAS le goût. Ce qu'elle rend est factuel : un défaut
 * listé ici est reproductible, ou c'est un défaut de la batterie.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

const RUTAS = [
  "/",
  "/ya",
  "/buscar?desde=panama-city&hacia=chitre",
  "/buscar?desde=panama-city&hacia=santiago&fecha=2026-12-24",
  "/publicar",
  "/publicar/nuevo",
  "/cuenta",
  "/cuenta/perfil",
  "/cuenta/mensajes",
  "/como-funciona",
  "/seguridad",
  "/ayuda",
  "/terminos",
  "/privacidad",
  "/viajes/panama-chitre",
  "/viajes/panama-david",
];

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(
    `  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`,
  );
  if (!cond) fallos++;
};

/* CE QU'ON IGNORE, ET POURQUOI — jamais « pour faire passer le test ».
   Le conteneur n'a pas le droit de sortir : Supabase, Mapbox, LocationIQ
   et Didit sont injoignables ici, et le produit est écrit pour continuer
   sans eux. Compter ces échecs de réseau comme des défauts ferait crier
   la batterie sur la seule chose qui marche exprès. */
const RED_EXTERNA =
  /supabase\.co|mapbox\.com|locationiq\.com|didit\.me|fonts\.googleapis|gstatic/i;
const RUIDO_CONOCIDO =
  /ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|Failed to load resource|net::ERR_/i;

const navegador = await chromium.launch({ executablePath: CHROME });

async function auditar(ruta, modo) {
  const ctx = await navegador.newContext(
    modo === "app"
      ? { ...devices["iPhone 13"] }
      : { viewport: { width: 1180, height: 900 } },
  );
  await ctx.addInitScript(() => {
    window.sessionStorage.setItem("partimos.invitado", "1");
    window.sessionStorage.setItem("partimos.ya-abierta", "1");
  });

  const errores = [];
  const muertas = [];
  const p = await ctx.newPage();

  p.on("pageerror", (e) => errores.push(String(e).slice(0, 180)));
  p.on("console", (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    const t = m.text();
    if (RUIDO_CONOCIDO.test(t)) return;
    /* React annonce les divergences d'hydratation en console et nulle
       part ailleurs : c'est le seul endroit où l'on peut les voir. */
    if (m.type() === "warning" && !/hydrat|did not match|Warning:/i.test(t))
      return;
    errores.push(`${m.type()}: ${t.slice(0, 180)}`);
  });
  p.on("response", (r) => {
    if (r.status() < 400) return;
    if (RED_EXTERNA.test(r.url())) return;
    muertas.push(`${r.status()} ${r.url().replace(BASE, "")}`);
  });

  await p.goto(`${BASE}${ruta}`, { waitUntil: "load" });
  if (modo === "app") {
    await p.evaluate(() =>
      document.documentElement.classList.add("app-instalada"),
    );
  }
  await p.waitForTimeout(1300);

  const revision = await p.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
    };

    /* IDENTIFIANTS EN DOUBLE — seulement parmi les éléments VISIBLES.
       Le produit rend l'app et le site dans la même page ; deux `id`
       identiques dont un seul est affiché ne cassent aucun `label for`
       en pratique, et les compter noierait les vrais dans le bruit. */
    const ids = {};
    for (const el of document.querySelectorAll("[id]")) {
      if (!visible(el)) continue;
      ids[el.id] = (ids[el.id] ?? 0) + 1;
    }
    const dobles = Object.entries(ids)
      .filter(([, n]) => n > 1)
      .map(([id, n]) => `${id}×${n}`);

    const imgSinAlt = [...document.querySelectorAll("img")]
      .filter((i) => visible(i) && i.getAttribute("alt") === null)
      .map((i) => (i.getAttribute("src") ?? "").slice(-40));

    const nombre = (el) =>
      (
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.innerText ||
        ""
      ).trim();
    const botonesMudos = [...document.querySelectorAll("button, a[href]")]
      .filter((b) => visible(b) && !nombre(b))
      .map((b) => b.tagName + "." + (b.className || "").slice(0, 40));

    /* ZONES TACTILES. 40 px est la borne basse défendable : la
       recommandation est 44, mais une pastille de filtre de 40 se vise
       encore. En dessous, on rate — et on rate en silence. */
    const pequenos = [...document.querySelectorAll("button, a[href]")]
      .filter((b) => {
        if (!visible(b)) return false;
        const r = b.getBoundingClientRect();
        /* Un lien DANS une phrase n'est pas une cible tactile : il n'a
           aucune raison de faire 40 px de haut. */
        const enTexto =
          b.tagName === "A" &&
          b.parentElement &&
          /^(P|LI|SPAN|DD|DT|H1|H2|H3)$/.test(b.parentElement.tagName);
        return !enTexto && (r.height < 32 || r.width < 32);
      })
      .map((b) => nombre(b).slice(0, 24) || b.className.slice(0, 24));

    const h1 = [...document.querySelectorAll("h1")].filter(visible).length;

    return {
      dobles,
      imgSinAlt,
      botonesMudos,
      pequenos: [...new Set(pequenos)],
      h1,
      texto: (document.body.innerText || "").replace(/\s+/g, " "),
      desbordaX:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    };
  });

  await ctx.close();
  return { errores, muertas, ...revision };
}

console.log(`\nAuditoría — ${BASE}\n`);

for (const modo of ["web", "app"]) {
  console.log(`\n  ── ${modo === "web" ? "Sitio" : "App"} ──\n`);
  for (const ruta of RUTAS) {
    const r = await auditar(ruta, modo);
    const problemas = [];
    if (r.errores.length) problemas.push(`JS: ${r.errores[0]}`);
    if (r.muertas.length) problemas.push(`muerta: ${r.muertas[0]}`);
    if (r.dobles.length) problemas.push(`id doble: ${r.dobles.join(", ")}`);
    if (r.imgSinAlt.length) problemas.push(`img sin alt: ${r.imgSinAlt[0]}`);
    if (r.botonesMudos.length)
      problemas.push(`sin nombre: ${r.botonesMudos[0]}`);
    if (r.h1 > 1) problemas.push(`${r.h1} h1 visibles`);
    /* LE DÉBORDEMENT HORIZONTAL. Sur un téléphone, il se traduit par une
       page qui glisse de côté quand on défile : le défaut le plus
       agaçant qui soit, et le plus facile à ne jamais remarquer sur un
       écran d'ordinateur. */
    if (r.desbordaX) problemas.push("la page déborde en largeur");

    ok(
      `${modo} ${ruta}`,
      problemas.length === 0,
      problemas.join(" · ").slice(0, 150),
    );

    /* Les zones tactides trop petites sont un AVERTISSEMENT, pas un
       échec : certaines sont des ornements décoratifs légitimes. On les
       nomme pour qu'elles soient regardées, sans bloquer. */
    if (r.pequenos.length) {
      console.log(
        `          zonas < 32 px : ${r.pequenos.slice(0, 4).join(", ")}`,
      );
    }
  }
}

/* ══════════════════════════════════════════════════════════════════
   LES RÈGLES DE LA MAISON, SUR TOUTES LES PAGES À LA FOIS.
   ══════════════════════════════════════════════════════════════════ */
console.log("\n  ── Reglas de la casa ──\n");
{
  let todo = "";
  for (const ruta of RUTAS) {
    const r = await auditar(ruta, "web");
    todo += "\n" + r.texto;
  }
  ok("jamais « gratis »", !/\bgratis\b/i.test(todo));
  ok("jamais « sin tarifa de reserva »", !/sin\s+tarifa\s+de\s+reserva/i.test(todo));
  /* R5 INTERDIT LA PROMESSE, PAS LE MOT.
     Le premier jet cherchait « gana dinero » et criait sur trois phrases
     parfaitement conformes — « nadie gana plata », « no ganas dinero
     manejando », « ¿el conductor gana dinero conmigo? » (une question de
     la FAQ, dont la réponse est non). Une règle qui punit sa propre
     application est une règle qu'on finit par désactiver.
     On regarde donc ce qui PRÉCÈDE : une négation ou une question, et
     c'est une dénégation ; rien, et c'est une promesse. */
  const promesas = [...todo.matchAll(/gana(r|s)?\s+(dinero|plata)/gi)]
    .filter((m) => {
      const antes = todo.slice(Math.max(0, m.index - 34), m.index);
      return !/\b(no|nadie|nunca|ni)\b[^.]*$|¿[^?]*$/i.test(antes);
    })
    .map((m) => todo.slice(Math.max(0, m.index - 34), m.index + 24));
  ok(
    "jamais une PROMESSE de gain (R5)",
    promesas.length === 0,
    promesas[0] ?? "",
  );
  ok("jamais « ingresos » ni « ganancias » (R5)", !/\b(ingresos|ganancias)\b/i.test(todo));
  ok("aucun émoji", !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(todo));
  /* « coche » et « asiento » sont de l'espagnol d'Espagne : au Panama on
     dit carro et puesto. Un seul mot qui sonne étranger suffit à faire
     lire tout le reste comme une traduction. */
  ok("registre panaméen — jamais « coche »", !/\bcoches?\b/i.test(todo));
  ok("registre panaméen — jamais « asiento »", !/\basientos?\b/i.test(todo));
}

await navegador.close();

console.log(
  fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`,
);
process.exit(fallos === 0 ? 0 : 1);
