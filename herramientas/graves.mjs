/**
 * SONDA · LE TEXTE QUASI INVISIBLE (moins de 2:1).
 *
 * C'est celle qui a trouvé les six titres blancs sur fond clair du 29-08.
 * Un rapport sous 2 n'est jamais un choix de design : c'est du texte de la
 * couleur de son fond.
 */

import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const r of process.argv.slice(2)) {
  try {
    await p.goto('http://localhost:8085/' + r, { waitUntil: 'networkidle', timeout: 25000 });
    await p.waitForTimeout(1500);
    const malos = await p.evaluate(() => {
      const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number).slice(0,3)
        .map(v => { v/=255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); });
        return .2126*m[0] + .7152*m[1] + .0722*m[2]; };
      const fondoDe = (e) => { let n = e; while (n) { const bg = getComputedStyle(n).backgroundColor;
        if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg; n = n.parentElement; } return 'rgb(255,255,255)'; };
      const out = [];
      for (const e of document.querySelectorAll('div,span')) {
        if (e.children.length) continue;
        const t = (e.innerText||'').trim(); if (!t) continue;
        const s = getComputedStyle(e);
        const L1 = lum(s.color), L2 = lum(fondoDe(e));
        const ratio = (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
        // < 2 : el texto es prácticamente del color de su fondo
        if (ratio < 2) out.push(`${ratio.toFixed(2)}:1  «${t.slice(0,42)}»  ${s.color} / ${fondoDe(e)}  ${s.fontSize}`);
      }
      return [...new Set(out)];
    });
    if (malos.length) { console.log('⚠ ' + r); malos.slice(0,8).forEach(m => console.log('   ' + m)); }
  } catch (e) { console.log('FALLO ' + r); }
}
await b.close();
