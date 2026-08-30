/**
 * SONDA · LE CONTENU COUPÉ PAR UNE BARRE FIXE.
 *
 * Déroule chaque écran jusqu'en bas, cherche ce qui est cloué en bas
 * (barre d'onglets, pied d'action) et signale tout texte que ce plafond
 * coupe en deux. Trois écrans en souffraient le 29-08.
 */

import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const r of process.argv.slice(2)) {
  try {
    await p.goto('http://localhost:8085/' + r, { waitUntil: 'networkidle', timeout: 25000 });
    await p.waitForTimeout(1600);
    // hasta el fondo
    await p.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 30) e.scrollTop = e.scrollHeight; });
    await p.waitForTimeout(500);
    const tapados = await p.evaluate(() => {
      // el techo de lo que está clavado abajo
      let techo = Infinity;
      for (const e of document.querySelectorAll('div')) {
        const s = getComputedStyle(e);
        if (s.position !== 'fixed' && s.position !== 'absolute') continue;
        const c = e.getBoundingClientRect();
        if (c.height < 40 || c.width < 300) continue;
        if (c.bottom < innerHeight - 6 || c.top < innerHeight * 0.55) continue;
        if (/rgba\(0, 0, 0, 0\)/.test(s.backgroundColor)) continue;
        techo = Math.min(techo, c.top);
      }
      if (techo === Infinity) return [];
      const out = [];
      for (const t of document.querySelectorAll('div,span')) {
        if (t.children.length) continue;
        const txt = (t.innerText || '').trim(); if (!txt) continue;
        const c = t.getBoundingClientRect();
        if (c.width === 0) continue;
        if (c.top < techo && c.bottom > techo + 2) out.push(`«${txt.slice(0,30)}» partido por la barra`);
      }
      return [...new Set(out)];
    });
    if (tapados.length) { console.log('⚠ ' + r); tapados.slice(0,3).forEach(m => console.log('   ' + m)); }
    else console.log('· ' + r);
  } catch (e) { console.log('FALLO ' + r); }
}
await b.close();
