export interface RotiRoom {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "voting" | "finished";
  creator_user_id: string | null;
  session_name: string | null;
  created_at: string;
}

export interface RotiPlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  vote: number | null;
  joined_at: string;
}

export interface RotiLabel {
  label: string;
  description: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  ringClass: string;
}

export const ROTI_LABELS: Record<number, RotiLabel> = {
  1: {
    label: "Perte de temps",
    description: "J'ai clairement perdu mon temps",
    textClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/40",
    borderClass: "border-red-300 dark:border-red-700",
    ringClass: "ring-red-500",
  },
  2: {
    label: "Peu utile",
    description: "J'ai perdu un peu de temps car je n'ai pas appris grand chose",
    textClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-950/40",
    borderClass: "border-orange-300 dark:border-orange-700",
    ringClass: "ring-orange-500",
  },
  3: {
    label: "Correct",
    description: "Je n'ai pas perdu mon temps mais je ne vois pas l'intérêt de ma participation",
    textClass: "text-yellow-600 dark:text-yellow-500",
    bgClass: "bg-yellow-50 dark:bg-yellow-950/40",
    borderClass: "border-yellow-300 dark:border-yellow-700",
    ringClass: "ring-yellow-500",
  },
  4: {
    label: "Bonne valeur",
    description: "J'ai gagné plus de temps par rapport à celui que j'y ai consacré",
    textClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-50 dark:bg-green-950/40",
    borderClass: "border-green-300 dark:border-green-700",
    ringClass: "ring-green-500",
  },
  5: {
    label: "Excellent !",
    description: "Le temps que j'y ai passé vaut vraiment le coup",
    textClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-50 dark:bg-violet-950/40",
    borderClass: "border-violet-300 dark:border-violet-700",
    ringClass: "ring-violet-500",
  },
};
