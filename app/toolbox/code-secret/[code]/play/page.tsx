"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { TEAM_META, DIFFICULTY_META } from "@/lib/code-secret/types";
import type { RoomResponse, Team } from "@/lib/code-secret/types";

// ── Timer ring ─────────────────────────────────────────────────────────────────

function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const fraction = Math.max(0, timeLeft / total);
  const dash = fraction * circ;
  const isUrgent = timeLeft <= 60;
  const color = isUrgent ? "#ef4444" : "#f59e0b";

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const label = timeLeft >= 60
    ? `${minutes}:${String(seconds).padStart(2, "0")}`
    : `${timeLeft}s`;

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <svg width={64} height={64} className="rotate-[-90deg]">
        <circle cx={32} cy={32} r={r} fill="none" stroke="currentColor"
          className="text-gray-200 dark:text-gray-700" strokeWidth={4} />
        <circle cx={32} cy={32} r={r} fill="none" stroke={color}
          strokeWidth={4} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s linear" }}
        />
      </svg>
      <span
        className="text-base font-bold font-mono tabular-nums leading-none"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        restant
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CodeSecretPlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]     = useState("");
  const [myTeam, setMyTeam]         = useState<Team | null>(null);
  const [room, setRoom]             = useState<RoomResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [timeLeft, setTimeLeft]     = useState(0);

  const [answerInput, setAnswerInput] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitResult, setSubmitResult] = useState<"correct" | "wrong" | null>(null);
  const [wrongCount, setWrongCount]   = useState(0);

  const [revealingHint, setRevealingHint] = useState(false);
  const [hintError, setHintError]         = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/code-secret", label: "Code Secret" },
    { label: upperCode },
  ];

  // Load identity
  useEffect(() => {
    const stored = localStorage.getItem(`code_secret_player_${upperCode}`);
    if (!stored) { router.replace(`/toolbox/code-secret/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, team } = JSON.parse(stored) as { playerId: string; team?: Team | null };
      setPlayerId(pid);
      setMyTeam(team ?? null);
    } catch {
      router.replace(`/toolbox/code-secret/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Poll room
  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/code-secret/room/${upperCode}`, { cache: "no-store", headers: { "Cache-Control": "no-cache, no-store" } });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json() as RoomResponse;
    setRoom(data);
    setLoading(false);
    if (data.status === "finished") router.push(`/toolbox/code-secret/${upperCode}/results`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    if (!playerId) return;
    fetchRoom();
    const id = setInterval(fetchRoom, 2500);
    return () => clearInterval(id);
  }, [playerId, fetchRoom]);

  // Timer
  useEffect(() => {
    if (!room?.started_at || room.status !== "playing") return;
    const tick = () => {
      const elapsed = (Date.now() - new Date(room.started_at!).getTime()) / 1000;
      setTimeLeft(Math.max(0, Math.round(room.time_limit_seconds - elapsed)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [room?.started_at, room?.time_limit_seconds, room?.status]);

  // Derived
  const isHost = room?.host_player_id === playerId;
  const challenge = room?.challenge;
  const isCompetitive = room?.game_mode === "competitive";

  // My revealed hints (in coop: all; in competitive: only my team's)
  const myRevealedHints = (room?.revealedHints ?? []).filter(h =>
    isCompetitive ? h.team === myTeam : h.team === null
  ).sort((a, b) => a.hint_index - b.hint_index);

  const nextHintIndex = myRevealedHints.length;
  const canRevealHint = challenge && nextHintIndex < challenge.maxHints;

  // Wrong guesses count (my team's in competitive, all in coop)
  const myWrongSubs = (room?.recentSubmissions ?? []).filter(s =>
    !s.is_correct && (isCompetitive ? s.team === myTeam : true)
  );

  // Per-team stats for competitive leaderboard
  const teamStats = isCompetitive && room
    ? ["red", "blue", "green", "yellow"].map((t) => {
        const teamHints = room.revealedHints.filter(h => h.team === t);
        const hasWon = room.winner_team === t;
        return { team: t as Team, hints: teamHints.length, hasWon };
      }).filter(ts => room.players.some(p => p.team === ts.team))
    : [];

  async function handleRevealHint() {
    if (!playerId || !canRevealHint) return;
    setRevealingHint(true);
    setHintError(null);
    try {
      const res = await fetch(`/api/code-secret/room/${upperCode}/reveal-hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, hintIndex: nextHintIndex, team: myTeam }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setHintError(d.error ?? "Erreur");
      } else {
        await fetchRoom();
      }
    } catch {
      setHintError("Erreur réseau");
    } finally {
      setRevealingHint(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId || submitting || !answerInput.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch(`/api/code-secret/room/${upperCode}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, answer: answerInput.trim(), team: myTeam }),
      });
      const data = await res.json() as { correct: boolean; expired?: boolean };

      if (data.correct) {
        setSubmitResult("correct");
        await fetchRoom();
      } else {
        setSubmitResult("wrong");
        setWrongCount((n) => n + 1);
        setTimeout(() => setSubmitResult(null), 3000);
      }
    } catch {
      setSubmitResult("wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !room || !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  const diff = DIFFICULTY_META[room.difficulty];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8 flex flex-col gap-5">

        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{challenge.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium ${diff.color}`}>{diff.label}</span>
              {isCompetitive && myTeam && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TEAM_META[myTeam].tailwindBg} ${TEAM_META[myTeam].tailwindText}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TEAM_META[myTeam].hex }} />
                  {TEAM_META[myTeam].label}
                </span>
              )}
            </div>
          </div>
          <TimerRing timeLeft={timeLeft} total={room.time_limit_seconds} />
        </div>

        {/* Encoded message */}
        <div className="bg-gray-900 dark:bg-black rounded-2xl p-6 border border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Message chiffré</p>
          <p className="font-mono text-2xl font-bold text-amber-400 dark:text-amber-300 tracking-widest break-all leading-relaxed select-all">
            {challenge.encodedMessage}
          </p>
          <p className="mt-3 text-xs text-gray-600">{challenge.cipherDescription}</p>
        </div>

        {/* Hints section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              Indices ({myRevealedHints.length} / {challenge.maxHints})
            </span>
            {myRevealedHints.length > 0 && (
              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                -{myRevealedHints.length * challenge.hintPenalty} pts
              </span>
            )}
          </div>

          {myRevealedHints.length === 0 && (
            <div className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 italic">
              Aucun indice révélé pour l&apos;instant.
            </div>
          )}

          {myRevealedHints.length > 0 && (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {myRevealedHints.map((h, i) => (
                <li key={h.hint_index} className="px-4 py-3 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{h.text}</span>
                </li>
              ))}
            </ul>
          )}

          {canRevealHint && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              {hintError && (
                <p className="text-xs text-red-500 mb-2">{hintError}</p>
              )}
              <button
                onClick={handleRevealHint}
                disabled={revealingHint}
                className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium disabled:opacity-50 transition-colors"
              >
                {revealingHint ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                Révéler l&apos;indice {nextHintIndex + 1}
                <span className="text-xs text-gray-400 font-normal">(-{challenge.hintPenalty} pts)</span>
              </button>
            </div>
          )}

          {!canRevealHint && challenge.maxHints > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
              Tous les indices ont été révélés.
            </div>
          )}
        </div>

        {/* Submit section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Votre réponse</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={answerInput}
              onChange={(e) => { setAnswerInput(e.target.value.toUpperCase()); setSubmitResult(null); }}
              placeholder="Tapez le message déchiffré…"
              maxLength={100}
              disabled={submitting}
              className="w-full px-4 py-3 text-center font-mono text-lg tracking-wide rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase disabled:opacity-50"
            />

            {submitResult === "wrong" && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="flex-shrink-0" />
                Mauvaise réponse — essayez encore.
                {wrongCount > 1 && <span className="ml-auto text-xs text-red-400">{wrongCount} tentatives</span>}
              </div>
            )}

            {submitResult === "correct" && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2.5">
                <CheckCircle2 size={14} className="flex-shrink-0" />
                Code déchiffré ! Redirection…
              </div>
            )}

            <button
              type="submit"
              disabled={!answerInput.trim() || submitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Soumettre la réponse
            </button>
          </form>
        </div>

        {/* Competitive leaderboard */}
        {isCompetitive && teamStats.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Équipes en compétition</span>
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {teamStats.map((ts) => {
                const meta = TEAM_META[ts.team];
                const isMe = ts.team === myTeam;
                return (
                  <li key={ts.team} className={`px-4 py-3 flex items-center gap-3 ${isMe ? "bg-amber-50/40 dark:bg-amber-950/20" : ""}`}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: meta.hex }} />
                    <span className={`flex-1 text-sm font-medium ${meta.tailwindText}`}>
                      {meta.label} {isMe && <span className="text-gray-400 text-xs font-normal">(vous)</span>}
                    </span>
                    <span className="text-xs text-gray-500">{ts.hints} indice{ts.hints !== 1 ? "s" : ""}</span>
                    {ts.hasWon && <CheckCircle2 size={14} className="text-emerald-500" />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Score preview */}
        {room.started_at && (
          <div className="text-center">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Score estimé si vous trouvez maintenant :{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {Math.max(0, Math.round(
                  1000
                  - myRevealedHints.length * challenge.hintPenalty
                  - myWrongSubs.length * challenge.wrongGuessPenalty
                  + timeLeft
                ))} pts
              </span>
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
