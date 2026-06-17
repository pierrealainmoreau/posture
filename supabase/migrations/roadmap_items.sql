-- Roadmap items — migration Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase

create table if not exists public.roadmap_items (
  id          uuid primary key default gen_random_uuid(),
  phase       text not null check (phase in ('now', 'next', 'later')),
  title       text not null,
  description text not null default '',
  tag         text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.roadmap_items enable row level security;

-- Lecture publique
create policy "roadmap_items_select" on public.roadmap_items
  for select using (true);

-- Écriture admin seulement
create policy "roadmap_items_insert" on public.roadmap_items
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "roadmap_items_update" on public.roadmap_items
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "roadmap_items_delete" on public.roadmap_items
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
