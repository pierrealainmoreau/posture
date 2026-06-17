-- Likes sur les éléments de roadmap
-- À exécuter dans l'éditeur SQL de ton projet Supabase

create table if not exists public.roadmap_likes (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.roadmap_items(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(item_id, user_id)
);

alter table public.roadmap_likes enable row level security;

-- Lecture publique (pour compter les likes)
create policy "roadmap_likes_select" on public.roadmap_likes
  for select using (true);

-- Insertion uniquement pour son propre user_id
create policy "roadmap_likes_insert" on public.roadmap_likes
  for insert with check (auth.uid() = user_id and auth.uid() is not null);

-- Suppression uniquement de ses propres likes
create policy "roadmap_likes_delete" on public.roadmap_likes
  for delete using (auth.uid() = user_id);
