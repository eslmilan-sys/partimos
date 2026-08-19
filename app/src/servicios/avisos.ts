/**
 * Avisos — pantallas `11b` (la bandeja), `12a` (la pantalla bloqueada) y `16d`
 * (el permiso).
 *
 * Las cinco reglas del traspaso viven aquí, no en las pantallas:
 * 1. El título dice qué pasó; la segunda línea lleva ruta y hora.
 * 2. **Si hay acción, va dentro del aviso.** Aceptar un puesto sin abrir la
 *    app es la diferencia entre esto y una notificación cualquiera.
 * 3. Un evento, un aviso. Sólo el dinero se repite en dos canales.
 * 4. El permiso se pide **cuando ya importa** — al reservar o al publicar—,
 *    nunca al arrancar.
 * 5. Nada de promociones. Si no es tu viaje, no escribimos.
 *
 * La base no tiene tabla de avisos: la forma está en `tipos/index.ts` como
 * `AvisoPendiente`, con nombre propio para que la migración sea mecánica.
 */

import type { AvisoPendiente } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type Aviso = {
  id: string;
  titulo: string;
  detalle: string;
  /** La acción que el aviso lleva dentro, si la hay. */
  accion: { etiqueta: string; ruta: string } | null;
  leido: boolean;
  cuando: string;
};

export type Bandeja = {
  /** Lo que pide acción va anclado arriba. Lo demás, después. */
  pideAccion: Aviso[];
  paraSaber: Aviso[];
  sinLeer: number;
};

const comoAviso = (a: AvisoPendiente): Aviso => ({
  id: a.id,
  titulo: a.title,
  detalle: a.body,
  accion: a.action_label && a.action_route ? { etiqueta: a.action_label, ruta: a.action_route } : null,
  leido: a.read_at != null,
  cuando: a.created_at,
});

export async function bandeja(perfilId: string): Promise<Bandeja> {
  const mios = fuente.avisos
    .filter((a) => a.profile_id === perfilId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(comoAviso);

  return demora({
    pideAccion: mios.filter((a) => a.accion),
    paraSaber: mios.filter((a) => !a.accion),
    sinLeer: mios.filter((a) => !a.leido).length,
  });
}

/** Tocar un aviso lo marca leído, y el contador va detrás. */
export async function marcarLeido(avisoId: string): Promise<Aviso | null> {
  const fila = await fuente.marcarAvisoLeido(avisoId);
  return demora(fila ? comoAviso(fila) : null);
}

export async function marcarTodo(perfilId: string): Promise<number> {
  return demora(await fuente.marcarTodosLeidos(perfilId));
}

/** Lo que enseña la pantalla bloqueada de `12a`: el aviso más nuevo sin leer. */
export async function avisoDeBloqueo(perfilId: string): Promise<Aviso | null> {
  const uno = fuente.avisos
    .filter((a) => a.profile_id === perfilId && !a.read_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return demora(uno ? comoAviso(uno) : null);
}

/**
 * Las tres razones concretas de `16d`. No son ventajas: son las tres cosas por
 * las que de verdad vamos a escribir, dichas antes de que el sistema pregunte.
 */
export const RAZONES_DEL_PERMISO: { titulo: string; texto: string }[] = [
  {
    titulo: 'Cuando acepten tu puesto',
    texto: 'Es lo que te dice que ya tienes viaje, con el código para subir.',
  },
  {
    titulo: 'Cuando alguien pida puesto en tu viaje',
    texto: 'Tienes 4 horas para responder, y el aviso trae el botón de aceptar dentro.',
  },
  {
    titulo: 'Cuando se mueva tu dinero',
    texto: 'El aporte que se retiene, el que se libera y el reembolso que sale.',
  },
];
