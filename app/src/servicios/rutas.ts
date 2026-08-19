/**
 * Rutas guardadas — pantalla `15a`, que es adonde lleva «Avisarme».
 *
 * Una ruta guardada **es** una `routine` de la base: de dónde a dónde, qué
 * días y a qué hora. Lo único que la tabla no guarda todavía es el interruptor
 * de avisar, que va como `RoutinePendiente`.
 *
 * El interruptor apaga el aviso **sin borrar la ruta**. Son dos cosas
 * distintas y el traspaso las separa a propósito: dejar de recibir mensajes no
 * es dejar de querer ir.
 */

import type { RutinaFila } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type RutaGuardada = {
  id: string;
  ruta: string;
  cuando: string;
  /** Lo que hay ahora mismo en esa ruta, o por qué no hay nada. */
  estado: string;
  hayViajes: boolean;
  avisar: boolean;
};

export async function rutasGuardadas(perfilId: string): Promise<RutaGuardada[]> {
  const mias = fuente.rutinas.filter((r) => r.profile_id === perfilId);
  return demora(mias.map(comoRuta));
}

/** El interruptor de una ruta. Apaga el aviso; la ruta sigue guardada. */
export async function cambiarAviso(rutaId: string, avisar: boolean): Promise<RutaGuardada | null> {
  const fila = await fuente.cambiarAvisoDeRutina(rutaId, avisar);
  return demora(fila ? comoRuta(fila) : null);
}

export async function cuantasAvisando(perfilId: string): Promise<number> {
  return demora(fuente.rutinas.filter((r) => r.profile_id === perfilId && r.avisar).length);
}

/* ------------------------------------------------------------------ */

function comoRuta(r: RutinaFila): RutaGuardada {
  const de = fuente.ciudades.find((c) => c.id === r.from_city_id);
  const a = fuente.ciudades.find((c) => c.id === r.to_city_id);
  const cuantos = viajesEstaSemana(r);

  return {
    id: r.id,
    ruta: `${corto(de?.name)} → ${corto(a?.name)}`,
    cuando: r.etiqueta,
    estado: !r.avisar
      ? 'Avisos apagados'
      : cuantos > 0
        ? `${cuantos} ${cuantos === 1 ? 'viaje' : 'viajes'} esta semana`
        : 'Nada por ahora',
    hayViajes: cuantos > 0,
    avisar: r.avisar,
  };
}

/** «Ciudad de Panamá» se dice Albrook cuando se habla de dónde se sube. */
function corto(nombre?: string): string {
  if (!nombre) return '';
  return nombre === 'Ciudad de Panamá' ? 'Albrook' : nombre;
}

function viajesEstaSemana(r: RutinaFila): number {
  const semana = new Date(Date.now() + 7 * 24 * 3_600_000).toISOString();
  return fuente.viajes.filter(
    (v) =>
      v.status === 'published' &&
      v.departure_at <= semana &&
      (v.origin_label ?? '').startsWith(corto(fuente.ciudades.find((c) => c.id === r.from_city_id)?.name)) &&
      (v.destination_label ?? '').startsWith(corto(fuente.ciudades.find((c) => c.id === r.to_city_id)?.name)),
  ).length;
}
