-- ============================================================
-- Weekly Coach — migration Supabase
-- ============================================================

-- 1. Configuration par utilisateur (besoin sélectionné à l'onboarding)
create table public.weekly_coach_configs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null unique,
  need_type  text        not null check (need_type in ('cohesion','performance','wellbeing','communication','onboarding')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_weekly_coach_configs_user on public.weekly_coach_configs(user_id);

alter table public.weekly_coach_configs enable row level security;

create policy "user_owns_weekly_coach_config" on public.weekly_coach_configs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Templates d'actions quotidiennes (configurables par l'admin)
create table public.daily_action_templates (
  id          uuid        primary key default gen_random_uuid(),
  need_type   text        not null check (need_type in ('cohesion','performance','wellbeing','communication','onboarding')),
  day_of_week int         not null check (day_of_week between 1 and 5), -- 1=Lundi ... 5=Vendredi (JS getDay())
  title       text        not null,
  description text,
  category    text        not null,
  action_type text        not null, -- clé pour l'auto-validation
  route       text        not null, -- route Next.js cible
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (need_type, day_of_week)
);

alter table public.daily_action_templates enable row level security;

-- Lecture publique pour tous les utilisateurs authentifiés
create policy "authenticated_read_templates" on public.daily_action_templates
  for select using (auth.uid() is not null);

-- Écriture réservée à l'admin (via service role dans les API admin)

-- 3. Complétions journalières (auto-validées par les outils)
create table public.daily_action_completions (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null,
  completed_date date        not null default current_date,
  action_type    text        not null,
  created_at     timestamptz not null default now(),
  unique (user_id, completed_date)
);

create index idx_daily_completions_user_date on public.daily_action_completions(user_id, completed_date);

alter table public.daily_action_completions enable row level security;

create policy "user_owns_completions" on public.daily_action_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Seed : templates par défaut (5 besoins × 5 jours = 25 lignes)
-- ============================================================

insert into public.daily_action_templates (need_type, day_of_week, title, description, category, action_type, route) values

-- Cohésion d'équipe
('cohesion', 1, 'Lancez le Mini-jeu Humeur du jour',      'Ouvrez la semaine en prenant le pouls de l''équipe.',              'Mini-jeu',       'humeur',        '/mini-jeux/humeur'),
('cohesion', 2, 'Animez un Icebreaker en équipe',          'Une question courte pour briser la glace en réunion.',             'Mini-jeu',       'icebreaker',    '/icebreaker'),
('cohesion', 3, 'Envoyez des Kudo Cards à l''équipe',      'Reconnaître un collègue renforce la cohésion.',                    'Reconnaissance', 'kudo_cards',    '/reunion-maker/kudo-cards'),
('cohesion', 4, 'Organisez une Rétrospective d''équipe',   'Faites le point collectivement sur la semaine écoulée.',           'Rétrospective',  'retrospective', '/retrospective'),
('cohesion', 5, 'Jeu collaboratif — Draw it!',             'Terminez la semaine en légèreté avec un jeu d''équipe.',           'Mini-jeu',       'draw',          '/mini-jeux/draw'),

-- Performance collective
('performance', 1, 'Réalisez un Quiz managérial',                'Testez et affûtez vos compétences de manager.',              'Quiz',           'quiz',          '/academie'),
('performance', 2, 'Générez un feedback constructif',            'Formulez un retour SBI clair et actionnable.',               'Feedback',       'feedback',      '/feedback'),
('performance', 3, 'Jeu collaboratif — Draw it!',                'Un jeu d''équipe pour renforcer la cohésion en milieu de semaine.', 'Mini-jeu',  'draw',          '/mini-jeux/draw'),
('performance', 4, 'Préparez votre réunion hebdo',               'Un ordre du jour clair pour une réunion efficace.',          'Réunion',        'reunion',       '/reunion-maker'),
('performance', 5, 'Analysez la semaine — Rétrospective',        'Identifiez les axes d''amélioration collectifs.',            'Rétrospective',  'retrospective', '/retrospective'),

-- Bien-être au travail
('wellbeing', 1, 'Prenez le pouls de l''équipe',                 'Mesurez l''humeur collective pour mieux accompagner.',       'Mini-jeu',       'humeur',        '/mini-jeux/humeur'),
('wellbeing', 2, 'Renforcez les liens — Icebreaker',             'Un moment informel pour se (re)découvrir.',                  'Mini-jeu',       'icebreaker',    '/icebreaker'),
('wellbeing', 3, 'Valorisez votre équipe — Kudo Cards',          'La reconnaissance est le premier moteur du bien-être.',      'Reconnaissance', 'kudo_cards',    '/reunion-maker/kudo-cards'),
('wellbeing', 4, 'Réflexion collective — Rétrospective',         'Créez un espace sûr pour s''exprimer ensemble.',             'Rétrospective',  'retrospective', '/retrospective'),
('wellbeing', 5, 'Terminez la semaine en légèreté — Draw it!',   'Un jeu pour finir la semaine avec le sourire.',              'Mini-jeu',       'draw',          '/mini-jeux/draw'),

-- Communication d''équipe
('communication', 1, 'Ouvrez la semaine avec un Icebreaker',     'Créez une atmosphère propice à la communication ouverte.',   'Mini-jeu',       'icebreaker',    '/icebreaker'),
('communication', 2, 'Prenez le pouls — Humeur du jour',         'Détectez les non-dits avant qu''ils deviennent des blocages.','Mini-jeu',      'humeur',        '/mini-jeux/humeur'),
('communication', 3, 'Valorisez votre équipe — Kudo Cards',       'La reconnaissance renforce la cohésion et fluidifie la communication.', 'Reconnaissance', 'kudo_cards', '/reunion-maker/kudo-cards'),
('communication', 4, 'Organisez votre réunion hebdo',            'Un ordre du jour précis pour des échanges plus fluides.',    'Réunion',        'reunion',       '/reunion-maker'),
('communication', 5, 'Analysez la semaine — Rétrospective',      'Exprimez ce qui a bien marché et ce qui peut s''améliorer.', 'Rétrospective',  'retrospective', '/retrospective'),

-- Intégrer un collaborateur
('onboarding', 1, 'Accueillez avec un Icebreaker',               'Facilitez l''intégration avec une activité de connaissance.', 'Mini-jeu',      'icebreaker',    '/icebreaker'),
('onboarding', 2, 'Mesurez l''humeur de l''équipe',              'Vérifiez que l''intégration se passe bien côté collectif.',   'Mini-jeu',      'humeur',        '/mini-jeux/humeur'),
('onboarding', 3, 'Valorisez l''équipe — Kudo Cards',             'Intégrez le nouveau dans une culture de reconnaissance.',     'Reconnaissance','kudo_cards',    '/reunion-maker/kudo-cards'),
('onboarding', 4, 'Valorisez l''équipe — Kudo Cards',            'Intégrez le nouveau dans une culture de reconnaissance.',     'Reconnaissance','kudo_cards',    '/reunion-maker/kudo-cards'),
('onboarding', 5, 'Faites le point — Rétrospective',             'Donnez la parole à tous, nouveau membre inclus.',             'Rétrospective', 'retrospective', '/retrospective');
