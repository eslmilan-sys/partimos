/**
 * LE SERVICE WORKER — ce qui fait de Partimos une app plutôt qu'un signet.
 *
 * Stratégie volontairement PRUDENTE, parce qu'un service worker mal réglé
 * est la façon la plus sûre de servir à quelqu'un une version périmée du
 * site pendant des jours.
 *
 *   · les PAGES (navigations) → le réseau d'abord, avec un DÉLAI MAXIMUM.
 *     On sert le cache seulement si le réseau ne répond pas, ou plus.
 *   · les FICHIERS de build (/_next/static/…) → le cache d'abord : leur
 *     nom contient une empreinte, ils ne changent jamais à nom égal.
 *   · tout le reste (API, Supabase, cartes) → jamais mis en cache.
 *
 * ---------------------------------------------------------------------------
 * LE BUG QUE CE FICHIER A CAUSÉ, ET QU'IL NE CAUSERA PLUS.
 *
 * La version précédente gardait « ./ » — c'est-à-dire LA PAGE D'ACCUEIL —
 * comme repli hors-ligne universel :
 *
 *     const HORS_LIGNE = new Request("./");
 *     …
 *     .catch(() => caches.match(req).then((hit) => hit ?? caches.match(HORS_LIGNE)))
 *
 * Conséquence, reproduite au navigateur : on arrive sur une page en cliquant
 * un lien (navigation interne — le service worker ne la voit jamais passer,
 * donc elle n'entre pas en cache), le réseau tousse une seconde, on
 * rafraîchit… et on reçoit L'ACCUEIL, avec un code 200, à l'adresse de la
 * page demandée. De l'extérieur : « je rafraîchis et ça m'envoie ailleurs
 * sur le site ». En 4G la nuit, c'est-à-dire le vrai terrain de ce produit,
 * ça arrive tout le temps.
 *
 * La règle qui remplace ça : UNE ADRESSE NE REND JAMAIS LE CONTENU D'UNE
 * AUTRE. Si on n'a pas la page demandée, on le DIT — une page hors-ligne
 * explicite, en 503, avec un bouton pour réessayer. Mieux vaut un écran
 * honnête qu'un écran qui ment.
 */

/* Changer ce numéro purge les anciens caches à l'activation. Il passe à v2
   parce que v1 contient des navigations mises en cache par la logique
   fautive — les garder, c'est garder le bug quelques jours de plus. */
/* v3 : la version précédente a mis en cache un shell dont les CSS et les
   JS pointaient vers la racine du domaine (build sans BASE_PATH). Changer
   de nom purge ces entrées à l'activation — sans ça, quelqu'un qui a
   ouvert le site pendant la panne garderait la page sans styles jusqu'à
   ce qu'il désinstalle l'app. */
const CACHE = "partimos-v3";

/* 4 secondes. Au-delà, on considère que le réseau ment : sur un téléphone
   en bord de couverture, une requête peut « pendre » une minute sans jamais
   échouer. Sans ce délai, l'app reste sur un écran blanc — et l'utilisateur
   conclut qu'elle est morte, ce qui est pire qu'un écran hors-ligne. */
const DELAI_RESEAU = 4000;

/** La page hors-ligne. Fabriquée ICI plutôt que mise en cache : elle doit
 *  marcher à la toute première ouverture, avant que quoi que ce soit ait pu
 *  être téléchargé. */
function paginaSinConexion(pathname) {
  const html = `<!doctype html>
<html lang="es-PA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sin conexión — Partimos</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100dvh;
    display: flex; align-items: center; justify-content: center;
    padding: 24px calc(24px + env(safe-area-inset-right)) calc(24px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left));
    background: #faf9f7; color: #1c1917;
    font: 400 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  main { max-width: 30rem; width: 100%; }
  h1 { margin: 0 0 12px; font-size: 26px; line-height: 1.15; font-weight: 800; letter-spacing: -0.03em; }
  p { margin: 0 0 10px; color: #57534e; }
  code { font-size: 14px; color: #78716c; overflow-wrap: anywhere; }
  button {
    margin-top: 20px; width: 100%; padding: 15px 20px;
    font: inherit; font-weight: 700; color: #fff; background: #1c1917;
    border: 0; border-radius: 14px; cursor: pointer;
  }
  button:active { background: #292524; }
  .marca { display: inline-block; margin-bottom: 20px; font-weight: 800; letter-spacing: -0.02em; }
  .marca span { color: #b45309; }
</style>
</head>
<body>
  <main>
    <span class="marca">Partimos<span>.</span></span>
    <h1>Se fue la conexión</h1>
    <p>No pudimos cargar esta página. Tu viaje y tus mensajes siguen guardados: aparecen apenas vuelva la señal.</p>
    <p><code>${pathname.replace(/[<>&"]/g, "")}</code></p>
    <button onclick="location.reload()">Reintentar</button>
  </main>
</body>
</html>`;
  /* 503 et non 200 : ce n'est pas la page demandée, et rien — ni le
     navigateur, ni un robot, ni un test — ne doit croire le contraire. */
  return new Response(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Le réseau, mais pas indéfiniment. */
function conDelay(req) {
  return new Promise((resolve, reject) => {
    const reloj = setTimeout(() => reject(new Error("delai-reseau")), DELAI_RESEAU);
    fetch(req).then(
      (res) => {
        clearTimeout(reloj);
        resolve(res);
      },
      (err) => {
        clearTimeout(reloj);
        reject(err);
      },
    );
  });
}

self.addEventListener("install", (e) => {
  /* On prend la main tout de suite : sans skipWaiting, la nouvelle version
     attend la fermeture de TOUS les onglets — sur un téléphone, ça n'arrive
     jamais. C'est ce qui fait qu'une correction est visible sans avoir à
     vider Safari. */
  self.skipWaiting();
  /* On met l'accueil de côté pour qu'il s'ouvre hors ligne. Il ne sert
     QUE pour sa propre adresse — plus jamais de repli universel. */
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add(new Request("./", { cache: "reload" })))
      .catch(() => {}),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  /* Une autre origine : Supabase, les géocodeurs, les cartes. On ne touche
     à rien — mettre en cache une réponse authentifiée serait une fuite. */
  if (url.origin !== self.location.origin) return;

  /* Les fichiers de build portent une empreinte dans leur nom. */
  if (url.pathname.includes("/_next/static/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            if (res.ok) {
              const copia = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copia));
            }
            return res;
          }),
      ),
    );
    return;
  }

  /* Les pages : réseau d'abord (borné), puis LA MÊME page en cache, puis
     l'écran hors-ligne. Jamais le contenu d'une autre adresse. */
  if (req.mode === "navigate") {
    e.respondWith(
      conDelay(req)
        .then((res) => {
          /* Une 404 ou une 500 ne se met pas en cache : sinon on rejouerait
             l'erreur hors ligne, en la faisant passer pour la page. */
          if (res.ok) {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((hit) => hit ?? paginaSinConexion(url.pathname)),
        ),
    );
  }
});
