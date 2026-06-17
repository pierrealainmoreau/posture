-- Draw It v3 — Add round history table to persist word + drawer per round
-- Run this in your Supabase SQL editor

create table if not exists public.draw_round_history (
  id              uuid        primary key default gen_random_uuid(),
  room_id         uuid        not null references public.draw_rooms(id) on delete cascade,
  round_number    int         not null,
  drawer_player_id uuid,
  word            text,
  created_at      timestamptz not null default now()
);

alter table public.draw_round_history enable row level security;
drop policy if exists "allow_all_draw_round_history" on public.draw_round_history;
create policy "allow_all_draw_round_history"
  on public.draw_round_history for all using (true) with check (true);

create index if not exists draw_round_history_room_idx
  on public.draw_round_history(room_id);
