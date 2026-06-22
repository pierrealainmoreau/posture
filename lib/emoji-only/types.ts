export type EmojiOnlyStatus =
  | "lobby"
  | "encoding"
  | "generating"
  | "guessing"
  | "reveal"
  | "finished";

export interface EmojiOnlyRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: EmojiOnlyStatus;
  creator_user_id: string | null;
  category: "films" | "valeurs" | "animaux" | "custom";
  custom_words: string[];
  word_pool: string[];
  current_round: number;
  total_rounds: number;
  current_encoder_player_id: string | null;
  encoder_order: string[];
  phase_started_at: string | null;
  created_at: string;
}

export interface EmojiOnlyPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  score: number;
  is_active: boolean;
  last_seen_at: string;
  joined_at: string;
}

export interface EmojiOnlyRound {
  id: string;
  room_id: string;
  round_number: number;
  encoder_player_id: string;
  word: string | null;
  emoji_sequence: string | null;
  options: string[] | null;
  correct_option: string | null;
  encoding_started_at: string | null;
  guessing_started_at: string | null;
  revealed_at: string | null;
}

export interface EmojiOnlyGuess {
  id: string;
  round_id: string;
  player_id: string;
  chosen_option: string;
  is_correct: boolean;
  points_earned: number;
  submitted_at: string;
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

export const ENCODE_SECONDS = 45;
export const GUESS_SECONDS  = 45;
export const MAX_EMOJIS     = 5;

export const WORD_BANK: Record<string, string[]> = {
  films: [
    "Titanic", "Matrix", "Avatar", "Joker", "Interstellar", "La La Land",
    "Inception", "Parasite", "Pulp Fiction", "Toy Story", "Batman",
    "Harry Potter", "Star Wars", "Friends", "Squid Game", "Narcos",
    "Frozen", "Breaking Bad", "The Office", "Stranger Things",
    "Shrek", "Jurassic Park", "Le Roi Lion", "Forrest Gump", "Fight Club",
  ],
  valeurs: [
    "Confiance", "Bienveillance", "Innovation", "Transparence", "Audace",
    "Collaboration", "Excellence", "Équité", "Créativité", "Respect",
    "Agilité", "Empathie", "Ambition", "Intégrité", "Adaptabilité",
    "Engagement", "Humilité", "Curiosité", "Courage", "Solidarité",
    "Leadership", "Authenticité", "Enthousiasme", "Résilience", "Vision",
  ],
  animaux: [
    "Éléphant", "Pingouin", "Licorne", "Dragon", "Cactus",
    "Arc-en-ciel", "Requin", "Tortue", "Fourmi", "Panda",
    "Flamant Rose", "Baleine", "Koala", "Caméléon", "Pieuvre",
    "Renard", "Dauphin", "Paresseux", "Hibou", "Girafe",
    "Crocodile", "Singe", "Aigle", "Méduse", "Scorpion",
  ],
};
