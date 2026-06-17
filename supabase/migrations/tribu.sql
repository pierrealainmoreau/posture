-- Tribu — migration Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase

create table if not exists public.tribu_rooms (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  host_player_id   uuid,
  creator_user_id  uuid,
  status           text not null check (status in ('lobby', 'playing', 'revealing', 'finished')) default 'lobby',
  question_theme   text not null default 'all',
  question_count   int  not null default 10,
  question_ids     text[] not null default '{}',
  created_at       timestamptz not null default now()
);

create table if not exists public.tribu_players (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.tribu_rooms(id) on delete cascade,
  pseudo       text not null,
  avatar_color text not null,
  is_host      boolean not null default false,
  finished_at  timestamptz,
  joined_at    timestamptz not null default now()
);

create table if not exists public.tribu_answers (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.tribu_rooms(id) on delete cascade,
  player_id     uuid not null references public.tribu_players(id) on delete cascade,
  question_id   text not null,
  answer_value  text not null,
  answered_at   timestamptz not null default now(),
  unique (player_id, question_id)
);

create table if not exists public.tribu_results (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.tribu_rooms(id) on delete cascade unique,
  tribes      jsonb not null,
  computed_at timestamptz not null default now()
);

-- Index pour les requêtes fréquentes
create index if not exists tribu_players_room_id_idx  on public.tribu_players(room_id);
create index if not exists tribu_answers_room_id_idx  on public.tribu_answers(room_id);
create index if not exists tribu_answers_player_id_idx on public.tribu_answers(player_id);
create index if not exists tribu_results_room_id_idx  on public.tribu_results(room_id);

-- RLS : désactivé (contrôle applicatif via service role, identique aux autres jeux)
alter table public.tribu_rooms    disable row level security;
alter table public.tribu_players  disable row level security;
alter table public.tribu_answers  disable row level security;
alter table public.tribu_results  disable row level security;
