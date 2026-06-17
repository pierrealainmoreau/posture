-- ============================================================
-- Déclenchement automatique des notifications "user_signup"
-- (la création de la ligne `profiles` se fait déjà via un trigger
--  existant sur auth.users — celui-ci s'ajoute sans le modifier)
-- ============================================================

create or replace function public.notify_on_new_profile()
returns trigger as $$
begin
  insert into public.notifications (user_id, title, body, type, href)
  select new.id, t.title, t.body, t.type, t.href
  from public.notification_templates t
  where t.trigger_event = 'user_signup'
    and t.is_active = true;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_notify on public.profiles;

create trigger on_profile_created_notify
  after insert on public.profiles
  for each row execute function public.notify_on_new_profile();
