-- Undercover — Migration Supabase
-- Exécuter dans le SQL Editor de Supabase Studio

create table if not exists public.undercover_rooms (
  id                      uuid        primary key default gen_random_uuid(),
  code                    text        not null unique,
  host_player_id          uuid        not null,
  creator_user_id         uuid,
  status                  text        not null check (status in (
    'lobby','description','discussion','voting','mr_white_guess','finished'
  )) default 'lobby',
  civil_word              text,
  undercover_word         text,
  pair_index              int,
  nb_undercovers          int         not null default 1,
  nb_mr_whites            int         not null default 1,
  turn_order              uuid[]      not null default '{}',
  current_turn_player_id  uuid,
  turn_started_at         timestamptz,
  discussion_started_at   timestamptz,
  round_number            int         not null default 0,
  eliminated_player_id    uuid,
  mr_white_last_guess     text,
  mr_white_last_guess_correct boolean,
  winner                  text        check (winner in ('civils','infiltres','mr_white')),
  session_count           int         not null default 1,
  created_at              timestamptz not null default now()
);

create table if not exists public.undercover_players (
  id            uuid        primary key default gen_random_uuid(),
  room_id       uuid        not null references public.undercover_rooms(id) on delete cascade,
  pseudo        text        not null,
  avatar_color  text        not null,
  is_host       boolean     not null default false,
  player_secret text,
  role          text        check (role in ('civil','undercover','mr_white')),
  secret_word   text,
  is_eliminated boolean     not null default false,
  total_score   int         not null default 0,
  joined_at     timestamptz not null default now()
);

create table if not exists public.undercover_descriptions (
  id             uuid        primary key default gen_random_uuid(),
  room_id        uuid        not null references public.undercover_rooms(id) on delete cascade,
  player_id      uuid        not null references public.undercover_players(id) on delete cascade,
  session_count  int         not null default 1,
  round_number   int         not null,
  word           text,
  submitted_at   timestamptz not null default now(),
  unique (room_id, player_id, session_count, round_number)
);

create table if not exists public.undercover_votes (
  id               uuid        primary key default gen_random_uuid(),
  room_id          uuid        not null references public.undercover_rooms(id) on delete cascade,
  voter_player_id  uuid        not null references public.undercover_players(id) on delete cascade,
  voted_player_id  uuid        not null references public.undercover_players(id) on delete cascade,
  session_count    int         not null default 1,
  round_number     int         not null,
  voted_at         timestamptz not null default now(),
  unique (room_id, voter_player_id, session_count, round_number)
);

-- RLS : accès total (jeux anonymes par code)
alter table public.undercover_rooms        enable row level security;
alter table public.undercover_players      enable row level security;
alter table public.undercover_descriptions enable row level security;
alter table public.undercover_votes        enable row level security;

drop policy if exists "allow_all_undercover_rooms"        on public.undercover_rooms;
drop policy if exists "allow_all_undercover_players"      on public.undercover_players;
drop policy if exists "allow_all_undercover_descriptions" on public.undercover_descriptions;
drop policy if exists "allow_all_undercover_votes"        on public.undercover_votes;

create policy "allow_all_undercover_rooms"        on public.undercover_rooms        for all using (true) with check (true);
create policy "allow_all_undercover_players"      on public.undercover_players      for all using (true) with check (true);
create policy "allow_all_undercover_descriptions" on public.undercover_descriptions for all using (true) with check (true);
create policy "allow_all_undercover_votes"        on public.undercover_votes        for all using (true) with check (true);

-- Index
create index if not exists uc_players_room_idx      on public.undercover_players(room_id);
create index if not exists uc_desc_room_idx         on public.undercover_descriptions(room_id);
create index if not exists uc_votes_room_idx        on public.undercover_votes(room_id);
create index if not exists uc_rooms_pair_index_idx  on public.undercover_rooms(pair_index);
