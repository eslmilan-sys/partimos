/**
 * El cliente de Supabase. Uno solo para toda la app.
 *
 * La llave es la publicable: no abre nada por sí sola, la que manda es la
 * política RLS de cada tabla. Por eso puede vivir en el paquete que se descarga
 * al teléfono sin que eso sea un agujero.
 *
 * La sesión se guarda en el almacén del teléfono —o en el del navegador cuando
 * la app corre en web— para que entrar sea una vez y no cada vez.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/tipos/base';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.EXPO_PUBLIC_SUPABASE_LLAVE;

if (!URL || !LLAVE) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_LLAVE. Están en .env.example.',
  );
}

export const supabase = createClient<Database>(URL, LLAVE, {
  auth: {
    // En web el almacén es el del navegador y lo pone la propia librería.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // El enlace mágico vuelve con la sesión en la URL; solo en web hay URL.
    detectSessionInUrl: Platform.OS === 'web',
    // `implicit` y no `pkce`, que es el valor por defecto de la librería.
    //
    // Con pkce el enlace vuelve con un código que hay que canjear contra el
    // servidor, y el que empezó la sesión tiene que ser el mismo que la
    // termina —el verificador vive en el navegador que pidió el correo—. Un
    // sitio sin servidor abierto desde el correo, muchas veces en otro
    // navegador, no cumple eso. Con implicit la sesión vuelve entera en el
    // fragmento de la URL y entra sin canje.
    //
    // Es lo que ya usa el sitio de `partimos/`, que funciona. No lo cambiamos.
    flowType: 'implicit',
  },
});
