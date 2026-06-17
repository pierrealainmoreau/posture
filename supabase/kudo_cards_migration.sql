-- Kudo Cards migration

CREATE TABLE kudo_rooms (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code             TEXT UNIQUE NOT NULL,
  host_player_id   UUID,
  status           TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'writing', 'revealed')),
  creator_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE kudo_players (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id       UUID REFERENCES kudo_rooms(id) ON DELETE CASCADE NOT NULL,
  pseudo        TEXT NOT NULL,
  avatar_color  TEXT NOT NULL DEFAULT '#3b82f6',
  is_host       BOOLEAN NOT NULL DEFAULT false,
  player_secret TEXT NOT NULL,
  joined_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE kudo_rooms
  ADD CONSTRAINT kudo_rooms_host_fk
  FOREIGN KEY (host_player_id) REFERENCES kudo_players(id) ON DELETE SET NULL;

CREATE TABLE kudo_cards (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id      UUID REFERENCES kudo_rooms(id) ON DELETE CASCADE NOT NULL,
  author_id    UUID REFERENCES kudo_players(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES kudo_players(id) ON DELETE CASCADE NOT NULL,
  category     TEXT NOT NULL,
  message      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (room_id, author_id, recipient_id)
);

ALTER TABLE kudo_rooms   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudo_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudo_cards   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read kudo_rooms"   ON kudo_rooms   FOR SELECT USING (true);
CREATE POLICY "Public read kudo_players" ON kudo_players FOR SELECT USING (true);
CREATE POLICY "Public read kudo_cards"   ON kudo_cards   FOR SELECT USING (true);
