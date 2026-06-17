"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ChevronRight, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { resolveQuestion } from "@/lib/thisorthat/questions";
import type { ThisOrThatRoom, ThisOrThatPlayer, ThisOrThatVote } from "@/lib/thisorthat/types";

type RoomData = ThisOrThatRoom & { players: ThisOrThatPlayer[]; votes: ThisOrThatVote[] };

// ── Barre de répartition ────────────────────────────────────────────────────
function SplitBar({ aCount, bCount, optA, optB }: { aCount: number; bCount: number; optA: string; optB: string }) {
  const total = aCount + bCount;
  const pctA = total === 0 ? 50 : Math.round((aCount / total) * 100);
  const pctB = 100 - pctA;

  return (
    <div className="w-full space-y-3">
      <div className="flex rounded-2xl overflow-hidden h-14 text-sm font-bold">
        <div
          className="flex items-center justify-center text-white transition-all duration-700 bg-sky-500"
          style={{ width: `${pctA}%`, minWidth: pctA > 0 ? "2rem" : 0 }}
        >
          {pctA > 15 && `${pctA}%`}
        </div>
        <div
          className="flex items-center justify-center text-white transition-all duration-700 bg-indigo-500"
          style={{ width: `${pctB}%`, minWidth: pctB > 0 ? "2rem" : 0 }}
        >
          {pctB > 15 && `${pctB}%`}
        </div>
      </div>
      <div className="flex justify-between text-sm font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
          {optA} <span className="text-gray-400 font-normal ml-1">({aCount})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-gray-400 font-normal mr-1">({bCount})</span>
          {optB}
          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
        </span>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function ThisOrThatPlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom]                 = useState<RoomData | null>(null);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [voteError, setVoteError]       = useState<string | null>(null);
  const [revealing, setRevealing]       = useState(false);
  const [advancing, setAdvancing]       = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`thisorthat_player_${upperCode}`);
    if (!stored) { router.replace(`/mini-jeux/thisorthat/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/mini-jeux/thisorthat/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    if (!playerId) return;

    async function fetchRoom() {
      const res = await fetch(`/api/thisorthat/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as RoomData;
      setRoom(data);
      setLoading(false);

      if (data.status === "lobby") router.replace(`/mini-jeux/thisorthat/${upperCode}/lobby`);
      if (data.status === "finished") router.push(`/mini-jeux/thisorthat/${upperCode}/results`);
    }

    fetchRoom();
    pollRef.current = setInterval(fetchRoom, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  async function handleVote(choice: "a" | "b") {
    if (submitting || myVote) return;
    setSubmitting(true);
    setVoteError(null);
    try {
      const res = await fetch(`/api/thisorthat/room/${upperCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId, choice }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setVoteError(d.error ?? "Erreur lors du vote.");
      } else {
        setRoom((prev) => {
          if (!prev) return prev;
          const existing = prev.votes.find(
            (v) => v.player_id === playerId && v.question_index === prev.current_question_index
          );
          if (existing) return prev;
          return {
            ...prev,
            votes: [...prev.votes, { player_id: playerId, question_index: prev.current_question_index, choice }],
          };
        });
      }
    } catch {
      setVoteError("Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReveal() {
    setRevealing(true);
    try {
      await fetch(`/api/thisorthat/room/${upperCode}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
    } catch { /* ignore */ } finally {
      setRevealing(false);
    }
  }

  async function handleNext() {
    setAdvancing(true);
    try {
      await fetch(`/api/thisorthat/room/${upperCode}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
    } catch { /* ignore */ } finally {
      setAdvancing(false);
    }
  }

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  const isHost   = room.host_player_id === playerId;
  const qi       = room.current_question_index;
  const question = resolveQuestion(room.question_ids[qi], room.custom_questions ?? []);
  const total    = room.question_ids.length;

  const currentVotes = room.votes.filter((v) => v.question_index === qi);
  const myVote = currentVotes.find((v) => v.player_id === playerId)?.choice ?? null;
  const aCount = currentVotes.filter((v) => v.choice === "a").length;
  const bCount = currentVotes.filter((v) => v.choice === "b").length;
  const voteCount = currentVotes.length;
  const playerCount = room.players.length;

  const isLast = qi >= total - 1;

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400 text-sm">
        Question introuvable.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 py-8">

        {/* Progression */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Question {qi + 1} / {total}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-medium">
            {question.context}
          </span>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1 mb-8">
          <div
            className="bg-sky-500 h-1 rounded-full transition-all duration-500"
            style={{ width: `${((qi + 1) / total) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {question.a} ou {question.b} ?
          </h2>
        </div>

        {/* Résultats révélés */}
        {room.show_results ? (
          <div className="flex-1 flex flex-col justify-center">
            <SplitBar aCount={aCount} bCount={bCount} optA={question.a} optB={question.b} />

            {myVote && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <CheckCircle2 size={14} className={myVote === "a" ? "text-sky-500" : "text-indigo-500"} />
                Vous avez voté <strong className="text-gray-900 dark:text-white">
                  {myVote === "a" ? question.a : question.b}
                </strong>
              </div>
            )}
          </div>
        ) : (
          /* Choix de vote */
          <div className="flex-1 flex flex-col justify-center gap-4">
            {myVote ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 size={16} className={myVote === "a" ? "text-sky-500" : "text-indigo-500"} />
                  Vous avez voté <strong className="text-gray-900 dark:text-white">
                    {myVote === "a" ? question.a : question.b}
                  </strong>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" />
                  {voteCount} / {playerCount} vote{voteCount !== 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleVote("a")}
                  disabled={submitting}
                  className="w-full py-5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-lg font-bold rounded-2xl transition-all active:scale-95 shadow-sm hover:shadow-md"
                >
                  {question.a}
                </button>
                <div className="text-center text-xs font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">
                  ou
                </div>
                <button
                  onClick={() => handleVote("b")}
                  disabled={submitting}
                  className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-lg font-bold rounded-2xl transition-all active:scale-95 shadow-sm hover:shadow-md"
                >
                  {question.b}
                </button>
              </>
            )}
            {voteError && (
              <p className="text-xs text-red-500 text-center">{voteError}</p>
            )}
          </div>
        )}

        {/* Contrôles hôte */}
        {isHost && (
          <div className="mt-8 flex flex-col gap-2">
            {!room.show_results ? (
              <button
                onClick={handleReveal}
                disabled={revealing}
                className="flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {revealing ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                {revealing ? "Révélation…" : `Révéler (${voteCount}/${playerCount})`}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={advancing}
                className="flex items-center justify-center gap-2 py-3 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 disabled:opacity-50 transition-colors"
              >
                {advancing ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
                {advancing ? "…" : isLast ? "Voir les résultats finaux" : "Question suivante"}
              </button>
            )}
          </div>
        )}

        {!isHost && !room.show_results && myVote && (
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
            <Loader2 size={11} className="animate-spin" />
            En attente de la révélation par l&apos;animateur…
          </p>
        )}
        {!isHost && room.show_results && (
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
            <Loader2 size={11} className="animate-spin" />
            En attente de la question suivante…
          </p>
        )}
      </main>
    </div>
  );
}
