/**
 * SONDA · CONTRASTE, CIBLES ET TRONCATURE.
 *
 * Pour chaque écran : le contraste RÉEL de chaque texte (la couleur du fond
 * est cherchée en remontant les parents, pas prise dans le token), les cibles
 * sous 44 px, et les textes coupés par leur boîte.
 *
 * Les fonds en `rgba` ne sont pas composés : une pastille teintée peut
 * ressortir en faux positif. Vérifier avec `graves.mjs`, qui ne garde que ce
 * qui est vraiment illisible, et à la main pour ces cas-là.
 */

import { chromium } from 'playwright-core';
const RUTAS = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const r of RUTAS) {
  try {
    await p.goto('http://localhost:8085/' + r, { waitUntil: 'networkidle', timeout: 25000 });
    await p.waitForTimeout(1600);
    const f = await p.evaluate(() => {
      const salida = { toque: [], corte: [], contraste: [], solape: [] };
      const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number).slice(0,3)
        .map(v => { v/=255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); });
        return .2126*m[0] + .7152*m[1] + .0722*m[2]; };
      /* Les fonds translucides sont COMPOSÉS sur ce qu'il y a derrière.
         Sans ça, une pastille en `rgba(10,39,49,.06)` — un lavis d'encre à
         6 % qui rend un blanc cassé — était lue comme un fond presque noir,
         et chaque texte posé dessus ressortait en faux positif. C'est la
         limite que le README annonçait ; elle n'a plus lieu d'être. */
      const enRGBA = (c) => { const m = (c || '').match(/[\d.]+/g); return m ? m.map(Number) : null; };
      const fondoDe = (e) => {
        const capas = [];
        let n = e;
        while (n) {
          const v = enRGBA(getComputedStyle(n).backgroundColor);
          if (v) { const a = v.length > 3 ? v[3] : 1; if (a > 0) { capas.push([v[0], v[1], v[2], a]); if (a >= 1) break; } }
          n = n.parentElement;
        }
        // Du fond vers l'avant : chaque couche se pose sur le résultat précédent.
        let [r, g, b] = [255, 255, 255];
        for (const [cr, cg, cb, ca] of capas.reverse()) {
          r = cr * ca + r * (1 - ca); g = cg * ca + g * (1 - ca); b = cb * ca + b * (1 - ca);
        }
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
      };
      for (const e of document.querySelectorAll('button,[role=button]')) {
        const b = e.getBoundingClientRect();
        if (b.width > 0 && (b.height < 44 || b.width < 44)) {
          const n = (e.getAttribute('aria-label') || e.innerText || '?').trim().replace(/\s+/g,' ').slice(0,38);
          if (!/Contar qué ves/.test(n)) salida.toque.push(`${n} ${Math.round(b.width)}×${Math.round(b.height)}`);
        }
      }
      for (const e of document.querySelectorAll('div,span')) {
        if (e.children.length) continue;
        const t = (e.innerText||'').trim(); if (!t) continue;
        if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) salida.corte.push(t.slice(0,40));
        const s = getComputedStyle(e);
        const px = parseFloat(s.fontSize);
        const L1 = lum(s.color), L2 = lum(fondoDe(e));
        const ratio = (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
        const minimo = (px >= 18.66 || (px >= 14 && +s.fontWeight >= 600)) ? 3 : 4.5;
        if (ratio < minimo) salida.contraste.push(`${t.slice(0,34)} ${ratio.toFixed(2)}:1 (${px}px, min ${minimo})`);
      }
      return salida;
    });
    const partes = [];
    if (f.toque.length) partes.push('  toque<44: ' + [...new Set(f.toque)].slice(0,6).join(' | '));
    if (f.corte.length) partes.push('  cortado: ' + [...new Set(f.corte)].slice(0,5).join(' | '));
    if (f.contraste.length) partes.push('  contraste: ' + [...new Set(f.contraste)].slice(0,6).join(' | '));
    console.log((partes.length ? '⚠ ' : '· ') + r);
    partes.forEach(x => console.log(x));
  } catch (e) { console.log('FALLO ' + r + ' :: ' + String(e).split('\n')[0].slice(0,90)); }
}
await b.close();
