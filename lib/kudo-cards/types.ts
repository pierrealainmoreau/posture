export interface KudoRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "writing" | "revealed";
  creator_user_id: string | null;
  created_at: string;
}

export interface KudoPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  joined_at: string;
}

export interface KudoCardFull {
  id: string;
  category: string;
  message: string;
  created_at: string;
  author: { id: string; pseudo: string; avatar_color: string };
  recipient: { id: string; pseudo: string; avatar_color: string };
}

export interface KudoRoomResponse extends KudoRoom {
  players: KudoPlayer[];
  authors_count?: number;
  cards?: KudoCardFull[];
}

export interface KudoCategory {
  id: string;
  label: string;
  emoji: string;
  colorHex: string;
  bgLight: string;
  borderLight: string;
  bgDark: string;
  borderDark: string;
}

export const KUDO_CATEGORIES: KudoCategory[] = [
  {
    id: "merci",
    label: "Merci",
    emoji: "💛",
    colorHex: "#a16207",
    bgLight: "#fefce8",
    borderLight: "#fde68a",
    bgDark: "#1c1407",
    borderDark: "#713f12",
  },
  {
    id: "bravo",
    label: "Bravo",
    emoji: "🌟",
    colorHex: "#6d28d9",
    bgLight: "#f5f3ff",
    borderLight: "#ddd6fe",
    bgDark: "#1e1033",
    borderDark: "#4c1d95",
  },
  {
    id: "encouragement",
    label: "Tu assures",
    emoji: "💪",
    colorHex: "#c2410c",
    bgLight: "#fff7ed",
    borderLight: "#fed7aa",
    bgDark: "#1c0a00",
    borderDark: "#7c2d12",
  },
  {
    id: "coop",
    label: "Super coopération",
    emoji: "🤝",
    colorHex: "#15803d",
    bgLight: "#f0fdf4",
    borderLight: "#bbf7d0",
    bgDark: "#051a0d",
    borderDark: "#14532d",
  },
  {
    id: "idee",
    label: "Idée brillante",
    emoji: "💡",
    colorHex: "#1d4ed8",
    bgLight: "#eff6ff",
    borderLight: "#bfdbfe",
    bgDark: "#020c1f",
    borderDark: "#1e3a8a",
  },
  {
    id: "impact",
    label: "Impact",
    emoji: "🚀",
    colorHex: "#be185d",
    bgLight: "#fdf2f8",
    borderLight: "#fbcfe8",
    bgDark: "#1a0412",
    borderDark: "#831843",
  },
];

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];
