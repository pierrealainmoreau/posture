-- ============================================================
-- Emoji Only — Tables + Fonction scoring
-- ============================================================

-- Rooms
create table if not exists emoji_only_rooms (
  id                        uuid primary key default gen_random_uuid(),
  code                      text not null unique,
  host_player_id            uuid,
  status                    text not null default 'lobby',
  creator_user_id           uuid references auth.users(id) on delete set null,
  category                  text not null default 'films',
  custom_words              jsonb not null default '[]',
  word_pool                 jsonb not null default '[]',
  current_round             int not null default 0,
  total_rounds              int not null default 0,
  current_encoder_player_id uuid,
  encoder_order             jsonb not null default '[]',
  phase_started_at          timestamptz,
  created_at                timestamptz not null default now()
);

-- Players
create table if not exists emoji_only_players (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references emoji_only_rooms(id) on delete cascade,
  pseudo         text not null,
  avatar_color   text not null default '#3b82f6',
  is_host        boolean not null default false,
  player_secret  text not null,
  score          int not null default 0,
  is_active      boolean not null default true,
  last_seen_at   timestamptz not null default now(),
  joined_at      timestamptz not null default now()
);

-- Rounds
create table if not exists emoji_only_rounds (
  id                   uuid primary key default gen_random_uuid(),
  room_id              uuid not null references emoji_only_rooms(id) on delete cascade,
  round_number         int not null,
  encoder_player_id    uuid not null references emoji_only_players(id) on delete cascade,
  word                 text,
  emoji_sequence       text,
  options              jsonb,
  correct_option       text,
  encoding_started_at  timestamptz,
  guessing_started_at  timestamptz,
  revealed_at          timestamptz,
  unique (room_id, round_number)
);

-- Guesses
create table if not exists emoji_only_guesses (
  id             uuid primary key default gen_random_uuid(),
  round_id       uuid not null references emoji_only_rounds(id) on delete cascade,
  player_id      uuid not null references emoji_only_players(id) on delete cascade,
  chosen_option  text not null,
  is_correct     boolean not null default false,
  points_earned  int not null default 0,
  submitted_at   timestamptz not null default now(),
  unique (round_id, player_id)
);

-- Indexes
create index if not exists idx_emoji_only_rooms_code            on emoji_only_rooms(code);
create index if not exists idx_emoji_only_rooms_creator         on emoji_only_rooms(creator_user_id);
create index if not exists idx_emoji_only_players_room          on emoji_only_players(room_id);
create index if not exists idx_emoji_only_rounds_room           on emoji_only_rounds(room_id);
create index if not exists idx_emoji_only_guesses_round         on emoji_only_guesses(round_id);
create index if not exists idx_emoji_only_guesses_player        on emoji_only_guesses(player_id);

-- Atomic score increment (called from API routes)
create or replace function increment_emoji_only_score(p_player_id uuid, p_points int)
returns void
language sql
as $$
  update emoji_only_players
  set score = score + p_points
  where id = p_player_id;
$$;
