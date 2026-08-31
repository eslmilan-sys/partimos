/**
 * SONDE · LE PARCOURS DE PUBLICATION, ÉTAPE PAR ÉTAPE.
 *
 * Remplit les deux champs de route puis avance pas à pas, en photographiant
 * chaque écran dans `tiros/`. Sert à voir ce qu'aucun `tsc` ne voit : la
 * voiture 2D, la règle du prix, la grille des heures.
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:8085';
mkdirSync(new URL('tiros/', import.meta.url), { recursive: true });
const tiro = (p, n) => p.screenshot({ path: new URL(`tiros/${n}.png`, import.meta.url).pathname });

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-proxy-server'],
});
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLA ' + m.text().slice(0, 160));
});
p.on('pageerror', (e) => console.log('ERROR ' + String(e).slice(0, 200)));

await p.goto(`${BASE}/(conductor)/publicar`, { waitUntil: 'networkidle', timeout: 40000 });
await p.waitForTimeout(2500);

/** Remplit un des deux champs de lieu par la liste de suggestions. */
async function elegirLugar(rotulo, ciudad) {
  await p.getByLabel(rotulo, { exact: false }).first().click({ timeout: 15000 });
  await p.waitForTimeout(700);
  /* Le champ de recherche du panneau, pas le titre de l'écran : chercher par
     texte attrapait « Paso 1 de 8 · Ciudad de Panamá → Chitré ». */
  await p.getByPlaceholder('Escribe una ciudad').fill(ciudad);
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: new RegExp('^' + ciudad) }).first().click();
  await p.waitForTimeout(900);
}

await elegirLugar('Salgo de', process.argv[2] ?? 'Ciudad de Panamá');
await elegirLugar('Voy a', process.argv[3] ?? 'Las Tablas');
await p.waitForTimeout(1800);
await tiro(p, '1-ruta');

const PASOS = ['2-paradas', '3-dia', '4-hora', '5-carro', '6-aporte', '7-tramos', '8-condiciones'];
for (const nombre of PASOS) {
  const seguir = p.getByRole('button', { name: /Continuar/i }).first();
  if (!(await seguir.count())) break;
  await seguir.click();
  await p.waitForTimeout(1300);
  await tiro(p, nombre);
  const rotulo = await p
    .locator('text=/Paso \\d+ de \\d+/')
    .first()
    .textContent()
    .catch(() => null);
  console.log(`${nombre} :: ${rotulo ?? '—'}`);
}

await b.close();
