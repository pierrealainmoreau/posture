-- Icebreaker v2 — add game_type to distinguish Icebreaker vs Anecdotes rooms
-- Run this in your Supabase SQL editor

alter table public.icebreaker_rooms
  add column if not exists game_type text not null default 'icebreaker';

-- Index for the admin query
create index if not exists icebreaker_rooms_game_type_idx
  on public.icebreaker_rooms(game_type);
