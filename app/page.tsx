"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, Crown, Loader2, ChevronRight,
  Shuffle, PenLine, BookOpen, GraduationCap, Quote,
  Trophy, UserRoundCheck, CalendarDays, Target, SmilePlus, Sparkles,
  RefreshCw, Search,
} from "lucide-react";
import { Header } from "@/components/Header";
import { PMFBanner } from "@/components/PMFBanner";
import { SearchBar } from "@/components/SearchBar";
import { createClient } from "@/lib/supabase/client";
import { loadProgress } from "@/lib/academie/storage";
import { computePathwayStatus } from "@/lib/academie/progress";
import { ALL_PATHWAYS } from "@/lib/academie/pathways/index";

// ── Section header ────────────────────────────────────────────────────────────

function SectionLabel({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-[7px] h-[7px] rounded-[2px] flex-shrink-0 ${color}`} />
      <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-gray-700 dark:text-gray-300">
        {children}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();

  const [firstName,   setFirstName]   = useState<string | null>(null);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [role,        setRole]        = useState<string>("user");
  const [acadStats,   setAcadStats]   = useState({ badges: 0 });
  const [weeklyData,  setWeeklyData]  = useState<{ completed: number; configured: boolean } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);

      // Weekly Coach progress (non-bloquant)
      fetch("/api/weekly-coach/today").then(async (res) => {
        if (!res.ok) return;
        const d = await res.json().catch(() => null);
        if (!d) return;
        const completed = (d.week_progress ?? []).filter(
          (p: { completed: boolean }) => p.completed
        ).length;
        setWeeklyData({ completed, configured: d.configured ?? false });
      }).catch(() => {});

      const [profileRes] = await Promise.all([
        supabase.from("profiles").select("first_name, role").eq("id", user.id).single(),
      ]);

      setFirstName(profileRes.data?.first_name ?? user.email?.split("@")[0] ?? "");
      setRole(profileRes.data?.role ?? "user");

      const progress = await loadProgress(user.id);
      let badges = 0;
      ALL_PATHWAYS.forEach((pathway) => {
        const statuses = computePathwayStatus(pathway, progress);
        badges += statuses.filter((s) => s.passed).length;
      });
      setAcadStats({ badges });
    }).catch(() => router.replace("/login"));
  }, [router]);

  if (firstName === null) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const totalBadges = ALL_PATHWAYS.length;

  return (
    <div className="min-h-screen bg-[#f9f9f8] dark:bg-gray-950 flex flex-col">
      <Header />
      {userId && <PMFBanner userId={userId} />}

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-6 pb-12 space-y-8">

        {/* ── Greeting ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Bonjour, {firstName}
          </h1>
          <Link
            href="/profile"
            className="group inline-flex items-center p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
          >
            <Eye size={18} className="flex-shrink-0" />
            <span className="overflow-hidden max-w-0 group-hover:max-w-[9rem] opacity-0 group-hover:opacity-100 text-xs font-medium whitespace-nowrap transition-all duration-300 ease-out group-hover:pl-1.5">
              Voir mon profil
            </span>
          </Link>
          {role === "premium" || role === "admin" ? (
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-400">
              <Crown size={18} />
            </span>
          ) : (
            <Link
              href="/premium"
              title="Passer au Premium"
              className="p-1.5 rounded-lg text-gray-300 dark:text-gray-700 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
            >
              <Crown size={18} />
            </Link>
          )}
        </div>

        {/* ── SearchBar IA avec label ────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-gray-400 dark:text-gray-500 mb-2">
            <Sparkles size={9} className="inline mr-1 text-blue-500" />
            Assistant IA · Posture
          </p>
          <SearchBar />
        </div>

        {/* ── Section 1 : Avant la réunion ──────────────────────────── */}
        <section>
          <SectionLabel color="bg-blue-600 dark:bg-blue-500">Avant la réunion</SectionLabel>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/reunion-maker"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-[10px] mx-auto mb-2.5 flex items-center justify-center">
                <CalendarDays size={16} className="text-blue-700 dark:text-blue-400" />
              </div>
              <p className="text-[11px] font-semibold text-gray-900 dark:text-white leading-tight">
                Préparer une réunion
              </p>
            </Link>

            <Link
              href="/feedback"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-violet-100 dark:bg-violet-950 rounded-[10px] mx-auto mb-2.5 flex items-center justify-center">
                <Quote size={16} className="text-violet-700 dark:text-violet-400" />
              </div>
              <p className="text-[11px] font-semibold text-gray-900 dark:text-white leading-tight">
                Générer un feedback
              </p>
            </Link>

            <Link
              href="/coach"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-[10px] mx-auto mb-2.5 flex items-center justify-center">
                <UserRoundCheck size={16} className="text-blue-700 dark:text-blue-400" />
              </div>
              <p className="text-[11px] font-semibold text-gray-900 dark:text-white leading-tight">
                Préparer mon 1:1
              </p>
            </Link>

            <Link
              href="/coach/okr"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-pink-100 dark:bg-pink-950 rounded-[10px] mx-auto mb-2.5 flex items-center justify-center">
                <Target size={16} className="text-pink-700 dark:text-pink-400" />
              </div>
              <p className="text-[11px] font-semibold text-gray-900 dark:text-white leading-tight">
                Suivre les OKRs
              </p>
            </Link>
          </div>
        </section>

        {/* ── Section 2 : En réunion ────────────────────────────────── */}
        <section>
          <SectionLabel color="bg-amber-500 dark:bg-amber-400">En réunion</SectionLabel>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            <Link
              href="/icebreaker"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[10px] p-2.5 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-1.5 flex items-center justify-center">
                <Shuffle size={18} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 leading-tight">
                Ice-breakers
              </p>
            </Link>

            <Link
              href="/mini-jeux/anecdotes"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[10px] p-2.5 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-1.5 flex items-center justify-center">
                <BookOpen size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 leading-tight">
                Anecdotes
              </p>
            </Link>

            <Link
              href="/mini-jeux/draw"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[10px] p-2.5 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-1.5 flex items-center justify-center">
                <PenLine size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 leading-tight">
                Draw It
              </p>
            </Link>

            <Link
              href="/mini-jeux/humeur"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[10px] p-2.5 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-1.5 flex items-center justify-center">
                <SmilePlus size={18} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 leading-tight">
                Humeur
              </p>
            </Link>

            <Link
              href="/retrospective"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[10px] p-2.5 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-1.5 flex items-center justify-center">
                <RefreshCw size={18} className="text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 leading-tight">
                Rétro
              </p>
            </Link>

            <Link
              href="/mini-jeux"
              className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-[10px] p-2.5 text-center hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-1.5 flex items-center justify-center">
                <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 leading-tight">
                Tous
              </p>
            </Link>
          </div>
        </section>

        {/* ── Section 3 : Entre les réunions ────────────────────────── */}
        <section>
          <SectionLabel color="bg-emerald-600 dark:bg-emerald-500">Entre les réunions</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* Weekly Coach compact */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={13} className="text-blue-700 dark:text-blue-400" />
                </div>
                <span className="text-[12px] font-bold text-gray-900 dark:text-white">Weekly Coach</span>
              </div>

              {weeklyData ? (
                <>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                    {weeklyData.configured
                      ? `${weeklyData.completed} / 5 actions cette semaine`
                      : "Non configuré"}
                  </p>
                  <div className="flex gap-1 mb-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-[3px] flex-1 rounded-full transition-colors ${
                          i < weeklyData.completed
                            ? "bg-blue-600 dark:bg-blue-500"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex gap-1 mb-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[3px] flex-1 rounded-full bg-gray-100 dark:bg-gray-800" />
                  ))}
                </div>
              )}

              <Link
                href="/session"
                className="mt-auto text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Voir le programme →
              </Link>
            </div>

            {/* Académie */}
            <Link
              href="/academie"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150 flex flex-col"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={13} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[12px] font-bold text-gray-900 dark:text-white">Académie</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5">Quiz & e-learning</p>
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 rounded-lg px-2.5 py-1.5 mb-3 w-fit">
                <Trophy size={12} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  {acadStats.badges} / {totalBadges} badges
                </span>
              </div>
              <p className="mt-auto text-[11px] font-semibold text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                {acadStats.badges === 0 ? "Commencer →" : "Continuer →"}
              </p>
            </Link>

            {/* Recruter */}
            <Link
              href="/recruitment"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all duration-150 flex flex-col"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-950 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search size={13} className="text-emerald-700 dark:text-emerald-400" />
                </div>
                <span className="text-[12px] font-bold text-gray-900 dark:text-white">Recruter</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                Fiches de poste, entretiens
              </p>
              <p className="mt-auto text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                Ouvrir →
              </p>
            </Link>

          </div>
        </section>

      </main>
    </div>
  );
}
