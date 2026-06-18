"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import type { DrawRoom, DrawPlayer } from "@/lib/draw/types";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";

export default function DrawResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();

  const [players, setPlayers] = useState<DrawPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPlayerId, setMyPlayerId] = useState<string>("");
  const [hostPlayerId, setHostPlayerId] = useState<string | null>(null);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/draw", label: "Draw It" },
    { label: "Résultats" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`draw_player_${upperCode}`);
    if (stored) {
      try {
        const { playerId } = JSON.parse(stored) as { playerId: string };
        setMyPlayerId(playerId);
      } catch {
        // ignore
      }
    }
  }, [upperCode]);

  useEffect(() => {
    async function fetchResults() {
      const res = await fetch(`/api/draw/room/${upperCode}`);
      if (!res.ok) return;
      const data = (await res.json()) as DrawRoom & { players: DrawPlayer[] };
      setPlayers((data.players ?? []).sort((a, b) => b.score - a.score));
      setHostPlayerId(data.host_player_id ?? null);
      setLoading(false);
    }
    fetchResults();
  }, [upperCode]);

  const medals = ["🥇", "🥈", "🥉"];
  const isHost = myPlayerId !== "" && myPlayerId === hostPlayerId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10">

        <div className="text-center mb-8">
          <Trophy size={40} className="text-amber-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Classement final
          </h1>
        </div>

        <div className="space-y-2 mb-8">
          {players.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border ${
                p.id === myPlayerId
                  ? "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800"
                  : idx === 0
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              }`}
            >
              <span className="text-xl w-8 text-center flex-shrink-0">
                {idx < 3 ? medals[idx] : `${idx + 1}.`}
              </span>
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: p.avatar_color }}
              />
              <span className="flex-1 font-medium text-gray-900 dark:text-white">
                {p.pseudo}
                {p.id === myPlayerId && (
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">(vous)</span>
                )}
              </span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {p.score} pts
              </span>
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
              Aucun score enregistré.
            </p>
          )}
        </div>

        <ContinueSessionButton gameType="draw" roomCode={upperCode} />
        <div className="flex items-center justify-center gap-3">
          {myPlayerId && myPlayerId === hostPlayerId ? (
            <Link
              href="/toolbox/draw/create"
              className="px-5 py-2.5 text-sm font-medium bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
            >
              Nouvelle partie
            </Link>
          ) : (
            <Link
              href="/toolbox/draw/join"
              className="px-5 py-2.5 text-sm font-medium bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
            >
              Rejoindre une partie
            </Link>
          )}
          {isHost ? (
            <Link
              href="/toolbox/draw"
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Quitter
            </Link>
          ) : (
            <button
              onClick={() => window.close()}
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Quitter
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
