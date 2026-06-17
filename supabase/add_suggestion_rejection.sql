-- Ajout du motif de refus sur les suggestions
alter table public.suggestions
  add column if not exists rejection_reason text;
