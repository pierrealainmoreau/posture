"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, Crown, Loader2, ChevronRight, Plus,
  Shuffle, PenLine, Scale, BookOpen, GraduationCap, Quote, CircleHelp,
  Trophy, UserRoundCheck, CalendarDays, Users, Target, SmilePlus, Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { PMFBanner } from "@/components/PMFBanner";
import { SearchBar } from "@/components/SearchBar";
import { WeeklyCoach } from "@/components/WeeklyCoach";
import { createClient } from "@/lib/supabase/client";
import { loadProgress } from "@/lib/academie/storage";
import { computePathwayStatus } from "@/lib/academie/progress";
import { ALL_PATHWAYS } from "@/lib/academie/pathways/index";
import { useI18n } from "@/lib/i18n";
import type { Collaborator, CoachSeniority, CollaboratorOkr } from "@/lib/types";

const GAMES_BASE = [
  {
    href: "/icebreaker",
    icon: <Shuffle size={18} className="text-cyan-600 dark:text-cyan-400" />,
    iconBg: "bg-cyan-50 dark:bg-cyan-950",
    hoverBorder: "hover:border-cyan-300 dark:hover:border-cyan-700",
    key: "icebreakers" as const,
  },
  {
    href: "/mini-jeux/anecdotes",
    icon: <BookOpen size={18} className="text-emerald-600 dark:text-emerald-400" />,
    iconBg: "bg-emerald-50 dark:bg-emerald-950",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
    key: "anecdotes" as const,
  },
  {
    href: "/mini-jeux/draw",
    icon: <PenLine size={18} className="text-orange-600 dark:text-orange-400" />,
    iconBg: "bg-orange-50 dark:bg-orange-950",
    hoverBorder: "hover:border-orange-300 dark:hover:border-orange-700",
    key: "drawIt" as const,
  },
  {
    href: "/mini-jeux/humeur",
    icon: <SmilePlus size={18} className="text-yellow-600 dark:text-yellow-400" />,
    iconBg: "bg-yellow-50 dark:bg-yellow-950",
    hoverBorder: "hover:border-yellow-300 dark:hover:border-yellow-700",
    key: "humeur" as const,
  },
];

// ── Seniority ring colors for collaborator avatars ────────────────────────────

const SENIORITY_RING: Record<CoachSeniority, string> = {
  junior:    "ring-blue-300 dark:ring-blue-700",
  confirmed: "ring-violet-300 dark:ring-violet-700",
  senior:    "ring-amber-300 dark:ring-amber-700",
};

const SENIORITY_AVATAR: Record<CoachSeniority, { bg: string; text: string }> = {
  junior:    { bg: "bg-blue-100 dark:bg-blue-900",    text: "text-blue-700 dark:text-blue-300"    },
  confirmed: { bg: "bg-violet-100 dark:bg-violet-900", text: "text-violet-700 dark:text-violet-300" },
  senior:    { bg: "bg-amber-100 dark:bg-amber-900",   text: "text-amber-700 dark:text-amber-300"   },
};

type CollabPreview = Pick<Collaborator, "id" | "first_name" | "last_name" | "seniority">;

function initials(c: { first_name: string; last_name: string }) {
  return ((c.first_name[0] ?? "") + (c.last_name[0] ?? "")).toUpperCase() || "?";
}

// ── Circular OKR gauge ────────────────────────────────────────────────────────

function OkrCircleGauge({ pct, defined = false }: { pct: number | null; defined?: boolean }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const p = pct ?? 0;
  const offset = circ * (1 - p / 100);
  const strokeColor =
    p >= 70 ? "#22c55e" :
    p >= 40 ? "#f59e0b" :
    p >  0  ? "#ef4444" : "transparent";

  return (
    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor"
          strokeWidth="5" className="text-gray-100 dark:text-gray-800" />
        {/* Progress arc */}
        {p > 0 && (
          <circle cx="32" cy="32" r={r} fill="none"
            stroke={strokeColor} strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        {pct === null ? (
          <span className="text-[10px] text-gray-400 dark:text-gray-600">…</span>
        ) : p === 0 ? (
          defined
            ? <span className="text-xs font-bold text-gray-400 dark:text-gray-500">0%</span>
            : <span className="text-sm font-bold text-gray-300 dark:text-gray-700">—</span>
        ) : (
          <span className={`text-sm font-bold ${
            p >= 70 ? "text-green-600 dark:text-green-400" :
            p >= 40 ? "text-amber-500 dark:text-amber-400" :
                      "text-red-500 dark:text-red-400"
          }`}>{p}%</span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();

  const [firstName,    setFirstName]    = useState<string | null>(null);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [role,         setRole]         = useState<string>("user");
  const [collaborators, setCollaborators] = useState<CollabPreview[]>([]);
  const [acadStats,    setAcadStats]    = useState({ passed: 0, total: 0, badges: 0 });
  const [okrProgress,  setOkrProgress]  = useState<number | null>(null);
  const [okrHasCollabOkrs, setOkrHasCollabOkrs] = useState(false);

  const GAMES = GAMES_BASE.map((g) => ({ ...g, label: t.home.games[g.key] }));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);

      // OKR global progress — non-bloquant, se charge en arrière-plan
      fetch("/api/coach/okr/company").then(async (res) => {
        if (!res.ok) { setOkrProgress(0); return; }
        const okrData = await res.json().catch(() => null);
        if (!okrData?.id) { setOkrProgress(0); return; }
        const collabRes = await fetch(`/api/coach/okr/collaborator?company_okr_id=${okrData.id}`);
        if (!collabRes.ok) { setOkrProgress(0); return; }
        const rows = (await collabRes.json().catch(() => [])) as CollaboratorOkr[];
        setOkrHasCollabOkrs(rows.length > 0);
        // On ne compte que les KRs où `current` a été explicitement renseigné
        // (les KRs générés par l'IA et jamais touchés ont current = undefined → exclus)
        const trackedPcts = rows.flatMap((okr) =>
          okr.key_results
            .filter((kr) => kr.current !== undefined && kr.current !== null && kr.current !== "")
            .map((kr) => Math.round(parseFloat(kr.current!) || 0))
        );
        setOkrProgress(
          trackedPcts.length > 0
            ? Math.round(trackedPcts.reduce((a, b) => a + b, 0) / trackedPcts.length)
            : 0
        );
      }).catch(() => setOkrProgress(0));

      const [profileRes, collabsRes] = await Promise.all([
        supabase.from("profiles").select("first_name, role").eq("id", user.id).single(),
        supabase
          .from("collaborators")
          .select("id, first_name, last_name, seniority")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(6),
      ]);

      setFirstName(profileRes.data?.first_name ?? user.email?.split("@")[0] ?? "");
      setRole(profileRes.data?.role ?? "user");
      setCollaborators((collabsRes.data as CollabPreview[]) ?? []);

      const progress = await loadProgress(user.id);
      let passed = 0;
      let total = 0;
      ALL_PATHWAYS.forEach((pathway) => {
        const statuses = computePathwayStatus(pathway, progress);
        passed += statuses.filter((s) => s.passed).length;
        total  += statuses.length;
      });
      setAcadStats({ passed, total, badges: progress.badges_earned.length });
    }).catch(() => router.replace("/login"));
  }, [router]);

  if (firstName === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const totalBadges = ALL_PATHWAYS.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header />
      {userId && <PMFBanner userId={userId} />}

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-6 pb-12 space-y-10">

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

        {/* ── Search bar IA ─────────────────────────────────────────── */}
        <SearchBar />

        {/* ── Section 1 : Mini-jeux ─────────────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t.home.gamesSection}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {GAMES.map((game) => (
              <Link
                key={game.href}
                href={game.href}
                className={`group flex flex-col items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-all duration-150 hover:shadow-sm ${game.hoverBorder}`}
              >
                <div className={`w-10 h-10 rounded-xl ${game.iconBg} flex items-center justify-center`}>
                  {game.icon}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                  {game.label}
                </span>
              </Link>
            ))}

            {/* CTA : autres mini-jeux — 5e cellule sur la même ligne */}
            <Link
              href="/mini-jeux"
              className="col-span-2 sm:col-span-1 group flex flex-col items-center gap-3 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all duration-150 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
              </div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 text-center leading-tight transition-colors">
                {t.home.allGames}
              </span>
            </Link>
          </div>
        </section>

        {/* ── Section 2 : Weekly Coach + 1:1 Coach + OKR/Académie ──── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            {t.home.skillsSection}
          </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Weekly Coach */}
          <WeeklyCoach />

          {/* Mon équipe */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Mon équipe</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {collaborators.length === 0
                      ? "Aucun collaborateur"
                      : `${collaborators.length} collaborateur${collaborators.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <Link
                href="/coach"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Voir tout <ChevronRight size={12} />
              </Link>
            </div>

            {/* Liste verticale */}
            <div className="flex flex-col gap-1.5 flex-1">
              {collaborators.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href={`/coach/${c.id}`}
                    className="group flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all"
                  >
                    <div className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{initials(c)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
                      {c.first_name} {c.last_name}
                    </p>
                    <ChevronRight size={13} className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                  </Link>
              ))}
            </div>

            {/* Ajouter un collaborateur */}
            <Link
              href="/coach"
              className="mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <Plus size={13} />
              Ajouter un collaborateur
            </Link>
          </div>

          {/* Colonne droite : OKR + Académie empilés */}
          <div className="flex flex-col gap-5">

            {/* OKR */}
            <Link
              href="/coach/okr"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-violet-50 dark:bg-violet-950 rounded-lg flex items-center justify-center shrink-0">
                  <Target size={18} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">OKR</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.home.okr.subtitle}</p>
                </div>
              </div>

              {/* Jauge circulaire */}
              <div className="flex-1 flex items-center gap-4">
                <OkrCircleGauge pct={okrProgress} defined={okrHasCollabOkrs} />
                <div className="min-w-0">
                  {okrProgress === null ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t.home.okr.loading}</p>
                  ) : okrProgress === 0 && !okrHasCollabOkrs ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {t.home.okr.noProgress}
                    </p>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                        {t.home.okr.teamProgress}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                        {t.home.okr.krAverage}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {t.home.okr.manage}
                <ChevronRight size={12} />
              </div>
            </Link>

            {/* Académie */}
            <Link
              href="/academie"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center shrink-0">
                  <GraduationCap size={18} className="text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Quiz</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.home.academie.subtitle}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2.5">
                <Trophy size={18} className="text-amber-400 shrink-0" />
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{acadStats.badges}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">/ {totalBadges} {t.home.academie.badges}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {acadStats.badges === 0 ? t.home.academie.start : t.home.academie.continue}
                <ChevronRight size={12} />
              </div>
            </Link>

          </div>
        </div>
        </section>

        {/* ── Section 3 : Ma boite à outils ────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            {t.home.toolbox.title}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/reunion-maker"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                  <CalendarDays size={16} className="text-blue-700 dark:text-blue-400" />
                </div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded">
                  <Sparkles size={9} />
                  {t.home.toolbox.aiPowered}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {t.home.toolbox.reunion.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t.home.toolbox.reunion.description}
              </p>
            </Link>

            <Link
              href="/recruitment"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                  <CircleHelp size={16} className="text-blue-700 dark:text-blue-400" />
                </div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded">
                  <Sparkles size={9} />
                  {t.home.toolbox.aiPowered}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {t.home.toolbox.recruitment.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t.home.toolbox.recruitment.description}
              </p>
            </Link>

            <Link
              href="/feedback"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                  <Quote size={16} className="text-blue-700 dark:text-blue-400" />
                </div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded">
                  <Sparkles size={9} />
                  {t.home.toolbox.aiPowered}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {t.home.toolbox.feedback.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t.home.toolbox.feedback.description}
              </p>
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
