/**
 * LinkedIn au profil — une insigne, pas un privilège.
 *
 * Même philosophie que l'affiliation travail/université : la connexion
 * LinkedIn dit « cette personne assume son identité professionnelle »,
 * elle ne donne aucun droit de plus. On ne copie RIEN du profil LinkedIn
 * dans nos tables — l'OAuth vit dans Supabase Auth (provider
 * `linkedin_oidc`) et nous ne gardons que la date de liaison.
 *
 * `linkIdentity` attache LinkedIn au compte DÉJÀ connecté (OTP SMS) :
 * c'est un ajout d'identité, pas une méthode de connexion parallèle —
 * personne ne se retrouve avec deux comptes.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";

/**
 * Lance la liaison LinkedIn : redirige vers l'OAuth LinkedIn, qui ramène
 * l'utilisateur sur /cuenta/. Nécessite une session Supabase Auth active.
 */
export async function connectLinkedIn(): Promise<{ error: string } | void> {
  const supabase = getSupabase();
  if (!supabase) return { error: "not_configured" };

  const { error } = await supabase.auth.linkIdentity({
    provider: "linkedin_oidc",
    options: {
      redirectTo:
        typeof window !== "undefined" ? window.location.href : undefined,
    },
  });
  if (error) return { error: error.message };
  // Succès : le navigateur part chez LinkedIn, rien à renvoyer.
}

/** L'identité LinkedIn est-elle déjà liée au compte courant ? */
export async function hasLinkedIn(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data } = await supabase.auth.getUserIdentities();
  return Boolean(
    data?.identities?.some((i) => i.provider === "linkedin_oidc"),
  );
}

export { isSupabaseConfigured };
