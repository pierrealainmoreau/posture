export interface SpeedRetroRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "writing" | "voting" | "finished";
  creator_user_id: string | null;
  questions: string[];
  vote_limit: number | null;
  timer_enabled: boolean;
  writing_started_at: string | null;
  voting_started_at: string | null;
  created_at: string;
}

export interface SpeedRetroPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  items_submitted: boolean;
  joined_at: string;
}

export interface SpeedRetroItem {
  id: string;
  room_id: string;
  question_index: number;
  content: string;
  vote_count: number;
  my_vote: boolean;
}

export const DEFAULT_QUESTIONS = [
  "Ce qui a bien marché 🟢",
  "Ce qui m'a frustré 🔴",
  "Ce qu'on devrait arrêter 🛑",
  "Une action concrète pour la suite ⚡",
];
