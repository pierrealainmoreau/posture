"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import type { ChaineRoom, ChainePlayer, ChaineWord } from "@/lib/chaine/types";

const TURN_SECONDS = 30;

// ── Timer ring ────────────────────────────────────────────────────────────────

function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fraction = Math.max(0, timeLeft / total);
  const dash = fraction * circ;

  return (
    <svg width={52} height={52} className="rotate-[-90deg]">
      <circle cx={26} cy={26} r={r} fill="none" stroke="currentColor"
        className="text-gray-200 dark:text-gray-700" strokeWidth={4} />
      <circle cx={26} cy={26} r={r} fill="none"
        stroke={timeLeft <= 10 ? "#ef4444" : "#8b5cf6"}
        strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.4s linear" }}
      />
      <text
        x={26} y={26}
        dominantBaseline="middle" textAnchor="middle"
        className="rotate-90"
        style={{ transform: "rotate(90deg) translate(0, -52px)", transformOrigin: "26px 26px",
          fill: timeLeft <= 10 ? "#ef4444" : "currentColor",
          fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}
      >
        {timeLeft}
      </text>
    </svg>
  );
}

// ── Chain display ─────────────────────────────────────────────────────────────

function ChainBubbles({
  words,
  players,
  activeIndex,
}: {
  words: ChaineWord[];
  players: ChainePlayer[];
  activeIndex: number;
}) {
  const sorted = [...words].sort((a, b) => a.turn_index - b.turn_index);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sorted.map((w, i) => {
        const player = players.find((p) => p.id === w.player_id);
        const isLast = i === sorted.length - 1 && w.turn_index < activeIndex;
        const isSkipped = w.word === null;

        return (
          <span key={w.id} className="flex items-center gap-1">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                isSkipped
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                  : isLast
                  ? "text-sm px-3 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200 ring-1 ring-violet-300 dark:ring-violet-700"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}
              style={!isSkipped && player ? {
                backgroundColor: `${player.avatar_color}20`,
                color: player.avatar_color,
                ...(isLast ? { backgroundColor: `${player.avatar_color}30`, ringColor: player.avatar_color } : {}),
              } : undefined}
            >
              {isSkipped ? "( — )" : w.word}
            </span>
            {i < sorted.length - 1 && (
              <span className="text-gray-300 dark:text-gray-600 text-xs">→</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChainePlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState<string>("");
  const [playerSecret, setPlayerSecret] = useState<string>("");
  const [room, setRoom] = useState<ChaineRoom | null>(null);
  const [players, setPlayers] = useState<ChainePlayer[]>([]);
  const [words, setWords] = useState<ChaineWord[]>([]);
  const [loading, setLoading] = useState(true);

  const [wordInput, setWordInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [skipNotif, setSkipNotif] = useState(false);

  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const skipCalledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/mini-jeux", label: "Mini-jeux" },
    { href: "/mini-jeux/chaine", label: "Chaîne" },
    { label: upperCode },
  ];

  // ── Load identity ───────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem(`chaine_player_${upperCode}`);
    if (!stored) {
      router.replace(`/mini-jeux/chaine/join?code=${upperCode}`);
      return;
    }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/mini-jeux/chaine/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // ── Poll room ───────────────────────────────────────────────────────────────

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/chaine/room/${upperCode}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store" },
    });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json() as ChaineRoom & { players: ChainePlayer[]; words: ChaineWord[] };
    setRoom(data);
    setPlayers(data.players ?? []);
    setWords(data.words ?? []);
    setLoading(false);

    if (data.status === "voting" || data.status === "finished") {
      router.push(`/mini-jeux/chaine/${upperCode}/results`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    if (!playerId) return;
    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  }, [playerId, fetchRoom]);

  // ── Timer ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!room?.turn_started_at || room.status !== "playing") {
      setTimeLeft(TURN_SECONDS);
      return;
    }

    skipCalledRef.current = false;

    const tick = () => {
      const elapsed = (Date.now() - new Date(room.turn_started_at!).getTime()) / 1000;
      const left = Math.max(0, Math.round(TURN_SECONDS - elapsed));
      setTimeLeft(left);

      // Auto-skip if timer runs out
      if (left <= 0 && !skipCalledRef.current) {
        skipCalledRef.current = true;
        fetch(`/api/chaine/room/${upperCode}/skip-turn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ turnIndex: room.current_turn_index }),
        }).then(() => fetchRoom());
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.turn_started_at, room?.current_turn_index]);

  // Show skip notification to the player whose turn(s) just expired
  // indexOf only finds first occurrence — check ALL positions of this player in order
  useEffect(() => {
    if (!room || !playerId) return;
    const order = room.player_order ?? [];
    const myTurnIndices = order
      .map((pid, i) => (pid === playerId ? i + 1 : null))
      .filter((idx): idx is number => idx !== null);
    const justPassed = myTurnIndices.some((idx) =>
      words.some((w) => w.turn_index === idx && w.player_id === null && w.word === null)
    );
    if (justPassed) {
      setSkipNotif(true);
      const t = setTimeout(() => setSkipNotif(false), 4000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  // ── Submit word ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!room || submitting) return;

    const trimmed = wordInput.trim();
    if (!trimmed) return;

    if (/\s/.test(trimmed)) {
      setInputError("Un seul mot à la fois (pas d'espace)");
      return;
    }
    if (trimmed.length < 2) {
      setInputError("Minimum 2 caractères");
      return;
    }
    if (trimmed.length > 30) {
      setInputError("Maximum 30 caractères");
      return;
    }

    setInputError(null);
    setSubmitting(true);

    try {
      await fetch(`/api/chaine/room/${upperCode}/submit-word`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId, word: trimmed, turnIndex: room.current_turn_index }),
      });
      setWordInput("");
      await fetchRoom();
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  const isHost = room.host_player_id === playerId;
  const playerOrder = room.player_order ?? [];
  const currentTurnIndex = room.current_turn_index;
  const activePlayerId = playerOrder[currentTurnIndex - 1] ?? null;
  const isMyTurn = activePlayerId === playerId;
  const activePlayer = players.find((p) => p.id === activePlayerId);

  // "Mot X / Y" — how many times does each player appear in order?
  const totalMyTurns = playerOrder.filter((pid) => pid === playerId).length;
  // Which occurrence are we on right now (1-based)
  const myCurrentTurnNumber = playerOrder
    .slice(0, currentTurnIndex)
    .filter((pid) => pid === playerId).length;

  // Last submitted word (the one before current turn)
  const prevWord = [...words]
    .filter((w) => w.turn_index < currentTurnIndex)
    .sort((a, b) => b.turn_index - a.turn_index)[0];

  const prevPlayer = players.find((p) => p.id === prevWord?.player_id);

  // Players who have yet to play (turns after current)
  const remainingPlayers = playerOrder
    .slice(currentTurnIndex) // currentTurnIndex is 1-based, slice is 0-based → correct offset
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean) as ChainePlayer[];

  // ── View : late joiner ──────────────────────────────────────────────────────

  const isLateJoiner = room.status === "playing" && !playerOrder.includes(playerId);

  if (isLateJoiner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6 text-sm text-amber-800 dark:text-amber-200">
            Tu as rejoint en cours de partie — tu verras le résultat à la fin.
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Chaîne en cours
            </p>
            <ChainBubbles words={words} players={players} activeIndex={currentTurnIndex} />
          </div>
        </main>
      </div>
    );
  }

  // ── View : active player ────────────────────────────────────────────────────

  if (isMyTurn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10 flex flex-col gap-6">

          {/* Header bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Chaîne en cours
            </h2>
            <div className="text-gray-500 dark:text-gray-400">
              <TimerRing timeLeft={timeLeft} total={TURN_SECONDS} />
            </div>
          </div>

          {/* Chain so far */}
          {words.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <ChainBubbles words={words} players={players} activeIndex={currentTurnIndex} />
            </div>
          )}

          {/* Active card */}
          <div className="bg-white dark:bg-gray-900 border-2 border-violet-200 dark:border-violet-800 rounded-2xl p-6 text-center shadow-sm">
            {prevWord && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: prevPlayer?.avatar_color ?? "#8b5cf6" }}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {prevPlayer?.pseudo ?? "Quelqu'un"} a dit :
                </span>
              </div>
            )}

            <p className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              {prevWord?.word ?? room.starter_word}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              C&apos;est ton tour. Quel mot t&apos;inspire ?
            </p>
            {totalMyTurns > 1 && (
              <p className="text-xs font-semibold text-violet-500 dark:text-violet-400 mb-4">
                Mot {myCurrentTurnNumber} / {totalMyTurns}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={wordInput}
                onChange={(e) => {
                  setWordInput(e.target.value.replace(/\s/g, ""));
                  setInputError(null);
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(e); }}
                placeholder="Un mot…"
                maxLength={30}
                disabled={submitting}
                className="w-full px-4 py-3 text-center text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
              />
              {inputError && (
                <p className="text-xs text-red-500 dark:text-red-400">{inputError}</p>
              )}
              <button
                type="submit"
                disabled={!wordInput.trim() || submitting}
                className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                Valider
              </button>
            </form>
          </div>

          {/* Player order sidebar */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Ordre des joueurs
            </p>
            <ul className="space-y-1.5">
              {playerOrder.map((pid, i) => {
                const p = players.find((pl) => pl.id === pid);
                const turnIdx = i + 1;
                const isDone = turnIdx < currentTurnIndex;
                const isCurrent = turnIdx === currentTurnIndex;
                // Label "·1" / "·2" only when a player appears more than once
                const occurrencesTotal = playerOrder.filter((id) => id === pid).length;
                const occurrenceIndex = playerOrder.slice(0, i + 1).filter((id) => id === pid).length;
                const showOrdinal = occurrencesTotal > 1;
                return (
                  <li key={`${pid}-${i}`} className={`flex items-center gap-2 text-sm ${
                    isCurrent ? "font-semibold" : isDone ? "opacity-50" : ""
                  }`}>
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p?.avatar_color ?? "#8b5cf6" }}
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      {p?.pseudo ?? "?"}
                      {pid === playerId && <span className="text-gray-400 ml-1 font-normal">(vous)</span>}
                      {showOrdinal && (
                        <span className="ml-1 text-[10px] text-gray-400 dark:text-gray-500 font-normal">
                          ·{occurrenceIndex}
                        </span>
                      )}
                    </span>
                    {isCurrent && <span className="ml-auto text-violet-500 text-xs">← maintenant</span>}
                    {isDone && <span className="ml-auto text-gray-300 dark:text-gray-600 text-xs">✓</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </main>
      </div>
    );
  }

  // ── View : waiting player ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10 flex flex-col gap-6">

        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Chaîne en cours
        </h2>

        {/* Chain so far */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <ChainBubbles words={words} players={players} activeIndex={currentTurnIndex} />
        </div>

        {/* Current player writing indicator */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {activePlayer && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activePlayer.avatar_color }}
              />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {activePlayer?.pseudo ?? "Quelqu'un"} est en train d&apos;écrire
            </span>
          </div>
          <div className="flex justify-center gap-1 mt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-500"
                style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
              40% { transform: translateY(-6px); opacity: 1; }
            }
          `}</style>

          {/* Timer */}
          <div className="mt-4 flex justify-center">
            <TimerRing timeLeft={timeLeft} total={TURN_SECONDS} />
          </div>
        </div>

        {/* Skip notification */}
        {skipNotif && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-200 text-center">
            Temps écoulé — tu as passé ton tour.
          </div>
        )}

        {/* Remaining players */}
        {remainingPlayers.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Joueurs restants
            </p>
            <div className="flex flex-wrap gap-2">
              {remainingPlayers.map((p) => (
                <span key={p.id} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.avatar_color }} />
                  {p.pseudo}
                  {p.id === playerId && <span className="text-gray-400">(toi)</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
