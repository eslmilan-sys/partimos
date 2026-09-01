/**
 * SONDE · les quatre demandes du 01-09-2026 sur `publicar` :
 * les exemples en gris, «4 puestos» et pas 5, la van de sept places,
 * et trois arrêts au lieu de deux.
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
p.on('pageerror', (e) => console.log('ERROR ' + String(e).slice(0, 300)));

await p.goto(`${BASE}/(conductor)/publicar`, { waitUntil: 'networkidle', timeout: 45000 });
await p.waitForTimeout(2600);
await tiro(p, 'n1-ruta-vacia');

async function elegirLugar(rotulo, ciudad) {
  await p.getByLabel(rotulo, { exact: false }).first().click({ timeout: 15000 });
  await p.waitForTimeout(700);
  await p.getByPlaceholder('Escribe una ciudad o un sitio').fill(ciudad);
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: new RegExp('^' + ciudad) }).first().click();
  await p.waitForTimeout(900);
}
await elegirLugar('Salgo de', 'Ciudad de Panamá');
await elegirLugar('Voy a', 'David');
await p.waitForTimeout(1800);

const seguir = () => p.getByRole('button', { name: /Continuar/i }).first();

// Paso 2 : les arrêts.
await seguir().click();
await p.waitForTimeout(1300);
await tiro(p, 'n2-paradas');
for (const nombre of [/^Añadir /]) {
  for (let i = 0; i < 3; i++) {
    const chip = p.getByRole('button', { name: nombre }).first();
    if (await chip.count()) { await chip.click(); await p.waitForTimeout(600); }
  }
}
await tiro(p, 'n3-paradas-llenas');

// Jour, heure, puis la voiture.
for (let i = 0; i < 3; i++) { await seguir().click(); await p.waitForTimeout(1200); }
console.log(await p.getByText(/Paso \d de \d/).first().innerText());
await tiro(p, 'n4-carro');

// Choisir la van de sept places.
const elegir = p.getByRole('button', { name: /Elegir con qué carro voy/i }).first();
if (await elegir.count()) {
  await elegir.click();
  await p.waitForTimeout(900);
  await tiro(p, 'n5-elegir-carro');
  await p.getByRole('radio', { name: /Toyota Rush/i }).first().click();
  await p.waitForTimeout(1400);
}
await tiro(p, 'n6-carro-siete');

await b.close();
