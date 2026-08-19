/**
 * La verificación de identidad — pantalla `4c` Cédula.
 *
 * Esto no se inventa aquí: la cadena entera ya existe y está viva en el
 * proyecto Supabase, y es la misma que usa el sitio de `partimos/`. Lo único
 * que hacía falta era llamarla desde la app.
 *
 *   app ──(JWT)──▶ didit-start ──(x-api-key)──▶ Didit
 *       ◀── {url} ◀───────────── {session_id, url}
 *
 *   Didit ──(webhook)──▶ didit-webhook ──▶ identity_verifications
 *
 * La llave de Didit vive en los secretos del proyecto, no en el paquete que se
 * descarga al teléfono. La app solo recibe la dirección del recorrido, y del
 * resultado solo lee la referencia del expediente: la cédula, su número y sus
 * fotos no pasan nunca por nosotros.
 */

import { Linking } from 'react-native';

import { supabase } from './_fuente/supabase/cliente';

/** Lo que Didit llama cada documento. */
const TIPO_DE_DOCUMENTO = { cedula: 'ID', licencia: 'DL', vehiculo: 'VEHICLE' } as const;

export type Documento = keyof typeof TIPO_DE_DOCUMENTO;

/**
 * El recorrido alojado por Didit, sin cuenta detrás.
 *
 * Es la salida cuando `didit-start` no puede crear la sesión ligada. Sirve
 * para ver el recorrido, pero el resultado no vuelve a ninguna fila porque
 * Didit no sabe de quién es: por eso `ligada` viaja en la respuesta.
 */
const RECORRIDO_SUELTO = 'https://verify.didit.me/u/0ncF0Zl1TqKN8j-L5H_zTw';

export type Apertura = { url: string; ligada: boolean } | { error: string };

/** Abre la verificación. Ligada a la cuenta si se puede; suelta si no. */
export async function abrirVerificacion(documento: Documento = 'cedula'): Promise<Apertura> {
  const { data, error } = await supabase.functions.invoke<{ url: string }>('didit-start', {
    body: { kind: documento },
  });

  if (!error && data?.url) return { url: data.url, ligada: true };

  // `already_verified` no es un fallo: es que ya está hecho. Vale la pena
  // distinguirlo, porque mandar a alguien ya verificado a verificarse otra vez
  // es la clase de cosa que hace desconfiar de una app.
  const motivo = await leerMotivo(error);
  if (motivo === 'already_verified') return { error: 'ya-verificado' };

  return { url: RECORRIDO_SUELTO, ligada: false };
}

/** El cuerpo del error de una función viene dentro de `context`, no del mensaje. */
async function leerMotivo(error: unknown): Promise<string | null> {
  const contexto = (error as { context?: Response })?.context;
  if (!contexto || typeof contexto.json !== 'function') return null;
  try {
    const cuerpo = (await contexto.clone().json()) as { error?: string; message?: string };
    return cuerpo.error ?? cuerpo.message ?? null;
  } catch {
    return null;
  }
}

export type Estado = 'sin empezar' | 'esperando' | 'verificada' | 'rechazada' | 'vencida';

/** `verification_status` de la base, dicho en el idioma del producto. */
const COMO_SE_DICE: Record<string, Estado> = {
  pending: 'esperando',
  verified: 'verificada',
  rejected: 'rechazada',
  expired: 'vencida',
};

export type Verificacion = { estado: Estado; actualizado: string | null };

/**
 * En qué va la verificación. La fila la escribe el webhook cuando Didit
 * responde, así que entre abrir el recorrido y ver «verificada» pasa un rato:
 * la pantalla vuelve a preguntar, no se queda esperando.
 */
export async function estadoDeVerificacion(
  documento: Documento = 'cedula',
): Promise<Verificacion> {
  const { data, error } = await supabase
    .from('identity_verifications')
    .select('status, updated_at')
    .eq('document_type', TIPO_DE_DOCUMENTO[documento])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return { estado: 'sin empezar', actualizado: null };
  return {
    estado: COMO_SE_DICE[data[0].status] ?? 'sin empezar',
    actualizado: data[0].updated_at ?? null,
  };
}

/** Lleva a la persona al recorrido de Didit, dentro del navegador o del teléfono. */
export async function irAVerificarse(documento: Documento = 'cedula'): Promise<Apertura> {
  const apertura = await abrirVerificacion(documento);
  if ('url' in apertura) await Linking.openURL(apertura.url);
  return apertura;
}
