-- Newsletter opt-in/opt-out pour les envois email broadcast.
-- Tous les utilisateurs existants sont considérés opt-in par défaut (DEFAULT true
-- s'applique aussi aux lignes existantes lors de l'ALTER TABLE).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS newsletter_opt_in   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS unsubscribed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_reason  text;
