#!/usr/bin/env node
/**
 * LE PLAN EST-IL VRAI ? — on le prouve, on ne le déclare pas.
 *
 *   node scripts/verify-mapa.mjs [url]     (défaut : http://localhost:3100)
 *
 * `mapa.mjs` décrit le produit : ses écrans et les chemins entre eux. Le
 * schéma publié se dessine à partir de lui. Cette batterie ferme la
 * boucle : elle ouvre un vrai navigateur et vérifie, dans les deux sens,
 * que le plan et le produit disent la même chose.
 *
 * TROIS PASSES, ET CHACUNE ATTRAPE UNE FAMILLE DIFFÉRENTE :
 *
 *   1. CHAQUE NŒUD EXISTE. On va à son adresse et on cherche un texte
 *      qui n'apparaît QUE là. Un nœud qui charge une page blanche, ou la
 *      mauvaise page, tombe ici.
 *
 *   2. CHAQUE ARÊTE EST PRATICABLE. On se met sur l'écran de départ, on
 *      trouve le geste (un lien, un onglet, un bouton), on le fait, et
 *      on vérifie qu'on atterrit à l'arrivée annoncée. C'est la passe
 *      qui répond littéralement à « vérifie que tous les chemins
 *      marchent » — un lien qui pointe vers le vide y meurt.
 *
 *   3. AUCUN CHEMIN N'EST OUBLIÉ. L'inverse de la 2 : on ramasse TOUS
 *      les liens internes réellement affichés et on vérifie qu'aucun ne
 *      mène à une adresse absente du plan. Sans cette passe, on peut
 *      avoir un plan parfait et un produit qui déborde de portes
 *      cachées — et ce sont celles-là qui cassent en silence.
 */

import { chromium, devices } from "playwright";
import { MAPAS } from "./mapa.mjs";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
/* LE JOURNAL. Il sert au schéma publié : chaque écran et chaque chemin y
   porte son verdict RÉEL, pas une pastille verte décorative. Sans lui, le
   schéma redeviendrait un dessin qu'on croit sur parole. */
const diario = { nodos: {}, aristas: {}, resumen: { ok: 0, falla: 0, salto: 0 } };
let ambito = null;

const ok = (nom, cond, detalle = "") => {
  console.log(
    `  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`,
  );
  if (!cond) fallos++;
  diario.resumen[cond ? "ok" : "falla"]++;
  if (ambito) ambito[ambito.clave] = { estado: cond ? "ok" : "falla", detalle };
};
const saltado = (nom, porque) => {
  console.log(`  SAUTÉ   ${nom} — ${porque}`);
  diario.resumen.salto++;
  if (ambito) ambito[ambito.clave] = { estado: "salto", detalle: porque };
};

const navegador = await chromium.launch({ executablePath: CHROME });

/* UNE SESSION DE DÉMONSTRATION. Les écrans de compte de l'app sont
   protégés par une porte — c'est le produit qui a raison, et le plan le
   dit (`sesion: true`). Pour vérifier ce qu'il y a DERRIÈRE la porte, il
   faut la franchir : on pose donc une session locale, exactement comme
   le fait verify-puerta. Sans ça on ne mesurerait que la porte. */
const SESION = {
  contact: "milan@ejemplo.com",
  firstName: "Milan",
  lastName: "Ruiz",
  lastInitial: "R",
  isVerified: false,
  affiliation: null,
  since: "2026-01-05T00:00:00.000Z",
  payPref: "yappy",
};

/** Une page prête, du bon côté du produit. */
async function abrir(modo, url = "/", conSesion = false, sinInvitado = false) {
  const ctx = await navegador.newContext(
    modo === "app"
      ? { ...devices["iPhone 13"] }
      : { viewport: { width: 1180, height: 900 } },
  );
  if (conSesion) {
    await ctx.addInitScript((s) => {
      window.localStorage.setItem("partimos.demo-session", JSON.stringify(s));
    }, SESION);
  }
  await ctx.addInitScript((sinInv) => {
    /* Le mode invité fait tomber la porte d'accueil de l'app ; sans lui,
       on mesurerait la porte à la place de l'écran qu'elle protège.
       Sauf quand c'est justement la PORTE qu'on vient vérifier : les
       arêtes du parcours d'entrée demandent l'inverse. */
    if (!sinInv) window.sessionStorage.setItem("partimos.invitado", "1");
    window.sessionStorage.setItem("partimos.ya-abierta", "1");
    try {
      window.localStorage.removeItem("partimos.borrador-publicar");
    } catch {
      /* stockage refusé : rien à nettoyer */
    }
  }, sinInvitado);
  const p = await ctx.newPage();
  await p.goto(`${BASE}${url}`, { waitUntil: "load" });
  await p.waitForTimeout(700);
  if (modo === "app") {
    /* DEUX FOIS, ET C'EST NÉCESSAIRE. `PWA.tsx` repose la classe au
       montage : posée une seule fois trop tôt, elle est effacée, la
       moitié « app » reste cachée, et on mesure le site en croyant
       mesurer l'app. La première version de cette batterie a accusé sept
       écrans pour cette seule raison. */
    await p.evaluate(() =>
      document.documentElement.classList.add("app-instalada"),
    );
    await p.waitForTimeout(600);
    await p.evaluate(() =>
      document.documentElement.classList.add("app-instalada"),
    );
    await p.waitForTimeout(400);
  }
  return { ctx, p };
}

/** Ce que l'utilisateur VOIT — jamais le DOM caché de l'autre moitié. */
const visto = async (p) => {
  /* `.barra-accion` EN FAIT PARTIE. C'est la barre fixe du bas — « Pedir
     el puesto » y vit, hors de `main`. Sans elle, la batterie déclarait
     la fiche du viaje méconnaissable alors que son bouton principal
     était sous les yeux de tout le monde. Ce qu'on mesure doit être ce
     qu'on VOIT, pas ce que l'arbre range où. */
  const partes = await p
    .locator("main, [role=dialog], .puerta, .barra-accion")
    .filter({ visible: true })
    .allInnerTexts();
  return partes.join(" ").replace(/\s+/g, " ");
};

for (const mapa of MAPAS) {
  const modo = mapa === MAPAS[1] ? "app" : "web";
  console.log(`\n\n══ ${mapa.titulo} ══`);

  const porId = Object.fromEntries(mapa.nodos.map((n) => [n.id, n]));

  /* ══════════════════════════════════════════════════════════════════
     1. CHAQUE NŒUD EXISTE ET SE RECONNAÎT.
     ══════════════════════════════════════════════════════════════════ */
  console.log("\n  ── Cada pantalla existe ──\n");
  for (const nodo of mapa.nodos) {
    if (!nodo.url) {
      /* Les états internes (vues du parcours d'entrée, étapes du
         formulaire) n'ont pas d'adresse : c'est un CHOIX, pas un oubli.
         Ils sont vérifiés en passe 2, par le chemin qui y mène. */
      continue;
    }
    ambito = diario.nodos;
    ambito.clave = `${modo}:${nodo.id}`;
    const { ctx, p } = await abrir(modo, nodo.url, Boolean(nodo.sesion));
    const t = await visto(p);
    ok(
      `${nodo.label} (${nodo.url})`,
      nodo.prueba.test(t),
      nodo.prueba.test(t) ? "" : t.slice(0, 70) || "página vacía",
    );
    await ctx.close();
  }

  /* ══════════════════════════════════════════════════════════════════
     2. CHAQUE CHEMIN SE PARCOURT VRAIMENT.
     ══════════════════════════════════════════════════════════════════ */
  console.log("\n  ── Cada camino se recorre ──\n");
  for (const arista of mapa.aristas) {
    const desde = porId[arista.de];
    const hacia = porId[arista.a];
    const nombre = `${desde.label} → ${hacia.label} (${arista.etiqueta})`;
    ambito = diario.aristas;
    ambito.clave = `${modo}:${arista.de}>${arista.a}`;

    /* CE QUI NE SE VÉRIFIE PAS D'ICI — dit franchement.
       Ouvrir une session demande un serveur, et Supabase est injoignable
       depuis ce conteneur. Compter ces transitions comme réussies serait
       exactement le genre de mensonge qu'une batterie existe pour
       empêcher. */
    if (arista.necesitaServidor) {
      saltado(nombre, arista.necesitaServidor);
      continue;
    }

    /* D'OÙ ON PART. Un état interne n'a pas d'adresse : le plan dit
       alors par quelle page y entrer, et quels gestes enchaîner. */
    const arranque = arista.arranque ?? desde.url;
    if (!arranque) {
      ok(nombre, false, "le plan ne dit pas d'où partir");
      continue;
    }

    /* AVEC OU SANS SESSION — c'est le chemin lui-même qui le dit. Une
       arête vers un écran protégé se joue connecté ; une arête qui
       vérifie que la PORTE se ferme se joue déconnecté. */
    const conSesion = Boolean(arista.sesion) && !arista.sinSesion;
    const { ctx, p } = await abrir(
      modo,
      arranque,
      conSesion,
      Boolean(arista.sinInvitado),
    );

    const cerrar = async () => {
      await ctx.close();
    };

    /* ── SUIVRE UN PATRON POUR ATTEINDRE LE DÉPART.
       La fiche d'un viaje n'a pas d'adresse fixe : on part des résultats
       et on ouvre la première. Coder une adresse en dur ferait échouer
       la batterie chaque jour — les identifiants portent la date. */
    if (arista.seguirPatron) {
      const patronArranque = new RegExp(arista.seguirPatron);
      const enlaces = p.locator("a[href]:visible");
      const total = await enlaces.count();
      let abierto = false;
      for (let i = 0; i < total; i++) {
        const href = ((await enlaces.nth(i).getAttribute("href")) ?? "").split("?")[0];
        if (!patronArranque.test(href)) continue;
        await enlaces.nth(i).click({ timeout: 8000 }).catch(() => {});
        await p.waitForTimeout(1300);
        abierto = true;
        break;
      }
      if (!abierto) {
        ok(nombre, false, `aucune page « ${arista.seguirPatron} » à ouvrir`);
        await cerrar();
        continue;
      }
    }

    /* ── LES CLICS PRÉPARATOIRES. Ouvrir l'onglet « Cuenta » du profil,
       traverser les douze écrans du formulaire : ce n'est pas un
       contournement de test, c'est le parcours réel. L'écrire dans le
       plan vaut mieux que de prétendre que le lien est au premier
       niveau. */
    if (arista.antes) {
      const previo = p
        .locator("button:visible", { hasText: new RegExp(`^${arista.antes}$`) })
        .first();
      if (await previo.count()) {
        await previo.click({ timeout: 6000 }).catch(() => {});
        await p.waitForTimeout(500);
      }
    }
    if (arista.avanzar) {
      for (let i = 0; i < 16; i++) {
        /* L'ÉCRAN DU CARRO EXIGE UNE RÉPONSE, et c'est le produit qui a
           raison : le taux au km sort du carro, donc le tope aussi. Sans
           compte on ne peut pas ENREGISTRER un carro — on emprunte donc
           le chemin prévu pour ce cas. */
        const sinLista = p
          .locator("button:visible", { hasText: /Mi carro no está en la lista/ })
          .first();
        if (await sinLista.count()) {
          await sinLista.click({ timeout: 6000 }).catch(() => {});
          await p.waitForTimeout(300);
          const marca = p
            .locator('select[aria-label="Marca del carro"]:visible')
            .first();
          if (await marca.count()) {
            await marca.selectOption("otro").catch(() => {});
            await p.waitForTimeout(250);
          }
        }
        const seguir = p
          .locator("button:visible", { hasText: /^Continuar$/ })
          .first();
        if ((await seguir.count()) === 0 || (await seguir.isDisabled())) break;
        await seguir.click({ timeout: 6000 }).catch(() => {});
        await p.waitForTimeout(320);
      }
    }

    /* ── LE CHEMIN DE CLICS, pour les états sans adresse. */
    if (arista.camino) {
      let falto = null;
      for (const paso of arista.camino) {
        const b = p
          .locator("button:visible", { hasText: new RegExp(`^${paso}$`) })
          .first();
        if ((await b.count()) === 0) {
          falto = paso;
          break;
        }
        await b.click({ timeout: 8000 }).catch(() => {});
        await p.waitForTimeout(700);
      }
      const t = await visto(p);
      /* UN ÉCRAN FACULTATIF QUI NE S'AFFICHE PAS N'EST PAS UNE PANNE.
         « ¿Cómo quieres crear tu cuenta? » n'existe que s'il y a
         plusieurs portes ; sans fournisseur activé, on va droit aux
         questions, et c'est le comportement voulu. */
      if (arista.opcional && (falto || !hacia.prueba.test(t))) {
        saltado(nombre, "cet écran ne s'affiche que s'il y a plusieurs portes — ici il n'y en a qu'une");
        await cerrar();
        continue;
      }
      if (falto) {
        ok(nombre, false, `aucun bouton « ${falto} »`);
        await cerrar();
        continue;
      }
      /* Certains gestes partent chercher un serveur : on vérifie alors
         que le bouton EXISTE et qu'il est utilisable. Cliquer sans
         serveur ne prouverait rien de plus. */
      if (arista.soloPresencia) {
        const b = p
          .locator("button:visible", { hasText: new RegExp(arista.soloPresencia) })
          .first();
        const hay = (await b.count()) > 0 && !(await b.isDisabled());
        ok(`${nombre} — bouton présent, le reste demande le serveur`, hay);
        await cerrar();
        continue;
      }
      ok(nombre, hacia.prueba.test(t), hacia.prueba.test(t) ? "" : t.slice(0, 70));
      await cerrar();
      continue;
    }

    /* ── LES PORTES. Elles ne sont pas des liens : un bouton ouvre une
       feuille, ou l'écran est remplacé par la porte du conducteur. Rien
       ne navigue, donc chercher un `href` ne trouverait jamais rien. */
    if (arista.como === "puerta") {
      if (arista.boton) {
        const b = p
          .locator("button:visible", { hasText: new RegExp(arista.boton) })
          .first();
        if ((await b.count()) === 0) {
          ok(nombre, false, `aucun bouton « ${arista.boton} »`);
          await cerrar();
          continue;
        }
        await b.scrollIntoViewIfNeeded().catch(() => {});
        await b.click({ timeout: 8000 }).catch(() => {});
        await p.waitForTimeout(1100);
      }
      const t = await visto(p);
      ok(nombre, hacia.prueba.test(t), hacia.prueba.test(t) ? "" : t.slice(0, 70));
      await cerrar();
      continue;
    }

    /* ── LE GESTE ORDINAIRE : un lien. On ne cherche pas « un href
       quelque part dans le DOM », on cherche ce qu'un doigt peut
       atteindre. `:visible` écarte la moitié cachée du produit — sans
       lui, on cliquerait dans le vide et on croirait le chemin cassé. */
    const patron = hacia.patron ? new RegExp(hacia.patron) : null;
    const destino = hacia.url ? hacia.url.split("?")[0] : null;
    const candidatos = p.locator("a[href]:visible");
    const n = await candidatos.count();
    let elegido = null;
    for (let i = 0; i < n; i++) {
      const c = candidatos.nth(i);
      const href = ((await c.getAttribute("href")) ?? "").split("?")[0];
      /* Un lien qui mène à un SOUS-chemin n'est pas ce lien-ci :
         `/cuenta/perfil` commence par `/cuenta`. */
      if (patron ? patron.test(href) : href === destino) {
        elegido = c;
        break;
      }
    }

    if (!elegido) {
      ok(nombre, false, "aucun lien visible vers cette destination");
      await cerrar();
      continue;
    }

    await elegido.scrollIntoViewIfNeeded().catch(() => {});
    const href = ((await elegido.getAttribute("href")) ?? "").split("?")[0];
    await elegido.click({ timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(1200);
    if (modo === "app") {
      await p.evaluate(() =>
        document.documentElement.classList.add("app-instalada"),
      );
      await p.waitForTimeout(600);
    }

    const t = await visto(p);
    const llegada = new URL(p.url()).pathname;
    const bienLlegado = patron ? patron.test(llegada) : llegada === destino;
    ok(
      nombre,
      bienLlegado && hacia.prueba.test(t),
      bienLlegado
        ? hacia.prueba.test(t)
          ? ""
          : `arrivé à ${llegada} mais l'écran ne se reconnaît pas`
        : `atterri sur ${llegada}, attendu ${patron ?? destino} (lien ${href})`,
    );
    await cerrar();
  }
}


/* ══════════════════════════════════════════════════════════════════
   3. AUCUNE PORTE N'EST HORS DU PLAN.
   L'inverse de la passe 2 : on ramasse tous les liens internes VISIBLES
   des deux côtés et on vérifie qu'ils mènent tous à une adresse que le
   plan connaît. Un plan juste devant un produit qui déborde de chemins
   non décrits ne vaut rien — ce sont ces chemins-là qui cassent sans
   que personne s'en aperçoive.
   ══════════════════════════════════════════════════════════════════ */
console.log("\n\n══ Ninguna puerta fuera del plano ══\n");
{
  /* Les patrons dynamiques : une fiche de viaje ou une page de ruta ont
     autant d'adresses que de viajes. Le plan les décrit par leur FORME,
     et c'est la seule description honnête. */
  const PATRONES = [
    /^\/$/,
    /^\/ya$/,
    /^\/buscar/,
    /^\/viaje\/[^/]+$/,
    /^\/viajes$/,
    /^\/viajes\/[^/]+$/,
    /^\/publicar$/,
    /^\/publicar\/nuevo$/,
    /^\/cuenta$/,
    /^\/cuenta\/(mensajes|perfil|verificacion|legal)$/,
    /^\/como-funciona$/,
    /^\/seguridad$/,
    /^\/ayuda$/,
    /^\/terminos$/,
    /^\/privacidad$/,
  ];

  const DESDE = [
    "/",
    "/ya",
    "/buscar?desde=panama-city&hacia=chitre",
    "/viajes",
    "/viajes/panama-chitre",
    "/publicar",
    "/publicar/nuevo",
    "/cuenta",
    "/cuenta/perfil",
    "/como-funciona",
    "/seguridad",
    "/ayuda",
    "/terminos",
    "/privacidad",
  ];

  const fuera = new Map();
  for (const modo of ["web", "app"]) {
    for (const ruta of DESDE) {
      const { ctx, p } = await abrir(modo, ruta);
      const hrefs = await p
        .locator("a[href]:visible")
        .evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
      await ctx.close();
      for (const href of hrefs) {
        if (!href.startsWith("/")) continue;
        const camino = href.split("?")[0].split("#")[0];
        if (!camino || camino === "#") continue;
        if (PATRONES.some((r) => r.test(camino))) continue;
        fuera.set(camino, `${modo} ${ruta}`);
      }
    }
  }

  ok(
    "todos los enlaces visibles caen dentro del plano",
    fuera.size === 0,
    [...fuera].map(([c, d]) => `${c} (desde ${d})`).join(", ").slice(0, 160),
  );
}

await navegador.close();

/* Le journal part sur le disque : le générateur du schéma le lit, et le
   schéma affiche des verdicts datés plutôt que des affirmations. */
if (process.env.MAPA_JSON) {
  const { writeFileSync } = await import("node:fs");
  delete diario.nodos.clave;
  delete diario.aristas.clave;
  writeFileSync(process.env.MAPA_JSON, JSON.stringify(diario, null, 2));
  console.log(`\nJournal écrit dans ${process.env.MAPA_JSON}`);
}

console.log(
  fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`,
);
process.exit(fallos === 0 ? 0 : 1);
