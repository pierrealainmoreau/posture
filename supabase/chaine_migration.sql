-- Chaîne — Migration Supabase
-- Exécuter dans le SQL Editor de Supabase Studio

create table if not exists public.chaine_rooms (
  id               uuid        primary key default gen_random_uuid(),
  code             text        not null unique,
  host_player_id   uuid        not null,
  creator_user_id  uuid,
  status           text        not null check (status in ('lobby','playing','voting','finished')) default 'lobby',
  starter_word     text        not null,
  current_turn_index int       not null default 0,
  player_order     uuid[]      not null default '{}',
  turn_started_at  timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.chaine_players (
  id           uuid        primary key default gen_random_uuid(),
  room_id      uuid        not null references public.chaine_rooms(id) on delete cascade,
  pseudo       text        not null,
  avatar_color text        not null,
  is_host      boolean     not null default false,
  joined_at    timestamptz not null default now()
);

create table if not exists public.chaine_words (
  id           uuid        primary key default gen_random_uuid(),
  room_id      uuid        not null references public.chaine_rooms(id) on delete cascade,
  player_id    uuid        references public.chaine_players(id) on delete cascade,
  turn_index   int         not null,
  word         text,
  submitted_at timestamptz not null default now(),
  unique (room_id, turn_index)
);

create table if not exists public.chaine_votes (
  id               uuid        primary key default gen_random_uuid(),
  room_id          uuid        not null references public.chaine_rooms(id) on delete cascade,
  voter_player_id  uuid        not null references public.chaine_players(id) on delete cascade,
  voted_turn_index int         not null,
  voted_at         timestamptz not null default now(),
  unique (room_id, voter_player_id)
);

-- RLS : accès total (les jeux sont anonymes par code)
alter table public.chaine_rooms   enable row level security;
alter table public.chaine_players enable row level security;
alter table public.chaine_words   enable row level security;
alter table public.chaine_votes   enable row level security;

drop policy if exists "allow_all_chaine_rooms"   on public.chaine_rooms;
drop policy if exists "allow_all_chaine_players" on public.chaine_players;
drop policy if exists "allow_all_chaine_words"   on public.chaine_words;
drop policy if exists "allow_all_chaine_votes"   on public.chaine_votes;

create policy "allow_all_chaine_rooms"   on public.chaine_rooms   for all using (true) with check (true);
create policy "allow_all_chaine_players" on public.chaine_players for all using (true) with check (true);
create policy "allow_all_chaine_words"   on public.chaine_words   for all using (true) with check (true);
create policy "allow_all_chaine_votes"   on public.chaine_votes   for all using (true) with check (true);

-- Index
create index if not exists chaine_players_room_idx on public.chaine_players(room_id);
create index if not exists chaine_words_room_idx   on public.chaine_words(room_id);
create index if not exists chaine_votes_room_idx   on public.chaine_votes(room_id);
