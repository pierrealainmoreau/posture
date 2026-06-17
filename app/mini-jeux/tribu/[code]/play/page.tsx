"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import type { TribuRoom, TribuPlayer } from "@/lib/tribu/types";
import { getQuestionById } from "@/lib/tribu/questions";
import type { Question } from "@/lib/tribu/questions";

const TIMER_DURATION = 60; // seconds per question

// ── Timer bar ─────────────────────────────────────────────────────────────────
function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = (seconds / total) * 100;
  const color =
    pct > 50 ? "bg-teal-500" : pct > 25 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Waiting screen ────────────────────────────────────────────────────────────
function WaitingScreen({
  players,
  myPlayerId,
  roomId,
  onReveal,
  isHost,
  revealing,
}: {
  players: TribuPlayer[];
  myPlayerId: string;
  roomId: string;
  onReveal: () => void;
  isHost: boolean;
  revealing: boolean;
}) {
  const finished = players.filter((p) => p.finished_at);
  const total = players.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-5">🧭</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Questions terminées !
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {finished.length} / {total} joueur{total !== 1 ? "s" : ""} ont terminé
        </p>

        {/* Avatar grid */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {players.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-opacity ${
                  p.finished_at ? "opacity-100" : "opacity-30"
                }`}
                style={{ backgroundColor: p.avatar_color }}
              >
                {p.pseudo[0].toUpperCase()}
              </div>
              <span className={`text-xs ${p.finished_at ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}`}>
                {p.pseudo}
              </span>
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            onClick={onReveal}
            disabled={revealing}
            className="w-full py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {revealing ? (
              <><Loader2 size={15} className="animate-spin" /> Calcul en cours…</>
            ) : (
              "Révéler les tribus →"
            )}
          </button>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            En attente de la révélation par l&apos;animateur…
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TribuPlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom] = useState<TribuRoom | null>(null);
  const [players, setPlayers] = useState<TribuPlayer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [animating, setAnimating] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load identity
  useEffect(() => {
    const stored = localStorage.getItem(`tribu_player_${upperCode}`);
    if (!stored) { router.replace(`/mini-jeux/tribu/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/mini-jeux/tribu/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Load room + questions + existing answers
  useEffect(() => {
    if (!playerId) return;

    async function init() {
      const [roomRes, answersRes] = await Promise.all([
        fetch(`/api/tribu/room/${upperCode}`),
        fetch(`/api/tribu/room/${upperCode}/answers?playerId=${playerId}`),
      ]);

      if (!roomRes.ok) { setLoading(false); return; }

      const roomData = await roomRes.json() as TribuRoom & { players: TribuPlayer[] };
      setRoom(roomData);
      setPlayers(roomData.players ?? []);

      if (roomData.status === "lobby") {
        router.replace(`/mini-jeux/tribu/${upperCode}/lobby`);
        return;
      }
      if (roomData.status === "revealing" || roomData.status === "finished") {
        router.replace(`/mini-jeux/tribu/${upperCode}/results`);
        return;
      }

      const qs = (roomData.question_ids ?? [])
        .map((id: string) => getQuestionById(id))
        .filter(Boolean) as Question[];
      setQuestions(qs);

      const existingAnswers = answersRes.ok
        ? (await answersRes.json() as { question_id: string }[])
        : [];
      const doneIds = new Set(existingAnswers.map((a) => a.question_id));
      setAnswered(doneIds);

      // Find first unanswered
      const firstUnanswered = qs.findIndex((q) => !doneIds.has(q.id));
      if (firstUnanswered === -1) {
        // Already finished all questions
        setCurrentIdx(qs.length);
        setFinished(true);
        await markFinished(roomData.players ?? []);
      } else {
        setCurrentIdx(firstUnanswered);
      }

      setLoading(false);
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  async function markFinished(currentPlayers: TribuPlayer[]) {
    const me = currentPlayers.find((p) => p.id === playerId);
    if (me?.finished_at) return; // already marked
    await fetch(`/api/tribu/room/${upperCode}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ playerId }),
    });
  }

  // Poll when waiting (finished but room not revealed)
  useEffect(() => {
    if (!finished || !playerId) return;

    async function pollRoom() {
      const res = await fetch(`/api/tribu/room/${upperCode}`);
      if (!res.ok) return;
      const data = await res.json() as TribuRoom & { players: TribuPlayer[] };
      setPlayers(data.players ?? []);
      if (data.status === "revealing" || data.status === "finished") {
        router.push(`/mini-jeux/tribu/${upperCode}/results`);
      }
    }

    pollRoom();
    pollRef.current = setInterval(pollRoom, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, playerId, upperCode]);

  // Timer per question
  const advanceQuestion = useCallback(async (skipped = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const currentQ = questions[currentIdx];
    if (!currentQ || skipped) {
      // Timer expired — skip question without posting
    }

    setAnimating(true);
    setTimeout(async () => {
      const next = currentIdx + 1;
      if (next >= questions.length) {
        setCurrentIdx(questions.length);
        setFinished(true);
        const res = await fetch(`/api/tribu/room/${upperCode}`);
        const data = res.ok ? await res.json() as TribuRoom & { players: TribuPlayer[] } : null;
        await markFinished(data?.players ?? []);
        setPlayers(data?.players ?? []);
      } else {
        setCurrentIdx(next);
        setTimer(TIMER_DURATION);
      }
      setAnimating(false);
    }, 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, questions, playerId, upperCode]);

  useEffect(() => {
    if (finished || loading || questions.length === 0) return;
    setTimer(TIMER_DURATION);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          advanceQuestion(true);
          return TIMER_DURATION;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, finished, loading, questions.length]);

  async function handleAnswer(questionId: string, value: string) {
    if (animating) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setAnswered((prev) => new Set([...prev, questionId]));

    // Fire-and-forget answer post
    fetch(`/api/tribu/room/${upperCode}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ playerId, questionId, answerValue: value }),
    });

    await advanceQuestion(false);
  }

  async function handleReveal() {
    if (!room) return;
    setRevealing(true);
    try {
      await fetch("/api/tribu/compute-tribes", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ roomId: room.id, playerId }),
      });
      router.push(`/mini-jeux/tribu/${upperCode}/results`);
    } catch {
      setRevealing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  const isHost = room?.host_player_id === playerId;

  if (finished) {
    return (
      <WaitingScreen
        players={players}
        myPlayerId={playerId}
        roomId={room?.id ?? ""}
        onReveal={handleReveal}
        isHost={isHost}
        revealing={revealing}
      />
    );
  }

  const currentQ = questions[currentIdx];
  if (!currentQ) return null;

  const finishedCount = players.filter((p) => p.finished_at).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

        {/* Progress header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Question {currentIdx + 1} / {questions.length}
            </span>
            {finishedCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {finishedCount} / {players.length} terminé{finishedCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <TimerBar seconds={timer} total={TIMER_DURATION} />
          <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1">
            <div
              className="bg-teal-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div
          className={`flex-1 flex flex-col justify-center transition-all duration-200 ${
            animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
          }`}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10 leading-snug">
            {currentQ.text}
          </h2>

          {/* Choices */}
          <div className={`grid gap-3 ${currentQ.choices.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
            {currentQ.choices.map((choice) => (
              <button
                key={choice.value}
                onClick={() => handleAnswer(currentQ.id, choice.value)}
                disabled={animating}
                className="flex items-center justify-center gap-2 py-5 px-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base font-semibold text-gray-800 dark:text-gray-200 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-700 dark:hover:text-teal-300 transition-all active:scale-95"
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
          Répondez instinctivement — il n&apos;y a pas de bonne réponse.
        </p>
      </main>
    </div>
  );
}
