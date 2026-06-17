-- ============================================================
-- Sessions multi-jeux
-- Permet à un groupe de participants de jouer à plusieurs
-- activités successives sans changer de code de session.
-- À exécuter dans Supabase Studio > SQL Editor
-- ============================================================

-- ── 1. TABLE SESSIONS ──────────────────────────────────────

create table if not exists public.sessions (
  id              uuid        primary key default gen_random_uuid(),
  code            text        unique not null,
  host_user_id    uuid        references auth.users(id) on delete set null,
  name            text,
  status          text        not null default 'lobby'
                              check (status in ('lobby', 'playing', 'between_games', 'finished')),
  created_at      timestamptz not null default now()
);

create index if not exists idx_sessions_code on public.sessions(code);

-- ── 2. TABLE SESSION_PARTICIPANTS ──────────────────────────
-- Participants inscrits à la session (une seule fois pour tous les jeux)

create table if not exists public.session_participants (
  id            uuid        primary key default gen_random_uuid(),
  session_id    uuid        not null references public.sessions(id) on delete cascade,
  pseudo        text        not null,
  avatar_color  text        not null default '#3b82f6',
  is_host       boolean     not null default false,
  player_secret text        not null,
  joined_at     timestamptz not null default now()
);

create index if not exists idx_session_participants_session on public.session_participants(session_id);

-- ── 3. TABLE SESSION_ACTIVITIES ────────────────────────────
-- Trace chaque jeu lancé dans la session, dans l'ordre

create table if not exists public.session_activities (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references public.sessions(id) on delete cascade,
  game_type   text        not null
                          check (game_type in (
                            'retrospective',
                            'abcde',
                            'kudo_cards',
                            'roti',
                            'undercover',
                            'chaine',
                            'code_secret',
                            'speed_retro',
                            'draw'
                          )),
  room_code   text        not null,
  "order"     integer     not null default 1,
  status      text        not null default 'active'
                          check (status in ('active', 'finished')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_session_activities_session on public.session_activities(session_id);

-- ── 4. COLONNE session_id SUR LES TABLES ROOMS ─────────────
-- Nullable : les rooms standalone continuent de fonctionner

alter table public.retro_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.abcde_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.kudo_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.roti_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.undercover_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.chaine_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.code_secret_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.speed_retro_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

alter table public.draw_rooms
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

-- Index utiles pour retrouver les rooms d'une session
create index if not exists idx_retro_rooms_session_id        on public.retro_rooms(session_id)       where session_id is not null;
create index if not exists idx_abcde_rooms_session_id        on public.abcde_rooms(session_id)       where session_id is not null;
create index if not exists idx_kudo_rooms_session_id         on public.kudo_rooms(session_id)        where session_id is not null;
create index if not exists idx_roti_rooms_session_id         on public.roti_rooms(session_id)        where session_id is not null;
create index if not exists idx_undercover_rooms_session_id   on public.undercover_rooms(session_id)  where session_id is not null;
create index if not exists idx_chaine_rooms_session_id       on public.chaine_rooms(session_id)      where session_id is not null;
create index if not exists idx_code_secret_rooms_session_id  on public.code_secret_rooms(session_id) where session_id is not null;
create index if not exists idx_speed_retro_rooms_session_id  on public.speed_retro_rooms(session_id) where session_id is not null;
create index if not exists idx_draw_rooms_session_id         on public.draw_rooms(session_id)        where session_id is not null;

-- ── 5. RLS ─────────────────────────────────────────────────
-- Lecture publique (accès par code), écriture via admin client uniquement

alter table public.sessions             disable row level security;
alter table public.session_participants disable row level security;
alter table public.session_activities   disable row level security;
