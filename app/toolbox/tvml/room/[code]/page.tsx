"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Loader2, Trophy, Clock, Check, X, XCircle,
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

interface Statement {
  id: string;
  participant_name: string;
  statement_1: string;
  statement_2: string;
  statement_3: string;
  lie_index?: number;
  created_at: string;
}

interface VoteRow {
  id: string;
  statements_id: string;
  voter_name: string;
  guessed_lie_index: number;
}

interface ResultsItem {
  statements_id: string;
  participant_name: string;
  lie_index: number;
  votes: VoteRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parsePhase(phase: string): { type: "collecting" | "voting" | "reveal" | "results"; idx: number } {
  if (phase.startsWith("voting:")) return { type: "voting", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase.startsWith("reveal:")) return { type: "reveal", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase === "results") return { type: "results", idx: 0 };
  return { type: "collecting", idx: 0 };
}

function computeScores(results: ResultsItem[]): { name: string; total: number }[] {
  const scores: Record<string, number> = {};
  for (const item of results) {
    for (const v of item.votes) {
      if (!scores[v.voter_name]) scores[v.voter_name] = 0;
      if (v.guessed_lie_index === item.lie_index) scores[v.voter_name] += 100;
    }
    if (!scores[item.participant_name]) scores[item.participant_name] = 0;
    const fooled = item.votes.filter((v) => v.guessed_lie_index !== item.lie_index).length;
    scores[item.participant_name] += fooled * 50;
  }
  return Object.entries(scores)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TvmlParticipantPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();

  // Room
  const [room, setRoom]         = useState<RoomInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Participant
  const [participantName, setParticipantName] = useState<string | null>(null);
  const [nameInput, setNameInput]             = useState("");
  const [savingName, setSavingName]           = useState(false);
  const [joinError, setJoinError]             = useState<string | null>(null);

  // Statements
  const [statements, setStatements]   = useState<Statement[]>([]);
  const [submitted, setSubmitted]     = useState(false);
  const [draft1, setDraft1]           = useState("");
  const [draft2, setDraft2]           = useState("");
  const [draft3, setDraft3]           = useState("");
  const [lieChoice, setLieChoice]     = useState<1 | 2 | 3 | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Voting
  const [myVotesLocal, setMyVotesLocal] = useState<Record<string, number>>({});
  const [timerSeconds, setTimerSeconds] = useState(30);

  // Results
  const [results, setResults] = useState<ResultsItem[]>([]);

  // Refs
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef<string>("");

  // ── LocalStorage ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const storedName = localStorage.getItem(`tvml_name_${upperCode}`);
    if (storedName) {
      // Always re-register on restore: the previous registration may have
      // failed (e.g. the .not() Supabase bug) or the room may have been
      // recreated. The participants API is idempotent — safe to call twice.
      fetch(`/api/tvml/room/${upperCode}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: storedName }),
      }).then((res) => {
        if (res.ok) {
          setParticipantName(storedName);
        } else {
          // Registration rejected (session closed, etc.) — clear stale entry
          localStorage.removeItem(`tvml_name_${upperCode}`);
          localStorage.removeItem(`tvml_submitted_${upperCode}`);
        }
      }).catch(() => {
        // Network error — still restore name optimistically
        setParticipantName(storedName);
      });
    }

    const storedSubmitted = localStorage.getItem(`tvml_submitted_${upperCode}`);
    if (storedSubmitted === "1") setSubmitted(true);

    const storedVotes = localStorage.getItem(`tvml_votes_${upperCode}`);
    if (storedVotes) {
      try { setMyVotesLocal(JSON.parse(storedVotes)); } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // ── Poll room ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    let prevPhase = "";

    async function fetchRoom() {
      const res = await fetch(`/api/tvml/room/${upperCode}`);
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json() as RoomInfo & { error?: string };
      if (data.error) { setNotFound(true); setLoading(false); return; }
      setRoom(data);
      setLoading(false);

      const phase = data.phase ?? "collecting";

      if (phase !== prevPhase) {
        const { type: newType, idx: newIdx } = parsePhase(phase);
        const { type: oldType, idx: oldIdx } = parsePhase(prevPhase);

        // Fetch statements when entering voting/reveal
        if (
          (newType === "voting" || newType === "reveal" || newType === "results") &&
          (newType !== oldType || newIdx !== oldIdx)
        ) {
          const sRes = await fetch(`/api/tvml/room/${upperCode}/statements`);
          if (sRes.ok) {
            const sData = await sRes.json();
            if (Array.isArray(sData)) setStatements(sData);
          }
        }

        // Fetch results data
        if (phase === "results") {
          const vRes = await fetch(`/api/tvml/room/${upperCode}/votes?phase=results`);
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

  // ── Timer ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!room) return;
    const phase = room.phase;
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const { type } = parsePhase(phase);

    if (type === "voting") {
      setTimerSeconds(30);
      let secs = 30;
      timerRef.current = setInterval(() => {
        secs -= 1;
        setTimerSeconds(secs);
        if (secs <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.phase]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function joinRoom() {
    const name = nameInput.trim();
    if (!name) return;
    setSavingName(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/tvml/room/${upperCode}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        setJoinError(json.error ?? "Impossible de rejoindre la session.");
        setSavingName(false);
        return;
      }

      localStorage.setItem(`tvml_name_${upperCode}`, name);
      setParticipantName(name);
    } catch {
      setJoinError("Une erreur réseau est survenue.");
    }

    setSavingName(false);
  }

  async function submitStatements() {
    if (!participantName || !draft1.trim() || !draft2.trim() || !draft3.trim() || !lieChoice) return;
    setSubmitting(true);
    setSubmitError(null);

    const res = await fetch(`/api/tvml/room/${upperCode}/statements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantName,
        statement1: draft1.trim(),
        statement2: draft2.trim(),
        statement3: draft3.trim(),
        lieIndex: lieChoice,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string };
      setSubmitError(json.error ?? "Erreur lors de l'envoi");
      setSubmitting(false);
      return;
    }

    localStorage.setItem(`tvml_submitted_${upperCode}`, "1");
    setSubmitted(true);
    setSubmitting(false);
  }

  async function castVote(statementsId: string, guessedLieIndex: number) {
    if (!participantName) return;

    const updated = { ...myVotesLocal, [statementsId]: guessedLieIndex };
    setMyVotesLocal(updated);
    localStorage.setItem(`tvml_votes_${upperCode}`, JSON.stringify(updated));

    await fetch(`/api/tvml/room/${upperCode}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voterName: participantName,
        statementsId,
        guessedLieIndex,
      }),
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

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
  const currentStatement = statements[phaseIdx] ?? null;

  // ── Name registration screen ──────────────────────────────────────────────────

  if (!participantName) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header currentTool="2 Vérités 1 Mensonge" />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🤫</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                2 Vérités 1 Mensonge
              </h1>
              {room.creator_name && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Session animée par {room.creator_name}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Votre prénom
              </label>
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") joinRoom(); }}
                placeholder="Marie, Pierre…"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
              />
              {joinError && (
                <p className="text-xs text-red-500 dark:text-red-400 mb-3">{joinError}</p>
              )}
              <button
                onClick={joinRoom}
                disabled={!nameInput.trim() || savingName}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {savingName ? <Loader2 size={14} className="animate-spin" /> : null}
                Rejoindre
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────────

  if (phaseType === "results") {
    const leaderboard = computeScores(results);
    const medals = ["🥇", "🥈", "🥉"];
    const myEntry = leaderboard.find((e) => e.name === participantName);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header currentTool={upperCode} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
          <div className="text-center mb-6">
            <Trophy size={40} className="text-amber-400 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Classement final</h1>
            {myEntry && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vous : <span className="font-semibold text-violet-600 dark:text-violet-400">{myEntry.total} pts</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.name}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border ${
                  entry.name === participantName
                    ? "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800"
                    : i === 0
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                }`}
              >
                <span className="text-xl w-8 text-center flex-shrink-0">
                  {i < 3 ? medals[i] : `${i + 1}.`}
                </span>
                <span className="flex-1 font-medium text-gray-900 dark:text-white">{entry.name}</span>
                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  {entry.total} pts
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

  if ((phaseType === "voting" || phaseType === "reveal") && currentStatement) {
    const isMyTurn = currentStatement.participant_name === participantName;
    const myVoteForCurrent = myVotesLocal[currentStatement.id];
    const lieIndex = currentStatement.lie_index;
    const statementTexts = [
      currentStatement.statement_1,
      currentStatement.statement_2,
      currentStatement.statement_3,
    ];

    // My fooled count (reveal phase, my own statements)
    const myFooled = phaseType === "reveal" && isMyTurn && lieIndex
      ? 0 // We don&apos;t have vote breakdown here (only host does in full), handled by poll
      : 0;
    void myFooled; // Used via results data on reveal

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header currentTool={upperCode} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col">

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Participant {phaseIdx + 1} / {statements.length}
          </p>

          {/* My turn indicator */}
          {isMyTurn && (
            <div className="bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl px-5 py-4 mb-6 text-center">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                C&apos;est votre tour ! Les autres devinent votre mensonge 🤫
              </p>
              <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">
                En attente de la révélation par l&apos;animateur…
              </p>
            </div>
          )}

          {/* Statement cards */}
          {!isMyTurn && (
            <>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">
                {phaseType === "voting"
                  ? `Quel est le mensonge de ${currentStatement.participant_name} ?`
                  : `Les déclarations de ${currentStatement.participant_name}`}
              </h2>

              <div className="space-y-3 mb-6">
                {statementTexts.map((text, i) => {
                  const num = (i + 1) as 1 | 2 | 3;
                  const isSelected = myVoteForCurrent === num;
                  const isLie = lieIndex === num;
                  const isTruth = lieIndex !== undefined && lieIndex !== num;

                  let cardClass = "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800";
                  if (phaseType === "reveal" && isLie) {
                    cardClass = "bg-red-50 dark:bg-red-950/40 border border-red-400";
                  } else if (phaseType === "reveal" && isTruth) {
                    cardClass = "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400";
                  } else if (phaseType === "voting" && isSelected) {
                    cardClass = "bg-violet-50 dark:bg-violet-950/40 border border-violet-400";
                  }

                  return (
                    <button
                      key={num}
                      disabled={phaseType === "reveal"}
                      onClick={() => phaseType === "voting" && castVote(currentStatement.id, num)}
                      className={`w-full text-left rounded-2xl px-5 py-4 transition-all ${cardClass} ${
                        phaseType === "voting" ? "hover:border-violet-400 cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected && phaseType === "voting"
                            ? "bg-violet-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}>
                          {num}
                        </span>
                        <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-snug pt-1">
                          {text}
                        </p>
                        {phaseType === "reveal" && (
                          <span className="flex-shrink-0 ml-2">
                            {isLie ? (
                              <X size={16} className="text-red-500" />
                            ) : (
                              <Check size={16} className="text-emerald-500" />
                            )}
                          </span>
                        )}
                      </div>
                      {phaseType === "reveal" && (
                        <div className="mt-2 ml-10 text-xs font-medium">
                          {isLie ? (
                            <span className="text-red-600 dark:text-red-400">❌ Mensonge</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">✅ Vrai</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Voting status */}
              {phaseType === "voting" && myVoteForCurrent && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                  <Check size={15} className="text-emerald-500" />
                  Vous avez voté pour la déclaration {myVoteForCurrent} — vous pouvez changer
                </div>
              )}

              {/* Reveal result */}
              {phaseType === "reveal" && lieIndex && (
                <div className={`rounded-xl border px-5 py-4 text-center mb-4 ${
                  myVoteForCurrent === lieIndex
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                    : myVoteForCurrent
                    ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                }`}>
                  {myVoteForCurrent === lieIndex ? (
                    <>
                      <Check size={20} className="text-emerald-500 mx-auto mb-1" />
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                        Bravo ! +100 pts
                      </p>
                    </>
                  ) : myVoteForCurrent ? (
                    <>
                      <X size={20} className="text-red-400 mx-auto mb-1" />
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        Raté ! 😅 C&apos;était la déclaration {lieIndex}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Vous n&apos;avez pas voté — le mensonge était la déclaration {lieIndex}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Timer */}
          {phaseType === "voting" && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-auto pt-4">
              <Clock size={13} className={timerSeconds <= 10 ? "text-red-400" : ""} />
              <span className={`font-mono ${timerSeconds <= 10 ? "text-red-400" : ""}`}>
                {timerSeconds}s
              </span>
            </div>
          )}

          {phaseType === "reveal" && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1.5 mt-auto pt-4">
              <Loader2 size={11} className="animate-spin" />
              En attente du participant suivant…
            </p>
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
            Bonjour, {participantName} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Entrez vos 2 vérités et 1 mensonge avant que le jeu commence.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-5 py-6 text-center">
            <Check size={24} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Vos déclarations ont bien été enregistrées !
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              En attente des autres joueurs…
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-emerald-600 dark:text-emerald-500">
              <Loader2 size={11} className="animate-spin" />
              En attente du démarrage par l&apos;animateur
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            {/* Statement inputs */}
            {[
              { label: "Déclaration 1", value: draft1, setter: setDraft1 },
              { label: "Déclaration 2", value: draft2, setter: setDraft2 },
              { label: "Déclaration 3", value: draft3, setter: setDraft3 },
            ].map(({ label, value, setter }, i) => (
              <div key={i}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {label}
                </label>
                <textarea
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={i === 0 ? "J'ai grandi à l'étranger…" : i === 1 ? "Je parle 3 langues…" : "J'ai fait du saut à l'élastique…"}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
            ))}

            {/* Lie selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Quelle est le mensonge ?
              </label>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setLieChoice(n)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
                      lieChoice === n
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-400"
                    }`}
                  >
                    Déclaration {n}
                  </button>
                ))}
              </div>
            </div>

            {submitError && (
              <p className="text-xs text-red-500 dark:text-red-400">{submitError}</p>
            )}

            <button
              onClick={submitStatements}
              disabled={
                !draft1.trim() || !draft2.trim() || !draft3.trim() || !lieChoice || submitting
              }
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Envoyer mes déclarations
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
