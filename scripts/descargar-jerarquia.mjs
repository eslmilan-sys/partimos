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
 * REPRENABLE EXPRÈS. Une centaine de requêtes, et Overpass finit par
 * jeter l'IP qui insiste (vu deux fois : les miroirs tombent ensemble
 * vers la 60e). Donc : la progression s'écrit après CHAQUE aire dans
 * `jerarquia_estado.json.gz`, une aire qui échoue est notée et on passe
 * à la suivante, et au prochain lancement on ne refait que ce qui manque.
 * Le workflow publie même un résultat partiel ; relancer suffit.
 *
 * Lit `datos-osm/admin_4.json.gz` et `admin_6.json.gz` produits par
 * `descargar-lugares.mjs` : le lancer d'abord.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

const ESPEJOS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const AGENTE = 'Partimos/1.0 (jerarquia administrativa; contacto: hola@partimos.app)';

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function conReintentos(hacer, cuantos = 5) {
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

const ruta = (n) => `datos-osm/${n}.json.gz`;
const leer = (n) => JSON.parse(gunzipSync(readFileSync(ruta(n))));
const leerOpc = (n, defecto) => (existsSync(ruta(n)) ? leer(n) : defecto);
const guardar = (n, c) => writeFileSync(ruta(n), gzipSync(JSON.stringify(c)));

const nivel4 = leer('admin_4').elements.filter((e) => e.tags?.name);
const nivel6 = leer('admin_6').elements.filter((e) => e.tags?.name);

// La même règle que l'import : une comarca se reconnaît à ses étiquettes.
const esComarca = (e) =>
  /comarca/i.test(
    [e.tags.name, e.tags['border_type'], e.tags['alt_name'], e.tags['official_name']]
      .filter(Boolean)
      .join(' '),
  );

// Ce qui a déjà été fait lors d'un lancement précédent.
const estado = leerOpc('jerarquia_estado', { hechas: [] });
const hechas = new Set(estado.hechas);
const padres6 = leerOpc('padres_6', {});
const padres8 = leerOpc('padres_8', {});
let fallos = 0;

/** Interroge chaque aire pas encore faite ; note la progression à chaque pas. */
async function recorrer(areas, nivelHijos, padres, archivo) {
  for (const a of areas) {
    const marca = `${a.id}>${nivelHijos}`;
    if (hechas.has(marca)) continue;
    process.stdout.write(`nivel ${nivelHijos} en ${a.tags.name} … `);
    try {
      const hijos = await hijosDe(a.id, nivelHijos);
      console.log(`${hijos.length}`);
      for (const h of hijos) padres[`relation/${h}`] ??= `relation/${a.id}`;
      hechas.add(marca);
      guardar(archivo, padres);
      guardar('jerarquia_estado', { hechas: [...hechas] });
    } catch (e) {
      // Une aire qui échoue n'arrête pas les autres : elle reste à faire
      // et le prochain lancement ne reprendra qu'elle.
      console.warn(`FALLO — ${e.message}`);
      fallos++;
    }
    await dormir(4000);
  }
}

// District → province ou comarca. Le premier contenant trouvé gagne ; un
// district dans deux aires de niveau 4 serait une erreur de carte, pas de code.
await recorrer(nivel4, 6, padres6, 'padres_6');
console.log(`${Object.keys(padres6).length} distritos situados.\n`);

// Corregimiento → district d'abord ; comarca à défaut, pour les deux
// comarcas qui n'ont pas de districts (Madungandí, Wargandí).
await recorrer(nivel6, 8, padres8, 'padres_8');
await recorrer(nivel4.filter(esComarca), 8, padres8, 'padres_8');
console.log(`${Object.keys(padres8).length} corregimientos situados.`);

if (fallos) {
  console.error(`${fallos} áreas quedaron pendientes: relanzar para continuar.`);
  process.exit(2);
}
console.log('Hecho, sin pendientes.');
