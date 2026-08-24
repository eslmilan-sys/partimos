#!/usr/bin/env node
/**
 * LES POLYGONES DES CORREGIMIENTOS — pour situer chaque lieu.
 *
 * POURQUOI. `places.admin_area_id` doit dire dans quel corregimiento
 * tombe chaque point. Ni les étiquettes ni le centre ne suffisent : il
 * faut la frontière. Ce script télécharge les géométries des relations
 * admin_level=8, une province à la fois (d'un coup, la réponse serait
 * trop lourde et Overpass la refuserait).
 *
 * CE QUE ÇA PRODUIT. `datos-osm/geom_8_<relid>.json.gz` par aire de
 * niveau 4 : les relations de niveau 8 qu'elle contient, avec `out geom`
 * (chaque membre way porte ses coordonnées). Le rattachement
 * point-dans-polygone se calcule ensuite hors ligne.
 *
 * Reprenable comme `descargar-jerarquia.mjs` : progression notée après
 * chaque province dans `geometria_estado.json.gz`, échec d'une province
 * n'arrête pas les autres, relancer ne refait que le manquant.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

const ESPEJOS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const AGENTE = 'Partimos/1.0 (geometria administrativa; contacto: hola@partimos.app)';

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

async function geometriaEn(rel) {
  const consulta = `
    [out:json][timeout:300];
    area(id:${3600000000 + rel})->.a;
    relation["boundary"="administrative"]["admin_level"="8"](area.a);
    out geom;
  `;
  return conReintentos(async (intento) => {
    const r = await fetch(ESPEJOS[intento % ESPEJOS.length], {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'User-Agent': AGENTE },
      body: consulta,
      signal: AbortSignal.timeout(360_000),
    });
    if (!r.ok) throw new Error(`overpass ${r.status}`);
    const j = await r.json();
    return j.elements ?? [];
  });
}

const ruta = (n) => `datos-osm/${n}.json.gz`;
const leer = (n) => JSON.parse(gunzipSync(readFileSync(ruta(n))));
const leerOpc = (n, d) => (existsSync(ruta(n)) ? leer(n) : d);
const guardar = (n, c) => writeFileSync(ruta(n), gzipSync(JSON.stringify(c)));

const nivel4 = leer('admin_4').elements.filter((e) => e.tags?.name);
const estado = leerOpc('geometria_estado', { hechas: [] });
const hechas = new Set(estado.hechas);
let fallos = 0;

for (const p of nivel4) {
  if (hechas.has(p.id)) continue;
  process.stdout.write(`geometrías nivel 8 en ${p.tags.name} … `);
  try {
    const els = await geometriaEn(p.id);
    console.log(`${els.length} relaciones`);
    guardar(`geom_8_${p.id}`, { area: p.id, elements: els });
    hechas.add(p.id);
    guardar('geometria_estado', { hechas: [...hechas] });
  } catch (e) {
    console.warn(`FALLO — ${e.message}`);
    fallos++;
  }
  await dormir(5000);
}

if (fallos) {
  console.error(`${fallos} provincias quedaron pendientes: relanzar para continuar.`);
  process.exit(2);
}
console.log('Hecho, sin pendientes.');
