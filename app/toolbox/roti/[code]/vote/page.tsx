"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { ROTI_LABELS, type RotiRoom, type RotiPlayer } from "@/lib/roti/types";
import { cn } from "@/lib/utils";

export default function RotiVotePage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState<string>("");
  const [playerSecret, setPlayerSecret] = useState<string>("");
  const [room, setRoom]                 = useState<RotiRoom | null>(null);
  const [players, setPlayers]           = useState<RotiPlayer[]>([]);
  const [votedCount, setVotedCount]     = useState(0);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [voted, setVoted]               = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [voteError, setVoteError]       = useState<string | null>(null);
  const [finishing, setFinishing]       = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(`roti_player_${upperCode}`);
    if (!stored) {
      router.replace(`/toolbox/roti/join?code=${upperCode}`);
      return;
    }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/toolbox/roti/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    if (!playerId) return;

    async function fetchRoom() {
      const res = await fetch(`/api/roti/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as RotiRoom & { players: RotiPlayer[]; voted_count: number };
      setRoom(data);
      setPlayers(data.players ?? []);
      setVotedCount(data.voted_count ?? 0);
      setLoading(false);

      if (data.status === "finished") router.push(`/toolbox/roti/${upperCode}/results`);
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  async function submitVote(score: number) {
    if (voted || submitting) return;
    setSelectedVote(score);
    setSubmitting(true);
    setVoteError(null);

    try {
      const res = await fetch(`/api/roti/room/${upperCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId, vote: score }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setVoteError(data.error ?? "Erreur lors du vote");
        setSelectedVote(null);
      } else {
        setVoted(true);
      }
    } catch {
      setVoteError("Une erreur est survenue.");
      setSelectedVote(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function revealResults() {
    setFinishing(true);
    try {
      await fetch(`/api/roti/room/${upperCode}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
    } catch {
      // ignore
    } finally {
      setFinishing(false);
    }
  }

  const isHost = room?.host_player_id === playerId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode={!isHost} />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10">

        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Comment s&apos;est passée cette session ?
          </h1>
          {room?.session_name && (
            <p className="text-sm text-violet-600 dark:text-violet-400">{room.session_name}</p>
          )}
        </div>

        {voted && selectedVote !== null ? (
          <div className={cn(
            "rounded-2xl border p-6 text-center mb-6",
            ROTI_LABELS[selectedVote].bgClass,
            ROTI_LABELS[selectedVote].borderClass
          )}>
            <CheckCircle2 size={28} className={cn("mx-auto mb-2", ROTI_LABELS[selectedVote].textClass)} />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Votre vote</p>
            <p className={cn("text-4xl font-bold mb-1", ROTI_LABELS[selectedVote].textClass)}>
              {selectedVote}
            </p>
            <p className={cn("text-sm font-medium", ROTI_LABELS[selectedVote].textClass)}>
              {ROTI_LABELS[selectedVote].label}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2 mb-6 sm:gap-3">
              {([1, 2, 3, 4, 5] as const).map((score) => {
                const l = ROTI_LABELS[score];
                const isSelected = selectedVote === score;
                return (
                  <button
                    key={score}
                    onClick={() => submitVote(score)}
                    disabled={submitting}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl border-2 py-4 px-2 transition-all",
                      "hover:scale-105 active:scale-95",
                      isSelected
                        ? `${l.bgClass} ${l.borderClass}`
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <span className={cn(
                      "text-3xl font-bold mb-1",
                      isSelected ? l.textClass : "text-gray-800 dark:text-gray-200"
                    )}>
                      {score}
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium text-center leading-tight",
                      isSelected ? l.textClass : "text-gray-500 dark:text-gray-400"
                    )}>
                      {l.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {voteError && (
              <p className="text-xs text-red-500 text-center mb-4">{voteError}</p>
            )}
          </>
        )}

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          {votedCount} / {players.length} participant{players.length > 1 ? "s" : ""} ont voté
        </p>

        {isHost && (
          <button
            onClick={revealResults}
            disabled={finishing}
            className="w-full py-3 bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-sm font-semibold rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {finishing && <Loader2 size={14} className="animate-spin" />}
            {finishing ? "En cours…" : "Révéler les résultats"}
          </button>
        )}

        {!isHost && voted && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Loader2 size={13} className="animate-spin" />
            En attente de l&apos;animateur…
          </p>
        )}
      </main>
    </div>
  );
}
