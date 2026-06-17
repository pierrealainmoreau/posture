-- ============================================================
-- Lien participant de session ↔ collaborateur Coach
-- Permet à l'hôte d'associer un participant à un collaborateur
-- pour retrouver l'historique des ateliers dans la fiche coach.
-- À exécuter dans Supabase Studio > SQL Editor
-- ============================================================

create table if not exists public.session_participant_collaborator_links (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users(id) on delete cascade,
  session_participant_id uuid       not null references public.session_participants(id) on delete cascade,
  collaborator_id       uuid        not null references public.collaborators(id) on delete cascade,
  created_at            timestamptz not null default now(),
  unique (user_id, session_participant_id)
);

create index if not exists idx_spcl_user_collaborator
  on public.session_participant_collaborator_links (user_id, collaborator_id);

create index if not exists idx_spcl_participant
  on public.session_participant_collaborator_links (session_participant_id);

-- RLS : chaque manager voit et gère ses propres liens
alter table public.session_participant_collaborator_links enable row level security;

create policy "Users see own participant links"
  on public.session_participant_collaborator_links for select
  using (auth.uid() = user_id);

create policy "Users create own participant links"
  on public.session_participant_collaborator_links for insert
  with check (auth.uid() = user_id);

create policy "Users delete own participant links"
  on public.session_participant_collaborator_links for delete
  using (auth.uid() = user_id);
