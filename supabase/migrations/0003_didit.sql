-- =====================================================================
--  MIGRATION 0003 — Vérification d'identité via Didit
--
--  Le prestataire est choisi : Didit (https://didit.me). Le schéma 0001
--  avait prévu la table `identity_verifications` pour « un prestataire
--  externe » sans en nommer un ; cette migration ajoute uniquement ce que
--  le branchement concret exige — rien de plus.
--
--  La règle R6 reste la loi : Didit voit la cédula, nous ne voyons que le
--  verdict. Cette table ne reçoit JAMAIS de numéro de document, d'image ni
--  de selfie — les fonctions Edge (supabase/functions/) n'en extraient pas
--  du webhook, et le schéma n'a pas de colonne pour les accueillir.
-- =====================================================================

-- Le webhook retrouve le dossier par sa référence prestataire. Unique :
-- une session Didit = un dossier chez nous, et l'écriture du webhook
-- devient idempotente (Didit ré-émet les événements en cas de doute).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_kyc_provider_ref
  ON identity_verifications (provider, provider_ref);

-- L'état d'un dossier change (pending → verified/rejected/expired) ; la
-- table de 0001 n'avait que `created_at`. On date aussi la mise à jour.
ALTER TABLE identity_verifications
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------
--  Le badge `profiles.is_id_verified` suit la table des dossiers tout
--  seul. Le calcul vit dans la base : ni le webhook ni aucun code client
--  ne peut oublier de le mettre à jour, ni le mettre à jour de travers.
--  Un profil est vérifié s'il possède AU MOINS UN dossier `verified` non
--  expiré — la révocation (dossier repassé à rejected/expired) retire le
--  badge par le même chemin.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_profile_id_verified() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target uuid := COALESCE(NEW.profile_id, OLD.profile_id);
BEGIN
  UPDATE profiles SET
    is_id_verified = EXISTS (
      SELECT 1 FROM identity_verifications v
      WHERE v.profile_id = target
        AND v.status = 'verified'
        AND (v.expires_at IS NULL OR v.expires_at > now())
    ),
    updated_at = now()
  WHERE id = target;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_id_verified ON identity_verifications;
CREATE TRIGGER trg_sync_id_verified
  AFTER INSERT OR UPDATE OF status, expires_at OR DELETE
  ON identity_verifications
  FOR EACH ROW EXECUTE FUNCTION sync_profile_id_verified();
