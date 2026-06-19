-- Champs éditables du profil utilisateur
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url     text,
  ADD COLUMN IF NOT EXISTS linkedin_url   text,
  ADD COLUMN IF NOT EXISTS coach_interest text;

-- Créer le bucket Storage "avatars" (public) dans le dashboard Supabase :
-- Dashboard > Storage > New bucket > name: "avatars", Public: true
-- Ou via SQL :
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('avatars', 'avatars', true)
--   ON CONFLICT DO NOTHING;
--
-- Policy RLS pour les avatars (chaque user peut lire/écrire son propre dossier) :
-- CREATE POLICY "avatars_user_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "avatars_user_insert" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
-- );
-- CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE WITH CHECK (
--   bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
-- );
