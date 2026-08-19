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

CREATE POLICY routines_own ON routines
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
