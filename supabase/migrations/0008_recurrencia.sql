-- =====================================================================
--  MIGRATION 0008 — Les viajes récurrents (diario / semanal / mensual)
--
--  Le trajet du lundi est souvent celui de TOUS les lundis. La
--  récurrence est un PATRON de publication, pas un nouveau type de
--  viaje : à chaque échéance, une occurrence est créée comme un viaje
--  ORDINAIRE (son instantané de barème, ses réservations, son
--  annulation à elle). C'est ce qui garde toutes les règles intactes —
--  R1/R3 se vérifient viaje par viaje, et annuler mardi ne touche pas
--  mercredi.
-- =====================================================================

CREATE TYPE trip_recurrence AS ENUM ('none', 'daily', 'weekly', 'monthly');

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS recurrence trip_recurrence NOT NULL DEFAULT 'none',
  -- L'occurrence pointe vers le viaje « modèle » qui l'a engendrée.
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES trips(id);

COMMENT ON COLUMN trips.recurrence IS
  'Patron de répétition déclaré à la publication. Les occurrences sont créées comme des viajes ordinaires.';
COMMENT ON COLUMN trips.recurrence_parent_id IS
  'Viaje modèle dont cette occurrence est issue. NULL = viaje unique ou modèle lui-même.';

CREATE INDEX IF NOT EXISTS idx_trips_recurrence_parent
  ON trips (recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;
