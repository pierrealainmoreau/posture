"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, RefreshCw, LogOut, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { getMoodById, getMoodImageUrl, pickSetForRoom } from "@/lib/humeur/moods";
import type { HumeurRoom, HumeurPlayer } from "@/lib/humeur/types";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";

// ── Carte joueur — grande image ───────────────────────────────────────────────
function PlayerCard({
  player,
  myPlayerId,
  setId,
  index,
  visible,
  total,
}: {
  player: HumeurPlayer;
  myPlayerId: string;
  setId: string;
  index: number;
  visible: boolean;
  total: number;
}) {
  const mood = player.mood_id ? getMoodById(player.mood_id) : null;
  const isMe = player.id === myPlayerId;

  return (
    <div
      className={`transition-all duration-500 ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
      }`}
      style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
    >
      <div
        className={`relative rounded-2xl overflow-hidden shadow-md ${
          total <= 4 ? "aspect-[3/4]" : "aspect-square"
        } ${isMe ? "ring-4 ring-rose-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950" : ""}`}
      >
        {mood ? (
          <Image
            src={getMoodImageUrl(setId, mood.index)}
            alt={player.pseudo}
            fill
            className="object-cover"
            sizes={total <= 4 ? "50vw" : "33vw"}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <span className="text-4xl text-gray-400">?</span>
          </div>
        )}

        {/* Overlay nom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pt-8 pb-3 px-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/50"
              style={{ backgroundColor: player.avatar_color }}
            />
            <span className="text-white text-sm font-semibold truncate drop-shadow">
              {player.pseudo}
              {isMe && <span className="ml-1 opacity-70 font-normal text-xs">· moi</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function HumeurResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]           = useState("");
  const [room, setRoom]                   = useState<HumeurRoom | null>(null);
  const [players, setPlayers]             = useState<HumeurPlayer[]>([]);
  const [loading, setLoading]             = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const [allRevealed, setAllRevealed]     = useState(false);
  const [setId, setSetId]                 = useState("");

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/humeur", label: "Humeur du jour" },
    { label: "Résultats" },
  ];

  useEffect(() => {
    if (upperCode) setSetId(pickSetForRoom(upperCode));
  }, [upperCode]);

  useEffect(() => {
    const stored = localStorage.getItem(`humeur_player_${upperCode}`);
    if (stored) {
      try {
        const { playerId: pid } = JSON.parse(stored) as { playerId: string };
        setPlayerId(pid);
      } catch { /* ignore */ }
    }
  }, [upperCode]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/humeur/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as HumeurRoom & { players: HumeurPlayer[] };
      if (data.status === "lobby") { router.replace(`/toolbox/humeur/${upperCode}/lobby`); return; }
      if (data.status === "playing") { router.replace(`/toolbox/humeur/${upperCode}/play`); return; }

      setRoom(data);
      setPlayers(data.players ?? []);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Animation de révélation progressive
  useEffect(() => {
    if (loading || players.length === 0) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setRevealedCount(i);
      if (i >= players.length) { setAllRevealed(true); clearInterval(timer); }
    }, 180);
    return () => clearInterval(timer);
  }, [loading, players.length]);

  if (loading || !setId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  const isHost = room?.host_player_id === playerId;
  const cols = players.length <= 4 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">

        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Humeur du jour
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {players.length} participant{players.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Grille des images */}
        <div className={`grid ${cols} gap-3 mb-8`}>
          {players.map((player, i) => (
            <PlayerCard
              key={player.id}
              player={player}
              myPlayerId={playerId}
              setId={setId}
              index={i}
              visible={i < revealedCount}
              total={players.length}
            />
          ))}
        </div>

        {/* Actions */}
        {allRevealed && (
          <div className="flex flex-col gap-3">
            <ContinueSessionButton gameType="humeur" roomCode={upperCode} />
            {isHost ? (
              <>
                <Link
                  href="/toolbox/humeur/create"
                  className="flex items-center justify-center gap-2 py-3 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors"
                >
                  <Plus size={14} />
                  Nouvelle session
                </Link>
                <Link
                  href="/toolbox"
                  className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw size={14} />
                  Autres mini-jeux
                </Link>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 py-3 text-gray-400 dark:text-gray-500 text-sm rounded-xl hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  <LogOut size={14} />
                  Quitter
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem(`humeur_player_${upperCode}`);
                  window.close();
                }}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogOut size={14} />
                Fermer la session
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
