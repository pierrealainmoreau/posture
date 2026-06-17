export type Stroke = {
  points: Array<{ x: number; y: number }>;
  brushSize: 2 | 6 | 12;
  tool: "pen" | "eraser";
  drawerPlayerId: string;
};

export interface DrawRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "playing" | "finished";
  rounds_total: number;
  round_duration_seconds: number;
  word_theme: string;
  current_round: number;
  current_drawer_player_id: string | null;
  current_word: string | null;
  word_choices: string[] | null;
  round_started_at: string | null;
  created_at: string;
  players?: DrawPlayer[];
}

export interface DrawPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  score: number;
  is_host: boolean;
  joined_at: string;
}

export interface DrawGuess {
  id: string;
  room_id: string;
  player_id: string;
  round_number: number;
  content: string;
  is_correct: boolean;
  points_earned: number;
  created_at: string;
  draw_players?: { pseudo: string; avatar_color: string };
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];
