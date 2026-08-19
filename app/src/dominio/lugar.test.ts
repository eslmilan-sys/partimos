/**
 * La batería de la búsqueda de lugares panameña.
 *
 * Existe porque se formuló un reproche preciso: «busco Multiplaza y la
 * pantalla siguiente me dice Ciudad de Panamá». Cada prueba de aquí
 * corresponde a un caso real de Panamá, no a una propiedad abstracta.
 *
 * El caso más instructivo es `Super 99`: el dedoblado viejo se hacía por el
 * nombre, así que los quince Super 99 del país se hundían en uno.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  type CiudadConocida,
  type Lugar,
  aParams,
  adivinarTipo,
  ciudadDe,
  contextoDe,
  deParams,
  deduplicar,
  desdeCiudad,
  distanciaKm,
  esElMismo,
  libre,
  normalizar,
  ordenar,
} from './lugar.ts';

/** Las filas reales de `cities`, recortadas a lo que el dominio necesita. */
const CIUDADES: CiudadConocida[] = [
  { slug: 'panama', name: 'Ciudad de Panamá', province: 'Panamá', lat: 8.9824, lng: -79.5199 },
  { slug: 'chitre', name: 'Chitré', province: 'Herrera', lat: 7.9614, lng: -80.4297 },
  { slug: 'david', name: 'David', province: 'Chiriquí', lat: 8.4273, lng: -82.4308 },
  { slug: 'santiago', name: 'Santiago', province: 'Veraguas', lat: 8.1008, lng: -80.9803 },
  { slug: 'penonome', name: 'Penonomé', province: 'Coclé', lat: 8.5194, lng: -80.3572 },
];

const lugar = (p: Partial<Lugar> & { nombre: string }): Lugar => ({
  tipo: 'poi',
  citySlug: null,
  contexto: '',
  lat: null,
  lng: null,
  fuente: 'libre',
  ...p,
});

/* ── Normalización ──────────────────────────────────────────────────── */

test('las tildes desaparecen — «chiriqui» encuentra «Chiriquí»', () => {
  assert.equal(normalizar('Chiriquí'), 'chiriqui');
  assert.equal(normalizar('Panamá'), 'panama');
  assert.equal(normalizar('  Multiplaza   Pacific '), 'multiplaza pacific');
  assert.equal(normalizar('Chitré'), 'chitre');
});

/* ── El tipo ────────────────────────────────────────────────────────── */

test('el tipo de lugar se adivina para los casos panameños', () => {
  assert.equal(adivinarTipo(CIUDADES, 'David'), 'ciudad');
  assert.equal(adivinarTipo(CIUDADES, 'Multiplaza'), 'mall');
  assert.equal(adivinarTipo(CIUDADES, 'Albrook Mall'), 'mall');
  assert.equal(adivinarTipo(CIUDADES, 'Aeropuerto de Tocumen'), 'aeropuerto');
  assert.equal(adivinarTipo(CIUDADES, 'PH Torre Mistral'), 'residencial');
  assert.equal(adivinarTipo(CIUDADES, 'Terminal de Albrook'), 'terminal');
  assert.equal(adivinarTipo(CIUDADES, 'Super 99'), 'poi');
});

/* ── Atar a una ciudad ──────────────────────────────────────────────── */

test('un punto en la capital se ata a la capital', () => {
  assert.equal(ciudadDe(CIUDADES, { lat: 8.9936, lng: -79.5197 }), 'panama');
});

test('más allá de 45 km no se ata a nada, en vez de atar mal', () => {
  /* En la cordillera, entre David y Santiago: a 99 km de la más cercana.
     Atarlo a cualquiera de las dos daría resultados de búsqueda falsos, que
     es peor que un lugar sin ciudad. */
  const enLaCordillera = { lat: 8.78, lng: -81.6 };
  const cerca = CIUDADES.map((c) => distanciaKm(enLaCordillera, { lat: c.lat!, lng: c.lng! }));
  assert.ok(Math.min(...cerca) > 45, 'el punto de prueba tiene que estar lejos de verdad');
  assert.equal(ciudadDe(CIUDADES, enLaCordillera), null);
});

test('a 41 km sí se ata: el radio es una regla, no una sospecha', () => {
  /* Entre Penonomé y Santiago, dentro del radio de las dos: gana la más
     cercana. La prueba de arriba y ésta encierran el umbral por los dos
     lados, que es lo que hace que 45 signifique algo. */
  assert.equal(ciudadDe(CIUDADES, { lat: 8.3, lng: -80.66 }), 'penonome');
});

test('sin coordenadas se lee el contexto del proveedor', () => {
  assert.equal(ciudadDe(CIUDADES, null, 'Av. Central, David, Chiriquí'), 'david');
});

test('el contexto no repite el nombre y prefiere la ciudad conocida', () => {
  assert.equal(contextoDe(CIUDADES, 'david'), 'David · Chiriquí');
  assert.equal(contextoDe(CIUDADES, null, 'Vía España, Panamá'), 'Vía España');
});

/* ── Dedoblado: el caso Super 99 ────────────────────────────────────── */

test('dos Super 99 lejos son dos lugares, no uno', () => {
  const enPanama = lugar({ nombre: 'Super 99', lat: 8.98, lng: -79.52, citySlug: 'panama' });
  const enDavid = lugar({ nombre: 'Super 99', lat: 8.43, lng: -82.43, citySlug: 'david' });
  assert.equal(esElMismo(enPanama, enDavid), false);
  assert.equal(deduplicar([enPanama, enDavid]).length, 2);
});

test('el mismo Super 99 visto por dos fuentes es uno solo', () => {
  const deMapbox = lugar({ nombre: 'Super 99', lat: 8.9824, lng: -79.5199 });
  const deTomtom = lugar({ nombre: 'super 99', lat: 8.9835, lng: -79.5205 });
  assert.equal(esElMismo(deMapbox, deTomtom), true);
  assert.equal(deduplicar([deMapbox, deTomtom]).length, 1);
});

test('el duplicado con coordenadas completa al que no las tiene', () => {
  const sinPunto = lugar({ nombre: 'Multiplaza', fuente: 'mapbox' });
  const conPunto = lugar({ nombre: 'Multiplaza', lat: 8.9812, lng: -79.5065, citySlug: 'panama' });
  const [unico] = deduplicar([sinPunto, conPunto]);
  assert.equal(unico.lat, 8.9812);
  assert.equal(unico.citySlug, 'panama');
});

/* ── Orden ──────────────────────────────────────────────────────────── */

test('«multi» saca «Multiplaza» antes que «Multiplaza Pacific»', () => {
  const corto = lugar({ nombre: 'Multiplaza', tipo: 'mall' });
  const largo = lugar({ nombre: 'Multiplaza Pacific', tipo: 'mall' });
  assert.equal(ordenar([largo, corto], 'multi')[0].nombre, 'Multiplaza');
});

test('quien escribe «David» quiere David, no la tienda de al lado', () => {
  const ciudad = desdeCiudad(CIUDADES, 'david')!;
  const tienda = lugar({
    nombre: 'Davidson Tienda',
    tipo: 'poi',
    lat: 8.98,
    lng: -79.52,
    citySlug: 'panama',
  });
  /* Y encima buscando desde la capital, donde está la tienda. */
  const desdeLaCapital = { lat: 8.9824, lng: -79.5199 };
  assert.equal(ordenar([tienda, ciudad], 'David', desdeLaCapital)[0].nombre, 'David');
});

test('nuestra base pasa delante de una fuente externa a igualdad de nombre', () => {
  const nuestra = lugar({ nombre: 'PH Torre Mistral', fuente: 'propia', citySlug: 'panama' });
  const ajena = lugar({ nombre: 'PH Torre Mistral', fuente: 'mapbox' });
  assert.equal(ordenar([ajena, nuestra], 'torre')[0].fuente, 'propia');
});

test('una terminal escrita se encuentra, pero no sube sola', () => {
  /* El conflicto zanjado: `terminal` pesa 30, no 90. Escrito por su nombre
     gana igual —el nombre manda sobre el tipo—, pero contra un mall que
     casa igual de bien, el mall va delante. */
  const terminal = lugar({ nombre: 'Terminal Albrook', tipo: 'terminal' });
  const mall = lugar({ nombre: 'Terminal Albrook Mall', tipo: 'mall' });
  assert.equal(ordenar([mall, terminal], 'terminal albrook')[0].nombre, 'Terminal Albrook');

  const otroMall = lugar({ nombre: 'Albrook', tipo: 'mall' });
  const otraTerminal = lugar({ nombre: 'Albrook', tipo: 'terminal' });
  assert.equal(ordenar([otraTerminal, otroMall], 'albrook')[0].tipo, 'mall');
});

/* ── La intención sobrevive al cambio de pantalla ───────────────────── */

test('«Multiplaza» sigue siendo «Multiplaza» al otro lado de la ruta', () => {
  const elegido = lugar({
    nombre: 'Multiplaza',
    tipo: 'mall',
    citySlug: 'panama',
    lat: 8.9812,
    lng: -79.5065,
    fuente: 'mapbox',
  });
  const params = aParams(elegido, 'd');
  const vuelto = deParams(CIUDADES, params, 'd')!;

  assert.equal(vuelto.nombre, 'Multiplaza');
  assert.equal(vuelto.citySlug, 'panama');
  assert.equal(vuelto.tipo, 'mall');
  assert.ok(Math.abs(vuelto.lat! - 8.9812) < 1e-4);
});

test('una ciudad elegida sin nombre propio usa su nombre de ciudad', () => {
  const vuelto = deParams(CIUDADES, { o: 'chitre' }, 'o')!;
  assert.equal(vuelto.nombre, 'Chitré');
  assert.equal(vuelto.tipo, 'ciudad');
});

test('lo que nadie conoce sigue siendo elegible', () => {
  const suyo = libre(CIUDADES, 'Frente a la casa amarilla', 'chitre');
  assert.equal(suyo.nombre, 'Frente a la casa amarilla');
  assert.equal(suyo.tipo, 'libre');
  assert.equal(suyo.citySlug, 'chitre');
});
