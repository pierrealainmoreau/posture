"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Trophy, RotateCcw, Home } from "lucide-react";
import { Header } from "@/components/Header";
import type { EstimationExpressRoom, EstimationExpressPlayer, EEQuestion } from "@/lib/estimation-express/types";

export default function EstimationExpressResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]   = useState("");
  const [room, setRoom]           = useState<EstimationExpressRoom | null>(null);
  const [players, setPlayers]     = useState<EstimationExpressPlayer[]>([]);
  const [loading, setLoading]     = useState(true);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/estimation-express", label: "Estimation Express" },
    { label: "Résultats" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`estimationexpress_player_${upperCode}`);
    if (stored) {
      try {
        const { playerId: pid } = JSON.parse(stored) as { playerId: string };
        setPlayerId(pid);
      } catch { /* ignore */ }
    }
  }, [upperCode]);

  useEffect(() => {
    async function fetchRoom() {
      const res = await fetch(`/api/estimation-express/room/${upperCode}`, { cache: "no-store" });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json() as { room: EstimationExpressRoom; players: EstimationExpressPlayer[] };
      setRoom(data.room);
      setPlayers(data.players ?? []);
      setLoading(false);

      if (data.room.status !== "finished") {
        router.push(`/toolbox/estimation-express/${upperCode}/play`);
      }
    }
    fetchRoom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const questions = room.questions as EEQuestion[];
  const isHost = room.host_player_id === playerId;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10 space-y-8">
        {/* Winner banner */}
        {winner && (
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl p-8 text-center text-white shadow-lg">
            <Trophy size={36} className="mx-auto mb-3 text-amber-300" />
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1">Vainqueur</p>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2 border-4 border-white/30"
              style={{ backgroundColor: winner.avatar_color }}
            >
              {winner.pseudo[0].toUpperCase()}
            </div>
            <p className="text-2xl font-bold">{winner.pseudo}</p>
            <p className="text-violet-200 text-sm mt-1">{winner.score} points</p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Classement final</p>
          <div className="space-y-3">
            {sorted.map((p, i) => {
              const isMe = p.id === playerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${isMe ? "bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800" : "bg-gray-50 dark:bg-gray-800"}`}
                >
                  <span className="text-lg w-7">{medals[i] ?? <span className="text-gray-400 text-sm">{i + 1}</span>}</span>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: p.avatar_color }}
                  >
                    {p.pseudo[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1">{p.pseudo}</span>
                  <span className="text-base font-bold text-violet-600 dark:text-violet-400">{p.score} pts</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Statistiques</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{questions.length}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{players.length}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">participants</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{winner?.score ?? 0}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">pts max</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost && (
            <Link
              href="/toolbox/estimation-express/create"
              className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
            >
              <RotateCcw size={16} />
              Nouvelle session
            </Link>
          )}
          <Link
            href="/toolbox/estimation-express"
            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <Home size={16} />
            Retour à Estimation Express
          </Link>
        </div>
      </main>
    </div>
  );
}
