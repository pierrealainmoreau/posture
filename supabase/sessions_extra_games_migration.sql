-- ============================================================
-- Extension du système multi-sessions : Boussole, Humeur, Tribu
-- À exécuter dans Supabase Studio > SQL Editor APRÈS sessions_migration.sql
-- ============================================================

-- ── 1. Élargir la contrainte game_type de session_activities ──

alter table public.session_activities
  drop constraint if exists session_activities_game_type_check;

alter table public.session_activities
  add constraint session_activities_game_type_check
  check (game_type in (
    'retrospective',
    'abcde',
    'kudo_cards',
    'roti',
    'undercover',
    'chaine',
    'code_secret',
    'speed_retro',
    'draw',
    'boussole',
    'humeur',
    'tribu'
  ));

-- ── 2. Colonne session_id sur les tables rooms ─────────────

alter table public.boussole_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.humeur_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.tribu_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

create index if not exists idx_boussole_rooms_session_id on public.boussole_rooms(session_id) where session_id is not null;
create index if not exists idx_humeur_rooms_session_id   on public.humeur_rooms(session_id)   where session_id is not null;
create index if not exists idx_tribu_rooms_session_id    on public.tribu_rooms(session_id)    where session_id is not null;
