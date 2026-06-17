-- Retrospective module — Health Radar
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS retro_rooms (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT        NOT NULL UNIQUE,
  host_player_id   UUID,
  status           TEXT        NOT NULL DEFAULT 'lobby'
                               CHECK (status IN ('lobby', 'voting', 'finished')),
  creator_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retro_players (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        UUID        NOT NULL REFERENCES retro_rooms(id) ON DELETE CASCADE,
  pseudo         TEXT        NOT NULL,
  avatar_color   TEXT        NOT NULL DEFAULT '#3b82f6',
  is_host        BOOLEAN     NOT NULL DEFAULT false,
  player_secret  TEXT,
  comment        TEXT,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retro_votes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID        NOT NULL REFERENCES retro_rooms(id) ON DELETE CASCADE,
  player_id   UUID        NOT NULL REFERENCES retro_players(id) ON DELETE CASCADE,
  criterion   TEXT        NOT NULL,
  score       INTEGER     NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, player_id, criterion)
);

CREATE INDEX IF NOT EXISTS idx_retro_rooms_code       ON retro_rooms(code);
CREATE INDEX IF NOT EXISTS idx_retro_players_room_id  ON retro_players(room_id);
CREATE INDEX IF NOT EXISTS idx_retro_votes_room_id    ON retro_votes(room_id);
CREATE INDEX IF NOT EXISTS idx_retro_votes_player_id  ON retro_votes(player_id);

ALTER TABLE retro_rooms   DISABLE ROW LEVEL SECURITY;
ALTER TABLE retro_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE retro_votes   DISABLE ROW LEVEL SECURITY;
