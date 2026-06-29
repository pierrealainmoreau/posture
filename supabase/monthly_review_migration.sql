-- Migration : Bilan mensuel de développement
-- Ajoute la colonne `data` (jsonb) dans la table interviews
-- pour stocker les réponses du bilan mensuel.
-- À exécuter dans Supabase SQL editor.

alter table public.interviews
  add column if not exists data jsonb;
