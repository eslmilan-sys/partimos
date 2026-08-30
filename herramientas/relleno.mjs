/**
 * SONDA · LES CARTES SANS PADDING.
 *
 * Pour chaque carte blanche à coins arrondis, l'écart entre son bord et le
 * texte le plus à gauche qu'elle contient. Sous 7 px, la carte n'a pas de
 * padding — c'était le cas de « Lo que tiene tu carro ».
 *
 * Faux positif connu : quand c'est le TEXTE qui porte son propre padding, sa
 * boîte fait toute la largeur et la sonde crie pour rien. Regarder l'écran.
 */

import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const r of process.argv.slice(2)) {
  try {
    await p.goto('http://localhost:8085/' + r, { waitUntil: 'networkidle', timeout: 25000 });
    await p.waitForTimeout(1500);
    const malas = await p.evaluate(() => {
      const out = [];
      for (const c of document.querySelectorAll('div')) {
        const s = getComputedStyle(c);
        if (!/rgb\(255, 255, 255\)/.test(s.backgroundColor)) continue;
        if (parseFloat(s.borderTopLeftRadius) < 12) continue;
        const caja = c.getBoundingClientRect();
        if (caja.width < 200 || caja.height < 50) continue;
        // el texto más a la izquierda de dentro
        let min = Infinity, cual = '';
        for (const t of c.querySelectorAll('div,span')) {
          if (t.children.length) continue;
          const txt = (t.innerText || '').trim(); if (!txt) continue;
          const rt = t.getBoundingClientRect();
          if (rt.width === 0) continue;
          if (rt.x < min) { min = rt.x; cual = txt.slice(0, 26); }
        }
        if (min < Infinity && min - caja.x < 7) out.push(`«${cual}» a ${Math.round(min - caja.x)} px del borde`);
      }
      return [...new Set(out)];
    });
    if (malas.length) { console.log('⚠ ' + r); malas.slice(0,4).forEach(m => console.log('   ' + m)); }
  } catch (e) { console.log('FALLO ' + r); }
}
await b.close();
