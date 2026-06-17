-- Code Secret: migration
-- Run in Supabase Studio SQL editor

CREATE TABLE IF NOT EXISTS code_secret_rooms (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                VARCHAR(6)   NOT NULL UNIQUE,
  host_player_id      UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  creator_user_id     UUID         REFERENCES auth.users(id),
  status              TEXT         NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'finished')),
  game_mode           TEXT         NOT NULL DEFAULT 'coop' CHECK (game_mode IN ('coop', 'competitive')),
  challenge_id        TEXT         NOT NULL,
  difficulty          TEXT         NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_limit_seconds  INT          NOT NULL DEFAULT 600,
  started_at          TIMESTAMPTZ,
  winner_team         TEXT,
  solved_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_secret_players (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID         NOT NULL REFERENCES code_secret_rooms(id) ON DELETE CASCADE,
  pseudo        VARCHAR(30)  NOT NULL,
  avatar_color  VARCHAR(20)  NOT NULL DEFAULT '#3b82f6',
  is_host       BOOLEAN      NOT NULL DEFAULT FALSE,
  team          TEXT,
  player_secret TEXT         NOT NULL DEFAULT '',
  joined_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_secret_revealed_hints (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id               UUID        NOT NULL REFERENCES code_secret_rooms(id) ON DELETE CASCADE,
  hint_index            INT         NOT NULL,
  team                  TEXT,
  revealed_by_player_id UUID        NOT NULL,
  revealed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent revealing same hint twice for same room+team
CREATE UNIQUE INDEX IF NOT EXISTS idx_code_secret_hints_coop
  ON code_secret_revealed_hints(room_id, hint_index)
  WHERE team IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_code_secret_hints_competitive
  ON code_secret_revealed_hints(room_id, hint_index, team)
  WHERE team IS NOT NULL;

CREATE TABLE IF NOT EXISTS code_secret_submissions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID        NOT NULL REFERENCES code_secret_rooms(id) ON DELETE CASCADE,
  team          TEXT,
  player_id     UUID        NOT NULL,
  answer        TEXT        NOT NULL,
  is_correct    BOOLEAN     NOT NULL DEFAULT FALSE,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_code_secret_players_room ON code_secret_players(room_id);
CREATE INDEX IF NOT EXISTS idx_code_secret_hints_room   ON code_secret_revealed_hints(room_id);
CREATE INDEX IF NOT EXISTS idx_code_secret_subs_room    ON code_secret_submissions(room_id);
