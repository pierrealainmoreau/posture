export type RoomStatus =
  | "lobby"
  | "description"
  | "discussion"
  | "voting"
  | "mr_white_guess"
  | "finished";

export type PlayerRole = "civil" | "undercover" | "mr_white";
export type Winner = "civils" | "infiltres" | "mr_white";

export interface UndercoverRoom {
  id: string;
  code: string;
  host_player_id: string;
  status: RoomStatus;
  civil_word: string | null;
  undercover_word: string | null;
  pair_index: number | null;
  nb_undercovers: number;
  nb_mr_whites: number;
  turn_order: string[];
  current_turn_player_id: string | null;
  turn_started_at: string | null;
  discussion_started_at: string | null;
  round_number: number;
  eliminated_player_id: string | null;
  mr_white_last_guess: string | null;
  mr_white_last_guess_correct: boolean | null;
  winner: Winner | null;
  session_count: number;
  created_at: string;
}

export interface UndercoverPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  role: PlayerRole | null;
  secret_word: string | null;
  is_eliminated: boolean;
  total_score: number;
  joined_at: string;
}

export interface UndercoverDescription {
  id: string;
  room_id: string;
  player_id: string;
  session_count: number;
  round_number: number;
  word: string | null;
  submitted_at: string;
}

export interface UndercoverVote {
  id: string;
  room_id: string;
  voter_player_id: string;
  voted_player_id: string;
  session_count: number;
  round_number: number;
  voted_at: string;
}

export interface RoomStateResponse extends UndercoverRoom {
  my_role: PlayerRole | null;
  my_word: string | null;
  players: UndercoverPlayer[];
  descriptions: UndercoverDescription[];
  votes: UndercoverVote[];
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f43f5e", "#06b6d4", "#a855f7", "#84cc16",
];

export const TURN_SECONDS = 60;
export const DISCUSSION_SECONDS = 120;

export function suggestRoles(playerCount: number): { nbUndercovers: number; nbMrWhites: number } {
  let nbMrWhites = playerCount >= 4 ? 1 : 0;
  if (playerCount >= 10) nbMrWhites = 2;

  let nbUndercovers = 1;
  if (playerCount >= 6) nbUndercovers = 2;
  if (playerCount >= 13) nbUndercovers = 3;

  return { nbUndercovers, nbMrWhites };
}
