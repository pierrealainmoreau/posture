-- ============================================================
-- ABCDE — Méthode de prise de décision collaborative
-- À exécuter dans Supabase Studio > SQL Editor
-- ============================================================

create table public.abcde_rooms (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  host_player_id    uuid,
  status            text not null default 'lobby'
                      check (status in ('lobby','step_a','step_b','step_c','step_d','step_e','synthesis','finished')),
  problem_statement text,
  step_a_template   text check (step_a_template in ('libre','5-pourquoi','ishikawa')),
  step_b_template   text check (step_b_template in ('libre','6-chapeaux','affinites')),
  decision_text     text,
  decision_posture  text check (decision_posture in ('inactive','reactive','proactive')),
  synthesis         text,
  timer_per_step    int,
  step_started_at   timestamptz,
  creator_user_id   uuid,
  created_at        timestamptz not null default now()
);

create table public.abcde_players (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.abcde_rooms(id) on delete cascade,
  pseudo       text not null,
  avatar_color text not null default '#3b82f6',
  is_host      boolean not null default false,
  joined_at    timestamptz not null default now()
);

create table public.abcde_contributions (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.abcde_rooms(id) on delete cascade,
  player_id  uuid not null references public.abcde_players(id) on delete cascade,
  step       text not null check (step in ('a','b','c','d','e')),
  content    text not null,
  category   text,
  created_at timestamptz not null default now()
);

create table public.abcde_votes (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid not null references public.abcde_rooms(id) on delete cascade,
  player_id       uuid not null references public.abcde_players(id) on delete cascade,
  contribution_id uuid not null references public.abcde_contributions(id) on delete cascade,
  points          int not null default 1 check (points >= 1 and points <= 3),
  created_at      timestamptz not null default now(),
  unique (player_id, contribution_id)
);

create table public.abcde_evaluations (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.abcde_rooms(id) on delete cascade,
  player_id  uuid not null references public.abcde_players(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique (player_id, room_id)
);

create index idx_abcde_rooms_code         on public.abcde_rooms(code);
create index idx_abcde_players_room       on public.abcde_players(room_id);
create index idx_abcde_contributions_room on public.abcde_contributions(room_id);
create index idx_abcde_contributions_step on public.abcde_contributions(room_id, step);
create index idx_abcde_votes_room         on public.abcde_votes(room_id);
create index idx_abcde_evaluations_room   on public.abcde_evaluations(room_id);
