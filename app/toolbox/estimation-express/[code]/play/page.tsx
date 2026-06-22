"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronRight, Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import type { EstimationExpressRoom, EstimationExpressPlayer, EstimationExpressGuess, EEQuestion } from "@/lib/estimation-express/types";
import { GUESS_SECONDS } from "@/lib/estimation-express/types";

function TimerBar({ startedAt, totalSeconds }: { startedAt: string; totalSeconds: number }) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    function tick() {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      setRemaining(Math.max(0, totalSeconds - elapsed));
    }
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [startedAt, totalSeconds]);

  const pct = (remaining / totalSeconds) * 100;
  const color = pct > 50 ? "bg-violet-500" : pct > 20 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function formatValue(val: number, unit: string): string {
  const rounded = Number.isInteger(val) ? val : Math.round(val * 10) / 10;
  return `${rounded} ${unit}`;
}

export default function EstimationExpressPlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom]                 = useState<EstimationExpressRoom | null>(null);
  const [players, setPlayers]           = useState<EstimationExpressPlayer[]>([]);
  const [guesses, setGuesses]           = useState<EstimationExpressGuess[]>([]);
  const [loading, setLoading]           = useState(true);
  const [sliderVal, setSliderVal]       = useState<number | null>(null);
  const [submitted, setSubmitted]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [revealDone, setRevealDone]     = useState(false);
  const [advancing, setAdvancing]       = useState(false);
  const scoredRef = useRef<Set<number>>(new Set());

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/estimation-express", label: "Estimation Express" },
    { label: upperCode },
  ];

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

  const triggerReveal = useCallback(async (pId: string, pSecret: string) => {
    await fetch(`/api/estimation-express/room/${upperCode}/reveal`, {
      method: "POST",
      headers: { "X-Player-Id": pId, "X-Player-Secret": pSecret },
    });
    setRevealDone(true);
  }, [upperCode]);

  useEffect(() => {
    if (!playerId) return;

    async function fetchRoom() {
      const res = await fetch(`/api/estimation-express/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) return;

      const data = await res.json() as { room: EstimationExpressRoom; players: EstimationExpressPlayer[]; guesses: EstimationExpressGuess[] };

      setRoom(data.room);
      setPlayers(data.players ?? []);
      setGuesses(data.guesses ?? []);
      setLoading(false);

      const qIdx = data.room.current_question_index ?? 0;

      // Reset submission state if question changed
      if (data.room.status === "playing") {
        const myGuess = (data.guesses ?? []).find((g) => g.player_id === playerId);
        if (myGuess) setSubmitted(true);
        else setSubmitted(false);
        setRevealDone(false);
      }

      // Host scores reveal phase
      if (data.room.status === "reveal" && data.room.host_player_id === playerId && !scoredRef.current.has(qIdx)) {
        scoredRef.current.add(qIdx);
        void triggerReveal(playerId, playerSecret);
      }

      if (data.room.status === "finished") {
        router.push(`/toolbox/estimation-express/${upperCode}/results`);
      }
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, playerSecret, upperCode]);

  async function submitGuess() {
    if (sliderVal === null || submitted || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/estimation-express/room/${upperCode}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Id": playerId, "X-Player-Secret": playerSecret },
        body: JSON.stringify({ value: sliderVal }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function nextQuestion() {
    setAdvancing(true);
    try {
      await fetch(`/api/estimation-express/room/${upperCode}/next`, {
        method: "POST",
        headers: { "X-Player-Id": playerId, "X-Player-Secret": playerSecret },
      });
    } finally {
      setAdvancing(false);
    }
  }

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  const isHost = room.host_player_id === playerId;
  const qIdx = room.current_question_index ?? 0;
  const questions = room.questions as EEQuestion[];
  const question = questions[qIdx];

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={18} className="animate-spin mr-2" /> En attente…
        </div>
      </div>
    );
  }

  const midVal = question.min + (question.max - question.min) / 2;
  const currentSlider = sliderVal ?? midVal;

  const myGuess = guesses.find((g) => g.player_id === playerId);
  const totalPlayers = players.length;
  const answeredCount = guesses.length;

  // Reveal phase: compute sorted results
  let ranked: Array<{ player: EstimationExpressPlayer; guess: EstimationExpressGuess; distance: number }> = [];
  if (room.status === "reveal") {
    ranked = guesses
      .map((g) => ({
        player: players.find((p) => p.id === g.player_id) ?? { id: g.player_id, pseudo: "?", avatar_color: "#888", is_host: false, score: 0, room_id: "", joined_at: "" },
        guess: g,
        distance: Math.abs(g.value - question.answer),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8 space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Question {qIdx + 1} / {questions.length}</span>
          <span>{answeredCount}/{totalPlayers} réponses</span>
        </div>

        {/* Timer */}
        {room.status === "playing" && room.phase_started_at && (
          <TimerBar startedAt={room.phase_started_at} totalSeconds={GUESS_SECONDS} />
        )}

        {/* Question card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <p className="text-base font-semibold text-gray-900 dark:text-white text-center leading-snug">{question.text}</p>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
            Plage : {question.min} – {question.max} {question.unit}
          </p>
        </div>

        {/* Playing phase */}
        {room.status === "playing" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-6">
            {!submitted ? (
              <>
                <div className="text-center">
                  <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                    {formatValue(currentSlider, question.unit)}
                  </span>
                </div>
                <input
                  type="range"
                  min={question.min}
                  max={question.max}
                  step={question.step}
                  value={currentSlider}
                  onChange={(e) => setSliderVal(parseFloat(e.target.value))}
                  className="w-full h-2 appearance-none rounded-full bg-violet-200 dark:bg-violet-900 accent-violet-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{question.min} {question.unit}</span>
                  <span>{question.max} {question.unit}</span>
                </div>
                <button
                  onClick={submitGuess}
                  disabled={submitting}
                  className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                  {submitting ? "Envoi…" : "Valider ma réponse"}
                </button>
              </>
            ) : (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-950 flex items-center justify-center mx-auto">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Réponse envoyée : <strong className="text-violet-600 dark:text-violet-400">{formatValue(myGuess?.value ?? currentSlider, question.unit)}</strong>
                </p>
                <p className="text-xs text-gray-400">{answeredCount}/{totalPlayers} joueurs ont répondu</p>
                {answeredCount < totalPlayers && <Loader2 size={14} className="animate-spin text-gray-400 mx-auto" />}
              </div>
            )}
          </div>
        )}

        {/* Reveal phase */}
        {room.status === "reveal" && (
          <div className="space-y-4">
            {/* Correct answer */}
            <div className="bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-2xl p-5 text-center">
              <p className="text-xs text-violet-500 dark:text-violet-400 font-semibold uppercase tracking-wider mb-1">Bonne réponse</p>
              <p className="text-4xl font-bold text-violet-700 dark:text-violet-300">
                {formatValue(question.answer, question.unit)}
              </p>
              {question.funfact && (
                <p className="text-xs text-violet-600 dark:text-violet-400 mt-3 italic">{question.funfact}</p>
              )}
            </div>

            {/* Rankings */}
            {ranked.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Classement</p>
                {ranked.map((item, i) => {
                  const isMe = item.player.id === playerId;
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                  return (
                    <div
                      key={item.guess.player_id}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${isMe ? "bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800" : "bg-gray-50 dark:bg-gray-800"}`}
                    >
                      <span className="text-base w-6">{medal ?? <span className="text-gray-400 text-xs">{i + 1}</span>}</span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: item.player.avatar_color }}>
                        {item.player.pseudo[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{item.player.pseudo}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatValue(item.guess.value, question.unit)}</p>
                        <p className="text-xs text-gray-400">écart: {formatValue(item.distance, question.unit)}</p>
                      </div>
                      {item.guess.points_earned > 0 && revealDone && (
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 ml-1">+{item.guess.points_earned}pts</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Leaderboard */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={14} className="text-amber-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Scores cumulés</p>
              </div>
              <div className="space-y-2">
                {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${p.id === playerId ? "bg-violet-50 dark:bg-violet-950" : ""}`}>
                    <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.avatar_color }}>
                      {p.pseudo[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{p.pseudo}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{p.score} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next / Finish button (host only) */}
            {isHost && (
              <button
                onClick={nextQuestion}
                disabled={advancing || !revealDone}
                className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {advancing ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                {advancing ? "Chargement…" : qIdx + 1 < questions.length ? "Question suivante" : "Voir les résultats"}
              </button>
            )}

            {!isHost && (
              <p className="text-center text-xs text-gray-400">En attente de l&apos;hôte pour la suite…</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
