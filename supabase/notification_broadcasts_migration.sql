-- ============================================================
-- Historique des envois one-shot + expiration 7 jours
-- ============================================================

-- Table de suivi des broadcasts one-shot admin
create table public.notification_broadcasts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  type        text not null default 'info'
                check (type in ('info', 'success', 'warning', 'new_feature')),
  href        text,
  target      text not null default 'all',
  sent_count  integer not null default 0,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.notification_broadcasts enable row level security;

-- Seuls les admins accèdent aux broadcasts (via service role en API)
create policy "admin_notification_broadcasts" on public.notification_broadcasts
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Lier chaque notification à son broadcast (nullable pour les notifications auto)
alter table public.notifications
  add column broadcast_id uuid references public.notification_broadcasts(id) on delete cascade,
  add column expires_at   timestamptz;

-- Index pour le filtre d'expiration côté user
create index idx_notifications_expires_at on public.notifications(expires_at);
