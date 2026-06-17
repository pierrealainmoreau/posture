import type { AcademiePathway, AcademieProgress } from "@/lib/types";

export interface QuizStatus {
  quiz_id: string;
  locked: boolean;
  completed: boolean;
  passed: boolean;
  best_score: number | null;
}

/**
 * Calcule pour chaque quiz d'un parcours son statut (verrouillé, complété, validé).
 * Le quiz N est verrouillé si le quiz N-1 n'a pas été validé.
 * Le quiz final est verrouillé tant que les 3 quiz modulaires ne sont pas tous validés.
 */
export function computePathwayStatus(
  pathway: AcademiePathway,
  progress: AcademieProgress,
): QuizStatus[] {
  const pathwayProgress = progress.pathways[pathway.id]?.quizzes ?? {};

  return pathway.quizzes.map((quiz, index) => {
    const qp = pathwayProgress[quiz.id];
    const isFinal = quiz.tier === "final";

    let locked = false;
    if (index === 0) {
      locked = false;
    } else if (isFinal) {
      const modulesPassed = pathway.quizzes
        .filter((q) => q.tier !== "final")
        .every((q) => pathwayProgress[q.id]?.passed === true);
      locked = !modulesPassed;
    } else {
      const previousQuiz = pathway.quizzes[index - 1];
      locked = !pathwayProgress[previousQuiz.id]?.passed;
    }

    return {
      quiz_id: quiz.id,
      locked,
      completed: !!qp,
      passed: qp?.passed ?? false,
      best_score: qp?.best_score ?? null,
    };
  });
}

export function isPathwayCompleted(
  pathway: AcademiePathway,
  progress: AcademieProgress,
): boolean {
  return pathway.quizzes.every(
    (q) => progress.pathways[pathway.id]?.quizzes[q.id]?.passed === true,
  );
}
