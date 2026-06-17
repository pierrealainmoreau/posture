export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode  = 'coop' | 'competitive';
export type RoomStatus = 'lobby' | 'playing' | 'finished';
export type Team = 'red' | 'blue' | 'green' | 'yellow';

export interface CodeSecretRoom {
  id: string;
  code: string;
  host_player_id: string;
  creator_user_id: string | null;
  status: RoomStatus;
  game_mode: GameMode;
  challenge_id: string;
  difficulty: Difficulty;
  time_limit_seconds: number;
  started_at: string | null;
  winner_team: Team | null;
  solved_at: string | null;
  created_at: string;
}

export interface CodeSecretPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  team: Team | null;
  joined_at: string;
}

export interface RevealedHint {
  hint_index: number;
  text: string;
  team: Team | null;
  revealed_at: string;
}

export interface Submission {
  team: Team | null;
  answer: string;
  is_correct: boolean;
  submitted_at: string;
}

export interface ChallengeClient {
  id: string;
  title: string;
  encodedMessage: string;
  maxHints: number;
  hintPenalty: number;
  wrongGuessPenalty: number;
  cipherDescription: string;
  difficulty: Difficulty;
  timeLimitSeconds: number;
  answer?: string; // only populated when room.status === 'finished'
}

export interface RoomResponse extends CodeSecretRoom {
  players: CodeSecretPlayer[];
  challenge: ChallengeClient;
  revealedHints: RevealedHint[];
  recentSubmissions: Submission[];
}

export const TEAM_META: Record<Team, { label: string; hex: string; tailwindRing: string; tailwindBg: string; tailwindText: string; tailwindBorder: string }> = {
  red:    { label: 'Équipe Rouge',  hex: '#ef4444', tailwindRing: 'ring-red-500',    tailwindBg: 'bg-red-50 dark:bg-red-950',      tailwindText: 'text-red-700 dark:text-red-300',       tailwindBorder: 'border-red-300 dark:border-red-700'   },
  blue:   { label: 'Équipe Bleue',  hex: '#3b82f6', tailwindRing: 'ring-blue-500',   tailwindBg: 'bg-blue-50 dark:bg-blue-950',    tailwindText: 'text-blue-700 dark:text-blue-300',     tailwindBorder: 'border-blue-300 dark:border-blue-700' },
  green:  { label: 'Équipe Verte',  hex: '#22c55e', tailwindRing: 'ring-green-500',  tailwindBg: 'bg-green-50 dark:bg-green-950',  tailwindText: 'text-green-700 dark:text-green-300',   tailwindBorder: 'border-green-300 dark:border-green-700' },
  yellow: { label: 'Équipe Jaune',  hex: '#f59e0b', tailwindRing: 'ring-amber-500',  tailwindBg: 'bg-amber-50 dark:bg-amber-950',  tailwindText: 'text-amber-700 dark:text-amber-300',   tailwindBorder: 'border-amber-300 dark:border-amber-700' },
};

export const TEAMS: Team[] = ['red', 'blue', 'green', 'yellow'];

export const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

export const DIFFICULTY_META: Record<Difficulty, { label: string; time: string; maxHints: number; hintPenalty: number; color: string }> = {
  easy:   { label: 'Facile',   time: '10 min', maxHints: 4, hintPenalty: 150, color: 'text-emerald-600 dark:text-emerald-400' },
  medium: { label: 'Moyen',    time: '7 min',  maxHints: 3, hintPenalty: 200, color: 'text-amber-600 dark:text-amber-400'    },
  hard:   { label: 'Difficile', time: '5 min',  maxHints: 2, hintPenalty: 300, color: 'text-red-600 dark:text-red-400'        },
};
