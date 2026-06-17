CREATE TABLE IF NOT EXISTS roti_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_player_id UUID,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'voting', 'finished')),
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roti_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES roti_rooms(id) ON DELETE CASCADE,
  pseudo TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#3b82f6',
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  player_secret TEXT NOT NULL,
  vote INT CHECK (vote BETWEEN 1 AND 5),
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roti_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE roti_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_roti_rooms" ON roti_rooms FOR ALL USING (true);
CREATE POLICY "allow_all_roti_players" ON roti_players FOR ALL USING (true);
