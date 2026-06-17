export interface TribuRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "playing" | "revealing" | "finished";
  question_theme: string;
  question_count: number;
  question_ids: string[];
  created_at: string;
}

export interface TribuPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  finished_at: string | null;
  joined_at: string;
}

export interface Tribe {
  id: string;
  playerIds: string[];
  profileId: string;
  similarityScore: number;
  signatureAnswers?: Array<{ questionId: string; value: string; label: string }>;
}

export interface TribuResult {
  id: string;
  room_id: string;
  tribes: Tribe[];
  computed_at: string;
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];
