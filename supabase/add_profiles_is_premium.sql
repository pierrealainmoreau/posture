-- Migration : ajout du champ is_premium sur la table profiles (plan utilisateur)
-- À exécuter dans l'éditeur SQL de Supabase

alter table public.profiles
  add column if not exists is_premium boolean not null default false;
