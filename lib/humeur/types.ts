export interface HumeurRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "playing" | "finished";
  creator_user_id: string | null;
  created_at: string;
}

export interface HumeurPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  mood_id: string | null;
  joined_at: string;
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];
