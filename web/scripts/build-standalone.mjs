/**
 * Fabrique le fichier autonome à partir de l'export statique RÉEL.
 * Rien n'est reconstruit : on prend `out/index.html`, on remplace chaque
 * référence externe par son contenu, et on retire les scripts (ils ne
 * portaient que l'hydratation React).
 */
import fs from "node:fs";
import path from "node:path";

const OUT = new URL("../out", import.meta.url).pathname;
const BASE = "/test/partimos";
const DEST = new URL("../standalone/partimos-home-exact.html", import.meta.url)
  .pathname;

const MIME = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/**
 * `/test/partimos/foo.png` → chemin disque dans `out/`.
 * `from` sert aux URL relatives des feuilles de style (`../media/x.woff2`).
 * Un répertoire n'est pas une ressource : `/buscar/` doit rester un lien.
 */
function onDisk(url, from = null) {
  const clean = url.split("?")[0].split("#")[0];
  let p;
  if (clean.startsWith(BASE + "/"))
    p = path.join(OUT, clean.slice(BASE.length));
  else if (from && !/^[a-z]+:|^\/\//i.test(clean))
    p = path.resolve(from, clean);
  else return null;
  return fs.existsSync(p) && fs.statSync(p).isFile() ? p : null;
}

function dataUri(file) {
  const mime =
    MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

let html = fs.readFileSync(path.join(OUT, "index.html"), "utf8");

/* ---- 1. Les feuilles de style, avec leurs polices dedans ---- */
const cssHrefs = [
  ...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g),
];
let inlined = 0;
for (const [tag, href] of cssHrefs) {
  const file = onDisk(href);
  if (!file) continue;
  let css = fs.readFileSync(file, "utf8");

  /* Les sous-ensembles non latins pèsent 60 % du fichier et ne changent RIEN
     au rendu d'une page en espagnol. Le tri se fait sur le début exact de la
     plage, tel que Google Fonts l'émet :
       · `U+??`      → latin        (à garder)
       · `U+100-2BA` → latin étendu (à garder)
       · `U+301,U+400-45F` cyrillique, `U+460-52F` cyrillique étendu,
         `U+102-103,U+110-111` vietnamien → à jeter.
     Une première version testait « la plage contient-elle un chiffre bas »,
     ce qui laissait passer le cyrillique à cause de son `U+301` de tête : les
     32 fichiers étaient conservés, 862 Ko pour rien. */
  const before = css.length;
  let dropped = 0;
  css = css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    const range = /unicode-range:\s*([^;}]+)/.exec(block);
    if (!range) return block; // pas de plage déclarée : on ne peut pas trancher
    /* Latin étendu compris : vérifié caractère par caractère sur le texte
       rendu, RIEN sur cette page n'y tombe. Le seul signe hors du latin de
       base est la flèche `→` (U+2192), qui n'est dans aucun des deux et
       retombe déjà sur une police système — sur le site en ligne aussi. */
    const latin = /^U\+\?\?/i.test(range[1].trim());
    if (!latin) dropped++;
    return latin ? block : "";
  });

  // Chaque url() devient son contenu.
  css = css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => {
    if (u.startsWith("data:")) return m;
    const f = onDisk(u, path.dirname(file));
    return f ? `url(${dataUri(f)})` : m;
  });

  html = html.replace(tag, `<style>\n${css}\n</style>`);
  inlined++;
  console.log(
    `  CSS ${path.basename(file)} : ${before} o de règles, ${dropped} @font-face non latins retirés`,
  );
}

/* ---- 2. Plus aucun script : il n'y avait que l'hydratation ---- */
const scripts = (html.match(/<script/g) ?? []).length;
html = html.replace(/<script[\s\S]*?<\/script>/g, "");
html = html.replace(/<link[^>]+rel="preload"[^>]*as="script"[^>]*>/g, "");

/* La barre d'action basse est pilotée par un IntersectionObserver : elle
   n'apparaît qu'une fois le premier écran passé. Sans script, son état de
   départ est « repliée » — donc invisible pour toujours, et le lecteur du
   fichier croit qu'elle n'existe pas (c'est arrivé). On la fige DÉPLOYÉE :
   c'est l'état dans lequel elle passe 95 % de la page. */
html = html
  .replace(/translate-y-\[calc\(100%\+1\.5rem\)\]/g, "translate-y-0")
  .replace(/ inert=""/g, "");

/* ---- 3. Les images et les icônes ---- */
let images = 0;
html = html.replace(
  /(src|href|content)="(\/test\/partimos\/[^"]+)"/g,
  (m, attr, url) => {
    if (/\.(css|js|txt|html?)$/i.test(url.split("?")[0])) return m;
    const f = onDisk(url);
    if (!f) return m;
    images++;
    return `${attr}="${dataUri(f)}"`;
  },
);
// srcSet de next/image
html = html.replace(/srcSet="([^"]+)"|srcset="([^"]+)"/g, (m, a, b) => {
  const list = (a ?? b).split(",").map((part) => {
    const [u, d] = part.trim().split(/\s+/);
    const f = onDisk(u);
    if (f) images++;
    return `${f ? dataUri(f) : u}${d ? " " + d : ""}`;
  });
  return `srcset="${list.join(", ")}"`;
});

/* ---- 4. Ce qui resterait externe : on le signale plutôt que le cacher ---- */
const leftovers = [
  ...html.matchAll(
    /(?:src|href)="(https?:\/\/[^"]+|\/test\/partimos\/[^"]+)"/g,
  ),
]
  .map((m) => m[1])
  .filter((u) => !u.startsWith("data:"));

fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, html);

console.log(`feuilles inlinées : ${inlined}`);
console.log(`scripts retirés   : ${scripts}`);
console.log(`ressources inlinées : ${images}`);
console.log(
  `références externes restantes : ${leftovers.length ? leftovers.slice(0, 6) : "aucune"}`,
);
console.log(`${DEST} — ${(fs.statSync(DEST).size / 1024).toFixed(0)} Ko`);
