export interface RetroRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "voting" | "finished";
  creator_user_id: string | null;
  created_at: string;
}

export interface RetroPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  comment: string | null;
  vote_count: number;
  joined_at: string;
}

export interface RetroCriterion {
  id: string;
  label: string;
}

export const RETRO_CRITERIA: RetroCriterion[] = [
  { id: "ownership",         label: "Ownership" },
  { id: "value",             label: "Value" },
  { id: "goal_alignment",    label: "Goal Alignment" },
  { id: "communication",     label: "Communication" },
  { id: "team_roles",        label: "Team Roles" },
  { id: "support_resources", label: "Support & Resources" },
  { id: "velocity",          label: "Velocity" },
  { id: "process",           label: "Process" },
  { id: "fun",               label: "Fun" },
];

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

// 5-level scale — used by both Team Health Insight and radar dots.
// Hex values are the exact Tailwind 500 equivalents.
export function scoreColor(score: number): string {
  if (score >= 4.5) return "#22c55e"; // green-500
  if (score >= 3.5) return "#84cc16"; // lime-500
  if (score >= 2.5) return "#eab308"; // yellow-500
  if (score >= 1.5) return "#f97316"; // orange-500
  return "#ef4444";                   // red-500
}

export function scoreBgClass(score: number): string {
  if (score >= 4.5) return "bg-green-500";
  if (score >= 3.5) return "bg-lime-500";
  if (score >= 2.5) return "bg-yellow-500";
  if (score >= 1.5) return "bg-orange-500";
  return "bg-red-500";
}
