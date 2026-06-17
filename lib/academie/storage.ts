/**
 * Académie — persistance de la progression.
 *
 * V2 : Supabase (cross-device) avec migration one-shot depuis localStorage V1.
 *
 * Toutes les fonctions sont async et doivent être appelées côté client uniquement.
 * En cas d'erreur Supabase, on fall-back silencieusement sur localStorage.
 */

import { createClient } from "@/lib/supabase/client";
import type { AcademieProgress } from "@/lib/types";

// ─── Clés localStorage ────────────────────────────────────────────────────────

function storageKey(userId: string): string {
  return `posture-academie-progress-v1-${userId}`;
}

function migratedFlagKey(userId: string): string {
  return `posture-academie-migrated-v2-${userId}`;
}

// ─── Fallback local ───────────────────────────────────────────────────────────

const DEFAULT_PROGRESS: AcademieProgress = { pathways: {}, badges_earned: [] };

function loadLocalProgress(userId: string): AcademieProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as AcademieProgress) : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

// ─── loadProgress ─────────────────────────────────────────────────────────────

export async function loadProgress(userId: string): Promise<AcademieProgress> {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;

  // Toujours migrer avant de lire, pour que le dashboard et le profil
  // voient les bonnes données même sans passer par /academie d'abord.
  await migrateFromLocalStorage(userId);

  try {
    const supabase = createClient();

    const [{ data: quizRows, error: quizErr }, { data: badgeRows, error: badgeErr }] =
      await Promise.all([
        supabase
          .from("academie_quiz_progress")
          .select("pathway_id, quiz_id, best_score, total_questions, passed, attempts, last_attempt_at")
          .eq("user_id", userId),
        supabase
          .from("academie_badges")
          .select("pathway_id")
          .eq("user_id", userId),
      ]);

    if (quizErr || badgeErr) {
      console.error("[academie] loadProgress Supabase error", quizErr ?? badgeErr);
      return loadLocalProgress(userId);
    }

    const progress: AcademieProgress = {
      pathways: {},
      badges_earned: (badgeRows ?? []).map((r) => r.pathway_id),
    };

    for (const row of quizRows ?? []) {
      if (!progress.pathways[row.pathway_id]) {
        progress.pathways[row.pathway_id] = { quizzes: {} };
      }
      progress.pathways[row.pathway_id].quizzes[row.quiz_id] = {
        best_score:      row.best_score,
        total_questions: row.total_questions,
        passed:          row.passed,
        attempts:        row.attempts,
        last_attempt_at: new Date(row.last_attempt_at).getTime(),
      };
    }

    return progress;
  } catch (err) {
    console.error("[academie] loadProgress unexpected error, falling back to localStorage", err);
    return loadLocalProgress(userId);
  }
}

// ─── migrateFromLocalStorage ──────────────────────────────────────────────────

/**
 * One-shot migration: if the user has V1 localStorage data and no Supabase data,
 * push everything to Supabase. Subsequent calls are no-ops (flag in localStorage).
 */
export async function migrateFromLocalStorage(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  // Already migrated this device
  if (localStorage.getItem(migratedFlagKey(userId))) return;

  const local = loadLocalProgress(userId);
  const hasLocal =
    Object.keys(local.pathways).length > 0 || local.badges_earned.length > 0;

  if (!hasLocal) {
    // Nothing to migrate — mark done so we skip next time
    localStorage.setItem(migratedFlagKey(userId), "1");
    return;
  }

  try {
    const supabase = createClient();

    // Skip if Supabase already has data for this user (another device already migrated)
    const { data: existing } = await supabase
      .from("academie_quiz_progress")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      localStorage.setItem(migratedFlagKey(userId), "1");
      return;
    }

    // Build quiz rows
    const quizRows: Array<{
      user_id: string;
      pathway_id: string;
      quiz_id: string;
      best_score: number;
      total_questions: number;
      passed: boolean;
      attempts: number;
      last_attempt_at: string;
    }> = [];

    for (const [pathwayId, pathwayData] of Object.entries(local.pathways)) {
      for (const [quizId, quizData] of Object.entries(pathwayData.quizzes)) {
        quizRows.push({
          user_id:         userId,
          pathway_id:      pathwayId,
          quiz_id:         quizId,
          best_score:      quizData.best_score,
          total_questions: quizData.total_questions,
          passed:          quizData.passed,
          attempts:        quizData.attempts,
          last_attempt_at: new Date(quizData.last_attempt_at).toISOString(),
        });
      }
    }

    if (quizRows.length > 0) {
      const { error } = await supabase
        .from("academie_quiz_progress")
        .insert(quizRows);
      if (error) throw error;
    }

    if (local.badges_earned.length > 0) {
      const { error } = await supabase.from("academie_badges").insert(
        local.badges_earned.map((pathwayId) => ({
          user_id:    userId,
          pathway_id: pathwayId,
        })),
      );
      if (error) throw error;
    }

    localStorage.setItem(migratedFlagKey(userId), "1");
  } catch (err) {
    // Don't mark as migrated — will retry next page load
    console.error("[academie] migrateFromLocalStorage error", err);
  }
}

// ─── recordQuizAttempt ────────────────────────────────────────────────────────

export async function recordQuizAttempt(
  pathwayId: string,
  quizId: string,
  score: number,
  totalQuestions: number,
  passed: boolean,
  userId: string,
  currentProgress: AcademieProgress,
): Promise<AcademieProgress> {
  // Compute updated state locally first (instant UI feedback)
  const pathway  = currentProgress.pathways[pathwayId] ?? { quizzes: {} };
  const existing = pathway.quizzes[quizId];
  const isBetter = !existing || score > existing.best_score;

  const newQuiz = {
    best_score:      isBetter ? score : existing.best_score,
    total_questions: totalQuestions,
    passed:          existing?.passed || passed,
    attempts:        (existing?.attempts ?? 0) + 1,
    last_attempt_at: Date.now(),
  };

  const updated: AcademieProgress = {
    ...currentProgress,
    pathways: {
      ...currentProgress.pathways,
      [pathwayId]: {
        ...pathway,
        quizzes: { ...pathway.quizzes, [quizId]: newQuiz },
      },
    },
  };

  // Persist to Supabase
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("academie_quiz_progress")
      .upsert(
        {
          user_id:         userId,
          pathway_id:      pathwayId,
          quiz_id:         quizId,
          best_score:      newQuiz.best_score,
          total_questions: totalQuestions,
          passed:          newQuiz.passed,
          attempts:        newQuiz.attempts,
          last_attempt_at: new Date().toISOString(),
        },
        { onConflict: "user_id,pathway_id,quiz_id" },
      );
    if (error) console.error("[academie] recordQuizAttempt upsert error", error);
  } catch (err) {
    console.error("[academie] recordQuizAttempt unexpected error", err);
  }

  return updated;
}

// ─── awardBadge ───────────────────────────────────────────────────────────────

export async function awardBadge(
  progress: AcademieProgress,
  pathwayId: string,
  userId: string,
): Promise<AcademieProgress> {
  if (progress.badges_earned.includes(pathwayId)) return progress;

  const updated: AcademieProgress = {
    ...progress,
    badges_earned: [...progress.badges_earned, pathwayId],
  };

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("academie_badges")
      .upsert(
        { user_id: userId, pathway_id: pathwayId },
        { onConflict: "user_id,pathway_id" },
      );
    if (error) console.error("[academie] awardBadge upsert error", error);
  } catch (err) {
    console.error("[academie] awardBadge unexpected error", err);
  }

  return updated;
}
