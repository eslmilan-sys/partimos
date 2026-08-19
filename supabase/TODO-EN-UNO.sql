-- PARTIMOS — TODA LA BASE, DE UNA VEZ
--
-- Pégalo entero en: panel de Supabase → SQL Editor → New query → Run.
-- Son las 19 migraciones en orden.
--
-- SE PUEDE RELANZAR. Si se corta a la mitad, si ya se aplicó, si se
-- pega dos veces: no pasa nada. Cada objeto se crea solo si falta.
--
-- Probado en las dos situaciones y DOS VECES seguidas: Postgres 16 +
-- PostGIS limpio, y una copia de las condiciones de Supabase (esquema
-- auth ajeno y bloqueado, extensiones en `extensions`).
--
-- Generado desde supabase/migrations/ por scripts/build-sql-unico.mjs.

-- ═══════════════════════════════════════════════════════════
-- 0001_schema.sql
-- ═══════════════════════════════════════════════════════════
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
    CREATE TABLE IF NOT EXISTS auth.users (
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
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      'SELECT NULLIF(current_setting(''request.jwt.claim.sub'', true), '''')::uuid'
    $f$;
  END IF;
END
$bootstrap$;

-- =====================================================================
--  1. ÉNUMÉRATIONS
-- =====================================================================

DO $idem$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
DO $idem$ BEGIN
  CREATE TYPE trip_status        AS ENUM ('draft', 'published', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
DO $idem$ BEGIN
  CREATE TYPE booking_status     AS ENUM ('pending', 'confirmed', 'completed', 'cancelled_passenger', 'cancelled_driver', 'no_show_passenger', 'no_show_driver');
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
DO $idem$ BEGIN
  CREATE TYPE payment_status     AS ENUM ('initiated', 'authorized', 'captured', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
DO $idem$ BEGIN
  CREATE TYPE payout_status      AS ENUM ('pending', 'sent', 'confirmed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
DO $idem$ BEGIN
  CREATE TYPE stop_kind          AS ENUM ('origin', 'waypoint', 'destination');
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
DO $idem$ BEGIN
  CREATE TYPE gender_pref        AS ENUM ('any', 'women_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
DO $idem$ BEGIN
  CREATE TYPE ledger_account     AS ENUM (
    'passenger_escrow',   -- argent du passager détenu, non encore acquis
    'driver_payable',     -- dû au conducteur
    'platform_revenue',   -- frais de service acquis à la plateforme
    'platform_tax',       -- ITBMS collecté
    'psp_fees',           -- commission Yappy
    'refunds',
    'promotions'          -- subventions, bons carburant, parrainage
  );
  
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
-- =====================================================================
--  2. RÉFÉRENTIEL GÉOGRAPHIQUE ET TARIFAIRE
--     Ces tables pilotent à la fois le calcul du plafond ET les pages SEO.
-- =====================================================================

CREATE TABLE IF NOT EXISTS cities (
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
CREATE TABLE IF NOT EXISTS corridors (
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
CREATE TABLE IF NOT EXISTS pickup_points (
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
CREATE TABLE IF NOT EXISTS vehicle_categories (
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
CREATE TABLE IF NOT EXISTS price_rules (
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
CREATE UNIQUE INDEX IF NOT EXISTS one_active_rule_per_country
  ON price_rules (country_code) WHERE effective_to IS NULL;

-- =====================================================================
--  3. IDENTITÉS
--     Une seule table de personnes. « Conducteur » et « passager » sont
--     des rôles contextuels, pas des types d'utilisateur.
-- =====================================================================

CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS identity_verifications (
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

CREATE TABLE IF NOT EXISTS vehicles (
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

CREATE TABLE IF NOT EXISTS trips (
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

CREATE TABLE IF NOT EXISTS trip_stops (
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

CREATE TABLE IF NOT EXISTS bookings (
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

DROP TRIGGER IF EXISTS trg_seat_availability ON bookings;

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

CREATE TABLE IF NOT EXISTS payments (
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
CREATE TABLE IF NOT EXISTS payout_batches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start  date NOT NULL,
  period_end    date NOT NULL,
  status        payout_status NOT NULL DEFAULT 'pending',
  executed_at   timestamptz,
  executed_by   uuid REFERENCES profiles(id),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payouts (
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
CREATE TABLE IF NOT EXISTS ledger_entries (
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

DROP TRIGGER IF EXISTS trg_ledger_immutable ON ledger_entries;

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

CREATE TABLE IF NOT EXISTS reviews (
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
CREATE TABLE IF NOT EXISTS messages (
  id           bigserial PRIMARY KEY,
  booking_id   uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL REFERENCES profiles(id),
  body         text NOT NULL,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
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
CREATE TABLE IF NOT EXISTS demand_signals (
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
CREATE TABLE IF NOT EXISTS driver_activation (
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
DROP VIEW IF EXISTS available_trips CASCADE;
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

DROP VIEW IF EXISTS driver_ratings CASCADE;

CREATE VIEW driver_ratings AS
SELECT subject_id AS profile_id,
       ROUND(AVG(rating)::numeric, 2) AS avg_rating,
       COUNT(*) AS reviews_count
FROM reviews GROUP BY subject_id;

-- Tableau de bord par corridor — les indicateurs se lisent corridor par
-- corridor, jamais en moyenne nationale.
DROP VIEW IF EXISTS corridor_health CASCADE;
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

CREATE INDEX IF NOT EXISTS idx_trips_search      ON trips (corridor_id, departure_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_trips_driver      ON trips (driver_id, departure_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_trip     ON bookings (trip_id) WHERE status IN ('pending','confirmed','completed');
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings (passenger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_account    ON ledger_entries (account, profile_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_ledger_group      ON ledger_entries (entry_group);
CREATE INDEX IF NOT EXISTS idx_demand_corridor   ON demand_signals (corridor_id, requested_date) WHERE results_count = 0;
CREATE INDEX IF NOT EXISTS idx_messages_booking  ON messages (booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stops_trip        ON trip_stops (trip_id, sequence);

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
DROP VIEW IF EXISTS public_profiles CASCADE;
CREATE VIEW public_profiles AS
SELECT id, first_name, last_initial, photo_url, is_id_verified, home_city_id, bio, created_at
FROM profiles WHERE is_suspended = false;

-- Chacun lit et modifie son propre profil complet (téléphone compris).
DROP POLICY IF EXISTS own_profile_select ON profiles;
CREATE POLICY own_profile_select ON profiles
  FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS own_profile_update ON profiles;
CREATE POLICY own_profile_update ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Le numéro du conducteur n'est lisible qu'après une réservation confirmée.
-- C'est LE mécanisme anti-désintermédiation.
DROP POLICY IF EXISTS phone_visible_after_booking ON profiles;
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

DROP POLICY IF EXISTS trips_public_read ON trips;

CREATE POLICY trips_public_read ON trips
  FOR SELECT USING (status = 'published' OR driver_id = auth.uid());
DROP POLICY IF EXISTS trips_owner_write ON trips;
CREATE POLICY trips_owner_write ON trips
  FOR ALL USING (driver_id = auth.uid()) WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS bookings_parties_only ON bookings;

CREATE POLICY bookings_parties_only ON bookings
  FOR SELECT USING (
    passenger_id = auth.uid()
    OR EXISTS (SELECT 1 FROM trips t WHERE t.id = bookings.trip_id AND t.driver_id = auth.uid())
  );

DROP POLICY IF EXISTS messages_parties_only ON messages;

CREATE POLICY messages_parties_only ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b JOIN trips t ON t.id = b.trip_id
      WHERE b.id = messages.booking_id
        AND (b.passenger_id = auth.uid() OR t.driver_id = auth.uid())
    )
  );

-- Le journal n'est jamais lisible par les utilisateurs finaux.
DROP POLICY IF EXISTS ledger_no_client_access ON ledger_entries;
CREATE POLICY ledger_no_client_access ON ledger_entries FOR SELECT USING (false);
DROP POLICY IF EXISTS kyc_own_only ON identity_verifications;
CREATE POLICY kyc_own_only ON identity_verifications
  FOR SELECT USING (profile_id = auth.uid());

-- =====================================================================
--  12. AMORÇAGE — barème et corridors du Panama
-- =====================================================================

INSERT INTO vehicle_categories (code, label_es, rate_per_km_cents) VALUES
  ('economy',  'Económico (sedán pequeño)', 22),
  ('standard', 'Estándar (sedán / crossover)', 25),
  ('suv',      'SUV o pick-up', 32)
ON CONFLICT (code) DO NOTHING;

INSERT INTO price_rules (country_code, version_label, effective_from, source_reference)
VALUES ('PA', 'PA-2026-01', now(),
        'À compléter : barème public de coût kilométrique validé par conseil juridique')
ON CONFLICT DO NOTHING;

INSERT INTO cities (country_code, name, slug, province, lat, lng) VALUES
  ('PA','Ciudad de Panamá','panama-city','Panamá',8.9824,-79.5199),
  ('PA','Chitré','chitre','Herrera',7.9614,-80.4297),
  ('PA','Las Tablas','las-tablas','Los Santos',7.7667,-80.2833),
  ('PA','David','david','Chiriquí',8.4333,-82.4333),
  ('PA','Santiago','santiago','Veraguas',8.1000,-80.9833),
  ('PA','Penonomé','penonome','Coclé',8.5194,-80.3572),
  ('PA','Coronado','coronado','Panamá Oeste',8.5333,-79.9500)
ON CONFLICT (country_code, slug) DO NOTHING;

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
JOIN cities d ON d.slug = v.d_slug
ON CONFLICT (slug) DO NOTHING;
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

DO $idem$ BEGIN
  CREATE TYPE cancel_party AS ENUM ('passenger', 'driver', 'platform', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
DO $idem$ BEGIN
  CREATE TYPE refund_status AS ENUM ('pending', 'issued', 'failed');
  
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
-- Politique versionnée, sur le même principe que price_rules.
CREATE TABLE IF NOT EXISTS cancellation_policies (
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
CREATE UNIQUE INDEX IF NOT EXISTS one_active_cancel_policy
  ON cancellation_policies (country_code) WHERE effective_to IS NULL;

-- Journal des annulations. Une ligne par annulation, immuable de fait.
CREATE TABLE IF NOT EXISTS cancellations (
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

CREATE TABLE IF NOT EXISTS refunds (
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
CREATE TABLE IF NOT EXISTS credits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES profiles(id),
  amount_cents  bigint NOT NULL CHECK (amount_cents > 0),
  origin        text NOT NULL,
  cancellation_id uuid REFERENCES cancellations(id),
  consumed_booking_id uuid REFERENCES bookings(id),
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS no_show_reports (
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
DROP VIEW IF EXISTS driver_reliability CASCADE;
CREATE VIEW driver_reliability AS
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
DROP VIEW IF EXISTS available_trips CASCADE;
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
DROP TRIGGER IF EXISTS trg_ledger_balanced ON ledger_entries;
CREATE CONSTRAINT TRIGGER trg_ledger_balanced
  AFTER INSERT ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_ledger_balance();

-- 3. Index manquants relevés à la relecture
CREATE INDEX IF NOT EXISTS idx_cancel_booking   ON cancellations (booking_id);
CREATE INDEX IF NOT EXISTS idx_cancel_driver    ON cancellations (trip_id, cancelled_by, created_at);
CREATE INDEX IF NOT EXISTS idx_credits_active   ON credits (profile_id) WHERE consumed_booking_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_subject  ON reviews (subject_id);
CREATE INDEX IF NOT EXISTS idx_trips_corridor_status ON trips (corridor_id, status, departure_at);

-- 4. Amorçage de la politique
INSERT INTO cancellation_policies (country_code, version_label, effective_from)
VALUES ('PA', 'PA-CANCEL-2026-01', now())
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- 0002_waitlist.sql
-- ═══════════════════════════════════════════════════════════
-- =====================================================================
--  MIGRATION 0002 — Préinscription (liste d'attente)
--
--  `schema.sql` s'applique tel quel, sans modification (§4 du brief). Cette
--  migration s'ajoute par-dessus.
--
--  Pourquoi une table séparée de `demand_signals` :
--  `demand_signals` est une table d'ANALYSE — on la lit en agrégat, on la
--  garde longtemps, elle alimente `corridor_health`. Un numéro de téléphone
--  est une DONNÉE PERSONNELLE : durée de conservation différente, droit à
--  l'effacement, accès plus restreint. Les mélanger obligerait à traiter
--  toute la table d'analyse comme un fichier de données personnelles.
--
--  On les relie, on ne les fusionne pas.
-- =====================================================================

CREATE TABLE IF NOT EXISTS waitlist_signals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_signal_id  uuid NOT NULL REFERENCES demand_signals(id) ON DELETE CASCADE,
  phone             text NOT NULL,              -- E.164, ex. +50761234567
  locale            text NOT NULL DEFAULT 'es',
  -- Renseignés quand l'alerte part effectivement
  notified_at       timestamptz,
  converted_at      timestamptz,
  unsubscribed_at   timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_pending
  ON waitlist_signals (demand_signal_id)
  WHERE notified_at IS NULL AND unsubscribed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_waitlist_phone
  ON waitlist_signals (phone, created_at DESC);

-- Le même numéro ne s'inscrit qu'une fois par signal de demande.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_waitlist_signal_phone
  ON waitlist_signals (demand_signal_id, phone);

-- ---------------------------------------------------------------------
--  RLS : aucune lecture ni écriture par un client. La table n'est
--  accessible qu'à la clé de service, côté serveur. Activer RLS sans
--  déclarer de politique de SELECT revient à tout refuser — c'est
--  l'intention, et on l'écrit explicitement pour que ce soit relisible.
-- ---------------------------------------------------------------------
ALTER TABLE waitlist_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS waitlist_no_client_access ON waitlist_signals;
DROP POLICY IF EXISTS waitlist_no_client_access ON waitlist_signals;
CREATE POLICY waitlist_no_client_access ON waitlist_signals
  FOR SELECT USING (false);

-- ---------------------------------------------------------------------
--  Les recherches infructueuses d'un corridor, regroupées par date.
--  C'est la requête qui déclenche l'alerte aux conducteurs :
--  « 3 personas buscan Panamá → Chitré el viernes ».
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS pending_demand CASCADE;
CREATE VIEW pending_demand AS
SELECT
  ds.corridor_id,
  c.slug            AS corridor_slug,
  ds.requested_date,
  count(*)          AS searches,
  sum(ds.seats_wanted) AS seats_wanted,
  count(w.id) FILTER (WHERE w.notified_at IS NULL
                        AND w.unsubscribed_at IS NULL) AS contacts_pending
FROM demand_signals ds
LEFT JOIN corridors c ON c.id = ds.corridor_id
LEFT JOIN waitlist_signals w ON w.demand_signal_id = ds.id
WHERE ds.results_count = 0
  AND ds.requested_date >= current_date
GROUP BY ds.corridor_id, c.slug, ds.requested_date;


-- ═══════════════════════════════════════════════════════════
-- 0003_didit.sql
-- ═══════════════════════════════════════════════════════════
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
DROP TRIGGER IF EXISTS trg_sync_id_verified ON identity_verifications;
CREATE TRIGGER trg_sync_id_verified
  AFTER INSERT OR UPDATE OF status, expires_at OR DELETE
  ON identity_verifications
  FOR EACH ROW EXECUTE FUNCTION sync_profile_id_verified();


-- ═══════════════════════════════════════════════════════════
-- 0004_car_rate_linkedin.sql
-- ═══════════════════════════════════════════════════════════
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
DROP VIEW IF EXISTS public_profiles CASCADE;
CREATE VIEW public_profiles AS
SELECT id, first_name, last_initial, photo_url, is_id_verified,
       home_city_id, bio, created_at,
       (linkedin_connected_at IS NOT NULL) AS has_linkedin
FROM profiles WHERE is_suspended = false;


-- ═══════════════════════════════════════════════════════════
-- 0005_segment_inventory.sql
-- ═══════════════════════════════════════════════════════════
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
DO $idem$ BEGIN
  ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS board_sequence  int,
    ADD COLUMN IF NOT EXISTS alight_sequence int,
    ADD CONSTRAINT booking_segment_forward
      CHECK (board_sequence IS NULL OR alight_sequence IS NULL
             OR board_sequence < alight_sequence);
  
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $idem$;
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
DROP VIEW IF EXISTS available_trips CASCADE;
CREATE VIEW available_trips AS
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

  DROP POLICY IF EXISTS carros_owner_write ON storage.objects;

  CREATE POLICY carros_owner_write ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'carros'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  DROP POLICY IF EXISTS carros_owner_update ON storage.objects;
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


-- ═══════════════════════════════════════════════════════════
-- 0006_ofertas_puntos.sql
-- ═══════════════════════════════════════════════════════════
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
DO $idem$ BEGIN
  ALTER TABLE bookings
    ADD CONSTRAINT offer_never_above_price
      CHECK (offer_price_cents IS NULL
             OR offer_price_cents <= unit_price_cents);
  
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $idem$;
COMMENT ON COLUMN bookings.offer_price_cents IS
  'Offre du passager, en centimes. NULL = paie l''aporte publié. Toujours ≤ unit_price_cents : enchérir n''existe pas (R3).';
COMMENT ON COLUMN bookings.offer_accepted IS
  'Réponse du conducteur à l''offre. NULL = en attente. Refus = la réservation reste possible à l''aporte publié.';


-- ═══════════════════════════════════════════════════════════
-- 0007_calificacion_criterios.sql
-- ═══════════════════════════════════════════════════════════
-- =====================================================================
--  MIGRATION 0007 — La calification du conducteur passe à cinq critères
--
--  Une note unique dit « bien » ou « mal » ; cinq critères disent QUOI.
--  Puntualidad, manejo, trato, carro, punto de encuentro — les cinq
--  moments où un trajet se gagne. La colonne `rating` de 0001 reste la
--  note GLOBALE (moyenne), pour que tout ce qui la lit continue de
--  marcher tel quel.
--
--  Volontairement absent : un critère « prix ». Le tope est la règle de
--  la plateforme, pas un mérite du conducteur — le noter réintroduirait
--  la pression tarifaire par la petite porte (R3).
--  Miroir client : src/lib/ratings.ts.
-- =====================================================================

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS puntualidad smallint
    CHECK (puntualidad IS NULL OR puntualidad BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS manejo smallint
    CHECK (manejo IS NULL OR manejo BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS trato smallint
    CHECK (trato IS NULL OR trato BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS carro smallint
    CHECK (carro IS NULL OR carro BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS encuentro smallint
    CHECK (encuentro IS NULL OR encuentro BETWEEN 1 AND 5);

COMMENT ON COLUMN reviews.puntualidad IS '¿Salió a la hora que publicó?';
COMMENT ON COLUMN reviews.manejo IS '¿Manejó con calma y sin sustos?';
COMMENT ON COLUMN reviews.trato IS '¿Fue amable y respetuoso?';
COMMENT ON COLUMN reviews.carro IS '¿El carro estaba limpio y era el registrado?';
COMMENT ON COLUMN reviews.encuentro IS '¿Llegó al punto acordado?';

-- Les moyennes par critère, à côté de la moyenne globale existante.
DROP VIEW IF EXISTS driver_ratings CASCADE;
CREATE VIEW driver_ratings AS
SELECT subject_id AS profile_id,
       ROUND(AVG(rating)::numeric, 2) AS avg_rating,
       COUNT(*) AS reviews_count,
       ROUND(AVG(puntualidad)::numeric, 2) AS avg_puntualidad,
       ROUND(AVG(manejo)::numeric, 2) AS avg_manejo,
       ROUND(AVG(trato)::numeric, 2) AS avg_trato,
       ROUND(AVG(carro)::numeric, 2) AS avg_carro,
       ROUND(AVG(encuentro)::numeric, 2) AS avg_encuentro
FROM reviews GROUP BY subject_id;


-- ═══════════════════════════════════════════════════════════
-- 0008_recurrencia.sql
-- ═══════════════════════════════════════════════════════════
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

DO $idem$ BEGIN
  CREATE TYPE trip_recurrence AS ENUM ('none', 'daily', 'weekly', 'monthly');
  
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
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


-- ═══════════════════════════════════════════════════════════
-- 0009_pago_en_linea.sql
-- ═══════════════════════════════════════════════════════════
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

DO $idem$ BEGIN
  CREATE TYPE payment_channel AS ENUM ('external', 'card', 'yappy_app');
  
EXCEPTION WHEN duplicate_object THEN NULL; END $idem$;
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_channel payment_channel
    NOT NULL DEFAULT 'external';

-- La tarifa n'existe QUE pour le paiement dans l'app, et elle est de
-- 3,5 % du montant — jamais plus, jamais variable.
DO $idem$ BEGIN
  ALTER TABLE bookings
    ADD CONSTRAINT fee_only_in_app CHECK (
      (payment_channel = 'external' AND service_fee_cents = 0)
      OR payment_channel <> 'external'
    ),
    ADD CONSTRAINT fee_is_fixed_pct CHECK (
      payment_channel = 'external'
      OR service_fee_cents = ROUND(total_cents * 0.035)
    );
  
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $idem$;
COMMENT ON COLUMN bookings.payment_channel IS
  'external = efectivo/Yappy directo au conducteur (gratuit). card / yappy_app = cobro dans l''app, tarifa de servicio 3,5 % au passager. Le conducteur reçoit son aporte complet dans tous les cas.';


-- ═══════════════════════════════════════════════════════════
-- 0010_metodo_pago.sql
-- ═══════════════════════════════════════════════════════════
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

DO $idem$ BEGIN
  ALTER TABLE bookings
    ADD CONSTRAINT fee_is_fixed_pct CHECK (
      CASE payment_channel
        WHEN 'external'  THEN service_fee_cents = 0
        WHEN 'yappy_app' THEN service_fee_cents = ROUND(total_cents * 0.025)
        WHEN 'card'      THEN service_fee_cents = ROUND(total_cents * 0.05)
      END
    );
  
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $idem$;
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


-- ═══════════════════════════════════════════════════════════
-- 0011_cobro_conductor.sql
-- ═══════════════════════════════════════════════════════════
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


-- ═══════════════════════════════════════════════════════════
-- 0012_rutinas.sql
-- ═══════════════════════════════════════════════════════════
-- =====================================================================
--  MIGRATION 0012 — La rutina : le trajet qui revient chaque semaine
--
--  Le mécanisme d'habitude de la plateforme : un utilisateur déclare
--  UNE fois son trajet récurrent (villes, jours, heure). Elle sert à :
--    · republier ou rechercher en un toque depuis Mi cuenta ;
--    · plus tard, les alertes WhatsApp (« salió un puesto en tu
--      rutina ») et le matching conducteur ↔ passagers réguliers.
--  Le prix ne s'en mêle jamais : la rutina est une préférence de
--  parcours, pas une entrée du calcul (R3).
-- =====================================================================

CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_city_id uuid NOT NULL REFERENCES cities(id),
  to_city_id uuid NOT NULL REFERENCES cities(id),
  -- Jours ISO : 1 = lundi … 7 = dimanche.
  days smallint[] NOT NULL CHECK (days <@ ARRAY[1,2,3,4,5,6,7]::smallint[]
                                  AND array_length(days, 1) >= 1),
  departure_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_city_id <> to_city_id),
  -- Une rutina par sens et par personne : la modifier, pas l'empiler.
  UNIQUE (profile_id, from_city_id, to_city_id)
);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routines_own ON routines;

CREATE POLICY routines_own ON routines
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());


-- ═══════════════════════════════════════════════════════════
-- 0013_lugares.sql
-- ═══════════════════════════════════════════════════════════
-- 0013 — NUESTRA PROPIA BASE DE LUGARES
--
-- Por qué existe
-- ==============
-- Hoy el buscador de direcciones llama a un geocodificador externo en cada
-- tecla: es lento, se corta sin señal, cuesta por petición y — sobre todo —
-- no encuentra lo que la gente escribe de verdad en Panamá («PH Torre
-- Mistral», «la bomba de Divisa», «entrada de Villa Lucre»). Además, sus
-- términos NO permiten guardar los resultados: Google prohíbe almacenar
-- todo salvo el place_id, y Mapbox solo tolera una caché temporal. O sea:
-- no se puede «bajar Google y guardarlo».
--
-- Lo que sí se puede, y es lo que hace esta tabla:
--   1. OpenStreetMap (extracto de Panamá, Geofabrik) — licencia ODbL:
--      libre de copiar, transformar y servir, con atribución «© OpenStreetMap
--      contributors» y share-alike sobre la base derivada.
--   2. Overture Maps (places) — licencia CDLA-Permissive 2.0, aún más
--      libre; sus buildings vienen de OSM y siguen ODbL.
--   3. LO NUESTRO: cada punto exacto que un usuario escribe y confirma
--      entra aquí. Es la parte que ningún proveedor tiene — el PH, la
--      bomba, la entrada de la barriada. Con el tiempo es el activo real.
--
-- El geocodificador externo queda de RESPALDO para lo que no tengamos,
-- no de motor principal.

-- Supabase instala las extensiones en el esquema `extensions`; un
-- Postgres nuevo las pone en `public`. Nombrar `public.unaccent(...)` a
-- mano rompía en el primer caso. Se resuelve por search_path — un
-- esquema que no existe se ignora sin error, así que la misma línea vale
-- para los dos mundos.
set search_path = public, extensions;

create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Idempotente: pegar el archivo dos veces no debe reventar.
do $$ begin
  create type place_source as enum ('osm', 'overture', 'usuario', 'catalogo');
exception when duplicate_object then null;
end $$;

create table if not exists places (
  id bigserial primary key,
  -- Nombre tal como la gente lo dice. Sin normalizar de más: «PH Torre
  -- Mistral» se busca como «torre mistral» gracias al índice trigrama.
  name text not null,
  -- Categoría cruda del origen (amenity=fuel, building=apartments…).
  kind text,
  -- La ciudad se referencia por su PAR (país, slug): en `cities` la clave
  -- única es (country_code, slug), no el slug solo — el mismo 'santiago'
  -- existe en varios países y la plataforma ya mira hacia Venezuela.
  country_code char(2) not null default 'PA',
  city_slug text not null,
  -- Dirección legible, si el origen la trae.
  address text,
  geom geography (point, 4326) not null,
  source place_source not null,
  -- id en el origen (node/123456, overture GERS id) — para reimportar sin
  -- duplicar.
  source_id text,
  -- Cuántas veces se ha usado de verdad como punto de recogida. Es el
  -- ranking honesto: lo que la gente usa sube, no lo que pagó por subir.
  used_count integer not null default 0,
  -- Los puntos de usuario esperan confirmación antes de salir en público.
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (source, source_id),
  foreign key (country_code, city_slug) references cities (country_code, slug)
);

-- `unaccent()` se declara STABLE, y Postgres no acepta funciones que no
-- sean IMMUTABLE dentro de un índice. La envoltura de abajo es el patrón
-- estándar: mismo texto → mismo resultado, siempre.
create or replace function inmutable_unaccent (text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, extensions
as $$ select unaccent('unaccent', $1) $$;

-- Búsqueda por texto: trigramas sobre el nombre sin acentos. Es lo que
-- hace que «torre mistral», «Torre Mistral» y «PH torre mistral» caigan
-- en el mismo sitio.
create index if not exists places_name_trgm
  on places using gin (inmutable_unaccent (name) gin_trgm_ops);
create index if not exists places_city on places (country_code, city_slug);
create index if not exists places_geom on places using gist (geom);

alter table places enable row level security;

-- Leer es público: buscar una dirección no necesita cuenta.
drop policy if exists places_read on places;
DROP POLICY IF EXISTS places_read ON places;
CREATE POLICY places_read ON places for select using (is_public);

-- Escribir: solo usuarios conectados, y solo puntos suyos («usuario»).
-- Nadie inyecta lugares 'osm' desde el navegador.
drop policy if exists places_insert_own on places;
DROP POLICY IF EXISTS places_insert_own ON places;
CREATE POLICY places_insert_own ON places for insert to authenticated
  with check (source = 'usuario');

/**
 * BUSCAR UN LUGAR — una sola llamada, ordenada por cercanía y uso.
 *
 * `near` es la ciudad donde el usuario está buscando: dos «Super 99» a
 * 200 km no compiten, gana el de su ciudad. Sin `near`, ordena por uso.
 */
create or replace function search_places(
  q text,
  near_city text default null,
  max_results integer default 8
)
returns table (
  id bigint,
  name text,
  kind text,
  city_slug text,
  address text,
  lat double precision,
  lng double precision,
  source place_source
)
language sql
stable
set search_path = public, extensions
as $$
  select
    p.id,
    p.name,
    p.kind,
    p.city_slug,
    p.address,
    st_y (p.geom::geometry) as lat,
    st_x (p.geom::geometry) as lng,
    p.source
  from places p
  where p.is_public
    and (near_city is null or p.city_slug = near_city
         or similarity (inmutable_unaccent (p.name), inmutable_unaccent (q)) > 0.45)
    and inmutable_unaccent (p.name) ilike '%' || inmutable_unaccent (q) || '%'
  order by
    (p.city_slug = coalesce(near_city, p.city_slug)) desc,
    similarity (inmutable_unaccent (p.name), inmutable_unaccent (q)) desc,
    p.used_count desc
  limit greatest(1, least(max_results, 20));
$$;

/**
 * APUNTAR QUE UN LUGAR SE USÓ.
 *
 * Se llama cuando una reserva se confirma con ese punto — no cuando se
 * teclea. Lo que sube el ranking es el uso real, no la curiosidad.
 */
create or replace function bump_place(place_id bigint)
returns void
language sql
volatile
set search_path = public, extensions
as $$
  update places set used_count = used_count + 1 where id = place_id;
$$;

comment on table places is
  'Lugares buscables. Origen OSM (ODbL, atribución obligatoria en la app), Overture (CDLA-Permissive) y puntos escritos por los usuarios. Ver scripts/import-places.mjs.';


-- ═══════════════════════════════════════════════════════════
-- 0014_ciudades.sql
-- ═══════════════════════════════════════════════════════════
-- 0014 — LAS 32 CIUDADES QUE LA APP SIRVE DE VERDAD
--
-- `0001_schema.sql` sembró siete ciudades: las del primer corredor. La
-- app creció a 32 (src/lib/corridors.ts) y arma rutas entre cualquier
-- par de ellas. La base tiene que conocerlas, si no la tabla `places`
-- rechaza todo lo que no sea una de las siete originales — y el
-- importador de OpenStreetMap se queda a medias.
--
-- Coordenadas: las mismas del catálogo de la app, ninguna inventada.
-- `on conflict do nothing` deja intactas las siete que ya existen.

insert into cities (country_code, name, slug, province, lat, lng) values
  ('PA','Ciudad de Panamá','panama-city','Panamá',8.9824,-79.5199),
  ('PA','Chitré','chitre','Herrera',7.9614,-80.4297),
  ('PA','Las Tablas','las-tablas','Los Santos',7.7667,-80.2833),
  ('PA','David','david','Chiriquí',8.4333,-82.4333),
  ('PA','Santiago','santiago','Veraguas',8.1,-80.9833),
  ('PA','Penonomé','penonome','Coclé',8.5194,-80.3572),
  ('PA','Coronado','coronado','Panamá Oeste',8.5333,-79.95),
  ('PA','La Chorrera','la-chorrera','Panamá Oeste',8.8803,-79.7833),
  ('PA','Arraiján','arraijan','Panamá Oeste',8.9553,-79.6633),
  ('PA','Capira','capira','Panamá Oeste',8.7592,-79.8825),
  ('PA','Chame','chame','Panamá Oeste',8.5762,-79.8879),
  ('PA','San Carlos','san-carlos','Panamá Oeste',8.4726,-79.9575),
  ('PA','Río Hato','rio-hato','Coclé',8.3781,-80.1672),
  ('PA','Antón','anton','Coclé',8.3925,-80.2603),
  ('PA','Natá','nata','Coclé',8.3333,-80.5167),
  ('PA','Aguadulce','aguadulce','Coclé',8.2422,-80.5442),
  ('PA','El Valle de Antón','el-valle','Coclé',8.6,-80.1272),
  ('PA','Parita','parita','Herrera',8.0011,-80.5217),
  ('PA','La Villa de Los Santos','los-santos','Los Santos',7.9358,-80.4194),
  ('PA','Guararé','guarare','Los Santos',7.8158,-80.2847),
  ('PA','Pedasí','pedasi','Los Santos',7.5289,-80.0247),
  ('PA','Soná','sona','Veraguas',8.0119,-81.3211),
  ('PA','Tolé','tole','Chiriquí',8.2333,-81.6667),
  ('PA','Las Lajas','las-lajas','Chiriquí',8.2436,-81.8703),
  ('PA','La Concepción (Bugaba)','la-concepcion','Chiriquí',8.5121,-82.6194),
  ('PA','Paso Canoas','paso-canoas','Chiriquí',8.5333,-82.8383),
  ('PA','Boquete','boquete','Chiriquí',8.7803,-82.4408),
  ('PA','Volcán','volcan','Chiriquí',8.7681,-82.6394),
  ('PA','Colón','colon','Colón',9.3592,-79.9014),
  ('PA','Chepo','chepo','Panamá Este',9.1706,-79.1017),
  ('PA','Almirante','almirante','Bocas del Toro',9.3,-82.4028),
  ('PA','Changuinola','changuinola','Bocas del Toro',9.4319,-82.5182)
on conflict (country_code, slug) do nothing;


-- ═══════════════════════════════════════════════════════════
-- 0015_metricas.sql
-- ═══════════════════════════════════════════════════════════
-- 0015 — LAS MÉTRICAS: quién entra, de dónde viene y qué hace
--
-- Las 33 tablas anteriores cuentan el NEGOCIO (viajes, reservas, plata).
-- Ninguna cuenta el PRODUCTO: cuánta gente miró y se fue, qué buscaron
-- los que no reservaron, si el que llegó por un enlace de WhatsApp
-- convierte mejor que el que llegó por Google. Eso es lo que decide qué
-- se arregla la semana que viene, y hasta ahora no se estaba guardando.
--
-- Qué se guarda, y qué NO
-- =======================
-- Se guarda: el nombre del evento, la hora, un id de sesión anónimo, de
-- dónde vino la visita (utm + dominio del referente) y cuatro datos de
-- contexto (ruta buscada, ciudad, tipo de pantalla).
--
-- NO se guarda: la IP, el user-agent completo, ni la URL entera del
-- referente. Una IP es un dato personal en Panamá igual que en Europa, y
-- para saber si Chitré convierte mejor que David no hace ninguna falta.
-- Guardar menos también es no tener que protegerlo.
--
-- El `session_id` es un número aleatorio que vive en el navegador. Si la
-- persona entra con cuenta, `user_id` se llena y las dos mitades se unen
-- — antes de eso, nadie sabe quién es, y así está bien.

create table if not exists events (
  id bigserial primary key,
  -- Nombre en dos partes, `objeto_verbo`: busqueda_hecha, viaje_visto,
  -- reserva_pedida, publicacion_hecha… Se lee ordenado alfabéticamente.
  name text not null,
  occurred_at timestamptz not null default now(),
  -- Anónimo hasta que haya cuenta. Se conserva al iniciar sesión, así
  -- que la visita de antes y la cuenta de después se pueden unir.
  session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  -- De dónde viene la visita. Solo el DOMINIO del referente
  -- ('google.com', 'wa.me'), nunca la URL completa.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer_host text,
  -- Contexto útil sin ser identificante.
  path text,
  origin_slug text,
  destination_slug text,
  device text check (device in ('movil', 'escritorio')),
  -- Lo específico del evento (puestos buscados, canal de pago elegido…).
  props jsonb not null default '{}'::jsonb
);

create index if not exists events_name_time on events (name, occurred_at desc);
create index if not exists events_session on events (session_id);
create index if not exists events_user on events (user_id) where user_id is not null;
create index if not exists events_time on events (occurred_at desc);

alter table events enable row level security;

-- Escribir: cualquiera, con o sin cuenta — el visitante anónimo es
-- justamente el que hay que entender. La tabla solo acepta INSERT.
drop policy if exists events_insert on events;
DROP POLICY IF EXISTS events_insert ON events;
CREATE POLICY events_insert ON events for insert to anon, authenticated
  with check (true);

-- Leer: nadie desde la app. Los números se miran desde el panel (rol de
-- servicio). Un visitante no tiene por qué poder leer el tráfico ajeno.

/* ══════════════════════════════════════════════════════════════════
   LAS VISTAS — las preguntas que de verdad se hacen
   ══════════════════════════════════════════════════════════════════ */

/** Quién se registró y cuándo, con su procedencia y su actividad.
 *  Una línea por persona: la respuesta a «¿quién es esta gente?». */
DROP VIEW IF EXISTS metricas_usuarios CASCADE;
CREATE VIEW metricas_usuarios as
select
  u.id,
  p.first_name,
  u.created_at as registrado_el,
  u.last_sign_in_at as ultima_conexion,
  u.raw_app_meta_data ->> 'provider' as metodo_registro,
  p.is_phone_verified as telefono_verificado,
  p.is_id_verified as cedula_verificada,
  (select count(*) from events e
    where e.user_id = u.id and e.name = 'sesion_iniciada') as veces_conectado,
  (select count(*) from events e
    where e.user_id = u.id and e.name = 'busqueda_hecha') as busquedas,
  (select count(*) from bookings b where b.passenger_id = u.id) as reservas,
  (select count(*) from trips t where t.driver_id = u.id) as viajes_publicados,
  (select e.utm_source from events e
    where e.user_id = u.id and e.utm_source is not null
    order by e.occurred_at limit 1) as vino_de
from auth.users u
left join profiles p on p.id = u.id;

/** El embudo, día a día. La pregunta es siempre la misma: ¿dónde se
 *  cae la gente? Sesiones que buscan, búsquedas que abren un viaje,
 *  viajes que terminan en reserva. */
DROP VIEW IF EXISTS metricas_embudo_diario CASCADE;
CREATE VIEW metricas_embudo_diario as
select
  date_trunc('day', occurred_at)::date as dia,
  count(distinct session_id) filter (where name = 'pagina_vista') as sesiones,
  count(*) filter (where name = 'busqueda_hecha') as busquedas,
  count(*) filter (where name = 'busqueda_vacia') as busquedas_sin_resultado,
  count(*) filter (where name = 'viaje_visto') as viajes_vistos,
  count(*) filter (where name = 'reserva_pedida') as reservas,
  count(*) filter (where name = 'publicacion_hecha') as publicaciones,
  count(distinct session_id) filter (where name = 'cuenta_creada') as cuentas_nuevas
from events
group by 1
order by 1 desc;

/** De dónde viene la gente, y cuál de esas fuentes trae gente que
 *  RESERVA — no solo que mira. Es la única forma honesta de decidir
 *  dónde poner el esfuerzo. */
DROP VIEW IF EXISTS metricas_fuentes CASCADE;
CREATE VIEW metricas_fuentes as
select
  coalesce(utm_source, referrer_host, 'directo') as fuente,
  utm_campaign as campana,
  count(distinct session_id) as sesiones,
  count(distinct session_id) filter (where name = 'reserva_pedida') as sesiones_con_reserva,
  round(
    100.0 * count(distinct session_id) filter (where name = 'reserva_pedida')
      / nullif(count(distinct session_id), 0),
    1
  ) as tasa_conversion_pct
from events
group by 1, 2
order by sesiones desc;

/** Las rutas que la gente busca, y las que se quedan sin respuesta.
 *  Una ruta muy buscada y siempre vacía es un conductor que falta —
 *  el dato más accionable de todos. */
DROP VIEW IF EXISTS metricas_rutas_buscadas CASCADE;
CREATE VIEW metricas_rutas_buscadas as
select
  origin_slug,
  destination_slug,
  count(*) as busquedas,
  count(*) filter (where name = 'busqueda_vacia') as sin_resultado,
  round(
    100.0 * count(*) filter (where name = 'busqueda_vacia') / nullif(count(*), 0),
    1
  ) as pct_sin_resultado,
  max(occurred_at) as ultima_vez
from events
where name in ('busqueda_hecha', 'busqueda_vacia')
  and origin_slug is not null
group by 1, 2
order by busquedas desc;

/** Qué se toca en cada pantalla, por día. Responde a «¿hizo clic en
 *  qué?» sin tener que abrir la tabla cruda. */
DROP VIEW IF EXISTS metricas_eventos_diarios CASCADE;
CREATE VIEW metricas_eventos_diarios as
select
  date_trunc('day', occurred_at)::date as dia,
  name as evento,
  count(*) as veces,
  count(distinct session_id) as sesiones,
  count(*) filter (where device = 'movil') as en_movil
from events
group by 1, 2
order by 1 desc, 3 desc;

comment on table events is
  'Analítica de producto. Sin IP, sin user-agent, sin URL completa del referente. Se escribe desde el navegador (solo INSERT) y se lee desde el panel con el rol de servicio. Vistas: metricas_usuarios, metricas_embudo_diario, metricas_fuentes, metricas_rutas_buscadas, metricas_eventos_diarios.';


-- ═══════════════════════════════════════════════════════════
-- 0016_seguridad_vistas.sql
-- ═══════════════════════════════════════════════════════════
-- 0016 — CIERRA LAS MÉTRICAS Y ABRE LOS CATÁLOGOS
--
-- El linter de Supabase encontró dos cosas al aplicar 0015 sobre el
-- proyecto real. La primera es grave y es culpa de esa migración.
--
-- 1. FUGA: `metricas_usuarios` lee `auth.users`, y toda vista del esquema
--    `public` queda expuesta por la API. Con la clave publicable —que por
--    diseño va en el navegador de cualquiera— se podían leer los correos
--    y teléfonos de los registrados. Las cinco vistas de métricas son
--    para el dueño, no para el público: se les quita el permiso a `anon`
--    y `authenticated`, y se les pone `security_invoker` para que además
--    respeten los permisos de quien pregunta. Se leen desde el panel, con
--    el rol de servicio.
--
-- 2. CATÁLOGOS MUDOS: `cities`, `corridors`, `pickup_points`,
--    `vehicle_categories`, `price_rules` y `cancellation_policies` tienen
--    RLS activada y NINGUNA política. En Postgres eso no significa
--    «abierto», significa «cerrado para todos»: el día que el sitio lea
--    la base, no vería ni una ciudad. Son datos de referencia, públicos
--    por naturaleza —lo que cuesta un kilómetro, dónde para un carro— y
--    se abren a lectura. Escribir sigue reservado al rol de servicio.

/* ── 1. Las métricas se cierran ─────────────────────────────────────── */

do $$
declare v text;
begin
  foreach v in array array[
    'metricas_usuarios',
    'metricas_embudo_diario',
    'metricas_fuentes',
    'metricas_rutas_buscadas',
    'metricas_eventos_diarios'
  ] loop
    if to_regclass('public.' || v) is not null then
      execute format('revoke all on public.%I from anon, authenticated', v);
      execute format('alter view public.%I set (security_invoker = on)', v);
    end if;
  end loop;
end $$;

/* ── 2. Los catálogos se abren a lectura ────────────────────────────── */

do $$
declare t text;
begin
  foreach t in array array[
    'cities',
    'corridors',
    'pickup_points',
    'vehicle_categories',
    'price_rules',
    'cancellation_policies'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists %I on public.%I', t || '_read', t);
      execute format(
        'create policy %I on public.%I for select using (true)',
        t || '_read', t
      );
    end if;
  end loop;
end $$;

comment on view metricas_usuarios is
  'Solo para el dueño: contiene datos de auth.users. Sin permiso para anon ni authenticated — se lee desde el panel con el rol de servicio.';

/* ── 3. Funciones que no tienen por qué ser llamables desde fuera ───── */

-- El disparador que sincroniza el badge de cédula quedaba expuesto como
-- RPC. Revocar EXECUTE no lo afecta: los disparadores corren con los
-- permisos del dueño de la tabla, no del que llama.
revoke execute on function public.sync_profile_id_verified() from anon, authenticated;

-- Funciones internas de PostGIS, expuestas por herencia. La app nunca las
-- llama desde el navegador.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'st_estimatedextent'
  loop
    execute format('revoke execute on function %s from anon, authenticated', f.sig);
  end loop;
end $$;

/* ── Lo que se deja como está, a propósito ───────────────────────────
 * · `public_profiles` y `available_trips` son SECURITY DEFINER a
 *   propósito: es así como enseñan unas pocas columnas al público
 *   mientras RLS protege las tablas de abajo. Cambiarlas a
 *   security_invoker cerraría la búsqueda a los visitantes.
 * · Las tablas de operación (payments, payouts, reviews, vehicles…)
 *   tienen RLS sin políticas: solo el rol de servicio y las funciones
 *   Edge las tocan. Es cerrado por diseño, no un olvido.
 * · `spatial_ref_sys` es una tabla de referencia de PostGIS, sin ningún
 *   dato nuestro; no somos sus dueños y activarle RLS puede romper
 *   PostGIS.
 * · Las extensiones quedaron en `public`. Moverlas es arriesgado y no
 *   cambia nada de seguridad real aquí.
 */


-- ═══════════════════════════════════════════════════════════
-- 0017_perfil_al_registrarse.sql
-- ═══════════════════════════════════════════════════════════
-- 0017 — EL PERFIL NACE CON LA CUENTA
--
-- `profiles` no tiene política de INSERT, y es a propósito: nadie crea un
-- perfil desde el navegador. Pero entonces, al registrarse, la persona
-- quedaba con una cuenta en `auth.users` y NADA en `profiles` — y como
-- casi todo el esquema cuelga de `profiles` (viajes, reservas, la
-- verificación de cédula), la app se habría quedado muda con un usuario
-- que sí existe.
--
-- El disparador lo resuelve del lado correcto: en la base, en el mismo
-- instante, sin que el cliente tenga que acordarse de nada ni pueda
-- inventarse un perfil ajeno.
--
-- El nombre viene de lo que la persona escribió en el formulario
-- (`options.data` al pedir el código). Si falta —OAuth de Google, por
-- ejemplo— se cae hacia el nombre de la cuenta, y en último caso a
-- «Viajero», porque `first_name` no admite nulos. Nunca se inventa un
-- apellido: solo la inicial, y solo si la dio.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nombre text;
  apellido text;
begin
  nombre := nullif(trim(coalesce(
    meta ->> 'first_name',
    meta ->> 'name',
    meta ->> 'full_name'
  )), '');
  -- «ana.moreno@gmail.com» → «Ana». Mejor que un campo vacío, y la
  -- persona lo corrige en su cuenta cuando quiera.
  if nombre is null and new.email is not null then
    nombre := initcap(split_part(split_part(new.email, '@', 1), '.', 1));
  end if;
  nombre := coalesce(nullif(nombre, ''), 'Viajero');
  -- Si vino un nombre completo, la primera palabra es el nombre.
  if position(' ' in nombre) > 0 then
    apellido := split_part(nombre, ' ', 2);
    nombre := split_part(nombre, ' ', 1);
  end if;
  apellido := coalesce(nullif(trim(coalesce(meta ->> 'last_name', apellido)), ''), '');

  insert into profiles (id, first_name, last_initial, phone, is_phone_verified, locale)
  values (
    new.id,
    nombre,
    nullif(upper(left(apellido, 1)), ''),
    new.phone,
    new.phone is not null,
    coalesce(nullif(meta ->> 'locale', ''), 'es')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  after insert ON auth.users
  for each row execute function handle_new_user();

-- Un perfil se lee y se corrige solo por su dueño (esas políticas ya
-- existen). Crear, solo el disparador. Revocamos la ejecución pública de
-- la función: no es una RPC.
revoke execute on function handle_new_user() from anon, authenticated;

comment on function handle_new_user() is
  'Crea la fila de profiles al registrarse. Nombre desde options.data del OTP, o desde el correo. Nunca inventa apellido.';


-- ═══════════════════════════════════════════════════════════
-- 0018_tarifa_5_8.sql
-- ═══════════════════════════════════════════════════════════
-- 0018 — LA TARIFA SUBE A 5 % (YAPPY) Y 8 % (TARJETA)
--
-- Decisión del dueño. La regla de fondo no cambia: la tarifa es FIJA POR
-- CANAL y sigue el costo del canal, nunca la demanda (R2). El conductor
-- sigue recibiendo su aporte completo, y el efectivo sigue costando cero.
--
-- Esta restricción es la autoridad: si el front cobrara otra cosa, la
-- base rechazaría la reserva. Por eso se cambia aquí y en
-- `src/lib/pricing.ts` en el mismo movimiento — nunca en uno solo.

alter table bookings
  drop constraint if exists fee_is_fixed_pct;

DO $idem$ BEGIN
  alter table bookings
    add constraint fee_is_fixed_pct check (
      case payment_channel
        when 'external'  then service_fee_cents = 0
        when 'yappy_app' then service_fee_cents = round(total_cents * 0.05)
        when 'card'      then service_fee_cents = round(total_cents * 0.08)
      end
    );
  
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $idem$;
comment on column bookings.payment_channel is
  'external = efectivo/Yappy directo al conductor (gratis). yappy_app = Botón de Pago Yappy, tarifa 5 %. card = pasarela certificada, tarifa 8 %. La tarifa la paga el pasajero; el conductor recibe su aporte completo en los tres casos.';


-- ═══════════════════════════════════════════════════════════
-- 0021_chat.sql
-- ═══════════════════════════════════════════════════════════
-- ============================================================
-- EL CHAT DE UN VIAJE — escribir, leer, y nada más
-- ============================================================
--
-- La tabla `messages` ya existía desde 0001, con su índice y una policy
-- de lectura correcta. Le faltaba lo esencial: NADIE PODÍA ESCRIBIR. Sin
-- policy de INSERT, la RLS niega por defecto — el chat era una tabla
-- vacía imposible de llenar.
--
-- Tres decisiones que vienen de las reglas de la casa:
--
--   · El chat cuelga de una RESERVA, no de un viaje ni de un perfil. Sin
--     reserva no hay conversación posible: es exactamente la regla
--     anti-contorno del dueño — no se puede escribir al conductor para
--     arreglar el pago por fuera antes de reservar.
--   · Un mensaje NO se edita ni se borra. Es la prueba de lo que se
--     acordó el día que alguien reclame. Solo se marca como leído.
--   · El número de teléfono deja de hacer falta: se habla aquí.
--
-- Re-ejecutable: cada bloque comprueba antes de crear.

-- ---------- La tabla, por si acaso ----------
create table if not exists messages (
  id           bigserial primary key,
  booking_id   uuid not null references bookings(id) on delete cascade,
  sender_id    uuid not null references profiles(id),
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

alter table messages enable row level security;

create index if not exists idx_messages_booking on messages (booking_id, created_at);

-- ---------- Un mensaje vacío o kilométrico no es un mensaje ----------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_body_razonable'
  ) then
    alter table messages add constraint messages_body_razonable
      check (length(btrim(body)) between 1 and 2000);
  end if;
end $$;

-- ---------- Quién puede LEER (ya existía; se rehace por si falta) ----------
drop policy if exists messages_parties_only on messages;
DROP POLICY IF EXISTS messages_parties_only ON messages;
CREATE POLICY messages_parties_only ON messages
  for select using (
    exists (
      select 1 from bookings b join trips t on t.id = b.trip_id
      where b.id = messages.booking_id
        and (b.passenger_id = auth.uid() or t.driver_id = auth.uid())
    )
  );

-- ---------- Quién puede ESCRIBIR — lo que faltaba ----------
--
-- Dos condiciones, las dos necesarias:
--   1. firmas con tu propio nombre (sender_id = auth.uid()): nadie puede
--      escribir haciéndose pasar por el otro;
--   2. eres parte de ESA reserva.
--
-- La reserva cancelada cierra la conversación: dejar hablar después de
-- una cancelación es la puerta a « me pagas por fuera y la cancelamos ».
--
-- OJO con el nombre del estado. El enum `booking_status` no tiene ningún
-- valor que se llame 'cancelled' a secas: son 'cancelled_passenger' y
-- 'cancelled_driver' (quién canceló importa para el reembolso). Comparar
-- contra 'cancelled' no da error — simplemente nunca es cierto, y la
-- puerta que creíamos cerrada queda abierta de par en par. Por eso el
-- prefijo: cubre los dos valores reales, y de paso cualquier grafía
-- ('canceled', 'cancelada') si algún entorno viejo los tuviera.
DROP POLICY IF EXISTS messages_write_parties ON messages;
CREATE POLICY messages_write_parties ON messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from bookings b join trips t on t.id = b.trip_id
      where b.id = messages.booking_id
        and (b.passenger_id = auth.uid() or t.driver_id = auth.uid())
        and coalesce(b.status::text, '') not like 'cancel%'
    )
  );

-- ---------- Marcar como leído, y NADA más ----------
--
-- Solo el DESTINATARIO marca (quien no escribió el mensaje), y solo puede
-- tocar `read_at`: el cuerpo y el autor quedan intactos. El disparador de
-- abajo es lo que lo garantiza — una policy de UPDATE por sí sola dejaría
-- reescribir el texto.
drop policy if exists messages_mark_read on messages;
DROP POLICY IF EXISTS messages_mark_read ON messages;
CREATE POLICY messages_mark_read ON messages
  for update using (
    sender_id <> auth.uid()
    and exists (
      select 1 from bookings b join trips t on t.id = b.trip_id
      where b.id = messages.booking_id
        and (b.passenger_id = auth.uid() or t.driver_id = auth.uid())
    )
  );

create or replace function messages_solo_lectura()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Un mensaje es una prueba: su texto y su autor son inmutables.
  if new.body is distinct from old.body
     or new.sender_id is distinct from old.sender_id
     or new.booking_id is distinct from old.booking_id
     or new.created_at is distinct from old.created_at then
    raise exception 'un mensaje no se edita';
  end if;
  return new;
end $$;

drop trigger if exists messages_inmutables on messages;
DROP TRIGGER IF EXISTS messages_inmutables ON messages;
CREATE TRIGGER messages_inmutables
  before update ON messages
  for each row execute function messages_solo_lectura();

-- ---------- Tiempo real ----------
-- Sin esto el chat obliga a recargar para ver la respuesta.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

comment on table messages is
  'Chat de una reserva. Solo existe entre pasajero y conductor de esa reserva, nunca antes de reservar. Los mensajes son inmutables: solo se marca read_at.';

