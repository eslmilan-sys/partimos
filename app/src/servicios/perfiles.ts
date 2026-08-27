/**
 * Perfiles públicos — pantallas `6b` (el conductor) y `15e` (quien pide puesto).
 *
 * Lo que se enseña es lo que el otro necesita para decidir subirse, y nada más:
 * nombre e inicial, reputación con reseñas de verdad —no una nota suelta—, el
 * carro y desde cuándo está. El apellido completo no sale de aquí.
 */

import type { PublicProfile, Review } from '@/tipos';

import { type ComodidadDelCarro, comodidadesDe } from './carros';
import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type Distintivo = { texto: string; tono: 'verde' | 'rojo' | 'neutro' };

export type Resena = {
  id: string;
  autor: string;
  estrellas: number;
  texto: string;
};

export type PerfilPublico = {
  id: string;
  nombre: string;
  iniciales: string;
  calificacion: number | null;
  viajes: number;
  desde: string;
  bio: string | null;
  distintivos: Distintivo[];
  carro: {
    modelo: string;
    color: string;
    placa: string;
    /** Lo que el carro ofrece (0045): aire, USB. Sólo lo que hay. */
    comodidades: ComodidadDelCarro[];
  } | null;
  resenas: Resena[];
  totalResenas: number;
};

export async function perfilPublico(perfilId: string): Promise<PerfilPublico> {
  const p = fuente.perfiles.find((x) => x.id === perfilId);
  if (!p) throw new Error(`No existe el perfil ${perfilId}`);

  const rep = fuente.reputacion[perfilId];
  const carro = fuente.vehiculos.find((v) => v.owner_id === perfilId && v.is_active);
  const nombre = `${p.first_name} ${p.last_initial ?? ''}`.trim();

  const distintivos: Distintivo[] = [];
  // La cédula es obligatoria para publicar, así que no distingue a unos de
  // otros: se enseña como estado, nunca como filtro.
  if (p.is_id_verified) distintivos.push({ texto: 'Cédula verificada', tono: 'verde' });
  if (p.accepts_yappy_direct) distintivos.push({ texto: 'Yappy', tono: 'rojo' });
  if (p.accepts_cash) distintivos.push({ texto: 'Efectivo', tono: 'neutro' });

  // Como en producción: las filas de `reviews` de esta persona, con el nombre
  // de quien escribe unido por `author_id`.
  const suyas = fuente.resenas
    .filter((r) => r.subject_id === perfilId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return demora({
    id: p.id,
    nombre,
    iniciales: iniciales(nombre),
    calificacion: rep?.calificacion ?? null,
    viajes: rep?.viajes ?? 0,
    desde: String(new Date(p.created_at).getFullYear()),
    bio: p.bio,
    distintivos,
    carro: carro
      ? {
          modelo: [carro.make, carro.model].filter(Boolean).join(' '),
          color: carro.color ?? '',
          placa: fuente.placasCompletas[carro.id] ?? '',
          comodidades: comodidadesDe(carro),
        }
      : null,
    resenas: suyas.slice(0, 2).map(comoResena),
    totalResenas: suyas.length,
  });
}

/**
 * TU PROPIO GÉNERO, para saber si se te puede ofrecer «solo mujeres».
 *
 * No sale de `public_profiles`: `gender` no está en la vista pública, y hace
 * bien en no estarlo. Esto lee la fila propia, que es la única que la
 * política RLS deja leer entera.
 */
export async function miGenero(perfilId: string): Promise<string | null> {
  return demora(fuente.perfiles.find((p) => p.id === perfilId)?.gender ?? null);
}

/** El perfil resumido que va dentro de una vista pública (`public_profiles`). */
export async function perfilResumido(perfilId: string): Promise<PublicProfile | null> {
  const p = fuente.perfiles.find((x) => x.id === perfilId);
  if (!p) return demora(null);
  return demora({
    id: p.id,
    first_name: p.first_name,
    last_initial: p.last_initial,
    photo_url: p.photo_url,
    is_id_verified: p.is_id_verified,
    home_city_id: p.home_city_id,
    bio: p.bio,
    created_at: p.created_at,
    has_linkedin: p.linkedin_connected_at != null,
  });
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Una fila de `reviews` como se lee en `6b`. */
function comoResena(r: Review): Resena {
  const autor = fuente.perfiles.find((p) => p.id === r.author_id);
  return {
    id: r.id,
    autor: autor ? `${autor.first_name} ${autor.last_initial ?? ''}`.trim() : 'Alguien',
    estrellas: r.rating,
    texto: r.comment ?? '',
  };
}
