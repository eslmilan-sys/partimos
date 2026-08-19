-- =====================================================================
--  MIGRATION 0006 — L'offre du passager, et les points exacts
--
--  1. L'OFFRE DE PRIX. Le passager peut proposer MOINS que l'aporte
--     publié ; le conducteur accepte ou refuse. La borne est une
--     contrainte, pas une politesse d'interface : offrir PLUS serait
--     enchérir, donc un prix qui suit la demande — exactement ce que la
--     règle R3 interdit. Vers le bas, c'est une négociation entre
--     particuliers qui partagent un coût.
--
--  2. LES POINTS EXACTS. Le conducteur déclare d'où il part vraiment et
--     jusqu'où il va : ce sont les trip_stops kind='origin'/'destination'
--     avec leur custom_label — AUCUNE colonne à ajouter, le schéma de
--     0001 les portait déjà. Le passager propose son point
--     (bookings.proposed_point, déjà là aussi) et le conducteur répond
--     (proposal_accepted). Cette migration ne fait qu'ajouter l'offre —
--     et ce commentaire, pour que personne ne cherche des colonnes qui
--     existent déjà.
-- =====================================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS offer_price_cents bigint
    CHECK (offer_price_cents IS NULL OR offer_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS offer_accepted boolean;

-- La borne R3 : jamais au-dessus du prix figé à la réservation.
-- (unit_price_cents est lui-même ≤ au plafond par price_within_cap.)
ALTER TABLE bookings
  ADD CONSTRAINT offer_never_above_price
    CHECK (offer_price_cents IS NULL
           OR offer_price_cents <= unit_price_cents);

COMMENT ON COLUMN bookings.offer_price_cents IS
  'Offre du passager, en centimes. NULL = paie l''aporte publié. Toujours ≤ unit_price_cents : enchérir n''existe pas (R3).';
COMMENT ON COLUMN bookings.offer_accepted IS
  'Réponse du conducteur à l''offre. NULL = en attente. Refus = la réservation reste possible à l''aporte publié.';
