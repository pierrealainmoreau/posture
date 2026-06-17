"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Lock,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Clock,
  GraduationCap,
  MessageCircleHeart,
  Handshake,
  Ear,
  HandCoins,
  Flame,
  MessageSquare,
  GitBranch,
  Users,
  Activity,
} from "lucide-react";
import { Header } from "@/components/Header";
import { getPathway } from "@/lib/academie/pathways/index";
import { loadProgress, migrateFromLocalStorage } from "@/lib/academie/storage";
import { computePathwayStatus } from "@/lib/academie/progress";
import { createClient } from "@/lib/supabase/client";
import type { AcademieProgress, BadgeTier } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageCircleHeart: <MessageCircleHeart className="h-6 w-6" />,
  Handshake: <Handshake className="h-6 w-6" />,
  Ear: <Ear className="h-6 w-6" />,
  HandCoins: <HandCoins className="h-6 w-6" />,
  Flame: <Flame className="h-6 w-6" />,
  MessageSquare: <MessageSquare className="h-6 w-6" />,
  GitBranch: <GitBranch className="h-6 w-6" />,
  Users: <Users className="h-6 w-6" />,
  Activity: <Activity className="h-6 w-6" />,
};

const TIER_CONFIG: Record<BadgeTier, { label: string; color: string }> = {
  bronze: { label: "Bronze", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  silver: { label: "Argent", color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700" },
  gold: { label: "Or", color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" },
  final: { label: "Final", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
};

const COLOR_THEMES = {
  blue:    { icon: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",         progress: "bg-blue-600"    },
  amber:   { icon: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",     progress: "bg-amber-500"   },
  purple:  { icon: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400", progress: "bg-purple-600"  },
  emerald: { icon: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400", progress: "bg-emerald-600" },
  orange:  { icon: "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400", progress: "bg-orange-500"  },
  teal:    { icon: "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400",         progress: "bg-teal-600"    },
  violet:  { icon: "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400", progress: "bg-violet-600"  },
  cyan:    { icon: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400",         progress: "bg-cyan-600"    },
  rose:    { icon: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400",         progress: "bg-rose-600"    },
} as const;

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PathwayPage() {
  const params = useParams();
  const pathwayId = params.pathwayId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<AcademieProgress>({ pathways: {}, badges_earned: [] });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      await migrateFromLocalStorage(user.id);
      const prog = await loadProgress(user.id);
      setProgress(prog);
    });
  }, []);

  const pathway = getPathway(pathwayId);
  if (!pathway) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header backHref="/academie" currentTool="Académie" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Parcours introuvable.</p>
        </main>
      </div>
    );
  }

  const statuses = computePathwayStatus(pathway, progress);
  const passedCount = statuses.filter((s) => s.passed).length;
  const total = pathway.quizzes.length;
  const pct = Math.round((passedCount / total) * 100);
  const theme = COLOR_THEMES[pathway.color_theme];
  const badgeEarned = progress.badges_earned.includes(pathway.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/academie" currentTool={pathway.title} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-8 pb-16 space-y-8">

        {/* Retour */}
        <Link
          href="/academie"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Académie
        </Link>

        {/* En-tête parcours */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.icon}`}>
              {ICON_MAP[pathway.icon_name] ?? <GraduationCap className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {pathway.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                {pathway.long_description}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {pathway.estimated_minutes} min
                </span>
                <span>{passedCount}/{total} quiz validés</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${theme.progress}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline des quiz */}
        <div className="space-y-3">
          {pathway.quizzes.map((quiz, index) => {
            const status = statuses[index];
            const tierConf = TIER_CONFIG[quiz.tier];
            const isFinal = quiz.tier === "final";

            return (
              <div key={quiz.id}>
                {/* Séparateur avant le quiz final */}
                {isFinal && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Quiz final</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  </div>
                )}

                <div
                  className={`bg-white dark:bg-gray-900 border rounded-xl p-5 transition-all ${
                    status.locked
                      ? "border-gray-200 dark:border-gray-800 opacity-60"
                      : status.passed
                      ? "border-green-200 dark:border-green-900"
                      : "border-gray-200 dark:border-gray-800"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icône statut */}
                    <div className="flex-shrink-0 mt-0.5">
                      {status.locked ? (
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                      ) : status.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tierConf.color}`}>
                          {tierConf.label}
                        </span>
                        {status.passed && status.best_score !== null && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Meilleur score : {status.best_score}/{quiz.questions.length}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {quiz.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {quiz.questions.length} questions · 20 s/question · 80% pour valider
                      </p>

                      {/* Message verrouillé */}
                      {status.locked && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Validez le quiz précédent à 80 % pour débloquer
                        </p>
                      )}

                      {/* Boutons */}
                      {!status.locked && (
                        <div className="mt-3">
                          {status.passed ? (
                            <Link
                              href={`/academie/${pathway.id}/${quiz.id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Refaire pour améliorer
                            </Link>
                          ) : (
                            <Link
                              href={`/academie/${pathway.id}/${quiz.id}`}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            >
                              Commencer
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carte badge à gagner */}
        <div
          className={`border rounded-xl p-5 flex items-start gap-4 ${
            badgeEarned
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            badgeEarned
              ? "bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
          }`}>
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className={`font-semibold text-sm mb-0.5 ${
              badgeEarned ? "text-amber-800 dark:text-amber-200" : "text-gray-900 dark:text-white"
            }`}>
              {badgeEarned ? "Badge obtenu : " : "Badge à gagner : "}
              {pathway.final_badge.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pathway.final_badge.description}
            </p>
            {!badgeEarned && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Validez les 4 quiz du parcours à ≥ 80 % pour débloquer ce badge.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
