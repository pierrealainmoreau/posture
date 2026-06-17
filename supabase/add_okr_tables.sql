-- ── OKR Tables ─────────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor.

-- Table company_okrs
CREATE TABLE IF NOT EXISTS public.company_okrs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period      TEXT        NOT NULL,
  objective   TEXT        NOT NULL,
  key_results JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_okrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own company OKRs"
  ON public.company_okrs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User inserts own company OKRs"
  ON public.company_okrs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User updates own company OKRs"
  ON public.company_okrs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "User deletes own company OKRs"
  ON public.company_okrs FOR DELETE
  USING (auth.uid() = user_id);

-- Table collaborator_okrs
CREATE TABLE IF NOT EXISTS public.collaborator_okrs (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id      UUID        NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  company_okr_id       UUID        NOT NULL REFERENCES public.company_okrs(id) ON DELETE CASCADE,
  objective            TEXT        NOT NULL,
  key_results          JSONB       NOT NULL DEFAULT '[]'::jsonb,
  alignment_rationale  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collaborator_id, company_okr_id)
);

ALTER TABLE public.collaborator_okrs ENABLE ROW LEVEL SECURITY;

-- RLS via join to collaborators (user owns the collaborator)
CREATE POLICY "User reads own collaborator OKRs"
  ON public.collaborator_okrs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE collaborators.id = collaborator_okrs.collaborator_id
        AND collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "User inserts own collaborator OKRs"
  ON public.collaborator_okrs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE collaborators.id = collaborator_okrs.collaborator_id
        AND collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "User updates own collaborator OKRs"
  ON public.collaborator_okrs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE collaborators.id = collaborator_okrs.collaborator_id
        AND collaborators.user_id = auth.uid()
    )
  );
