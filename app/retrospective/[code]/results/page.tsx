"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, MessageSquare, LogOut, Link2 } from "lucide-react";
import { Header } from "@/components/Header";
import { RetroRadarChart } from "@/components/RetroRadarChart";
import { LinkParticipantsModal } from "@/components/LinkParticipantsModal";
import {
  RETRO_CRITERIA,
  scoreBgClass,
  type RetroRoom,
  type RetroPlayer,
} from "@/lib/retrospective/types";
import { useI18n } from "@/lib/i18n";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";

interface ResultsData extends RetroRoom {
  players: RetroPlayer[];
  averages: Record<string, number> | null;
  comments: Array<{ pseudo: string; comment: string; avatar_color: string }> | null;
}

export default function RetroResultsPage() {
  const { t } = useI18n();
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]       = useState("");
  const [data, setData]               = useState<ResultsData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const breadcrumbs = [
    { href: "/", label: t.common.home },
    { href: "/retrospective", label: t.retrospective.title },
    { label: t.common.results },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`retro_player_${upperCode}`);
    if (stored) {
      try {
        const { playerId: pid } = JSON.parse(stored) as { playerId: string };
        setPlayerId(pid);
      } catch { /* ignore */ }
    }
  }, [upperCode]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/retrospective/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }
      const d = await res.json() as ResultsData;
      if (d.status === "lobby") { router.replace(`/retrospective/${upperCode}/lobby`); return; }
      if (d.status === "voting") { router.replace(`/retrospective/${upperCode}/vote`); return; }
      setData(d);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> {t.common.loading}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode />
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          {t.lobby.sessionNotFound}
        </div>
      </div>
    );
  }

  const isHost = data.host_player_id === playerId;
  const averages = data.averages ?? {};
  const comments = data.comments ?? [];
  const voterCount = Math.max(...RETRO_CRITERIA.map(() => 0), data.players.length);

  // Sort criteria by score descending for the side panel
  const sortedCriteria = [...RETRO_CRITERIA].sort(
    (a, b) => (averages[b.id] ?? 0) - (averages[a.id] ?? 0)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.retrospective.healthRadarTitle}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {data.players.length} participant{data.players.length !== 1 ? "s" : ""} · session {upperCode}
          </p>
        </div>

        {/* Radar chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-4">
          <RetroRadarChart scores={averages} />
        </div>

        {/* Scores panel */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Team Health Insight</h2>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedCriteria.map((c) => {
              const score = averages[c.id] ?? 0;
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-white ${scoreBgClass(score)}`}
                >
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="text-sm font-bold tabular-nums">
                    {score > 0 ? score.toFixed(1) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comments */}
        {comments.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <MessageSquare size={14} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                Commentaires ({comments.length})
              </h2>
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {comments.map((c, i) => (
                <li key={i} className="px-4 py-4 flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: c.avatar_color }}
                  >
                    {c.pseudo[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">{c.pseudo}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{c.comment}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Modal lier participants */}
        {showLinkModal && data && (
          <LinkParticipantsModal
            sessionType="retrospective"
            roomCode={upperCode}
            participants={data.players.map((p) => ({ pseudo: p.pseudo, avatar_color: p.avatar_color }))}
            onClose={() => setShowLinkModal(false)}
          />
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost ? (
            <>
              <button
                onClick={() => setShowLinkModal(true)}
                className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                <Link2 size={14} />
                Lier les participants à Mon Équipe
              </button>
              <ContinueSessionButton gameType="retrospective" roomCode={upperCode} />
              <Link
                href="/retrospective/create"
                className="flex items-center justify-center gap-2 py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                <Plus size={14} />
                Nouvelle session
              </Link>
              <Link
                href="/retrospective"
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Toutes les sessions
              </Link>
            </>
          ) : (
            <button
              onClick={() => {
                localStorage.removeItem(`retro_player_${upperCode}`);
                window.close();
              }}
              className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut size={14} />
              Fermer la session
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
