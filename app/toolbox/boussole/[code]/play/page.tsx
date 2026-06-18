"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { SITUATIONS } from "@/lib/boussole/situations";

// ── Types ──────────────────────────────────────────────────────────────────────
type ProfilId = "pilote" | "dynamo" | "socle" | "repere";

interface BoussouleRoom {
  id: string;
  code: string;
  host_player_id: string;
  status: "lobby" | "playing" | "finished";
  situation_count: number;
  situation_ids: string[];
}

interface BoussoulePlayer {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  finished_at: string | null;
}

// ── Timer SVG ──────────────────────────────────────────────────────────────────
function TimerCircle({ timeLeft, total = 45 }: { timeLeft: number; total?: number }) {
  const r = 20, cx = 24, cy = 24;
  const circumference = 2 * Math.PI * r;
  const progress = timeLeft / total;
  const dashoffset = circumference * (1 - progress);
  const color = timeLeft <= 10 ? "#ef4444" : "#6366f1";
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg width={48} height={48} className="rotate-[-90deg] absolute inset-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative z-10 text-xs font-bold text-gray-700 dark:text-gray-200">
        {timeLeft}
      </span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
const TIMER_DURATION = 45;

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params?.code as string ?? "").toUpperCase();

  // Identity from localStorage
  const [identity, setIdentity] = useState<{ playerId: string; pseudo: string; playerSecret?: string } | null>(null);
  const [room, setRoom] = useState<BoussouleRoom | null>(null);
  const [players, setPlayers] = useState<BoussoulePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Game state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, ProfilId | null>>(new Map());
  const [finished, setFinished] = useState(false);
  const [visible, setVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSubmittedRef = useRef(false);

  // ── Load identity ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!code) return;
    const raw = localStorage.getItem(`boussole_player_${code}`);
    if (!raw) {
      router.replace(`/toolbox/boussole/join?code=${code}`);
      return;
    }
    try {
      const id = JSON.parse(raw) as { playerId: string; pseudo: string; playerSecret?: string };
      setIdentity(id);
    } catch {
      router.replace(`/toolbox/boussole/join?code=${code}`);
    }
  }, [code, router]);

  // ── Poll room ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!code || !identity) return;

    async function fetchRoom() {
      try {
        const res = await fetch(`/api/boussole/room/${code}`);
        if (!res.ok) return;
        // API returns room fields flat + players array: { id, code, status, ..., players: [] }
        const data = await res.json() as BoussouleRoom & { players: BoussoulePlayer[] };
        setRoom(data);
        setPlayers(data.players ?? []);
        if (data.status === "finished") {
          router.replace(`/toolbox/boussole/${code}/results`);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  }, [code, identity, router]);

  // ── Situations derived from room ─────────────────────────────────────────────
  const situations = useMemo(() => {
    if (!room?.situation_ids) return [];
    return room.situation_ids
      .map((sid) => SITUATIONS.find((s) => s.id === sid))
      .filter(Boolean) as typeof SITUATIONS;
  }, [room?.situation_ids]);

  const currentSituation = situations[currentIdx] ?? null;

  // ── Shuffle choices per situation ────────────────────────────────────────────
  const shuffledChoices = useMemo(() => {
    if (!currentSituation) return [];
    return [...currentSituation.choices].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, currentSituation?.id]);

  // ── Timer ────────────────────────────────────────────────────────────────────
  const advanceToNext = useCallback(
    async (answerValue: ProfilId | null, situationId: string) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      if (timerRef.current) clearInterval(timerRef.current);

      // Save answer locally
      setAnswers((prev) => new Map(prev).set(situationId, answerValue));

      // POST answer
      if (identity) {
        try {
          await fetch(`/api/boussole/room/${code}/answers`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Player-Secret": identity.playerSecret ?? "" },
            body: JSON.stringify({
              playerId: identity.playerId,
              situationId,
              answerValue,
            }),
          });
        } catch {
          // Silently ignore — game continues
        }
      }

      const isLast = currentIdx >= situations.length - 1;

      // Fade out → next
      setVisible(false);
      setTimeout(() => {
        if (isLast) {
          setFinished(true);
          // POST finish
          if (identity) {
            fetch(`/api/boussole/room/${code}/finish`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Player-Secret": identity.playerSecret ?? "" },
              body: JSON.stringify({ playerId: identity.playerId }),
            }).catch(() => {});
          }
        } else {
          setCurrentIdx((i) => i + 1);
          setTimeLeft(TIMER_DURATION);
          hasSubmittedRef.current = false;
        }
        setVisible(true);
      }, 200);
    },
    [code, currentIdx, identity, situations.length]
  );

  // Reset hasSubmittedRef when situation changes
  useEffect(() => {
    hasSubmittedRef.current = false;
  }, [currentIdx]);

  // Start timer
  useEffect(() => {
    if (finished || !currentSituation) return;
    setTimeLeft(TIMER_DURATION);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          void advanceToNext(null, currentSituation.id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIdx, currentSituation, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reveal results (host action) ─────────────────────────────────────────────
  async function handleReveal() {
    setRevealLoading(true);
    try {
      await fetch(`/api/boussole/compute-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": identity?.playerSecret ?? "" },
        body: JSON.stringify({ code, playerId: identity?.playerId }),
      });
      router.push(`/toolbox/boussole/${code}/results`);
    } catch {
      setRevealLoading(false);
    }
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  const isHost = players.find((p) => p.id === identity?.playerId)?.is_host ?? false;
  const finishedCount = players.filter((p) => p.finished_at !== null).length;

  // ── Render states ─────────────────────────────────────────────────────────────
  if (loading || !identity) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </main>
      </div>
    );
  }

  // ── Waiting screen ────────────────────────────────────────────────────────────
  if (finished) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-8">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 size={48} className="text-indigo-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vous avez terminé !
            </h2>
          </div>

          {/* Avatars */}
          <div className="flex flex-wrap justify-center gap-3">
            {players.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all"
                  style={{
                    backgroundColor: p.finished_at ? p.avatar_color : undefined,
                    background: p.finished_at ? undefined : undefined,
                  }}
                >
                  {p.finished_at ? (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: p.avatar_color }}
                    >
                      {p.pseudo[0]?.toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 font-bold text-lg">
                      {p.pseudo[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[64px] truncate text-center">
                  {p.pseudo}
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {finishedCount} / {players.length}
            </span>{" "}
            joueurs ont terminé
          </p>

          {isHost ? (
            <button
              onClick={handleReveal}
              disabled={revealLoading}
              className="mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {revealLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : null}
              Révéler les boussoles
            </button>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin" />
              En attente de l&apos;animateur…
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!currentSituation || situations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </main>
      </div>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────────
  const progressPct = (currentIdx / situations.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg flex flex-col gap-6">

          {/* Header bar: situation count + timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <Clock size={15} />
              <span>
                Situation{" "}
                <span className="font-bold text-gray-800 dark:text-gray-100">
                  {currentIdx + 1}
                </span>{" "}
                / {situations.length}
              </span>
            </div>
            <TimerCircle timeLeft={timeLeft} total={TIMER_DURATION} />
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Situation card */}
          <div
            className="transition-opacity duration-200"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {/* Context */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-6 mb-4">
              <p className="text-base sm:text-lg text-gray-800 dark:text-gray-100 text-center leading-relaxed max-w-lg mx-auto">
                {currentSituation.context}
              </p>
            </div>

            {/* Choices grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shuffledChoices.map((choice) => (
                <button
                  key={choice.value}
                  disabled={submitting}
                  onClick={() => {
                    setSubmitting(true);
                    setTimeout(() => setSubmitting(false), 150);
                    void advanceToNext(choice.value, currentSituation.id);
                  }}
                  className="w-full p-4 text-sm text-left rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all active:opacity-70 disabled:pointer-events-none"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
