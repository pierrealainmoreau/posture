-- Manuel d'utilisation collaborateur
-- À exécuter dans l'éditeur SQL Supabase

CREATE TABLE IF NOT EXISTS collaborator_manuals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token           uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  answers         jsonb NOT NULL DEFAULT '{}',
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collaborator_manuals ENABLE ROW LEVEL SECURITY;

-- Le manager peut tout faire sur ses propres manuals
CREATE POLICY "owner_all_manual" ON collaborator_manuals
  FOR ALL USING (user_id = auth.uid());

-- Index pour les lookups par token (route publique)
CREATE UNIQUE INDEX IF NOT EXISTS collaborator_manuals_token_idx
  ON collaborator_manuals(token);
