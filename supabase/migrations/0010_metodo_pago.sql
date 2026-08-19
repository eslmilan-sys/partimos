-- =====================================================================
--  MIGRATION 0010 — Tarifa par canal + moyen de paiement favori
--
--  Décision produit (2026-08-12) : trois canaux, dans cet ordre —
--  Yappy dans l'app (recommandé), tarjeta dans l'app, efectivo en
--  dernier. La tarifa de servicio devient FIXE PAR CANAL parce qu'elle
--  suit le coût du canal, jamais la demande (R3 intact) :
--
--    · yappy_app : 2,5 %  (Yappy commerçant coûte ~1 %)
--    · card      : 5 %    (les processeurs carte au Panama, ~3,5–4 %)
--    · external  : 0      (efectivo / Yappy directo — gratuit, toujours)
--
--  La marge du service est la même sur les deux canaux en ligne
--  (~1,5 pt) : le canal recommandé est recommandé parce qu'il coûte
--  moins cher à tout le monde, pas parce qu'il rapporte plus.
--  Les trois invariants de la R2 amendée ne bougent pas : l'aporte
--  arrive complet, l'efectivo reste disponible et gratuit, aucun
--  pourcentage ne varie avec la demande.
-- =====================================================================

-- Le pourcentage unique de 0009 laisse place au pourcentage par canal.
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS fee_is_fixed_pct;

ALTER TABLE bookings
  ADD CONSTRAINT fee_is_fixed_pct CHECK (
    CASE payment_channel
      WHEN 'external'  THEN service_fee_cents = 0
      WHEN 'yappy_app' THEN service_fee_cents = ROUND(total_cents * 0.025)
      WHEN 'card'      THEN service_fee_cents = ROUND(total_cents * 0.05)
    END
  );

COMMENT ON COLUMN bookings.payment_channel IS
  'external = efectivo/Yappy directo au conducteur (gratuit). yappy_app = Botón de Pago Yappy, tarifa 2,5 %. card = pasarela certifiée, tarifa 5 %. La tarifa est cobrée au passager ; le conducteur reçoit son aporte complet dans tous les cas.';

-- Le moyen favori, choisi à l'inscription et modifiable dans Mi cuenta.
-- Il PRÉSÉLECTIONNE le canal à la réservation, il ne l'impose jamais :
-- c'est une préférence d'affichage, pas une contrainte de paiement.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_pay_channel payment_channel
    NOT NULL DEFAULT 'yappy_app';

COMMENT ON COLUMN profiles.preferred_pay_channel IS
  'Moyen de paiement favori du passager — présélectionne le canal à la réservation. Les trois canaux restent proposés à chaque reserva.';
