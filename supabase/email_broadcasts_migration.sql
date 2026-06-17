-- Migration : historique des emails broadcast envoyés depuis l'admin
-- À exécuter dans Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS email_broadcasts (
  id           uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz  DEFAULT now() NOT NULL,
  subject      text         NOT NULL,
  blocks       jsonb        NOT NULL DEFAULT '[]',
  target       text         NOT NULL,  -- 'all' | 'premium' | 'specific'
  target_label text         NOT NULL,
  sent_count   integer      NOT NULL DEFAULT 0,
  sent_by      uuid         REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE email_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_broadcasts" ON email_broadcasts
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
