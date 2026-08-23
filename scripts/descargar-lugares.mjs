#!/usr/bin/env node
/**
 * TÉLÉCHARGER LES DONNÉES OSM DU PANAMA — ET RIEN D'AUTRE.
 *
 * C'est la moitié « réseau » de `importar-lugares.mjs`, découpée exprès :
 * ce script parle à Overpass et écrit des fichiers, il ne touche à aucune
 * base et ne demande AUCUN secret. L'autre moitié — transformer et écrire
 * dans Supabase — peut alors tourner ailleurs, là où Overpass n'est pas
 * joignable mais la base l'est.
 *
 * Le workflow `descargar-lugares.yml` le lance depuis GitHub Actions et
 * publie le dossier `datos-osm/` sur la branche du même nom. Les requêtes,
 * les catégories et les niveaux sont EXACTEMENT ceux d'`importar-lugares.mjs` :
 * si l'un change, changer l'autre.
 *
 *   node scripts/descargar-lugares.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const AGENTE = 'Partimos/1.0 (descarga de lugares; contacto: hola@partimos.app)';

// Les mêmes listes qu'`importar-lugares.mjs`, à l'identique.
const CATEGORIAS = [
  { kind: 'mall', filtro: 'nwr["shop"="mall"]' },
  { kind: 'mall', filtro: 'nwr["shop"="department_store"]' },
  { kind: 'poi', filtro: 'nwr["shop"="supermarket"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="fuel"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="hospital"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="clinic"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="university"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="marketplace"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="pharmacy"]' },
  { kind: 'poi', filtro: 'nwr["leisure"="park"]' },
  { kind: 'poi', filtro: 'nwr["leisure"="stadium"]' },
  { kind: 'poi', filtro: 'nwr["tourism"="hotel"]' },
  { kind: 'aeropuerto', filtro: 'nwr["aeroway"="aerodrome"]' },
  { kind: 'barrio', filtro: 'nwr["place"="suburb"]' },
  { kind: 'barrio', filtro: 'nwr["place"="neighbourhood"]' },
  { kind: 'barrio', filtro: 'nwr["place"="quarter"]' },
  { kind: 'barrio', filtro: 'nwr["place"="village"]' },
  { kind: 'barrio', filtro: 'nwr["place"="town"]' },
];

const NIVELES = [
  { admin_level: 4, filtro: 'relation["boundary"="administrative"]["admin_level"="4"]' },
  { admin_level: 6, filtro: 'relation["boundary"="administrative"]["admin_level"="6"]' },
  { admin_level: 8, filtro: 'relation["boundary"="administrative"]["admin_level"="8"]' },
];

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function conReintentos(hacer, cuantos = 4) {
  for (let i = 0; ; i++) {
    try {
      return await hacer();
    } catch (e) {
      if (i >= cuantos) throw e;
      const espera = 2 ** i * 3000;
      console.warn(`  reintento en ${espera / 1000}s — ${e.message}`);
      await dormir(espera);
    }
  }
}

async function bajar(filtro) {
  const consulta = `
    [out:json][timeout:180];
    area["ISO3166-1"="PA"][admin_level=2]->.pa;
    ${filtro}(area.pa);
    out center tags;
  `;
  return conReintentos(async () => {
    const r = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'User-Agent': AGENTE },
      body: consulta,
    });
    if (!r.ok) throw new Error(`overpass ${r.status}`);
    const j = await r.json();
    return j.elements ?? [];
  });
}

function guardar(nombre, contenido) {
  // Gzippé : le JSON d'OSM se compresse très bien, et ça voyage par git.
  writeFileSync(`datos-osm/${nombre}.json.gz`, gzipSync(JSON.stringify(contenido)));
}

mkdirSync('datos-osm', { recursive: true });

for (const n of NIVELES) {
  process.stdout.write(`admin_level=${n.admin_level} … `);
  const elementos = await bajar(n.filtro);
  console.log(`${elementos.length} elementos`);
  guardar(`admin_${n.admin_level}`, { admin_level: n.admin_level, elements: elementos });
  // Overpass est un service gratuit et partagé. On respire entre deux.
  await dormir(2500);
}

for (let i = 0; i < CATEGORIAS.length; i++) {
  const cat = CATEGORIAS[i];
  process.stdout.write(`${cat.filtro} … `);
  const elementos = await bajar(cat.filtro);
  console.log(`${elementos.length} elementos`);
  guardar(`cat_${String(i).padStart(2, '0')}`, {
    kind: cat.kind,
    filtro: cat.filtro,
    elements: elementos,
  });
  await dormir(2500);
}

console.log('Hecho. Todo en datos-osm/.');
