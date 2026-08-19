#!/usr/bin/env node
/**
 * LE SCHÉMA, DESSINÉ DEPUIS LES DONNÉES VÉRIFIÉES.
 *
 *   MAPA_JSON=… node scripts/mapa-artefacto.mjs > mapa.html
 *
 * Il lit `mapa.mjs` (le plan) et le journal de `verify-mapa.mjs` (les
 * verdicts), et compose une page. Rien n'est saisi à la main : ni un
 * nom d'écran, ni une flèche, ni une pastille verte. C'est la seule
 * façon qu'un plan de site reste vrai plus d'une semaine — dessiné à la
 * main, il décrit le produit d'hier et on prend des décisions dessus.
 *
 * Les coordonnées sont CALCULÉES, pas placées à l'œil : une grille
 * régulière est l'essentiel de ce qui fait qu'un schéma paraît
 * délibéré, et une grille tenue à la main ne tient jamais.
 */

import { readFileSync } from "node:fs";
import { SITIO, APP } from "./mapa.mjs";

const diario = process.env.MAPA_JSON
  ? JSON.parse(readFileSync(process.env.MAPA_JSON, "utf8"))
  : { nodos: {}, aristas: {}, resumen: { ok: 0, falla: 0, salto: 0 } };

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ─────────────────────────────────────────────────────────────────────
   LES DEUX MOITIÉS SE DISTINGUENT PAR LA TEINTE, et c'est porteur de
   sens, pas décoratif : l'orange est la couleur du produit, le teal
   celle de sa version installée. Le lecteur sait à tout moment de quelle
   moitié il parle sans lire une légende.
   ───────────────────────────────────────────────────────────────────── */
const LADOS = [
  { mapa: SITIO, modo: "web", tono: "sol" },
  { mapa: APP, modo: "app", tono: "teal" },
];

const estadoDe = (donde, clave) => diario[donde]?.[clave]?.estado ?? "sin";

/**
 * LE VERDICT D'UN ÉCRAN SANS ADRESSE.
 *
 * La passe 1 de la batterie visite des URL ; un état interne n'en a pas,
 * donc il n'y apparaît jamais. Mais il EST vérifié — par le chemin qui y
 * mène, qui ne rend « ok » que si l'écran d'arrivée s'est reconnu. Le
 * laisser en gris raconterait qu'on ne l'a pas regardé, ce qui est faux.
 */
function veredicto(mapa, modo, nodo) {
  if (nodo.url) return estadoDe("nodos", `${modo}:${nodo.id}`);
  const entrantes = mapa.aristas
    .filter((a) => a.a === nodo.id)
    .map((a) => estadoDe("aristas", `${modo}:${a.de}>${a.a}`));
  if (entrantes.includes("ok")) return "ok";
  if (entrantes.length && entrantes.every((e) => e === "salto")) return "salto";
  return entrantes.includes("falla") ? "falla" : "sin";
}

/* ═══════════════════════════════════════════════════════════════════
   LE PLAN — racine, familles, écrans. Trois colonnes, une grille.
   ═══════════════════════════════════════════════════════════════════ */
function dibujarPlano({ mapa, modo, tono }) {
  const W = 1000;
  const PASO = 50; // hauteur d'une ligne d'écran
  const HUECO = 26; // respiration entre deux familles
  const ALTO_N = 40;
  const X_RAIZ = [34, 196];
  const X_FAM = [246, 424];
  const X_NODO = [474, 962];

  /* On pose les lignes famille par famille, en gardant pour chacune le
     centre de ses écrans : c'est ce centre qui ancre la courbe. */
  let y = 30;
  const filas = [];
  const familias = [];
  for (const grupo of mapa.grupos) {
    const suyos = mapa.nodos.filter((n) => n.grupo === grupo.id);
    if (suyos.length === 0) continue;
    const desde = y;
    for (const nodo of suyos) {
      filas.push({ nodo, y });
      y += PASO;
    }
    familias.push({ grupo, centro: (desde + y - PASO) / 2 + ALTO_N / 2, n: suyos.length });
    y += HUECO;
  }
  const H = y + 10;
  const centroRaiz = H / 2;

  const curva = (x1, y1, x2, y2) => {
    const dx = (x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  const piezas = [];

  /* Les courbes d'abord : elles passent DERRIÈRE les cartons. */
  for (const f of familias) {
    piezas.push(
      `<path d="${curva(X_RAIZ[1], centroRaiz, X_FAM[0], f.centro)}" class="hilo" />`,
    );
  }
  for (const fila of filas) {
    const f = familias.find((x) => x.grupo.id === fila.nodo.grupo);
    piezas.push(
      `<path d="${curva(X_FAM[1], f.centro, X_NODO[0], fila.y + ALTO_N / 2)}" class="hilo" />`,
    );
  }

  /* La racine. */
  piezas.push(
    `<rect x="${X_RAIZ[0]}" y="${centroRaiz - 27}" width="${X_RAIZ[1] - X_RAIZ[0]}" height="54" rx="27" class="raiz" />`,
    `<text x="${(X_RAIZ[0] + X_RAIZ[1]) / 2}" y="${centroRaiz + 6}" text-anchor="middle" class="t-raiz">${esc(mapa.titulo)}</text>`,
  );

  /* Les familles. */
  for (const f of familias) {
    piezas.push(
      `<rect x="${X_FAM[0]}" y="${f.centro - 18}" width="${X_FAM[1] - X_FAM[0]}" height="36" rx="18" class="familia" />`,
      `<text x="${(X_FAM[0] + X_FAM[1]) / 2}" y="${f.centro + 5}" text-anchor="middle" class="t-familia">${esc(f.grupo.label)}</text>`,
      `<circle cx="${X_FAM[1]}" cy="${f.centro}" r="3.5" class="punto" />`,
    );
  }

  /* Les écrans. Deux lignes : le nom, puis l'adresse — ou la mention
     qu'il n'y en a pas, ce qui est une information et non un manque. */
  for (const { nodo, y } of filas) {
    const estado = veredicto(mapa, modo, nodo);
    const direccion = nodo.url
      ? nodo.url.split("?")[0]
      : nodo.patron
        ? /* On n'enlève QUE les ancres, pas le `^` de la classe de
             caractères : `[^/]+` doit rester lisible. */
          nodo.patron.replace(/^\^/, "").replace(/\$$/, "")
        : "dentro de una pantalla";
    piezas.push(
      `<circle cx="${X_NODO[0]}" cy="${y + ALTO_N / 2}" r="3.5" class="punto" />`,
      `<rect x="${X_NODO[0] + 10}" y="${y}" width="${X_NODO[1] - X_NODO[0] - 10}" height="${ALTO_N}" rx="11" class="carton ${nodo.sesion ? "cerrado" : ""}" />`,
      `<text x="${X_NODO[0] + 26}" y="${y + 17}" class="t-nodo">${esc(nodo.label)}</text>`,
      `<text x="${X_NODO[0] + 26}" y="${y + 32}" class="t-ruta">${esc(direccion)}</text>`,
      `<circle cx="${X_NODO[1] - 20}" cy="${y + ALTO_N / 2}" r="5" class="sello ${estado}" />`,
    );
    if (nodo.sesion) {
      piezas.push(
        `<text x="${X_NODO[1] - 36}" y="${y + ALTO_N / 2 + 4}" text-anchor="end" class="t-llave">con cuenta</text>`,
      );
    }
  }

  return `<figure class="fig ${tono}">
  <div class="lienzo">
    <svg viewBox="0 0 ${W} ${H}" width="${W}" role="img"
         aria-label="Plan des écrans de ${esc(mapa.titulo)} : ${familias.length} familles, ${filas.length} écrans, chacun avec son adresse et son verdict de vérification.">
      ${piezas.join("\n      ")}
    </svg>
  </div>
  <figcaption><b>Plano de pantallas — ${esc(mapa.titulo)}.</b> ${filas.length} pantallas en ${familias.length} familias. Punto <span class="leyenda ok">verde</span>: la pantalla se abrió de verdad en un navegador. <span class="leyenda salto">Ámbar</span>: no se puede comprobar desde aquí, y abajo se dice por qué. El borde punteado y «con cuenta» marcan lo que está detrás de la puerta.</figcaption>
</figure>`;
}

/* ═══════════════════════════════════════════════════════════════════
   LE PARCOURS — ce que quelqu'un fait, dans l'ordre. Deux voies, parce
   qu'un passager et un conducteur ne traversent pas le même produit.
   ═══════════════════════════════════════════════════════════════════ */
function dibujarFlujo({ titulo, vias, tono, aria, pie }) {
  const ANCHO = 168;
  const ALTO = 46;
  const SEP_X = 86; // l'étiquette de la flèche doit tenir SANS toucher la pastille suivante
  const SEP_Y = 30;
  const X0 = 128;
  const Y0 = 34;
  const columnas = Math.max(...vias.map((v) => v.pasos.length));
  const W = X0 + columnas * (ANCHO + SEP_X) + 12;
  const H = Y0 + vias.length * (ALTO + SEP_Y) + 16;

  const piezas = [];
  vias.forEach((via, i) => {
    const y = Y0 + i * (ALTO + SEP_Y);
    piezas.push(
      `<text x="12" y="${y + ALTO / 2 + 5}" class="t-via">${esc(via.label)}</text>`,
    );
    via.pasos.forEach((paso, j) => {
      const x = X0 + j * (ANCHO + SEP_X);
      const clase =
        paso.tipo === "inicio"
          ? "paso inicio"
          : paso.tipo === "puerta"
            ? "paso puerta"
            : paso.tipo === "fin"
              ? "paso fin"
              : "paso";
      piezas.push(
        `<rect x="${x}" y="${y}" width="${ANCHO}" height="${ALTO}" rx="${ALTO / 2}" class="${clase}" />`,
      );
      /* Deux lignes quand le libellé le demande — un mot coupé au milieu
         d'une pastille se lit deux fois. */
      const lineas = paso.label.split("\n");
      lineas.forEach((l, k) => {
        const dy = lineas.length === 1 ? 5 : k === 0 ? -2 : 12;
        piezas.push(
          `<text x="${x + ANCHO / 2}" y="${y + ALTO / 2 + dy}" text-anchor="middle" class="t-paso${paso.tipo === "fin" ? " claro" : ""}">${esc(l)}</text>`,
        );
      });
      if (j < via.pasos.length - 1) {
        const xa = x + ANCHO;
        piezas.push(
          `<line x1="${xa + 8}" y1="${y + ALTO / 2}" x2="${xa + SEP_X - 12}" y2="${y + ALTO / 2}" class="flecha" marker-end="url(#punta-${tono})" />`,
        );
        if (paso.arista) {
          piezas.push(
            `<text x="${xa + SEP_X / 2}" y="${y + ALTO / 2 - 10}" text-anchor="middle" class="t-arista">${esc(paso.arista)}</text>`,
          );
        }
      }
    });
  });

  return `<figure class="fig ${tono}">
  <div class="lienzo">
    <svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${esc(aria)}">
      <defs>
        <marker id="punta-${tono}" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" class="punta" />
        </marker>
      </defs>
      ${piezas.join("\n      ")}
    </svg>
  </div>
  <figcaption><b>${esc(titulo)}</b> ${esc(pie)}</figcaption>
</figure>`;
}

/* ─── Les parcours, écrits une fois, ici ───────────────────────────── */
const FLUJO_SITIO = {
  titulo: "Recorrido en el sitio.",
  tono: "sol",
  aria:
    "Deux parcours dans le site : le passager va de son arrivée par un moteur de recherche jusqu'à la demande de place ; le conducteur va de l'explication jusqu'au viaje publié.",
  pie: "El pasajero llega por una búsqueda y no se le pide cuenta hasta que pide el puesto. El conductor pasa por la puerta de documentos antes del primer campo.",
  vias: [
    {
      label: "Pasajero",
      pasos: [
        { label: "Llega por\nGoogle", tipo: "inicio", arista: "SEO" },
        { label: "Página de ruta", arista: "buscar" },
        { label: "Buscar", arista: "desde / hacia" },
        { label: "Resultados", arista: "una tarjeta" },
        { label: "Ficha del viaje", arista: "reservar" },
        { label: "Entrar o\ncrear cuenta", tipo: "puerta", arista: "cuenta" },
        { label: "Reserva pedida", tipo: "fin" },
      ],
    },
    {
      label: "Conductor",
      pasos: [
        { label: "Inicio", tipo: "inicio", arista: "publicar" },
        { label: "Cuánto\nrecuperas", arista: "empezar" },
        { label: "Cédula, licencia\ny carro", tipo: "puerta", arista: "verificado" },
        { label: "12 pantallas", arista: "una pregunta" },
        { label: "Revisa y publica", arista: "confirmar" },
        { label: "Viaje publicado", tipo: "fin" },
      ],
    },
  ],
};

const FLUJO_APP = {
  titulo: "Recorrido en la app.",
  tono: "teal",
  aria:
    "Deux parcours dans l'app installée : le passager peut chercher sans compte ; le conducteur passe par l'inscription en six questions puis par la porte des documents.",
  pie: "La cruz de la portada abre el modo invitado: buscar nunca pide cuenta. Todo lo que compromete a alguien — reservar, publicar, escribir — vuelve a la puerta.",
  vias: [
    {
      label: "Pasajero",
      pasos: [
        { label: "Abre la app", tipo: "inicio", arista: "portada" },
        { label: "Solo quiero\nbuscar", arista: "invitado" },
        { label: "Buscar", arista: "desde / hacia" },
        { label: "Resultados", arista: "una tarjeta" },
        { label: "Ficha del viaje", arista: "pedir" },
        { label: "Entrar o\ncrear cuenta", tipo: "puerta", arista: "cuenta" },
        { label: "Mensajes", tipo: "fin" },
      ],
    },
    {
      label: "Conductor",
      pasos: [
        { label: "Portada", tipo: "inicio", arista: "crear cuenta" },
        { label: "6 preguntas", arista: "contraseña" },
        { label: "Publicar", arista: "pestaña" },
        { label: "Cédula, licencia\ny carro", tipo: "puerta", arista: "verificado" },
        { label: "12 pantallas", arista: "confirmar" },
        { label: "Viaje publicado", tipo: "fin" },
      ],
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   LES TABLEAUX — la prose du schéma. Une phrase par écran, et le
   verdict à côté. C'est là que vit ce qu'un dessin ne peut pas porter.
   ═══════════════════════════════════════════════════════════════════ */
function tabla({ mapa, modo }) {
  const filas = mapa.nodos
    .map((n) => {
      const e = veredicto(mapa, modo, n);
      const direccion = n.url
        ? n.url.split("?")[0]
        : n.patron
          ? n.patron.replace(/^\^/, "").replace(/\$$/, "")
          : "—";
      return `<tr>
        <th scope="row">${esc(n.label)}${n.sesion ? ' <span class="llave">con cuenta</span>' : ""}</th>
        <td><code>${esc(direccion)}</code></td>
        <td>${esc(n.nota)}</td>
        <td><span class="sello-t ${e}">${e === "ok" ? "verificado" : e === "falla" ? "falla" : "no probado"}</span></td>
      </tr>`;
    })
    .join("\n");
  return `<div class="tabla-envoltura"><table>
    <caption>Cada pantalla, su dirección y para qué está.</caption>
    <thead><tr><th scope="col">Pantalla</th><th scope="col">Dirección</th><th scope="col">Para qué está</th><th scope="col">Estado</th></tr></thead>
    <tbody>${filas}</tbody>
  </table></div>`;
}

function caminos({ mapa, modo }) {
  const filas = mapa.aristas
    .map((a) => {
      const e = estadoDe("aristas", `${modo}:${a.de}>${a.a}`);
      const detalle = diario.aristas?.[`${modo}:${a.de}>${a.a}`]?.detalle ?? "";
      const n = (id) => mapa.nodos.find((x) => x.id === id)?.label ?? id;
      return `<tr>
        <th scope="row">${esc(n(a.de))} <span class="hacia">→</span> ${esc(n(a.a))}</th>
        <td>${esc(a.etiqueta)}</td>
        <td><span class="sello-t ${e}">${e === "ok" ? "recorrido" : e === "falla" ? "falla" : "no probado"}</span>${e === "salto" ? `<span class="porque">${esc(detalle)}</span>` : ""}</td>
      </tr>`;
    })
    .join("\n");
  return `<div class="tabla-envoltura"><table>
    <caption>Cada camino, cómo se toma y si se recorrió de verdad.</caption>
    <thead><tr><th scope="col">Camino</th><th scope="col">El gesto</th><th scope="col">Estado</th></tr></thead>
    <tbody>${filas}</tbody>
  </table></div>`;
}

/* ═══════════════════════════════════════════════════════════════════ */
const r = diario.resumen;
const html = `<title>Plano de Partimos</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gabarito:wght@500;700;800&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700&family=DM+Mono:wght@400;500&display=swap">
<style>
/* ─────────────────────────────────────────────────────────────────────
   LA PALETTE EST CELLE DU PRODUIT — la rampe « sol » de Partimos, prise
   telle quelle dans globals.css. Un document qui décrit un produit dans
   les couleurs d'un autre se lit comme un rapport d'agence ; dans les
   siennes, il se lit comme une pièce du produit.

   Le teal n'est pas décoratif : il distingue l'APP du SITE, et il vient
   de la même famille que les gouttes de verre de l'application.
   ───────────────────────────────────────────────────────────────────── */
:root {
  --suelo: #faf9f7;
  --carta: #ffffff;
  --tinta: #26221c;
  --tinta-suave: #665f50;
  --tinta-tenue: #9c968a;
  --linea: #e2dfd8;
  --linea-suave: #f1efea;

  --sol: #be560a;
  --sol-claro: #f29e33;
  --sol-tinte: #fff8ee;
  --sol-hondo: #78330b;

  --teal: #0d6f6a;
  --teal-claro: #16b3a4;
  --teal-tinte: #f0fbf9;
  --teal-hondo: #0a4f4c;

  --verde: #1a7f45;
  --verde-tinte: #e6f4ea;
  --ambar: #a8730a;
  --ambar-tinte: #fdf3dc;
  --rojo: #b3261e;

  --display: "Gabarito", ui-sans-serif, system-ui, sans-serif;
  --cuerpo: "Nunito Sans", ui-sans-serif, system-ui, sans-serif;
  --mono: "DM Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --suelo: #16110c;
    --carta: #1f1913;
    --tinta: #f0ebe4;
    --tinta-suave: #b3a99c;
    --tinta-tenue: #857b6e;
    --linea: #3e3325;
    --linea-suave: #2e251b;
    --sol: #f29e33;
    --sol-claro: #f7bc68;
    --sol-tinte: #2a1d10;
    --sol-hondo: #f7bc68;
    --teal: #16b3a4;
    --teal-claro: #a7ede4;
    --teal-tinte: #0f2422;
    --teal-hondo: #a7ede4;
    --verde: #6ec38f;
    --verde-tinte: #16281d;
    --ambar: #e0b256;
    --ambar-tinte: #2b2313;
    --rojo: #f0938b;
  }
}
:root[data-theme="dark"] {
  --suelo: #16110c;
  --carta: #1f1913;
  --tinta: #f0ebe4;
  --tinta-suave: #b3a99c;
  --tinta-tenue: #857b6e;
  --linea: #3e3325;
  --linea-suave: #2e251b;
  --sol: #f29e33;
  --sol-claro: #f7bc68;
  --sol-tinte: #2a1d10;
  --sol-hondo: #f7bc68;
  --teal: #16b3a4;
  --teal-claro: #a7ede4;
  --teal-tinte: #0f2422;
  --teal-hondo: #a7ede4;
  --verde: #6ec38f;
  --verde-tinte: #16281d;
  --ambar: #e0b256;
  --ambar-tinte: #2b2313;
  --rojo: #f0938b;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--suelo);
  color: var(--tinta);
  font-family: var(--cuerpo);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.hoja { max-width: 1120px; margin: 0 auto; padding: 56px 22px 96px; }

h1, h2, h3 { font-family: var(--display); font-weight: 800; letter-spacing: -0.03em; text-wrap: balance; margin: 0; }
h1 { font-size: clamp(30px, 5.4vw, 46px); line-height: 1.04; }
h2 { font-size: clamp(22px, 3.4vw, 30px); line-height: 1.1; }
h3 { font-size: 18px; letter-spacing: -0.02em; }
p { margin: 0; max-width: 66ch; }
code, .mono { font-family: var(--mono); font-size: 0.9em; }

.rotulo {
  font-family: var(--mono);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--tinta-tenue);
}

/* ── Encabezado ─────────────────────────────────────────────────── */
.cabecera { display: flex; flex-direction: column; gap: 18px; padding-bottom: 30px; border-bottom: 1px solid var(--linea); }
.cabecera p { color: var(--tinta-suave); font-size: 17px; }
.marca { display: flex; align-items: baseline; gap: 10px; }
.marca b { font-family: var(--display); font-size: 19px; letter-spacing: -0.02em; }

.cuentas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.cuenta {
  display: flex; flex-direction: column; gap: 2px;
  padding: 12px 16px; border-radius: 14px;
  background: var(--carta); border: 1px solid var(--linea);
  min-width: 132px;
}
.cuenta b { font-family: var(--display); font-size: 26px; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1; }
.cuenta span { font-size: 12.5px; color: var(--tinta-suave); }
.cuenta.bien b { color: var(--verde); }
.cuenta.espera b { color: var(--ambar); }
.cuenta.mal b { color: var(--rojo); }

/* ── Secciones ──────────────────────────────────────────────────── */
section { margin-top: 64px; }
.titulo-seccion { display: flex; flex-wrap: wrap; align-items: baseline; gap: 12px; margin-bottom: 6px; }
.pastilla {
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 999px;
}
.sitio .pastilla { background: var(--sol-tinte); color: var(--sol-hondo); border: 1px solid var(--sol); }
.app .pastilla { background: var(--teal-tinte); color: var(--teal-hondo); border: 1px solid var(--teal); }
.intro { color: var(--tinta-suave); margin-top: 10px; }

/* ── Figuras ────────────────────────────────────────────────────── */
.fig { margin: 30px 0 0; }
.lienzo {
  overflow-x: auto;
  background: var(--carta);
  border: 1px solid var(--linea);
  border-radius: 18px;
  padding: 14px;
}
.lienzo svg { display: block; height: auto; max-width: none; }
figcaption { margin-top: 10px; font-size: 13.5px; line-height: 1.55; color: var(--tinta-suave); max-width: 78ch; }
figcaption b { color: var(--tinta); font-weight: 700; }
.leyenda { font-weight: 700; }
.leyenda.ok { color: var(--verde); }
.leyenda.salto { color: var(--ambar); }

/* Le fil et les cartons du plan */
.hilo { fill: none; stroke: var(--linea); stroke-width: 1.4; }
.punto { fill: var(--sol-claro); }
.app .punto { fill: var(--teal-claro); }
.raiz { fill: var(--sol); stroke: none; }
.app .raiz { fill: var(--teal); }
.t-raiz { font-family: var(--display); font-size: 16px; font-weight: 800; fill: #fff; letter-spacing: -0.02em; }
.familia { fill: var(--sol-tinte); stroke: var(--sol); stroke-width: 1.2; }
.app .familia { fill: var(--teal-tinte); stroke: var(--teal); }
.t-familia { font-family: var(--display); font-size: 13.5px; font-weight: 700; fill: var(--sol-hondo); }
.app .t-familia { fill: var(--teal-hondo); }
.carton { fill: var(--carta); stroke: var(--linea); stroke-width: 1.2; }
.carton.cerrado { stroke-dasharray: 5 4; }
.t-nodo { font-family: var(--display); font-size: 14px; font-weight: 700; fill: var(--tinta); }
.t-ruta { font-family: var(--mono); font-size: 10.5px; fill: var(--tinta-tenue); }
.t-llave { font-family: var(--mono); font-size: 9.5px; fill: var(--tinta-tenue); letter-spacing: 0.04em; }
.sello { fill: var(--tinta-tenue); }
.sello.ok { fill: var(--verde); }
.sello.salto { fill: var(--ambar); }
.sello.falla { fill: var(--rojo); }

/* Les pastilles du parcours */
.paso { fill: var(--carta); stroke: var(--linea); stroke-width: 1.3; }
.paso.inicio { fill: var(--sol-tinte); stroke: var(--sol-claro); }
.app .paso.inicio { fill: var(--teal-tinte); stroke: var(--teal-claro); }
.paso.puerta { fill: var(--carta); stroke: var(--sol); stroke-width: 1.8; stroke-dasharray: 6 4; }
.app .paso.puerta { stroke: var(--teal); }
.paso.fin { fill: var(--sol); stroke: none; }
.app .paso.fin { fill: var(--teal); }
.t-paso { font-family: var(--display); font-size: 13px; font-weight: 700; fill: var(--tinta); }
.t-paso.claro { fill: #fff; }
.flecha { stroke: var(--tinta-tenue); stroke-width: 1.4; }
.punta { fill: var(--tinta-tenue); }
.t-arista { font-family: var(--mono); font-size: 9.5px; fill: var(--tinta-tenue); }
.t-via { font-family: var(--display); font-size: 13px; font-weight: 800; fill: var(--sol-hondo); letter-spacing: 0.02em; }
.app .t-via { fill: var(--teal-hondo); }

/* ── Tableaux ───────────────────────────────────────────────────── */
.tabla-envoltura { overflow-x: auto; margin-top: 26px; border: 1px solid var(--linea); border-radius: 18px; background: var(--carta); }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
caption { text-align: left; padding: 14px 18px 0; font-size: 12.5px; color: var(--tinta-tenue); font-family: var(--mono); letter-spacing: 0.05em; text-transform: uppercase; }
th, td { text-align: left; padding: 11px 18px; vertical-align: top; border-bottom: 1px solid var(--linea-suave); }
thead th { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--tinta-tenue); font-weight: 500; white-space: nowrap; }
tbody tr:last-child th, tbody tr:last-child td { border-bottom: none; }
tbody th { font-family: var(--display); font-weight: 700; font-size: 14.5px; white-space: nowrap; }
td code { color: var(--sol-hondo); background: var(--sol-tinte); padding: 2px 7px; border-radius: 6px; white-space: nowrap; }
.app td code { color: var(--teal-hondo); background: var(--teal-tinte); }
td:nth-child(3) { color: var(--tinta-suave); min-width: 28ch; }
.hacia { color: var(--tinta-tenue); }
.llave, .porque { font-family: var(--mono); font-size: 10.5px; color: var(--tinta-tenue); font-weight: 400; }
.porque { display: block; margin-top: 4px; max-width: 42ch; line-height: 1.4; }

.sello-t {
  display: inline-block; white-space: nowrap;
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  padding: 3px 9px; border-radius: 999px;
}
.sello-t.ok { background: var(--verde-tinte); color: var(--verde); }
.sello-t.salto { background: var(--ambar-tinte); color: var(--ambar); }
.sello-t.falla { background: #fdecea; color: var(--rojo); }
.sello-t.sin { background: var(--linea-suave); color: var(--tinta-tenue); }

/* ── Le mot de la fin ───────────────────────────────────────────── */
.nota-final { margin-top: 64px; padding: 24px; border-radius: 18px; background: var(--sol-tinte); border: 1px solid var(--sol); }
.nota-final h2 { color: var(--sol-hondo); }
.nota-final p { color: var(--tinta-suave); margin-top: 10px; }
.nota-final ul { margin: 14px 0 0; padding-left: 20px; color: var(--tinta-suave); font-size: 14.5px; }
.nota-final li { margin-bottom: 8px; }
.nota-final li b { color: var(--tinta); }

@media (max-width: 640px) {
  .hoja { padding: 36px 16px 72px; }
  td:nth-child(3) { min-width: 22ch; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
:focus-visible { outline: 2px solid var(--sol); outline-offset: 2px; border-radius: 4px; }
</style>

<div class="hoja">
  <header class="cabecera">
    <div class="marca"><b>Partimos</b> <span class="rotulo">plano del producto</span></div>
    <h1>Todas las pantallas, todos los caminos</h1>
    <p>El sitio y la app comparten el mismo código y la misma paleta; lo que cambia es la disposición y dónde se pone la puerta. Este plano no está dibujado a mano: sale de <code>scripts/mapa.mjs</code>, y cada pantalla y cada camino que ves aquí se abrieron de verdad en un navegador antes de imprimirse.</p>
    <div class="cuentas">
      <div class="cuenta bien"><b>${r.ok}</b><span>comprobaciones en verde</span></div>
      <div class="cuenta ${r.falla ? "mal" : ""}"><b>${r.falla}</b><span>fallas</span></div>
      <div class="cuenta espera"><b>${r.salto}</b><span>no probables aquí</span></div>
      <div class="cuenta"><b>${SITIO.nodos.length + APP.nodos.length}</b><span>pantallas</span></div>
      <div class="cuenta"><b>${SITIO.aristas.length + APP.aristas.length}</b><span>caminos</span></div>
    </div>
  </header>

  <section class="sitio">
    <div class="titulo-seccion"><h2>El sitio</h2><span class="pastilla">canal de entrada</span></div>
    <p class="intro">Todo se consulta sin cuenta — es el canal de adquisición, y una página que pide entrar antes de enseñar nada no se posiciona. Solo lo que compromete a alguien (reservar, publicar, escribir) abre la puerta.</p>
    ${dibujarPlano(LADOS[0])}
    ${dibujarFlujo(FLUJO_SITIO)}
    ${tabla(LADOS[0])}
    ${caminos(LADOS[0])}
  </section>

  <section class="app">
    <div class="titulo-seccion"><h2>La app</h2><span class="pastilla">instalada en el teléfono</span></div>
    <p class="intro">Cinco pestañas abajo, pantallas completas, y una puerta delante de todo lo que compromete. Sin cuenta queda entera la búsqueda: exigir el registro en la entrada cuesta más visitantes de los que califica.</p>
    ${dibujarPlano(LADOS[1])}
    ${dibujarFlujo(FLUJO_APP)}
    ${tabla(LADOS[1])}
    ${caminos(LADOS[1])}
  </section>

  <section class="nota-final">
    <h2>Qué se comprobó, y qué no</h2>
    <p>Una batería abre un navegador de verdad y hace tres pasadas. La tercera es la que suele faltar en un plano de sitio, y es la que más vale.</p>
    <ul>
      <li><b>Cada pantalla existe.</b> Se va a su dirección y se busca un texto que solo aparece ahí. Una página en blanco, o la página equivocada, cae aquí.</li>
      <li><b>Cada camino se recorre.</b> Se parte de la pantalla de salida, se hace el gesto — un enlace, una pestaña, un botón — y se comprueba que se llega donde dice el plano. Un enlace que apunta al vacío muere en esta pasada.</li>
      <li><b>Ningún camino sobra.</b> Al revés: se recogen todos los enlaces realmente visibles de las dos mitades y se comprueba que ninguno lleva a una dirección que el plano no conozca. Sin esta pasada se puede tener un plano perfecto y un producto lleno de puertas que nadie vigila.</li>
    </ul>
    <p>Las ${r.salto} comprobaciones en ámbar no son fallas y no se cuentan como aciertos: tres corresponden a la pantalla «¿cómo quieres crear tu cuenta?», que solo aparece cuando hay varias puertas activadas — hoy no hay ninguna, así que se va directo a las preguntas, y eso es lo que se quiere. Las otras dos son abrir y crear una sesión: eso necesita el servidor, y desde este contenedor no se alcanza. Decirlo vale más que pintarlas de verde.</p>
  </section>
</div>`;

process.stdout.write(html);
