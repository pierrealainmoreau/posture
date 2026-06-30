"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, Crown, Loader2, ChevronRight,
  Shuffle, BookOpen, GraduationCap, Quote,
  Trophy, UserRoundCheck, CalendarDays, Target, SmilePlus, Sparkles,
  Activity, Zap, Users, UserPlus, ClipboardList,
} from "lucide-react";
import { Header } from "@/components/Header";
import { PMFBanner } from "@/components/PMFBanner";
import { SearchBar } from "@/components/SearchBar";
import { WeeklyCoach } from "@/components/WeeklyCoach";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { loadProgress } from "@/lib/academie/storage";
import { computePathwayStatus } from "@/lib/academie/progress";
import { ALL_PATHWAYS } from "@/lib/academie/pathways/index";
import type { Collaborator } from "@/lib/types";

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

// ── Types & Constants ─────────────────────────────────────────────────────────

type CollabPreview = Pick<Collaborator, "id" | "first_name" | "last_name" | "role">;

const AVATAR_COLORS = [
  { bg: "bg-violet-100 dark:bg-violet-950", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-teal-100 dark:bg-teal-950",    text: "text-teal-700 dark:text-teal-300"    },
  { bg: "bg-amber-100 dark:bg-amber-950",  text: "text-amber-700 dark:text-amber-300"  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();

  const [firstName,     setFirstName]     = useState<string | null>(null);
  const [userId,        setUserId]        = useState<string | null>(null);
  const [role,          setRole]          = useState<string>("user");
  const [acadStats,     setAcadStats]     = useState({ badges: 0, totalQuizzes: 0 });
  const [collaborators, setCollaborators] = useState<CollabPreview[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);

      supabase
        .from("collaborators")
        .select("id, first_name, last_name, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(3)
        .then(({ data }) => setCollaborators((data as CollabPreview[]) ?? []));

      const [profileRes] = await Promise.all([
        supabase.from("profiles").select("first_name, role").eq("id", user.id).single(),
      ]);

      setFirstName(profileRes.data?.first_name ?? user.email?.split("@")[0] ?? "");
      setRole(profileRes.data?.role ?? "user");

      const progress = await loadProgress(user.id);
      let badges = 0;
      let totalQuizzes = 0;
      ALL_PATHWAYS.forEach((pathway) => {
        const statuses = computePathwayStatus(pathway, progress);
        badges += statuses.filter((s) => s.passed).length;
        totalQuizzes += statuses.length;
      });
      setAcadStats({ badges, totalQuizzes });
    }).catch(() => router.replace("/login"));
  }, [router]);

  if (firstName === null) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f9f9f8] dark:bg-gray-950 flex flex-col">
      <Header />
      {userId && <PMFBanner userId={userId} />}

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 pt-7 pb-14 space-y-9">

        {/* ── Greeting ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t.home.greeting}, {firstName}
            </h1>
            <Link
              href="/profile"
              className="group inline-flex items-center p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-all duration-200"
            >
              <Eye size={16} className="flex-shrink-0" />
              <span className="overflow-hidden max-w-0 group-hover:max-w-[9rem] opacity-0 group-hover:opacity-100 text-xs font-medium whitespace-nowrap transition-all duration-300 ease-out group-hover:pl-1.5">
                {t.home.viewProfile}
              </span>
            </Link>
          </div>

          {role === "premium" || role === "admin" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
              <Crown size={12} />
              Premium
            </span>
          ) : (
            <Link
              href="/premium"
              title={t.home.upgradePremium}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-amber-400 hover:text-amber-500 dark:hover:border-amber-600 dark:hover:text-amber-400 text-[11px] font-semibold transition-all duration-200"
            >
              <Crown size={12} />
              Premium
            </Link>
          )}
        </div>

        {/* ── SearchBar IA ───────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} className="text-blue-500" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-gray-400 dark:text-gray-500">
              {t.home.aiAssistant}
            </p>
          </div>
          <SearchBar />
        </div>

        {/* ── Section 1 : Avant la réunion ──────────────────────────── */}
        <section>
          <SectionLabel>{t.home.sectionBefore}</SectionLabel>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/reunion-maker/preparer"
              className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-colors">
                <CalendarDays size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                {t.home.prepareMeeting}
              </p>
            </Link>

            <Link
              href="/feedback"
              className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/60 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/60 transition-colors">
                <Quote size={18} className="text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                {t.home.generateFeedback}
              </p>
            </Link>

            <Link
              href="/teams"
              className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-colors">
                <UserRoundCheck size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                {t.home.prepareOneOnOne}
              </p>
            </Link>

            <Link
              href="/teams/okr"
              className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 bg-pink-50 dark:bg-pink-950/60 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:bg-pink-100 dark:group-hover:bg-pink-900/60 transition-colors">
                <Target size={18} className="text-pink-600 dark:text-pink-400" />
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                {t.home.trackOKRs}
              </p>
            </Link>
          </div>
        </section>

        {/* ── Section 2 : En réunion ────────────────────────────────── */}
        <section>
          <SectionLabel>{t.home.sectionDuring}</SectionLabel>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <Link
              href="/toolbox/humeur"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <SmilePlus size={15} className="text-rose-600 dark:text-rose-300" />
              </div>
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">Humeur</p>
            </Link>

            <Link
              href="/icebreaker"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Shuffle size={15} className="text-cyan-700 dark:text-cyan-300" />
              </div>
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">Icebreaker</p>
            </Link>

            <Link
              href="/toolbox/anecdotes"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <BookOpen size={15} className="text-emerald-700 dark:text-emerald-300" />
              </div>
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">Anecdotes</p>
            </Link>

            <Link
              href="/toolbox/health-radar"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Activity size={15} className="text-teal-700 dark:text-teal-300" />
              </div>
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">Health Radar</p>
            </Link>

            <Link
              href="/toolbox/speed-retro"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Zap size={15} className="text-violet-600 dark:text-violet-300" />
              </div>
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">Speed Retro</p>
            </Link>

            <Link
              href="/toolbox"
              className="group bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
              </div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 leading-tight transition-colors">
                {t.home.allTools}
              </p>
            </Link>
          </div>
        </section>

        {/* ── Section 3 : Entre les réunions ────────────────────────── */}
        <section>
          <SectionLabel>{t.home.sectionBetween}</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-3 sm:grid-rows-2 gap-3">

            {/* ── Col 1, lignes 1+2 : Weekly Coach ── */}
            <div
              className="sm:row-span-2 cursor-pointer bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200"
              onClick={(e) => { if (!(e.target as Element).closest("a, button")) router.push("/teams/weekly"); }}
            >
              <WeeklyCoach />
            </div>

            {/* ── Col 2, lignes 1+2 : Mon équipe ── */}
            <div className="sm:row-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/60 rounded-[10px] flex items-center justify-center flex-shrink-0">
                  <Users size={15} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{t.home.myTeam}</span>
                  {collaborators.length > 0 && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {collaborators.length} collaborateur{collaborators.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <Link
                  href="/teams"
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex-shrink-0"
                >
                  {t.home.viewTeam}
                </Link>
              </div>

              {collaborators.length === 0 ? (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                  {t.home.teamEmpty}
                </p>
              ) : (
                <div className="flex flex-col flex-1 gap-1.5">
                  {collaborators.map((c, i) => {
                    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const initials = ((c.first_name[0] ?? "") + (c.last_name[0] ?? "")).toUpperCase() || "?";
                    return (
                      <Link
                        key={c.id}
                        href={`/teams/${c.id}`}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all duration-150"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${color.bg} ${color.text}`}>
                          {initials}
                        </div>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate flex-1 min-w-0">
                          {c.first_name} {c.last_name}
                        </p>
                        <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      </Link>
                    );
                  })}
                  <Link
                    href="/teams?action=add"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-all duration-150"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-gray-800">
                      <UserPlus size={12} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      Ajouter un collaborateur
                    </p>
                  </Link>
                </div>
              )}
            </div>

            {/* ── Col 3, ligne 1 : Quiz ── */}
            <Link
              href="/academie"
              className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3.5 flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-amber-50 dark:bg-amber-950/60 rounded-[9px] flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/60 transition-colors">
                  <GraduationCap size={14} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">Quiz</span>
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <Trophy size={10} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  {acadStats.badges}/{acadStats.totalQuizzes} badge{acadStats.badges !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: acadStats.totalQuizzes > 0 ? `${Math.round((acadStats.badges / acadStats.totalQuizzes) * 100)}%` : "0%" }}
                />
              </div>

              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/30 transition-colors">
                <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 truncate flex-1 min-w-0 transition-colors">
                  Débloquer le prochain
                </p>
                <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-amber-400 dark:group-hover:text-amber-500 flex-shrink-0 transition-colors" />
              </div>
            </Link>

            {/* ── Col 3, ligne 2 : Recrutement ── */}
            <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3.5 flex flex-col hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 bg-pink-50 dark:bg-pink-950/60 rounded-[9px] flex items-center justify-center flex-shrink-0">
                  <UserPlus size={14} className="text-pink-600 dark:text-pink-400" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{t.home.recruitment}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Link
                  href="/recruitment?tab=job-description"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                >
                  <ClipboardList size={12} className="text-pink-500 dark:text-pink-400 flex-shrink-0" />
                  <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-300 truncate flex-1 min-w-0 transition-colors">
                    {t.home.jobDescription}
                  </p>
                  <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </Link>
                <Link
                  href="/recruitment?tab=recruiter"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                >
                  <UserRoundCheck size={12} className="text-pink-500 dark:text-pink-400 flex-shrink-0" />
                  <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-300 truncate flex-1 min-w-0 transition-colors">
                    {t.home.interviewQuestions}
                  </p>
                  <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </Link>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
