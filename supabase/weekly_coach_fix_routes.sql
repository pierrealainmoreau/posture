-- Fix routes incorrectes dans daily_action_templates
-- /kudo-cards → /reunion-maker/kudo-cards
-- /mini-jeux/abcde → /reunion-maker/abcde

update public.daily_action_templates
set route = '/reunion-maker/kudo-cards'
where route = '/kudo-cards';

update public.daily_action_templates
set route = '/reunion-maker/abcde'
where route = '/mini-jeux/abcde';
