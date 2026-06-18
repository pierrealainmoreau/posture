"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Crown, Play, Lock } from "lucide-react";
import { Header } from "@/components/Header";
import { QRShare } from "@/components/QRShare";
import { DemoBotsButton } from "@/components/DemoBotsButton";
import { DIFFICULTY_META, TEAM_META } from "@/lib/code-secret/types";
import type { RoomResponse } from "@/lib/code-secret/types";

export default function CodeSecretLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom]                 = useState<RoomResponse | null>(null);
  const [loading, setLoading]           = useState(true);
  const [starting, setStarting]         = useState(false);
  const [startError, setStartError]     = useState<string | null>(null);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/toolbox/code-secret/join?code=${upperCode}`
    : "";

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/code-secret", label: "Code Secret" },
    { label: "Lobby" },
  ];

  // Load identity
  useEffect(() => {
    const stored = localStorage.getItem(`code_secret_player_${upperCode}`);
    if (!stored) { router.replace(`/toolbox/code-secret/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/toolbox/code-secret/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Poll room
  useEffect(() => {
    if (!playerId) return;
    async function fetchRoom() {
      const res = await fetch(`/api/code-secret/room/${upperCode}`, { cache: "no-store", headers: { "Cache-Control": "no-cache, no-store" } });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json() as RoomResponse;
      setRoom(data);
      setLoading(false);
      if (data.status === "playing") router.push(`/toolbox/code-secret/${upperCode}/play`);
      else if (data.status === "finished") router.push(`/toolbox/code-secret/${upperCode}/results`);
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
      const res = await fetch(`/api/code-secret/room/${upperCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
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
  const players = room?.players ?? [];
  const diff = room ? DIFFICULTY_META[room.difficulty] : null;

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

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode />
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Session introuvable.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">

        {/* Code + QR */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Code de la partie</p>
          <p className="text-5xl font-bold font-mono tracking-widest text-gray-900 dark:text-white mb-3">{upperCode}</p>

          {/* Badges */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {room.game_mode === "coop" ? "Coopératif" : "Compétitif"}
            </span>
            {diff && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950 ${diff.color}`}>
                <Lock size={10} /> {diff.label} · {diff.time}
              </span>
            )}
          </div>

          <QRShare
            url={shareUrl}
            label="Partagez ce lien aux joueurs"
            filename={`code-secret-${upperCode}`}
            wrapperCls="bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900"
            labelCls="text-amber-700 dark:text-amber-300"
            urlCls="text-amber-800 dark:text-amber-200"
            copyBtnCls="bg-white dark:bg-amber-900 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-800"
          />
        </div>

        {/* Players list */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">Joueurs ({players.length})</span>
            {players.length < 2 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">En attente d&apos;au moins 2 joueurs…</span>
            )}
          </div>
          {players.length === 0 ? (
            <div className="px-4 py-6 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin text-gray-300 mr-2" />
              <span className="text-sm text-gray-400">En attente de joueurs…</span>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {players.map((p) => (
                <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.avatar_color }} />
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {p.pseudo}
                    {p.id === playerId && <span className="ml-1.5 text-xs text-gray-400 font-normal">(vous)</span>}
                  </span>
                  {room.game_mode === "competitive" && p.team && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TEAM_META[p.team].tailwindBg} ${TEAM_META[p.team].tailwindText}`}>
                      {TEAM_META[p.team].label}
                    </span>
                  )}
                  {p.is_host && <Crown size={14} className="text-amber-500 flex-shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Start */}
        {isHost ? (
          <div className="flex flex-col gap-2">
            {startError && <p className="text-xs text-red-500 text-center">{startError}</p>}
            <button
              onClick={startGame} disabled={players.length < 2 || starting}
              className="flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors"
            >
              {starting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {starting ? "Démarrage…" : "Démarrer la partie"}
            </button>
            {players.length < 2 && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">En attente d&apos;au moins 2 joueurs.</p>
            )}
            <DemoBotsButton game="code-secret" code={upperCode} playerId={playerId} playerSecret={playerSecret} />
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Loader2 size={13} className="animate-spin" /> En attente du démarrage par l&apos;animateur…
          </p>
        )}
      </main>
    </div>
  );
}
