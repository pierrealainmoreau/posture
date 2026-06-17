-- Migration : détail des destinataires par envoi (qui a ouvert / cliqué)
-- À exécuter dans Supabase > SQL Editor (après email_broadcasts_migration.sql et email_tracking_migration.sql)

CREATE TABLE IF NOT EXISTS email_broadcast_recipients (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_id  uuid        NOT NULL REFERENCES email_broadcasts(id) ON DELETE CASCADE,
  user_id       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  email         text        NOT NULL,
  first_name    text,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  opened_at     timestamptz,
  open_count    integer     NOT NULL DEFAULT 0,
  clicked_at    timestamptz,
  click_count   integer     NOT NULL DEFAULT 0,
  UNIQUE (broadcast_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_email_broadcast_recipients_broadcast ON email_broadcast_recipients(broadcast_id);

ALTER TABLE email_broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_broadcast_recipients" ON email_broadcast_recipients
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Les lignes destinataires sont créées à l'envoi (sent_at) ; ces fonctions ne font
-- que mettre à jour une ligne déjà existante (UPDATE sans effet si elle n'existe pas).

CREATE OR REPLACE FUNCTION record_email_open(p_broadcast_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE email_broadcast_recipients
  SET open_count = open_count + 1,
      opened_at  = COALESCE(opened_at, now())
  WHERE broadcast_id = p_broadcast_id AND user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION record_email_click(p_broadcast_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE email_broadcast_recipients
  SET click_count = click_count + 1,
      clicked_at  = COALESCE(clicked_at, now())
  WHERE broadcast_id = p_broadcast_id AND user_id = p_user_id;
END;
$$;
