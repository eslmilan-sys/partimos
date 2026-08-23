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

/**
 * LES AUTRES NOMS D'UN LIEU, tels qu'OSM les porte. On ne fabrique aucun
 * alias : on recopie les étiquettes que des gens ont renseignées.
 */
const ETIQUETAS_DE_ALIAS = ['alt_name', 'short_name', 'official_name', 'name:es', 'old_name'];

/**
 * LA GÉOGRAPHIE ADMINISTRATIVE, aux niveaux où le Panama est cartographié :
 * 4 pour les provinces et les comarcas, 6 pour les districts, 8 pour les
 * corregimientos. Le niveau se déduit de l'étiquette, pas d'une supposition.
 */
const NIVELES = [
  { admin_level: 4, filtro: 'relation["boundary"="administrative"]["admin_level"="4"]' },
  { admin_level: 6, filtro: 'relation["boundary"="administrative"]["admin_level"="6"]' },
  { admin_level: 8, filtro: 'relation["boundary"="administrative"]["admin_level"="8"]' },
];

/** Sans accents et en minuscules — la même règle que la base. */
const normalizar = (t) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

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
async function subir(filas, tabla = 'places', conflicto = 'source,source_id') {
  const PAQUETE = 500;
  let escritas = 0;
  for (let i = 0; i < filas.length; i += PAQUETE) {
    const trozo = filas.slice(i, i + PAQUETE);
    await conReintentos(async () => {
      const r = await fetch(`${URL_SB}/rest/v1/${tabla}?on_conflict=${conflicto}`, {
        method: 'POST',
        headers: {
          apikey: LLAVE,
          Authorization: `Bearer ${LLAVE}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(trozo),
      });
      if (!r.ok) throw new Error(`${tabla}: ${r.status} ${(await r.text()).slice(0, 300)}`);
    });
    escritas += trozo.length;
    process.stdout.write(`\r  escritas ${escritas}/${filas.length}`);
  }
  process.stdout.write('\n');
}


/**
 * LA GÉOGRAPHIE DU PAYS, en deux temps.
 *
 * D'abord les trois niveaux tels quels, puis le rattachement de chacun à son
 * parent — qu'OSM ne donne pas explicitement. On le déduit de
 * `is_in:province` / `is_in:district` quand ils existent, et sinon du nom
 * porté par l'étiquette. Ce qu'on ne sait pas rattacher reste sans parent
 * plutôt que rattaché au hasard : un district sous la mauvaise province est
 * pire qu'un district orphelin.
 */
async function importarAdministrativo() {
  const porNivel = { 4: [], 6: [], 8: [] };

  for (const n of NIVELES) {
    process.stdout.write(`admin_level=${n.admin_level} … `);
    const elementos = await bajar(n.filtro);
    for (const e of elementos) {
      const nombre = e.tags?.name?.trim();
      if (!nombre) continue;
      porNivel[n.admin_level].push({
        nombre,
        // Une comarca se déclare comme telle : OSM la nomme « Comarca … »
        // ou porte border_type=comarca. Sinon c'est une province.
        esComarca:
          n.admin_level === 4 &&
          (/comarca/i.test(nombre) || /comarca/i.test(e.tags['border_type'] ?? '')),
        padreNombre:
          e.tags['is_in:district'] ?? e.tags['is_in:province'] ?? e.tags['is_in'] ?? null,
        source_id: `${e.type}/${e.id}`,
      });
    }
    console.log(`${porNivel[n.admin_level].length} con nombre`);
    await dormir(2500);
  }

  const total = porNivel[4].length + porNivel[6].length + porNivel[8].length;
  console.log(`\n${total} áreas administrativas.`);
  if (SECO) {
    console.table(
      [...porNivel[4].slice(0, 4), ...porNivel[6].slice(0, 3), ...porNivel[8].slice(0, 3)].map(
        (a) => ({ nombre: a.nombre, comarca: a.esComarca, padre: a.padreNombre }),
      ),
    );
    return new Map();
  }

  // Premier niveau : provinces et comarcas, sans parent.
  await subir(
    porNivel[4].map((a) => ({
      nivel: a.esComarca ? 'comarca' : 'provincia',
      parent_id: null,
      name: a.nombre,
      normalized_name: normalizar(a.nombre),
      source: 'osm',
      source_id: a.source_id,
    })),
    'admin_areas',
  );

  // On relit ce qui vient d'être écrit pour connaître les identifiants.
  const porNombre = await leerAreas();

  // Districts, puis corregimientos : chacun cherche son parent par le nom.
  for (const [nivel, lista] of [['distrito', porNivel[6]], ['corregimiento', porNivel[8]]]) {
    const filas = lista.map((a) => ({
      nivel,
      parent_id: a.padreNombre ? (porNombre.get(normalizar(a.padreNombre)) ?? null) : null,
      name: a.nombre,
      normalized_name: normalizar(a.nombre),
      source: 'osm',
      source_id: a.source_id,
    }));
    // Le trigger refuse un district sans parent : on n'écrit que ce qu'on
    // sait situer, et on dit combien on a laissé de côté.
    const situados = filas.filter((f) => f.parent_id);
    if (filas.length > situados.length) {
      console.log(`  ${filas.length - situados.length} ${nivel}s sin área madre reconocible: no se escriben`);
    }
    if (situados.length) await subir(situados, 'admin_areas');
    porNombre.clear();
    for (const [k, v] of await leerAreas()) porNombre.set(k, v);
  }

  return porNombre;
}

/** Les aires déjà en base, par nom normalisé, pour rattacher les suivantes. */
async function leerAreas() {
  const r = await fetch(`${URL_SB}/rest/v1/admin_areas?select=id,normalized_name&limit=20000`, {
    headers: { apikey: LLAVE, Authorization: `Bearer ${LLAVE}` },
  });
  if (!r.ok) throw new Error(`admin_areas: ${r.status} ${await r.text()}`);
  const m = new Map();
  for (const a of await r.json()) if (!m.has(a.normalized_name)) m.set(a.normalized_name, a.id);
  return m;
}

async function principal() {
  const ciudades = await ciudadesServidas();
  console.log(`${ciudades.length} ciudades servidas.\n`);

  console.log('── La geografía administrativa ──');
  await importarAdministrativo();

  console.log('\n── Los lugares ──');

  const porClave = new Map();
  const alias = [];
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
      // Les autres noms, recopiés des étiquettes — voir ETIQUETAS_DE_ALIAS.
      for (const et of ETIQUETAS_DE_ALIAS) {
        const otro = e.tags[et]?.trim();
        if (otro && otro !== nombre) alias.push({ clave, alias: otro });
      }
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

  console.log(`${alias.length} otros nombres (alt_name, short_name…).`);

  if (SECO) {
    console.log('\n--seco: no se escribió nada. Muestra:');
    console.table(filas.slice(0, 10).map(({ name, kind, city_slug }) => ({ name, kind, city_slug })));
    return;
  }
  await subir(filas);

  // Les alias après les lieux : ils pendent d'eux. On relit les
  // identifiants attribués plutôt que de les supposer.
  if (alias.length) {
    const r = await fetch(`${URL_SB}/rest/v1/places?select=id,source_id&source=eq.osm&limit=200000`, {
      headers: { apikey: LLAVE, Authorization: `Bearer ${LLAVE}` },
    });
    if (r.ok) {
      const idPorClave = new Map((await r.json()).map((p) => [p.source_id, p.id]));
      const filasAlias = alias
        .map((a) => ({
          place_id: idPorClave.get(a.clave),
          alias: a.alias,
          normalized_alias: normalizar(a.alias),
          source: 'osm',
        }))
        .filter((a) => a.place_id && a.normalized_alias);
      await subir(filasAlias, 'place_aliases', 'place_id,normalized_alias');
      console.log(`${filasAlias.length} alias escritos.`);
    }
  }

  console.log('Hecho. La búsqueda de la app ya los encuentra, sin ninguna llave.');
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
