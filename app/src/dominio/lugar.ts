/**
 * EL LUGAR — el objeto que guarda lo que la persona quiso.
 *
 * ───────────────────────────────────────────────────────────────────────
 * LA REGLA MADRE: NUNCA ESCONDER LA INTENCIÓN.
 *
 * El fallo que este módulo existe para matar: se buscaba «Multiplaza», se
 * validaba, y la pantalla siguiente decía «Ciudad de Panamá». Nada estaba
 * roto técnicamente — el tipo simplemente no tenía DÓNDE guardar
 * «Multiplaza», porque el origen y el destino eran slugs de ciudad.
 *
 * La corrección es estructural, no cosmética. Un lugar lleva tres cosas
 * que no se sustituyen nunca entre ellas:
 *
 *   · QUÉ ELIGIÓ          `nombre`      se enseña siempre, tal cual
 *   · DÓNDE QUEDA         `citySlug`    contexto y clave de emparejado
 *   · DÓNDE EXACTAMENTE   `lat`/`lng`   cálculo, jamás se enseña
 *
 * La ciudad es un complemento de dirección, jamás un reemplazo.
 * ───────────────────────────────────────────────────────────────────────
 *
 * Portado de `web/src/lib/place.ts`, que es donde se escribió primero.
 * **La diferencia con el sitio:** allí las ciudades son una constante del
 * módulo; aquí llegan de la base, así que se pasan como argumento. Eso
 * mantiene este archivo puro —sin IO, comprobable— que es la regla de
 * `dominio/`.
 */

/**
 * EL TIPO DE LUGAR. Sin él no se puede clasificar un mall antes que una
 * calle, ni distinguir «David» (una ciudad) de «Chiriquí Mall» (un lugar
 * DENTRO de una ciudad). Tres necesidades, un campo.
 */
export type TipoDeLugar =
  | 'ciudad'
  | 'poi'
  | 'mall'
  | 'terminal'
  | 'aeropuerto'
  | 'residencial'
  | 'barrio'
  | 'libre';

export type FuenteDelLugar =
  | 'propia'
  | 'tomtom'
  | 'locationiq'
  | 'mapbox'
  | 'catalogo'
  | 'libre';

export type Lugar = {
  /** LO QUE LA PERSONA ELIGIÓ. Jamás reescrito, jamás sustituido por la
   *  ciudad — es la razón de ser de todo este archivo. */
  nombre: string;
  tipo: TipoDeLugar;
  /** La ciudad que sirve para emparejar. `null` para un lugar que ninguna
   *  ciudad conocida cubre: se guarda igual, no se tira. */
  citySlug: string | null;
  /** El renglón que va DEBAJO del nombre («Panamá · Panamá»). */
  contexto: string;
  lat: number | null;
  lng: number | null;
  fuente: FuenteDelLugar;
  /** El identificador en la fuente, cuando la fuente da uno. */
  fuenteId?: string;
};

/** Lo mínimo que este módulo necesita saber de una ciudad. */
export type CiudadConocida = {
  slug: string;
  name: string;
  province: string | null;
  lat: number | null;
  lng: number | null;
};

/**
 * El orden de preferencia cuando dos resultados empatan por lo demás.
 *
 * **`terminal` vale 30, no 90.** El sitio le daba 90 —el segundo más alto,
 * porque una terminal es un punto de encuentro evidente— y `places.ts`
 * prohíbe a la vez proponer terminales de buses, que es condición jurídica
 * en PRODUCT.md: no nos ponemos donde operan los transportistas
 * comerciales. Las dos reglas se contradecían y el código no decía cuál
 * ganaba. Queda tranchado así: **nunca se esconde lo que alguien buscó por
 * su nombre, nunca se sugiere solo.** Con 30 una terminal escrita se
 * encuentra; sin promoción, no sube sola. `lugaresCerca` y
 * `proponerPuntos` la excluyen aparte.
 */
const PESO_TIPO: Record<TipoDeLugar, number> = {
  ciudad: 100,
  aeropuerto: 88,
  mall: 80,
  poi: 60,
  residencial: 55,
  barrio: 40,
  terminal: 30,
  libre: 10,
};

/* ══════════════════════════════════════════════════════════════════════
   NORMALIZACIÓN — la base de todo lo demás.
   ══════════════════════════════════════════════════════════════════════ */

/** Sin tildes, sin mayúsculas, sin espacios de más. «Chiriquí» y
 *  «chiriqui» son la misma palabra: quien escribe rápido no acentúa, y
 *  devolverle cero resultados por eso sería absurdo. */
export function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Kilómetros entre dos puntos (haversine). Sirve al dedoblado y al orden. */
export function distanciaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ══════════════════════════════════════════════════════════════════════
   ADIVINAR EL TIPO — sin base de POI tipada, se lee el nombre.

   No es magia: es un repliegue honesto. Las fuentes externas no devuelven
   todas una categoría aprovechable, y un tipo equivocado solo degrada el
   orden — no rompe nunca la búsqueda.
   ══════════════════════════════════════════════════════════════════════ */

const REGLAS: { patron: RegExp; tipo: TipoDeLugar }[] = [
  { patron: /\b(aeropuerto|airport|tocumen|albrook field)\b|^pty$/i, tipo: 'aeropuerto' },
  { patron: /\b(terminal|piquera|parada de buses)\b/i, tipo: 'terminal' },
  { patron: /\b(mall|multiplaza|metromall|megamall|centro comercial|plaza)\b/i, tipo: 'mall' },
  {
    patron: /\bph\b|\b(residencial|urbanizaci[oó]n|barriada|condominio|torre[s]?)\b/i,
    tipo: 'residencial',
  },
  { patron: /\b(corregimiento|barrio)\b/i, tipo: 'barrio' },
];

export function adivinarTipo(
  ciudades: CiudadConocida[],
  nombre: string,
  contexto = '',
): TipoDeLugar {
  /* Una ciudad conocida sigue siendo una ciudad, diga lo que diga el nombre. */
  const n = normalizar(nombre);
  if (ciudades.some((c) => normalizar(c.name) === n)) return 'ciudad';
  for (const { patron, tipo } of REGLAS) {
    if (patron.test(nombre) || patron.test(contexto)) return tipo;
  }
  return 'poi';
}

/* ══════════════════════════════════════════════════════════════════════
   ATAR A UNA CIUDAD — la mitad «emparejado» del problema.
   ══════════════════════════════════════════════════════════════════════ */

/** Más allá de esto se devuelve `null` en vez de atar Boquete a David. */
export const RADIO_DE_CIUDAD_KM = 45;

/**
 * La ciudad conocida más cercana, a condición de estar DE VERDAD cerca.
 *
 * Un atado falso produce resultados de búsqueda falsos, que es peor que un
 * lugar sin ciudad.
 */
export function ciudadDe(
  ciudades: CiudadConocida[],
  punto: { lat: number; lng: number } | null,
  contexto = '',
): string | null {
  if (punto && Number.isFinite(punto.lat) && Number.isFinite(punto.lng)) {
    let mejor: { slug: string; km: number } | null = null;
    for (const c of ciudades) {
      if (c.lat === null || c.lng === null) continue;
      const km = distanciaKm(punto, { lat: c.lat, lng: c.lng });
      if (!mejor || km < mejor.km) mejor = { slug: c.slug, km };
    }
    if (mejor && mejor.km <= RADIO_DE_CIUDAD_KM) return mejor.slug;
  }
  /* Sin coordenadas: se lee el contexto («…, David, Chiriquí»). */
  const ctx = normalizar(contexto);
  if (ctx) {
    for (const c of ciudades) {
      if (ctx.includes(normalizar(c.name))) return c.slug;
    }
  }
  return null;
}

/** El renglón secundario, el que vive DEBAJO del nombre. Nunca repite el
 *  nombre: «Multiplaza / Multiplaza, Panamá» es ruido. */
export function contextoDe(
  ciudades: CiudadConocida[],
  citySlug: string | null,
  bruto = '',
): string {
  const ciudad = ciudades.find((c) => c.slug === citySlug);
  if (ciudad) {
    return ciudad.province && ciudad.province !== ciudad.name
      ? `${ciudad.name} · ${ciudad.province}`
      : ciudad.name;
  }
  return bruto.replace(/,\s*Panam[aá]\s*$/i, '').trim();
}

/* ══════════════════════════════════════════════════════════════════════
   DEDOBLADO — el fallo «Super 99».

   La regla vieja dedoblaba por el nombre normalizado, así que los quince
   Super 99 del país se hundían en UNO, arbitrariamente el de la fuente más
   rápida. Dos lugares con el mismo nombre a treinta kilómetros son dos
   lugares distintos.
   ══════════════════════════════════════════════════════════════════════ */

/** Mismo nombre y menos de esto: es el mismo sitio visto por dos fuentes. */
export const MISMO_LUGAR_KM = 2;

export function esElMismo(a: Lugar, b: Lugar): boolean {
  if (normalizar(a.nombre) !== normalizar(b.nombre)) return false;
  if (a.lat !== null && a.lng !== null && b.lat !== null && b.lng !== null) {
    return (
      distanciaKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }) < MISMO_LUGAR_KM
    );
  }
  /* UNO DE LOS DOS NO SABE DÓNDE ESTÁ. Es el caso corriente: Mapbox
     «suggest» devuelve nombres sin coordenadas. Dos ciudades conocidas y
     DISTINTAS lo zanjan; si no, la falta de información no es prueba de
     diferencia, y se funden. Equivocarse aquí cuesta un duplicado en la
     lista; al revés costaba las coordenadas, o sea el emparejado, o sea
     el precio. */
  if (a.citySlug && b.citySlug) return a.citySlug === b.citySlug;
  return true;
}

export function deduplicar(lugares: Lugar[]): Lugar[] {
  const salida: Lugar[] = [];
  for (const lugar of lugares) {
    const gemelo = salida.find((y) => esElMismo(y, lugar));
    if (!gemelo) {
      salida.push({ ...lugar });
      continue;
    }
    /* El duplicado puede ser MEJOR que el guardado: si trae coordenadas
       que el otro no tiene, se completa en vez de tirarlo. */
    if (gemelo.lat === null && lugar.lat !== null) {
      gemelo.lat = lugar.lat;
      gemelo.lng = lugar.lng;
      if (!gemelo.citySlug) gemelo.citySlug = lugar.citySlug;
    }
  }
  return salida;
}

/* ══════════════════════════════════════════════════════════════════════
   ORDEN — «cuál enseña Partimos PRIMERO».

   No había ninguno: el orden era el de respuesta de las fuentes, es decir
   el azar de la red.
   ══════════════════════════════════════════════════════════════════════ */

export function puntuar(
  lugar: Lugar,
  consulta: string,
  cerca?: { lat: number; lng: number } | null,
): number {
  const q = normalizar(consulta);
  const n = normalizar(lugar.nombre);
  let p = 0;

  /* 1. El nombre manda sobre todo lo demás. Quien escribe «David» quiere
        David, no «Davidson Tienda». */
  if (n === q) p += 1000;
  else if (n.startsWith(q)) p += 600;
  else if (n.includes(q)) p += 300;
  else p += 50;

  /* A igualdad, el más corto gana: quien escribe «multi» quiere
     «Multiplaza» antes que «Multiplaza Pacific», porque el nombre más
     corto es el que menos cosas trae que NO se pidieron. Con tope, para
     que desempate y no decida. */
  p -= Math.min(40, Math.max(0, n.length - q.length) * 1.5);

  /* 2. El tipo. */
  p += PESO_TIPO[lugar.tipo];

  /* 3. Nuestra base primero: tiene lo que la gente de aquí escribió y
        volvió a usar de verdad. */
  if (lugar.fuente === 'propia') p += 120;
  else if (lugar.fuente === 'catalogo') p += 90;

  /* 4. Un lugar situable vale más que uno flotando. */
  if (lugar.citySlug) p += 40;
  if (lugar.lat !== null) p += 25;

  /* 5. La cercanía, al final y con suavidad: desempata, no decide. 200 km
        cuestan 40 puntos, no 400. */
  if (cerca && lugar.lat !== null && lugar.lng !== null) {
    const km = distanciaKm(cerca, { lat: lugar.lat, lng: lugar.lng });
    p += Math.max(-60, 40 - km / 5);
  }
  return p;
}

export function ordenar(
  lugares: Lugar[],
  consulta: string,
  cerca?: { lat: number; lng: number } | null,
): Lugar[] {
  return [...lugares].sort((a, b) => puntuar(b, consulta, cerca) - puntuar(a, consulta, cerca));
}

/* ══════════════════════════════════════════════════════════════════════
   IR Y VOLVER DE LOS PARÁMETROS DE RUTA

   El nombre se escribe al lado del identificador, a propósito redundante:
   la pantalla siguiente enseña «Multiplaza» ANTES de la primera llamada de
   red. Una pantalla que enseña «Panamá» y luego se corrige es peor que una
   lenta — parece que se equivocó.
   ══════════════════════════════════════════════════════════════════════ */

export function aParams(lugar: Lugar | null, prefijo: 'o' | 'd'): Record<string, string> {
  if (!lugar) return {};
  const out: Record<string, string> = {
    [prefijo]: lugar.citySlug ?? '',
    [`${prefijo}Nom`]: lugar.nombre,
    [`${prefijo}Tipo`]: lugar.tipo,
  };
  if (lugar.lat !== null && lugar.lng !== null) {
    out[`${prefijo}Pos`] = `${lugar.lat.toFixed(5)},${lugar.lng.toFixed(5)}`;
  }
  return out;
}

export function deParams(
  ciudades: CiudadConocida[],
  params: Record<string, string | undefined>,
  prefijo: 'o' | 'd',
): Lugar | null {
  const citySlug = params[prefijo] || null;
  const nombre = params[`${prefijo}Nom`] || '';
  if (!citySlug && !nombre) return null;

  let lat: number | null = null;
  let lng: number | null = null;
  const pos = params[`${prefijo}Pos`];
  if (pos) {
    const [a, b] = pos.split(',').map(Number);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      lat = a;
      lng = b;
    }
  }

  /* SIN NOMBRE, LA CIUDAD HACE DE NOMBRE — y es el único caso en que es
     legítimo: la persona eligió una ciudad de verdad. */
  const ciudad = ciudades.find((c) => c.slug === citySlug);
  const tipo = (params[`${prefijo}Tipo`] as TipoDeLugar | undefined) ?? null;

  return {
    nombre: nombre || ciudad?.name || citySlug || '',
    tipo: tipo ?? (nombre ? adivinarTipo(ciudades, nombre) : 'ciudad'),
    citySlug,
    contexto: nombre ? contextoDe(ciudades, citySlug) : '',
    lat: lat ?? ciudad?.lat ?? null,
    lng: lng ?? ciudad?.lng ?? null,
    fuente: 'libre',
  };
}

/** Un lugar hecho de una ciudad conocida — el caso más corriente. */
export function desdeCiudad(ciudades: CiudadConocida[], citySlug: string): Lugar | null {
  const c = ciudades.find((x) => x.slug === citySlug);
  if (!c) return null;
  return {
    nombre: c.name,
    tipo: 'ciudad',
    citySlug: c.slug,
    contexto: c.province ?? '',
    lat: c.lat,
    lng: c.lng,
    fuente: 'catalogo',
  };
}

/** Lo que la persona escribió y ninguna base conoce. Se acepta: «frente a
 *  la casa amarilla» es una cita panameña de verdad, y el producto organiza
 *  encuentros entre personas, que se hallan por un nombre y no por unas
 *  coordenadas. */
export function libre(
  ciudades: CiudadConocida[],
  texto: string,
  citySlug: string | null,
): Lugar {
  const c = citySlug ? ciudades.find((x) => x.slug === citySlug) : null;
  return {
    nombre: texto.trim(),
    tipo: 'libre',
    citySlug: citySlug ?? null,
    contexto: contextoDe(ciudades, citySlug),
    lat: c?.lat ?? null,
    lng: c?.lng ?? null,
    fuente: 'libre',
  };
}
