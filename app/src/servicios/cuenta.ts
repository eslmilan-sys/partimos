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
  const { error } = await supabase.auth.resetPasswordForEmail(correo.trim());
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
