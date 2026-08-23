-- =====================================================================
--  MIGRATION 0030 — Ce que dit celui qui teste.
--
--  Le test friends & family commence, et le retour utile est celui qu'on
--  écrit SUR L'ÉCRAN où la chose cloche. Un message WhatsApp trois heures
--  plus tard dit « ça marche pas », jamais « à /resultados le bouton
--  Filtros ne se referme pas ».
--
--  D'où une table qui garde le texte ET l'écran, capturé tout seul.
--
--  LE CHOIX QUI SE DISCUTE : `anon` peut INSÉRER. Il le faut — la démo se
--  parcourt sans compte, et exiger une inscription pour signaler un bug
--  supprime justement les retours des premiers écrans. En échange :
--
--    · INSERT seulement. Aucune politique de lecture : ni anon ni un
--      utilisateur connecté ne peut relire un seul commentaire, même le
--      sien. Ça se lit depuis le tableau de bord, avec la clé de service.
--    · Le texte est borné en base, pas dans l'app.
--    · La table ne référence rien de sensible : profile_id est NULL quand
--      il n'y a pas de session, et c'est le cas normal en démo.
--
--  C'est une surface de spam assumée, ouverte le temps du test. Quand il
--  se ferme, on retire la politique `anon` d'une ligne.
-- =====================================================================

CREATE TABLE feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- NULL sans session : en démo personne n'est connecté.
  profile_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- La route au moment du toucher : « /(pasajero)/resultados ».
  pantalla    text NOT NULL CHECK (length(pantalla) <= 200),

  -- L'étiquette rapide, quand elle est choisie : roto, raro, confuso, idea.
  clase       text CHECK (clase IN ('roto', 'raro', 'confuso', 'idea')),

  texto       text NOT NULL CHECK (length(btrim(texto)) BETWEEN 1 AND 2000),

  -- Plateforme, largeur d'écran, version. Assez pour reproduire.
  contexto    jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Ce qu'on en a fait. Se met à jour depuis le tableau de bord.
  visto       boolean NOT NULL DEFAULT false
);

COMMENT ON TABLE feedback IS
  'Les retours du test friends & family. INSERT ouvert à anon, AUCUNE lecture par RLS : se consulte avec la clé de service.';

CREATE INDEX feedback_por_fecha ON feedback (created_at DESC);
CREATE INDEX feedback_sin_ver ON feedback (created_at DESC) WHERE NOT visto;

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Écrire, oui. Sans compte aussi : c'est tout l'intérêt pendant le test.
CREATE POLICY feedback_cualquiera_escribe ON feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    -- Personne ne signe au nom d'un autre. Sans session, profile_id est NULL.
    profile_id IS NOT DISTINCT FROM auth.uid()
  );

-- Volontairement absentes : SELECT, UPDATE, DELETE. Sans politique, RLS
-- refuse — y compris à celui qui vient d'écrire la ligne.
