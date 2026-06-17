-- Migration : tracking ouvertures et clics sur les emails broadcast
-- À exécuter dans Supabase > SQL Editor (après email_broadcasts_migration.sql)

ALTER TABLE email_broadcasts
  ADD COLUMN IF NOT EXISTS opens  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks integer NOT NULL DEFAULT 0;

-- Fonction atomique d'incrément (évite les race conditions sur les compteurs)
CREATE OR REPLACE FUNCTION increment_email_stat(p_id uuid, p_col text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_col = 'opens' THEN
    UPDATE email_broadcasts SET opens  = opens  + 1 WHERE id = p_id;
  ELSIF p_col = 'clicks' THEN
    UPDATE email_broadcasts SET clicks = clicks + 1 WHERE id = p_id;
  END IF;
END;
$$;
