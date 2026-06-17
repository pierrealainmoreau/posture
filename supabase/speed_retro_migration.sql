CREATE TABLE IF NOT EXISTS speed_retro_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_player_id UUID,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'writing', 'voting', 'finished')),
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  questions JSONB NOT NULL DEFAULT '["Ce qui a bien marché 🟢","Ce qui m''a frustré 🔴","Ce qu''on devrait arrêter 🛑","Une action concrète pour la suite ⚡"]'::jsonb,
  vote_limit INT,
  timer_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  writing_started_at TIMESTAMPTZ,
  voting_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speed_retro_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES speed_retro_rooms(id) ON DELETE CASCADE,
  pseudo TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#3b82f6',
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  player_secret TEXT NOT NULL,
  items_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speed_retro_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES speed_retro_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES speed_retro_players(id) ON DELETE CASCADE,
  question_index INT NOT NULL CHECK (question_index BETWEEN 0 AND 3),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speed_retro_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES speed_retro_rooms(id) ON DELETE CASCADE,
  voter_player_id UUID NOT NULL REFERENCES speed_retro_players(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES speed_retro_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voter_player_id, item_id)
);

ALTER TABLE speed_retro_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE speed_retro_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE speed_retro_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE speed_retro_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_speed_retro_rooms" ON speed_retro_rooms FOR ALL USING (true);
CREATE POLICY "allow_all_speed_retro_players" ON speed_retro_players FOR ALL USING (true);
CREATE POLICY "allow_all_speed_retro_items" ON speed_retro_items FOR ALL USING (true);
CREATE POLICY "allow_all_speed_retro_votes" ON speed_retro_votes FOR ALL USING (true);
