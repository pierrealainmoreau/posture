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
    <div className="mb-4">
      <span className="text-sm font-bold uppercase tracking-[0.07em] text-gray-700 dark:text-gray-300">
        {children}
      </span>
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

      // Collaborateurs (max 3 pour le widget home)
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
    <div className="min-h-screen bg-[#f9f9f8] dark:bg-gray-950 flex flex-col">
      <Header />
      {userId && <PMFBanner userId={userId} />}

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-6 pb-12 space-y-8">

        {/* ── Greeting ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t.home.greeting}, {firstName}
          </h1>
          <Link
            href="/profile"
            className="group inline-flex items-center p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
          >
            <Eye size={18} className="flex-shrink-0" />
            <span className="overflow-hidden max-w-0 group-hover:max-w-[9rem] opacity-0 group-hover:opacity-100 text-xs font-medium whitespace-nowrap transition-all duration-300 ease-out group-hover:pl-1.5">
              {t.home.viewProfile}
            </span>
          </Link>
          {role === "premium" || role === "admin" ? (
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-400">
              <Crown size={18} />
            </span>
          ) : (
            <Link
              href="/premium"
              title={t.home.upgradePremium}
              className="p-1.5 rounded-lg text-gray-300 dark:text-gray-700 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
            >
              <Crown size={18} />
            </Link>
          )}
        </div>

        {/* ── SearchBar IA ───────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-gray-400 dark:text-gray-500 mb-2">
            <Sparkles size={9} className="inline mr-1 text-blue-500" />
            {t.home.aiAssistant}
          </p>
          <SearchBar />
        </div>

        {/* ── Section 1 : Avant la réunion ──────────────────────────── */}
        <section>
          <SectionLabel>{t.home.sectionBefore}</SectionLabel>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/reunion-maker/preparer"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-[10px] mx-auto mb-3 flex items-center justify-center">
                <CalendarDays size={17} className="text-blue-700 dark:text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                {t.home.prepareMeeting}
              </p>
            </Link>

            <Link
              href="/feedback"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-violet-100 dark:bg-violet-950 rounded-[10px] mx-auto mb-3 flex items-center justify-center">
                <Quote size={17} className="text-violet-700 dark:text-violet-400" />
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                {t.home.generateFeedback}
              </p>
            </Link>

            <Link
              href="/teams"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-[10px] mx-auto mb-3 flex items-center justify-center">
                <UserRoundCheck size={17} className="text-blue-700 dark:text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                {t.home.prepareOneOnOne}
              </p>
            </Link>

            <Link
              href="/teams/okr"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-pink-100 dark:bg-pink-950 rounded-[10px] mx-auto mb-3 flex items-center justify-center">
                <Target size={17} className="text-pink-700 dark:text-pink-400" />
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
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
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <SmilePlus size={20} className="text-rose-500 dark:text-rose-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">Humeur</p>
            </Link>

            <Link
              href="/icebreaker"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <Shuffle size={20} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">Icebreaker</p>
            </Link>

            <Link
              href="/toolbox/anecdotes"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">Anecdotes</p>
            </Link>

            <Link
              href="/toolbox/health-radar"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <Activity size={20} className="text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">Health Radar</p>
            </Link>

            <Link
              href="/toolbox/speed-retro"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <Zap size={20} className="text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">Speed Retro</p>
            </Link>

            <Link
              href="/toolbox"
              className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-3 text-center hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 leading-tight">{t.home.allTools}</p>
            </Link>
          </div>
        </section>

        {/* ── Section 3 : Entre les réunions ────────────────────────── */}
        <section>
          <SectionLabel>{t.home.sectionBetween}</SectionLabel>

          <div className="grid grid-cols-3 grid-rows-2 gap-3">

            {/* ── Col 1, lignes 1+2 : Weekly Coach ── */}
            <div
              className="row-span-2 cursor-pointer"
              onClick={(e) => { if (!(e.target as Element).closest("a, button")) router.push("/teams/weekly"); }}
            >
              <WeeklyCoach />
            </div>

            {/* ── Col 2, lignes 1+2 : Mon équipe ── */}
            <div className="row-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-150">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-[10px] flex items-center justify-center flex-shrink-0">
                  <Users size={15} className="text-blue-700 dark:text-blue-400" />
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
                  className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex-shrink-0"
                >
                  {t.home.viewTeam}
                </Link>
              </div>

              {collaborators.length === 0 ? (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
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
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold ${color.bg} ${color.text}`}>
                          {initials}
                        </div>
                        <p className="text-[12px] font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
                          {c.first_name} {c.last_name}
                        </p>
                        <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      </Link>
                    );
                  })}
                  <Link
                    href="/teams?action=add"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                      <UserPlus size={12} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-[12px] font-medium text-gray-400 dark:text-gray-500">
                      Ajouter un collaborateur
                    </p>
                  </Link>
                </div>
              )}
            </div>

            {/* ── Col 3, ligne 1 : Quiz ── */}
            <Link
              href="/academie"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 flex flex-col hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-amber-50 dark:bg-amber-950 rounded-[7px] flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={12} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 dark:text-white flex-1">Quiz</span>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">
                  {acadStats.badges === 0 ? t.home.quizStart : t.home.quizContinue}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy size={10} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  {acadStats.badges} / {acadStats.totalQuizzes} badges
                </span>
              </div>
            </Link>

            {/* ── Col 3, ligne 2 : Recrutement ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 flex flex-col hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all duration-150">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-pink-50 dark:bg-pink-950 rounded-[7px] flex items-center justify-center flex-shrink-0">
                  <UserPlus size={12} className="text-pink-700 dark:text-pink-400" />
                </div>
                <span className="text-[11px] font-bold text-gray-900 dark:text-white">{t.home.recruitment}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Link
                  href="/recruitment?tab=job-description"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-800 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 transition-all"
                >
                  <ClipboardList size={12} className="text-pink-500 dark:text-pink-400 flex-shrink-0" />
                  <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate flex-1 min-w-0">
                    {t.home.jobDescription}
                  </p>
                  <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </Link>
                <Link
                  href="/recruitment?tab=recruiter"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-800 hover:bg-pink-50/40 dark:hover:bg-pink-950/20 transition-all"
                >
                  <UserRoundCheck size={12} className="text-pink-500 dark:text-pink-400 flex-shrink-0" />
                  <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate flex-1 min-w-0">
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
