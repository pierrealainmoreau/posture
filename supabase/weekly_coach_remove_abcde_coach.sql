-- Supprime ABCDE et 1:1 Coach des suggestions Weekly Coach

-- Communication/Mercredi : ABCDE → Kudo Cards
update public.daily_action_templates
set
  title       = 'Valorisez votre équipe — Kudo Cards',
  description = 'La reconnaissance renforce la cohésion et fluidifie la communication.',
  category    = 'Reconnaissance',
  action_type = 'kudo_cards',
  route       = '/reunion-maker/kudo-cards'
where need_type = 'communication' and day_of_week = 3;

-- Performance/Mercredi : 1:1 Coach → Draw it!
update public.daily_action_templates
set
  title       = 'Jeu collaboratif — Draw it!',
  description = 'Un jeu d''équipe pour renforcer la cohésion en milieu de semaine.',
  category    = 'Mini-jeu',
  action_type = 'draw',
  route       = '/mini-jeux/draw'
where need_type = 'performance' and day_of_week = 3;

-- Onboarding/Mercredi : 1:1 Coach → Kudo Cards
update public.daily_action_templates
set
  title       = 'Valorisez l''équipe — Kudo Cards',
  description = 'Intégrez le nouveau dans une culture de reconnaissance.',
  category    = 'Reconnaissance',
  action_type = 'kudo_cards',
  route       = '/reunion-maker/kudo-cards'
where need_type = 'onboarding' and day_of_week = 3;
