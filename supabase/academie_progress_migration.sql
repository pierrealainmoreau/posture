-- ─── Académie : Quiz Progress & Badges ────────────────────────────────────────
-- Run this in the Supabase SQL editor (project dashboard > SQL Editor).

-- 1. Quiz progress (one row per user × pathway × quiz)
CREATE TABLE IF NOT EXISTS academie_quiz_progress (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathway_id       text        NOT NULL,
  quiz_id          text        NOT NULL,
  best_score       integer     NOT NULL DEFAULT 0,
  total_questions  integer     NOT NULL DEFAULT 0,
  passed           boolean     NOT NULL DEFAULT false,
  attempts         integer     NOT NULL DEFAULT 0,
  last_attempt_at  timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academie_quiz_progress_unique UNIQUE (user_id, pathway_id, quiz_id)
);

ALTER TABLE academie_quiz_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academie_quiz_progress_user_policy"
  ON academie_quiz_progress
  FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Earned badges (one row per user × pathway)
CREATE TABLE IF NOT EXISTS academie_badges (
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathway_id  text        NOT NULL,
  earned_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pathway_id)
);

ALTER TABLE academie_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academie_badges_user_policy"
  ON academie_badges
  FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
