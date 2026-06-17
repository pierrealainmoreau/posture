"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Zap, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "@/components/Header";
import { pickRandomStarterWord } from "@/lib/chaine/starter-words";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";
import { AVATAR_COLORS } from "@/lib/chaine/types";
import type { ChaineRoom, ChainePlayer, ChaineWord, ChaineVote } from "@/lib/chaine/types";

const REVEAL_DELAY_MS = 400;
const VOTE_SECONDS = 20;

// ── Confetti burst (pure CSS) ─────────────────────────────────────────────────

function ConfettiBurst({ color }: { color: string }) {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      {["✦", "✧", "✦"].map((s, i) => (
        <span
          key={i}
          style={{ color, animation: `confetti 0.6s ${i * 0.1}s both`, display: "inline-block" }}
        >
          {s}
        </span>
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-12px) scale(1.4); opacity: 0; }
        }
      `}</style>
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChaineResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState<string>("");
  const [playerSecret, setPlayerSecret] = useState<string>("");
  const [playerInfo, setPlayerInfo] = useState<{ pseudo: string; avatarColor: string } | null>(null);
  const [room, setRoom] = useState<ChaineRoom | null>(null);
  const [players, setPlayers] = useState<ChainePlayer[]>([]);
  const [words, setWords] = useState<ChaineWord[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  const [votes, setVotes] = useState<ChaineVote[]>([]);
  const [loading, setLoading] = useState(true);

  // Reveal animation
  const [revealedCount, setRevealedCount] = useState(0);
  const [revealDone, setRevealDone] = useState(false);

  // Voting
  const [votingPhase, setVotingPhase] = useState(false);
  const [votesRevealed, setVotesRevealed] = useState(false);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [voteTimer, setVoteTimer] = useState(VOTE_SECONDS);
  const voteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voteRevealedRef = useRef(false);

  // Replay
  const [replaying, setReplaying] = useState(false);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/mini-jeux", label: "Mini-jeux" },
    { href: "/mini-jeux/chaine", label: "Chaîne" },
    { label: "Résultats" },
  ];

  // ── Load identity ───────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem(`chaine_player_${upperCode}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { playerId: string; playerSecret?: string; pseudo: string; avatarColor: string };
        setPlayerId(parsed.playerId);
        setPlayerSecret(parsed.playerSecret ?? "");
        setPlayerInfo({ pseudo: parsed.pseudo, avatarColor: parsed.avatarColor });
      } catch { /* ignore */ }
    }
  }, [upperCode]);

  // ── Fetch room + votes ──────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    const [roomRes, votesRes] = await Promise.all([
      fetch(`/api/chaine/room/${upperCode}`, { cache: "no-store" }),
      fetch(`/api/chaine/room/${upperCode}/votes`, { cache: "no-store" }),
    ]);
    if (!roomRes.ok) { setLoading(false); return; }

    const roomData = await roomRes.json() as ChaineRoom & { players: ChainePlayer[]; words: ChaineWord[] };
    const votesData = votesRes.ok ? (await votesRes.json() as ChaineVote[]) : [];

    setRoom(roomData);
    setPlayers(roomData.players ?? []);
    setWords((roomData.words ?? []).sort((a, b) => a.turn_index - b.turn_index));
    setVotes(votesData);
    setLoading(false);
  }, [upperCode]);

  useEffect(() => {
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll votes while in voting phase
  useEffect(() => {
    if (!votingPhase || votesRevealed) return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/chaine/room/${upperCode}/votes`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json() as ChaineVote[];
        setVotes(data);
        // Check if all voted
        if (room && room.player_order.every((pid) => data.some((v) => v.voter_player_id === pid))) {
          revealVotes();
        }
      }
    }, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votingPhase, votesRevealed, room]);

  // ── Reveal animation ────────────────────────────────────────────────────────

  useEffect(() => {
    if (loading || words.length === 0) return;
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      setRevealedCount(count);
      if (count >= words.length) {
        clearInterval(id);
        setRevealDone(true);
        // Start voting phase after reveal
        setTimeout(() => setVotingPhase(true), 600);
      }
    }, REVEAL_DELAY_MS);
    return () => clearInterval(id);
  }, [loading, words.length]);

  // ── Vote timer ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!votingPhase || votesRevealed) return;

    let secs = VOTE_SECONDS;
    setVoteTimer(secs);

    voteTimerRef.current = setInterval(() => {
      secs -= 1;
      setVoteTimer(secs);
      if (secs <= 0) {
        if (voteTimerRef.current) clearInterval(voteTimerRef.current);
        revealVotes();
      }
    }, 1000);

    return () => {
      if (voteTimerRef.current) clearInterval(voteTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votingPhase]);

  function revealVotes() {
    if (voteRevealedRef.current) return;
    voteRevealedRef.current = true;
    if (voteTimerRef.current) clearInterval(voteTimerRef.current);
    setVotesRevealed(true);
    // Mark room as finished
    fetch(`/api/chaine/room/${upperCode}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: ChaineRoom) => {
        if (d.status === "voting") {
          // trigger finish via a dummy vote reveal — no server action needed,
          // status becomes 'finished' when all votes counted on submit-vote
        }
      })
      .catch(() => undefined);
  }

  // ── Submit vote ─────────────────────────────────────────────────────────────

  async function submitVote(turnIndex: number) {
    if (myVote !== null || !playerId) return;
    setMyVote(turnIndex);
    await fetch(`/api/chaine/room/${upperCode}/submit-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ playerId, votedTurnIndex: turnIndex }),
    });
    await fetchAll();
  }

  // ── Replay ──────────────────────────────────────────────────────────────────

  async function handleReplay() {
    if (!playerInfo || replaying) return;
    setReplaying(true);
    try {
      const newWord = pickRandomStarterWord();
      const res = await fetch("/api/chaine/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: playerInfo.pseudo,
          avatarColor: playerInfo.avatarColor,
          starterWord: newWord,
        }),
      });
      const data = await res.json() as { code?: string; playerId?: string };
      if (data.code && data.playerId) {
        localStorage.setItem(
          `chaine_player_${data.code}`,
          JSON.stringify({ playerId: data.playerId, pseudo: playerInfo.pseudo, avatarColor: playerInfo.avatarColor })
        );
        router.push(`/mini-jeux/chaine/${data.code}/lobby`);
      }
    } finally {
      setReplaying(false);
    }
  }

  // ── Vote tally ──────────────────────────────────────────────────────────────

  function getVoteCountForTurn(turnIndex: number) {
    return votes.filter((v) => v.voted_turn_index === turnIndex).length;
  }

  function getMaxVotes() {
    if (votes.length === 0) return 0;
    return Math.max(...words.map((w) => getVoteCountForTurn(w.turn_index)));
  }

  const isHost = room?.host_player_id === playerId;

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const maxVotes = getMaxVotes();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10">

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          La chaîne complète
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Partie à partir de <span className="font-medium">{room?.starter_word}</span>
        </p>

        {/* Chain reveal */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {words.map((w, i) => {
              if (i >= revealedCount) return null;
              const player = players.find((p) => p.id === w.player_id);
              const isSkipped = w.word === null;
              const voteCount = votesRevealed ? getVoteCountForTurn(w.turn_index) : 0;
              const isWinner = votesRevealed && voteCount > 0 && voteCount === maxVotes;
              const isVotable = votingPhase && !votesRevealed && w.turn_index !== 0 && !isSkipped;

              return (
                <span key={w.id} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => isVotable ? submitVote(w.turn_index) : undefined}
                    disabled={!isVotable || myVote !== null}
                    className={`group relative flex flex-col items-center gap-0.5 transition-all ${
                      isVotable && myVote === null ? "cursor-pointer" : "cursor-default"
                    }`}
                    title={isVotable && myVote === null ? "Voter pour ce maillon" : undefined}
                  >
                    {/* Avatar dot */}
                    {player && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: player.avatar_color }}
                      />
                    )}

                    {/* Word chip */}
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                        isSkipped
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                          : !player
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white"
                          : isWinner
                          ? "ring-2 ring-violet-400 dark:ring-violet-500 scale-105"
                          : myVote === w.turn_index
                          ? "ring-2 ring-violet-300 dark:ring-violet-600"
                          : isVotable && myVote === null
                          ? "hover:ring-2 hover:ring-violet-200 dark:hover:ring-violet-800 hover:scale-105"
                          : ""
                      }`}
                      style={!isSkipped && player ? {
                        backgroundColor: `${player.avatar_color}20`,
                        color: player.avatar_color,
                      } : undefined}
                    >
                      {isSkipped ? "( — )" : w.word}
                      {isWinner && <ConfettiBurst color={player?.avatar_color ?? "#8b5cf6"} />}
                    </span>

                    {/* Vote badge */}
                    {votesRevealed && voteCount > 0 && (
                      <span className={`text-[10px] font-semibold mt-0.5 ${
                        isWinner ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"
                      }`}>
                        {isWinner && <Zap size={9} className="inline mr-0.5" />}
                        {voteCount} vote{voteCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </button>

                  {i < words.length - 1 && revealedCount > i + 1 && (
                    <span className="text-gray-300 dark:text-gray-600 text-xs">→</span>
                  )}
                </span>
              );
            })}

            {/* Pending dots */}
            {revealedCount < words.length && (
              <span className="flex gap-1 ml-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
                    style={{ animation: `fadePulse 1s ${i * 0.2}s infinite` }}
                  />
                ))}
                <style>{`
                  @keyframes fadePulse { 0%,100% { opacity:0.3 } 50% { opacity:1 } }
                `}</style>
              </span>
            )}
          </div>
        </div>

        {/* Voting CTA */}
        {votingPhase && !votesRevealed && (
          <div className="bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl p-5 mb-8 text-center">
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-200 mb-1">
              Quel maillon t&apos;a le plus surpris ?
            </p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mb-3">
              {myVote !== null
                ? "Vote enregistré !"
                : "Clique sur un mot pour voter"}
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-violet-500 dark:text-violet-400">
                {votes.length} / {players.length} vote{votes.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-violet-400 dark:text-violet-500 tabular-nums">
                · {voteTimer}s restantes
              </span>
            </div>
          </div>
        )}

        {/* Winner reveal */}
        {votesRevealed && maxVotes > 0 && (
          <div className="bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl p-5 mb-8 text-center">
            <Zap size={20} className="text-violet-500 dark:text-violet-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
              Maillon surprise :{" "}
              {words
                .filter((w) => getVoteCountForTurn(w.turn_index) === maxVotes && w.word)
                .map((w) => {
                  const p = players.find((pl) => pl.id === w.player_id);
                  return (
                    <span key={w.id} className="font-black" style={{ color: p?.avatar_color ?? "#8b5cf6" }}>
                      {w.word}
                    </span>
                  );
                })
                .reduce<React.ReactNode[]>((acc, el, i) => [...acc, i > 0 ? " · " : "", el], [])}
            </p>
          </div>
        )}

        {/* Player recap — collapsible */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-8">
          <button
            type="button"
            onClick={() => setShowRecap((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Récap joueurs
            </span>
            {showRecap
              ? <ChevronUp size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              : <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            }
          </button>

          {showRecap && (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800 px-5 pb-3">
              {(room?.player_order ?? []).map((pid, i) => {
                const p = players.find((pl) => pl.id === pid);
                // Use turn_index (= i+1) — player_id-based lookup breaks for players with 2 turns
                const turnIndex = i + 1;
                const w = words.find((wd) => wd.turn_index === turnIndex);
                // Show ·1 / ·2 label when player appears more than once
                const order = room?.player_order ?? [];
                const occurrencesTotal = order.filter((id) => id === pid).length;
                const occurrenceIndex = order.slice(0, i + 1).filter((id) => id === pid).length;
                return (
                  <li key={`${pid}-${i}`} className="flex items-center gap-3 text-sm py-2">
                    <span className="w-5 text-center text-xs text-gray-400">{i + 1}</span>
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p?.avatar_color ?? AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    />
                    <span className="flex-1 text-gray-800 dark:text-gray-200">
                      {p?.pseudo ?? "?"}
                      {pid === playerId && <span className="ml-1.5 text-xs text-gray-400">(vous)</span>}
                      {occurrencesTotal > 1 && (
                        <span className="ml-1 text-[10px] text-gray-400 dark:text-gray-500">·{occurrenceIndex}</span>
                      )}
                    </span>
                    {w?.word ? (
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {w.word}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600">( — )</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {isHost ? (
            <button
              onClick={handleReplay}
              disabled={replaying}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {replaying ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Rejouer
            </button>
          ) : (
            <Link
              href="/mini-jeux/chaine/join"
              className="px-5 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
            >
              Rejoindre une partie
            </Link>
          )}
          <Link
            href="/mini-jeux/chaine"
            className="px-5 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Quitter
          </Link>
        </div>
        <ContinueSessionButton gameType="chaine" roomCode={upperCode} />
      </main>
    </div>
  );
}
