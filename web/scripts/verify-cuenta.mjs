#!/usr/bin/env node
/**
 * BATTERIE DES ÉCRANS DE COMPTE — Mis viajes, Mensajes, Perfil, Descubre.
 *
 *   node scripts/verify-cuenta.mjs [url]     (défaut : http://localhost:3100)
 *
 * Ce qu'elle protège :
 *
 *   · le CLASSEMENT des reservas — próximo / en curso / historial se
 *     déduit de l'heure, et une reserva d'hier ne doit jamais apparaître
 *     dans « Próximos » ;
 *   · le CHAT est à un geste depuis chaque reserva, et il porte son
 *     bandeau de sécurité ;
 *   · le PROFIL ne compte que des reservas réelles — jamais un chiffre
 *     flatteur inventé — et n'affiche jamais le nom de famille entier ;
 *   · Descubre ne promet que ce qui existe : chaque carte a un lien ;
 *   · le SITE garde son espace compte, et le HTML servi ne dépend pas du
 *     mode.
 */

import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

let fallos = 0;
const ok = (nom, cond, detalle = "") => {
  console.log(`  ${cond ? "ok  " : "FALLA"}  ${nom}${detalle ? ` — ${detalle}` : ""}`);
  if (!cond) fallos++;
};

/* Trois reservas, une par état : demain, il y a deux heures, il y a
   trois jours. Les dates sont calculées au lancement — une date en dur
   changerait d'état toute seule au bout d'une semaine. */
const manana = new Date(Date.now() + 20 * 3_600_000).toISOString();
const haceDosHoras = new Date(Date.now() - 2 * 3_600_000).toISOString();
const haceTresDias = new Date(Date.now() - 3 * 86_400_000).toISOString();

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
      from: "panama-city", to: "chitre", boardingAt: manana,
      seats: 1, totalCents: 1900, feeCents: 95, channel: "yappy",
      driverName: "Carlos M", point: "Albrook, entrada norte", status: "confirmado",
    },
    {
      id: "demo-22222222-2222-3333-4444-555555555555",
      tripId: "panama-chitre-2026-08-15-1",
      from: "panama-city", to: "penonome", boardingAt: haceDosHoras,
      seats: 2, totalCents: 2300, feeCents: 115, channel: "efectivo",
      driverName: "Rita G", point: "Costa del Este", status: "confirmado",
    },
    {
      id: "demo-33333333-2222-3333-4444-555555555555",
      tripId: "panama-chitre-2026-08-12-0",
      from: "panama-city", to: "santiago", boardingAt: haceTresDias,
      seats: 1, totalCents: 1500, feeCents: 75, channel: "efectivo",
      driverName: "Moisés D", point: "Vía Centenario", status: "confirmado",
    },
  ],
};

/** ÉMOJI, mais pas « tout ce qui est pictographique ».
 *  `\p{Extended_Pictographic}` attrape aussi ©, ® et ™ — le pied de page
 *  a fait tomber la batterie entière pour un signe de copyright. On ne
 *  garde donc que ce qui s'AFFICHE en émoji : présentation émoji par
 *  défaut, ou forcée par le sélecteur de variante U+FE0F. */
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;

const navegador = await chromium.launch({ executablePath: CHROME });

async function abrir(url, { modo = "app", conSesion = true } = {}) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"] });
  if (conSesion) {
    await ctx.addInitScript((s) => {
      window.localStorage.setItem("partimos.demo-session", JSON.stringify(s));
    }, SESSION);
  }
  const p = await ctx.newPage();
  /* `load`, PAS `networkidle`.

     L'écran de compte interroge la base pour connaître l'état de la
     vérification. C'est une requête de fond légitime, qui peut mettre
     plusieurs secondes ou ne jamais aboutir sur un réseau coupé —
     exactement le cas de ce conteneur, où Supabase est injoignable.
     `networkidle` attend 500 ms sans trafic : il n'arrivait donc jamais,
     et la batterie échouait sur un produit parfaitement sain.

     Playwright déconseille `networkidle` pour cette raison précise. On
     attend le chargement, puis LA CHOSE QU'ON VEUT MESURER — ce qui est
     de toute façon une meilleure attente qu'un silence réseau. */
  await p.goto(`${BASE}${url}`, { waitUntil: "load" });
  await p
    .locator(".solo-app")
    .first()
    .waitFor({ state: "attached", timeout: 20_000 })
    .catch(() => {});
  /* Après l'hydratation seulement : `PWA.tsx` repose la classe au
     montage et effacerait la nôtre si on la posait trop tôt. */
  if (modo === "app") {
    await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  }
  await p.waitForTimeout(700);
  if (modo === "app") {
    await p.evaluate(() => document.documentElement.classList.add("app-instalada"));
  }
  return { ctx, p };
}

const app = (p) => p.locator(".solo-app").first();

console.log(`\nCuenta — ${BASE}\n`);

/* 1. MIS VIAJES — le classement, et rien que le classement. */
{
  const { ctx, p } = await abrir("/cuenta");
  const zona = app(p);
  const t = ((await zona.textContent()) ?? "").replace(/\s+/g, " ");

  ok("viajes — le titre", t.includes("Mis viajes"));
  ok("viajes — les trois groupes", /Próximos/.test(t) && /En curso/.test(t) && /Historial/.test(t));

  const cuenta = async (label) =>
    ((await zona.getByRole("button", { name: new RegExp(label) }).first().textContent()) ?? "")
      .replace(/\D/g, "");
  ok("viajes — 1 próximo", (await cuenta("Próximos")) === "1", await cuenta("Próximos"));
  ok("viajes — 1 en curso", (await cuenta("En curso")) === "1", await cuenta("En curso"));
  ok("viajes — 1 en historial", (await cuenta("Historial")) === "1", await cuenta("Historial"));

  /* Le groupe ouvert par défaut est « Próximos », et il ne contient QUE
     le viaje de demain. Une reserva passée qui remonterait là ferait
     attendre quelqu'un au bord de la route. */
  const tarjetas = zona.locator("ul > li a[href*='/viaje/']");
  ok("viajes — une seule carte dans Próximos", (await tarjetas.count()) === 1, `${await tarjetas.count()}`);
  ok("viajes — c'est bien celle de demain", ((await tarjetas.first().textContent()) ?? "").includes("Chitré"));
  ok("viajes — le point de recogida est dit", /Te recoge/.test(t));
  /* LA DATE COIFFE LE GROUPE, ELLE N'EST PAS SUR CHAQUE CARTE. La
     version d'avant cherchait le mot « mañana » : selon l'heure à
     laquelle tournait la batterie, la reserva de « dans 20 h » tombait
     le jour même et le test échouait sans qu'aucun code n'ait bougé. On
     vérifie donc la STRUCTURE, qui est ce qui compte : un en-tête de
     jour au-dessus, aucune date dans la carte. */
  const encabezado = ((await zona.locator("section h2").first().textContent()) ?? "").trim();
  ok("viajes — un en-tête de jour coiffe le groupe",
    /^(Hoy|Mañana|[A-Za-zÁÉÍÓÚáéíóúñ]+ \d{1,2})/i.test(encabezado), encabezado);
  const carta = ((await tarjetas.first().innerText()) ?? "").replace(/\s+/g, " ");
  ok("viajes — la carte ne répète pas la date", !/Hoy|Mañana/i.test(carta), carta.slice(0, 50));

  /* On peut changer de groupe, et l'historial ne montre pas le futur. */
  await zona.getByRole("button", { name: /Historial/ }).click();
  await p.waitForTimeout(300);
  const hist = ((await zona.textContent()) ?? "").replace(/\s+/g, " ");
  ok("viajes — l'historial montre Santiago", hist.includes("Santiago"));
  ok("viajes — et pas le viaje de demain", !hist.includes("Chitré"));
  await ctx.close();
}

/* 2. LE CHAT est à un geste, et il dit ce qu'il protège. */
{
  const { ctx, p } = await abrir("/cuenta");
  await app(p).getByRole("button", { name: /Escribir a|Chat con/ }).first().click();
  await p.waitForTimeout(600);
  const hilo = p.locator("[role=dialog]").first();
  ok("chat — le fil s'ouvre", await hilo.isVisible().catch(() => false));
  const t = ((await hilo.textContent()) ?? "").replace(/\s+/g, " ");
  ok("chat — le bandeau de sécurité", /queda escrito y nadie puede cambiarlo/.test(t));
  ok("chat — il ne réclame pas de numéro", /No hace falta dar tu número/.test(t));
  ok("chat — des questions toutes faites", (await hilo.locator("button").count()) > 2);
  ok("chat — on peut écrire", await hilo.locator("textarea").first().isVisible().catch(() => false));
  ok("chat — aucun émoji", !EMOJI.test(t));
  await ctx.close();
}

/* 3. PERFIL — des chiffres comptés, et l'identité publique protégée. */
{
  const { ctx, p } = await abrir("/cuenta/perfil");
  const t = ((await app(p).textContent()) ?? "").replace(/\s+/g, " ");
  ok("perfil — le nom public est « Ana R. »", t.includes("Ana R."));
  ok("perfil — le nom de famille entier n'apparaît pas", !t.includes("Ruiz"));
  ok("perfil — cédula verificada", /Cédula verificada/.test(t));
  /* Le chiffre et son libellé sont deux éléments : `textContent` les
     colle sans espace. On tolère donc l'absence d'espace — mais pas un
     autre chiffre devant, sinon « 21 » passerait pour « 1 ». */
  ok("perfil — 1 viaje hecho", /(?<!\d)1\s*viaje hecho/.test(t), t.match(/\d+\s*viajes? hechos?/)?.[0] ?? "");
  ok("perfil — 2 viajes por delante", /(?<!\d)2\s*viajes por delante/.test(t), t.match(/\d+\s*viajes? por delante/)?.[0] ?? "");
  ok("perfil — un menu qui mène quelque part", (await app(p).locator("a[href]").count()) >= 5);
  ok("perfil — aucun émoji", !EMOJI.test(t));
  await ctx.close();
}

/* 4. MENSAJES — une conversation par reserva. */
{
  const { ctx, p } = await abrir("/cuenta/mensajes");
  const t = ((await app(p).textContent()) ?? "").replace(/\s+/g, " ");
  ok("mensajes — le titre", t.includes("Mensajes"));
  /* Trois reservas + le mot de bienvenue de Partimos, qui est posé dans
     la boîte dès l'inscription : une boîte vide au premier jour
     n'apprend rien et ne donne rien à faire. */
  const filas = app(p).locator("ul > li");
  ok("mensajes — une par reserva, plus le mot de bienvenue",
    (await filas.count()) === 4, `${await filas.count()}`);
  ok("mensajes — le mot de bienvenue est en tête",
    ((await filas.first().innerText()) ?? "").includes("Partimos"));
  ok("mensajes — les trois conducteurs", /Carlos/.test(t) && /Rita/.test(t) && /Moisés/.test(t));
  await ctx.close();
}

/* 5. DESCUBRE — six choses, et chacune mène à l'écran où elle sert. */
{
  const { ctx, p } = await abrir("/como-funciona", { conSesion: false });
  const zona = app(p);
  const t = ((await zona.textContent()) ?? "").replace(/\s+/g, " ");
  ok("descubre — le titre", /Todo lo que necesitas/.test(t));
  const tarjetas = zona.locator("ul > li > a[href]");
  ok("descubre — six cartes", (await tarjetas.count()) === 6, `${await tarjetas.count()}`);
  ok("descubre — les trois canaux de paiement", /Tres formas de pagar/.test(t));
  ok("descubre — jamais « gratis »", !/gratis/i.test(t));
  ok("descubre — jamais « tarifa de reserva »", !/tarifa de reserva/i.test(t));
  ok("descubre — aucun émoji", !EMOJI.test(t));
  ok("descubre — ce que nous ne sommes pas est dit", /No es una empresa de transporte/.test(t));
  await ctx.close();
}

/* 6. LE SITE garde son espace compte. */
{
  const { ctx, p } = await abrir("/cuenta", { modo: "sitio" });
  ok(
    "site — l'espace compte du site est là",
    await p.locator(".solo-web").first().isVisible().catch(() => false),
  );
  await ctx.close();
}

/* 7. LE HTML SERVI ne dépend pas du mode. */
{
  for (const ruta of ["/cuenta", "/como-funciona"]) {
    const brut = await fetch(`${BASE}${ruta}`).then((r) => r.text());
    const h1 = (brut.match(/<h1[\s>]/g) ?? []).length;
    ok(`SEO — au plus un h1 sur ${ruta}`, h1 <= 1, `${h1} trouvé(s)`);
  }
}

await navegador.close();

console.log(fallos === 0 ? "\nTout passe.\n" : `\n${fallos} vérification(s) en échec.\n`);
process.exit(fallos === 0 ? 0 : 1);
