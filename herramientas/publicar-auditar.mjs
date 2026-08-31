/**
 * SONDE · CONTRASTE ET CIBLES **DANS** LE PARCOURS DE PUBLICATION.
 *
 * `auditar.mjs` ne voit que la première étape : les suivantes n'existent
 * qu'après des clics. Celle-ci avance jusqu'à chaque étape et y refait la
 * même mesure.
 */

import { chromium } from 'playwright-core';

const BASE = 'http://localhost:8085';
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-proxy-server'],
});
const p = await b.newPage({ viewport: { width: 390, height: 844 } });

await p.goto(`${BASE}/(conductor)/publicar`, { waitUntil: 'networkidle', timeout: 40000 });
await p.waitForTimeout(2500);

async function elegirLugar(rotulo, ciudad) {
  await p.getByLabel(rotulo, { exact: false }).first().click({ timeout: 15000 });
  await p.waitForTimeout(700);
  await p.getByPlaceholder('Escribe una ciudad').fill(ciudad);
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: new RegExp('^' + ciudad) }).first().click();
  await p.waitForTimeout(900);
}

await elegirLugar('Salgo de', 'Ciudad de Panamá');
await elegirLugar('Voy a', 'Las Tablas');
await p.waitForTimeout(1600);

const medir = () =>
  p.evaluate(() => {
    const salida = { toque: [], corte: [], contraste: [] };
    const lum = (c) =>
      c
        .match(/[\d.]+/g)
        .map(Number)
        .slice(0, 3)
        .map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        })
        .reduce((a, v, i) => a + [0.2126, 0.7152, 0.0722][i] * v, 0);
    const fondoDe = (e) => {
      let n = e;
      while (n) {
        const bg = getComputedStyle(n).backgroundColor;
        if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg;
        n = n.parentElement;
      }
      return 'rgb(255,255,255)';
    };
    for (const e of document.querySelectorAll('button,[role=button],[role=checkbox],[role=adjustable]')) {
      const r = e.getBoundingClientRect();
      if (r.width > 0 && (r.height < 44 || r.width < 44)) {
        const n = (e.getAttribute('aria-label') || e.innerText || '?').trim().replace(/\s+/g, ' ');
        if (!/Contar qué ves/.test(n)) salida.toque.push(`${n.slice(0, 34)} ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
    }
    for (const e of document.querySelectorAll('div,span')) {
      if (e.children.length) continue;
      const t = (e.innerText || '').trim();
      if (!t) continue;
      if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) salida.corte.push(t.slice(0, 40));
      const s = getComputedStyle(e);
      const px = parseFloat(s.fontSize);
      const L1 = lum(s.color);
      const L2 = lum(fondoDe(e));
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const minimo = px >= 18.66 || (px >= 14 && +s.fontWeight >= 600) ? 3 : 4.5;
      if (ratio < minimo) salida.contraste.push(`${t.slice(0, 30)} ${ratio.toFixed(2)}:1 (${px}px)`);
    }
    return salida;
  });

const PASOS = ['ruta', 'paradas', 'dia', 'hora', 'carro', 'aporte', 'tramos', 'condiciones', 'comentario'];
for (const nombre of PASOS) {
  const f = await medir();
  const partes = [];
  if (f.toque.length) partes.push('  toque<44: ' + [...new Set(f.toque)].slice(0, 6).join(' | '));
  if (f.corte.length) partes.push('  cortado: ' + [...new Set(f.corte)].slice(0, 5).join(' | '));
  if (f.contraste.length) partes.push('  contraste: ' + [...new Set(f.contraste)].slice(0, 6).join(' | '));
  console.log((partes.length ? '⚠ ' : '· ') + nombre);
  partes.forEach((x) => console.log(x));

  const seguir = p.getByRole('button', { name: /Continuar/i }).first();
  if (!(await seguir.count())) break;
  await seguir.click();
  await p.waitForTimeout(1200);
}

await b.close();
