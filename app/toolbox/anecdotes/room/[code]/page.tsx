"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Loader2, CheckCircle2, XCircle, Trophy, Clock,
} from "lucide-react";
import { Header } from "@/components/Header";

// ── Types ──────────────────────────────────────────────────────────────────────

interface RoomInfo {
  id: string;
  code: string;
  is_active: boolean;
  phase: string;
  participants: string[];
  creator_name: string | null;
}

interface VotingAnecdote {
  id: string;
  question: string;
  submitted_by?: string;
}

interface ResultItem {
  id: string;
  question: string;
  submitted_by: string;
  votes: { voter_name: string; guessed_participant: string }[];
  correct_count: number;
}

// ── Phase helper ───────────────────────────────────────────────────────────────

function parsePhase(phase: string): { type: "collecting" | "voting" | "reveal" | "results"; idx: number } {
  if (phase.startsWith("voting:")) return { type: "voting", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase.startsWith("reveal:")) return { type: "reveal", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase === "results") return { type: "results", idx: 0 };
  return { type: "collecting", idx: 0 };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RoomParticipantPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();

  // Room
  const [room, setRoom]       = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Name
  const [participantName, setParticipantName] = useState<string | null>(null);
  const [nameInput, setNameInput]             = useState("");
  const [savingName, setSavingName]           = useState(false);

  // Collecting
  const [myAnecdotes, setMyAnecdotes]     = useState<string[]>([]);
  const [draftAnecdote, setDraftAnecdote] = useState("");
  const [addingAnecdote, setAddingAnecdote] = useState(false);
  const [submittingAnecdote, setSubmittingAnecdote] = useState(false);

  // Voting
  const [votingAnecdotes, setVotingAnecdotes] = useState<VotingAnecdote[]>([]);
  const [myVotes, setMyVotes]                 = useState<Record<string, string>>({});
  const [hasVotedCurrent, setHasVotedCurrent] = useState(false);

  // Card animation
  const [cardFlipped, setCardFlipped]   = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);

  // Refs
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef<string>("");

  // Results
  const [results, setResults] = useState<ResultItem[]>([]);

  // ── Load from localStorage ────────────────────────────────────────────────────

  useEffect(() => {
    const storedName = localStorage.getItem(`icebreaker_name_${upperCode}`);
    if (storedName) {
      setParticipantName(storedName);
      // Always re-register in case the participant wasn't in room.participants
      // (e.g. localStorage restored from a previous visit, or DB update was skipped)
      fetch(`/api/icebreaker/room/${upperCode}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: storedName }),
      }).catch(() => { /* best-effort */ });
    }

    const storedVotes = localStorage.getItem(`votes_${upperCode}`);
    if (storedVotes) {
      try { setMyVotes(JSON.parse(storedVotes)); } catch { /* ignore */ }
    }

    const storedAnecdotes = localStorage.getItem(`anecdotes_${upperCode}`);
    if (storedAnecdotes) {
      try { setMyAnecdotes(JSON.parse(storedAnecdotes)); } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // ── Poll room ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    let prevPhase = "";

    async function fetchRoom() {
      const res = await fetch(`/api/icebreaker/room/${upperCode}`);
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json() as RoomInfo & { error?: string };
      if (data.error) { setNotFound(true); setLoading(false); return; }
      setRoom(data);
      setLoading(false);

      const phase = data.phase ?? "collecting";

      // Phase changed — reset voted state if new voting round
      if (phase !== prevPhase) {
        const { type: newType, idx: newIdx } = parsePhase(phase);
        const { type: oldType, idx: oldIdx } = parsePhase(prevPhase);

        // Fetch anecdotes on entering voting/reveal/results
        if (
          (newType === "voting" || newType === "reveal" || newType === "results") &&
          (newType !== oldType || newIdx !== oldIdx)
        ) {
          const aRes = await fetch(`/api/icebreaker/room/${upperCode}/anecdotes`);
          if (aRes.ok) {
            const aData = await aRes.json();
            if (Array.isArray(aData)) setVotingAnecdotes(aData);
          }
        }

        // Reset hasVotedCurrent on new voting round
        if (newType === "voting" && (oldType !== "voting" || newIdx !== oldIdx)) {
          setHasVotedCurrent(false);
        }

        // Fetch votes on results
        if (phase === "results") {
          const vRes = await fetch(`/api/icebreaker/room/${upperCode}/votes`);
          if (vRes.ok) {
            const vData = await vRes.json();
            if (Array.isArray(vData)) setResults(vData);
          }
        }

        prevPhase = phase;
      }
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 3000);
    return () => clearInterval(id);
  }, [upperCode]);

  // ── Card flip + timer effect ──────────────────────────────────────────────────

  useEffect(() => {
    if (!room) return;
    const phase = room.phase;
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const { type } = parsePhase(phase);

    if (type === "voting") {
      setCardFlipped(false);
      setTimerSeconds(30);
      setTimeout(() => setCardFlipped(true), 1000);

      let secs = 30;
      timerRef.current = setInterval(() => {
        secs -= 1;
        setTimerSeconds(secs);
        if (secs <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 1000);
    } else if (type === "reveal") {
      setCardFlipped(true);
    }

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.phase]);

  // ── Persist myVotes ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (Object.keys(myVotes).length > 0) {
      localStorage.setItem(`votes_${upperCode}`, JSON.stringify(myVotes));
    }
  }, [myVotes, upperCode]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function joinRoom(name: string) {
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

  async function submitAnecdote() {
    if (!draftAnecdote.trim()) return;
    // Capture le nom inline si pas encore enregistré
    let name = participantName;
    if (!name) {
      if (!nameInput.trim()) return;
      name = nameInput.trim();
      await joinRoom(name);
    }
    setSubmittingAnecdote(true);
    await fetch(`/api/icebreaker/room/${upperCode}/anecdotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: draftAnecdote.trim(), submitted_by: name }),
    });
    const updated = [...myAnecdotes, draftAnecdote.trim()];
    setMyAnecdotes(updated);
    localStorage.setItem(`anecdotes_${upperCode}`, JSON.stringify(updated));
    setDraftAnecdote("");
    setNameInput("");
    setAddingAnecdote(false);
    setSubmittingAnecdote(false);
  }

  async function vote(anecdoteId: string, guessedName: string) {
    if (!participantName) return;
    const updated = { ...myVotes, [anecdoteId]: guessedName };
    setMyVotes(updated);
    localStorage.setItem(`votes_${upperCode}`, JSON.stringify(updated));

    await fetch(`/api/icebreaker/room/${upperCode}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voter_name: participantName,
        votes: [{ anecdote_id: anecdoteId, guessed_participant: guessedName }],
      }),
    });
    setHasVotedCurrent(true);
  }

  function computeLeaderboard(): { name: string; score: number }[] {
    const scores: Record<string, number> = {};
    for (const item of results) {
      for (const v of item.votes) {
        if (!scores[v.voter_name]) scores[v.voter_name] = 0;
        if (v.guessed_participant === item.submitted_by) scores[v.voter_name] += 100;
      }
    }
    return Object.entries(scores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);
  }

  function computeMyScore(): number {
    return results.reduce((acc, item) => {
      const v = item.votes.find((v) => v.voter_name === participantName);
      return acc + (v?.guessed_participant === item.submitted_by ? 100 : 0);
    }, 0);
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────────

  if (notFound || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <XCircle size={36} className="text-red-400 mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Session introuvable</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ce lien est invalide ou a expiré.</p>
        </div>
      </div>
    );
  }

  // ── Closed room ───────────────────────────────────────────────────────────────

  if (!room.is_active) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <XCircle size={36} className="text-gray-400 mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Session terminée</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cette session est terminée.</p>
        </div>
      </div>
    );
  }

  const { type: phaseType, idx: phaseIdx } = parsePhase(room.phase);
  const currentAnecdote = votingAnecdotes[phaseIdx] ?? null;

  // ── Results ───────────────────────────────────────────────────────────────────

  if (phaseType === "results") {
    const leaderboard = computeLeaderboard();
    const myScore     = computeMyScore();
    const medals      = ["🥇", "🥈", "🥉"];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header currentTool={upperCode} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
          <div className="text-center mb-6">
            <Trophy size={40} className="text-amber-400 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Classement final</h1>
            {participantName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vous : <span className="font-semibold text-emerald-600 dark:text-emerald-400">{myScore} pts</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.name}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border ${
                  entry.name === participantName
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                    : idx === 0
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                }`}
              >
                <span className="text-xl w-8 text-center flex-shrink-0">
                  {idx < 3 ? medals[idx] : `${idx + 1}.`}
                </span>
                <span className="flex-1 font-medium text-gray-900 dark:text-white">{entry.name}</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {entry.score} pts
                </span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
                Aucun vote enregistré.
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Voting or Reveal ──────────────────────────────────────────────────────────

  if ((phaseType === "voting" || phaseType === "reveal") && currentAnecdote) {
    const myVoteForCurrent = myVotes[currentAnecdote.id];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header currentTool={upperCode} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col items-center">

          {/* Progress */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 self-start">
            Anecdote {phaseIdx + 1} / {votingAnecdotes.length}
          </p>

          {/* Card flip */}
          <div
            className="relative mb-8"
            style={{ width: 300, height: 190, perspective: 1200 }}
          >
            <div
              className="absolute inset-0 transition-transform duration-700"
              style={{
                transformStyle: "preserve-3d",
                transform: cardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Back */}
              <div
                className="absolute inset-0 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-5xl">🤫</span>
              </div>
              {/* Front */}
              <div
                className="absolute inset-0 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg flex flex-col items-center justify-center px-6 text-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-sm font-medium text-gray-800 dark:text-white leading-snug">
                  « {currentAnecdote.question} »
                </p>
                {phaseType === "reveal" && currentAnecdote.submitted_by && (
                  <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    → {currentAnecdote.submitted_by}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Voting controls */}
          {phaseType === "voting" && participantName !== null && (
            <div className="w-full space-y-4">
              {!hasVotedCurrent && !myVoteForCurrent ? (
                <>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                    À qui appartient cette anecdote ?
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {room.participants
                      .filter((name) => participantName !== null && name !== participantName)
                      .map((name) => (
                        <button
                          key={name}
                          onClick={() => vote(currentAnecdote.id, name)}
                          className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                        >
                          {name}
                        </button>
                      ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Vote enregistré pour {myVoteForCurrent ?? myVotes[currentAnecdote.id]}
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Clock size={13} className={timerSeconds <= 10 ? "text-red-400" : ""} />
                <span className={`font-mono ${timerSeconds <= 10 ? "text-red-400" : ""}`}>
                  {timerSeconds}s
                </span>
              </div>
            </div>
          )}

          {/* Reveal feedback */}
          {phaseType === "reveal" && currentAnecdote.submitted_by && (
            <div className="w-full space-y-4">
              {myVoteForCurrent ? (
                <div className={`rounded-xl border px-5 py-4 text-center ${
                  myVoteForCurrent === currentAnecdote.submitted_by
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                }`}>
                  {myVoteForCurrent === currentAnecdote.submitted_by ? (
                    <>
                      <CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-1" />
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                        Bonne réponse ! +100 pts
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle size={20} className="text-red-400 mx-auto mb-1" />
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        Dommage ! C&apos;était {currentAnecdote.submitted_by}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  C&apos;était {currentAnecdote.submitted_by}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1.5">
                <Loader2 size={11} className="animate-spin" />
                En attente de la prochaine anecdote…
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Collecting phase ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header currentTool={upperCode} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">

        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
            {participantName ? `Bonjour, ${participantName} 👋` : "Bienvenue 👋"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Soumettez vos anecdotes avant que le jeu commence.
          </p>
        </div>

        {/* Submitted anecdotes */}
        {myAnecdotes.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Vos anecdotes ({myAnecdotes.length})
              </span>
            </div>
            <ol className="divide-y divide-gray-50 dark:divide-gray-800">
              {myAnecdotes.map((text, i) => (
                <li key={i} className="px-5 py-3 flex items-start gap-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Add anecdote */}
        {addingAnecdote ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-4">
            {!participantName && (
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Votre prénom (Marie, Pierre…)"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
              />
            )}
            <textarea
              autoFocus={!!participantName}
              value={draftAnecdote}
              onChange={(e) => setDraftAnecdote(e.target.value)}
              placeholder="J'ai appris à jouer de la guitare à 40 ans…"
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={submitAnecdote}
                disabled={!draftAnecdote.trim() || (!participantName && !nameInput.trim()) || submittingAnecdote}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {submittingAnecdote && <Loader2 size={13} className="animate-spin" />}
                Envoyer
              </button>
              <button
                onClick={() => { setAddingAnecdote(false); setDraftAnecdote(""); setNameInput(""); }}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingAnecdote(true)}
            className="w-full py-3 mb-4 text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl hover:border-emerald-400 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors"
          >
            + Ajouter une anecdote
          </button>
        )}

        {/* Waiting */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500 py-4">
          <Loader2 size={13} className="animate-spin" />
          En attente du démarrage par l&apos;animateur…
        </div>
      </main>
    </div>
  );
}
