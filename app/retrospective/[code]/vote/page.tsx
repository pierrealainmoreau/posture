"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import { RETRO_CRITERIA, type RetroRoom, type RetroPlayer } from "@/lib/retrospective/types";
import { useI18n } from "@/lib/i18n";

const SCORE_CONFIG: Record<number, { bg: string; ring: string; text: string; activeBg: string; activeText: string }> = {
  1: { bg: "bg-red-50 dark:bg-red-950/30",     ring: "ring-red-300",    text: "text-red-500",    activeBg: "bg-red-500",    activeText: "text-white" },
  2: { bg: "bg-orange-50 dark:bg-orange-950/30", ring: "ring-orange-300", text: "text-orange-500", activeBg: "bg-orange-500", activeText: "text-white" },
  3: { bg: "bg-yellow-50 dark:bg-yellow-950/30", ring: "ring-yellow-300", text: "text-yellow-600", activeBg: "bg-yellow-500", activeText: "text-white" },
  4: { bg: "bg-lime-50 dark:bg-lime-950/30",     ring: "ring-lime-400",   text: "text-lime-600",   activeBg: "bg-lime-500",   activeText: "text-white" },
  5: { bg: "bg-green-50 dark:bg-green-950/30",   ring: "ring-green-400",  text: "text-green-600",  activeBg: "bg-green-500",  activeText: "text-white" },
};

function ScoreButton({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  const cfg = SCORE_CONFIG[value];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
        selected
          ? `${cfg.activeBg} ${cfg.activeText} ring-2 ${cfg.ring} scale-110 shadow-sm`
          : `${cfg.bg} ${cfg.text} hover:scale-105`
      }`}
    >
      {value}
    </button>
  );
}

// Waiting screen shown after vote submitted
function WaitingScreen({
  players,
  myPlayerId,
  isHost,
  onFinish,
  finishing,
  totalCriteria,
}: {
  players: RetroPlayer[];
  myPlayerId: string;
  isHost: boolean;
  onFinish: () => void;
  finishing: boolean;
  totalCriteria: number;
}) {
  const { t } = useI18n();
  const votedCount = players.filter((p) => p.vote_count >= totalCriteria).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-teal-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t.common.submit} !</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {votedCount} / {players.length} {players.length !== 1 ? t.retrospective.participants : t.retrospective.participant}
        </p>

        {/* Avatar dots */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {players.map((p) => {
            const hasVoted = p.vote_count >= totalCriteria;
            return (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-opacity ${
                    hasVoted ? "opacity-100" : "opacity-25"
                  }`}
                  style={{ backgroundColor: p.avatar_color }}
                >
                  {p.pseudo[0].toUpperCase()}
                </div>
                <span className={`text-xs ${hasVoted ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}`}>
                  {p.pseudo}
                </span>
              </div>
            );
          })}
        </div>

        {isHost ? (
          <button
            onClick={onFinish}
            disabled={finishing}
            className="w-full py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {finishing ? <Loader2 size={15} className="animate-spin" /> : <ChevronDown size={15} />}
            {finishing ? t.retrospective.revealing : t.retrospective.revealResults}
          </button>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            {t.retrospective.waitingReveal}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RetroVotePage() {
  const { t } = useI18n();
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]       = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom]               = useState<RetroRoom | null>(null);
  const [players, setPlayers]         = useState<RetroPlayer[]>([]);
  const [scores, setScores]           = useState<Record<string, number>>({});
  const [comment, setComment]         = useState("");
  const [submitted, setSubmitted]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [finishing, setFinishing]     = useState(false);
  const [voteError, setVoteError]     = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalCriteria = RETRO_CRITERIA.length;
  const ratedCount = Object.keys(scores).length;
  const allRated = ratedCount === totalCriteria;

  // Load identity
  useEffect(() => {
    const stored = localStorage.getItem(`retro_player_${upperCode}`);
    if (!stored) { router.replace(`/retrospective/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/retrospective/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Load room once
  useEffect(() => {
    if (!playerId) return;
    async function init() {
      const res = await fetch(`/api/retrospective/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json() as RetroRoom & { players: RetroPlayer[] };
      if (data.status === "lobby") { router.replace(`/retrospective/${upperCode}/lobby`); return; }
      if (data.status === "finished") { router.replace(`/retrospective/${upperCode}/results`); return; }
      setRoom(data);
      setPlayers(data.players ?? []);
      // Check if already voted
      const me = (data.players ?? []).find((p) => p.id === playerId);
      if (me && me.vote_count >= totalCriteria) setSubmitted(true);
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  // Polling after submit
  useEffect(() => {
    if (!submitted || !playerId) return;
    async function poll() {
      const res = await fetch(`/api/retrospective/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) return;
      const data = await res.json() as RetroRoom & { players: RetroPlayer[] };
      setPlayers(data.players ?? []);
      if (data.status === "finished") router.push(`/retrospective/${upperCode}/results`);
    }
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, playerId, upperCode]);

  async function handleSubmit() {
    if (!allRated || submitting) return;
    setSubmitting(true);
    setVoteError(null);
    const res = await fetch(`/api/retrospective/room/${upperCode}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ playerId, votes: scores, comment }),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      const d = await res.json() as { error?: string };
      setVoteError(d.error ?? t.common.error);
    }
    setSubmitting(false);
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      await fetch(`/api/retrospective/room/${upperCode}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
      router.push(`/retrospective/${upperCode}/results`);
    } catch {
      setFinishing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> {t.common.loading}
      </div>
    );
  }

  const isHost = room?.host_player_id === playerId;

  if (submitted) {
    return (
      <WaitingScreen
        players={players}
        myPlayerId={playerId}
        isHost={isHost}
        onFinish={handleFinish}
        finishing={finishing}
        totalCriteria={totalCriteria}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-32">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t.retrospective.healthCheckTitle}</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">{ratedCount} / {totalCriteria}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(ratedCount / totalCriteria) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            {t.retrospective.healthCriteria}
          </p>
        </div>

        {/* Criteria */}
        <div className="space-y-3 mb-6">
          {RETRO_CRITERIA.map((c) => (
            <div
              key={c.id}
              className={`bg-white dark:bg-gray-900 border rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition-all ${
                scores[c.id]
                  ? "border-teal-200 dark:border-teal-800"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">
                {c.label}
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((v) => (
                  <ScoreButton
                    key={v}
                    value={v}
                    selected={scores[c.id] === v}
                    onClick={() => setScores((prev) => ({ ...prev, [c.id]: v }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comment */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.retrospective.comment} <span className="text-gray-400 font-normal">{t.retrospective.optional}</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.retrospective.commentPlaceholder}
            rows={3}
            maxLength={400}
            className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder:text-gray-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {voteError && (
          <p className="text-sm text-red-500 dark:text-red-400 text-center mb-4">{voteError}</p>
        )}
      </main>

      {/* Sticky submit */}
      <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!allRated || submitting}
            className="w-full py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? t.common.submitting : allRated ? t.retrospective.submitVote : `${totalCriteria - ratedCount}`}
          </button>
        </div>
      </div>
    </div>
  );
}
