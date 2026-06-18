"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Timer, MessageSquare, Vote } from "lucide-react";
import { Header } from "@/components/Header";
import type { RoomStateResponse, UndercoverPlayer, UndercoverDescription, UndercoverVote } from "@/lib/undercover/types";
import { TURN_SECONDS, DISCUSSION_SECONDS } from "@/lib/undercover/types";

// ── Timer ring ─────────────────────────────────────────────────────────────────

function TimerRing({ timeLeft, total, warning = 10 }: { timeLeft: number; total: number; warning?: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, timeLeft / total) * circ;

  return (
    <svg width={52} height={52} className="rotate-[-90deg]">
      <circle cx={26} cy={26} r={r} fill="none" stroke="currentColor"
        className="text-gray-200 dark:text-gray-700" strokeWidth={4} />
      <circle cx={26} cy={26} r={r} fill="none"
        stroke={timeLeft <= warning ? "#ef4444" : "#6366f1"}
        strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.4s linear" }}
      />
      <text x={26} y={26} dominantBaseline="middle" textAnchor="middle"
        style={{
          transform: "rotate(90deg) translate(0, -52px)", transformOrigin: "26px 26px",
          fill: timeLeft <= warning ? "#ef4444" : "currentColor",
          fontSize: 13, fontWeight: 600, fontFamily: "monospace",
        }}
      >
        {timeLeft < 60 ? timeLeft : `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
      </text>
    </svg>
  );
}

// ── Avatar chip ────────────────────────────────────────────────────────────────

function Avatar({ player, size = "sm" }: { player: UndercoverPlayer; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-8 h-8 text-sm" : "w-6 h-6 text-xs";
  return (
    <span
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: player.avatar_color }}
    >
      {player.pseudo[0].toUpperCase()}
    </span>
  );
}

// ── Word display (neutre — ne révèle pas le rôle) ─────────────────────────────

function MyWordDisplay({ word }: { word: string | null }) {
  if (word) {
    return (
      <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
        {word}
      </span>
    );
  }
  return (
    <span className="text-sm italic text-gray-400 dark:text-gray-500">
      Vous n&apos;avez pas de mot secret
    </span>
  );
}

// ── Phase: Description ─────────────────────────────────────────────────────────

function DescriptionPhase({
  room, players, descriptions, playerId, playerSecret, upperCode, onRefresh,
}: {
  room: RoomStateResponse;
  players: UndercoverPlayer[];
  descriptions: UndercoverDescription[];
  playerId: string;
  playerSecret: string;
  upperCode: string;
  onRefresh: () => void;
}) {
  const [wordInput, setWordInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const skipCalledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMyTurn = room.current_turn_player_id === playerId;
  const me = players.find((p) => p.id === playerId);
  const currentPlayer = players.find((p) => p.id === room.current_turn_player_id);

  const activePlayers = players.filter((p) => !p.is_eliminated);
  const roundDescs = descriptions.filter((d) => d.round_number === room.round_number);
  const describedIds = new Set(roundDescs.map((d) => d.player_id));

  // Turn timer
  useEffect(() => {
    if (!room.turn_started_at) return;
    skipCalledRef.current = false;

    const tick = () => {
      const elapsed = (Date.now() - new Date(room.turn_started_at!).getTime()) / 1000;
      const left = Math.max(0, Math.round(TURN_SECONDS - elapsed));
      setTimeLeft(left);

      if (left <= 0 && !skipCalledRef.current) {
        skipCalledRef.current = true;
        fetch(`/api/undercover/room/${upperCode}/skip-turn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedPlayerId: room.current_turn_player_id }),
        }).then(() => onRefresh());
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.turn_started_at, room.current_turn_player_id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = wordInput.trim();
    if (!trimmed || submitting) return;

    if (/\s/.test(trimmed)) { setInputError("Un seul mot (sans espace)"); return; }
    if (trimmed.length < 2) { setInputError("Minimum 2 caractères"); return; }
    if (trimmed.length > 40) { setInputError("Maximum 40 caractères"); return; }

    setInputError(null);
    setSubmitting(true);
    try {
      await fetch(`/api/undercover/room/${upperCode}/describe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId, word: trimmed }),
      });
      setWordInput("");
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* My word card */}
      {me && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Votre mot secret</p>
            <MyWordDisplay word={room.my_word} />
          </div>
          {isMyTurn && <TimerRing timeLeft={timeLeft} total={TURN_SECONDS} />}
        </div>
      )}

      {/* Round descriptions so far */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
          Tour {room.round_number} — Indices donnés
        </p>
        <div className="space-y-2">
          {activePlayers.map((p) => {
            const desc = roundDescs.find((d) => d.player_id === p.id);
            const hasTurn = describedIds.has(p.id);
            const isCurrent = room.current_turn_player_id === p.id;

            return (
              <div key={p.id} className={`flex items-center gap-2.5 ${!hasTurn && !isCurrent ? "opacity-40" : ""}`}>
                <Avatar player={p} />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {p.pseudo}
                  {p.id === playerId && <span className="text-xs text-gray-400 ml-1">(vous)</span>}
                </span>
                {isCurrent && !hasTurn && (
                  <span className="text-xs text-indigo-500 flex items-center gap-1">
                    <Timer size={11} /> {timeLeft}s
                  </span>
                )}
                {hasTurn && desc && (
                  <span className={`text-sm font-semibold ${desc.word ? "text-gray-800 dark:text-gray-200" : "text-gray-400 italic"}`}>
                    {desc.word ?? "— passé"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Input card (my turn) */}
      {isMyTurn && !describedIds.has(playerId) && (
        <div className="bg-white dark:bg-gray-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1 text-center">
            C&apos;est votre tour !
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-4">
            Donnez un mot qui évoque votre mot secret
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={wordInput}
              onChange={(e) => { setWordInput(e.target.value.replace(/\s/g, "")); setInputError(null); }}
              placeholder="Un mot…"
              maxLength={40}
              disabled={submitting}
              className="w-full px-4 py-3 text-center text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            {inputError && <p className="text-xs text-red-500 text-center">{inputError}</p>}
            <button
              type="submit"
              disabled={!wordInput.trim() || submitting}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Valider
            </button>
          </form>
        </div>
      )}

      {/* Waiting for someone else */}
      {!isMyTurn && currentPlayer && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Avatar player={currentPlayer} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentPlayer.pseudo} est en train de réfléchir…
            </span>
          </div>
          <div className="flex justify-center mt-3">
            <TimerRing timeLeft={timeLeft} total={TURN_SECONDS} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Phase: Discussion ──────────────────────────────────────────────────────────

function DiscussionPhase({
  room, players, descriptions, playerId, playerSecret, upperCode, onRefresh,
}: {
  room: RoomStateResponse;
  players: UndercoverPlayer[];
  descriptions: UndercoverDescription[];
  playerId: string;
  playerSecret: string;
  upperCode: string;
  onRefresh: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(DISCUSSION_SECONDS);
  const advancedRef = useRef(false);
  const isHost = room.host_player_id === playerId;

  useEffect(() => {
    if (!room.discussion_started_at) return;
    advancedRef.current = false;

    const tick = () => {
      const elapsed = (Date.now() - new Date(room.discussion_started_at!).getTime()) / 1000;
      const left = Math.max(0, Math.round(DISCUSSION_SECONDS - elapsed));
      setTimeLeft(left);

      if (left <= 0 && !advancedRef.current) {
        advancedRef.current = true;
        fetch(`/api/undercover/room/${upperCode}/advance-discussion`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        }).then(() => onRefresh());
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.discussion_started_at]);

  async function handleAdvance() {
    await fetch(`/api/undercover/room/${upperCode}/advance-discussion`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ playerId }),
    });
    onRefresh();
  }

  const activePlayers = players.filter((p) => !p.is_eliminated);
  const roundDescs = descriptions.filter((d) => d.round_number === room.round_number);

  return (
    <div className="space-y-4">
      {/* Timer card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4">
        <TimerRing timeLeft={timeLeft} total={DISCUSSION_SECONDS} warning={30} />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <MessageSquare size={15} className="text-indigo-500" />
            Phase de discussion
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Débattez à voix haute. Qui cache quelque chose ?
          </p>
        </div>
      </div>

      {/* My word reminder */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 flex items-center gap-2">
        <EyeOff size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">Votre mot secret :</span>
        <MyWordDisplay word={room.my_word} />
      </div>

      {/* All descriptions */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
          Récap — indices du tour {room.round_number}
        </p>
        <div className="space-y-2">
          {activePlayers.map((p) => {
            const desc = roundDescs.find((d) => d.player_id === p.id);
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <Avatar player={p} />
                <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">{p.pseudo}</span>
                <span className={`text-sm font-semibold ${desc?.word ? "text-gray-800 dark:text-gray-200" : "text-gray-300 italic"}`}>
                  {desc?.word ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host advance button */}
      {isHost && (
        <button
          onClick={handleAdvance}
          className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Vote size={15} />
          Lancer le vote maintenant
        </button>
      )}
      {!isHost && (
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          L&apos;animateur peut lancer le vote avant la fin du timer.
        </p>
      )}
    </div>
  );
}

// ── Phase: Voting ──────────────────────────────────────────────────────────────

function VotingPhase({
  room, players, votes, playerId, playerSecret, upperCode, onRefresh,
}: {
  room: RoomStateResponse;
  players: UndercoverPlayer[];
  votes: UndercoverVote[];
  playerId: string;
  playerSecret: string;
  upperCode: string;
  onRefresh: () => void;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const isHost = room.host_player_id === playerId;
  const me = players.find((p) => p.id === playerId);
  const isEliminated = me?.is_eliminated ?? false;

  const activePlayers = players.filter((p) => !p.is_eliminated);
  const roundVotes = votes.filter((v) => v.round_number === room.round_number);
  const myVote = roundVotes.find((v) => v.voter_player_id === playerId);

  const voteTally: Record<string, number> = {};
  for (const v of roundVotes) {
    voteTally[v.voted_player_id] = (voteTally[v.voted_player_id] ?? 0) + 1;
  }

  async function handleVote(targetId: string) {
    if (submitting || isEliminated) return;
    setSubmitting(targetId);
    try {
      await fetch(`/api/undercover/room/${upperCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId, votedPlayerId: targetId }),
      });
      onRefresh();
    } finally {
      setSubmitting(null);
    }
  }

  async function handleFinalize() {
    await fetch(`/api/undercover/room/${upperCode}/finalize-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ playerId }),
    });
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <p className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2 mb-1">
          <Vote size={15} className="text-indigo-500" />
          Phase de vote
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Votez pour éliminer le joueur que vous soupçonnez.
          {myVote && <span className="text-indigo-500 ml-1">Votre vote est enregistré — vous pouvez changer.</span>}
        </p>
      </div>

      {/* My role reminder */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 flex items-center gap-2">
        <EyeOff size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">Votre mot secret :</span>
        <MyWordDisplay word={room.my_word} />
      </div>

      {isEliminated ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center text-sm text-gray-500">
          Vous êtes éliminé et ne pouvez plus voter.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Joueurs actifs</p>
          </div>
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {activePlayers
              .filter((p) => p.id !== playerId)
              .map((p) => {
                const voteCount = voteTally[p.id] ?? 0;
                const isMyTarget = myVote?.voted_player_id === p.id;
                return (
                  <li key={p.id}>
                    <button
                      className={`w-full px-4 py-3.5 flex items-center gap-3 transition-colors ${
                        isMyTarget
                          ? "bg-indigo-50 dark:bg-indigo-950/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                      onClick={() => handleVote(p.id)}
                      disabled={!!submitting}
                    >
                      {submitting === p.id ? (
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                      ) : (
                        <Avatar player={p} />
                      )}
                      <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 text-left">
                        {p.pseudo}
                      </span>
                      {voteCount > 0 && (
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                          {voteCount} vote{voteCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {isMyTarget && (
                        <span className="text-xs text-indigo-500">✓ Votre vote</span>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {/* Vote progress */}
      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        {roundVotes.length} / {activePlayers.length} votes enregistrés
      </p>

      {/* Host finalize */}
      {isHost && (
        <button
          onClick={handleFinalize}
          className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-xl hover:border-red-300 hover:text-red-600 transition-colors"
        >
          Clore le vote et éliminer
        </button>
      )}
    </div>
  );
}

// ── Phase: Mr. White Guess ─────────────────────────────────────────────────────

function MrWhiteGuessPhase({
  room, players, playerId, playerSecret, upperCode, onRefresh,
}: {
  room: RoomStateResponse;
  players: UndercoverPlayer[];
  playerId: string;
  playerSecret: string;
  upperCode: string;
  onRefresh: () => void;
}) {
  const [guess, setGuess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const eliminated = players.find((p) => p.id === room.eliminated_player_id);
  const isMrWhite = room.eliminated_player_id === playerId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = guess.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/undercover/room/${upperCode}/mr-white-guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId, guess: trimmed }),
      });
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-center">
        <p className="text-2xl mb-2">🕵️</p>
        <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
          {eliminated?.pseudo ?? "Mr. White"} a été éliminé !
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          C&apos;était Mr. White. Il a une dernière chance de gagner en devinant le mot des Civils.
        </p>
      </div>

      {isMrWhite ? (
        <div className="bg-white dark:bg-gray-900 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-1">
            Devinez le mot secret des Civils
          </p>
          <p className="text-xs text-gray-400 text-center mb-4">
            Si vous avez bien observé les indices, vous pouvez gagner maintenant !
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              autoFocus
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Votre réponse…"
              maxLength={40}
              disabled={submitting}
              className="w-full px-4 py-3 text-center text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!guess.trim() || submitting}
              className="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Soumettre ma réponse
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
          <Loader2 size={20} className="animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {eliminated?.pseudo ?? "Mr. White"} est en train de deviner…
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function UndercoverPlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom] = useState<RoomStateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/undercover", label: "Undercover" },
    { label: upperCode },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`undercover_player_${upperCode}`);
    if (!stored) {
      router.replace(`/toolbox/undercover/join?code=${upperCode}`);
      return;
    }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/toolbox/undercover/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  const fetchRoom = useCallback(async () => {
    if (!playerId) return;
    const res = await fetch(`/api/undercover/room/${upperCode}?playerId=${playerId}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store", "X-Player-Secret": playerSecret },
    });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json() as RoomStateResponse;
    setRoom(data);
    setLoading(false);

    if (data.status === "lobby") router.push(`/toolbox/undercover/${upperCode}/lobby`);
    if (data.status === "finished") router.push(`/toolbox/undercover/${upperCode}/results`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode, playerId, playerSecret]);

  useEffect(() => {
    if (!playerId) return;
    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  }, [playerId, fetchRoom]);

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
  const players = room.players ?? [];
  const descriptions = room.descriptions ?? [];
  const votes = room.votes ?? [];

  const phaseLabels: Record<string, string> = {
    description: "Phase de description",
    discussion: "Phase de discussion",
    voting: "Vote",
    mr_white_guess: "Mr. White devine",
  };

  const phaseIcons: Record<string, React.ReactNode> = {
    description: <Eye size={14} />,
    discussion: <MessageSquare size={14} />,
    voting: <Vote size={14} />,
    mr_white_guess: <EyeOff size={14} />,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-sm mx-auto w-full px-4 py-6">

        {/* Phase indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {phaseIcons[room.status]}
            {phaseLabels[room.status] ?? room.status}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            Tour {room.round_number}
          </span>
        </div>

        {/* Mr. White guess result banner */}
        {room.mr_white_last_guess !== null && room.mr_white_last_guess_correct !== null && room.status !== "mr_white_guess" && (
          <div className={`mb-4 px-4 py-3 rounded-xl border text-sm text-center ${
            room.mr_white_last_guess_correct
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}>
            Mr. White a proposé &ldquo;<strong>{room.mr_white_last_guess}</strong>&rdquo; —{" "}
            {room.mr_white_last_guess_correct ? "✓ Bonne réponse ! Il remporte la partie." : "✗ Mauvaise réponse."}
          </div>
        )}

        {room.status === "description" && (
          <DescriptionPhase
            room={room} players={players} descriptions={descriptions}
            playerId={playerId} playerSecret={playerSecret}
            upperCode={upperCode} onRefresh={fetchRoom}
          />
        )}

        {room.status === "discussion" && (
          <DiscussionPhase
            room={room} players={players} descriptions={descriptions}
            playerId={playerId} playerSecret={playerSecret}
            upperCode={upperCode} onRefresh={fetchRoom}
          />
        )}

        {room.status === "voting" && (
          <VotingPhase
            room={room} players={players} votes={votes}
            playerId={playerId} playerSecret={playerSecret}
            upperCode={upperCode} onRefresh={fetchRoom}
          />
        )}

        {room.status === "mr_white_guess" && (
          <MrWhiteGuessPhase
            room={room} players={players}
            playerId={playerId} playerSecret={playerSecret}
            upperCode={upperCode} onRefresh={fetchRoom}
          />
        )}
      </main>
    </div>
  );
}
