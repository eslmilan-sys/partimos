/**
 * SONDA · CAPTURES + DÉFAUTS DE BASE.
 *
 * Prend une capture pleine hauteur de chaque écran dans `tiros/` et signale
 * au passage les `button` dans un `button` (interdit en HTML, et le bouton
 * intérieur cesse de répondre selon le navigateur), le débordement
 * horizontal et les cibles trop petites.
 *
 * Le bouton de test « Cuéntame » est masqué avant la capture : il se pose à
 * mi-hauteur du bord droit et cachait le contenu qu'on venait regarder.
 */

import { mkdirSync } from 'node:fs';

import { chromium } from 'playwright-core';

mkdirSync('tiros', { recursive: true });
const RUTAS = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const problemas = [];
p.on('console', m => { const t = m.text(); if (m.type()==='error' && !t.includes('ERR_CERT')) problemas.push('CONSOLA: '+t.slice(0,140)); });
for (const r of RUTAS) {
  const nombre = r.replace(/[()\/]/g,'_').replace(/^_+/,'') || 'raiz';
  try {
    await p.goto('http://localhost:8085/' + r, { waitUntil: 'networkidle', timeout: 25000 });
    await p.waitForTimeout(1800);
    // El botón de pruebas «Cuéntame» tapa contenido a media altura; fuera
    // para poder mirar la pantalla de verdad. Se sube por los padres SÓLO
    // mientras el nodo siga siendo pequeño: subir un número fijo de niveles
    // llegaba a la raíz de la app y dejaba la captura en blanco.
    await p.evaluate(() => {
      for (const e of document.querySelectorAll('[aria-label*="Contar qué ves"]')) {
        let n = e;
        while (n.parentElement) {
          const r = n.parentElement.getBoundingClientRect();
          if (r.width > 260 || r.height > 260) break;
          n = n.parentElement;
        }
        n.style.display = 'none';
      }
    });
    const info = await p.evaluate(() => ({
      anidados: document.querySelectorAll('button button').length,
      desbordeX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      alto: document.documentElement.scrollHeight,
      // toques por debajo de 44 px
      chicos: [...document.querySelectorAll('button,[role=button]')]
        .map(e => ({ n: (e.getAttribute('aria-label')||e.innerText||'').trim().slice(0,40), r: e.getBoundingClientRect() }))
        .filter(x => x.r.width > 0 && (x.r.height < 40 || x.r.width < 28))
        .map(x => `${x.n} (${Math.round(x.r.width)}×${Math.round(x.r.height)})`),
    }));
    if (info.anidados) problemas.push(`${r}: ${info.anidados} botones anidados`);
    if (info.desbordeX) problemas.push(`${r}: DESBORDE horizontal`);
    if (info.chicos.length) problemas.push(`${r}: toques chicos → ${info.chicos.slice(0,4).join(' | ')}`);
    await p.screenshot({ path: `tiros/${nombre}.png`, fullPage: true });
    console.log('ok  ' + r + '  alto=' + info.alto);
  } catch (e) { console.log('FALLO ' + r + ' :: ' + String(e).split('\n')[0].slice(0,120)); }
}
await b.close();
console.log('\n──── PROBLEMAS ────');
problemas.forEach(x => console.log(' • ' + x));
