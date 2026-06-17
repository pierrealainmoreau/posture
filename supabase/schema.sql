-- ============================================================
-- 1:1 Coach — schéma Supabase
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================================

create table public.collaborators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  first_name text not null,
  last_name text not null,
  role text not null,
  seniority text not null check (seniority in ('junior', 'confirmed', 'senior')),
  period text not null default 'development' check (period in ('onboarding', 'development', 'retention')),
  relationship_started_at date not null,
  current_ops_topics text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.managerial_plans (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.collaborators(id) on delete cascade,
  mutual_expectations text not null,
  detected_development_axes jsonb not null,
  proposed_cadence text not null,
  raw_content jsonb not null,
  created_at timestamptz not null default now()
);

create table public.weekly_sessions (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.collaborators(id) on delete cascade,
  week_number int not null,
  scheduled_date date,
  priority_topic_1 text not null,
  priority_topic_2 text not null,
  exploration_topic text not null,
  unexpected_question text not null,
  development_axis text not null,
  manager_notes text,
  is_completed boolean not null default false,
  raw_content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collaborator_id, week_number)
);

create index idx_collaborators_user_id on public.collaborators(user_id);
create index idx_sessions_collaborator on public.weekly_sessions(collaborator_id);

alter table public.collaborators enable row level security;
alter table public.managerial_plans enable row level security;
alter table public.weekly_sessions enable row level security;

create policy "user_owns_collaborators" on public.collaborators
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_owns_plans" on public.managerial_plans
  for all using (
    exists (select 1 from public.collaborators c where c.id = collaborator_id and c.user_id = auth.uid())
  );

create policy "user_owns_sessions" on public.weekly_sessions
  for all using (
    exists (select 1 from public.collaborators c where c.id = collaborator_id and c.user_id = auth.uid())
  );

-- ============================================================
-- Mini-jeu : Humeur du jour
-- ============================================================

create table public.humeur_rooms (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  host_player_id   uuid,
  status           text not null default 'lobby'
                     check (status in ('lobby', 'playing', 'finished')),
  creator_user_id  uuid,
  created_at       timestamptz not null default now()
);

create table public.humeur_players (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.humeur_rooms(id) on delete cascade,
  pseudo       text not null,
  avatar_color text not null default '#3b82f6',
  is_host      boolean not null default false,
  mood_id      text,
  joined_at    timestamptz not null default now()
);

create index idx_humeur_rooms_code            on public.humeur_rooms(code);
create index idx_humeur_rooms_creator         on public.humeur_rooms(creator_user_id);
create index idx_humeur_players_room          on public.humeur_players(room_id);

-- ============================================================
-- ABCDE — Méthode de prise de décision collaborative
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
