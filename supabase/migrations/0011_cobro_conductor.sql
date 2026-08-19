-- =====================================================================
--  MIGRATION 0011 — Le conducteur déclare comment il ACCEPTE l'aporte
--
--  Le cobro dans l'app est toujours accepté : l'argent lui arrive en
--  versement (payout_batches), il n'a rien à gérer — c'est l'argument
--  qui séduit le conducteur. Hors app, c'est SON choix : Yappy directo,
--  efectivo, les deux, ou aucun (« solo por la app »).
--
--  Le panneau de réservation lit ces deux booléens pour n'offrir au
--  passager que les canaux que le conducteur accepte — le canal app
--  reste toujours proposé.
-- =====================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accepts_yappy_direct boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_cash boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN profiles.accepts_yappy_direct IS
  'Le conducteur accepte le Yappy directo à son numéro (paiement hors app). Le cobro dans l''app est toujours accepté.';
COMMENT ON COLUMN profiles.accepts_cash IS
  'Le conducteur accepte l''efectivo en main (paiement hors app). Le cobro dans l''app est toujours accepté.';

-- Le viaje fige le réglage du moment de la publication : changer son
-- profil ensuite ne change pas les viajes déjà publiés.
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS accepts_yappy_direct boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_cash boolean NOT NULL DEFAULT true;
