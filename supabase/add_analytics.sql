-- Table de tracking analytics
create table if not exists public.analytics_events (
  id        bigserial primary key,
  path      text        not null,
  referrer  text,
  session_id text       not null,
  user_id   uuid        references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_created_at  on public.analytics_events (created_at desc);
create index if not exists idx_analytics_session_id  on public.analytics_events (session_id);
create index if not exists idx_analytics_path        on public.analytics_events (path);

-- Seul le service role peut lire/écrire (pas de politique user)
alter table public.analytics_events enable row level security;
