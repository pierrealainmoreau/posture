"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Send, SkipForward } from "lucide-react";
import { Header } from "@/components/Header";
import type { CompletePhraseRoom, CompletePhrasePlayer } from "@/lib/completephrase/types";

type RoomData = CompletePhraseRoom & { players: CompletePhrasePlayer[] };

const TIMER_SECONDS = 30;

// ── Barre de timer ───────────────────────────────────────────────────────────
function TimerBar({ phraseStartedAt }: { phraseStartedAt: string | null }) {
  const [remaining, setRemaining] = useState(TIMER_SECONDS);

  useEffect(() => {
    if (!phraseStartedAt) { setRemaining(TIMER_SECONDS); return; }

    function tick() {
      const elapsed = (Date.now() - new Date(phraseStartedAt!).getTime()) / 1000;
      setRemaining(Math.max(0, TIMER_SECONDS - elapsed));
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phraseStartedAt]);

  const pct = (remaining / TIMER_SECONDS) * 100;
  const urgent = remaining <= 10;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-bold tabular-nums ${urgent ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-250 ${urgent ? "bg-red-500" : "bg-fuchsia-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Écran d'attente ──────────────────────────────────────────────────────────
function WaitingScreen({
  players,
  myResponse,
  currentPhrase,
  phraseIndex,
  totalPhrases,
  isHost,
  isLast,
  onNext,
  advancing,
  phraseStartedAt,
}: {
  players: CompletePhrasePlayer[];
  myResponse: string;
  currentPhrase: string;
  phraseIndex: number;
  totalPhrases: number;
  isHost: boolean;
  isLast: boolean;
  onNext: () => void;
  advancing: boolean;
  phraseStartedAt: string | null;
}) {
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => {
    if (!phraseStartedAt) return;
    const elapsed = (Date.now() - new Date(phraseStartedAt).getTime()) / 1000;
    if (elapsed >= TIMER_SECONDS) { setTimerExpired(true); return; }
    const id = setTimeout(() => setTimerExpired(true), (TIMER_SECONDS - elapsed) * 1000);
    return () => clearTimeout(id);
  }, [phraseStartedAt]);

  const doneCount = players.filter((p) => {
    const resp = p.responses as (string | null)[] | null;
    return resp ? resp[phraseIndex] != null : p.response != null;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">

        <div className="w-14 h-14 rounded-full bg-fuchsia-100 dark:bg-fuchsia-950 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-fuchsia-500" />
        </div>

        <p className="text-xs text-fuchsia-400 font-medium mb-1">
          Phrase {phraseIndex + 1}/{totalPhrases}
        </p>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Réponse envoyée !</h2>

        <div className="bg-white dark:bg-gray-900 border border-fuchsia-100 dark:border-fuchsia-900 rounded-2xl px-4 py-3 mb-6 text-left">
          <p className="text-xs text-fuchsia-400 font-medium mb-1">{currentPhrase}</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{myResponse}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {players.map((p) => {
            const resp = p.responses as (string | null)[] | null;
            const done = resp ? resp[phraseIndex] != null : p.response != null;
            return (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-opacity ${done ? "opacity-100" : "opacity-25"}`}
                  style={{ backgroundColor: p.avatar_color }}
                >
                  {done ? <CheckCircle2 size={16} /> : p.pseudo[0].toUpperCase()}
                </div>
                <span className={`text-xs ${done ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}`}>
                  {p.pseudo}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          {doneCount} / {players.length} réponse{players.length !== 1 ? "s" : ""}
          {!isLast && doneCount < players.length && " — auto-avance quand tout le monde répond"}
        </p>

        {isHost && (timerExpired || doneCount === players.length) && (
          <button
            onClick={onNext}
            disabled={advancing}
            className="w-full py-3 bg-fuchsia-500 text-white text-sm font-semibold rounded-xl hover:bg-fuchsia-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {advancing
              ? <Loader2 size={15} className="animate-spin" />
              : <SkipForward size={15} />
            }
            {advancing ? "…" : isLast ? "Voir les réponses →" : "Phrase suivante →"}
          </button>
        )}

        {!isHost && !timerExpired && (
          <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            En attente des autres participants…
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function CompletePhrasePlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]         = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom]                 = useState<RoomData | null>(null);
  const [loading, setLoading]           = useState(true);

  // Réponse pour chaque phrase (indexé)
  const [draftResponse, setDraftResponse]   = useState("");
  const [submittedIndex, setSubmittedIndex] = useState<number | null>(null);
  const [myResponses, setMyResponses]       = useState<(string | null)[]>([]);
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const [advancing, setAdvancing]           = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`completephrase_player_${upperCode}`);
    if (!stored) { router.replace(`/toolbox/completephrase/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/toolbox/completephrase/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/completephrase/room/${upperCode}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store" },
    });
    if (!res.ok) { setLoading(false); return; }

    const data = await res.json() as RoomData;

    if (data.status === "lobby") { router.replace(`/toolbox/completephrase/${upperCode}/lobby`); return; }
    if (data.status === "finished") { router.push(`/toolbox/completephrase/${upperCode}/results`); return; }

    setRoom(data);
    setLoading(false);
  }, [upperCode, router]);

  useEffect(() => {
    if (!playerId) return;

    async function init() {
      const res = await fetch(`/api/completephrase/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as RoomData;
      if (data.status === "lobby") { router.replace(`/toolbox/completephrase/${upperCode}/lobby`); return; }
      if (data.status === "finished") { router.replace(`/toolbox/completephrase/${upperCode}/results`); return; }

      setRoom(data);
      setLoading(false);

      // Récupère mes réponses déjà soumises
      const me = (data.players ?? []).find((p) => p.id === playerId);
      if (me) {
        const resp = (me.responses as (string | null)[] | null) ?? (me.response ? [me.response] : []);
        setMyResponses(resp);
        const ci = data.current_phrase_index ?? 0;
        if (resp[ci] != null) setSubmittedIndex(ci);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  // Polling continu
  useEffect(() => {
    if (!playerId || loading) return;

    pollRef.current = setInterval(async () => {
      await fetchRoom();
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [playerId, loading, fetchRoom]);

  // Quand la phrase change (auto-avance), réinitialise le formulaire
  useEffect(() => {
    if (!room) return;
    const ci = room.current_phrase_index ?? 0;
    const alreadyResponded = myResponses[ci] != null;
    if (!alreadyResponded && submittedIndex !== ci) {
      setSubmittedIndex(null);
      setDraftResponse("");
      setSubmitError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.current_phrase_index]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draftResponse.trim() || submitting || !room) return;
    setSubmitting(true);
    setSubmitError(null);

    const phraseIndex = room.current_phrase_index ?? 0;

    const res = await fetch(`/api/completephrase/room/${upperCode}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ playerId, response: draftResponse.trim(), phraseIndex }),
    });

    if (res.ok) {
      const updated = [...myResponses];
      while (updated.length <= phraseIndex) updated.push(null);
      updated[phraseIndex] = draftResponse.trim();
      setMyResponses(updated);
      setSubmittedIndex(phraseIndex);

      // Optimistic UI : marque ma réponse sur les joueurs
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) => {
            if (p.id !== playerId) return p;
            const resp = [...((p.responses as (string | null)[] | null) ?? [])];
            while (resp.length <= phraseIndex) resp.push(null);
            resp[phraseIndex] = draftResponse.trim();
            return { ...p, responses: resp };
          }),
        };
      });
    } else {
      const d = await res.json() as { error?: string };
      setSubmitError(d.error ?? "Erreur lors de l'envoi.");
    }
    setSubmitting(false);
  }

  async function handleNext() {
    if (!room) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/completephrase/room/${upperCode}/next-phrase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) {
        await fetchRoom();
      }
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

  const phrases = (room.starter_phrases as string[] | null) ?? [room.starter_phrase];
  const totalPhrases = phrases.length;
  const phraseIndex = room.current_phrase_index ?? 0;
  const currentPhrase = phrases[phraseIndex] ?? room.starter_phrase;
  const isHost = room.host_player_id === playerId;
  const isLast = phraseIndex >= totalPhrases - 1;
  const hasSubmitted = submittedIndex === phraseIndex;

  if (hasSubmitted) {
    return (
      <WaitingScreen
        players={room.players}
        myResponse={myResponses[phraseIndex] ?? ""}
        currentPhrase={currentPhrase}
        phraseIndex={phraseIndex}
        totalPhrases={totalPhrases}
        isHost={isHost}
        isLast={isLast}
        onNext={handleNext}
        advancing={advancing}
        phraseStartedAt={room.phrase_started_at}
      />
    );
  }

  const charCount = draftResponse.length;
  const MAX_CHARS = 280;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 py-8">

        {/* Progression + timer */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Phrase {phraseIndex + 1} / {totalPhrases}
            </span>
            {totalPhrases > 1 && (
              <div className="flex gap-1">
                {phrases.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      i < phraseIndex ? "bg-fuchsia-400" :
                      i === phraseIndex ? "bg-fuchsia-500" :
                      "bg-gray-200 dark:bg-gray-800"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <TimerBar phraseStartedAt={room.phrase_started_at} />
        </div>

        {/* Phrase starter */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-400 mb-3">
            Continuez la phrase
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug">
            {currentPhrase}
          </h1>
          <p className="mt-2 text-gray-400 dark:text-gray-500 text-sm">
            Complétez avec ce qui vous vient naturellement.
          </p>
        </div>

        {/* Zone de saisie */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
          <div className="relative flex-1">
            <textarea
              autoFocus
              value={draftResponse}
              onChange={(e) => setDraftResponse(e.target.value.slice(0, MAX_CHARS))}
              placeholder="…votre réponse"
              rows={5}
              className="w-full h-full min-h-[140px] px-4 py-3 text-base rounded-2xl border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400 dark:focus:border-fuchsia-600 resize-none transition-colors"
            />
            <span className={`absolute bottom-3 right-4 text-xs ${
              charCount > MAX_CHARS * 0.9 ? "text-fuchsia-500" : "text-gray-300 dark:text-gray-600"
            }`}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>

          {submitError && (
            <p className="text-sm text-red-500 text-center">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={!draftResponse.trim() || submitting}
            className="w-full py-3.5 bg-fuchsia-500 text-white text-sm font-semibold rounded-xl hover:bg-fuchsia-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {submitting ? "Envoi…" : "Envoyer ma réponse"}
          </button>
        </form>
      </main>
    </div>
  );
}
