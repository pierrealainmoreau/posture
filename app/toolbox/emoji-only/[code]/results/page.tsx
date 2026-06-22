"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Trophy, Home, RotateCcw } from "lucide-react";
import { Header } from "@/components/Header";
import Link from "next/link";
import type { EmojiOnlyRoom, EmojiOnlyPlayer } from "@/lib/emoji-only/types";

interface RoomData extends EmojiOnlyRoom {
  players: EmojiOnlyPlayer[];
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function EmojiOnlyResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [room, setRoom]       = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState("");

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/emoji-only", label: "Emoji Only" },
    { label: "Résultats" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`emojionly_player_${upperCode}`);
    if (stored) {
      try {
        const { playerId: pid } = JSON.parse(stored) as { playerId: string };
        setPlayerId(pid);
      } catch { /* ignore */ }
    }
  }, [upperCode]);

  useEffect(() => {
    fetch(`/api/emoji-only/room/${upperCode}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: RoomData) => {
        if (data.status !== "finished") {
          router.replace(`/toolbox/emoji-only/${upperCode}/play`);
          return;
        }
        setRoom(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [upperCode, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-500 text-sm">
        Session introuvable.
      </div>
    );
  }

  const isHost = room.host_player_id === playerId;
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10 flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center mx-auto mb-3">
            <Trophy size={26} className="text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Partie terminée !</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {room.total_rounds} round{room.total_rounds > 1 ? "s" : ""} · {room.players.length} joueurs
          </p>
        </div>

        {/* Winner spotlight */}
        {winner && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-center">
            <p className="text-3xl mb-2">🥇</p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: winner.avatar_color }} />
              <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{winner.pseudo}</p>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold">{winner.score} points</p>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Classement final</p>
          </div>
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {sorted.map((p, i) => (
              <li
                key={p.id}
                className={`px-4 py-3 flex items-center gap-3 ${p.id === playerId ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
              >
                <span className="text-base w-6 text-center">{MEDALS[i] ?? `${i + 1}`}</span>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.avatar_color }} />
                <span className={`flex-1 text-sm ${p.id === playerId ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                  {p.pseudo}
                  {p.id === playerId && <span className="ml-1.5 text-xs text-gray-400 font-normal">(vous)</span>}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{p.score} pts</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link
            href="/toolbox/emoji-only/create"
            className="flex items-center justify-center gap-2 py-3 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
          >
            <RotateCcw size={15} />
            Rejouer une partie
          </Link>
          <Link
            href="/toolbox"
            className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <Home size={15} />
            Retour aux mini-jeux
          </Link>
        </div>

      </main>
    </div>
  );
}
