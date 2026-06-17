-- Ajoute la phase 'released' à roadmap_items
-- À exécuter dans l'éditeur SQL de ton projet Supabase

ALTER TABLE public.roadmap_items
  DROP CONSTRAINT IF EXISTS roadmap_items_phase_check;

ALTER TABLE public.roadmap_items
  ADD CONSTRAINT roadmap_items_phase_check
  CHECK (phase IN ('now', 'next', 'later', 'released'));
