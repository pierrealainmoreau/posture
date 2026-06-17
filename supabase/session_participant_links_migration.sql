-- Migration : session_participant_links
-- Lien entre un participant d'une session collaborative et un collaborateur Coach

create type session_type_enum as (
  value text
);

create table public.session_participant_links (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  session_type    text not null check (session_type in ('retrospective', 'kudo_cards', 'abcde')),
  room_code       text not null,
  player_pseudo   text not null,
  collaborator_id uuid not null references public.collaborators(id) on delete cascade,
  created_at      timestamptz not null default now(),
  -- Un pseudo donné dans une room ne peut être lié qu'une fois par user
  unique (user_id, session_type, room_code, player_pseudo)
);

-- Index pour les lectures par room
create index session_participant_links_room_idx
  on public.session_participant_links (user_id, session_type, room_code);

-- RLS
alter table public.session_participant_links enable row level security;

create policy "Users see own links"
  on public.session_participant_links for select
  using (auth.uid() = user_id);

create policy "Users create own links"
  on public.session_participant_links for insert
  with check (auth.uid() = user_id);

create policy "Users delete own links"
  on public.session_participant_links for delete
  using (auth.uid() = user_id);
