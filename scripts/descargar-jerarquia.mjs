#!/usr/bin/env node
/**
 * QUI EST DANS QUOI — la hiérarchie administrative, par la géométrie.
 *
 * POURQUOI. Au Panama, 79 des 82 districts d'OSM ne portent aucune
 * étiquette `is_in` : impossible de rattacher un district à sa province
 * par le nom. Mais OSM le sait quand même — par les polygones. Overpass
 * répond à « quelles relations admin_level=6 tombent dans cette aire ? »,
 * et ça, c'est une donnée cartographiée, pas une supposition.
 *
 * CE QUE ÇA PRODUIT. `datos-osm/padres_6.json.gz` (district → province ou
 * comarca) et `datos-osm/padres_8.json.gz` (corregimiento → district, ou
 * comarca à défaut — deux comarcas n'ont pas de districts). Les clés et
 * valeurs sont des ids OSM « type/id », les mêmes que `source_id`.
 *
 * Lit `datos-osm/admin_4.json.gz` et `admin_6.json.gz` produits par
 * `descargar-lugares.mjs` : le lancer d'abord.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

const ESPEJOS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const AGENTE = 'Partimos/1.0 (jerarquia administrativa; contacto: hola@partimos.app)';

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function conReintentos(hacer, cuantos = 6) {
  for (let i = 0; ; i++) {
    try {
      return await hacer(i);
    } catch (e) {
      if (i >= cuantos) throw e;
      const espera = 2 ** i * 5000;
      console.warn(`  reintento en ${espera / 1000}s — ${e.message}`);
      await dormir(espera);
    }
  }
}

/** Les ids des relations admin_level=N contenues dans l'aire de la relation `rel`. */
async function hijosDe(rel, nivel) {
  const consulta = `
    [out:json][timeout:180];
    area(id:${3600000000 + rel})->.a;
    relation["boundary"="administrative"]["admin_level"="${nivel}"](area.a);
    out ids;
  `;
  return conReintentos(async (intento) => {
    const r = await fetch(ESPEJOS[intento % ESPEJOS.length], {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'User-Agent': AGENTE },
      body: consulta,
      signal: AbortSignal.timeout(240_000),
    });
    if (!r.ok) throw new Error(`overpass ${r.status}`);
    const j = await r.json();
    return (j.elements ?? []).map((e) => e.id);
  });
}

const leer = (n) => JSON.parse(gunzipSync(readFileSync(`datos-osm/${n}.json.gz`)));
const guardar = (n, c) => writeFileSync(`datos-osm/${n}.json.gz`, gzipSync(JSON.stringify(c)));

const nivel4 = leer('admin_4').elements.filter((e) => e.tags?.name);
const nivel6 = leer('admin_6').elements.filter((e) => e.tags?.name);

// La même règle que l'import : une comarca se reconnaît à ses étiquettes.
const esComarca = (e) =>
  /comarca/i.test(
    [e.tags.name, e.tags['border_type'], e.tags['alt_name'], e.tags['official_name']]
      .filter(Boolean)
      .join(' '),
  );

// District → province ou comarca. Le premier contenant trouvé gagne ; un
// district dans deux aires de niveau 4 serait une erreur de carte, pas de code.
const padres6 = {};
for (const p of nivel4) {
  process.stdout.write(`nivel 6 en ${p.tags.name} … `);
  const hijos = await hijosDe(p.id, 6);
  console.log(`${hijos.length}`);
  for (const h of hijos) padres6[`relation/${h}`] ??= `relation/${p.id}`;
  await dormir(3000);
}
guardar('padres_6', padres6);
console.log(`${Object.keys(padres6).length} distritos situados.\n`);

// Corregimiento → district d'abord ; comarca à défaut, pour les deux
// comarcas qui n'ont pas de districts (Madungandí, Wargandí).
const padres8 = {};
for (const d of nivel6) {
  process.stdout.write(`nivel 8 en ${d.tags.name} … `);
  const hijos = await hijosDe(d.id, 8);
  console.log(`${hijos.length}`);
  for (const h of hijos) padres8[`relation/${h}`] ??= `relation/${d.id}`;
  await dormir(3000);
}
for (const c of nivel4.filter(esComarca)) {
  process.stdout.write(`nivel 8 en ${c.tags.name} (comarca) … `);
  const hijos = await hijosDe(c.id, 8);
  console.log(`${hijos.length}`);
  for (const h of hijos) padres8[`relation/${h}`] ??= `relation/${c.id}`;
  await dormir(3000);
}
guardar('padres_8', padres8);
console.log(`${Object.keys(padres8).length} corregimientos situados.`);
