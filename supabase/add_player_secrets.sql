-- Ajout du player_secret sur toutes les tables de joueurs des mini-jeux
ALTER TABLE public.humeur_players ADD COLUMN IF NOT EXISTS player_secret TEXT;
ALTER TABLE public.chaine_players ADD COLUMN IF NOT EXISTS player_secret TEXT;
ALTER TABLE public.brick_storm_players ADD COLUMN IF NOT EXISTS player_secret TEXT;
ALTER TABLE public.draw_players ADD COLUMN IF NOT EXISTS player_secret TEXT;
ALTER TABLE public.tribu_players ADD COLUMN IF NOT EXISTS player_secret TEXT;
ALTER TABLE public.boussole_players ADD COLUMN IF NOT EXISTS player_secret TEXT;
