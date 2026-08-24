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

// Deux serveurs qui parlent la même API. Le principal jette parfois les
// connexions quand on insiste (vu au premier run : ETIMEDOUT après quinze
// requêtes) ; à chaque nouvel essai on change de guichet.
const ESPEJOS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
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

  // ── Ce qui manquait, et qui est exactement ce qu'on cherche au Panama ──
  // Un PH est un `building=apartments` nommé. Sans cette ligne, aucune tour
  // résidentielle du pays n'entrait — et c'est le premier mot que tape
  // quelqu'un qui donne son point de rendez-vous.
  { kind: 'edificio', filtro: 'nwr["building"="apartments"]["name"]' },
  { kind: 'edificio', filtro: 'nwr["building"="residential"]["name"]' },
  { kind: 'edificio', filtro: 'nwr["building"="commercial"]["name"]' },
  { kind: 'edificio', filtro: 'nwr["building"="office"]["name"]' },
  // Urbanizaciones et barriadas : elles sont tracées en emprise, pas en point.
  { kind: 'urbanizacion', filtro: 'nwr["landuse"="residential"]["name"]' },
  // « Frente a la iglesia », « al lado del colegio » : des repères réels ici.
  { kind: 'poi', filtro: 'nwr["amenity"="place_of_worship"]["name"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="school"]["name"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="bank"]["name"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="fast_food"]["name"]' },
  { kind: 'poi', filtro: 'nwr["amenity"="restaurant"]["name"]' },
];

const NIVELES = [
  { admin_level: 4, filtro: 'relation["boundary"="administrative"]["admin_level"="4"]' },
  { admin_level: 6, filtro: 'relation["boundary"="administrative"]["admin_level"="6"]' },
  { admin_level: 8, filtro: 'relation["boundary"="administrative"]["admin_level"="8"]' },
];

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

async function bajar(filtro) {
  const consulta = `
    [out:json][timeout:180];
    area["ISO3166-1"="PA"][admin_level=2]->.pa;
    ${filtro}(area.pa);
    out center tags;
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
  await dormir(5000);
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
  await dormir(5000);
}

console.log('Hecho. Todo en datos-osm/.');
