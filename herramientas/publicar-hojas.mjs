/**
 * SONDE · LES DEUX FEUILLES DU PARCOURS DE PUBLICATION.
 *
 * Ouvre le sélecteur d'heure et joue avec les sièges de la voiture : ni l'un
 * ni l'autre n'apparaît sur une capture de l'écran au repos.
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

await elegirLugar('Salgo de', 'Ciudad de Panamá');
await elegirLugar('Voy a', 'Las Tablas');
await p.waitForTimeout(1600);

const seguir = () => p.getByRole('button', { name: /Continuar/i }).first();
const avanzar = async (n = 1) => {
  for (let i = 0; i < n; i++) {
    await seguir().click();
    await p.waitForTimeout(1100);
  }
};

/* Paso 4 : l'heure. */
await avanzar(3);
await p.getByLabel(/^Hora:/).first().click();
await p.waitForTimeout(900);
await tiro(p, 'hoja-hora');
await p.getByLabel('Las 07 de la mañana').click();
await p.waitForTimeout(300);
await p.getByLabel('Y 30 minutos').click();
await p.waitForTimeout(300);
await tiro(p, 'hoja-hora-elegida');
await p.getByRole('button', { name: /^Salgo a las/ }).click();
await p.waitForTimeout(900);
await tiro(p, 'hora-puesta');

/* Paso 5 : les sièges, en enlevant deux places. */
await avanzar(1);
await p.getByLabel(/Puesto 3 de atrás/).click();
await p.waitForTimeout(500);
await p.getByLabel(/Puesto de adelante/).click();
await p.waitForTimeout(700);
await tiro(p, 'carro-dos-puestos');

await b.close();
