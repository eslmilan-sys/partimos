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

import { A_CUALQUIER_HORA, etiquetaDeRutina } from '@/dominio/rutinas';
import type { RutinaFila } from '@/tipos';

import { nuevoId } from './_id';
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

/**
 * «Avisarme»: guarda la ruta que acabas de buscar.
 *
 * Es la respuesta a una búsqueda sin resultados, y es la única forma que
 * tiene un conductor de enterarse de que alguien quiere ir: `PRODUCT.md` dice
 * que una búsqueda vacía no es un fallo, es una señal.
 *
 * La hora se guarda como `00:00` —«a cualquier hora»— porque nadie eligió
 * una: en la búsqueda se elige el día, no la hora. Inventarle las seis de la
 * mañana haría que `15a` le enseñara después un dato que nunca dio.
 */
export async function guardarRutaBuscada(
  perfilId: string,
  origenSlug: string,
  destinoSlug: string,
  dia: string,
): Promise<RutaGuardada | null> {
  const de = fuente.ciudades.find((c) => c.slug === origenSlug);
  const a = fuente.ciudades.find((c) => c.slug === destinoSlug);
  if (!de || !a || de.id === a.id) return null;

  // Día ISO: el 0 de JavaScript es domingo y en la base el domingo es 7.
  const dow = new Date(`${dia}T12:00:00-05:00`).getDay();
  const dias = [dow === 0 ? 7 : dow];
  const ahora = new Date().toISOString();

  const fila: RutinaFila = {
    id: nuevoId(),
    profile_id: perfilId,
    from_city_id: de.id,
    to_city_id: a.id,
    days: dias,
    departure_time: A_CUALQUIER_HORA,
    created_at: ahora,
    updated_at: ahora,
    avisar: true,
    etiqueta: etiquetaDeRutina(dias, A_CUALQUIER_HORA),
  };
  return demora(comoRuta(await fuente.guardarRuta(fila)));
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
