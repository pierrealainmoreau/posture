import { CNV_PATHWAY } from "./cnv";
import { CONFLICTS_PATHWAY } from "./conflicts";
import { ACTIVE_LISTENING_PATHWAY } from "./active-listening";
import { DELEGATION_PATHWAY } from "./delegation";
import { MOTIVATION_PATHWAY } from "./motivation";
import { ENTRETIENS_PATHWAY } from "./entretiens";
import { DECISION_PATHWAY } from "./decision";
import { DIVERSITE_PATHWAY } from "./diversite";
import { STRESS_PATHWAY } from "./stress";
import type { AcademiePathway } from "@/lib/types";

export const ALL_PATHWAYS: AcademiePathway[] = [
  CNV_PATHWAY,
  CONFLICTS_PATHWAY,
  ACTIVE_LISTENING_PATHWAY,
  DELEGATION_PATHWAY,
  MOTIVATION_PATHWAY,
  ENTRETIENS_PATHWAY,
  DECISION_PATHWAY,
  DIVERSITE_PATHWAY,
  STRESS_PATHWAY,
];

/**
 * Parcours "bientôt disponibles" — affichés grisés sur la page d'accueil
 * pour signaler la roadmap. Pas de quiz à l'intérieur.
 */
export const COMING_SOON_PATHWAYS = [
  { id: "feedback", title: "Donner un feedback efficace", color_theme: "blue" as const },
  { id: "vision", title: "Porter une vision", color_theme: "purple" as const },
] as const;

export function getPathway(id: string): AcademiePathway | undefined {
  return ALL_PATHWAYS.find((p) => p.id === id);
}

export function getQuiz(pathwayId: string, quizId: string) {
  const pathway = getPathway(pathwayId);
  return pathway?.quizzes.find((q) => q.id === quizId);
}

// V2 : Parcours "Feedback efficace", "Délégation", "Porter une vision"
// V2 : Génération IA d'un quiz personnalisé selon les axes de développement du manager
// V2 : Badges partageables sur LinkedIn (export PNG du badge)
// V2 : Leaderboard d'équipe (anonymisé) pour managers d'une même boîte
