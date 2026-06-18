"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, Crown, Loader2, ChevronRight,
  Shuffle, BookOpen, GraduationCap, Quote,
  Trophy, UserRoundCheck, CalendarDays, Target, SmilePlus, Sparkles,
  Activity, Zap, Search,
} from "lucide-react";
import { Header } from "@/components/Header";
import { PMFBanner } from "@/components/PMFBanner";
import { SearchBar } from "@/components/SearchBar";
import { createClient } from "@/lib/supabase/client";
import { loadProgress } from "@/lib/academie/storage";
import { computePathwayStatus } from "@/lib/academie/progress";
import { ALL_PATHWAYS } from "@/lib/academie/pathways/index";
import type { CollaboratorOkr } from "@/lib/types";

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-[7px] h-[7px] rounded-[2px] flex-shrink-0 ${color}`} />
      <span className="text-sm font-bold uppercase tracking-[0.07em] text-gray-700 dark:text-gray-300">
        {children}
      </span>
    </div>
  );
}

// ── OKR circular gauge ────────────────────────────────────────────────────────

function OkrCircleGauge({ pct, defined = false }: { pct: number | null; defined?: boolean }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const p = pct ?? 0;
  const offset = circ * (1 - p / 100);
  const strokeColor =
    p >= 70 ? "#22c55e" :
    p >= 40 ? "#f59e0b" :
    p >  0  ? "#ef4444" : "transparent";

  return (
    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 52, height: 52 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor"
          strokeWidth="4" className="text-gray-100 dark:text-gray-800" />
        {p > 0 && (
          <circle cx="26" cy="26" r={r} fill="none"
            stroke={strokeColor} strokeWidth="4"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" />
        )}
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        {pct === null ? (
          <span className="text-[9px] text-gray-400">…</span>
        ) : p === 0 ? (
          defined
            ? <span className="text-[10px] font-bold text-gray-400">0%</span>
            : <span className="text-xs font-bold text-gray-300 dark:text-gray-700">—</span>
        ) : (
          <span className={`text-[11px] font-bold ${
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

  const [firstName,        setFirstName]        = useState<string | null>(null);
  const [userId,           setUserId]           = useState<string | null>(null);
  const [role,             setRole]             = useState<string>("user");
  const [acadStats,        setAcadStats]        = useState({ badges: 0 });
  const [okrProgress,      setOkrProgress]      = useState<number | null>(null);
  const [okrHasCollabOkrs, setOkrHasCollabOkrs] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);

      // OKR progress — non-bloquant
      fetch("/api/coach/okr/company").then(async (res) => {
        if (!res.ok) { setOkrProgress(0); return; }
        const okrData = await res.json().catch(() => null);
        if (!okrData?.id) { setOkrProgress(0); return; }
        const collabRes = await fetch(`/api/coach/okr/collaborator?company_okr_id=${okrData.id}`);
        if (!collabRes.ok) { setOkrProgress(0); return; }
        const rows = (await collabRes.json().catch(() => [])) as CollaboratorOkr[];
        setOkrHasCollabOkrs(rows.length > 0);
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

        {/* ── SearchBar IA ───────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-gray-400 dark:text-gray-500 mb-2">
            <Sparkles size={9} className="inline mr-1 text-blue-500" />
            Assistant IA
          </p>
          <SearchBar />
        </div>

        {/* ── Section 1 : Avant la réunion ──────────────────────────── */}
        <section>
          <SectionLabel color="bg-blue-600 dark:bg-blue-500">Avant la réunion</SectionLabel>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/reunion-maker/preparer"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-[10px] mx-auto mb-3 flex items-center justify-center">
                <CalendarDays size={17} className="text-blue-700 dark:text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                Préparer une réunion
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
                Générer un feedback
              </p>
            </Link>

            <Link
              href="/coach"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-[10px] mx-auto mb-3 flex items-center justify-center">
                <UserRoundCheck size={17} className="text-blue-700 dark:text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                Préparer mon 1:1
              </p>
            </Link>

            <Link
              href="/coach/okr"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-9 h-9 bg-pink-100 dark:bg-pink-950 rounded-[10px] mx-auto mb-3 flex items-center justify-center">
                <Target size={17} className="text-pink-700 dark:text-pink-400" />
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                Suivre les OKRs
              </p>
            </Link>
          </div>
        </section>

        {/* ── Section 2 : En réunion ────────────────────────────────── */}
        <section>
          <SectionLabel color="bg-amber-500 dark:bg-amber-400">En réunion</SectionLabel>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <Link
              href="/mini-jeux/humeur"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <SmilePlus size={20} className="text-yellow-500 dark:text-yellow-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                Humeur
              </p>
            </Link>

            <Link
              href="/icebreaker"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <Shuffle size={20} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                Icebreaker
              </p>
            </Link>

            <Link
              href="/mini-jeux/anecdotes"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                Anecdotes
              </p>
            </Link>

            <Link
              href="/boussole"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <Activity size={20} className="text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                Health Radar
              </p>
            </Link>

            <Link
              href="/retrospective/speed"
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <Zap size={20} className="text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                Speed Retro
              </p>
            </Link>

            <Link
              href="/mini-jeux"
              className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-3 text-center hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 leading-tight">
                Tous
              </p>
            </Link>
          </div>
        </section>

        {/* ── Section 3 : Entre les réunions ────────────────────────── */}
        <section>
          <SectionLabel color="bg-emerald-600 dark:bg-emerald-500">Entre les réunions</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* OKR */}
            <Link
              href="/coach/okr"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all duration-150 flex flex-col"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-violet-50 dark:bg-violet-950 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target size={13} className="text-violet-700 dark:text-violet-400" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">OKR</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">Objectifs & Key Results</p>
              <div className="flex items-center gap-3 flex-1 mb-3">
                <OkrCircleGauge pct={okrProgress} defined={okrHasCollabOkrs} />
                <div className="min-w-0">
                  {okrProgress === null ? (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Chargement…</p>
                  ) : okrProgress === 0 && !okrHasCollabOkrs ? (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Aucune progression renseignée
                    </p>
                  ) : (
                    <>
                      <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                        Progression équipe
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Moyenne des KRs
                      </p>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-auto text-[11px] font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                Gérer les OKR →
              </p>
            </Link>

            {/* Académie */}
            <Link
              href="/academie"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all duration-150 flex flex-col"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={13} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">Académie</span>
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
                <span className="text-xs font-bold text-gray-900 dark:text-white">Recruter</span>
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
