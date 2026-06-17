export type AbcdeStep = "a" | "b" | "c" | "d" | "e";

export type AbcdeStatus =
  | "lobby"
  | "step_a"
  | "step_b"
  | "step_c"
  | "step_d"
  | "step_e"
  | "synthesis"
  | "finished";

export type AbcdePosture = "inactive" | "reactive" | "proactive";

export type AbcdeTemplate =
  | "libre"
  | "5-pourquoi"
  | "ishikawa"
  | "6-chapeaux"
  | "affinites";

export const STEP_SEQUENCE: AbcdeStatus[] = [
  "lobby", "step_a", "step_b", "step_c", "step_d", "step_e", "synthesis", "finished",
];

export function nextStep(current: AbcdeStatus): AbcdeStatus | null {
  const idx = STEP_SEQUENCE.indexOf(current);
  if (idx < 0 || idx >= STEP_SEQUENCE.length - 1) return null;
  return STEP_SEQUENCE[idx + 1];
}

export const ISHIKAWA_CATEGORIES = [
  "Méthodes", "Machines", "Main d'œuvre", "Milieu", "Matières", "Management",
];

export const SIX_CHAPEAUX = [
  { key: "blanc",  label: "Blanc",  subtitle: "Faits & données",        bg: "#f8fafc", border: "#cbd5e1", text: "#475569" },
  { key: "rouge",  label: "Rouge",  subtitle: "Émotions & intuitions",   bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c" },
  { key: "noir",   label: "Noir",   subtitle: "Critique & risques",       bg: "#1e293b", border: "#475569", text: "#e2e8f0" },
  { key: "jaune",  label: "Jaune",  subtitle: "Optimisme & avantages",    bg: "#fefce8", border: "#fde047", text: "#a16207" },
  { key: "vert",   label: "Vert",   subtitle: "Créativité & idées",       bg: "#f0fdf4", border: "#86efac", text: "#15803d" },
  { key: "bleu",   label: "Bleu",   subtitle: "Processus & synthèse",     bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
];

export const CINQ_POURQUOI_LABELS = [
  "Pourquoi ce problème existe-t-il ?",
  "Pourquoi cela se produit-il ?",
  "Pourquoi cette cause est-elle présente ?",
  "Pourquoi cette cause profonde ?",
  "Quelle est la cause racine ?",
];

export interface AbcdeRoom {
  id: string;
  code: string;
  status: AbcdeStatus;
  problem_statement: string | null;
  host_player_id: string | null;
  step_a_template: AbcdeTemplate | null;
  step_b_template: AbcdeTemplate | null;
  decision_text: string | null;
  decision_posture: AbcdePosture | null;
  synthesis: string | null;
  timer_per_step: number | null;
  step_started_at: string | null;
  creator_user_id: string | null;
  created_at: string;
}

export interface AbcdePlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  joined_at: string;
  evaluation_submitted?: boolean;
}

export interface AbcdeContribution {
  id: string;
  room_id: string;
  player_id: string;
  step: AbcdeStep;
  content: string;
  category: string | null;
  created_at: string;
  player_pseudo?: string;
  player_avatar_color?: string;
  total_votes?: number;
  my_votes?: number;
}

export interface AbcdeVote {
  player_id: string;
  contribution_id: string;
  points: number;
}

export interface AbcdeEvaluation {
  id: string;
  room_id: string;
  player_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

export const STEP_META = {
  step_a: {
    letter: "A",
    label: "Analyser",
    description: "Collectez et analysez toutes les facettes de la situation.",
    color: "blue",
    ring: "ring-blue-500",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    templates: ["libre", "5-pourquoi", "ishikawa"] as AbcdeTemplate[],
  },
  step_b: {
    letter: "B",
    label: "Brainstormer",
    description: "Faites émerger toutes les options envisageables sans contrainte.",
    color: "green",
    ring: "ring-green-500",
    badge: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    border: "border-green-200 dark:border-green-800",
    bg: "bg-green-50 dark:bg-green-950/30",
    templates: ["libre", "6-chapeaux", "affinites"] as AbcdeTemplate[],
  },
  step_c: {
    letter: "C",
    label: "Choisir",
    description: "Votez sur les meilleures options — 3 points à distribuer.",
    color: "amber",
    ring: "ring-amber-500",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    templates: [] as AbcdeTemplate[],
  },
  step_d: {
    letter: "D",
    label: "Décider",
    description: "L'animateur formalise la décision retenue et la posture adoptée.",
    color: "red",
    ring: "ring-red-500",
    badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    border: "border-red-200 dark:border-red-800",
    bg: "bg-red-50 dark:bg-red-950/30",
    templates: [] as AbcdeTemplate[],
  },
  step_e: {
    letter: "E",
    label: "Évaluer",
    description: "Évaluez collectivement la qualité du processus de décision.",
    color: "purple",
    ring: "ring-purple-500",
    badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    border: "border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    templates: [] as AbcdeTemplate[],
  },
} as const;
