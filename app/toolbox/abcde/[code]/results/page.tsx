"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Brain, Loader2, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { STEP_META, SIX_CHAPEAUX, ISHIKAWA_CATEGORIES, CINQ_POURQUOI_LABELS } from "@/lib/abcde/types";
import type { AbcdeRoom, AbcdePlayer, AbcdeContribution, AbcdeVote } from "@/lib/abcde/types";
import { cn } from "@/lib/utils";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";

interface RoomData extends AbcdeRoom {
  players: AbcdePlayer[];
  contributions: AbcdeContribution[];
  votes: AbcdeVote[];
  evaluation_count: number;
}

interface Evaluation {
  rating: number;
  comment: string | null;
}

const POSTURE_LABELS: Record<string, { label: string; color: string }> = {
  inactive:  { label: "Inactive",  color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700" },
  reactive:  { label: "Réactive",  color: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  proactive: { label: "Proactive", color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" },
};

function categoryLabel(template: string | null, category: string | null): string | null {
  if (!category) return null;
  if (template === "5-pourquoi") {
    const idx = parseInt(category.replace("pourquoi-", "")) - 1;
    return CINQ_POURQUOI_LABELS[idx] ?? category;
  }
  if (template === "6-chapeaux") {
    return SIX_CHAPEAUX.find((c) => c.key === category)?.label ?? category;
  }
  if (template === "ishikawa") {
    return ISHIKAWA_CATEGORIES.find((c) => c === category) ?? category;
  }
  return category;
}

export default function AbcdeResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();

  const [room, setRoom]           = useState<RoomData | null>(null);
  const [evals, setEvals]         = useState<Evaluation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<"synthesis" | "contributions" | "evals">("synthesis");
  const [playerId, setPlayerId]   = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(`abcde_player_${upperCode}`);
    if (stored) {
      try { setPlayerId(JSON.parse(stored).playerId ?? ""); } catch { /* */ }
    }
  }, [upperCode]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/abcde/room/${upperCode}?playerId=${playerId}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json() as RoomData;
      setRoom(data);

      // Fetch evaluations for display
      const evalRes = await fetch(`/api/abcde/room/${upperCode}/evaluations`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (evalRes.ok) setEvals(await evalRes.json() as Evaluation[]);
      setLoading(false);
    }
    load();
  }, [upperCode, playerId]);

  const isHost = room?.host_player_id === playerId;

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/reunion-maker", label: "Réunion Maker" },
    { href: "/reunion-maker/abcde", label: "ABCDE" },
    { label: "Résultats" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-400">Chargement des résultats…</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Session introuvable.
        </div>
      </div>
    );
  }

  const contribs = room.contributions ?? [];
  const votes = room.votes ?? [];

  const avgRating = evals.length > 0
    ? evals.reduce((s, e) => s + e.rating, 0) / evals.length
    : null;

  // Top voted contributions from step B
  const topVoted = contribs
    .filter((c) => c.step === "b")
    .map((c) => ({ ...c, total: votes.filter((v) => v.contribution_id === c.id).reduce((s, v) => s + v.points, 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const tabs = [
    { key: "synthesis"      as const, label: "Synthèse IA" },
    { key: "contributions"  as const, label: "Contributions" },
    { key: "evals"          as const, label: "Évaluations" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
            <Brain size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Atelier ABCDE — Résultats</h1>
            {room.problem_statement && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{room.problem_statement}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{room.players.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Participants</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{contribs.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Contributions</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
              {avgRating !== null ? (
                <>{avgRating.toFixed(1)}<Star size={16} className="text-amber-400 fill-amber-400" /></>
              ) : "—"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Note moy.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === t.key
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Synthesis tab */}
        {activeTab === "synthesis" && (
          <div className="space-y-4">
            {room.synthesis ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={16} className="text-indigo-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Synthèse générée par Claude</span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {room.synthesis.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h3 key={i} className="text-base font-bold text-gray-900 dark:text-white mt-4 mb-1">{line.slice(3)}</h3>;
                    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-1">{line.slice(2, -2)}</p>;
                    if (line.startsWith("- ")) return <p key={i} className="text-sm text-gray-700 dark:text-gray-300 ml-3 flex gap-2"><span className="text-indigo-400 flex-shrink-0">•</span><span>{line.slice(2)}</span></p>;
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 size={16} className="animate-spin mr-2" />
                <span className="text-sm">Synthèse non disponible</span>
              </div>
            )}

            {/* Decision card */}
            {room.decision_text && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Décision retenue</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium leading-relaxed mb-3">{room.decision_text}</p>
                {room.decision_posture && POSTURE_LABELS[room.decision_posture] && (
                  <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border", POSTURE_LABELS[room.decision_posture].color)}>
                    Posture {POSTURE_LABELS[room.decision_posture].label}
                  </span>
                )}
              </div>
            )}

            {/* Top voted */}
            {topVoted.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Options les plus votées</p>
                <div className="space-y-2.5">
                  {topVoted.map((c, i) => {
                    const max = topVoted[0].total;
                    return (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-600 w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-0.5">
                            <p className="text-sm text-gray-800 dark:text-gray-200">{c.content}</p>
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-2">{c.total} pts</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: max > 0 ? `${(c.total / max) * 100}%` : "0%" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contributions tab */}
        {activeTab === "contributions" && (
          <div className="space-y-6">
            {(["step_a", "step_b"] as const).map((s) => {
              const meta = STEP_META[s];
              const stepLetter = s.split("_")[1] as "a" | "b";
              const template = stepLetter === "a" ? room.step_a_template : room.step_b_template;
              const stepContribs = contribs.filter((c) => c.step === stepLetter);
              return (
                <div key={s}>
                  <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border mb-3", meta.badge)}>
                    {meta.letter} — {meta.label}
                    {template && <span className="opacity-70">· {template}</span>}
                  </div>
                  {stepContribs.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Aucune contribution.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {stepContribs.map((c) => (
                        <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5">
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{c.content}</p>
                          {c.category && (
                            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{categoryLabel(template, c.category)}</p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.player_avatar_color ?? "#94a3b8" }} />
                            {c.player_pseudo}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Evaluations tab */}
        {activeTab === "evals" && (
          <div className="space-y-4">
            {avgRating !== null && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
                <div className="flex justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star key={v} size={24} className={cn("mx-0.5", v <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-gray-700")} />
                  ))}
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgRating.toFixed(1)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{evals.length} évaluation{evals.length > 1 ? "s" : ""}</p>
              </div>
            )}
            {evals.filter((e) => e.comment?.trim()).map((e, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star key={v} size={12} className={cn(v <= e.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-gray-700")} />
                  ))}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{e.comment}</p>
              </div>
            ))}
            {evals.length === 0 && (
              <p className="text-sm text-gray-400 italic text-center py-8">Aucune évaluation soumise.</p>
            )}
          </div>
        )}

        <ContinueSessionButton gameType="abcde" roomCode={upperCode} />
      </main>
    </div>
  );
}
