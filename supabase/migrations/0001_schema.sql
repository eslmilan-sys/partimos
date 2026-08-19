-- =====================================================================
--  SCHÉMA — Plateforme de covoiturage interurbain à frais partagés
--  Postgres 15+ / Supabase
--  Version 1.0
--
--  PRINCIPES DE CONCEPTION (lire avant de modifier)
--  ---------------------------------------------------------------
--  1. L'argent est stocké en CENTIMES (bigint). Jamais de float.
--  2. Le journal comptable (ledger_entries) est IMMUABLE : on insère,
--     on ne met jamais à jour. Les soldes se calculent, ne se stockent pas.
--  3. Le barème de prix est VERSIONNÉ et chaque trajet garde un
--     INSTANTANÉ de la règle appliquée. C'est la pièce maîtresse de la
--     défense juridique : on doit pouvoir prouver, trois ans plus tard,
--     quel plafond s'appliquait à un trajet donné.
--  4. Une seule table de personnes. Conducteur et passager sont des
--     RÔLES contextuels, pas des types d'utilisateur.
--  5. Les places disponibles se DÉRIVENT des réservations. Aucun
--     compteur mutable : c'est la source classique des surréservations.
--  6. Le masquage du numéro de téléphone est une POLITIQUE DE BASE DE
--     DONNÉES (RLS), pas une astuce d'interface. C'est le mécanisme
--     anti-désintermédiation, appliqué au niveau le plus bas.
--  7. Aucune image de cédula n'est stockée. Seulement le RÉSULTAT de la
--     vérification et la référence du prestataire.
-- =====================================================================

-- Sur Supabase, `auth.users` existe déjà et appartient au service
-- d'authentification : personne d'autre n'a le droit d'y écrire. Même
-- `CREATE TABLE IF NOT EXISTS` échoue là-bas (« permission denied for
-- schema auth »), parce que le test de présence demande lui-même le
-- droit de créer. On regarde donc AVANT, et on ne crée que sur un
-- Postgres nu — le cas des tests hors ligne.
DO $auth_bootstrap$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    CREATE SCHEMA IF NOT EXISTS auth;
    -- Les colonnes reprises de Supabase, y compris celles que les vues
    -- de métriques lisent (dernière connexion, méthode d'inscription) :
    -- une doublure qui ment sur sa forme ne sert à rien pour tester.
    CREATE TABLE auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text,
      phone text,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_sign_in_at timestamptz,
      raw_app_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
      raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb
    );
  END IF;
END
$auth_bootstrap$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- auth.uid() est fourni par Supabase. Ce bloc ne le crée que s'il manque,
-- pour permettre d'exécuter et de tester le schéma sur un Postgres nu.
DO $bootstrap$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    EXECUTE $f$
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      'SELECT NULLIF(current_setting(''request.jwt.claim.sub'', true), '''')::uuid'
    $f$;
  END IF;
END
$bootstrap$;

-- =====================================================================
--  1. ÉNUMÉRATIONS
-- =====================================================================

CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');
CREATE TYPE trip_status        AS ENUM ('draft', 'published', 'in_progress', 'completed', 'cancelled');
CREATE TYPE booking_status     AS ENUM ('pending', 'confirmed', 'completed', 'cancelled_passenger', 'cancelled_driver', 'no_show_passenger', 'no_show_driver');
CREATE TYPE payment_status     AS ENUM ('initiated', 'authorized', 'captured', 'failed', 'refunded');
CREATE TYPE payout_status      AS ENUM ('pending', 'sent', 'confirmed', 'failed');
CREATE TYPE stop_kind          AS ENUM ('origin', 'waypoint', 'destination');
CREATE TYPE gender_pref        AS ENUM ('any', 'women_only');
CREATE TYPE ledger_account     AS ENUM (
  'passenger_escrow',   -- argent du passager détenu, non encore acquis
  'driver_payable',     -- dû au conducteur
  'platform_revenue',   -- frais de service acquis à la plateforme
  'platform_tax',       -- ITBMS collecté
  'psp_fees',           -- commission Yappy
  'refunds',
  'promotions'          -- subventions, bons carburant, parrainage
);

-- =====================================================================
--  2. RÉFÉRENTIEL GÉOGRAPHIQUE ET TARIFAIRE
--     Ces tables pilotent à la fois le calcul du plafond ET les pages SEO.
-- =====================================================================

CREATE TABLE cities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code char(2) NOT NULL,                 -- 'PA', 'CR', 'GT'
  name         text NOT NULL,
  slug         text NOT NULL,                    -- 'panama-city', 'chitre'
  province     text,
  lat          numeric(9,6),
  lng          numeric(9,6),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, slug)
);

-- Un corridor = une paire de villes = une page SEO = un jeu de paramètres
-- de prix. C'est l'unité de pilotage du business.
CREATE TABLE corridors (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_city_id        uuid NOT NULL REFERENCES cities(id),
  destination_city_id   uuid NOT NULL REFERENCES cities(id),
  slug                  text NOT NULL UNIQUE,     -- 'panama-chitre' → /viajes/panama-chitre
  distance_km           numeric(6,1) NOT NULL CHECK (distance_km > 0),
  toll_cents            bigint NOT NULL DEFAULT 0 CHECK (toll_cents >= 0),
  typical_duration_min  int,
  bus_price_cents       bigint,                   -- référence pour le prix SUGGÉRÉ (jamais pour le plafond)
  is_priority           boolean NOT NULL DEFAULT false,  -- corridor sous budget publicitaire
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (origin_city_id <> destination_city_id),
  UNIQUE (origin_city_id, destination_city_id)
);

-- Points de prise en charge canoniques. Amorcés à la main, puis enrichis
-- par les points que les passagers proposent (voir booking_stops).
CREATE TABLE pickup_points (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id       uuid NOT NULL REFERENCES cities(id),
  name          text NOT NULL,                    -- 'Costa del Este — Town Center'
  description   text,
  lat           numeric(9,6),
  lng           numeric(9,6),
  is_terminal   boolean NOT NULL DEFAULT false,   -- gare routière : interdit à la publication
  proposals_count int NOT NULL DEFAULT 0,         -- combien de passagers l'ont proposé
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Catégories de véhicule : le taux au km dépend du véhicule.
CREATE TABLE vehicle_categories (
  code              text PRIMARY KEY,             -- 'economy', 'standard', 'suv'
  label_es          text NOT NULL,
  rate_per_km_cents int NOT NULL CHECK (rate_per_km_cents > 0)
);

-- ---------------------------------------------------------------------
--  LE BARÈME — pièce maîtresse juridique.
--  Versionné dans le temps. Jamais modifié en place : on clôt une
--  version et on en ouvre une nouvelle. Chaque trajet référence la
--  version en vigueur au moment de sa publication.
-- ---------------------------------------------------------------------
CREATE TABLE price_rules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code          char(2) NOT NULL,
  version_label         text NOT NULL,             -- 'PA-2027-01'
  -- Formule A : plafond = (km × taux + péages) / (sièges + 1)
  divisor_includes_driver boolean NOT NULL DEFAULT true,   -- le +1. NE JAMAIS passer à false.
  detour_tolerance_pct  numeric(4,2) NOT NULL DEFAULT 10.0,
  max_stops             int NOT NULL DEFAULT 4,
  max_trips_per_week    int NOT NULL DEFAULT 4,    -- garde-fou anti-professionnalisation
  rounding_cents        int NOT NULL DEFAULT 50,   -- arrondi au demi-dollar
  source_reference      text,                      -- source publique du taux au km
  effective_from        timestamptz NOT NULL,
  effective_to          timestamptz,               -- NULL = version en vigueur
  created_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE UNIQUE INDEX one_active_rule_per_country
  ON price_rules (country_code) WHERE effective_to IS NULL;

-- =====================================================================
--  3. IDENTITÉS
--     Une seule table de personnes. « Conducteur » et « passager » sont
--     des rôles contextuels, pas des types d'utilisateur.
-- =====================================================================

CREATE TABLE profiles (
  id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name         text NOT NULL,
  last_initial       text,                        -- affiché : « Ana M. »
  phone              text,                        -- protégé par RLS (voir §8)
  photo_url          text,
  home_city_id       uuid REFERENCES cities(id),
  gender             text,                        -- requis uniquement pour le mode « solo mujeres »
  bio                text,
  is_id_verified     boolean NOT NULL DEFAULT false,
  is_phone_verified  boolean NOT NULL DEFAULT false,
  is_suspended       boolean NOT NULL DEFAULT false,
  suspended_reason   text,
  locale             text NOT NULL DEFAULT 'es',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- KYC : on stocke le RÉSULTAT, jamais l'image de la cédula.
CREATE TABLE identity_verifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider          text NOT NULL,                -- 'truora', 'metamap'
  provider_ref      text NOT NULL,                -- identifiant du dossier chez le prestataire
  status            verification_status NOT NULL DEFAULT 'pending',
  document_country  char(2),
  document_type     text,                         -- 'cedula', 'passport' — le TYPE, pas le numéro
  score             numeric(5,2),
  verified_at       timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
  -- Volontairement absents : numéro de document, image, selfie.
);

CREATE TABLE vehicles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_code  text NOT NULL REFERENCES vehicle_categories(code),
  make           text,
  model          text,
  color          text,
  year           int CHECK (year BETWEEN 1970 AND 2100),
  seats_total    int NOT NULL CHECK (seats_total BETWEEN 2 AND 8),
  plate_last3    text,                            -- 3 derniers caractères seulement
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
--  4. TRAJETS ET ARRÊTS
-- =====================================================================

CREATE TABLE trips (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id           uuid NOT NULL REFERENCES profiles(id),
  vehicle_id          uuid NOT NULL REFERENCES vehicles(id),
  corridor_id         uuid NOT NULL REFERENCES corridors(id),
  departure_at        timestamptz NOT NULL,
  arrival_estimate_at timestamptz,
  seats_offered       int NOT NULL CHECK (seats_offered BETWEEN 1 AND 7),
  price_cents         bigint NOT NULL CHECK (price_cents >= 0),
  gender_preference   gender_pref NOT NULL DEFAULT 'any',
  notes               text,
  status              trip_status NOT NULL DEFAULT 'draft',

  -- INSTANTANÉ DU BARÈME au moment de la publication.
  -- Dénormalisation volontaire : la règle peut changer, la preuve doit
  -- rester figée. C'est ce bloc qu'on présente à un avocat ou à l'ATTT.
  price_rule_id       uuid NOT NULL REFERENCES price_rules(id),
  snap_distance_km    numeric(6,1) NOT NULL,
  snap_rate_per_km_cents int NOT NULL,
  snap_toll_cents     bigint NOT NULL,
  snap_cost_total_cents bigint NOT NULL,
  snap_occupants      int NOT NULL,
  snap_max_price_cents bigint NOT NULL,

  published_at        timestamptz,
  completed_at        timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- LE GARDE-FOU JURIDIQUE, appliqué par la base et non par le code
  -- applicatif : aucun trajet ne peut exister au-dessus de son plafond.
  CONSTRAINT price_within_cap CHECK (price_cents <= snap_max_price_cents)
);

CREATE TABLE trip_stops (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  pickup_point_id uuid REFERENCES pickup_points(id),
  custom_label    text,                            -- si le conducteur saisit un point libre
  kind            stop_kind NOT NULL,
  sequence        int NOT NULL,
  scheduled_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, sequence),
  CHECK (pickup_point_id IS NOT NULL OR custom_label IS NOT NULL)
);

-- =====================================================================
--  5. RÉSERVATIONS
-- =====================================================================

CREATE TABLE bookings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id            uuid NOT NULL REFERENCES trips(id),
  passenger_id       uuid NOT NULL REFERENCES profiles(id),
  seats              int NOT NULL CHECK (seats BETWEEN 1 AND 4),

  -- Montants figés à la réservation. Ne bougent jamais ensuite.
  unit_price_cents   bigint NOT NULL CHECK (unit_price_cents >= 0),
  service_fee_cents  bigint NOT NULL DEFAULT 0 CHECK (service_fee_cents >= 0),
  total_cents        bigint NOT NULL CHECK (total_cents >= 0),

  -- Point de prise en charge choisi, ou proposé par le passager.
  trip_stop_id       uuid REFERENCES trip_stops(id),
  proposed_point     text,                          -- le passager propose son propre point
  proposal_accepted  boolean,                       -- NULL = en attente du conducteur

  status             booking_status NOT NULL DEFAULT 'pending',
  confirmed_at       timestamptz,
  completed_at       timestamptz,
  cancelled_at       timestamptz,
  cancellation_reason text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CHECK (trip_stop_id IS NOT NULL OR proposed_point IS NOT NULL),
  -- Un passager ne réserve qu'une fois par trajet.
  UNIQUE (trip_id, passenger_id)
);

-- Places disponibles : DÉRIVÉES, jamais stockées dans un compteur mutable.
CREATE OR REPLACE FUNCTION seats_taken(p_trip_id uuid)
RETURNS int LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(seats), 0)::int
  FROM bookings
  WHERE trip_id = p_trip_id
    AND status IN ('pending', 'confirmed', 'completed');
$$;

-- Verrouillage du trajet pendant l'insertion : empêche la surréservation
-- quand deux passagers réservent la dernière place simultanément.
CREATE OR REPLACE FUNCTION check_seat_availability()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_offered int;
  v_taken   int;
BEGIN
  SELECT seats_offered INTO v_offered
  FROM trips WHERE id = NEW.trip_id FOR UPDATE;

  SELECT COALESCE(SUM(seats), 0) INTO v_taken
  FROM bookings
  WHERE trip_id = NEW.trip_id
    AND status IN ('pending', 'confirmed', 'completed')
    AND id <> NEW.id;

  IF v_taken + NEW.seats > v_offered THEN
    RAISE EXCEPTION 'No hay suficientes asientos disponibles (ofrecidos: %, tomados: %, solicitados: %)',
      v_offered, v_taken, NEW.seats;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seat_availability
  BEFORE INSERT OR UPDATE OF seats, status ON bookings
  FOR EACH ROW
  WHEN (NEW.status IN ('pending', 'confirmed', 'completed'))
  EXECUTE FUNCTION check_seat_availability();

-- =====================================================================
--  6. ARGENT — journal immuable
--     Chaque mouvement écrit DEUX lignes minimum, dont la somme est nulle.
--     On n'UPDATE jamais. Les soldes sont des SELECT.
-- =====================================================================

CREATE TABLE payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL REFERENCES bookings(id),
  provider         text NOT NULL DEFAULT 'yappy',
  provider_ref     text,                            -- transactionId Yappy
  provider_order_id text,                           -- orderId envoyé au bouton de paiement
  amount_cents     bigint NOT NULL CHECK (amount_cents > 0),
  fee_cents        bigint NOT NULL DEFAULT 0,        -- commission Yappy (1 % + ITBMS)
  status           payment_status NOT NULL DEFAULT 'initiated',
  raw_payload      jsonb,                           -- réponse brute, pour audit
  captured_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref)
);

-- Versements aux conducteurs. Au pilote : lots hebdomadaires manuels.
-- La table est identique quand on automatisera : seul le remplissage change.
CREATE TABLE payout_batches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start  date NOT NULL,
  period_end    date NOT NULL,
  status        payout_status NOT NULL DEFAULT 'pending',
  executed_at   timestamptz,
  executed_by   uuid REFERENCES profiles(id),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payouts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      uuid REFERENCES payout_batches(id),
  driver_id     uuid NOT NULL REFERENCES profiles(id),
  amount_cents  bigint NOT NULL CHECK (amount_cents > 0),
  method        text NOT NULL DEFAULT 'yappy_p2p',
  provider_ref  text,
  status        payout_status NOT NULL DEFAULT 'pending',
  sent_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- LE JOURNAL. Immuable par politique et par trigger.
CREATE TABLE ledger_entries (
  id            bigserial PRIMARY KEY,
  entry_group   uuid NOT NULL,                     -- lie les lignes d'une même écriture
  account       ledger_account NOT NULL,
  profile_id    uuid REFERENCES profiles(id),      -- NULL pour les comptes de la plateforme
  booking_id    uuid REFERENCES bookings(id),
  payment_id    uuid REFERENCES payments(id),
  payout_id     uuid REFERENCES payouts(id),
  amount_cents  bigint NOT NULL,                   -- signé : + débit, − crédit
  currency      char(3) NOT NULL DEFAULT 'USD',
  description   text NOT NULL,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION forbid_ledger_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Le journal comptable est immuable. Écrivez une écriture de contrepassation.';
END;
$$;

CREATE TRIGGER trg_ledger_immutable
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION forbid_ledger_mutation();

-- Chaque écriture doit s'équilibrer à zéro.
CREATE OR REPLACE FUNCTION assert_balanced(p_group uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_sum bigint;
BEGIN
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_sum
  FROM ledger_entries WHERE entry_group = p_group;
  IF v_sum <> 0 THEN
    RAISE EXCEPTION 'Écriture déséquilibrée (groupe %) : somme = %', p_group, v_sum;
  END IF;
END;
$$;

-- Solde d'un conducteur : calculé, jamais stocké.
CREATE OR REPLACE FUNCTION driver_balance_cents(p_driver_id uuid)
RETURNS bigint LANGUAGE sql STABLE AS $$
  SELECT COALESCE(-SUM(amount_cents), 0)::bigint
  FROM ledger_entries
  WHERE account = 'driver_payable' AND profile_id = p_driver_id;
$$;

-- =====================================================================
--  7. CONFIANCE, MESSAGERIE, SIGNAUX DE CROISSANCE
-- =====================================================================

CREATE TABLE reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid NOT NULL REFERENCES bookings(id),
  author_id    uuid NOT NULL REFERENCES profiles(id),
  subject_id   uuid NOT NULL REFERENCES profiles(id),
  rating       int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, author_id),
  CHECK (author_id <> subject_id)
);

-- Messagerie interne : le numéro reste masqué, donc la conversation
-- doit vivre ici. C'est une brique anti-désintermédiation, pas un confort.
CREATE TABLE messages (
  id           bigserial PRIMARY KEY,
  booking_id   uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL REFERENCES profiles(id),
  body         text NOT NULL,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE incidents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid REFERENCES bookings(id),
  reporter_id   uuid REFERENCES profiles(id),
  subject_id    uuid REFERENCES profiles(id),
  severity      int NOT NULL CHECK (severity BETWEEN 1 AND 5),
  category      text NOT NULL,
  description   text,
  resolved_at   timestamptz,
  resolution    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
--  BOUCLE 2 — la table la plus sous-estimée du schéma.
--  Chaque recherche qui ne trouve rien est une ligne. C'est à la fois
--  le déclencheur d'alerte aux conducteurs ET la donnée qui dit quel
--  corridor ouvrir ensuite. La plupart des équipes ne journalisent pas
--  les recherches infructueuses et se privent de leur meilleur signal.
-- ---------------------------------------------------------------------
CREATE TABLE demand_signals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id       uuid REFERENCES corridors(id),
  origin_city_id    uuid REFERENCES cities(id),
  destination_city_id uuid REFERENCES cities(id),
  searcher_id       uuid REFERENCES profiles(id),   -- NULL si visiteur anonyme
  requested_date    date NOT NULL,
  seats_wanted      int NOT NULL DEFAULT 1,
  results_count     int NOT NULL DEFAULT 0,
  notified_drivers  int NOT NULL DEFAULT 0,
  converted_booking_id uuid REFERENCES bookings(id),
  source            text,                           -- 'seo', 'paid', 'direct'
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Suivi de l'activation conducteur : le KPI de la Porte 2.
CREATE TABLE driver_activation (
  profile_id            uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  signed_up_at          timestamptz NOT NULL,
  acquisition_source    text,                       -- 'meta', 'google', 'seo', 'referral'
  acquisition_cost_cents bigint,
  first_trip_published_at timestamptz,
  first_trip_completed_at timestamptz,
  trips_published_count int NOT NULL DEFAULT 0
);

-- =====================================================================
--  8. CALCUL DU PLAFOND — Formule A
--     plafond = (km × taux véhicule + péages) / (sièges + 1)
--     Le « + 1 » est le conducteur. NE JAMAIS le retirer : sans lui,
--     le conducteur voyage gratuitement, donc il gagne quelque chose,
--     donc ce n'est plus un partage de frais.
-- =====================================================================

CREATE OR REPLACE FUNCTION compute_price_cap(
  p_corridor_id  uuid,
  p_category     text,
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
  r_rule   price_rules%ROWTYPE;
  v_dist   numeric;
  v_toll   bigint;
  v_rate   int;
  v_cost   bigint;
  v_occ    int;
  v_cap    bigint;
BEGIN
  SELECT * INTO r_rule FROM price_rules
   WHERE country_code = p_country AND effective_to IS NULL
   LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aucun barème en vigueur pour %', p_country; END IF;

  SELECT c.distance_km, c.toll_cents INTO v_dist, v_toll
    FROM corridors c WHERE c.id = p_corridor_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Corridor introuvable'; END IF;

  SELECT vc.rate_per_km_cents INTO v_rate
    FROM vehicle_categories vc WHERE vc.code = p_category;
  IF NOT FOUND THEN RAISE EXCEPTION 'Catégorie de véhicule inconnue : %', p_category; END IF;

  -- tolérance de détour intégrée au coût, jamais facturée au passager
  v_cost := ROUND(v_dist * v_rate * (1 + r_rule.detour_tolerance_pct / 100.0)) + v_toll;
  v_occ  := p_seats + CASE WHEN r_rule.divisor_includes_driver THEN 1 ELSE 0 END;
  v_cap  := FLOOR((v_cost::numeric / v_occ) / r_rule.rounding_cents) * r_rule.rounding_cents;

  RETURN QUERY SELECT r_rule.id, v_dist, v_rate, v_toll, v_cost, v_occ, v_cap;
END;
$$;

-- =====================================================================
--  9. VUES
-- =====================================================================

-- Trajets réservables. Le prix suggéré (fourchette Formule C) est calculé
-- ici et non stocké : il est commercial, donc révisable sans toucher
-- à l'historique juridique.
CREATE VIEW available_trips AS
SELECT
  t.id, t.driver_id, t.corridor_id, t.departure_at, t.arrival_estimate_at,
  t.price_cents, t.gender_preference, t.seats_offered,
  t.seats_offered - seats_taken(t.id) AS seats_available,
  c.slug AS corridor_slug, c.distance_km, c.bus_price_cents,
  p.first_name, p.last_initial, p.photo_url, p.is_id_verified,
  v.make, v.model, v.color, v.category_code
FROM trips t
JOIN corridors c ON c.id = t.corridor_id
JOIN profiles  p ON p.id = t.driver_id
JOIN vehicles  v ON v.id = t.vehicle_id
WHERE t.status = 'published'
  AND t.departure_at > now()
  AND p.is_suspended = false
  AND t.seats_offered - seats_taken(t.id) > 0;

-- Note de conception : cette vue appelle seats_taken() par ligne. C'est
-- acceptable jusqu'à quelques milliers de trajets actifs. Au-delà,
-- remplacer par une vue matérialisée rafraîchie sur écriture de booking.

CREATE VIEW driver_ratings AS
SELECT subject_id AS profile_id,
       ROUND(AVG(rating)::numeric, 2) AS avg_rating,
       COUNT(*) AS reviews_count
FROM reviews GROUP BY subject_id;

-- Tableau de bord par corridor — les indicateurs se lisent corridor par
-- corridor, jamais en moyenne nationale.
CREATE VIEW corridor_health AS
SELECT
  c.slug,
  c.is_priority,
  COUNT(DISTINCT t.id)                                     AS trips_published,
  COUNT(DISTINCT t.driver_id)                              AS active_drivers,
  COALESCE(SUM(b.seats) FILTER (WHERE b.status IN ('confirmed','completed')), 0) AS seats_sold,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.results_count = 0) AS unserved_searches,
  CASE WHEN COUNT(DISTINCT ds.id) > 0
       THEN ROUND(100.0 * COUNT(DISTINCT ds.id) FILTER (WHERE ds.results_count > 0)
            / COUNT(DISTINCT ds.id), 1)
  END                                                       AS match_rate_pct
FROM corridors c
LEFT JOIN trips t  ON t.corridor_id = c.id AND t.created_at > now() - interval '30 days'
LEFT JOIN bookings b ON b.trip_id = t.id
LEFT JOIN demand_signals ds ON ds.corridor_id = c.id AND ds.created_at > now() - interval '30 days'
GROUP BY c.slug, c.is_priority;

-- =====================================================================
--  10. INDEX
-- =====================================================================

CREATE INDEX idx_trips_search      ON trips (corridor_id, departure_at) WHERE status = 'published';
CREATE INDEX idx_trips_driver      ON trips (driver_id, departure_at DESC);
CREATE INDEX idx_bookings_trip     ON bookings (trip_id) WHERE status IN ('pending','confirmed','completed');
CREATE INDEX idx_bookings_passenger ON bookings (passenger_id, created_at DESC);
CREATE INDEX idx_ledger_account    ON ledger_entries (account, profile_id, occurred_at);
CREATE INDEX idx_ledger_group      ON ledger_entries (entry_group);
CREATE INDEX idx_demand_corridor   ON demand_signals (corridor_id, requested_date) WHERE results_count = 0;
CREATE INDEX idx_messages_booking  ON messages (booking_id, created_at);
CREATE INDEX idx_stops_trip        ON trip_stops (trip_id, sequence);

-- =====================================================================
--  11. SÉCURITÉ AU NIVEAU LIGNE (RLS)
--      Le masquage du numéro de téléphone est appliqué ICI, au niveau
--      le plus bas. Aucune erreur de code frontend ne peut le contourner.
-- =====================================================================

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Profil : lecture publique du strict nécessaire via la vue publique.
CREATE VIEW public_profiles AS
SELECT id, first_name, last_initial, photo_url, is_id_verified, home_city_id, bio, created_at
FROM profiles WHERE is_suspended = false;

-- Chacun lit et modifie son propre profil complet (téléphone compris).
CREATE POLICY own_profile_select ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY own_profile_update ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Le numéro du conducteur n'est lisible qu'après une réservation confirmée.
-- C'est LE mécanisme anti-désintermédiation.
CREATE POLICY phone_visible_after_booking ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN trips t ON t.id = b.trip_id
      WHERE b.status IN ('confirmed','completed')
        AND (
          (t.driver_id = profiles.id AND b.passenger_id = auth.uid())
          OR (b.passenger_id = profiles.id AND t.driver_id = auth.uid())
        )
    )
  );

CREATE POLICY trips_public_read ON trips
  FOR SELECT USING (status = 'published' OR driver_id = auth.uid());
CREATE POLICY trips_owner_write ON trips
  FOR ALL USING (driver_id = auth.uid()) WITH CHECK (driver_id = auth.uid());

CREATE POLICY bookings_parties_only ON bookings
  FOR SELECT USING (
    passenger_id = auth.uid()
    OR EXISTS (SELECT 1 FROM trips t WHERE t.id = bookings.trip_id AND t.driver_id = auth.uid())
  );

CREATE POLICY messages_parties_only ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b JOIN trips t ON t.id = b.trip_id
      WHERE b.id = messages.booking_id
        AND (b.passenger_id = auth.uid() OR t.driver_id = auth.uid())
    )
  );

-- Le journal n'est jamais lisible par les utilisateurs finaux.
CREATE POLICY ledger_no_client_access ON ledger_entries FOR SELECT USING (false);
CREATE POLICY kyc_own_only ON identity_verifications
  FOR SELECT USING (profile_id = auth.uid());

-- =====================================================================
--  12. AMORÇAGE — barème et corridors du Panama
-- =====================================================================

INSERT INTO vehicle_categories (code, label_es, rate_per_km_cents) VALUES
  ('economy',  'Económico (sedán pequeño)', 22),
  ('standard', 'Estándar (sedán / crossover)', 25),
  ('suv',      'SUV o pick-up', 32);

INSERT INTO price_rules (country_code, version_label, effective_from, source_reference)
VALUES ('PA', 'PA-2026-01', now(),
        'À compléter : barème public de coût kilométrique validé par conseil juridique');

INSERT INTO cities (country_code, name, slug, province, lat, lng) VALUES
  ('PA','Ciudad de Panamá','panama-city','Panamá',8.9824,-79.5199),
  ('PA','Chitré','chitre','Herrera',7.9614,-80.4297),
  ('PA','Las Tablas','las-tablas','Los Santos',7.7667,-80.2833),
  ('PA','David','david','Chiriquí',8.4333,-82.4333),
  ('PA','Santiago','santiago','Veraguas',8.1000,-80.9833),
  ('PA','Penonomé','penonome','Coclé',8.5194,-80.3572),
  ('PA','Coronado','coronado','Panamá Oeste',8.5333,-79.9500);

INSERT INTO corridors (origin_city_id, destination_city_id, slug, distance_km, toll_cents, typical_duration_min, bus_price_cents, is_priority)
SELECT o.id, d.id, v.slug, v.km, v.toll, v.dur, v.bus, v.prio
FROM (VALUES
  ('panama-city','chitre',     'panama-chitre',     250.0, 300::bigint, 220, 900::bigint,  true),
  ('panama-city','las-tablas', 'panama-las-tablas', 285.0, 300,         245, 1050,         true),
  ('panama-city','coronado',   'panama-coronado',    85.0, 200,          75,  450,         true),
  ('panama-city','david',      'panama-david',      440.0, 300,         390, 2100,         false),
  ('panama-city','santiago',   'panama-santiago',   250.0, 300,         210,  950,         false),
  ('panama-city','penonome',   'panama-penonome',   145.0, 300,         120,  600,         false)
) AS v(o_slug, d_slug, slug, km, toll, dur, bus, prio)
JOIN cities o ON o.slug = v.o_slug
JOIN cities d ON d.slug = v.d_slug;
-- =====================================================================
--  EXTENSION — ANNULATIONS, REMBOURSEMENTS, ABSENCES
--  À appliquer après schema.sql
--
--  PRINCIPE DIRECTEUR
--  L'annulation d'un conducteur et celle d'un passager ne sont pas
--  symétriques et ne doivent jamais être traitées comme telles :
--   · un conducteur qui annule laisse 3 personnes au bord de la route
--     à 5 h du matin, souvent sans alternative ;
--   · un passager qui annule fait perdre une part de frais partagés.
--
--  Et une contrainte juridique : la plateforme ne SANCTIONNE jamais
--  financièrement un conducteur. Une pénalité facturée créerait une
--  relation commerciale entre la plateforme et lui — exactement ce que
--  tout le reste du modèle s'emploie à éviter. La conséquence est
--  réputationnelle, jamais monétaire.
-- =====================================================================

CREATE TYPE cancel_party AS ENUM ('passenger', 'driver', 'platform', 'system');
CREATE TYPE refund_status AS ENUM ('pending', 'issued', 'failed');

-- Politique versionnée, sur le même principe que price_rules.
CREATE TABLE cancellation_policies (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code            char(2) NOT NULL,
  version_label           text NOT NULL,
  -- Passager : trois paliers
  full_refund_hours       int NOT NULL DEFAULT 24,   -- au-delà : remboursement intégral
  partial_refund_hours    int NOT NULL DEFAULT 2,    -- entre les deux : aporte remboursé, service retenu
  late_retain_pct         int NOT NULL DEFAULT 50,   -- en deçà : part de l'aporte retenue
  -- Tolérance : annulations sans conséquence, sans justification demandée
  free_cancels_count      int NOT NULL DEFAULT 2,
  free_cancels_window_days int NOT NULL DEFAULT 180,
  -- Conducteur : jamais de pénalité monétaire
  driver_goodwill_hours   int NOT NULL DEFAULT 6,    -- annulation tardive → geste commercial au passager
  driver_goodwill_pct     int NOT NULL DEFAULT 20,   -- en crédit sur le prochain trajet
  driver_suspend_count    int NOT NULL DEFAULT 3,    -- annulations tardives avant suspension de publication
  driver_suspend_window_days int NOT NULL DEFAULT 90,
  no_show_wait_minutes    int NOT NULL DEFAULT 10,
  effective_from          timestamptz NOT NULL,
  effective_to            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CHECK (partial_refund_hours < full_refund_hours),
  CHECK (late_retain_pct BETWEEN 0 AND 100)
);
CREATE UNIQUE INDEX one_active_cancel_policy
  ON cancellation_policies (country_code) WHERE effective_to IS NULL;

-- Journal des annulations. Une ligne par annulation, immuable de fait.
CREATE TABLE cancellations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id         uuid REFERENCES bookings(id),
  trip_id            uuid REFERENCES trips(id),
  cancelled_by       cancel_party NOT NULL,
  actor_id           uuid REFERENCES profiles(id),
  policy_id          uuid NOT NULL REFERENCES cancellation_policies(id),
  hours_before       numeric(7,2) NOT NULL,
  reason_code        text,
  reason_free_text   text,
  -- Instantané du calcul, figé comme pour le barème de prix
  snap_total_cents   bigint NOT NULL,
  snap_refund_cents  bigint NOT NULL,
  snap_retained_cents bigint NOT NULL,
  snap_goodwill_cents bigint NOT NULL DEFAULT 0,
  was_free_cancel    boolean NOT NULL DEFAULT false,
  -- La retenue n'est versée au conducteur que si le siège n'est pas revendu
  seat_resold        boolean NOT NULL DEFAULT false,
  resolved_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (booking_id IS NOT NULL OR trip_id IS NOT NULL)
);

CREATE TABLE refunds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cancellation_id uuid NOT NULL REFERENCES cancellations(id),
  payment_id    uuid REFERENCES payments(id),
  amount_cents  bigint NOT NULL CHECK (amount_cents > 0),
  status        refund_status NOT NULL DEFAULT 'pending',
  provider_ref  text,
  issued_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Crédits (gestes commerciaux, parrainage). Jamais convertibles en argent.
CREATE TABLE credits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES profiles(id),
  amount_cents  bigint NOT NULL CHECK (amount_cents > 0),
  origin        text NOT NULL,
  cancellation_id uuid REFERENCES cancellations(id),
  consumed_booking_id uuid REFERENCES bookings(id),
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE no_show_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES bookings(id),
  reported_by   cancel_party NOT NULL,
  reporter_id   uuid NOT NULL REFERENCES profiles(id),
  waited_minutes int,
  reporter_lat  numeric(9,6),
  reporter_lng  numeric(9,6),
  disputed      boolean NOT NULL DEFAULT false,
  resolution    text,
  resolved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reported_by)
);

-- ---------------------------------------------------------------------
--  CALCUL DU REMBOURSEMENT
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION compute_refund(
  p_booking_id uuid,
  p_by         cancel_party,
  p_at         timestamptz DEFAULT now()
)
RETURNS TABLE (
  policy_id       uuid,
  hours_before    numeric,
  tier            text,
  refund_cents    bigint,
  retained_cents  bigint,
  goodwill_cents  bigint,
  is_free_cancel  boolean
)
LANGUAGE plpgsql STABLE AS $fn$
DECLARE
  r_pol  cancellation_policies%ROWTYPE;
  r_bk   bookings%ROWTYPE;
  v_dep  timestamptz;
  v_h    numeric;
  v_used int;
  v_free boolean := false;
  v_ref  bigint; v_ret bigint; v_gw bigint := 0;
  v_tier text;
BEGIN
  SELECT * INTO r_bk FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Réservation introuvable'; END IF;

  SELECT t.departure_at INTO v_dep FROM trips t WHERE t.id = r_bk.trip_id;
  v_h := EXTRACT(EPOCH FROM (v_dep - p_at)) / 3600.0;

  SELECT * INTO r_pol FROM cancellation_policies
   WHERE country_code = 'PA' AND effective_to IS NULL LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aucune politique d''annulation en vigueur'; END IF;

  IF p_by = 'driver' OR p_by = 'platform' THEN
    -- Le passager est toujours intégralement remboursé. Toujours.
    v_ref  := r_bk.total_cents;
    v_ret  := 0;
    v_tier := 'driver_cancel_full_refund';
    IF v_h < r_pol.driver_goodwill_hours THEN
      v_gw := ROUND(r_bk.total_cents * r_pol.driver_goodwill_pct / 100.0);
      v_tier := 'driver_cancel_late_goodwill';
    END IF;
  ELSE
    -- Tolérance : annulations sans conséquence sur la fenêtre glissante
    SELECT count(*) INTO v_used FROM cancellations c
      JOIN bookings b ON b.id = c.booking_id
     WHERE b.passenger_id = r_bk.passenger_id
       AND c.cancelled_by = 'passenger'
       AND c.was_free_cancel = true
       AND c.created_at > p_at - (r_pol.free_cancels_window_days || ' days')::interval;
    v_free := v_used < r_pol.free_cancels_count;

    IF v_h >= r_pol.full_refund_hours OR v_free THEN
      v_ref := r_bk.total_cents; v_ret := 0;
      v_tier := CASE WHEN v_h >= r_pol.full_refund_hours THEN 'early_full' ELSE 'free_allowance' END;
      v_free := (v_h < r_pol.full_refund_hours);   -- ne consomme la tolérance que si elle a servi
    ELSIF v_h >= r_pol.partial_refund_hours THEN
      v_ref := r_bk.unit_price_cents * r_bk.seats;   -- aporte remboursé
      v_ret := r_bk.service_fee_cents;               -- frais de service retenus
      v_tier := 'mid_aporte_refunded';
    ELSE
      v_ret := ROUND(r_bk.unit_price_cents * r_bk.seats * r_pol.late_retain_pct / 100.0)
               + r_bk.service_fee_cents;
      v_ref := r_bk.total_cents - v_ret;
      v_tier := 'late_partial';
    END IF;
  END IF;

  RETURN QUERY SELECT r_pol.id, ROUND(v_h,2), v_tier, v_ref, v_ret, v_gw, v_free;
END;
$fn$;

-- Fiabilité du conducteur : réputationnelle, jamais monétaire.
CREATE OR REPLACE VIEW driver_reliability AS
SELECT
  t.driver_id,
  count(*) FILTER (WHERE t.status = 'completed')                          AS trips_completed,
  count(*) FILTER (WHERE c.cancelled_by = 'driver')                       AS cancellations,
  count(*) FILTER (WHERE c.cancelled_by = 'driver' AND c.hours_before < 6) AS late_cancellations,
  CASE WHEN count(*) >= 5
       THEN ROUND(100.0 * count(*) FILTER (WHERE c.cancelled_by='driver') / count(*), 1)
  END AS cancel_rate_pct,
  -- Suspension automatique de la publication au-delà du seuil
  (count(*) FILTER (WHERE c.cancelled_by = 'driver'
                      AND c.hours_before < 6
                      AND c.created_at > now() - interval '90 days') >= 3) AS publish_blocked
FROM trips t
LEFT JOIN cancellations c ON c.trip_id = t.id
GROUP BY t.driver_id;

-- =====================================================================
--  OPTIMISATIONS DU SCHÉMA EXISTANT
-- =====================================================================

-- 1. available_trips appelait seats_taken() ligne par ligne (N+1).
--    Remplacé par une agrégation unique en jointure latérale.
DROP VIEW IF EXISTS available_trips;
CREATE VIEW available_trips AS
SELECT
  t.id, t.driver_id, t.corridor_id, t.departure_at, t.arrival_estimate_at,
  t.price_cents, t.gender_preference, t.seats_offered,
  t.seats_offered - bk.taken AS seats_available,
  c.slug AS corridor_slug, c.distance_km, c.bus_price_cents,
  p.first_name, p.last_initial, p.photo_url, p.is_id_verified,
  v.make, v.model, v.color, v.category_code
FROM trips t
JOIN corridors c ON c.id = t.corridor_id
JOIN profiles  p ON p.id = t.driver_id
JOIN vehicles  v ON v.id = t.vehicle_id
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(b.seats),0)::int AS taken
  FROM bookings b
  WHERE b.trip_id = t.id AND b.status IN ('pending','confirmed','completed')
) bk ON true
WHERE t.status = 'published'
  AND t.departure_at > now()
  AND p.is_suspended = false
  AND t.seats_offered - bk.taken > 0;

-- 2. L'équilibre des écritures était vérifié par appel manuel.
--    Désormais garanti par une contrainte différée : impossible de
--    valider une transaction contenant une écriture déséquilibrée.
CREATE OR REPLACE FUNCTION check_ledger_balance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_sum bigint;
BEGIN
  SELECT COALESCE(SUM(amount_cents),0) INTO v_sum
  FROM ledger_entries WHERE entry_group = NEW.entry_group;
  IF v_sum <> 0 THEN
    RAISE EXCEPTION 'Écriture déséquilibrée (groupe %) : somme = %', NEW.entry_group, v_sum;
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER trg_ledger_balanced
  AFTER INSERT ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_ledger_balance();

-- 3. Index manquants relevés à la relecture
CREATE INDEX idx_cancel_booking   ON cancellations (booking_id);
CREATE INDEX idx_cancel_driver    ON cancellations (trip_id, cancelled_by, created_at);
CREATE INDEX idx_credits_active   ON credits (profile_id) WHERE consumed_booking_id IS NULL;
CREATE INDEX idx_payments_booking ON payments (booking_id);
CREATE INDEX idx_reviews_subject  ON reviews (subject_id);
CREATE INDEX idx_trips_corridor_status ON trips (corridor_id, status, departure_at);

-- 4. Amorçage de la politique
INSERT INTO cancellation_policies (country_code, version_label, effective_from)
VALUES ('PA', 'PA-CANCEL-2026-01', now());
