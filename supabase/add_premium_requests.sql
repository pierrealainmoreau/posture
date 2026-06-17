-- Migration : table premium_requests
-- À exécuter dans l'éditeur SQL de Supabase

create table if not exists public.premium_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  status     text not null default 'pending'
             check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un seul enregistrement actif par utilisateur (pending ou approved)
create unique index if not exists premium_requests_user_pending_idx
  on public.premium_requests (user_id)
  where status = 'pending';

-- RLS
alter table public.premium_requests enable row level security;

-- L'utilisateur peut lire sa propre demande
create policy "User reads own premium request"
  on public.premium_requests for select
  using (auth.uid() = user_id);

-- L'utilisateur peut insérer une demande (une seule pending à la fois, garanti par l'index)
create policy "User inserts own premium request"
  on public.premium_requests for insert
  with check (auth.uid() = user_id);
