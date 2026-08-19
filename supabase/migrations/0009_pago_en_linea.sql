-- =====================================================================
--  MIGRATION 0009 — Le paiement EN LIGNE devient une option réelle
--
--  Décision produit : le passager choisit. AFUERA (efectivo ou Yappy
--  directo au conducteur), gratuit, toujours disponible — ou EN LA APP
--  (tarjeta ou Yappy), avec une TARIFA DE SERVICIO fixe de 3,5 %
--  cobrée AU PASSAGER pour la réservation protégée.
--
--  La doctrine juridique qui rend cela possible (modèle BlaBlaCar) :
--  la tarifa rémunère le service DIGITAL de réservation — cobro
--  protégé, comprobante, remboursements — jamais le transport. Trois
--  invariants, portés par des contraintes :
--    · le conducteur reçoit son aporte COMPLET (la tarifa est en sus,
--      jamais déduite) — R1 intact ;
--    · payer afuera coûte 0 (CHECK ci-dessous) ;
--    · le pourcentage est FIXE — pas de tarifa dynamique (R3).
--
--  Les tables payments / payout_batches / ledger_entries de 0001
--  attendaient ce jour : rien à créer, tout à brancher.
-- =====================================================================

CREATE TYPE payment_channel AS ENUM ('external', 'card', 'yappy_app');

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_channel payment_channel
    NOT NULL DEFAULT 'external';

-- La tarifa n'existe QUE pour le paiement dans l'app, et elle est de
-- 3,5 % du montant — jamais plus, jamais variable.
ALTER TABLE bookings
  ADD CONSTRAINT fee_only_in_app CHECK (
    (payment_channel = 'external' AND service_fee_cents = 0)
    OR payment_channel <> 'external'
  ),
  ADD CONSTRAINT fee_is_fixed_pct CHECK (
    payment_channel = 'external'
    OR service_fee_cents = ROUND(total_cents * 0.035)
  );

COMMENT ON COLUMN bookings.payment_channel IS
  'external = efectivo/Yappy directo au conducteur (gratuit). card / yappy_app = cobro dans l''app, tarifa de servicio 3,5 % au passager. Le conducteur reçoit son aporte complet dans tous les cas.';
