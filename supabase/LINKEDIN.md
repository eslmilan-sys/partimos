# LinkedIn au profil — Supabase Auth

L'insigne LinkedIn suit la même philosophie que l'affiliation : elle dit
« cette personne assume son identité professionnelle », elle ne donne
aucun privilège. On ne copie **rien** du profil LinkedIn — l'OAuth vit
dans Supabase Auth, et nos tables ne gardent que
`profiles.linkedin_connected_at` (migration 0004).

## Configuration ⛔ (tes comptes, je ne peux pas les faire)

1. **LinkedIn Developers** (<https://developer.linkedin.com>) : crée une
   app, active le produit « Sign In with LinkedIn using OpenID Connect »,
   note *Client ID* et *Client Secret*.
2. Dans l'app LinkedIn, ajoute l'URL de redirection :
   `https://<ref-projet>.supabase.co/auth/v1/callback`
3. **Supabase** → Authentication → Providers → **LinkedIn (OIDC)** :
   colle Client ID + Secret, active.
4. C'est tout côté code : le bouton « Conectar » de l'onglet *Mi perfil*
   appelle `supabase.auth.linkIdentity({ provider: "linkedin_oidc" })` —
   il attache LinkedIn au compte déjà connecté par OTP, il ne crée pas de
   compte parallèle.

## Marquer la date côté profil

`linkIdentity` enregistre l'identité dans `auth.identities`. Pour que le
badge public (`public_profiles.has_linkedin`) s'allume, renseigne
`profiles.linkedin_connected_at` — le plus simple est un trigger sur
`auth.identities` (à créer quand Supabase Auth sera activé) ou un appel
côté client après le retour d'OAuth :

```sql
-- Exemple de trigger (à adapter une fois Auth en service) :
CREATE OR REPLACE FUNCTION sync_linkedin_badge() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.provider = 'linkedin_oidc' THEN
    UPDATE profiles SET linkedin_connected_at = now(), updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_linkedin_badge
  AFTER INSERT ON auth.identities
  FOR EACH ROW EXECUTE FUNCTION sync_linkedin_badge();
```

Comme pour Didit : nécessite une vraie session Supabase Auth (OTP SMS),
la démo `localStorage` ne suffit pas.
