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
CREATE OR REPLACE VIEW driver_ratings AS
SELECT subject_id AS profile_id,
       ROUND(AVG(rating)::numeric, 2) AS avg_rating,
       COUNT(*) AS reviews_count,
       ROUND(AVG(puntualidad)::numeric, 2) AS avg_puntualidad,
       ROUND(AVG(manejo)::numeric, 2) AS avg_manejo,
       ROUND(AVG(trato)::numeric, 2) AS avg_trato,
       ROUND(AVG(carro)::numeric, 2) AS avg_carro,
       ROUND(AVG(encuentro)::numeric, 2) AS avg_encuentro
FROM reviews GROUP BY subject_id;
