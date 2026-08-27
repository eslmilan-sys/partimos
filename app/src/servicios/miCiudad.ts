/**
 * DE DÓNDE SALES NORMALMENTE.
 *
 * Pedido del dueño el 27-08-2026: preguntar dónde vive la persona para
 * proponerle viajes ya publicados que salgan de ahí, y —si su ciudad no está—
 * dejarla pedir que la agreguemos.
 *
 * **La columna ya existía.** `profiles.home_city_id` estaba desde el
 * principio y ninguna pantalla la escribía ni la leía: la app daba por hecho
 * que todo el mundo sale de la capital (`DESDE_POR_DEFECTO` en `1a`). Para
 * quien vive en Chitré eso es tener que corregir la app cada vez que la abre.
 *
 * **Dónde se pregunta.** En el inicio, no en el registro. Dos razones: quien
 * entra con Google o Facebook no pasa por los tres pasos del registro y se
 * quedaría sin ciudad para siempre; y aquí la respuesta se paga sola —debajo
 * aparecen las salidas desde su ciudad— mientras que en el registro sería un
 * campo más entre la persona y su cuenta.
 */

import type { Lugar } from '@/dominio/lugar';
import type { City } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type MiCiudad = { id: string; nombre: string; slug: string; provincia: string | null };

const comoCiudad = (c: City): MiCiudad => ({
  id: c.id,
  nombre: c.name,
  slug: c.slug,
  provincia: c.province ?? null,
});

/** La ciudad guardada en el perfil, o nula si todavía no se ha preguntado. */
export async function miCiudad(perfilId: string | null): Promise<MiCiudad | null> {
  if (!perfilId) return demora(null, 0);
  const perfil = fuente.perfiles.find((p) => p.id === perfilId);
  const ciudad = perfil?.home_city_id
    ? fuente.ciudades.find((c) => c.id === perfil.home_city_id)
    : undefined;
  return demora(ciudad ? comoCiudad(ciudad) : null);
}

/** Todas las ciudades servidas, en orden alfabético: es una lista para elegir. */
export function ciudadesQueSirvo(): MiCiudad[] {
  return [...fuente.ciudades].sort((a, b) => a.name.localeCompare(b.name)).map(comoCiudad);
}

/** Filtra la lista sin acentos ni mayúsculas: nadie escribe «Chitré» con tilde. */
export function buscarCiudad(texto: string): MiCiudad[] {
  const q = sinTildes(texto);
  if (!q) return ciudadesQueSirvo();
  return ciudadesQueSirvo().filter(
    (c) => sinTildes(c.nombre).includes(q) || sinTildes(c.provincia ?? '').includes(q),
  );
}

/**
 * Tu ciudad, dicha como la dice el buscador de `1a`: así el campo «Salgo de»
 * arranca donde vives sin que la pantalla tenga que traducir nada.
 */
export function comoLugarDeCiudad(c: MiCiudad): Lugar {
  const fila = fuente.ciudades.find((x) => x.id === c.id);
  return {
    nombre: c.nombre,
    tipo: 'ciudad',
    citySlug: c.slug,
    contexto: c.provincia ?? '',
    lat: fila?.lat ?? 0,
    lng: fila?.lng ?? 0,
    fuente: 'catalogo',
  };
}

export async function guardarMiCiudad(perfilId: string, ciudadId: string): Promise<void> {
  await fuente.actualizarPerfil(perfilId, { home_city_id: ciudadId });
  await demora(null);
}

/* ------------------------------------------------------------------ *
 * Cuando la ciudad no está.
 *
 * «Si sa trouve pas faut que le client mette le nom + bouton nous envoyer
 * notification pour ajouter»: la persona escribe el nombre, nosotros lo
 * vemos y la añadimos. Lo que NO se hace es dejarla inventarse una ciudad —
 * un viaje a una ciudad que no existe no lo encuentra nadie, y la regla de
 * `lugar.ts` ya decía que una dirección no se inventa.
 * ------------------------------------------------------------------ */

export type CiudadPedida = { nombre: string; provincia: string | null };

export async function pedirQueAgreguenLaCiudad(
  perfilId: string | null,
  nombre: string,
  provincia?: string,
): Promise<boolean> {
  const limpio = nombre.trim();
  // Ni vacío ni una novela: es un nombre de pueblo.
  if (limpio.length < 2 || limpio.length > 80) return false;

  return demora(
    await fuente.pedirCiudad({
      profile_id: perfilId,
      nombre: limpio,
      provincia: provincia?.trim() || null,
    }),
  );
}

/* ------------------------------------------------------------------ */

const sinTildes = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
