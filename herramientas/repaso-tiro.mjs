/**
 * SONDE · LE REPASO, avec un commentaire écrit.
 *
 * Traverse l'assistant jusqu'au bout, écrit un commentaire au 8ᵉ pas, puis
 * photographie l'écran de relecture — celui qu'on ne voit qu'après neuf clics.
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:8085';
mkdirSync(new URL('tiros/', import.meta.url), { recursive: true });
const tiro = (p, n) =>
  p.screenshot({ path: new URL(`tiros/${n}.png`, import.meta.url).pathname, fullPage: true });

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-proxy-server'],
});
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.on('pageerror', (e) => console.log('ERROR ' + String(e).slice(0, 200)));

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

await elegirLugar('Salgo de', process.argv[2] ?? 'Ciudad de Panamá');
await elegirLugar('Voy a', process.argv[3] ?? 'Las Tablas');
await p.waitForTimeout(1600);

const seguir = () => p.getByRole('button', { name: /Continuar/i }).first();

/* Une parada, pour que le chemin ait un point du milieu à dessiner. */
await seguir().click();
await p.waitForTimeout(1100);
await p.getByRole('button', { name: /^Añadir Coronado/ }).first().click();
await p.waitForTimeout(700);

/* Jour, heure, voiture, apport, tronçons, conditions, commentaire. */
for (let i = 0; i < 7; i++) {
  await seguir().click();
  await p.waitForTimeout(1100);
}

/* Le commentaire. */
const campo = p.getByLabel('Comentario para tus pasajeros');
await campo.fill('Salgo puntual desde Costa del Este. Llevo hielera, si quieren traigan agua.');
await p.waitForTimeout(600);
await tiro(p, 'repaso-8-comentario');

/* «Repasar y publicar» se apaga sin cédula verificada, y verificarla es un
   camino aparte. La pantalla de repaso se abre por su ruta, con los mismos
   parámetros que le pasaría el asistente. */
const params = new URLSearchParams({
  ruta: 'panama-chitre',
  salida: '2026-09-07T06:00:00-05:00',
  paradas: '0',
  puestos: '4',
  adelante: '1',
  atras: '3',
  aporte: '',
  maletas: '1',
  mascotas: '1',
  fumar: '',
  comentario: 'Salgo puntual desde Costa del Este. Llevo hielera, si quieren traigan agua.',
});
await p.goto(`${BASE}/(conductor)/repaso?${params}`, {
  waitUntil: 'networkidle',
  timeout: 40000,
});
await p.waitForTimeout(2600);
await tiro(p, 'repaso');

/* Le bas de l'écran : `fullPage` ne suit pas le ScrollView de React Native
   Web, qui a son propre conteneur de défilement. */
await p.evaluate(() => {
  for (const e of document.querySelectorAll('div')) {
    if (e.scrollHeight > e.clientHeight + 40) e.scrollTop = e.scrollHeight;
  }
});
await p.waitForTimeout(800);
await tiro(p, 'repaso-abajo');
console.log('url ::', p.url().slice(0, 120));

await b.close();
