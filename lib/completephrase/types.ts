export interface CompletePhraseRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "playing" | "finished";
  starter_phrase: string;          // gardé pour rétro-compat (= starter_phrases[0])
  starter_phrases: string[];       // liste ordonnée des phrases
  current_phrase_index: number;    // indice de la phrase en cours
  phrase_started_at: string | null; // horodatage pour le timer 30s
  creator_user_id: string | null;
  created_at: string;
}

export interface CompletePhrasePlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  response: string | null;          // gardé pour rétro-compat
  responses: (string | null)[];     // réponses indexées par phrase
  joined_at: string;
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];
