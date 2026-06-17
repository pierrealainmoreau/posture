-- Ajout de user_id sur analytics_events (si la table existe déjà sans cette colonne)
alter table public.analytics_events
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_analytics_user_id on public.analytics_events (user_id);
