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
CREATE POLICY waitlist_no_client_access ON waitlist_signals
  FOR SELECT USING (false);

-- ---------------------------------------------------------------------
--  Les recherches infructueuses d'un corridor, regroupées par date.
--  C'est la requête qui déclenche l'alerte aux conducteurs :
--  « 3 personas buscan Panamá → Chitré el viernes ».
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW pending_demand AS
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
