-- "2 Vérités 1 Mensonge" tables
create table public.tvml_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  creator_user_id uuid references auth.users(id),
  phase text not null default 'collecting',
  is_active boolean not null default true,
  participants text[] not null default '{}',
  launched_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.tvml_statements (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.tvml_rooms(id) on delete cascade,
  participant_name text not null,
  statement_1 text not null,
  statement_2 text not null,
  statement_3 text not null,
  lie_index int not null check (lie_index in (1, 2, 3)),
  created_at timestamptz not null default now()
);

create table public.tvml_votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.tvml_rooms(id) on delete cascade,
  statements_id uuid not null references public.tvml_statements(id) on delete cascade,
  voter_name text not null,
  guessed_lie_index int not null check (guessed_lie_index in (1, 2, 3)),
  created_at timestamptz not null default now(),
  unique(statements_id, voter_name)
);

alter table public.tvml_rooms enable row level security;
alter table public.tvml_statements enable row level security;
alter table public.tvml_votes enable row level security;

create policy "allow_all_tvml_rooms" on public.tvml_rooms for all using (true) with check (true);
create policy "allow_all_tvml_statements" on public.tvml_statements for all using (true) with check (true);
create policy "allow_all_tvml_votes" on public.tvml_votes for all using (true) with check (true);
