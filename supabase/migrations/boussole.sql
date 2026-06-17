create table if not exists public.boussole_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_player_id uuid,
  status text not null check (status in ('lobby', 'playing', 'finished')) default 'lobby',
  situation_count int not null default 12,
  situation_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.boussole_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.boussole_rooms(id) on delete cascade,
  pseudo text not null,
  avatar_color text not null,
  is_host boolean not null default false,
  finished_at timestamptz,
  joined_at timestamptz not null default now()
);

create table if not exists public.boussole_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.boussole_rooms(id) on delete cascade,
  player_id uuid not null references public.boussole_players(id) on delete cascade,
  situation_id text not null,
  answer_value text check (answer_value in ('pilote', 'dynamo', 'socle', 'repere')),
  answered_at timestamptz not null default now(),
  unique (player_id, situation_id)
);

create table if not exists public.boussole_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.boussole_rooms(id) on delete cascade,
  results jsonb not null,
  team_map jsonb not null,
  computed_at timestamptz not null default now()
);

alter table public.boussole_rooms enable row level security;
alter table public.boussole_players enable row level security;
alter table public.boussole_answers enable row level security;
alter table public.boussole_results enable row level security;

create policy "service role only" on public.boussole_rooms for all using (true);
create policy "service role only" on public.boussole_players for all using (true);
create policy "service role only" on public.boussole_answers for all using (true);
create policy "service role only" on public.boussole_results for all using (true);
