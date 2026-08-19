-- =====================================================================
--  MIGRATION 0004 — Taux au km par carro réel, et LinkedIn au profil
--
--  1. LE TAUX SUIT LE CARRO, PAS SEULEMENT LA CATÉGORIE.
--     Les trois taux du barème §7 (22/25/32 ¢) sont trois points exacts
--     de la droite  taux = 7,5 + 2,2 × conso(L/100 km) :
--       économico ~6,5 → 22 ; estándar ~8,0 → 25 ; SUV ~11 → 32.
--     Cette migration n'invente donc pas un nouveau barème : elle lit la
--     même droite à l'abscisse du véhicule réel. R1 et R3 intacts — le
--     plafond suit le COÛT, jamais la demande. Le miroir client est
--     src/lib/cars.ts (mêmes constantes, mêmes bornes).
--
--  2. LINKEDIN : une insigne et un filtre, pas un privilège — même
--     philosophie que l'affiliation. On stocke la DATE de connexion,
--     pas le profil LinkedIn : l'OAuth vit dans Supabase Auth
--     (provider linkedin_oidc), pas dans nos tables.
-- =====================================================================

-- ---------------------------------------------------------------------
--  Véhicules : consommation de référence et taux dérivé.
-- ---------------------------------------------------------------------
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS consumption_l_100km numeric(4,1)
    CHECK (consumption_l_100km IS NULL
           OR consumption_l_100km BETWEEN 3 AND 25),
  ADD COLUMN IF NOT EXISTS rate_per_km_cents int
    CHECK (rate_per_km_cents IS NULL
           OR rate_per_km_cents BETWEEN 18 AND 60);

COMMENT ON COLUMN vehicles.consumption_l_100km IS
  'Consommation combinée de référence (approchée), corrigée de l''âge. Sert au calcul du taux, jamais affichée comme mesure certifiée.';
COMMENT ON COLUMN vehicles.rate_per_km_cents IS
  'Taux dérivé : round(7.5 + 2.2 × conso), borné [18, 60]. NULL → le taux de la catégorie s''applique (barème inchangé).';

-- Le taux se calcule en base aussi : une seule formule, deux miroirs.
CREATE OR REPLACE FUNCTION rate_from_consumption(p_l100 numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT LEAST(60, GREATEST(18, ROUND(7.5 + 2.2 * p_l100)::int));
$$;

-- ---------------------------------------------------------------------
--  compute_price_cap : accepte désormais un véhicule précis. La
--  signature historique (catégorie) reste — les CHECK et les clients
--  existants continuent de fonctionner à l'identique.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION compute_price_cap_vehicle(
  p_corridor_id  uuid,
  p_vehicle_id   uuid,
  p_seats        int,
  p_country      char(2) DEFAULT 'PA'
)
RETURNS TABLE (
  rule_id            uuid,
  distance_km        numeric,
  rate_per_km_cents  int,
  toll_cents         bigint,
  cost_total_cents   bigint,
  occupants          int,
  max_price_cents    bigint
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_category text;
  v_rate     int;
BEGIN
  SELECT v.category_code, v.rate_per_km_cents INTO v_category, v_rate
    FROM vehicles v WHERE v.id = p_vehicle_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Véhicule introuvable'; END IF;

  IF v_rate IS NULL THEN
    -- Pas de taux propre : le barème de la catégorie, comme avant.
    RETURN QUERY SELECT * FROM compute_price_cap(p_corridor_id, v_category, p_seats, p_country);
  ELSE
    -- Même formule que compute_price_cap, avec le taux du carro réel.
    RETURN QUERY
    SELECT r.id,
           c.distance_km,
           v_rate,
           c.toll_cents,
           ROUND(c.distance_km * v_rate * (1 + r.detour_tolerance_pct / 100.0))::bigint + c.toll_cents,
           p_seats + CASE WHEN r.divisor_includes_driver THEN 1 ELSE 0 END,
           FLOOR((ROUND(c.distance_km * v_rate * (1 + r.detour_tolerance_pct / 100.0))::bigint + c.toll_cents)
                 / (p_seats + CASE WHEN r.divisor_includes_driver THEN 1 ELSE 0 END)::numeric
                 / r.rounding_cents)::bigint * r.rounding_cents
      FROM price_rules r, corridors c
     WHERE r.country_code = p_country AND r.effective_to IS NULL
       AND c.id = p_corridor_id;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------
--  LinkedIn sur le profil.
-- ---------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS linkedin_connected_at timestamptz;

COMMENT ON COLUMN profiles.linkedin_connected_at IS
  'Date de liaison de l''identité linkedin_oidc (Supabase Auth). On ne copie RIEN du profil LinkedIn — l''insigne dit « connecté », pas qui.';

-- L'insigne est publique, comme l'affiliation : recrée la vue avec le
-- booléen en fin de liste (ajouter en fin = pas de rupture de lecteurs).
CREATE OR REPLACE VIEW public_profiles AS
SELECT id, first_name, last_initial, photo_url, is_id_verified,
       home_city_id, bio, created_at,
       (linkedin_connected_at IS NOT NULL) AS has_linkedin
FROM profiles WHERE is_suspended = false;
