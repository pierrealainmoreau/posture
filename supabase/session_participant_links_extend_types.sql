-- Étend session_participant_links pour supporter tous les types de jeux
-- À exécuter dans Supabase Studio > SQL Editor

ALTER TABLE public.session_participant_links
  DROP CONSTRAINT IF EXISTS session_participant_links_session_type_check;

ALTER TABLE public.session_participant_links
  ADD CONSTRAINT session_participant_links_session_type_check
  CHECK (session_type IN (
    'retrospective', 'kudo_cards', 'abcde',
    'humeur', 'roti', 'undercover', 'chaine',
    'code_secret', 'speed_retro', 'draw', 'boussole', 'tribu'
  ));
