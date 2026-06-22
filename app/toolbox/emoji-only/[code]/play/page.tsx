"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Send, ChevronRight, Crown, Lock, Check, X } from "lucide-react";
import { Header } from "@/components/Header";
import type { EmojiOnlyRoom, EmojiOnlyPlayer, EmojiOnlyRound } from "@/lib/emoji-only/types";
import { ENCODE_SECONDS, GUESS_SECONDS } from "@/lib/emoji-only/types";

interface Guess {
  player_id: string;
  chosen_option: string;
  is_correct: boolean;
  points_earned: number;
  submitted_at: string;
}

interface RoomData extends EmojiOnlyRoom {
  players: EmojiOnlyPlayer[];
  currentRound: (EmojiOnlyRound & { word: string | null }) | null;
  guesses: Guess[];
}

function TimerBar({ seconds, total, color }: { seconds: number; total: number; color: string }) {
  const pct = Math.max(0, (seconds / total) * 100);
  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function EmojiOnlyPlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom]                 = useState<RoomData | null>(null);
  const [loading, setLoading]           = useState(true);

  // Encoder state
  const [emojiInput, setEmojiInput]     = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [encodeLocked, setEncodeLocked] = useState(false);

  // Guesser state
  const [myGuess, setMyGuess]           = useState<string | null>(null);
  const [guessing, setGuessing]         = useState(false);

  // Timer
  const [timeLeft, setTimeLeft]         = useState(0);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevRound  = useRef(0);
  const prevStatus = useRef("");

  useEffect(() => {
    const stored = localStorage.getItem(`emojionly_player_${upperCode}`);
    if (!stored) { router.replace(`/toolbox/emoji-only/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/toolbox/emoji-only/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/emoji-only/room/${upperCode}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store" },
    });
    if (!res.ok) return;
    const data = await res.json() as RoomData;

    // Reset per-round state on new round
    if (data.current_round !== prevRound.current) {
      prevRound.current = data.current_round;
      setEmojiInput("");
      setEncodeLocked(false);
      setMyGuess(null);
      setSubmitError(null);
    }

    // Reset guess state on new status
    if (data.status !== prevStatus.current) {
      prevStatus.current = data.status;
      if (data.status === "encoding" || data.status === "lobby") {
        setMyGuess(null);
      }
    }

    setRoom(data);
    setLoading(false);

    if (data.status === "finished") {
      router.push(`/toolbox/emoji-only/${upperCode}/results`);
    }
  }, [upperCode, router]);

  useEffect(() => {
    if (!playerId) return;
    fetchRoom();
    pollRef.current = setInterval(fetchRoom, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [playerId, fetchRoom]);

  // Timer countdown
  useEffect(() => {
    if (!room?.phase_started_at) return;
    if (room.status !== "encoding" && room.status !== "guessing") {
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const total = room.status === "encoding" ? ENCODE_SECONDS : GUESS_SECONDS;

    function tick() {
      const elapsed = (Date.now() - new Date(room!.phase_started_at!).getTime()) / 1000;
      const left = Math.max(0, total - elapsed);
      setTimeLeft(Math.ceil(left));
    }

    tick();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [room?.phase_started_at, room?.status]);

  async function submitEmoji() {
    if (!emojiInput.trim() || encodeLocked || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setEncodeLocked(true);

    try {
      const res = await fetch(`/api/emoji-only/room/${upperCode}/encode`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId, emojiSequence: emojiInput.trim() }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setSubmitError(data.error ?? "Erreur");
        setEncodeLocked(false);
      }
    } catch {
      setSubmitError("Erreur réseau");
      setEncodeLocked(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitGuess(option: string) {
    if (myGuess || guessing) return;
    setMyGuess(option);
    setGuessing(true);

    try {
      await fetch(`/api/emoji-only/room/${upperCode}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId, chosenOption: option }),
      });
    } catch {
      // Already set myGuess, keep it
    } finally {
      setGuessing(false);
    }
  }

  async function nextRound() {
    try {
      await fetch(`/api/emoji-only/room/${upperCode}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
    } catch {
      // will retry on next poll
    }
  }

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  const isHost    = room.host_player_id === playerId;
  const isEncoder = room.current_encoder_player_id === playerId;
  const encoder   = room.players.find((p) => p.id === room.current_encoder_player_id);
  const myPlayer  = room.players.find((p) => p.id === playerId);
  const round     = room.currentRound;
  const guesses   = room.guesses ?? [];
  const myGuessData = guesses.find((g) => g.player_id === playerId);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/emoji-only", label: "Emoji Only" },
  ];

  // Leaderboard sorted
  const leaderboard = [...room.players].sort((a, b) => b.score - a.score);

  // ── ENCODING PHASE ──
  if (room.status === "encoding") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <main className="flex-1 max-w-sm mx-auto w-full px-6 py-8 flex flex-col gap-5">

          {/* Round indicator */}
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Round {room.current_round} / {room.total_rounds}
            </p>
            <div className="mt-2">
              <TimerBar seconds={timeLeft} total={ENCODE_SECONDS} color={timeLeft > 15 ? "bg-amber-400" : "bg-red-500"} />
              <p className="text-xs text-gray-400 mt-1">{timeLeft}s</p>
            </div>
          </div>

          {isEncoder ? (
            <>
              {/* Encoder view */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-center">
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">Votre mot à encoder</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{round?.word}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Composez jusqu&apos;à 5 emojis pour le faire deviner
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Votre séquence d&apos;emojis
                </label>
                <input
                  type="text"
                  value={emojiInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Count grapheme clusters (emojis) — rough approximation via Intl
                    const count = [...new Intl.Segmenter().segment(val)].length;
                    if (count <= 5) setEmojiInput(val);
                  }}
                  placeholder="😀🚀🌍…"
                  disabled={encodeLocked}
                  className="w-full px-4 py-3 text-3xl text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 text-right">
                  Utilisez le clavier emoji de votre appareil (🌐 ou 😊)
                </p>

                {submitError && (
                  <p className="text-xs text-red-500 dark:text-red-400">{submitError}</p>
                )}

                <button
                  onClick={submitEmoji}
                  disabled={!emojiInput.trim() || encodeLocked || submitting}
                  className="w-full py-3 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <Loader2 size={15} className="animate-spin" />
                    : encodeLocked
                      ? <><Lock size={14} /> Séquence envoyée</>
                      : <><Send size={14} /> Envoyer ma séquence</>
                  }
                </button>
              </div>
            </>
          ) : (
            /* Guesser waiting view */
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: encoder?.avatar_color + "22" }}>
                <span style={{ color: encoder?.avatar_color }}>😶</span>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {encoder?.pseudo} encode…
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Préparez-vous à deviner la séquence d&apos;emojis
                </p>
              </div>
              <Loader2 size={18} className="animate-spin text-amber-400" />
            </div>
          )}

          {/* Mini leaderboard */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scores</p>
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {leaderboard.map((p, i) => (
                <li key={p.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.avatar_color }} />
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{p.pseudo}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{p.score}</span>
                  {p.id === room.current_encoder_player_id && (
                    <span className="text-xs text-amber-500 font-medium">encode</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </main>
      </div>
    );
  }

  // ── GENERATING PHASE ──
  if (room.status === "generating") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="text-5xl">{round?.emoji_sequence ?? "🤖"}</div>
          <Loader2 size={24} className="animate-spin text-amber-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            L&apos;IA prépare les options de réponse…
          </p>
        </main>
      </div>
    );
  }

  // ── GUESSING PHASE ──
  if (room.status === "guessing" && round) {
    const hasGuessed = !!myGuess || !!myGuessData;
    const effectiveGuess = myGuess ?? myGuessData?.chosen_option ?? null;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <main className="flex-1 max-w-sm mx-auto w-full px-6 py-8 flex flex-col gap-5">

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Round {room.current_round} / {room.total_rounds} · {encoder?.pseudo} a encodé
            </p>
            <div className="mt-2">
              <TimerBar seconds={timeLeft} total={GUESS_SECONDS} color={timeLeft > 15 ? "bg-amber-400" : "bg-red-500"} />
              <p className="text-xs text-gray-400 mt-1">{timeLeft}s</p>
            </div>
          </div>

          {/* Emoji display */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">Que signifie cette séquence ?</p>
            <p className="text-5xl tracking-widest leading-relaxed">{round.emoji_sequence ?? "❓"}</p>
          </div>

          {isEncoder ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Les autres devinent votre séquence…
              </p>
              <p className="text-xs text-gray-400">
                {guesses.length} / {room.players.length - 1} réponses reçues
              </p>
              <div className="flex gap-1 mt-2">
                {room.players.filter((p) => p.id !== playerId).map((p) => {
                  const hasAnswered = guesses.some((g) => g.player_id === p.id);
                  return (
                    <div
                      key={p.id}
                      className={`w-6 h-6 rounded-full transition-all ${hasAnswered ? "opacity-100" : "opacity-30"}`}
                      style={{ backgroundColor: p.avatar_color }}
                      title={p.pseudo}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            /* MCQ options */
            <div className="space-y-2">
              {(round.options ?? []).map((opt) => {
                const isSelected = effectiveGuess === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => !hasGuessed && submitGuess(opt)}
                    disabled={hasGuessed || guessing}
                    className={`w-full px-5 py-4 rounded-xl border text-sm font-medium text-left transition-all ${
                      isSelected
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200"
                        : hasGuessed
                          ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 opacity-50"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/40 dark:hover:bg-amber-950/20"
                    }`}
                  >
                    {isSelected && <Lock size={12} className="inline mr-2 text-amber-500" />}
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {hasGuessed && !isEncoder && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
              <Lock size={11} />
              Réponse verrouillée · en attente des autres…
            </p>
          )}

        </main>
      </div>
    );
  }

  // ── REVEAL PHASE ──
  if (room.status === "reveal" && round) {
    const correctAnswer = round.correct_option;
    const myGuessResult = guesses.find((g) => g.player_id === playerId);
    const encoderBonus  = guesses.filter((g) => g.is_correct).length;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <main className="flex-1 max-w-sm mx-auto w-full px-6 py-8 flex flex-col gap-5">

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Round {room.current_round} / {room.total_rounds} — Résultats
            </p>
            <div className="text-4xl tracking-widest my-3">{round.emoji_sequence ?? "❓"}</div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
              <span className="text-lg font-bold text-amber-900 dark:text-amber-100">{correctAnswer}</span>
            </div>
          </div>

          {/* My result */}
          {!isEncoder && myGuessResult && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              myGuessResult.is_correct
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
            }`}>
              {myGuessResult.is_correct
                ? <Check size={18} className="text-green-500 flex-shrink-0" />
                : <X size={18} className="text-red-500 flex-shrink-0" />
              }
              <div>
                <p className={`text-sm font-semibold ${myGuessResult.is_correct ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                  {myGuessResult.is_correct ? `+${myGuessResult.points_earned} point${myGuessResult.points_earned > 1 ? "s" : ""} !` : "Pas cette fois…"}
                </p>
                {!myGuessResult.is_correct && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Vous aviez choisi : {myGuessResult.chosen_option}</p>
                )}
              </div>
            </div>
          )}

          {isEncoder && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <Crown size={18} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {encoderBonus > 0
                  ? `+${encoderBonus} bonus encodeur (${encoderBonus} bonne${encoderBonus > 1 ? "s" : ""} réponse${encoderBonus > 1 ? "s" : ""})`
                  : "Personne n'a trouvé cette fois"
                }
              </p>
            </div>
          )}

          {/* All guesses */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Réponses</p>
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {room.players.filter((p) => p.id !== room.current_encoder_player_id).map((p) => {
                const guess = guesses.find((g) => g.player_id === p.id);
                return (
                  <li key={p.id} className="px-4 py-2.5 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.avatar_color }} />
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{p.pseudo}</span>
                    {guess ? (
                      <span className={`flex items-center gap-1 text-xs font-medium ${guess.is_correct ? "text-green-600" : "text-red-500"}`}>
                        {guess.is_correct ? <Check size={12} /> : <X size={12} />}
                        {guess.is_correct ? `+${guess.points_earned}pts` : guess.chosen_option}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Leaderboard */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classement</p>
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {leaderboard.map((p, i) => (
                <li key={p.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.avatar_color }} />
                  <span className={`flex-1 text-sm ${p.id === playerId ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    {p.pseudo}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{p.score}</span>
                </li>
              ))}
            </ul>
          </div>

          {isHost && (
            <button
              onClick={nextRound}
              className="w-full py-3 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              {room.current_round < room.total_rounds
                ? <><ChevronRight size={16} /> Round suivant</>
                : <><ChevronRight size={16} /> Voir les résultats finaux</>
              }
            </button>
          )}

          {!isHost && (
            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Loader2 size={11} className="animate-spin" />
              En attente de l&apos;animateur…
            </p>
          )}

        </main>
      </div>
    );
  }

  // Fallback loading
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
      <span className="text-sm text-gray-400">Synchronisation…</span>
    </div>
  );
}
