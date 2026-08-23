#!/usr/bin/env node
/**
 * IMPORTER LES LIEUX DU PANAMA DEPUIS OPENSTREETMAP.
 *
 * ───────────────────────────────────────────────────────────────────────
 * POURQUOI OSM ET PAS GOOGLE. Les conditions de Google Places interdisent
 * de stocker les résultats ; Mapbox n'autorise qu'un cache temporaire.
 * OpenStreetMap est sous ODbL : on copie, on transforme, on sert — avec
 * l'attribution « © OpenStreetMap contributors », qui est déjà affichée
 * dans l'app. C'est la seule source qui permet d'avoir la base CHEZ NOUS.
 *
 * POURQUOI OVERPASS ET PAS L'EXTRAIT GEOFABRIK. L'extrait demande
 * `osmium-tool` installé et 120 Mo à télécharger. Overpass répond en JSON,
 * ne demande que Node, et pour un pays de cette taille quelques requêtes
 * suffisent. On reste poli : une catégorie à la fois, une pause entre
 * deux, un User-Agent qui dit qui appelle.
 * ───────────────────────────────────────────────────────────────────────
 *
 * CE QU'IL FAUT AVOIR
 *
 *   export SUPABASE_URL=https://xxxx.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=...      # jamais dans le dépôt
 *
 * COMMENT ON LE LANCE
 *
 *   node scripts/importar-lugares.mjs --seco    # compte, n'écrit rien
 *   node scripts/importar-lugares.mjs           # écrit pour de bon
 *
 * On peut le relancer autant de fois qu'on veut : `source_id` porte l'id
 * OSM, et l'écriture est un upsert sur (source, source_id).
 */

const SECO = process.argv.includes('--seco');
const URL_SB = process.env.SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_SB || !LLAVE) {
  console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const AGENTE = 'Partimos/1.0 (importador de lugares; contacto: hola@partimos.app)';

/**
 * CE QU'ON PREND, ET RIEN D'AUTRE.
 *
 * Le critère n'est pas « tout ce qui existe » mais « ce qui sert de point
 * de rendez-vous ». Une école primaire ou une maison n'en sont pas ; un
 * centre commercial, une station-service ou un parc, oui.
 *
 * Les terminaux de bus sont ABSENTS exprès : `PRODUCT.md` en fait une
 * condition juridique, et le conflit ouvert de `CLAUDE.md` n'est pas
 * tranché. Le jour où il l'est, une ligne suffit ici.
 */
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

/** Au-delà, le lieu appartient à une ville qu'on ne sert pas : on le laisse. */
const KM_MAXIMO = 40;

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

async function ciudadesServidas() {
  const r = await fetch(
    `${URL_SB}/rest/v1/cities?select=slug,name,lat,lng&country_code=eq.PA&lat=not.is.null`,
    { headers: { apikey: LLAVE, Authorization: `Bearer ${LLAVE}` } },
  );
  if (!r.ok) throw new Error(`cities: ${r.status} ${await r.text()}`);
  return (await r.json()).map((c) => ({ ...c, lat: Number(c.lat), lng: Number(c.lng) }));
}

/** Haversine. Assez pour « quelle ville est la plus proche ». */
function km(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
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

/** Écrit par paquets : une requête de dix mille lignes meurt en chemin. */
async function subir(filas) {
  const PAQUETE = 500;
  let escritas = 0;
  for (let i = 0; i < filas.length; i += PAQUETE) {
    const trozo = filas.slice(i, i + PAQUETE);
    await conReintentos(async () => {
      const r = await fetch(`${URL_SB}/rest/v1/places?on_conflict=source,source_id`, {
        method: 'POST',
        headers: {
          apikey: LLAVE,
          Authorization: `Bearer ${LLAVE}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(trozo),
      });
      if (!r.ok) throw new Error(`places: ${r.status} ${(await r.text()).slice(0, 300)}`);
    });
    escritas += trozo.length;
    process.stdout.write(`\r  escritas ${escritas}/${filas.length}`);
  }
  process.stdout.write('\n');
}

async function principal() {
  const ciudades = await ciudadesServidas();
  console.log(`${ciudades.length} ciudades servidas.`);

  const porClave = new Map();
  let vistos = 0;
  let lejos = 0;
  let sinNombre = 0;

  for (const cat of CATEGORIAS) {
    process.stdout.write(`${cat.filtro} … `);
    const elementos = await bajar(cat.filtro);
    vistos += elementos.length;

    let guardados = 0;
    for (const e of elementos) {
      const nombre = e.tags?.name?.trim();
      // Un lieu sans nom ne se cherche pas : il n'a rien à faire dans une
      // liste de suggestions.
      if (!nombre) { sinNombre++; continue; }

      const lat = e.lat ?? e.center?.lat;
      const lng = e.lon ?? e.center?.lon;
      if (lat == null || lng == null) continue;

      let cerca = null;
      let mejor = Infinity;
      for (const c of ciudades) {
        const d = km(lat, lng, c.lat, c.lng);
        if (d < mejor) { mejor = d; cerca = c; }
      }
      if (!cerca || mejor > KM_MAXIMO) { lejos++; continue; }

      const clave = `${e.type}/${e.id}`;
      porClave.set(clave, {
        name: nombre,
        kind: cat.kind,
        country_code: 'PA',
        city_slug: cerca.slug,
        address:
          [e.tags['addr:street'], e.tags['addr:housenumber']].filter(Boolean).join(' ') ||
          cerca.name,
        // PostGIS lit le WKT tel quel sur une colonne geography.
        geom: `SRID=4326;POINT(${lng} ${lat})`,
        source: 'osm',
        source_id: clave,
        is_public: true,
      });
      guardados++;
    }
    console.log(`${elementos.length} traídos, ${guardados} útiles`);
    // Overpass est un service gratuit et partagé. On respire entre deux.
    await dormir(2500);
  }

  const filas = [...porClave.values()];
  console.log(
    `\n${vistos} elementos vistos · ${sinNombre} sin nombre · ${lejos} fuera de las ciudades servidas`,
  );
  console.log(`${filas.length} lugares listos para escribir.`);

  if (SECO) {
    console.log('\n--seco: no se escribió nada. Muestra:');
    console.table(filas.slice(0, 10).map(({ name, kind, city_slug }) => ({ name, kind, city_slug })));
    return;
  }
  await subir(filas);
  console.log('Hecho. La búsqueda de la app ya los encuentra, sin ninguna llave.');
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
