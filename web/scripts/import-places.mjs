#!/usr/bin/env node
/**
 * IMPORTA LOS LUGARES DE PANAMÁ A NUESTRA BASE.
 *
 * Se corre UNA vez (y luego cada mes o dos, para refrescar). Baja el
 * extracto de OpenStreetMap de Panamá, saca todo lo que tiene NOMBRE y
 * sirve como punto de encuentro, y lo mete en la tabla `places`
 * (migración 0013).
 *
 * Por qué OSM y no Google/Mapbox: sus términos prohíben guardar los
 * resultados — Google solo deja conservar el place_id, Mapbox una caché
 * temporal. OSM es ODbL: se puede copiar, transformar y servir, con
 * atribución «© OpenStreetMap contributors» visible en la app y
 * share-alike sobre la base derivada. Es la única vía legal para tener
 * la geolocalización EN CASA.
 *
 * Requisitos:
 *   - Node 20+ y ~2 GB de RAM libres
 *   - osmium-tool  (brew install osmium-tool | apt install osmium-tool)
 *   - Variables: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   node scripts/import-places.mjs            # baja, extrae e importa
 *   node scripts/import-places.mjs --dry      # solo extrae y cuenta
 *
 * Cuánto pesa: el extracto de Panamá ronda los 60 MB; salen del orden de
 * 100 000 a 200 000 lugares con nombre. En Postgres eso son unos 40 MB
 * con índices — cabe de sobra en el plan pequeño de Supabase.
 */

import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const run = promisify(execFile);

const PBF_URL = "https://download.geofabrik.de/central-america/panama-latest.osm.pbf";
const WORK = ".places-import";
const PBF = `${WORK}/panama.osm.pbf`;
const GEOJSON = `${WORK}/panama-places.geojson`;
const DRY = process.argv.includes("--dry");

/**
 * Qué se importa. Un punto sirve si alguien puede decir «nos vemos ahí»:
 * gasolineras, malls, supermercados, plazas, hospitales, universidades,
 * parques, iglesias, y los edificios con nombre — que en Panamá son los
 * PH. Se deja fuera lo que nadie usa como referencia (bancos de plaza,
 * papeleras) y TODO lo que huela a terminal de buses: la plataforma no
 * compite con el transporte público ni recoge en sus terminales.
 */
const KEEP = [
  "amenity=fuel",
  "amenity=hospital",
  "amenity=clinic",
  "amenity=university",
  "amenity=college",
  "amenity=school",
  "amenity=place_of_worship",
  "amenity=pharmacy",
  "amenity=marketplace",
  "shop=mall",
  "shop=supermarket",
  "shop=department_store",
  "leisure=park",
  "leisure=stadium",
  "tourism=hotel",
  "aeroway=aerodrome",
  "building=apartments",
  "building=residential",
  "building=commercial",
  "building=office",
  "place=neighbourhood",
  "place=suburb",
  "place=village",
  "highway=services",
];

const EXCLUDE_NAME =
  /terminal|piquera|parada de bus|estaci[oó]n de bus|bus stop/i;

/** Las ciudades servidas, con su centro. Debe seguir a src/lib/corridors.ts:
 *  el import asigna cada lugar a la ciudad servida más cercana, y descarta
 *  lo que quede a más de MAX_KM — no queremos poblar la base con puntos
 *  que ninguna ruta toca. */
const CITY_CENTERS = JSON.parse(
  await readFile(new URL("./city-centers.json", import.meta.url), "utf8").catch(
    () => "null",
  ) ?? "null",
) ?? exitWith(
  "Falta scripts/city-centers.json. Genéralo con:\n" +
    "  node -e \"import('./src/lib/corridors.ts').then(m=>console.log(JSON.stringify(m.ALL_CITIES.map(c=>({slug:c.slug,lat:c.lat,lng:c.lng})))))\" > scripts/city-centers.json",
);

const MAX_KM = 25;

function exitWith(message) {
  console.error(message);
  process.exit(1);
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function nearestCity(lat, lng) {
  let best = null;
  let bestKm = Infinity;
  for (const city of CITY_CENTERS) {
    const km = haversineKm(lat, lng, city.lat, city.lng);
    if (km < bestKm) {
      bestKm = km;
      best = city;
    }
  }
  return bestKm <= MAX_KM ? best.slug : null;
}

async function exists(path) {
  return Boolean(await stat(path).catch(() => null));
}

async function download() {
  if (await exists(PBF)) {
    console.log("· extracto ya descargado");
    return;
  }
  console.log(`· bajando ${PBF_URL} …`);
  const res = await fetch(PBF_URL);
  if (!res.ok) exitWith(`No se pudo bajar el extracto: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(PBF));
}

async function extract() {
  console.log("· filtrando con osmium …");
  await run("osmium", [
    "tags-filter",
    PBF,
    ...KEEP.map((t) => `nwr/${t}`),
    "-o",
    `${WORK}/filtrado.osm.pbf`,
    "--overwrite",
  ]);
  await run("osmium", [
    "export",
    `${WORK}/filtrado.osm.pbf`,
    "-o",
    GEOJSON,
    "--overwrite",
    "-f",
    "geojsonseq",
  ]);
}

/** Convierte el GeoJSON en filas listas para `places`. */
async function toRows() {
  const raw = await readFile(GEOJSON, "utf8");
  const rows = [];
  const seen = new Set();

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let f;
    try {
      f = JSON.parse(line.replace(/^\x1e/, ""));
    } catch {
      continue;
    }
    const name = f.properties?.name;
    if (!name || EXCLUDE_NAME.test(name)) continue;

    // Un punto: el centroide basta para decir «nos vemos ahí».
    const [lng, lat] = centroid(f.geometry) ?? [];
    if (typeof lat !== "number") continue;

    const citySlug = nearestCity(lat, lng);
    if (!citySlug) continue;

    const sourceId = `${f.properties["@id"] ?? f.id ?? `${lat},${lng}`}`;
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);

    const kind =
      ["amenity", "shop", "leisure", "tourism", "building", "place", "aeroway"]
        .map((k) => (f.properties[k] ? `${k}=${f.properties[k]}` : null))
        .find(Boolean) ?? null;

    rows.push({
      name,
      kind,
      city_slug: citySlug,
      address:
        [f.properties["addr:street"], f.properties["addr:housenumber"]]
          .filter(Boolean)
          .join(" ") || null,
      lat,
      lng,
      source: "osm",
      source_id: sourceId,
    });
  }
  return rows;
}

function centroid(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") return geometry.coordinates;
  const coords = geometry.coordinates?.flat(Infinity) ?? [];
  if (coords.length < 2) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i + 1 < coords.length; i += 2) {
    sx += coords[i];
    sy += coords[i + 1];
    n++;
  }
  return n ? [sx / n, sy / n] : null;
}

async function upload(rows) {
  const url = process.env.SUPABASE_URL;
  /* Supabase renombró las claves: `sb_secret_…` sustituye al viejo JWT
     `service_role`. Se aceptan las dos — un proyecto nuevo trae la
     primera, uno viejo la segunda. */
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    exitWith("Faltan SUPABASE_URL y SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY).");

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK).map((r) => ({
      name: r.name,
      kind: r.kind,
      city_slug: r.city_slug,
      address: r.address,
      // PostgREST acepta WKT para geography.
      geom: `SRID=4326;POINT(${r.lng} ${r.lat})`,
      source: r.source,
      source_id: r.source_id,
    }));
    const res = await fetch(`${url}/rest/v1/places?on_conflict=source,source_id`, {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) exitWith(`Error subiendo: ${res.status} ${await res.text()}`);
    process.stdout.write(`\r· subidos ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }
  console.log("");
}

await mkdir(WORK, { recursive: true });
await download();
await extract();
const rows = await toRows();

const byCity = rows.reduce((acc, r) => {
  acc[r.city_slug] = (acc[r.city_slug] ?? 0) + 1;
  return acc;
}, {});
console.log(`· ${rows.length} lugares con nombre en las ciudades servidas`);
console.log(
  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([c, n]) => `   ${c}: ${n}`)
    .join("\n"),
);

if (DRY) {
  await writeFile(`${WORK}/muestra.json`, JSON.stringify(rows.slice(0, 50), null, 2));
  console.log(`· --dry: muestra en ${WORK}/muestra.json, nada subido`);
} else {
  await upload(rows);
  console.log("· listo. No olvides la atribución © OpenStreetMap contributors.");
}
