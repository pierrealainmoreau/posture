import type { CustomQuestion } from "./questions";

export interface ThisOrThatRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "playing" | "finished";
  current_question_index: number;
  show_results: boolean;
  question_ids: string[];
  custom_questions: CustomQuestion[];
  creator_user_id: string | null;
  created_at: string;
  next_game_type?: string | null;
  next_game_code?: string | null;
}

export interface ThisOrThatPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  joined_at: string;
}

export interface ThisOrThatVote {
  player_id: string;
  question_index: number;
  choice: "a" | "b";
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];
