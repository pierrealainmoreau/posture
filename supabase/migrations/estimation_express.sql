-- ============================================================
-- Estimation Express — Tables + Fonction scoring
-- ============================================================

-- Rooms
create table if not exists estimation_express_rooms (
  id                      uuid primary key default gen_random_uuid(),
  code                    text not null unique,
  host_player_id          uuid,
  status                  text not null default 'lobby',
  creator_user_id         uuid references auth.users(id) on delete set null,
  questions               jsonb not null default '[]',
  current_question_index  int,
  total_questions         int not null default 0,
  phase_started_at        timestamptz,
  created_at              timestamptz not null default now()
);

-- Players
create table if not exists estimation_express_players (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references estimation_express_rooms(id) on delete cascade,
  pseudo         text not null,
  avatar_color   text not null default '#3b82f6',
  is_host        boolean not null default false,
  player_secret  text not null,
  score          int not null default 0,
  joined_at      timestamptz not null default now()
);

-- Guesses
create table if not exists estimation_express_guesses (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references estimation_express_rooms(id) on delete cascade,
  question_index   int not null,
  player_id        uuid not null references estimation_express_players(id) on delete cascade,
  value            float8 not null,
  points_earned    int not null default 0,
  submitted_at     timestamptz not null default now(),
  unique (room_id, question_index, player_id)
);

-- Indexes
create index if not exists idx_ee_rooms_code    on estimation_express_rooms(code);
create index if not exists idx_ee_rooms_creator on estimation_express_rooms(creator_user_id);
create index if not exists idx_ee_players_room  on estimation_express_players(room_id);
create index if not exists idx_ee_guesses_room  on estimation_express_guesses(room_id);
create index if not exists idx_ee_guesses_player on estimation_express_guesses(player_id);

-- Atomic score increment
create or replace function increment_estimation_express_score(p_player_id uuid, p_points int)
returns void
language sql
as $$
  update estimation_express_players
  set score = score + p_points
  where id = p_player_id;
$$;
