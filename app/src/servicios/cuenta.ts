/**
 * La cuenta — pantallas `1c` (la puerta), `4b`–`4d` (registro), `4e` y `14e`.
 *
 * **Divergencia con el traspaso, decidida.** El diseño dibuja un celular
 * panameño y un código de cuatro cifras por SMS. No hay proveedor de SMS
 * contratado, no hay una sola cuenta de teléfono en la base —las que hay son
 * las cuatro de correo— y mandar mensajes cuesta por mensaje. Así que la
 * cuenta es **correo y contraseña**, que es por donde ya se entra hoy.
 *
 * Lo que el traspaso decidía de verdad no cambia: la cuenta se pide al pedir
 * puesto y no al abrir la app, y en público solo se ve el nombre y la inicial
 * del apellido. Cambia el sobre, no la regla.
 */

import { Platform } from 'react-native';

import * as Linking from 'expo-linking';

import type { Profile } from '@/tipos';

import { supabase } from './_fuente/supabase/cliente';

/** El mínimo que acepta Supabase. Pedir más no lo hace más seguro, lo hace más molesto. */
export const LARGO_MINIMO = 6;

/** Un correo con pinta de correo. La verdad la dice el envío, no esta expresión. */
export const correoValido = (correo: string): boolean =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.trim());

export const contrasenaValida = (clave: string): boolean => clave.length >= LARGO_MINIMO;

/**
 * En público solo se ve el nombre y la inicial del apellido. La regla vive
 * aquí, no en la pantalla: el apellido completo no sale de este servicio.
 */
export function inicialDelApellido(apellido: string): string | null {
  const limpio = apellido.trim();
  return limpio ? `${limpio[0].toUpperCase()}.` : null;
}

/**
 * A dónde vuelve el enlace de confirmación del correo.
 *
 * **Sin esto, el enlace no vuelve aquí.** Supabase manda a la «Site URL» del
 * proyecto, y quien pulsa el enlace acaba donde esa URL apunte — se vio de
 * verdad el 25-08: un amigo confirmó su correo y aterrizó en la DEMO,
 * saludado como «Andrés M.», el conductor simulado.
 *
 * **A la RAÍZ de la app, no a la página exacta.** Antes se mandaba
 * `window.location.href` — `…/app/registro?paso=3` — y esa dirección, con su
 * ruta y su parámetro, tiene que estar en la lista de «Redirect URLs» del
 * proyecto O Supabase la descarta EN SILENCIO y cae en la Site URL. La raíz
 * (`…/app/`) es una sola dirección estable que sí se puede poner en la
 * lista, y el índice hace el resto: detecta la sesión recién confirmada y
 * lleva a buscar. En el teléfono, el esquema de la app.
 *
 * (La lista se edita en el panel de Supabase: Authentication → URL
 * Configuration. Con `…/app/**` en Redirect URLs quedan cubiertas las dos.)
 */
function volverA(): string {
  if (Platform.OS !== 'web') return Linking.createURL('/');
  const base = (process.env.EXPO_BASE_URL ?? '/').replace(/\/?$/, '/');
  return `${window.location.origin}${base}`;
}

export type Fallo =
  | 'correo-invalido'
  | 'contrasena-corta'
  | 'ya-existe'
  | 'no-coincide'
  | 'sin-confirmar'
  | 'demasiados-intentos'
  | 'no-se-pudo';

export type Entrada =
  | { ok: true; dentro: boolean }
  | { ok: false; motivo: Fallo };

/**
 * Crea la cuenta.
 *
 * `dentro: false` no es un fallo: es que el proyecto pide confirmar el correo
 * antes de dejar entrar, y entonces hay un mensaje esperando en la bandeja. La
 * pantalla necesita distinguirlo para decir qué pasa en vez de quedarse quieta.
 */
export async function registrarse(
  correo: string,
  clave: string,
  nombre: string,
  apellido: string,
): Promise<Entrada> {
  if (!correoValido(correo)) return { ok: false, motivo: 'correo-invalido' };
  if (!contrasenaValida(clave)) return { ok: false, motivo: 'contrasena-corta' };

  const { data, error } = await supabase.auth.signUp({
    email: correo.trim(),
    password: clave,
    options: {
      emailRedirectTo: volverA(),
      // El disparador `handle_new_user` lee esto para escribir el perfil, así
      // que el nombre del paso 3 llega a `profiles` sin un segundo viaje.
      data: { first_name: nombre.trim(), last_name: apellido.trim() },
    },
  });

  if (error) return { ok: false, motivo: comoSeLlama(error) };
  return { ok: true, dentro: !!data.session };
}

/** Entra. Sin sesión no hay nada que enseñar, así que el fallo importa. */
export async function entrar(correo: string, clave: string): Promise<Entrada> {
  if (!correoValido(correo)) return { ok: false, motivo: 'correo-invalido' };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo.trim(),
    password: clave,
  });

  if (error) return { ok: false, motivo: comoSeLlama(error) };
  return { ok: true, dentro: !!data.session };
}

/** El correo para volver a poner contraseña, cuando se olvidó. */
export async function olvideLaContrasena(correo: string): Promise<boolean> {
  if (!correoValido(correo)) return false;
  const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
    redirectTo: volverA(),
  });
  return !error;
}

/**
 * Entrar con Google, Facebook o Apple.
 *
 * **No es una maqueta.** El traspaso dibuja los botones y hasta ahora no
 * hacían nada; esto los conecta de verdad. El día que el proveedor esté
 * activado en el proyecto Supabase funcionan sin tocar una línea, y mientras
 * no lo esté la pantalla lo dice —«todavía no está activado»— en vez de
 * quedarse quieta, que es lo que no se podía distinguir de una app rota.
 * (Facebook entró el 26-08-2026, pedido por el dueño.)
 *
 * Vuelve a la misma dirección de la que salió, igual que el correo.
 */
export async function entrarCon(quien: 'google' | 'facebook' | 'apple'): Promise<boolean> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: quien,
    options: { redirectTo: volverA() },
  });
  return !error;
}

export async function salir(): Promise<void> {
  await supabase.auth.signOut();
}

/** Quién está dentro ahora mismo, o `null`. */
export async function quienEs(): Promise<Profile | null> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) return null;
  const { data: perfil } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return perfil ?? null;
}

/** El identificador de quien está dentro, que es lo que casi todo necesita. */
export async function miId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Avisa cada vez que se entra o se sale. Devuelve cómo dejar de escuchar. */
export function alCambiarLaSesion(hacer: (dentro: boolean) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => hacer(!!sesion));
  return () => data.subscription.unsubscribe();
}

/**
 * Los errores de Supabase vienen en inglés y con código. Traducirlos aquí, y no
 * en cada pantalla, es lo que hace que todas digan lo mismo ante lo mismo.
 */
function comoSeLlama(error: { code?: string; status?: number; message: string }): Fallo {
  const codigo = error.code ?? '';
  if (codigo === 'user_already_exists' || /already registered/i.test(error.message)) return 'ya-existe';
  if (codigo === 'invalid_credentials' || error.status === 400) return 'no-coincide';
  if (codigo === 'email_not_confirmed') return 'sin-confirmar';
  if (codigo === 'weak_password') return 'contrasena-corta';
  if (error.status === 429) return 'demasiados-intentos';
  return 'no-se-pudo';
}

/** Lo que la pantalla enseña cuando algo no salió. */
export const QUE_PASO: Record<Fallo, string> = {
  'correo-invalido': 'Ese correo no parece un correo.',
  'contrasena-corta': `La contraseña necesita ${LARGO_MINIMO} caracteres o más.`,
  'ya-existe': 'Ya hay una cuenta con ese correo. Entra en vez de registrarte.',
  'no-coincide': 'El correo o la contraseña no coinciden.',
  'sin-confirmar': 'Falta confirmar el correo. Mira tu bandeja.',
  'demasiados-intentos': 'Demasiados intentos seguidos. Espera un momento.',
  'no-se-pudo': 'No se pudo. Revisa la conexión y vuelve a intentar.',
};

/** Cuando el proveedor no está activado en el proyecto. Se dice, no se calla. */
export const SIN_PROVEEDOR = (quien: string) =>
  `Entrar con ${quien} todavía no está activado. Usa tu correo.`;
