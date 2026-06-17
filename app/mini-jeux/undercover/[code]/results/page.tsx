"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, RotateCcw, Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import type { RoomStateResponse, UndercoverPlayer } from "@/lib/undercover/types";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";

const WINNER_LABELS: Record<string, { title: string; subtitle: string; color: string }> = {
  civils: {
    title: "Les Civils gagnent !",
    subtitle: "Tous les infiltrés ont été démasqués.",
    color: "emerald",
  },
  infiltres: {
    title: "Les Infiltrés gagnent !",
    subtitle: "Ils ont survécu jusqu'au bout.",
    color: "indigo",
  },
  mr_white: {
    title: "Mr. White gagne !",
    subtitle: "Il a deviné le mot secret des Civils.",
    color: "amber",
  },
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  civil: { label: "Civil", color: "#22c55e" },
  undercover: { label: "Undercover", color: "#6366f1" },
  mr_white: { label: "Mr. White", color: "#f59e0b" },
};

function PlayerRow({ player, rank }: { player: UndercoverPlayer; rank: number }) {
  const roleInfo = player.role ? ROLE_LABELS[player.role] : null;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${
      rank === 1 ? "bg-amber-50 dark:bg-amber-950/30" : ""
    }`}>
      <span className={`w-6 text-center font-bold text-sm ${
        rank === 1 ? "text-amber-600" : rank === 2 ? "text-gray-500" : rank === 3 ? "text-orange-500" : "text-gray-300"
      }`}>
        {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
      </span>
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ backgroundColor: player.avatar_color }}
      >
        {player.pseudo[0].toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {player.pseudo}
          </span>
          {player.is_eliminated && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">éliminé</span>
          )}
        </div>
        {roleInfo && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: roleInfo.color }} />
            <span className="text-xs text-gray-400 dark:text-gray-500">{roleInfo.label}</span>
            {player.secret_word && (
              <span className="text-xs text-gray-400 dark:text-gray-500">· {player.secret_word}</span>
            )}
          </div>
        )}
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
        {player.total_score} pts
      </span>
    </div>
  );
}

export default function UndercoverResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom] = useState<RoomStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/mini-jeux", label: "Mini-jeux" },
    { href: "/mini-jeux/undercover", label: "Undercover" },
    { label: "Résultats" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`undercover_player_${upperCode}`);
    if (!stored) return;
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  const fetchRoom = useCallback(async () => {
    if (!playerId) return;
    const res = await fetch(`/api/undercover/room/${upperCode}?playerId=${playerId}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store", "X-Player-Secret": playerSecret },
    });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json() as RoomStateResponse;
    setRoom(data);
    setLoading(false);

    // If host restarted → go to lobby
    if (data.status === "lobby") router.push(`/mini-jeux/undercover/${upperCode}/lobby`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode, playerId, playerSecret]);

  useEffect(() => {
    if (!playerId) return;
    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  }, [playerId, fetchRoom]);

  async function handleRestart() {
    setRestarting(true);
    setRestartError(null);
    try {
      const res = await fetch(`/api/undercover/room/${upperCode}/restart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) setRestartError(data.error ?? "Erreur");
    } catch {
      setRestartError("Une erreur est survenue.");
    } finally {
      setRestarting(false);
    }
  }

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  const isHost = room.host_player_id === playerId;
  const players = [...(room.players ?? [])].sort((a, b) => b.total_score - a.total_score);
  const winnerInfo = room.winner ? WINNER_LABELS[room.winner] : null;
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
    indigo: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200",
    amber: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-sm mx-auto w-full px-4 py-8 space-y-5">

        {/* Winner banner */}
        {winnerInfo && (
          <div className={`rounded-2xl border p-5 text-center ${colorMap[winnerInfo.color] ?? colorMap.indigo}`}>
            <p className="text-2xl mb-2">
              {room.winner === "civils" ? "🎉" : room.winner === "mr_white" ? "🕵️" : "🥷"}
            </p>
            <p className="text-lg font-bold mb-1">{winnerInfo.title}</p>
            <p className="text-sm opacity-80">{winnerInfo.subtitle}</p>
          </div>
        )}

        {/* Word reveal */}
        {room.civil_word && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex gap-6 justify-center text-center">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Mot des Civils</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{room.civil_word}</p>
            </div>
            <div className="w-px bg-gray-100 dark:bg-gray-800" />
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Mot Undercover</p>
              <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{room.undercover_word}</p>
            </div>
          </div>
        )}

        {/* Scoreboard */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Trophy size={14} className="text-amber-500" />
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              Scores cumulés
              {room.session_count > 1 && (
                <span className="ml-1.5 text-xs text-gray-400 font-normal">· partie {room.session_count}</span>
              )}
            </p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {players.map((p, i) => (
              <PlayerRow key={p.id} player={p} rank={i + 1} />
            ))}
          </div>
        </div>

        {/* Points reminder */}
        <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Points attribués</p>
          <div className="flex gap-5 text-xs text-gray-500 dark:text-gray-400">
            <span><span className="font-semibold text-emerald-600">+2</span> Civils (victoire)</span>
            <span><span className="font-semibold text-indigo-600">+10</span> Undercover</span>
            <span><span className="font-semibold text-amber-600">+6</span> Mr. White</span>
          </div>
        </div>

        {/* Restart (host) / waiting */}
        {isHost ? (
          <div className="flex flex-col gap-2">
            {restartError && (
              <p className="text-xs text-red-500 text-center">{restartError}</p>
            )}
            <button
              onClick={handleRestart}
              disabled={restarting}
              className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {restarting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              {restarting ? "Redémarrage…" : "Rejouer (scores conservés)"}
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 flex items-center justify-center gap-2">
            <Loader2 size={13} className="animate-spin" />
            En attente de l&apos;animateur…
          </p>
        )}
        <ContinueSessionButton gameType="undercover" roomCode={upperCode} />
      </main>
    </div>
  );
}
