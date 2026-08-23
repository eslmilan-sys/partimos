/**
 * Ce que dit celui qui teste.
 *
 * **Ça ne passe pas par `fuente`.** Tout le reste de l'app lit la source
 * simulée ou la vraie selon `EXPO_PUBLIC_FUENTE` ; un commentaire, lui, doit
 * arriver dans les deux cas — et le lien qu'on envoie aux amis est justement
 * celui de la démo, en données simulées. Un retour écrit dans un tableau en
 * mémoire disparaît au rechargement de la page. Donc : toujours la vraie base,
 * quelle que soit la source des données affichées.
 *
 * Si les clés manquent —quelqu'un qui fait tourner l'app en local sans `.env`—
 * on ne casse rien : la fonction dit qu'elle n'a pas pu, l'écran l'affiche, et
 * l'app continue.
 */

import { Dimensions, Platform } from 'react-native';

import { createClient } from '@supabase/supabase-js';

export type Clase = 'roto' | 'raro' | 'confuso' | 'idea';

export type Comentario = {
  pantalla: string;
  clase: Clase | null;
  texto: string;
  /** Qui écrit, quand il y a une session. Sans elle, personne. */
  quien?: string | null;
};

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.EXPO_PUBLIC_SUPABASE_LLAVE;

/**
 * Un client à part, sans session persistée. Celui de `_fuente/supabase` n'est
 * pas monté en mode simulado, et on ne veut pas qu'écrire un commentaire
 * touche au trousseau ni rafraîchisse un jeton.
 */
const buzon =
  URL && LLAVE
    ? createClient(URL, LLAVE, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

/** Ce qui aide à reproduire, et rien de plus : ni IP, ni identifiant d'appareil. */
function contexto() {
  const { width, height } = Dimensions.get('window');
  return {
    plataforma: Platform.OS,
    ancho: Math.round(width),
    alto: Math.round(height),
    fuente: process.env.EXPO_PUBLIC_FUENTE ?? 'simulado',
  };
}

export async function enviarComentario(c: Comentario): Promise<void> {
  if (!buzon) throw new Error('Sin conexión configurada. Cuéntamelo por mensaje.');

  const texto = c.texto.trim();
  if (!texto) throw new Error('Escribe algo primero.');

  const { error } = await buzon.from('feedback').insert({
    pantalla: c.pantalla.slice(0, 200),
    clase: c.clase,
    // La base borne aussi : ceci évite juste l'aller-retour.
    texto: texto.slice(0, 2000),
    profile_id: c.quien ?? null,
    contexto: contexto(),
  });

  if (error) throw new Error('No se pudo enviar. Prueba otra vez.');
}
