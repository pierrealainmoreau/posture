export interface ChaineRoom {
  id: string;
  code: string;
  host_player_id: string;
  status: "lobby" | "playing" | "voting" | "finished";
  starter_word: string;
  current_turn_index: number;
  player_order: string[];
  turn_started_at: string | null;
  created_at: string;
  players?: ChainePlayer[];
  words?: ChaineWord[];
}

export interface ChainePlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  joined_at: string;
}

export interface ChaineWord {
  id: string;
  room_id: string;
  player_id: string | null;
  turn_index: number;
  word: string | null;
  submitted_at: string;
}

export interface ChaineVote {
  id: string;
  room_id: string;
  voter_player_id: string;
  voted_turn_index: number;
  voted_at: string;
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];
