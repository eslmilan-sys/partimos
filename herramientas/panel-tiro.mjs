/**
 * SONDE · le panneau du conducteur et le profil, en entier.
 *
 * Les deux pages défilent dans un ScrollView interne de RN-Web : `fullPage`
 * ne le suit pas, donc on pousse `scrollTop` à la main et on photographie
 * fenêtre par fenêtre.
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:8085';
mkdirSync(new URL('tiros/', import.meta.url), { recursive: true });

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-proxy-server'],
});
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.on('pageerror', (e) => console.log('ERROR ' + String(e).slice(0, 300)));

/** Le conteneur qui défile vraiment. */
const desplazar = (y) =>
  p.evaluate((y) => {
    const todos = [...document.querySelectorAll('div')].filter(
      (d) => d.scrollHeight > d.clientHeight + 30 && d.clientHeight > 300,
    );
    const c = todos[0];
    if (c) c.scrollTop = y;
    return c ? { alto: c.scrollHeight, visible: c.clientHeight } : null;
  }, y);

for (const [ruta, nombre] of [
  ['/(conductor)/panel', 'panel'],
  ['/(cuenta)/cuenta', 'perfil'],
]) {
  await p.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle', timeout: 45000 });
  await p.waitForTimeout(2600);

  const medida = await desplazar(0);
  console.log(nombre, JSON.stringify(medida));
  await p.waitForTimeout(400);
  await p.screenshot({ path: new URL(`tiros/${nombre}-1.png`, import.meta.url).pathname });

  const alto = medida?.alto ?? 0;
  const visible = medida?.visible ?? 844;
  let i = 2;
  for (let y = visible - 90; y < alto; y += visible - 90) {
    await desplazar(y);
    await p.waitForTimeout(450);
    await p.screenshot({ path: new URL(`tiros/${nombre}-${i}.png`, import.meta.url).pathname });
    i += 1;
    if (i > 6) break;
  }
}

await b.close();
console.log('listo');
