"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Trophy,
  Lock,
  ChevronRight,
  Send,
  Lightbulb,
  CheckCircle2,
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
import { TrackUsage } from "@/components/TrackUsage";
import { ALL_PATHWAYS, COMING_SOON_PATHWAYS } from "@/lib/academie/pathways/index";
import { loadProgress, migrateFromLocalStorage } from "@/lib/academie/storage";
import { computePathwayStatus } from "@/lib/academie/progress";
import { createClient } from "@/lib/supabase/client";
import type { AcademiePathway, AcademieProgress } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ICON_MAP_SM: Record<string, React.ReactNode> = {
  MessageCircleHeart: <MessageCircleHeart className="h-5 w-5" />,
  Handshake:          <Handshake className="h-5 w-5" />,
  Ear:                <Ear className="h-5 w-5" />,
  HandCoins:          <HandCoins className="h-5 w-5" />,
  Flame:              <Flame className="h-5 w-5" />,
  MessageSquare:      <MessageSquare className="h-5 w-5" />,
  GitBranch:          <GitBranch className="h-5 w-5" />,
  Users:              <Users className="h-5 w-5" />,
  Activity:           <Activity className="h-5 w-5" />,
};

const ICON_MAP_LG: Record<string, React.ReactNode> = {
  MessageCircleHeart: <MessageCircleHeart className="h-7 w-7" />,
  Handshake:          <Handshake className="h-7 w-7" />,
  Ear:                <Ear className="h-7 w-7" />,
  HandCoins:          <HandCoins className="h-7 w-7" />,
  Flame:              <Flame className="h-7 w-7" />,
  MessageSquare:      <MessageSquare className="h-7 w-7" />,
  GitBranch:          <GitBranch className="h-7 w-7" />,
  Users:              <Users className="h-7 w-7" />,
  Activity:           <Activity className="h-7 w-7" />,
};

const COLOR_THEMES = {
  blue:    {
    icon:     "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400",
    progress: "bg-blue-600",
    badge:    "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    card:     "from-blue-50 to-white dark:from-blue-950/40 dark:to-gray-900",
    border:   "border-blue-100 dark:border-blue-900",
    cta:      "bg-blue-600 hover:bg-blue-700 text-white",
  },
  amber:   {
    icon:     "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400",
    progress: "bg-amber-500",
    badge:    "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800",
    card:     "from-amber-50 to-white dark:from-amber-950/40 dark:to-gray-900",
    border:   "border-amber-100 dark:border-amber-900",
    cta:      "bg-amber-500 hover:bg-amber-600 text-white",
  },
  purple:  {
    icon:     "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400",
    progress: "bg-purple-600",
    badge:    "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800",
    card:     "from-purple-50 to-white dark:from-purple-950/40 dark:to-gray-900",
    border:   "border-purple-100 dark:border-purple-900",
    cta:      "bg-purple-600 hover:bg-purple-700 text-white",
  },
  emerald: {
    icon:     "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400",
    progress: "bg-emerald-600",
    badge:    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    card:     "from-emerald-50 to-white dark:from-emerald-950/40 dark:to-gray-900",
    border:   "border-emerald-100 dark:border-emerald-900",
    cta:      "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  orange:  {
    icon:     "bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-400",
    progress: "bg-orange-500",
    badge:    "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800",
    card:     "from-orange-50 to-white dark:from-orange-950/40 dark:to-gray-900",
    border:   "border-orange-100 dark:border-orange-900",
    cta:      "bg-orange-500 hover:bg-orange-600 text-white",
  },
  teal:    {
    icon:     "bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400",
    progress: "bg-teal-600",
    badge:    "bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800",
    card:     "from-teal-50 to-white dark:from-teal-950/40 dark:to-gray-900",
    border:   "border-teal-100 dark:border-teal-900",
    cta:      "bg-teal-600 hover:bg-teal-700 text-white",
  },
  violet:  {
    icon:     "bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-400",
    progress: "bg-violet-600",
    badge:    "bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-800",
    card:     "from-violet-50 to-white dark:from-violet-950/40 dark:to-gray-900",
    border:   "border-violet-100 dark:border-violet-900",
    cta:      "bg-violet-600 hover:bg-violet-700 text-white",
  },
  cyan:    {
    icon:     "bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-400",
    progress: "bg-cyan-600",
    badge:    "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
    card:     "from-cyan-50 to-white dark:from-cyan-950/40 dark:to-gray-900",
    border:   "border-cyan-100 dark:border-cyan-900",
    cta:      "bg-cyan-600 hover:bg-cyan-700 text-white",
  },
  rose:    {
    icon:     "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400",
    progress: "bg-rose-600",
    badge:    "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800",
    card:     "from-rose-50 to-white dark:from-rose-950/40 dark:to-gray-900",
    border:   "border-rose-100 dark:border-rose-900",
    cta:      "bg-rose-600 hover:bg-rose-700 text-white",
  },
} as const;

function countPassedQuizzes(pathway: AcademiePathway, progress: AcademieProgress): number {
  const statuses = computePathwayStatus(pathway, progress);
  return statuses.filter((s) => s.passed).length;
}

// ─── Hero card ────────────────────────────────────────────────────────────────

function FeaturedCard({
  pathway,
  progress,
  badgeEarned,
}: {
  pathway: AcademiePathway;
  progress: AcademieProgress;
  badgeEarned: boolean;
}) {
  const { t } = useI18n();
  const theme   = COLOR_THEMES[pathway.color_theme];
  const passed  = countPassedQuizzes(pathway, progress);
  const total   = pathway.quizzes.length;
  const pct     = Math.round((passed / total) * 100);
  const started = passed > 0;

  return (
    <Link
      href={`/academie/${pathway.id}`}
      className={`group relative flex flex-col bg-gradient-to-br ${theme.card} border ${theme.border} rounded-2xl p-6 hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {badgeEarned && (
        <span className={`absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${theme.badge}`}>
          <Trophy className="h-3 w-3" />
          {pathway.final_badge.name}
        </span>
      )}

      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${theme.icon}`}>
        {ICON_MAP_LG[pathway.icon_name] ?? <GraduationCap className="h-7 w-7" />}
      </div>

      <h2 className="font-semibold text-gray-900 dark:text-white text-base mb-1.5 group-hover:opacity-90 transition-opacity">
        {pathway.title}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5 flex-1">
        {pathway.long_description}
      </p>

      <div className="mb-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{passed}/{total} {passed > 1 ? t.academie.validatedPlural : t.academie.validated}</span>
          <span>{pathway.estimated_minutes} {t.common.min}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${theme.progress}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <span className={`inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${theme.cta}`}>
        {started ? t.academie.continueCta : t.academie.startCta}
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

// ─── Carousel card ────────────────────────────────────────────────────────────

function CarouselCard({
  pathway,
  progress,
  badgeEarned,
}: {
  pathway: AcademiePathway;
  progress: AcademieProgress;
  badgeEarned: boolean;
}) {
  const { t } = useI18n();
  const theme   = COLOR_THEMES[pathway.color_theme];
  const passed  = countPassedQuizzes(pathway, progress);
  const total   = pathway.quizzes.length;
  const pct     = Math.round((passed / total) * 100);
  const started = passed > 0;

  return (
    <Link
      href={`/academie/${pathway.id}`}
      className="group flex-shrink-0 w-60 snap-start bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all duration-150"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${theme.icon}`}>
          {ICON_MAP_SM[pathway.icon_name] ?? <GraduationCap className="h-5 w-5" />}
        </div>
        {badgeEarned && <Trophy className="h-4 w-4 text-amber-500" />}
      </div>

      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors line-clamp-2">
        {pathway.title}
      </h3>

      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 line-clamp-2 leading-relaxed">
        {pathway.short_description}
      </p>

      <div className="space-y-1">
        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${theme.progress}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
            {passed}/{total}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 inline-flex items-center gap-0.5 transition-colors">
            {started ? t.academie.continueCta : t.academie.startCta}
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcademiePage() {
  const { t } = useI18n();
  const [progress, setProgress] = useState<AcademieProgress>({
    pathways: {},
    badges_earned: [],
  });

  const [suggText, setSuggText]   = useState("");
  const [suggState, setSuggState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [suggError, setSuggError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      await migrateFromLocalStorage(user.id);
      const prog = await loadProgress(user.id);
      setProgress(prog);
    });
  }, []);

  async function submitSuggestion(e: React.FormEvent) {
    e.preventDefault();
    const message = suggText.trim();
    if (message.length < 10) {
      setSuggError(t.academie.suggestionMinChars);
      setSuggState("error");
      return;
    }
    setSuggState("loading");
    setSuggError("");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "other", message: `Nouvelle demande de thème pour un quiz : ${message}` }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? t.common.error);
      }
      setSuggState("ok");
      setSuggText("");
    } catch (err) {
      setSuggError(err instanceof Error ? err.message : t.common.error);
      setSuggState("error");
    }
  }

  const FEATURED = ALL_PATHWAYS.slice(0, 3);
  const LIBRARY  = ALL_PATHWAYS.slice(3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool={t.academie.title} />
      <TrackUsage toolId="academie" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-8 pb-16 space-y-10">

        {/* Hero */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/60 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t.academie.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.academie.subtitle}
            </p>
          </div>
        </div>

        {/* Badges earned */}
        {progress.badges_earned.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              {t.academie.yourBadges}
            </h2>
            <div className="flex flex-wrap gap-2">
              {progress.badges_earned.map((id) => {
                const pathway = ALL_PATHWAYS.find((p) => p.id === id);
                if (!pathway) return null;
                const theme = COLOR_THEMES[pathway.color_theme];
                return (
                  <span
                    key={id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${theme.badge}`}
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    {pathway.final_badge.name}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* Recommended */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            {t.academie.recommended}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURED.map((pathway) => (
              <FeaturedCard
                key={pathway.id}
                pathway={pathway}
                progress={progress}
                badgeEarned={progress.badges_earned.includes(pathway.id)}
              />
            ))}
          </div>
        </section>

        {/* All topics carousel */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            {t.academie.allTopics}
          </h2>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1 scrollbar-hide">
              {LIBRARY.map((pathway) => (
                <CarouselCard
                  key={pathway.id}
                  pathway={pathway}
                  progress={progress}
                  badgeEarned={progress.badges_earned.includes(pathway.id)}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-20 bg-gradient-to-l from-gray-50 dark:from-gray-950 to-transparent flex items-center justify-end pr-2">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-sm">
                <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Suggestion box */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/60 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {t.academie.ideaPrompt}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {t.academie.ideaDesc}
              </p>

              {suggState === "ok" ? (
                <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.academie.sent}
                </div>
              ) : (
                <form onSubmit={submitSuggestion} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={suggText}
                    onChange={(e) => { setSuggText(e.target.value); if (suggState === "error") setSuggState("idle"); }}
                    placeholder={t.academie.ideaPlaceholder}
                    maxLength={200}
                    className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                  />
                  <button
                    type="submit"
                    disabled={suggState === "loading" || suggText.trim().length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition whitespace-nowrap"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {t.common.send}
                  </button>
                </form>
              )}

              {suggState === "error" && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">{suggError}</p>
              )}
            </div>
          </div>
        </section>

        {/* Coming soon */}
        <section>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
              {t.academie.comingSoon}
            </span>
            {COMING_SOON_PATHWAYS.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-default whitespace-nowrap"
              >
                <Lock className="h-3 w-3" />
                {p.title}
              </span>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
