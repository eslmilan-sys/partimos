/**
 * Buscar un sitio — el campo de origen y destino, y los puntos de recogida.
 *
 * Portado del sitio de `partimos/`, que ya lo tenía funcionando contra Mapbox.
 * Dos llamadas distintas y complementarias:
 *
 *   sugerir()  Search Box. Devuelve nombres mientras se escribe, sin
 *              coordenadas, y es barato. Es lo que alimenta la lista.
 *   concretar() Retrieve. Convierte la sugerencia elegida en un punto. Solo se
 *              llama una vez, al elegir, y por eso las dos comparten
 *              `session_token`: Mapbox factura la sesión entera como una.
 *
 * `geocodificar()` es la vía directa, sin sesión, para cuando ya hay un texto
 * y hace falta el punto sin pasar por la lista.
 *
 * La llave es pública —`pk.`, la que Mapbox reparte para el navegador— y va
 * limitada a Panamá y al español en cada consulta.
 */

/**
 * El jeton vive en el entorno, nunca en el código.
 *
 * No es por secreto —es un jeton `pk.`, público por construcción, y viaja
 * compilado en el paquete que descarga el navegador— sino porque un jeton
 * escrito aquí no se puede cambiar sin volver a publicar la app. El día que
 * haya que rotarlo o restringirlo por dominio, se toca una variable.
 *
 * Lo que de verdad protege la cuota es la restricción por dominio en la
 * consola de Mapbox. Sin ella, el plan gratuito se lo queda quien pase.
 */
import { fuente } from './_fuente';

const LLAVE = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

/**
 * Sin jeton no hay búsqueda de sitios. La pantalla puede preguntarlo y ofrecer
 * el campo libre en vez de una lista que nunca se llena: un desplegable vacío
 * sin explicación es peor que no tenerlo.
 */
export const hayBusquedaDeLugares = LLAVE !== '';

/** Menos de tres letras no es una búsqueda: es alguien empezando a escribir. */
const MINIMO = 3;

export type Punto = { lat: number; lng: number };

export type Lugar = {
  nombre: string;
  /** «Vía España, Bella Vista» — lo que hay debajo del nombre en la lista. */
  contexto: string;
  /** Solo lo traen las sugerencias; hay que concretarlo para tener el punto. */
  mapboxId?: string;
  lat: number;
  lng: number;
};

/** «Albrook, Panamá» → «Albrook». El país sobra cuando solo hay un país. */
const sinPais = (texto: string) => texto.replace(/, Panam[aá]$/i, '');

/**
 * La sesión de búsqueda. Mapbox cobra por sesión y no por tecla, así que
 * escribir diez letras y elegir una vez cuesta una sola.
 */
let sesion: string | null = null;
const laSesion = () => (sesion ??= globalThis.crypto?.randomUUID?.() ?? String(Math.random()).slice(2));

/** Cierra la sesión: la siguiente búsqueda empieza una nueva. */
export const olvidarSesion = () => {
  sesion = null;
};

/** Nombres mientras se escribe. Sin coordenadas todavía. */
export async function sugerir(texto: string, cerca?: Punto, corte?: AbortSignal): Promise<Lugar[]> {
  if (!LLAVE || texto.trim().length < MINIMO) return [];
  const p = new URLSearchParams({
    q: texto.trim(),
    access_token: LLAVE,
    session_token: laSesion(),
    language: 'es',
    country: 'pa',
    limit: '6',
  });
  if (cerca) p.set('proximity', `${cerca.lng},${cerca.lat}`);

  try {
    const r = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${p}`, { signal: corte });
    if (!r.ok) return [];
    const cuerpo = (await r.json()) as {
      suggestions?: { name: string; place_formatted?: string; mapbox_id: string }[];
    };
    return (cuerpo.suggestions ?? []).map((s) => ({
      nombre: s.name,
      contexto: sinPais(s.place_formatted ?? ''),
      mapboxId: s.mapbox_id,
      lat: 0,
      lng: 0,
    }));
  } catch {
    // Una búsqueda cancelada o sin red no es un error que enseñar: es una
    // lista vacía mientras se sigue escribiendo.
    return [];
  }
}

/** La sugerencia elegida, ya con su punto. */
export async function concretar(mapboxId: string, corte?: AbortSignal): Promise<Punto | null> {
  if (!LLAVE) return null;
  const p = new URLSearchParams({ access_token: LLAVE, session_token: laSesion() });
  try {
    const r = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?${p}`,
      { signal: corte },
    );
    if (!r.ok) return null;
    const cuerpo = (await r.json()) as { features?: { geometry?: { coordinates?: [number, number] } }[] };
    const c = cuerpo.features?.[0]?.geometry?.coordinates;
    return c ? { lng: c[0], lat: c[1] } : null;
  } catch {
    return null;
  }
}

/** Texto a punto, sin pasar por la lista. */
export async function geocodificar(texto: string, cerca?: Punto, corte?: AbortSignal): Promise<Lugar[]> {
  if (!LLAVE || texto.trim().length < MINIMO) return [];
  const p = new URLSearchParams({
    access_token: LLAVE,
    country: 'pa',
    language: 'es',
    limit: '5',
    types: 'poi,address,neighborhood,locality,place',
  });
  if (cerca) p.set('proximity', `${cerca.lng},${cerca.lat}`);

  try {
    const r = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(texto.trim())}.json?${p}`,
      { signal: corte },
    );
    if (!r.ok) return [];
    const cuerpo = (await r.json()) as {
      features?: { text?: string; text_es?: string; place_name?: string; place_name_es?: string; center: [number, number] }[];
    };
    return (cuerpo.features ?? []).map((f) => {
      const nombre = f.text_es ?? f.text ?? '';
      const largo = f.place_name_es ?? f.place_name ?? '';
      return {
        nombre,
        contexto: sinPais(largo.replace(`${nombre}, `, '')),
        lng: f.center[0],
        lat: f.center[1],
      };
    });
  } catch {
    return [];
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Buscar a dónde vas
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * **Lo nuestro primero.** Es la misma decisión que el sitio escribió en
 * `web/src/lib/geosearch.ts`: la base propia se consulta antes que ningún
 * proveedor, porque responde en un viaje, no cuesta por consulta y —sobre
 * todo— es la única que sabe qué ciudades tienen corredor abierto.
 *
 * Un resultado con `ciudad` es un sitio al que Partimos **lleva**: se puede
 * buscar viajes ahí mismo. Uno sin ella es un punto del mapa, y sirve para
 * decir dónde te recogen, no para elegir ruta. Distinguirlos es lo que evita
 * la pantalla de resultados vacía sin explicación.
 */
export type Destino = {
  nombre: string;
  contexto: string;
  /** El slug de la ciudad, cuando el sitio es una ciudad que servimos. */
  ciudad?: string;
  lat: number | null;
  lng: number | null;
};

/** Sin tildes y en minúsculas: quien escribe «chitre» busca «Chitré». */
const plano = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Las ciudades que servimos y que casan con lo escrito.
 *
 * No hace falta jeton ni red: las filas ya están en el almacén. Por eso esta
 * mitad de la búsqueda funciona siempre, y la de Mapbox solo añade.
 */
export function ciudadesQueCasan(texto: string): Destino[] {
  const q = plano(texto);
  if (!q) return [];
  return fuente.ciudades
    .filter((c) => c.is_active !== false)
    .filter((c) => plano(c.name).includes(q) || plano(c.slug).includes(q))
    // Las que empiezan por lo escrito van antes que las que solo lo contienen.
    .sort((a, b) => Number(plano(b.name).startsWith(q)) - Number(plano(a.name).startsWith(q)))
    .slice(0, 5)
    .map((c) => ({
      nombre: c.name,
      contexto: c.province ?? '',
      ciudad: c.slug,
      lat: c.lat,
      lng: c.lng,
    }));
}

/**
 * Todo junto: nuestras ciudades y, debajo, lo que Mapbox conozca y nosotros no.
 *
 * Las dos mitades se piden a la vez, pero la lista sale siempre en el mismo
 * orden —lo nuestro arriba—, porque lo que se puede reservar pesa más que lo
 * que solo se puede señalar en un mapa. Se quitan los repetidos por nombre:
 * Mapbox también conoce «Chitré» y enseñarlo dos veces es ruido.
 */
export async function buscarDestino(texto: string, corte?: AbortSignal): Promise<Destino[]> {
  const nuestras = ciudadesQueCasan(texto);
  if (!hayBusquedaDeLugares) return nuestras;

  const deMapbox = await sugerir(texto, undefined, corte);
  const yaEstan = new Set(nuestras.map((c) => plano(c.nombre)));

  return [
    ...nuestras,
    ...deMapbox
      .filter((l) => !yaEstan.has(plano(l.nombre)))
      .map((l) => ({
        nombre: l.nombre,
        contexto: l.contexto,
        // `sugerir` no trae punto: lo da `concretar` al elegir, y solo entonces.
        lat: null,
        lng: null,
        mapboxId: l.mapboxId,
      })),
  ].slice(0, 8);
}

/**
 * Si hay corredor abierto entre dos ciudades. Es lo que separa «te llevamos»
 * de «ese sitio existe pero nadie va».
 */
export function hayCorredor(origen: string, destino: string): boolean {
  const de = fuente.ciudades.find((c) => c.slug === origen);
  const a = fuente.ciudades.find((c) => c.slug === destino);
  if (!de || !a) return false;
  return fuente.corredores.some(
    (c) => c.origin_city_id === de.id && c.destination_city_id === a.id,
  );
}

/** Las ciudades a las que hay corredor desde una dada. Para la lista en blanco. */
export function aDondeSeVaDesde(origen: string): Destino[] {
  const de = fuente.ciudades.find((c) => c.slug === origen);
  if (!de) return [];
  return fuente.corredores
    .filter((c) => c.origin_city_id === de.id)
    .flatMap((c) => {
      const a = fuente.ciudades.find((x) => x.id === c.destination_city_id);
      return a ? [{ nombre: a.name, contexto: a.province ?? '', ciudad: a.slug, lat: a.lat, lng: a.lng }] : [];
    });
}

/** Las ciudades desde las que hay corredor abierto. La lista de «Desde». */
export function ciudadesDeSalida(): Destino[] {
  const ids = new Set(fuente.corredores.map((c) => c.origin_city_id));
  return fuente.ciudades
    .filter((c) => ids.has(c.id))
    .map((c) => ({ nombre: c.name, contexto: c.province ?? '', ciudad: c.slug, lat: c.lat, lng: c.lng }));
}

/** El nombre bonito de un slug de ciudad. «chitre» → «Chitré». */
export function nombreDeCiudad(slug: string): string {
  return fuente.ciudades.find((c) => c.slug === slug)?.name ?? slug;
}
