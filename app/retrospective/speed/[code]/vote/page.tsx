"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Clock, ThumbsUp, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import type { SpeedRetroRoom, SpeedRetroPlayer, SpeedRetroItem } from "@/lib/speed-retro/types";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/retrospective/speed", label: "Speed Retro" },
  { label: "Vote" },
];

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export default function SpeedRetroVotePage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState<string>("");
  const [playerSecret, setPlayerSecret] = useState<string>("");
  const [room, setRoom]                 = useState<SpeedRetroRoom | null>(null);
  const [items, setItems]               = useState<SpeedRetroItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [remaining, setRemaining]       = useState<number>(180);
  const [votingItems, setVotingItems]   = useState<Set<string>>(new Set());
  const [finishing, setFinishing]       = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`speed_retro_player_${upperCode}`);
    if (!stored) { router.replace(`/retrospective/speed/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/retrospective/speed/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    if (!playerId || !playerSecret) return;

    async function fetchRoom() {
      const res = await fetch(`/api/speed-retro/room/${upperCode}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store",
          "X-Player-Secret": playerSecret,
        },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as SpeedRetroRoom & { players: SpeedRetroPlayer[]; items?: SpeedRetroItem[] };
      setRoom(data);
      if (data.items) setItems(data.items);
      setLoading(false);

      if (data.voting_started_at) {
        const elapsed = Date.now() / 1000 - new Date(data.voting_started_at).getTime() / 1000;
        setRemaining(Math.max(0, 180 - elapsed));
      }

      if (data.status === "finished") router.push(`/retrospective/speed/${upperCode}/results`);
      else if (data.status === "writing") router.push(`/retrospective/speed/${upperCode}/write`);
      else if (data.status === "lobby") router.push(`/retrospective/speed/${upperCode}/lobby`);
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, playerSecret, upperCode]);

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  async function toggleVote(itemId: string) {
    if (votingItems.has(itemId)) return;
    setVotingItems((prev) => new Set(prev).add(itemId));

    try {
      const res = await fetch(`/api/speed-retro/room/${upperCode}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Player-Secret": playerSecret,
        },
        body: JSON.stringify({ playerId, itemId }),
      });
      const data = await res.json() as { ok?: boolean; action?: string; error?: string };

      if (res.ok && data.action) {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== itemId) return it;
            if (data.action === "added") return { ...it, vote_count: it.vote_count + 1, my_vote: true };
            return { ...it, vote_count: Math.max(0, it.vote_count - 1), my_vote: false };
          })
        );
      }
    } catch {
      // ignore
    } finally {
      setVotingItems((prev) => { const s = new Set(prev); s.delete(itemId); return s; });
    }
  }

  async function finishVote() {
    setFinishing(true);
    try {
      await fetch(`/api/speed-retro/room/${upperCode}/finish`, {
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
  const timeIsLow = remaining < 60;
  const voteLimit = room?.vote_limit ?? null;
  const myVotesUsed = items.filter((it) => it.my_vote).length;
  const votesRemaining = voteLimit !== null ? voteLimit - myVotesUsed : null;

  const questions = room?.questions ?? [];

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
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Phase de vote
            </h1>
            {votesRemaining !== null && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 font-medium">
                {votesRemaining} vote{votesRemaining !== 1 ? "s" : ""} restant{votesRemaining !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {room?.timer_enabled !== false && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-mono font-semibold",
              timeIsLow
                ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                : "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
            )}>
              <Clock size={13} />
              {formatTime(remaining)}
            </div>
          )}
        </div>

        <div className="space-y-6 mb-6">
          {questions.map((question, qi) => {
            const qItems = items.filter((it) => it.question_index === qi);
            return (
              <section key={qi}>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {question}
                </h2>
                {qItems.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic px-1">
                    Aucune réponse pour cette question.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {qItems.map((item) => {
                      const budgetExhausted = votesRemaining !== null && votesRemaining <= 0 && !item.my_vote;
                      const isVoting = votingItems.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => !budgetExhausted && !isVoting && toggleVote(item.id)}
                          disabled={budgetExhausted || isVoting}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl border transition-all",
                            item.my_vote
                              ? "bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700"
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800",
                            budgetExhausted && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed flex-1">
                              {item.content}
                            </p>
                            <div className={cn(
                              "flex items-center gap-1 text-xs font-semibold flex-shrink-0 mt-0.5",
                              item.my_vote
                                ? "text-orange-600 dark:text-orange-400"
                                : "text-gray-400 dark:text-gray-500"
                            )}>
                              {isVoting
                                ? <Loader2 size={12} className="animate-spin" />
                                : <ThumbsUp size={12} />
                              }
                              {item.vote_count}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {isHost && (
          <button
            onClick={finishVote}
            disabled={finishing}
            className="w-full py-3 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 text-sm font-medium rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {finishing ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
            {finishing ? "Clôture…" : "Terminer le vote"}
          </button>
        )}
      </main>
    </div>
  );
}
