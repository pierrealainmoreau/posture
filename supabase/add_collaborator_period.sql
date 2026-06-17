-- Migration : ajout du champ "période" sur la table collaborators
-- À exécuter une fois dans l'éditeur SQL de Supabase

alter table public.collaborators
  add column if not exists period text not null default 'development'
    check (period in ('onboarding', 'development', 'retention'));

-- Optionnel : mettre à jour les collaborateurs existants selon une règle métier
-- update public.collaborators set period = 'development' where period is null;
