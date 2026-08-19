#!/usr/bin/env node
/**
 * BATTERIE DE LA PORTE, DU MODE INVITÉ ET DES LIENS.
 *
 *   node scripts/verify-puerta.mjs [url]     (défaut : http://localhost:3100)
 *
 * Elle existe à cause d'un reproche précis du propriétaire : « c'est pas
 * logique, il y a des boutons cassés ». Elle vérifie donc trois choses
 * qu'aucune autre batterie ne regardait.
 *
 * 1. LA PORTE. Sans compte, l'app s'ouvre sur entrer ou s'inscrire, avec
 *    une croix EN HAUT À GAUCHE. La croix mène au mode invité.
 *
 * 2. CE QUE PEUT UN INVITÉ. La recherche, entière — et rien d'autre.
 *    Mis viajes, Mensajes, Perfil et Publicar ramènent à la connexion.
 *    C'est la règle du propriétaire, mot pour mot.
 *
 * 3. AUCUN LIEN MORT. Chaque `href` interne trouvé dans l'app est
 *    ouvert : il doit répondre, et ne pas retomber silencieusement sur
 *    un autre écran. C'est exactement ce qui était cassé — la carte
 *    « Verifica tu cédula » pointait vers un `?panel=` qui n'existait
 *    pas, et le bouton ne faisait visiblement rien.
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

/* L'IDENTIFIANT DU VIAJE SE DÉDUIT DE SA DATE, il ne s'écrit pas à la
   main. Le format est `${corridor}-${aaaa-mm-jj}-${index}` (trips.ts), et
   le catalogue ne génère que des dates À VENIR. Une date écrite en dur
   fonctionne donc jusqu'au jour où elle est dépassée — puis la batterie
   signale un lien mort qui n'en est pas un, et on va chercher une
   régression inexistante. C'est arrivé. */
const diaViaje = manana.slice(0, 10);
const VIAJE_DEMO = `panama-chitre-${diaViaje}-2`;
const SESSION = {
  contact: "milan@ejemplo.com", firstName: "Milan", lastName: "Ruiz", lastInitial: "R",
  isVerified: false, affiliation: null, since: "2026-01-05T00:00:00.000Z", payPref: "yappy",
  bookings: [{
    id: "demo-11111111-2222-3333-4444-555555555555",
    tripId: VIAJE_DEMO, from: "panama-city", to: "chitre",
    boardingAt: manana, seats: 1, totalCents: 1900, feeCents: 95, channel: "yappy",
    driverName: "Carlos M", point: "Albrook, entrada norte", status: "confirmado",
  }],
};

const navegador = await chromium.launch({ executablePath: CHROME });

/** `quien` : "nadie" (jamais entré), "invitado" (a fermé la porte),
 *  "socio" (connecté). */
async function abrir(url, quien) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  if (quien === "socio") {
    await ctx.addInitScript((s) => {
      window.localStorage.setItem("partimos.demo-session", JSON.stringify(s));
    }, SESSION);
  }
  if (quien === "invitado") {
    await ctx.addInitScript(() =>
      window.sessionStorage.setItem("partimos.invitado", "1"),
    );
  }
  const p = await ctx.newPage();
  await p.goto(`${BASE}${url}`, { waitUntil: "networkidle" }).catch(() => {});
  await p.waitForTimeout(700);
  await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  await p.waitForTimeout(500);
  return { ctx, p };
}

const app = (p) => p.locator(".solo-app").first();
const texto = async (p) => ((await app(p).innerText()) ?? "").replace(/\s+/g, " ");
const esPuerta = (t) => /Crear cuenta/.test(t) && /Iniciar sesi/.test(t);

console.log(`\nPuerta, invitado y enlaces — ${BASE}\n`);

/* ═══ 1. LA PORTE ═══ */
{
  const { ctx, p } = await abrir("/", "nadie");
  ok("porte — elle s'affiche sans compte", esPuerta(await texto(p)));

  const cruz = p.getByLabel("Seguir sin cuenta").first();
  ok("porte — la croix existe", await cruz.isVisible().catch(() => false));

  /* EN HAUT À GAUCHE, demande explicite : à gauche on quitte, à droite
     on agit. Une croix à droite se confondrait avec une action. */
  const c = await cruz.boundingBox();
  const vp = p.viewportSize();
  ok("porte — la croix est en haut à GAUCHE", c !== null && c.x < vp.width / 3 && c.y < 160,
    c ? `x ${Math.round(c.x)} y ${Math.round(c.y)}` : "absente");

  /* LE VERRE. Le propriétaire l'a demandé nommément ; on vérifie qu'il
     est réellement peint, pas juste écrit dans une classe. */
  const flou = await cruz.evaluate((e) => {
    const s = getComputedStyle(e);
    return s.backdropFilter || s.webkitBackdropFilter || "none";
  });
  ok("porte — la croix est en verre", /blur/.test(flou), flou);

  ok("porte — l'inscription passe avant la connexion",
    (await texto(p)).indexOf("Crear cuenta") < (await texto(p)).indexOf("Iniciar sesi"));
  /* TROIS ARGUMENTS, PAS QUATRE, et chacun avec son mot : un rond sans
     légende est une devinette. */
  const t0 = await texto(p);
  ok("porte — trois arguments nommés",
    /Viaja a donde quieras/.test(t0) && /Viaja protegido/.test(t0) && /Paga mucho menos/.test(t0), t0.slice(0, 60));

  /* LA CROIX FAIT QUELQUE CHOSE. */
  await cruz.click();
  await p.waitForTimeout(700);
  const t = await texto(p);
  ok("porte — la croix ouvre l'app", !esPuerta(t));
  ok("porte — et on tombe sur la recherche", /A dónde/.test(t));
  await ctx.close();
}

/* ═══ 1 bis. L'INSCRIPTION — UNE QUESTION PAR ÉCRAN ═══ */
console.log("\n  Registro :\n");
{
  const { ctx, p } = await abrir("/", "nadie");
  const zona = () => p.locator(".solo-app").first();
  const siguiente = () => zona().getByLabel("Siguiente").first();

  /* LE CHOIX DU CANAL N'EXISTE QUE S'IL Y A UN CHOIX.
     ─────────────────────────────────────────────────────────────────
     Il y avait un écran fixe « ¿Cómo quieres crear tu cuenta? » avec
     Google et LinkedIn écrits en dur. Deux problèmes : les boutons
     menaient à « provider is not enabled » quand le projet ne les avait
     pas activés, et quand aucun ne l'est, l'écran pose une question qui
     n'a qu'une réponse — un obstacle poli entre quelqu'un et son compte.

     La règle est maintenant : on lit la configuration publique de
     Supabase, on n'affiche que les portes qui existent, et s'il n'y en a
     qu'une on va droit aux questions. Cette batterie accepte donc LES
     DEUX chemins et vérifie ce qui compte dans chacun. Depuis ce
     conteneur, Supabase est injoignable : c'est le chemin court qui se
     joue, et c'est celui qu'on mesure. */
  await p.getByRole("button", { name: "Crear cuenta" }).click();
  await p.waitForTimeout(700);
  const tc = await texto(p);
  const porCanal = /Cómo quieres crear tu cuenta/.test(tc);
  if (porCanal) {
    ok("canal — le courriel est toujours proposé", /correo/i.test(tc));
    ok("canal — le légal est là où l'on s'engage", /aceptas los términos de uso/i.test(tc));
    ok("canal — et la connexion pour qui a déjà un compte", /Ya tienes cuenta/.test(tc));
    await p.getByRole("button", { name: /Continuar con mi correo/ }).click();
    await p.waitForTimeout(600);
  } else {
    ok(
      "canal — sans autre puerta, on va droit à la première question",
      /Cómo te llamas/.test(tc),
      tc.slice(0, 48),
    );
  }
  ok("registro — il s'ouvre", /Cómo te llamas/.test(await texto(p)));

  /* LA BARRE D'ONGLETS N'EXISTE PAS PENDANT L'INSCRIPTION. Le
     propriétaire a photographié « Paso 1 de 5 » avec les cinq onglets
     par-dessus : une porte est un écran, pas un bloc de page. */
  ok("registro — pas de barre d'onglets par-dessus",
    !(await p.locator('nav[aria-label="Navegación principal"]').first().isVisible().catch(() => false)));
  ok("registro — la progression se compte", /Paso 1 de 6/.test(await texto(p)));

  /* LE BOUTON NE MENT PAS : éteint tant que la réponse ne va pas. */
  ok("registro — suivant est éteint à vide", await siguiente().isDisabled());

  await p.locator("#reg-nombre").fill("Milan");
  await p.locator("#reg-apellido").fill("Ruiz");
  await p.waitForTimeout(300);
  ok("registro — il montre le nom public", /Milan R\./.test(await texto(p)));
  ok("registro — suivant s'allume", !(await siguiente().isDisabled()));

  await siguiente().click();
  await p.waitForTimeout(400);
  ok("registro — 2. la naissance", /Cuándo naciste/.test(await texto(p)));

  /* LA MAJORITÉ EST UNE CONDITION LÉGALE, pas une préférence : un mineur
     doit être arrêté ICI, pas trois écrans plus loin. */
  await p.locator("#reg-nacimiento").fill("2015-01-15");
  await p.waitForTimeout(400);
  ok("registro — un mineur est refusé", /18 años/.test(await texto(p)));
  ok("registro — et il ne peut pas passer", await siguiente().isDisabled());

  await p.locator("#reg-nacimiento").fill("1992-04-08");
  await p.waitForTimeout(400);
  await siguiente().click();
  await p.waitForTimeout(400);
  const t3 = await texto(p);
  ok("registro — 3. le traitement", /Cómo prefieres que te llamemos/.test(t3));
  /* TROIS PORTES : sans « ne pas le dire », on force à mentir. */
  ok("registro — Señora, Señor et « prefiero no decirlo »",
    /Señora/.test(t3) && /Señor/.test(t3) && /Prefiero no decirlo/.test(t3));

  await zona().getByRole("button", { name: "Señor", exact: true }).click();
  await p.waitForTimeout(300);
  await siguiente().click();
  await p.waitForTimeout(400);
  ok("registro — 4. le correo", /Cuál es tu correo/.test(await texto(p)));

  await p.locator("#reg-correo").fill("no-es-un-correo");
  await p.waitForTimeout(300);
  ok("registro — un correo faux est refusé", await siguiente().isDisabled());
  await p.locator("#reg-correo").fill("milan@ejemplo.com");
  await p.waitForTimeout(300);
  await siguiente().click();
  await p.waitForTimeout(400);
  ok(
    "registro — 5. le celular",
    /[Cc]uál es tu celular/.test(await texto(p)),
  );
  /* LE CELULAR EST OBLIGATOIRE depuis le 2026-08-17 (décision du
     propriétaire). Ce test disait l'inverse et il avait raison de le
     dire à l'époque : c'est la RÈGLE qui a changé, pas le code qui a
     régressé. On vérifie donc les deux sens — on ne passe pas sans, et
     un numéro trop court ne passe pas non plus. */
  ok("registro — on ne passe PAS sans le donner", await siguiente().isDisabled());
  await p.locator("#reg-celular").fill("600");
  await p.waitForTimeout(300);
  ok("registro — un numéro trop court est refusé", await siguiente().isDisabled());
  await p.locator("#reg-celular").fill("6000-0000");
  await p.waitForTimeout(300);
  ok("registro — un numéro complet passe", !(await siguiente().isDisabled()));
  await siguiente().click();
  await p.waitForTimeout(400);
  ok("registro — 6. le mot de passe", /Crea tu contraseña/.test(await texto(p)));
  /* LE PROPRIÉTAIRE L'A RÉCLAMÉ : entrer un courriel et se retrouver
     connecté sans rien d'autre ne ressemble à aucun service sérieux. */
  await p.locator("#reg-clave").fill("corto");
  await p.waitForTimeout(300);
  ok("registro — un mot de passe court est refusé",
    await zona().getByLabel("Crear mi cuenta").first().isDisabled());
  await p.locator("#reg-clave").fill("panama2026");
  await p.waitForTimeout(300);
  /* Le mot sur l'empreinte n'existe que SANS base : avec Supabase
     branché, c'est le serveur qui garde le mot de passe. La batterie
     accepte donc les deux mondes, et vérifie surtout qu'on ne promet
     jamais de garder la contraseña elle-même. */
  ok("registro — il ne prétend jamais garder la contraseña",
    !/guardamos tu contraseña/i.test(await texto(p)));

  /* ON PEUT REVENIR, et le champ garde ce qui était écrit. Un tunnel
     sans marche arrière fait abandonner à la première faute de frappe. */
  await zona().getByLabel("Atrás").first().click();
  await p.waitForTimeout(400);
  /* Maintenant qu'un numéro est saisi, ce test vérifie enfin ce qu'il
     annonçait : le champ REND ce qui avait été écrit. Avant, il
     comparait à la chaîne vide — il passait sans rien prouver. */
  ok(
    "registro — la marche arrière garde la réponse",
    (await p.locator("#reg-celular").inputValue()).replace(/\D/g, "") === "60000000",
    await p.locator("#reg-celular").inputValue(),
  );
  await siguiente().click();
  await p.waitForTimeout(400);

  await zona().getByLabel("Crear mi cuenta").first().click();
  await p.waitForTimeout(4000);
  const fin = await texto(p);
  /* DEUX FINS ACCEPTABLES, et une seule inacceptable.
     Sans base : la session s'ouvre tout de suite. Avec base : ou bien le
     courriel de confirmation part, ou bien le serveur refuse — et dans
     ce dernier cas l'écran doit DIRE pourquoi. Ce qu'on interdit, c'est
     le troisième cas : un bouton qui ne fait rien du tout. */
  ok(
    "registro — la fin est explicite",
    /Hola, Milan/.test(fin) ||
      /Revisa tu correo/.test(fin) ||
      /servidor|conexión|ya tiene cuenta/i.test(fin),
    fin.slice(0, 70),
  );
  await ctx.close();
}

/* ═══ 1 ter. LA CONNEXION — DEUX CHEMINS, ET LES DEUX SONT DES BOUTONS ═══
   L'app n'avait qu'un mot de passe : quelqu'un dont le compte est né
   d'un lien magique ou de Google n'y entrait jamais, il n'y avait
   simplement pas de porte. Le lien par courriel est maintenant un
   BOUTON à côté de l'autre — c'est ce qu'on vérifie ici, parce que
   c'est ce qui décide si une personne entre ou reste dehors. */
{
  const { ctx, p } = await abrir("/", "nadie");
  const entrar = () =>
    p.locator(".solo-app").first().getByRole("button", { name: "Entrar", exact: true }).first();

  await p.getByRole("button", { name: "Iniciar sesión" }).first().click();
  await p.waitForTimeout(600);
  const ta = await texto(p);
  ok("acceder — il s'ouvre", /Entra a tu cuenta/.test(ta), ta.slice(0, 40));
  ok("acceder — il renvoie vers l'inscription", /Crear cuenta/.test(ta));
  /* Le libellé est peint en capitales par la CSS, et `innerText` rend ce
     qui est PEINT : la comparaison doit ignorer la casse. */
  ok("acceder — il demande un mot de passe", /contraseña/i.test(ta));
  ok(
    "acceder — le lien par correo est un BOUTON, pas une note en bas",
    await p
      .locator(".solo-app")
      .first()
      .getByRole("button", { name: /Mándame un enlace/ })
      .first()
      .isVisible()
      .catch(() => false),
  );

  await p.locator("#acc-correo").fill("ana@ejemplo.com");
  await p.locator("#acc-clave").fill("panama2026");
  await p.waitForTimeout(300);
  await entrar().click();
  await p.waitForTimeout(4000);
  const fa = await texto(p);
  ok(
    "acceder — la fin est explicite",
    /Hola, Ana/.test(fa) || /servidor|conexión|no coinciden|confirmar el correo/i.test(fa),
    fa.slice(0, 70),
  );
  await ctx.close();
}

/* ═══ 2. CE QUE PEUT UN INVITÉ ═══ */
console.log("\n  Invitado :\n");

/** Ce qui doit rester ouvert sans compte : chercher, comparer, regarder. */
for (const [url, nombre] of [
  ["/", "el inicio"],
  ["/ya", "buscar"],
  ["/buscar?desde=panama-city&hacia=chitre", "los resultados"],
  ["/seguridad", "seguridad"],
  ["/ayuda", "ayuda"],
]) {
  const { ctx, p } = await abrir(url, "invitado");
  ok(`invitado — ${nombre} está abierto`, !esPuerta(await texto(p)));
  await ctx.close();
}

/** Ce qui exige un compte : tout ce qui engage quelqu'un. */
for (const [url, nombre] of [
  ["/cuenta", "Mis viajes"],
  ["/cuenta/mensajes", "Mensajes"],
  ["/cuenta/perfil", "Perfil"],
  ["/cuenta/verificacion", "Verificación"],
  ["/publicar/nuevo", "Publicar"],
]) {
  const { ctx, p } = await abrir(url, "invitado");
  const t = await texto(p);
  ok(`invitado — ${nombre} pide la cuenta`, esPuerta(t));
  /* ET IL DIT POURQUOI. Un écran de connexion sans motif se lit comme
     un mur ; avec un motif, c'est une étape. */
  ok(`invitado — ${nombre} dice por qué`, /cuenta/i.test(t.slice(0, 200)));
  await ctx.close();
}

/* ═══ 3. AVEC UN COMPTE, TOUT S'OUVRE ═══ */
console.log("\n  Con cuenta :\n");
{
  for (const [url, marca] of [
    ["/cuenta", "Mis viajes"],
    ["/cuenta/mensajes", "Mensajes"],
    ["/cuenta/perfil", "Milan R."],
    ["/cuenta/verificacion", "Verificación"],
    ["/cuenta/legal", "Legal"],
  ]) {
    const { ctx, p } = await abrir(url, "socio");
    const t = await texto(p);
    ok(`socio — ${url} montre « ${marca} »`, t.includes(marca), t.slice(0, 40));
    await ctx.close();
  }
}

/* ═══ 4. LA VÉRIFICATION A QUATRE PIÈCES ═══ */
{
  const { ctx, p } = await abrir("/cuenta/verificacion", "socio");
  const t = await texto(p);
  for (const pieza of ["Cédula", "Licencia de conducir", "Foto del carro", "Número de placa"]) {
    ok(`verificación — ${pieza}`, t.includes(pieza));
  }
  /* R6 : aucune image de cédula stockée. L'écran doit le DIRE, parce que
     c'est la question que tout le monde se pose sans la poser. */
  ok("verificación — dit ce qu'on garde de la cédula",
    /Solo si pasó, y una referencia/.test(t));
  await ctx.close();
}

/* ═══ 4 bis. LA VÉRIFICATION OUVRE LE VRAI DIDIT ═══ */
{
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  await ctx.addInitScript((s) => {
    window.localStorage.setItem("partimos.demo-session", JSON.stringify(s));
  }, SESSION);
  /* On intercepte `window.open` : le conteneur de développement bloque
     `verify.didit.me`, donc suivre le lien montrerait une page d'erreur
     réseau. Ce qui compte n'est pas d'y arriver, c'est d'y ENVOYER. */
  await ctx.addInitScript(() => {
    window.__abierto = null;
    window.open = (u) => {
      window.__abierto = u;
      return null;
    };
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/cuenta/verificacion`, { waitUntil: "load" }).catch(() => {});
  await p.waitForTimeout(900);
  await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  await p.waitForTimeout(600);

  const boton = p.locator(".solo-app").first().getByRole("button", { name: /Verificar mi cédula/ });
  ok("didit — le bouton existe", await boton.isVisible().catch(() => false));
  await boton.click();
  await p.waitForTimeout(800);
  const abierto = await p.evaluate(() => window.__abierto);
  ok("didit — il ouvre le parcours de Didit", /verify\.didit\.me\/u\//.test(String(abierto)), String(abierto));

  /* CE QU'ON DIT DU VERDICT. Sans base branchée il ne revient pas tout
     seul, et présenter la vérification comme terminée serait exactement
     le mensonge qui coûte cher le jour d'un incident. */
  const t = await texto(p);
  ok("didit — il ne prétend pas que c'est fini",
    /no vuelve solo|te lo activamos a mano|Didit lo revisa/.test(t));
  ok("didit — il dit que la photo reste chez Didit",
    /se quedan en Didit/.test(t));
  await ctx.close();
}

/* ═══ 5. LE PAVÉ LÉGAL A QUITTÉ LE BAS DE CHAQUE ÉCRAN ═══ */
{
  const marca = "no emplea conductores";
  for (const url of ["/", "/ya", "/cuenta", "/buscar?desde=panama-city&hacia=chitre"]) {
    const { ctx, p } = await abrir(url, "socio");
    const cuerpo = await p.evaluate(() => document.body.innerText ?? "");
    ok(`legal — absent du bas de ${url}`, !cuerpo.includes(marca));
    await ctx.close();
  }
  /* MAIS IL EXISTE, et il a une adresse. Le sortir du pied de page sans
     lui donner de page serait le rendre introuvable — ça, ce serait une
     faute. */
  const { ctx, p } = await abrir("/cuenta/legal", "socio");
  ok("legal — présent dans sa page", (await texto(p)).includes(marca));
  await ctx.close();
}

/* ═══ 6. LA CLOCHE MÈNE À MIS VIAJES ═══ */
{
  const { ctx, p } = await abrir("/", "socio");
  const campana = app(p).getByLabel("Mis viajes y avisos").first();
  ok("campana — elle existe", await campana.isVisible().catch(() => false));
  ok("campana — elle mène à Mis viajes", (await campana.getAttribute("href")) === "/cuenta");
  await ctx.close();
}

/* ═══ 7. LA BARRE FLOTTE, ET ELLE EST EN VERRE ═══ */
{
  const { ctx, p } = await abrir("/", "socio");
  const pilula = p.locator('nav[aria-label="Navegación principal"] ul').first();
  const b = await pilula.boundingBox();
  const vp = p.viewportSize();
  ok("barra — elle est visible", b !== null);
  /* FLOTTANTE : détachée des trois bords, sinon c'est une barre pleine
     largeur et pas une pilule. */
  ok("barra — détachée des bords", b !== null && b.x > 4 && b.x + b.width < vp.width - 4 && b.y + b.height < vp.height - 4,
    b ? `x ${Math.round(b.x)} bas ${Math.round(b.y + b.height)}/${vp.height}` : "absente");
  const flou = await pilula.evaluate((e) => {
    const s = getComputedStyle(e);
    return s.backdropFilter || s.webkitBackdropFilter || "none";
  });
  ok("barra — en verre", /blur/.test(flou), flou);
  /* LE CONTENU NE PASSE PAS DESSOUS. */
  const pad = await p.evaluate(() => parseInt(getComputedStyle(document.body).paddingBottom, 10));
  ok("barra — réserve sous le contenu", pad >= 84, `${pad} px`);
  await ctx.close();
}

/* ═══ 7 bis. LES CINQ ONGLETS, ET UN SEUL ALLUMÉ ═══ */
{
  const ESPERADOS = ["Buscar", "Publicar", "Mis viajes", "Mensajes", "Perfil"];
  const { ctx, p } = await abrir("/", "socio");
  const barra = p.locator('nav[aria-label="Navegación principal"]');
  /* On réduit chaque onglet à SON MOT. `innerText` y colle la pastille
     de non-lus et le texte réservé au lecteur d'écran : sans ce nettoyage
     le test comparerait « 1 Mensajes 1 sin leer » à « Mensajes ». */
  const limpiar = (t) =>
    t.replace(/\d+/g, "").replace(/\+|sin leer/g, "").replace(/\s+/g, " ").trim();
  const etiquetas = (await barra.locator("a").allInnerTexts()).map(limpiar);
  ok("barra — les cinq onglets du propriétaire", 
    JSON.stringify(etiquetas) === JSON.stringify(ESPERADOS), etiquetas.join(" · "));
  await ctx.close();

  /* UN SEUL « vous êtes ici » À LA FOIS. Avec `?panel=`, les quatre
     écrans de compte partageaient un chemin et « Mis viajes » restait
     allumé sur Mensajes comme sur Perfil. */
  for (const [url, esperado] of [
    ["/", "Buscar"],
    ["/ya", "Buscar"],
    ["/publicar/nuevo", "Publicar"],
    ["/cuenta", "Mis viajes"],
    ["/cuenta/mensajes", "Mensajes"],
    ["/cuenta/perfil", "Perfil"],
    ["/cuenta/verificacion", "Perfil"],
    ["/cuenta/legal", "Perfil"],
  ]) {
    const { ctx, p } = await abrir(url, "socio");
    const activos = (
      await p
        .locator('nav[aria-label="Navegación principal"] a[aria-current="page"]')
        .allInnerTexts()
    ).map((t) =>
      t.replace(/\d+/g, "").replace(/\+|sin leer/g, "").replace(/\s+/g, " ").trim(),
    );
    ok(
      `barra — ${url} allume « ${esperado} », et lui seul`,
      activos.length === 1 && activos[0] === esperado,
      activos.join(", ") || "aucun",
    );
    await ctx.close();
  }
}

/* ═══ 7 ter. LE PIED DE PAGE A QUITTÉ L'APP ═══ */
{
  for (const url of ["/", "/cuenta", "/ya"]) {
    const { ctx, p } = await abrir(url, "socio");
    const visible = await p.evaluate(() => document.body.innerText ?? "");
    /* Les trois liens légaux traînaient sur une bande sombre au bas de
       chaque écran. Ils ont leur page : Perfil → Legal. */
    const pie = /Términos\s+Privacidad\s+Seguridad/.test(visible);
    ok(`pied de page — absent de ${url}`, !pie);
    await ctx.close();
  }
  const { ctx, p } = await abrir("/cuenta/legal", "socio");
  const t = await texto(p);
  ok("legal — les trois pages y sont", /Términos de uso/.test(t) && /Privacidad/.test(t) && /Seguridad/.test(t));
  await ctx.close();
}

/* ═══ 7 quater. SE DÉCONNECTER EXISTE ═══ */
{
  const { ctx, p } = await abrir("/cuenta/perfil", "socio");
  /* La déconnexion vit sous l'onglet « Cuenta » : c'est un réglage, pas
     une information publique. Il faut donc y aller. */
  await p.locator(".solo-app").first().getByRole("button", { name: "Cuenta", exact: true }).click();
  await p.waitForTimeout(400);
  const salir = p.locator(".solo-app").first().getByRole("button", { name: "Cerrar sesión" }).first();
  ok("perfil — le bouton de déconnexion existe", await salir.isVisible().catch(() => false));
  await salir.click();
  await p.waitForTimeout(900);
  ok("perfil — il déconnecte vraiment", esPuerta(await texto(p)), (await texto(p)).slice(0, 40));
  await ctx.close();
}

/* ═══ 7 quinquies. LE MOT DE BIENVENUE EST DÉJÀ LÀ ═══ */
{
  const { ctx, p } = await abrir("/cuenta/mensajes", "socio");
  const t = await texto(p);
  ok("mensajes — le mot de Partimos est là", /Bienvenido a bordo, Milan/.test(t));
  await p.locator(".solo-app").first().getByRole("button", { name: /Partimos/ }).first().click();
  await p.waitForTimeout(700);
  const hilo = ((await p.locator("[role=dialog]").first().innerText()) ?? "").replace(/\s+/g, " ");
  ok("mensajes — il dit quoi faire", /Busca a dónde vas/.test(hilo) && /Publica tu viaje/.test(hilo));
  /* IL NE SE FAIT PAS PASSER POUR UNE CONVERSATION. */
  ok("mensajes — il dit qu'on n'y répond pas", /aquí no contestamos/.test(hilo));
  await ctx.close();
}

/* ═══ 7 sexies. UNE SEULE PALETTE, ET C'EST LA MÊME DES DEUX CÔTÉS ═══
   Cette vérification disait avant : « l'accent de l'app n'est pas le
   bleu du site ». C'était le bon test d'une mauvaise situation — il y
   AVAIT deux palettes, et l'app traduisait l'une dans l'autre au rendu.
   La traduction ne rattrapait que ce qui passait par les variables :
   tout ce qui était écrit en dur restait bleu, d'où « le login de
   l'application web a une palette différente ».
   Il n'y a plus qu'une rampe. Ce qu'on vérifie donc maintenant, c'est
   l'égalité — et l'absence totale du bleu d'avant, des deux côtés. */
{
  const { ctx, p } = await abrir("/", "socio");
  const leer = (modoApp) =>
    p.evaluate((app) => {
      document.documentElement.classList.toggle("app-instalada", app);
      const c = getComputedStyle(document.documentElement);
      return ["--color-accent", "--color-accent-ink", "--color-action", "--color-action-ink"]
        .map((v) => c.getPropertyValue(v).trim())
        .join(" ");
    }, modoApp);

  const enApp = await leer(true);
  const enSitio = await leer(false);
  await p.evaluate(() => document.documentElement.classList.add("app-instalada"));

  ok("palette — l'app et le site ont EXACTEMENT les mêmes accents", enApp === enSitio, enApp);
  ok("palette — plus aucune trace du bleu d'avant", !/0284c7|0369a1/i.test(enApp + enSitio));
  await ctx.close();
}

/* ═══ 7 septies. LE PROFIL EST COUPÉ EN DEUX ═══ */
{
  const { ctx, p } = await abrir("/cuenta/perfil", "socio");
  const zona = p.locator(".solo-app").first();
  const t = await texto(p);
  ok("perfil — deux onglets", /Sobre ti/.test(t) && /Cuenta/.test(t));
  /* « Sobre ti » d'abord : ce que les AUTRES voient. */
  ok("perfil — « Sobre ti » montre les chiffres", /viajes? hechos?/.test(t));
  await zona.getByRole("button", { name: "Cuenta", exact: true }).click();
  await p.waitForTimeout(400);
  const tc = await texto(p);
  ok("perfil — « Cuenta » montre les réglages",
    /Verificación/.test(tc) && /Legal/.test(tc) && /Cerrar sesión/.test(tc));
  await ctx.close();
}

/* ═══ 7 octies. PLUS DE CARTE DANS LA PUBLICATION ═══ */
{
  const { ctx, p } = await abrir("/publicar/nuevo", "socio");
  const mapas = await p.locator('.solo-app svg[aria-label*="Mapa"]').count();
  ok("publicar — la carte a disparu", mapas === 0, `${mapas} carte(s)`);
  await ctx.close();
}

/* ═══ 8. AUCUN LIEN MORT DANS L'APP ═══ */
console.log("\n  Enlaces :\n");
{
  const PARTIDA = [
    "/", "/ya", "/buscar?desde=panama-city&hacia=chitre", "/cuenta",
    "/cuenta/mensajes", "/cuenta/perfil", "/cuenta/verificacion",
    "/cuenta/legal", "/como-funciona", "/seguridad", "/ayuda",
    "/publicar", "/publicar/nuevo", "/terminos", "/privacidad",
    `/viaje/${VIAJE_DEMO}?desde=panama-city&hacia=chitre`,
  ];
  const destinos = new Set();
  for (const url of PARTIDA) {
    const { ctx, p } = await abrir(url, "socio");
    const hrefs = await p.locator("a[href]").evaluateAll((els) =>
      els
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .map((e) => e.getAttribute("href")),
    );
    for (const h of hrefs) {
      if (!h || h.startsWith("mailto:") || h.startsWith("tel:") || h.startsWith("#")) continue;
      destinos.add(h);
    }
    await ctx.close();
  }

  ok("enlaces — il y en a à vérifier", destinos.size > 8, `${destinos.size} destination(s)`);

  /* CHAQUE DESTINATION RÉPOND. Une ancre `/#buscar` qui pointe vers un
     bloc masqué en mode app est morte de la même façon qu'un 404 : on
     appuie, rien ne bouge. */
  const muertos = [];
  for (const h of destinos) {
    const camino = h.split("#")[0].split("?")[0] || "/";
    const r = await fetch(`${BASE}${camino}`).catch(() => null);
    if (!r || !r.ok) {
      muertos.push(`${h} (${r ? r.status : "sin respuesta"})`);
      continue;
    }
    /* Une ancre doit avoir sa cible VISIBLE en mode app. */
    if (h.includes("#") && h.split("#")[1]) {
      const { ctx, p } = await abrir(h, "socio");
      const id = h.split("#")[1];
      const visible = await p
        .locator(`#${id}`)
        .first()
        .isVisible()
        .catch(() => false);
      if (!visible) muertos.push(`${h} (ancre invisible dans l'app)`);
      await ctx.close();
    }
  }
  ok("enlaces — aucune destination morte", muertos.length === 0, muertos.join(" · "));
}

await navegador.close();

console.log(fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`);
process.exit(fallos === 0 ? 0 : 1);
