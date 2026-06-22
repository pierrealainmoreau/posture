"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Crown, Play, BarChart2 } from "lucide-react";
import { Header } from "@/components/Header";
import { QRShare } from "@/components/QRShare";
import type { EstimationExpressRoom, EstimationExpressPlayer } from "@/lib/estimation-express/types";

export default function EstimationExpressLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]           = useState("");
  const [playerSecret, setPlayerSecret]   = useState("");
  const [room, setRoom]                   = useState<EstimationExpressRoom | null>(null);
  const [players, setPlayers]             = useState<EstimationExpressPlayer[]>([]);
  const [loading, setLoading]             = useState(true);
  const [starting, setStarting]           = useState(false);
  const [startError, setStartError]       = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const pollCountRef = useRef(0);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/estimation-express", label: "Estimation Express" },
    { label: "Lobby" },
  ];

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/toolbox/estimation-express/join?code=${upperCode}`
      : "";

  useEffect(() => {
    const stored = localStorage.getItem(`estimationexpress_player_${upperCode}`);
    if (!stored) { router.replace(`/toolbox/estimation-express/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/toolbox/estimation-express/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    if (!playerId) return;

    async function fetchRoom() {
      const res = await fetch(`/api/estimation-express/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as { room: EstimationExpressRoom; players: EstimationExpressPlayer[] };
      const fetchedPlayers = data.players ?? [];

      if (data.room.status === "lobby" && data.room.host_player_id !== playerId) {
        pollCountRef.current++;
        const iAmInList = fetchedPlayers.some((p) => p.id === playerId);
        if (!iAmInList && pollCountRef.current >= 2) setNotRegistered(true);
        else if (iAmInList) { pollCountRef.current = 0; setNotRegistered(false); }
      }

      setRoom(data.room);
      setPlayers(fetchedPlayers);
      setLoading(false);

      if (data.room.status !== "lobby") {
        if (data.room.status === "finished") {
          router.push(`/toolbox/estimation-express/${upperCode}/results`);
        } else {
          router.push(`/toolbox/estimation-express/${upperCode}/play`);
        }
      }
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  async function startGame() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/estimation-express/room/${upperCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Id": playerId, "X-Player-Secret": playerSecret },
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) setStartError(data.error ?? "Erreur lors du démarrage");
    } catch {
      setStartError("Une erreur est survenue.");
    } finally {
      setStarting(false);
    }
  }

  const isHost = room?.host_player_id === playerId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  if (notRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Votre session a expiré.</p>
          <button
            onClick={() => router.push(`/toolbox/estimation-express/join?code=${upperCode}`)}
            className="px-4 py-2 bg-violet-600 text-white text-sm rounded-xl font-medium hover:bg-violet-700 transition-colors"
          >
            Rejoindre à nouveau
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10 space-y-8">
        {/* Code */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center mx-auto mb-3">
            <BarChart2 size={20} className="text-violet-500" />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Code de session</p>
          <p className="text-4xl font-bold tracking-widest font-mono text-gray-900 dark:text-white">{upperCode}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{room?.total_questions} questions · 45s par question</p>
        </div>

        {/* Share */}
        {isHost && shareUrl && (
          <QRShare url={shareUrl} label={`Lien d'invitation`} />
        )}

        {/* Players */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Participants ({players.length})
          </p>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: p.avatar_color }}>
                  {p.pseudo[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{p.pseudo}</span>
                {p.is_host && (
                  <Crown size={14} className="text-violet-500 flex-shrink-0" />
                )}
                {p.id === playerId && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">vous</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start */}
        {isHost && (
          <div className="space-y-3">
            {startError && (
              <p className="text-red-500 text-xs text-center">{startError}</p>
            )}
            <button
              onClick={startGame}
              disabled={players.length < 2 || starting}
              className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {starting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {starting ? "Démarrage…" : "Lancer la partie"}
            </button>
            {players.length < 2 && (
              <p className="text-center text-xs text-gray-400">Minimum 2 participants pour démarrer.</p>
            )}
          </div>
        )}

        {!isHost && (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
            <Loader2 size={16} className="animate-spin inline mr-2" />
            En attente du démarrage par l&apos;hôte…
          </div>
        )}
      </main>
    </div>
  );
}
