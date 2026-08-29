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
 * DE DÓNDE SALE LA BANDEJA. De dos aguas que se juntan aquí:
 *
 *   · `fuente.avisos` — lo ESCRITO: la tabla `notifications` (migración
 *     0040) contra la base real, las filas sembradas en el simulado.
 *   · `avisosDeLosHechos` — lo DERIVADO: los hechos vivos de las reservas
 *     y los viajes, contados por `dominio/avisar.ts`. Es lo que hace que
 *     pedir un puesto le aparezca al conductor AL INSTANTE, sin esperar a
 *     ninguna fila, y lo que pone el recordatorio de salida — que no es un
 *     evento sino un estado del reloj, y ninguna tabla lo puede escribir.
 *     Desde el 27-08-2026 también **los mensajes sin leer**: un hilo con algo
 *     que contestar es un aviso, y se apaga solo al abrirlo — no hace falta
 *     ninguna fila ni ninguna marca aparte.
 *
 * Cuando el mismo hecho está en las dos aguas, la fila escrita manda: tiene
 * identidad estable y su «leído» sobrevive a la recarga. El derivado se
 * suprime comparando el hecho — (kind, booking_id) — porque los
 * identificadores no coinciden nunca.
 */

import type { AvisoPendiente } from '@/tipos';

import { avisosDeLosHechos, yaEstaEscrito } from '@/dominio/avisar';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type Aviso = {
  id: string;
  /**
   * DE QUÉ VA, tal cual lo dice la base o la derivación.
   *
   * La bandeja elegía el icono leyendo el TÍTULO —«¿incluye "aport"?»— y eso
   * es adivinar: un aviso nuevo cae en el icono por defecto sin que nadie se
   * entere, y cambiar una palabra del texto cambia el dibujo. El `kind` ya
   * existe; sólo no llegaba a la pantalla.
   */
  clase: AvisoPendiente['kind'];
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
  clase: a.kind,
  titulo: a.title,
  detalle: a.body,
  accion: a.action_label && a.action_route ? { etiqueta: a.action_label, ruta: a.action_route } : null,
  leido: a.read_at != null,
  cuando: a.created_at,
});

/**
 * Un aviso derivado no tiene fila donde escribir su «leído»: la marca vive
 * aquí mientras la app está abierta. Se pierde al recargar — y es preferible
 * a que tocarlo no haga nada, que era lo que pasaba.
 */
const derivadosLeidos = new Map<string, string>();

/** Las dos aguas juntas, del más nuevo al más viejo. */
function todosLosDe(perfilId: string): AvisoPendiente[] {
  const escritos = fuente.avisos.filter((a) => a.profile_id === perfilId);

  const derivados = avisosDeLosHechos(perfilId, {
    reservas: fuente.reservas,
    viajes: fuente.viajes,
    mensajes: fuente.mensajes,
    nombreDe: (id) => {
      const p = fuente.perfiles.find((x) => x.id === id);
      return p ? `${p.first_name} ${p.last_initial ?? ''}`.trim() : 'Alguien';
    },
    yaCalifico: (reservaId, autorId) =>
      fuente.resenas.some((x) => x.booking_id === reservaId && x.author_id === autorId),
    licencia: { vence: fuente.perfiles.find((p) => p.id === perfilId)?.license_expires_on ?? null },
    ahora: new Date(),
  })
    .filter((d) => !yaEstaEscrito(d, escritos))
    .map((d) => ({ ...d, read_at: derivadosLeidos.get(d.id) ?? null }));

  return [...escritos, ...derivados].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function bandeja(perfilId: string): Promise<Bandeja> {
  const mios = todosLosDe(perfilId).map(comoAviso);

  return demora({
    pideAccion: mios.filter((a) => a.accion),
    paraSaber: mios.filter((a) => !a.accion),
    sinLeer: mios.filter((a) => !a.leido).length,
  });
}

/** Tocar un aviso lo marca leído, y el contador va detrás. */
export async function marcarLeido(avisoId: string): Promise<Aviso | null> {
  const fila = await fuente.marcarAvisoLeido(avisoId);
  if (fila) return demora(comoAviso(fila));
  // No es una fila: es un derivado. La marca se apunta aquí.
  derivadosLeidos.set(avisoId, new Date().toISOString());
  return demora(null);
}

export async function marcarTodo(perfilId: string): Promise<number> {
  const derivados = todosLosDe(perfilId).filter((a) => a.id.startsWith('av-') && !a.read_at);
  const ahora = new Date().toISOString();
  for (const d of derivados) derivadosLeidos.set(d.id, ahora);
  const escritos = await fuente.marcarTodosLeidos(perfilId);
  return demora(escritos + derivados.length);
}

/** Lo que enseña la pantalla bloqueada de `12a`: el aviso más nuevo sin leer. */
export async function avisoDeBloqueo(perfilId: string): Promise<Aviso | null> {
  const uno = todosLosDe(perfilId).find((a) => !a.read_at);
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
