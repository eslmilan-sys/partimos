-- =====================================================================
--  MIGRATION 0005 — L'inventaire des places par tronçon, et la photo
--
--  Le code applicatif (src/lib/segments.ts) compte les places comme une
--  compagnie aérienne : une réservation occupe les tronçons entre sa
--  montée et sa descente, et rien d'autre. Le trigger de 0001, lui,
--  sommait les réservations sur le trajet ENTIER — il aurait refusé un
--  Santiago → David alors que le carro se vide à Santiago.
--
--  Cette migration aligne la base sur le modèle du code. La base reste
--  l'autorité : le trigger corrigé est le seul rempart contre la
--  survente quand deux réservations arrivent en même temps.
-- =====================================================================

-- ---------------------------------------------------------------------
--  1. La réservation porte son intervalle : de quel arrêt à quel arrêt.
--     NULL = tout le trajet (les réservations existantes restent justes).
--     Les bornes se réfèrent à trip_stops.sequence du trajet.
-- ---------------------------------------------------------------------
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS board_sequence  int,
  ADD COLUMN IF NOT EXISTS alight_sequence int,
  ADD CONSTRAINT booking_segment_forward
    CHECK (board_sequence IS NULL OR alight_sequence IS NULL
           OR board_sequence < alight_sequence);

COMMENT ON COLUMN bookings.board_sequence IS
  'Séquence (trip_stops.sequence) de la montée. NULL = origine du trajet.';
COMMENT ON COLUMN bookings.alight_sequence IS
  'Séquence de la descente. NULL = destination du trajet.';

-- ---------------------------------------------------------------------
--  2. Occupation d'un intervalle : le TRONÇON LE PLUS CHARGÉ limite.
--     Miroir SQL de seatsTakenOnSegment() — même logique, mêmes bornes.
--     La somme des réservations, ou le seul tronçon de départ,
--     laisseraient passer une survente au milieu du parcours.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seats_taken_between(
  p_trip_id  uuid,
  p_from_seq int,
  p_to_seq   int,
  p_exclude  uuid DEFAULT NULL
) RETURNS int LANGUAGE sql STABLE AS $$
  SELECT COALESCE(MAX(on_leg), 0)::int
  FROM (
    SELECT SUM(b.seats) AS on_leg
    FROM generate_series(p_from_seq, p_to_seq - 1) AS leg(seq)
    JOIN bookings b
      ON b.trip_id = p_trip_id
     AND b.status IN ('pending', 'confirmed', 'completed')
     AND (p_exclude IS NULL OR b.id <> p_exclude)
     AND COALESCE(b.board_sequence, p_from_seq)  <= leg.seq
     AND COALESCE(b.alight_sequence, p_to_seq)   >  leg.seq
    GROUP BY leg.seq
  ) per_leg;
$$;

-- `seats_taken(trip)` garde sa signature — la vue available_trips et le
-- code existant continuent de l'appeler — mais renvoie désormais le pire
-- tronçon du trajet : « combien de places sont garanties de bout en
-- bout ». Sans arrêts déclarés, comportement de 0001 inchangé.
CREATE OR REPLACE FUNCTION seats_taken(p_trip_id uuid)
RETURNS int LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM trip_stops ts WHERE ts.trip_id = p_trip_id) >= 2
    THEN seats_taken_between(
      p_trip_id,
      (SELECT MIN(ts.sequence) FROM trip_stops ts WHERE ts.trip_id = p_trip_id),
      (SELECT MAX(ts.sequence) FROM trip_stops ts WHERE ts.trip_id = p_trip_id)
    )
    ELSE (
      SELECT COALESCE(SUM(b.seats), 0)::int FROM bookings b
      WHERE b.trip_id = p_trip_id
        AND b.status IN ('pending', 'confirmed', 'completed')
    )
  END;
$$;

-- ---------------------------------------------------------------------
--  3. Le trigger anti-survente, par intervalle. Le FOR UPDATE sur le
--     trajet sérialise les réservations concurrentes, comme en 0001.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_seat_availability()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_offered  int;
  v_from     int;
  v_to       int;
  v_taken    int;
BEGIN
  SELECT seats_offered INTO v_offered
  FROM trips WHERE id = NEW.trip_id FOR UPDATE;

  SELECT MIN(sequence), MAX(sequence) INTO v_from, v_to
  FROM trip_stops WHERE trip_id = NEW.trip_id;

  IF v_from IS NULL THEN
    -- Trajet sans arrêts détaillés : règle de 0001, sur le trajet entier.
    SELECT COALESCE(SUM(seats), 0) INTO v_taken
    FROM bookings
    WHERE trip_id = NEW.trip_id
      AND status IN ('pending', 'confirmed', 'completed')
      AND id <> NEW.id;
  ELSE
    v_taken := seats_taken_between(
      NEW.trip_id,
      COALESCE(NEW.board_sequence, v_from),
      COALESCE(NEW.alight_sequence, v_to),
      NEW.id
    );
  END IF;

  IF v_taken + NEW.seats > v_offered THEN
    RAISE EXCEPTION 'No hay suficientes puestos en ese tramo (ofrecidos: %, tomados: %, solicitados: %)',
      v_offered, v_taken, NEW.seats;
  END IF;
  RETURN NEW;
END;
$$;
-- Le trigger trg_seat_availability de 0001 pointe déjà sur cette
-- fonction : le remplacer suffit, rien d'autre à recâbler.

-- ---------------------------------------------------------------------
--  4. La photo du carro. Le fichier vit dans Storage (bucket `carros`),
--     la table ne garde que le chemin — même philosophie que partout :
--     jamais de blob en table.
-- ---------------------------------------------------------------------
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS photo_path text;

COMMENT ON COLUMN vehicles.photo_path IS
  'Chemin dans le bucket Storage « carros » (public en lecture). Une seule photo, extérieure, du carro réel.';

-- La recherche montre le carro : modèle, année, taux et photo entrent
-- dans la vue (colonnes ajoutées EN FIN — les lecteurs existants ne
-- bougent pas).
CREATE OR REPLACE VIEW available_trips AS
SELECT
  t.id, t.driver_id, t.corridor_id, t.departure_at, t.arrival_estimate_at,
  t.price_cents, t.gender_preference, t.seats_offered,
  t.seats_offered - seats_taken(t.id) AS seats_available,
  c.slug AS corridor_slug, c.distance_km, c.bus_price_cents,
  p.first_name, p.last_initial, p.photo_url, p.is_id_verified,
  v.make, v.model, v.color, v.category_code,
  v.year, v.rate_per_km_cents, v.photo_path
FROM trips t
JOIN corridors c ON c.id = t.corridor_id
JOIN profiles  p ON p.id = t.driver_id
JOIN vehicles  v ON v.id = t.vehicle_id
WHERE t.status = 'published'
  AND t.departure_at > now()
  AND p.is_suspended = false
  AND t.seats_offered - seats_taken(t.id) > 0;

-- Le bucket et ses règles : lecture publique (la photo apparaît dans la
-- recherche), écriture par le propriétaire dans SON dossier <uid>/...
DO $storage$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('carros', 'carros', true)
  ON CONFLICT (id) DO NOTHING;

  CREATE POLICY carros_owner_write ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'carros'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  CREATE POLICY carros_owner_update ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'carros'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;   -- politiques déjà posées
  WHEN undefined_table THEN NULL;    -- environnement sans Storage (tests locaux)
  WHEN insufficient_privilege THEN NULL; -- Storage géré depuis le panneau
END
$storage$;
