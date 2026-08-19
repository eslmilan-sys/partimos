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
import { type CiudadConocida, type Lugar, normalizar as normalizarNombre } from '@/dominio/lugar';

import { fuente } from './_fuente';

const LLAVE = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

/**
 * Sin jeton no hay búsqueda de sitios. La pantalla puede preguntarlo y ofrecer
 * el campo libre en vez de una lista que nunca se llena: un desplegable vacío
 * sin explicación es peor que no tenerlo.
 */
export const hayBusquedaDeLugares = LLAVE !== '';

/** Menos de tres letras no es una búsqueda: es alguien empezando a escribir. */
export const MINIMO_PARA_BUSCAR = 3;

/**
 * De donde sale casi todo el mundo, y el origen de los seis corredores.
 *
 * Vive aqui y no repartido por nueve pantallas porque ya se separo una vez:
 * las pantallas escribian `'panama'` y la base dice `'panama-city'`, asi que
 * contra la base de verdad no se encontraba corredor y la busqueda salia
 * vacia sin decir por que.
 */
export const CIUDAD_POR_DEFECTO = 'panama-city';
const MINIMO = MINIMO_PARA_BUSCAR;

export type Punto = { lat: number; lng: number };

/**
 * Una fila cruda de Mapbox. **No es un `Lugar`**: no sabe su tipo ni su
 * ciudad. `geobusqueda.ts` la convierte, que es donde «Multiplaza» deja de
 * ser una cadena y pasa a ser algo que sobrevive al cambio de pantalla.
 */
export type SugerenciaMapbox = {
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
export async function sugerir(texto: string, cerca?: Punto, corte?: AbortSignal): Promise<SugerenciaMapbox[]> {
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
export async function geocodificar(texto: string, cerca?: Punto, corte?: AbortSignal): Promise<SugerenciaMapbox[]> {
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
   Las ciudades que servimos
   ══════════════════════════════════════════════════════════════════════════

   La búsqueda entera vive en `geobusqueda.ts`, que junta cuatro fuentes. Lo
   que queda aquí es lo que sale del almacén y no de la red: las ciudades y
   los corredores, que responden sin jeton y sin esperar.
*/

/** Las filas de `cities`, con la forma que el dominio pide. */
export const ciudadesConocidas = (): CiudadConocida[] =>
  fuente.ciudades.map((c) => ({
    slug: c.slug,
    name: c.name,
    province: c.province,
    lat: c.lat,
    lng: c.lng,
  }));

const comoLugar = (c: CiudadConocida): Lugar => ({
  nombre: c.name,
  tipo: 'ciudad',
  citySlug: c.slug,
  contexto: c.province ?? '',
  lat: c.lat,
  lng: c.lng,
  fuente: 'catalogo',
});

/**
 * LAS CIUDADES QUE CASAN CON LO ESCRITO — sin red, sin jeton, sin esperar.
 *
 * Es la mitad de la búsqueda que **siempre** funciona: las 32 filas de
 * `cities` ya están en el almacén, así que escribir «david» encuentra David
 * aunque no haya ni una llave de proveedor configurada.
 *
 * Se perdió una vez, al reescribir la hoja para juntar las cuatro fuentes: la
 * lista pasó a filtrar solo las sugerencias del campo —que en «Desde» era una
 * sola ciudad—, así que escribir cualquier otra no devolvía nada. Vive aquí
 * para que no vuelva a depender de lo que una pantalla le pase.
 */
export function ciudadesQueCasan(texto: string): Lugar[] {
  const q = normalizarNombre(texto);
  if (!q) return [];
  return fuente.ciudades
    .filter((c) => c.is_active !== false)
    .filter((c) => normalizarNombre(c.name).includes(q) || c.slug.includes(q))
    // Las que empiezan por lo escrito van antes que las que solo lo contienen.
    .sort(
      (a, b) =>
        Number(normalizarNombre(b.name).startsWith(q)) -
        Number(normalizarNombre(a.name).startsWith(q)),
    )
    .map((c) =>
      comoLugar({ slug: c.slug, name: c.name, province: c.province, lat: c.lat, lng: c.lng }),
    );
}

/** Las ciudades desde las que hay corredor abierto. La lista de «Desde». */
export function ciudadesDeSalida(): Lugar[] {
  const ids = new Set(fuente.corredores.map((c) => c.origin_city_id));
  return fuente.ciudades.filter((c) => ids.has(c.id)).map((c) =>
    comoLugar({ slug: c.slug, name: c.name, province: c.province, lat: c.lat, lng: c.lng }),
  );
}

/**
 * A dónde hay corredor desde una ciudad. Es lo que enseña «Hacia» con el
 * campo en blanco: una lista vacía no dice a dónde llevamos.
 */
export function aDondeSeVaDesde(origen: string): Lugar[] {
  const de = fuente.ciudades.find((c) => c.slug === origen);
  if (!de) return [];
  return fuente.corredores
    .filter((c) => c.origin_city_id === de.id)
    .flatMap((c) => {
      const a = fuente.ciudades.find((x) => x.id === c.destination_city_id);
      return a
        ? [comoLugar({ slug: a.slug, name: a.name, province: a.province, lat: a.lat, lng: a.lng })]
        : [];
    });
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

/** El nombre bonito de un slug de ciudad. «chitre» → «Chitré». */
export function nombreDeCiudad(slug: string): string {
  return fuente.ciudades.find((c) => c.slug === slug)?.name ?? slug;
}
