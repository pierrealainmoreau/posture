-- Suggestions IA hebdomadaires par collaborateur
-- Une ligne par collaborateur (upsert), générée à la demande par le manager

CREATE TABLE IF NOT EXISTS collaborator_suggestions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  collaborator_id  UUID        NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_suggestion  TEXT     NOT NULL,
  career_suggestion   TEXT     NOT NULL,
  okr_suggestion      TEXT     NOT NULL,
  generated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(collaborator_id)
);

ALTER TABLE collaborator_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own collaborator suggestions"
  ON collaborator_suggestions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
