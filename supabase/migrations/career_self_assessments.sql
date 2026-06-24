-- Auto-évaluation carrière par collaborateur
-- Le manager génère un lien unique (token), le collaborateur s'auto-évalue via ce lien

CREATE TABLE IF NOT EXISTS career_self_assessments (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  collaborator_id  UUID        NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token            TEXT        NOT NULL UNIQUE,
  self_levels      JSONB       NOT NULL DEFAULT '{}',
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(collaborator_id)
);

CREATE INDEX IF NOT EXISTS career_self_assessments_token_idx
  ON career_self_assessments(token);

ALTER TABLE career_self_assessments ENABLE ROW LEVEL SECURITY;

-- Le manager accède à son propre enregistrement
CREATE POLICY "Users manage their own career self assessments"
  ON career_self_assessments
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Le collaborateur peut lire/écrire via le token (service role = pas de RLS)
-- Les routes /api/teams/career/fill/[token] utilisent createAdminSupabaseClient()
