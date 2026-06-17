"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Crown, Play } from "lucide-react";
import { Header } from "@/components/Header";
import { QRShare } from "@/components/QRShare";
import { DemoBotsButton } from "@/components/DemoBotsButton";
import type { RetroRoom, RetroPlayer } from "@/lib/retrospective/types";
import { useI18n } from "@/lib/i18n";

export default function RetroLobbyPage() {
  const { t } = useI18n();
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState<string>("");
  const [playerSecret, setPlayerSecret] = useState<string>("");
  const [room, setRoom]                 = useState<RetroRoom | null>(null);
  const [players, setPlayers]           = useState<RetroPlayer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [starting, setStarting]         = useState(false);
  const [startError, setStartError]     = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const pollCountRef = useRef(0);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/retrospective/join?code=${upperCode}`
      : "";

  const breadcrumbs = [
    { href: "/", label: t.common.home },
    { href: "/retrospective", label: t.retrospective.title },
    { label: t.retrospective.statusLobby },
  ];

  // Load identity from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`retro_player_${upperCode}`);
    if (!stored) {
      router.replace(`/retrospective/join?code=${upperCode}`);
      return;
    }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/retrospective/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Poll room every 2s
  useEffect(() => {
    if (!playerId) return;

    async function fetchRoom() {
      const res = await fetch(`/api/retrospective/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as RetroRoom & { players: RetroPlayer[] };
      const fetchedPlayers = data.players ?? [];

      if (data.status === "lobby" && data.host_player_id !== playerId) {
        pollCountRef.current++;
        const iAmInList = fetchedPlayers.some((p) => p.id === playerId);
        if (!iAmInList && pollCountRef.current >= 2) setNotRegistered(true);
        else if (iAmInList) { pollCountRef.current = 0; setNotRegistered(false); }
      }

      setRoom(data);
      setPlayers(fetchedPlayers);
      setLoading(false);

      if (data.status === "voting") router.push(`/retrospective/${upperCode}/vote`);
      else if (data.status === "finished") router.push(`/retrospective/${upperCode}/results`);
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  async function startVoting() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/retrospective/room/${upperCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) setStartError(data.error ?? t.lobby.startError);
    } catch {
      setStartError(t.common.error);
    } finally {
      setStarting(false);
    }
  }

  const isHost = room?.host_player_id === playerId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> {t.common.loading}
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode />
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          {t.lobby.sessionNotFound}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">

        {/* Code + share */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {t.lobby.sessionCode}
          </p>
          <p className="text-5xl font-bold font-mono tracking-widest text-gray-900 dark:text-white mb-4">
            {upperCode}
          </p>
          <QRShare
            url={shareUrl}
            label={t.lobby.shareParticipants}
            filename={`retro-${upperCode}`}
            wrapperCls="bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900"
            labelCls="text-teal-700 dark:text-teal-300"
            urlCls="text-teal-800 dark:text-teal-200"
            copyBtnCls="bg-white dark:bg-teal-900 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-800"
          />
        </div>

        {/* Players list */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              {t.lobby.participantsLabel} ({players.length})
            </span>
          </div>
          {players.length === 0 ? (
            <div className="px-4 py-6 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin text-gray-300 mr-2" />
              <span className="text-sm text-gray-400">{t.lobby.waitingParticipants}</span>
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
                  {p.is_host && <Crown size={14} className="text-amber-500 flex-shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isHost && (
          <div className="flex flex-col items-stretch gap-2">
            {startError && <p className="text-xs text-red-500 text-center">{startError}</p>}
            <button
              onClick={startVoting}
              disabled={players.length < 1 || starting}
              className="flex items-center justify-center gap-2 py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors"
            >
              {starting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {starting ? t.lobby.starting : t.lobby.launchVote}
            </button>
            <DemoBotsButton game="retrospective" code={upperCode} playerId={playerId} playerSecret={playerSecret} />
          </div>
        )}

        {!isHost && notRegistered && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-4 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              {t.lobby.sessionLost}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem(`retro_player_${upperCode}`);
                router.replace(`/retrospective/join?code=${upperCode}`);
              }}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
            >
              {t.lobby.rejoin}
            </button>
          </div>
        )}

        {!isHost && !notRegistered && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Loader2 size={13} className="animate-spin" />
            {t.lobby.waitingStart}
          </p>
        )}
      </main>
    </div>
  );
}
