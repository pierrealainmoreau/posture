"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Clock, Send, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import type { SpeedRetroRoom, SpeedRetroPlayer } from "@/lib/speed-retro/types";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/toolbox/speed-retro", label: "Speed Retro" },
  { label: "Écriture" },
];

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export default function SpeedRetroWritePage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState<string>("");
  const [playerSecret, setPlayerSecret] = useState<string>("");
  const [room, setRoom]                 = useState<SpeedRetroRoom | null>(null);
  const [answers, setAnswers]           = useState<string[]>(["", "", "", ""]);
  const [submitted, setSubmitted]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [remaining, setRemaining]       = useState<number>(300);
  const [loading, setLoading]           = useState(true);
  const [startingVote, setStartingVote] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`speed_retro_player_${upperCode}`);
    if (!stored) { router.replace(`/toolbox/speed-retro/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/toolbox/speed-retro/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    if (!playerId) return;

    async function fetchRoom() {
      const res = await fetch(`/api/speed-retro/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as SpeedRetroRoom & { players: SpeedRetroPlayer[] };
      setRoom(data);
      setLoading(false);

      if (data.writing_started_at) {
        const elapsed = Date.now() / 1000 - new Date(data.writing_started_at).getTime() / 1000;
        setRemaining(Math.max(0, 300 - elapsed));
      }

      if (data.status === "voting") router.push(`/toolbox/speed-retro/${upperCode}/vote`);
      else if (data.status === "finished") router.push(`/toolbox/speed-retro/${upperCode}/results`);
      else if (data.status === "lobby") router.push(`/toolbox/speed-retro/${upperCode}/lobby`);
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  async function handleSubmit() {
    if (submitting || submitted) return;
    setSubmitting(true);
    setSubmitError(null);

    const items = answers
      .map((content, questionIndex) => ({ questionIndex, content }))
      .filter((it) => it.content.trim());

    try {
      const res = await fetch(`/api/speed-retro/room/${upperCode}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Player-Secret": playerSecret,
        },
        body: JSON.stringify({ playerId, items }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setSubmitError(data.error ?? "Erreur lors de la soumission");
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitError("Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startVoting() {
    setStartingVote(true);
    try {
      await fetch(`/api/speed-retro/room/${upperCode}/start-voting`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
    } catch {
      // ignore
    } finally {
      setStartingVote(false);
    }
  }

  const isHost = room?.host_player_id === playerId;
  const timeIsLow = remaining < 60;

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
              Phase d&apos;écriture
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Répondez librement — vos idées sont anonymes
            </p>
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

        {submitted ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-10 text-center mb-6">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Idées soumises !
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 mt-3">
              <Loader2 size={13} className="animate-spin" />
              En attente des autres participants…
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {(room?.questions ?? []).map((question, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {question}
                </label>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={answers[i]}
                  onChange={(e) => setAnswers((prev) => prev.map((a, idx) => idx === i ? e.target.value : a))}
                  placeholder="Votre réponse…"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            ))}
          </div>
        )}

        {!submitted && (
          <>
            {submitError && <p className="text-xs text-red-500 text-center mb-2">{submitError}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? "Soumission…" : "Soumettre mes idées"}
            </button>
          </>
        )}

        {isHost && (
          <button
            onClick={startVoting}
            disabled={startingVote}
            className="w-full py-2.5 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 text-sm font-medium rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {startingVote ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
            {startingVote ? "Passage au vote…" : "Passer au vote"}
          </button>
        )}
      </main>
    </div>
  );
}
