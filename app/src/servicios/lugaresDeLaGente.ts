/**
 * SE SOUVENIR D'UN LIEU QUE QUELQU'UN A ÉCRIT.
 *
 * ───────────────────────────────────────────────────────────────────────
 * OpenStreetMap ne connaît pas « PH Torre Mistral » si personne ne l'a
 * cartographié, et Google ne peut pas combler le trou : ses conditions
 * interdisent de garder ses résultats. Le seul index des points de
 * rendez-vous panaméens qui puisse nous appartenir est celui qu'écrivent
 * ceux qui montent dans les voitures.
 *
 * QUAND ON ÉCRIT. Au moment où quelqu'un s'engage — il publie un trajet,
 * il confirme un point de ramassage — jamais quand il tape. Ce qui monte
 * le rang, c'est l'usage réel, pas la curiosité. C'est la même règle que
 * `bump_place` depuis 0013.
 *
 * CE QUE ÇA NE FAIT PAS. Le lieu écrit reste invisible aux autres jusqu'à
 * ce qu'une DEUXIÈME personne s'en serve : la promotion vit dans la base
 * (migration 0035), pas ici, et le client ne peut pas la déclencher.
 * ───────────────────────────────────────────────────────────────────────
 */

import { supabase } from './_fuente/supabase/cliente';

/**
 * Enregistre un lieu et compte son usage. Ne lève jamais.
 *
 * **Jamais bloquant.** Publier un trajet ne doit pas échouer parce que le
 * catalogue n'a pas pu apprendre un nom. Sans session —la démo, par
 * exemple— la fonction de la base rend `null` et il ne se passe rien.
 */
export async function recordarLugar(
  nombre: string | null | undefined,
  citySlug: string | null | undefined,
  punto?: { lat: number | null; lng: number | null } | null,
): Promise<void> {
  const limpio = (nombre ?? '').trim();
  if (!limpio || !citySlug) return;

  try {
    await supabase.rpc('recordar_lugar' as never, {
      nombre: limpio,
      ciudad: citySlug,
      lat: punto?.lat ?? null,
      lng: punto?.lng ?? null,
    } as never);
  } catch {
    // Le catalogue apprendra la prochaine fois. Rien à dire à personne.
  }
}
