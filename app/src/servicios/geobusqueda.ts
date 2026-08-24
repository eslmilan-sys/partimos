/**
 * BUSCAR UN SITIO — cuatro fuentes a la vez, jamás en cascada.
 *
 * ───────────────────────────────────────────────────────────────────────
 * Ninguna base conoce todos los lugares de Panamá. Mapbox se salta PH que
 * TomTom conoce; TomTom se salta barriadas que la comunidad de
 * OpenStreetMap cartografió. No se arbitra: se preguntan **todas a la vez**
 * (`Promise.allSettled`) y se funden. Un lugar solo necesita existir en UNA
 * para salir.
 *
 * **Lo nuestro va primero**, y no por cortesía: `places` responde en un
 * viaje, no cuesta por consulta, y es la única que sabe lo que los
 * panameños escriben de verdad — «PH Torre Mistral», «la bomba de Divisa»,
 * «entrada de Villa Lucre».
 *
 * REGLA DE AVERÍA: toda fuente que falle —llave ausente, cuota, red,
 * formato inesperado— desaparece en silencio. Jamás un rechazo global,
 * jamás un error en pantalla. Una fuente de menos degrada la lista; un
 * error bloquea la búsqueda.
 *
 * Seis resultados como mucho. Más allá, una lista de sugerencias se
 * convierte en una lista de lectura.
 *
 * Las llaves son públicas del lado del cliente, a restringir por dominio en
 * cada consola. No son secretos.
 * ───────────────────────────────────────────────────────────────────────
 *
 * Portado de `web/src/lib/geosearch.ts`.
 */

import {
  type CiudadConocida,
  type FuenteDelLugar,
  type Lugar,
  adivinarTipo,
  ciudadDe,
  contextoDe,
  deduplicar,
  ordenar,
} from '@/dominio/lugar';

import { fuente } from './_fuente';
import { supabase } from './_fuente/supabase/cliente';
import { MINIMO_PARA_BUSCAR, concretar, geocodificar, sugerir } from './lugares';

const TOMTOM = process.env.EXPO_PUBLIC_TOMTOM_KEY ?? '';
const LOCATIONIQ = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY ?? '';
const MAPBOX = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

/** Cuántos resultados ve la persona. */
export const CUANTOS_RESULTADOS = 6;

/**
 * A partir de cuántos resultados propios ya no se sale afuera.
 *
 * Bajo a propósito: tres resultados de la casa —con su contexto
 * administrativo y su cuenta de uso real— valen más que ocho donde seis
 * vienen de un proveedor que no conoce «la bomba de Divisa».
 */
export const SUFICIENTES = 3;

/** Las ciudades, con la forma que el dominio pide. Se leen del almacén. */
const ciudades = (): CiudadConocida[] =>
  fuente.ciudades.map((c) => ({
    slug: c.slug,
    name: c.name,
    province: c.province,
    lat: c.lat,
    lng: c.lng,
  }));

/** Lo que devuelve cualquier fuente antes de convertirse en `Lugar`. */
type Bruto = { nombre: string; contexto: string; lat: number | null; lng: number | null; id?: string };

/**
 * BRUTO → LUGAR. Aquí «Multiplaza» deja de ser una cadena de caracteres y
 * pasa a ser un lugar que sabe su tipo y su ciudad — o sea, que puede
 * sobrevivir al cambio de pantalla sin que lo reemplacen por «Ciudad de
 * Panamá». Ver la cabecera de `dominio/lugar.ts`.
 */
function comoLugar(b: Bruto, deDonde: FuenteDelLugar): Lugar {
  const cs = ciudades();
  const tienePunto =
    b.lat !== null && b.lng !== null && Number.isFinite(b.lat) && Number.isFinite(b.lng) &&
    !(b.lat === 0 && b.lng === 0);
  const punto = tienePunto ? { lat: b.lat as number, lng: b.lng as number } : null;
  const citySlug = ciudadDe(cs, punto, b.contexto);
  return {
    nombre: b.nombre.trim(),
    tipo: adivinarTipo(cs, b.nombre, b.contexto),
    citySlug,
    /* La ciudad conocida gana al contexto bruto del proveedor: «David ·
       Chiriquí» se lee mejor que «Av. Central, Distrito de David». */
    contexto: citySlug ? contextoDe(cs, citySlug) : b.contexto,
    lat: punto?.lat ?? null,
    lng: punto?.lng ?? null,
    fuente: deDonde,
    fuenteId: b.id,
  };
}

/* ── 1 · La nuestra ──────────────────────────────────────────────────── */

/**
 * `places` (migración 0013) con su RPC `search_places`: el extracto de
 * OpenStreetMap de Panamá más todo lo que los usuarios escribieron y
 * confirmaron. Es el único proveedor que conoce «PH Torre Mistral» porque
 * alguien lo tecleó aquí.
 *
 * Con la tabla vacía devuelve una lista vacía y la búsqueda se comporta
 * exactamente igual que sin ella.
 */
async function deLaNuestra(q: string, citySlug?: string | null): Promise<Bruto[]> {
  try {
    const { data, error } = await supabase.rpc('search_places' as never, {
      q,
      near_city: citySlug ?? null,
      max_results: CUANTOS_RESULTADOS,
    } as never);
    if (error || !Array.isArray(data)) return [];
    return (
      data as {
        name: string;
        address: string | null;
        lat: number;
        lng: number;
        /** « Punta Pacífica, San Francisco, Panamá » — migración 0033. */
        contexto?: string | null;
      }[]
    ).map((r) => ({
      /* Le contexte administratif d'abord : c'est comme ça qu'un Panaméen
         situe un lieu, et c'est ce qui distingue les deux « Santa Rosa ».
         L'adresse de rue reste le repli quand on ne sait pas encore situer. */
      nombre: r.name,
      contexto: r.contexto?.trim() || r.address || '',
      lat: r.lat,
      lng: r.lng,
    }));
  } catch {
    return [];
  }
}

/* ── 2 · TomTom ──────────────────────────────────────────────────────── */

async function deTomtom(q: string, cerca?: Punto, corte?: AbortSignal): Promise<Bruto[]> {
  if (!TOMTOM) return [];
  const p = new URLSearchParams({
    key: TOMTOM,
    countrySet: 'PA',
    language: 'es-MX',
    limit: '5',
    typeahead: 'true',
  });
  if (cerca) {
    p.set('lat', String(cerca.lat));
    p.set('lon', String(cerca.lng));
  }
  try {
    const r = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?${p}`,
      { signal: corte },
    );
    if (!r.ok) return [];
    const cuerpo = (await r.json()) as {
      results?: {
        poi?: { name?: string };
        address?: { freeformAddress?: string; municipality?: string; streetName?: string };
        position?: { lat: number; lon: number };
      }[];
    };
    return (cuerpo.results ?? [])
      .filter((x) => x.position)
      .map((x) => ({
        nombre: x.poi?.name ?? x.address?.freeformAddress ?? x.address?.streetName ?? q,
        contexto: (x.poi?.name
          ? (x.address?.freeformAddress ?? x.address?.municipality ?? '')
          : (x.address?.municipality ?? '')
        ).replace(/,\s*Panam[aá]$/i, ''),
        lat: x.position!.lat,
        lng: x.position!.lon,
      }));
  } catch {
    return [];
  }
}

/* ── 3 · LocationIQ ──────────────────────────────────────────────────── */

async function deLocationiq(q: string, corte?: AbortSignal): Promise<Bruto[]> {
  if (!LOCATIONIQ) return [];
  const p = new URLSearchParams({
    key: LOCATIONIQ,
    q,
    countrycodes: 'pa',
    limit: '5',
    dedupe: '1',
    'accept-language': 'es',
  });
  try {
    const r = await fetch(`https://api.locationiq.com/v1/autocomplete?${p}`, { signal: corte });
    if (!r.ok) return [];
    const cuerpo = (await r.json()) as unknown;
    if (!Array.isArray(cuerpo)) return [];
    return (cuerpo as {
      display_place?: string;
      display_address?: string;
      display_name?: string;
      lat: string;
      lon: string;
    }[]).map((x) => ({
      nombre: x.display_place ?? (x.display_name ?? q).split(',')[0],
      contexto: (x.display_address ?? x.display_name ?? '')
        .replace(/,\s*Panam[aá]$/i, '')
        .slice(0, 80),
      lat: Number(x.lat),
      lng: Number(x.lon),
    }));
  } catch {
    return [];
  }
}

export type Punto = { lat: number; lng: number };

/* ── El conjunto ─────────────────────────────────────────────────────── */

/** El orden de esta lista es el de `Promise.allSettled` de abajo. */
const DE_DONDE: FuenteDelLugar[] = ['propia', 'tomtom', 'locationiq', 'mapbox'];

/**
 * La búsqueda entera. Las cuatro salen a la vez; la lista sale ordenada por
 * `puntuar`, no por quién contestó primero.
 */
export async function buscarEnTodas(
  texto: string,
  cerca?: Punto,
  corte?: AbortSignal,
  /** La ciudad de la búsqueda: desempata dos «Super 99». */
  citySlug?: string | null,
): Promise<Lugar[]> {
  const q = texto.trim();
  if (q.length < MINIMO_PARA_BUSCAR) return [];

  /**
   * LA MAISON D'ABORD, ET SOUVENT SEULE.
   *
   * On interrogeait les quatre sources à chaque frappe. Maintenant que
   * `places` porte l'import OSM, elle répond bien la plupart du temps — et
   * chaque appel externe coûte une session facturée pour rien.
   *
   * Donc : on demande à la nôtre, et on ne sort dehors que si elle rend
   * moins de `SUFICIENTES` résultats. Le seuil est bas exprès : deux
   * résultats justes valent mieux que huit dont six viennent d'ailleurs.
   */
  const deCasa = await deLaNuestra(q, citySlug);
  if (deCasa.length >= SUFICIENTES) {
    return ordenar(
      deduplicar(deCasa.filter((b) => b.nombre?.trim()).map((b) => comoLugar(b, 'propia'))),
      q,
      cerca,
    ).slice(0, CUANTOS_RESULTADOS);
  }

  const respuestas = await Promise.allSettled([
    Promise.resolve(deCasa),
    deTomtom(q, cerca, corte),
    deLocationiq(q, corte),
    MAPBOX
      ? sugerir(q, cerca, corte).then((l) =>
          l.map((x) => ({
            nombre: x.nombre,
            contexto: x.contexto,
            // `sugerir` no trae punto: lo da `concretar` al elegir, y solo
            // entonces. Es lo que hace que Mapbox cobre una sesión y no diez.
            lat: null,
            lng: null,
            id: x.mapboxId,
          })),
        )
      : Promise.resolve([] as Bruto[]),
  ]);

  const todos: Lugar[] = [];
  respuestas.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    for (const bruto of r.value) {
      if (!bruto.nombre?.trim()) continue;
      todos.push(comoLugar(bruto, DE_DONDE[i] ?? 'libre'));
    }
  });

  const juntos = ordenar(deduplicar(todos), q, cerca);

  /* ¿Nadie contestó? El geocodificador v5 de Mapbox queda de última red
     para las calles. Solo en ese caso: es una llamada más. */
  if (juntos.length === 0 && MAPBOX) {
    try {
      const brutos = await geocodificar(q, cerca, corte);
      return ordenar(
        deduplicar(brutos.map((b) => comoLugar({ ...b, id: b.mapboxId }, 'mapbox'))),
        q,
        cerca,
      ).slice(0, CUANTOS_RESULTADOS);
    } catch {
      return [];
    }
  }

  return juntos.slice(0, CUANTOS_RESULTADOS);
}

/**
 * El punto de una sugerencia de Mapbox, que llega sin él. Para las demás
 * fuentes no hace falta: ya venían situadas.
 */
export async function situar(elegido: Lugar, corte?: AbortSignal): Promise<Lugar> {
  if (elegido.lat !== null || elegido.fuente !== 'mapbox' || !elegido.fuenteId) return elegido;
  const punto = await concretar(elegido.fuenteId, corte);
  if (!punto) return elegido;
  const cs = ciudades();
  const citySlug = ciudadDe(cs, punto, elegido.contexto) ?? elegido.citySlug;
  return {
    ...elegido,
    lat: punto.lat,
    lng: punto.lng,
    citySlug,
    contexto: citySlug ? contextoDe(cs, citySlug) : elegido.contexto,
  };
}

/**
 * LOS LUGARES ALREDEDOR DE UN PUNTO — para proponer una recogida con
 * sentido.
 *
 * Ninguna otra función de este archivo sabe responder «¿qué hay cerca de
 * aquí?»: todas buscan un NOMBRE, no un vecindario. `/nearby` de LocationIQ
 * sí, sobre OpenStreetMap, para todo Panamá y sin base que mantener.
 *
 * **Las categorías son una regla, no un ajuste.** Una bomba, un mall, un
 * supermercado o un parque: se encuentran de noche, se describen por
 * teléfono y tienen estacionamiento. Una farmacia o una barbería, no.
 *
 * Y **nunca una terminal de buses** —condición jurídica de PRODUCT.md: no
 * nos ponemos donde operan los transportistas comerciales—, así que si
 * alguna se cuela por el nombre, se cae aquí.
 *
 * Todo fallo devuelve lista vacía: la pantalla vuelve a lo de antes, la
 * persona escribe su punto. Una recomendación ausente es una comodidad
 * menos; una falsa manda a alguien a esperar al sitio equivocado.
 */
export async function lugaresCerca(centro: Punto, corte?: AbortSignal): Promise<Lugar[]> {
  if (!LOCATIONIQ) return [];
  const p = new URLSearchParams({
    key: LOCATIONIQ,
    lat: String(centro.lat),
    lon: String(centro.lng),
    tag: 'amenity:fuel,shop:mall,shop:supermarket,leisure:park',
    radius: '4000',
    limit: '12',
    format: 'json',
  });
  try {
    const r = await fetch(`https://api.locationiq.com/v1/nearby?${p}`, { signal: corte });
    if (!r.ok) return [];
    const cuerpo = (await r.json()) as unknown;
    if (!Array.isArray(cuerpo)) return [];
    const salida: Lugar[] = [];
    for (const bruto of cuerpo as {
      name?: string;
      display_name?: string;
      lat?: string | number;
      lon?: string | number;
    }[]) {
      const nombre = (bruto.name ?? bruto.display_name ?? '').split(',')[0].trim();
      const lat = Number(bruto.lat);
      const lng = Number(bruto.lon);
      if (!nombre || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const lugar = comoLugar({ nombre, contexto: '', lat, lng }, 'locationiq');
      if (lugar.tipo === 'terminal') continue;
      salida.push(lugar);
    }
    return salida;
  } catch {
    return [];
  }
}

/**
 * Si alguna fuente puede contestar. Sin ninguna, la pantalla lo dice.
 *
 * **Faltaba la nuestra.** `places` es el proveedor de la casa y el primero al
 * que se pregunta —lo hace `buscarEnTodas`, siempre— pero no contaba aquí. Con
 * las tres llaves ausentes la pantalla anunciaba «solo buscamos entre las
 * ciudades que servimos» aunque el catálogo tuviera diez mil lugares dentro.
 *
 * Et ce n'est pas lié au mode : `deLaNuestra` interroge la vraie base MÊME en
 * données simulées, parce que chercher un lieu ne passe pas par l'interrupteur
 * de source. Le lien de la démo cherche donc dans le même catalogue que l'app.
 */
const HAY_BASE = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_LLAVE,
);
export const HAY_BUSQUEDA = HAY_BASE || Boolean(TOMTOM || LOCATIONIQ || MAPBOX);
