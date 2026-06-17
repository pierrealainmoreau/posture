-- Draw It v2 — add creator_user_id for admin tracking
-- Run this in your Supabase SQL editor

alter table public.draw_rooms
  add column if not exists creator_user_id uuid references auth.users(id);

-- Index for the admin query
create index if not exists draw_rooms_creator_user_id_idx
  on public.draw_rooms(creator_user_id);
