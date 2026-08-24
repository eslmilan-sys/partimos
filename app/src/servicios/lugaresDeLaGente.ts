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
 * CE QU'ON NE GARDE PAS. Un nom sans coordonnées. Décidé le 24-08-2026 :
 * « on n'a pas l'adresse et il n'y a pas de carte pour placer un point ».
 * Un lieu inconnu qui arrive en texte nu n'entre donc pas au catalogue —
 * il continue de vivre dans `trips.origin_label`, où il sert au trajet
 * sans que tout le pays le cherche. Migration 0036.
 *
 * CE QUE ÇA NE FAIT PAS. Le lieu retenu reste invisible aux autres jusqu'à
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

  /* La base refuse déjà de créer un lieu sans point — mais autant ne pas
     l'appeler pour rien : sans coordonnées, l'appel ne peut que compter
     l'usage d'un lieu qui existe déjà, et le nom seul ne le prouve pas. */
  const situado = Number.isFinite(punto?.lat) && Number.isFinite(punto?.lng);

  try {
    await supabase.rpc('recordar_lugar' as never, {
      nombre: limpio,
      ciudad: citySlug,
      lat: situado ? punto?.lat : null,
      lng: situado ? punto?.lng : null,
    } as never);
  } catch {
    // Le catalogue apprendra la prochaine fois. Rien à dire à personne.
  }
}
