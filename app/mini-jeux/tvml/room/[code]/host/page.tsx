"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Play, Clock, Trophy, Check, X, HelpCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { QRShare } from "@/components/QRShare";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────────

interface RoomInfo {
  id: string;
  code: string;
  is_active: boolean;
  phase: string;
  participants: string[];
  creator_user_id: string;
  submitted_count: number;
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

function computeScores(results: ResultsItem[]): { name: string; guessing: number; bluffing: number; total: number }[] {
  const scores: Record<string, { guessing: number; bluffing: number }> = {};

  for (const item of results) {
    for (const v of item.votes) {
      if (!scores[v.voter_name]) scores[v.voter_name] = { guessing: 0, bluffing: 0 };
      if (v.guessed_lie_index === item.lie_index) {
        scores[v.voter_name].guessing += 100;
      }
    }
    // Owner gets +50 per person they fooled
    if (!scores[item.participant_name]) scores[item.participant_name] = { guessing: 0, bluffing: 0 };
    const fooled = item.votes.filter((v) => v.guessed_lie_index !== item.lie_index).length;
    scores[item.participant_name].bluffing += fooled * 50;
  }

  return Object.entries(scores)
    .map(([name, s]) => ({ name, guessing: s.guessing, bluffing: s.bluffing, total: s.guessing + s.bluffing }))
    .sort((a, b) => b.total - a.total);
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TvmlHostPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const upperCode = (code as string).toUpperCase();

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/mini-jeux/tvml/room/${upperCode}`
    : "";

  const [userId, setUserId]     = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>("");

  // Host self-submission form
  const [showHostForm, setShowHostForm]       = useState(false);
  const [hs1, setHs1]                         = useState("");
  const [hs2, setHs2]                         = useState("");
  const [hs3, setHs3]                         = useState("");
  const [hostLieIndex, setHostLieIndex]       = useState<1 | 2 | 3 | null>(null);
  const [submittingHost, setSubmittingHost]   = useState(false);

  const [room, setRoom]               = useState<RoomInfo | null>(null);
  const [statements, setStatements]   = useState<Statement[]>([]);
  const [currentVotes, setCurrentVotes] = useState<VoteRow[]>([]);
  const [results, setResults]         = useState<ResultsItem[]>([]);
  const [loading, setLoading]         = useState(true);

  const [isStarting, setIsStarting]   = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  // Host votes (persisted locally like participant)
  const [myVotesLocal, setMyVotesLocal] = useState<Record<string, number>>({});

  const [timerSeconds, setTimerSeconds] = useState(30);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef<string>("");

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/mini-jeux", label: "Mini-jeux" },
    { href: "/mini-jeux/tvml", label: "2 Vérités 1 Mensonge" },
    { label: upperCode },
  ];

  // ── Auth ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);
      // Fetch host display name from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();
      if (profile?.first_name) setHostName(profile.first_name as string);
    });
  }, [router]);

  // ── Fetch ─────────────────────────────────────────────────────────────────────

  async function fetchData() {
    const [roomRes, stmtRes] = await Promise.all([
      fetch(`/api/tvml/room/${upperCode}`),
      fetch(`/api/tvml/room/${upperCode}/statements?host=1`),
    ]);

    if (roomRes.status === 403 || roomRes.status === 404) {
      router.replace("/mini-jeux/tvml");
      return;
    }

    if (roomRes.ok) {
      const roomData: RoomInfo = await roomRes.json();
      setRoom(roomData);

      const phase = roomData.phase ?? "collecting";
      const { type: phaseType } = parsePhase(phase);

      if (phaseType === "voting" || phaseType === "reveal") {
        const votesRes = await fetch(`/api/tvml/room/${upperCode}/votes`);
        if (votesRes.ok) {
          const vData = await votesRes.json();
          if (Array.isArray(vData)) setCurrentVotes(vData);
        }
      }

      if (phaseType === "results") {
        const votesRes = await fetch(`/api/tvml/room/${upperCode}/votes?phase=results`);
        if (votesRes.ok) {
          const vData = await votesRes.json();
          if (Array.isArray(vData)) setResults(vData);
        }
      }
    }

    if (stmtRes.ok) {
      const sData = await stmtRes.json();
      if (Array.isArray(sData)) setStatements(sData);
    }

    setLoading(false);
  }

  // ── Poll ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Timer ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!room) return;
    const phase = room.phase;
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const { type, idx } = parsePhase(phase);

    if (type === "voting") {
      setTimerSeconds(30);
      let secs = 30;
      timerRef.current = setInterval(() => {
        secs -= 1;
        setTimerSeconds(secs);
        if (secs <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          advancePhase(`reveal:${idx}`);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.phase]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function advancePhase(newPhase: string): Promise<boolean> {
    const res = await fetch(`/api/tvml/room/${upperCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: newPhase }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string };
      setAdvanceError(json.error ?? "Erreur lors du changement de phase");
      return false;
    }
    setAdvanceError(null);
    await fetchData();
    return true;
  }

  async function startGame() {
    setIsStarting(true);
    setAdvanceError(null);
    await advancePhase("voting:0");
    setIsStarting(false);
  }

  async function nextStatement() {
    if (!room) return;
    const { idx } = parsePhase(room.phase);
    if (idx + 1 >= statements.length) {
      await advancePhase("results");
    } else {
      await advancePhase(`voting:${idx + 1}`);
    }
  }

  async function submitHostStatements() {
    if (!hostName || !hs1.trim() || !hs2.trim() || !hs3.trim() || !hostLieIndex) return;
    setSubmittingHost(true);

    try {
      // 1. Register host as participant
      await fetch(`/api/tvml/room/${upperCode}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: hostName }),
      });

      // 2. Submit statements
      const res = await fetch(`/api/tvml/room/${upperCode}/statements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: hostName,
          statement1: hs1.trim(),
          statement2: hs2.trim(),
          statement3: hs3.trim(),
          lieIndex: hostLieIndex,
        }),
      });

      if (res.ok) {
        setShowHostForm(false);
        setHs1(""); setHs2(""); setHs3(""); setHostLieIndex(null);
        await fetchData();
      }
    } finally {
      setSubmittingHost(false);
    }
  }

  async function castVote(statementsId: string, guessedLieIndex: number) {
    if (!hostName) return;
    const updated = { ...myVotesLocal, [statementsId]: guessedLieIndex };
    setMyVotesLocal(updated);
    await fetch(`/api/tvml/room/${upperCode}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterName: hostName, statementsId, guessedLieIndex }),
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Session introuvable ou accès refusé.
        </div>
      </div>
    );
  }

  const { type: phaseType, idx: phaseIdx } = parsePhase(room.phase);
  const currentStatement = statements[phaseIdx] ?? null;

  // ── Results ───────────────────────────────────────────────────────────────────

  if (phaseType === "results") {
    const leaderboard = computeScores(results);
    const medals = ["🥇", "🥈", "🥉"];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
          <div className="text-center mb-8">
            <Trophy size={40} className="text-amber-400 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classement final</h1>
          </div>

          <div className="space-y-2 mb-8">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.name}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border ${
                  i === 0
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                }`}
              >
                <span className="text-xl w-8 text-center flex-shrink-0">
                  {i < 3 ? medals[i] : `${i + 1}.`}
                </span>
                <span className="flex-1 font-medium text-gray-900 dark:text-white">{entry.name}</span>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <span title="Points devinés">{entry.guessing} devinés</span>
                  <span title="Points bluff">{entry.bluffing} bluff</span>
                </div>
                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 ml-2">
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

          <div className="text-center">
            <Link
              href="/mini-jeux/tvml"
              className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
            >
              ← Retour aux sessions
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Voting or Reveal ──────────────────────────────────────────────────────────

  if ((phaseType === "voting" || phaseType === "reveal") && !currentStatement) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement des déclarations…
        </div>
      </div>
    );
  }

  if ((phaseType === "voting" || phaseType === "reveal") && currentStatement) {
    const statementTexts = [
      currentStatement.statement_1,
      currentStatement.statement_2,
      currentStatement.statement_3,
    ];
    const lieIndex = currentStatement.lie_index; // Only present during reveal (from host endpoint)
    const correctVotes = currentVotes.filter((v) => v.guessed_lie_index === lieIndex).length;
    const isMyTurn = hostName !== "" && currentStatement.participant_name === hostName;
    const myVoteForCurrent = myVotesLocal[currentStatement.id];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col">

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            Participant {phaseIdx + 1} / {statements.length}
          </p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {phaseType === "voting"
              ? `Devinez le mensonge de ${currentStatement.participant_name}`
              : `Révélation — ${currentStatement.participant_name}`}
          </h2>

          {/* My turn indicator */}
          {isMyTurn && phaseType === "voting" && (
            <div className="bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl px-5 py-4 mb-6 text-center">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                C&apos;est votre tour ! Les participants devinent votre mensonge 🤫
              </p>
            </div>
          )}

          {/* 3 Statement cards */}
          <div className="space-y-3 mb-6">
            {statementTexts.map((text, i) => {
              const num = i + 1;
              const isLie = lieIndex === num;
              const isTruth = lieIndex !== undefined && lieIndex !== num;
              const isSelected = myVoteForCurrent === num;

              let cardClass = "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800";
              if (phaseType === "reveal" && isLie) {
                cardClass = "bg-red-50 dark:bg-red-950/40 border border-red-400";
              } else if (phaseType === "reveal" && isTruth) {
                cardClass = "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400";
              } else if (phaseType === "voting" && !isMyTurn && isSelected) {
                cardClass = "bg-violet-50 dark:bg-violet-950/40 border border-violet-400";
              }

              // Votes for this option
              const optionVotes = currentVotes.filter((v) => v.guessed_lie_index === num);

              const canVote = phaseType === "voting" && !isMyTurn;

              return (
                <div
                  key={num}
                  onClick={() => canVote && castVote(currentStatement.id, num)}
                  className={`rounded-2xl px-5 py-4 ${cardClass} ${canVote ? "cursor-pointer hover:border-violet-400 transition-colors" : ""}`}
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
                  {optionVotes.length > 0 && (
                    <div className="mt-2 ml-10 flex flex-wrap gap-1">
                      {optionVotes.map((v) => (
                        <span
                          key={v.id}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            phaseType === "reveal" && v.guessed_lie_index === lieIndex
                              ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                              : phaseType === "reveal"
                              ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {v.voter_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Host vote status */}
          {phaseType === "voting" && !isMyTurn && myVoteForCurrent && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 mb-4">
              <Check size={15} className="text-emerald-500" />
              Votre vote : déclaration {myVoteForCurrent} — vous pouvez changer
            </div>
          )}

          {/* Reveal result for host */}
          {phaseType === "reveal" && !isMyTurn && lieIndex && (
            <div className={`rounded-xl border px-5 py-3 text-center mb-4 ${
              myVoteForCurrent === lieIndex
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                : myVoteForCurrent
                ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            }`}>
              {myVoteForCurrent === lieIndex ? (
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">✅ Vous avez trouvé ! +100 pts</p>
              ) : myVoteForCurrent ? (
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">❌ Raté ! C&apos;était la déclaration {lieIndex}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Vous n&apos;avez pas voté — c&apos;était la déclaration {lieIndex}</p>
              )}
            </div>
          )}


          {/* Controls */}
          {phaseType === "voting" && (
            <div className="flex flex-col items-center gap-4 mt-auto">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={15} className={timerSeconds <= 10 ? "text-red-500" : "text-gray-400"} />
                <span className={`font-mono font-semibold ${timerSeconds <= 10 ? "text-red-500" : "text-gray-600 dark:text-gray-400"}`}>
                  {timerSeconds}s
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">
                  · {currentVotes.length} vote{currentVotes.length !== 1 ? "s" : ""}
                </span>
              </div>
              {advanceError && <p className="text-xs text-red-500">{advanceError}</p>}
              <button
                onClick={() => advancePhase(`reveal:${phaseIdx}`)}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
              >
                Révéler →
              </button>
            </div>
          )}

          {phaseType === "reveal" && (
            <div className="flex flex-col items-center gap-4 mt-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{correctVotes}</span>
                {" "}joueur{correctVotes !== 1 ? "s" : ""} ont trouvé le mensonge
              </p>
              {advanceError && <p className="text-xs text-red-500">{advanceError}</p>}
              <button
                onClick={nextStatement}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                {phaseIdx + 1 >= statements.length ? "Voir les scores 🏆" : "Participant suivant →"}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Collecting phase ──────────────────────────────────────────────────────────

  const submittedNames = statements.map((s) => s.participant_name);
  const uniqueParticipants = new Set(statements.map((s) => s.participant_name)).size;
  const canStart = statements.length >= 2 && uniqueParticipants >= 2;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">

        {/* Share block */}
        <div className="mb-6">
          <QRShare
            url={shareUrl}
            label="Partagez ce lien aux participants"
            filename={`2v1m-${upperCode}`}
            wrapperCls="bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900"
            labelCls="text-violet-700 dark:text-violet-300"
            urlCls="text-violet-800 dark:text-violet-200"
            copyBtnCls="bg-white dark:bg-violet-900 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-800"
          />
        </div>

        {/* Participants status */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              Joueurs — {room.participants.length} inscrits, {statements.length} ont soumis
            </span>
          </div>

          {room.participants.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              En attente des participants…
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {room.participants.map((name) => {
                const submitted = submittedNames.includes(name);
                return (
                  <li key={name} className="px-5 py-3 flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      submitted
                        ? "bg-emerald-100 dark:bg-emerald-900"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      {submitted
                        ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                        : <HelpCircle size={12} className="text-gray-400" />
                      }
                    </div>
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{name}</span>
                    <span className={`text-xs ${submitted ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}>
                      {submitted ? "Soumis" : "En attente"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Host self-submission */}
        {hostName && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                Vos déclarations ({hostName})
              </span>
              {submittedNames.includes(hostName) ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check size={12} /> Soumises
                </span>
              ) : !showHostForm ? (
                <button
                  onClick={() => setShowHostForm(true)}
                  className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                >
                  + Ajouter mes déclarations
                </button>
              ) : null}
            </div>

            {!submittedNames.includes(hostName) && showHostForm && (
              <div className="px-5 py-4 space-y-4">
                {/* 3 statement inputs */}
                {([
                  { label: "Déclaration 1", value: hs1, setter: setHs1 },
                  { label: "Déclaration 2", value: hs2, setter: setHs2 },
                  { label: "Déclaration 3", value: hs3, setter: setHs3 },
                ] as { label: string; value: string; setter: (v: string) => void }[]).map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder="Écrivez votre déclaration…"
                      maxLength={200}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                ))}

                {/* Lie selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Quelle est votre déclaration mensongère ?
                  </label>
                  <div className="flex gap-2">
                    {([1, 2, 3] as (1 | 2 | 3)[]).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setHostLieIndex(n)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                          hostLieIndex === n
                            ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                            : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {hostLieIndex && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      La déclaration {hostLieIndex} est votre mensonge.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowHostForm(false); setHs1(""); setHs2(""); setHs3(""); setHostLieIndex(null); }}
                    className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={submitHostStatements}
                    disabled={!hs1.trim() || !hs2.trim() || !hs3.trim() || !hostLieIndex || submittingHost}
                    className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
                  >
                    {submittingHost && <Loader2 size={14} className="animate-spin" />}
                    {submittingHost ? "Envoi…" : "Soumettre"}
                  </button>
                </div>
              </div>
            )}

            {submittedNames.includes(hostName) && (
              <div className="px-5 py-3 text-xs text-emerald-600 dark:text-emerald-400">
                Vos déclarations sont enregistrées et seront jouées avec celles des participants.
              </div>
            )}
          </div>
        )}

        {/* Start button */}
        <div className="flex flex-col items-end gap-2">
          {!canStart && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Il faut au moins 2 participants ayant soumis leurs déclarations pour démarrer.
            </p>
          )}
          {advanceError && (
            <p className="text-xs text-red-500 dark:text-red-400">{advanceError}</p>
          )}
          <button
            onClick={startGame}
            disabled={!canStart || isStarting}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            {isStarting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {isStarting ? "Démarrage…" : "Démarrer le jeu"}
          </button>
        </div>
      </main>
    </div>
  );
}
