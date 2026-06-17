-- Draw It tables
-- Run this in your Supabase SQL editor

create table public.draw_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_player_id uuid,
  status text not null check (status in ('lobby','playing','finished')) default 'lobby',
  rounds_total int not null default 3,
  round_duration_seconds int not null default 80,
  word_theme text not null default 'all',
  current_round int not null default 0,
  current_drawer_player_id uuid,
  current_word text,
  word_choices text[],
  round_started_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.draw_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.draw_rooms(id) on delete cascade,
  pseudo text not null,
  avatar_color text not null,
  score int not null default 0,
  is_host boolean not null default false,
  joined_at timestamptz not null default now()
);

create table public.draw_strokes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.draw_rooms(id) on delete cascade,
  round_number int not null,
  stroke_data jsonb not null,
  created_at timestamptz not null default now()
);

create table public.draw_guesses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.draw_rooms(id) on delete cascade,
  player_id uuid not null,
  round_number int not null,
  content text not null,
  is_correct boolean not null default false,
  points_earned int not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS (access via service role only — all API routes use createAdminSupabaseClient)
alter table public.draw_rooms enable row level security;
alter table public.draw_players enable row level security;
alter table public.draw_strokes enable row level security;
alter table public.draw_guesses enable row level security;

-- Permissive policies (all access controlled at application layer)
create policy "allow_all_draw_rooms" on public.draw_rooms for all using (true) with check (true);
create policy "allow_all_draw_players" on public.draw_players for all using (true) with check (true);
create policy "allow_all_draw_strokes" on public.draw_strokes for all using (true) with check (true);
create policy "allow_all_draw_guesses" on public.draw_guesses for all using (true) with check (true);

-- Enable Realtime for broadcast channels (needed for canvas sync)
-- Run this if not already enabled:
-- alter publication supabase_realtime add table public.draw_rooms;
