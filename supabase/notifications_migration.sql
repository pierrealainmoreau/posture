-- ============================================================
-- Centre de notifications
-- ============================================================

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  body         text,
  type         text not null default 'info'
                 check (type in ('info', 'success', 'warning', 'new_feature')),
  href         text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index idx_notifications_user_id   on public.notifications(user_id);
create index idx_notifications_is_read   on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

create policy "user_owns_notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Templates d'envoi (gérés par l'admin)
create table public.notification_templates (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  body           text,
  type           text not null default 'info'
                   check (type in ('info', 'success', 'warning', 'new_feature')),
  href           text,
  trigger_event  text, -- null = one-shot manuel, sinon event automatique
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.notification_templates enable row level security;

-- Seuls les admins lisent/écrivent les templates (via service role en API)
create policy "admin_notification_templates" on public.notification_templates
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
