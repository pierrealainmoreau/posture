"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  Loader2, Send, CheckCircle2, XCircle, Plus,
  Users, CheckCheck, Trophy, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useI18n } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoomInfo {
  id: string;
  code: string;
  is_active: boolean;
  phase: "collecting" | "voting" | "results";
  participants: string[];
  approved_count: number;
  creator_name: string | null;
}

interface SubmittedEntry { text: string; id: string }

interface VotingAnecdote { id: string; question: string }

interface ResultItem {
  id: string;
  question: string;
  submitted_by: string;
  votes: { voter_name: string; guessed_participant: string }[];
  correct_count: number;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoomParticipantPage() {
  const { t } = useI18n();
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();

  const [room, setRoom]         = useState<RoomInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Participant name
  const [participantName, setParticipantName] = useState<string | null>(null);
  const [nameInput, setNameInput]             = useState("");
  const [savingName, setSavingName]           = useState(false);

  // Collecting phase
  const [drafts, setDrafts]         = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState<SubmittedEntry[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const lastInputRef = useRef<HTMLTextAreaElement>(null);

  // Voting phase
  const [votingAnecdotes, setVotingAnecdotes] = useState<VotingAnecdote[]>([]);
  const [votes, setVotes]                     = useState<Record<string, string>>({});
  const [votesSubmitting, setVotesSubmitting] = useState(false);
  const [votesSubmitted, setVotesSubmitted]   = useState(false);
  const [voteError, setVoteError]             = useState<string | null>(null);

  // Results phase
  const [results, setResults]           = useState<ResultItem[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/icebreaker/room/${upperCode}`
    : `https://posture.pamoreau.xyz/icebreaker/room/${upperCode}`;

  // ── Init: load stored name ─────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(`icebreaker_name_${upperCode}`);
    if (stored) setParticipantName(stored);
  }, [upperCode]);

  // ── Poll room ─────────────────────────────────────────────────────────────
  const fetchRoom = useCallback(() => {
    fetch(`/api/icebreaker/room/${upperCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); setLoading(false); return; }
        setRoom(data);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [upperCode]);

  useEffect(() => {
    fetchRoom();
    const id = setInterval(fetchRoom, 5000);
    return () => clearInterval(id);
  }, [fetchRoom]);

  // ── Load voting anecdotes when phase → voting ─────────────────────────────
  useEffect(() => {
    if (room?.phase === "voting" && votingAnecdotes.length === 0) {
      fetch(`/api/icebreaker/room/${upperCode}/anecdotes`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setVotingAnecdotes(data); });
    }
  }, [room?.phase, upperCode, votingAnecdotes.length]);

  // ── Load results when phase → results ────────────────────────────────────
  useEffect(() => {
    if (room?.phase === "results" && results.length === 0) {
      setResultsLoading(true);
      fetch(`/api/icebreaker/room/${upperCode}/votes`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setResults(data); setResultsLoading(false); });
    }
  }, [room?.phase, upperCode, results.length]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    setSavingName(true);
    await fetch(`/api/icebreaker/room/${upperCode}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    localStorage.setItem(`icebreaker_name_${upperCode}`, name);
    setParticipantName(name);
    setSavingName(false);
  }

  function updateDraft(idx: number, value: string) {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? value : d)));
  }
  function addField() {
    setDrafts((prev) => [...prev, ""]);
    setTimeout(() => lastInputRef.current?.focus(), 50);
  }
  function removeField(idx: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = drafts.map((d) => d.trim()).filter(Boolean);
    if (valid.length === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const res = await Promise.all(
      valid.map((q) =>
        fetch(`/api/icebreaker/room/${upperCode}/anecdotes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, submitted_by: participantName }),
        }).then((r) => r.json().then((d) => ({ ok: r.ok, ...d, text: q })))
      )
    );

    const failed = res.find((r) => !r.ok);
    setSubmitting(false);
    if (failed) { setSubmitError(failed.error ?? t.icebreaker.errorSend); return; }

    setSubmitted((prev) => [
      ...prev,
      ...valid.map((t) => ({ text: t, id: `${Date.now()}-${Math.random()}` })),
    ]);
    setDrafts([""]);
  }

  async function handleSubmitVotes(e: React.FormEvent) {
    e.preventDefault();
    if (!participantName || votesSubmitting) return;
    const allVoted = votingAnecdotes.every((a) => votes[a.id]);
    if (!allVoted) { setVoteError(t.icebreaker.voteForAll); return; }
    setVotesSubmitting(true);
    setVoteError(null);

    const voteArray = votingAnecdotes.map((a) => ({
      anecdote_id:         a.id,
      guessed_participant: votes[a.id],
    }));

    const r = await fetch(`/api/icebreaker/room/${upperCode}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voter_name: participantName, votes: voteArray }),
    });
    const data = await r.json();
    setVotesSubmitting(false);
    if (!r.ok) { setVoteError(data.error ?? t.icebreaker.errorSend); return; }
    setVotesSubmitted(true);
  }

  // ── Shared top bar + stepper ──────────────────────────────────────────────

  function TopBar({ right }: { right?: React.ReactNode }) {
    return (
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <Logo withWordmark size={22} />
        {right}
      </div>
    );
  }

  function PhaseStepper() {
    const current = room?.phase ?? "collecting";
    const phases = [
      { key: "collecting", label: t.icebreaker.collectPhase },
      { key: "voting",     label: t.icebreaker.votePhase },
      { key: "results",    label: t.icebreaker.resultsPhase },
    ] as const;
    const currentIdx = phases.findIndex((p) => p.key === current);
    return (
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-2.5 flex items-center gap-2 text-xs font-medium">
        {phases.map(({ key, label }, i) => {
          const active = key === current;
          const done   = i < currentIdx;
          return (
            <span key={key} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={11} className="text-gray-300 dark:text-gray-600" />}
              <span className={`px-2.5 py-0.5 rounded-full border ${
                active
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : done
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
              }`}>
                {label}
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
        <XCircle size={36} className="text-red-400 mb-4" />
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.icebreaker.sessionNotFound}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.icebreaker.invalidLink}</p>
      </div>
    );
  }

  // ── Name entry ────────────────────────────────────────────────────────────
  if (!participantName) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <TopBar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-5">
                <Users size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {room.creator_name
                  ? <><span className="text-cyan-600 dark:text-cyan-400">{room.creator_name}</span> vous invite</>
                  : t.icebreaker.joinSession
                }
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t.icebreaker.joinPrompt}
              </p>
              <form onSubmit={handleSaveName} className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={t.icebreaker.namePlaceholder}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!nameInput.trim() || savingName}
                  className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {savingName && <Loader2 size={15} className="animate-spin" />}
                  {t.icebreaker.join}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (room.phase === "results") {
    const myCorrectCount = results.filter((r) => {
      const v = r.votes.find((v) => v.voter_name === participantName);
      return v && v.guessed_participant === r.submitted_by;
    }).length;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <TopBar right={
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{participantName}</span>
        } />
        <PhaseStepper />
        <main className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-2xl space-y-4">

            {/* Score card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
              <Trophy size={28} className="text-amber-400 mx-auto mb-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t.icebreaker.resultsPhase}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.icebreaker.youFound}{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {myCorrectCount} / {results.length}
                </span>{" "}
                {myCorrectCount !== 1 ? t.icebreaker.correctAnswers : t.icebreaker.correctAnswer}
              </p>
            </div>

            {resultsLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : results.map((item) => {
              const myVote   = item.votes.find((v) => v.voter_name === participantName);
              const correct  = myVote?.guessed_participant === item.submitted_by;
              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 ${
                    correct
                      ? "border-emerald-200 dark:border-emerald-800"
                      : "border-gray-200 dark:border-gray-800"
                  }`}
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    « {item.question} »
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">{t.icebreaker.submittedBy}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.submitted_by}</p>
                    </div>
                    {myVote && (
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">{t.icebreaker.yourAnswer}</p>
                        <div className="flex items-center gap-1.5 justify-end">
                          {correct
                            ? <CheckCircle2 size={13} className="text-emerald-500" />
                            : <XCircle size={13} className="text-red-400" />
                          }
                          <p className={`text-sm font-medium ${
                            correct
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-500 dark:text-red-400"
                          }`}>
                            {myVote.guessed_participant}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {item.correct_count > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                      {item.correct_count} {item.correct_count > 1 ? t.icebreaker.foundPlural : t.icebreaker.foundSingular}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ── Voting ────────────────────────────────────────────────────────────────
  if (room.phase === "voting") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <TopBar right={
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{participantName}</span>
        } />
        <PhaseStepper />
        <main className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-2xl">

            <div className="mb-6">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {t.icebreaker.guessTitle}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.icebreaker.guessSubtitle}
              </p>
            </div>

            {votesSubmitted ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
                <CheckCheck size={28} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-base font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                  {t.icebreaker.votesSent}
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {t.icebreaker.waitingResults}
                </p>
              </div>
            ) : votingAnecdotes.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 size={18} className="animate-spin mr-2" /> {t.common.loading}
              </div>
            ) : (
              <form onSubmit={handleSubmitVotes} className="space-y-4">
                {votingAnecdotes.map((anecdote, idx) => (
                  <div
                    key={anecdote.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
                  >
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                      {t.icebreaker.anecdoteLabel} {idx + 1}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      « {anecdote.question} »
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {room.participants.filter((name) => name !== participantName).map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setVotes((v) => ({ ...v, [anecdote.id]: name }))}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                            votes[anecdote.id] === name
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {voteError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{voteError}</p>
                )}

                <button
                  type="submit"
                  disabled={votesSubmitting || !votingAnecdotes.every((a) => votes[a.id])}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {votesSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {votesSubmitting ? t.common.submitting : t.icebreaker.sendVotes}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Collecting (default) ──────────────────────────────────────────────────
  const isClosed = !room.is_active;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      <TopBar right={
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{participantName}</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isClosed
              ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
              : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isClosed ? "bg-gray-400" : "bg-emerald-500 animate-pulse"}`} />
            {isClosed ? t.icebreaker.sessionClosedLabel : t.icebreaker.sessionActiveLabel}
          </span>
        </div>
      } />
      <PhaseStepper />

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* Hero: QR code + context */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-5">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <div className="p-3 bg-white rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <QRCode value={shareUrl} size={100} />
                </div>
                <p className="font-bold tracking-widest font-mono text-xl text-gray-900 dark:text-white">
                  {room.code}
                </p>
              </div>
              <div className="flex flex-col justify-center text-center sm:text-left">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 leading-snug">
                  {room.creator_name
                    ? <><span className="text-cyan-600 dark:text-cyan-400">{room.creator_name}</span> vous invite à partager une anecdote</>
                    : t.icebreaker.shareAnecdote
                  }
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.icebreaker.shareDesc}
                </p>
                {room.approved_count > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
                    ✓ {room.approved_count} {t.icebreaker.receivedCount}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Already submitted */}
          {submitted.length > 0 && (
            <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                {t.icebreaker.submitted} ({submitted.length})
              </p>
              <ul className="space-y-1.5">
                {submitted.map((s) => (
                  <li key={s.id} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-emerald-500" />
                    {s.text}
                  </li>
                ))}
              </ul>
              {room.phase === "collecting" && !isClosed && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Loader2 size={11} className="animate-spin" />
                  {t.icebreaker.waitingVote}
                </p>
              )}
            </div>
          )}

          {/* Form */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            {isClosed ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <XCircle size={28} className="text-gray-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.icebreaker.closedTitle}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t.icebreaker.closedByHost}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.icebreaker.yourAnecdotes}
                </label>

                {drafts.map((draft, idx) => (
                  <div key={idx} className="flex gap-2">
                    <textarea
                      ref={idx === drafts.length - 1 ? lastInputRef : undefined}
                      value={draft}
                      onChange={(e) => updateDraft(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }
                      }}
                      placeholder={idx === 0 ? t.icebreaker.anecdoteMainPlaceholder : t.icebreaker.anotherAnecdote}
                      rows={2}
                      className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    {drafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        className="self-start mt-1 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addField}
                  className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Plus size={13} />
                  {t.icebreaker.addAnecdote}
                </button>

                {submitError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={drafts.every((d) => !d.trim()) || submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {submitting ? t.common.submitting : submitted.length > 0 ? t.icebreaker.sendMore : t.common.send}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-5">
            {t.icebreaker.anonymous}{" "}
            <Link href="/" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300">
              {t.icebreaker.learnMore}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
