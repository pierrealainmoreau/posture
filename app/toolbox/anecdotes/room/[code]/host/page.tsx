"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Play, Trash2, Clock, Trophy,
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
}

interface Anecdote {
  id: string;
  question: string;
  submitted_by: string | null;
  is_approved: boolean;
}

interface ResultItem {
  id: string;
  question: string;
  submitted_by: string;
  votes: { voter_name: string; guessed_participant: string }[];
  correct_count: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parsePhase(phase: string): { type: "collecting" | "voting" | "reveal" | "results"; idx: number } {
  if (phase.startsWith("voting:")) return { type: "voting", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase.startsWith("reveal:")) return { type: "reveal", idx: parseInt(phase.split(":")[1] ?? "0", 10) };
  if (phase === "results") return { type: "results", idx: 0 };
  return { type: "collecting", idx: 0 };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HostPage() {
  const { code } = useParams<{ code: string }>();
  const router   = useRouter();
  const upperCode = (code as string).toUpperCase();

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/toolbox/anecdotes/room/${upperCode}`
    : "";

  // Auth
  const [userId, setUserId]   = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>("");

  // Core data
  const [room, setRoom]           = useState<RoomInfo | null>(null);
  const [anecdotes, setAnecdotes] = useState<Anecdote[]>([]);
  const [loading, setLoading]     = useState(true);

  // Anecdote submission
  const [addingAnecdote, setAddingAnecdote]     = useState(false);
  const [draftAnecdote, setDraftAnecdote]       = useState("");
  const [submittingAnecdote, setSubmittingAnecdote] = useState(false);

  // Card animation
  const [cardFlipped, setCardFlipped]   = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);

  // Refs
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef<string>("");

  // Results
  const [results, setResults] = useState<ResultItem[]>([]);

  // Start game
  const [isStarting, setIsStarting]     = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  // ── Breadcrumbs ──────────────────────────────────────────────────────────────

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/anecdotes", label: "Anecdotes" },
    { label: upperCode },
  ];

  // ── Auth effect ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();
      setHostName(profile?.first_name ?? "");
    });
  }, [router]);

  // ── Fetch data ────────────────────────────────────────────────────────────────

  async function fetchData() {
    const [roomRes, anecdotesRes] = await Promise.all([
      fetch(`/api/icebreaker/room/${upperCode}`),
      fetch(`/api/icebreaker/room/${upperCode}/anecdotes`),
    ]);

    if (roomRes.status === 403) { router.replace("/toolbox/anecdotes"); return; }

    if (roomRes.ok) {
      const roomData: RoomInfo = await roomRes.json();
      setRoom(roomData);

      if (roomData.phase === "results") {
        const votesRes = await fetch(`/api/icebreaker/room/${upperCode}/votes`);
        if (votesRes.ok) {
          const data = await votesRes.json();
          if (Array.isArray(data)) setResults(data);
        }
      }
    }
    if (anecdotesRes.ok) setAnecdotes(await anecdotesRes.json());
    setLoading(false);
  }

  // ── Poll effect ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Timer + flip effect ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!room) return;
    const phase = room.phase;
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const { type, idx } = parsePhase(phase);

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
          advancePhase(`reveal:${idx}`);
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

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function advancePhase(newPhase: string): Promise<boolean> {
    const res = await fetch(`/api/icebreaker/room/${upperCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: newPhase }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
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
    if (hostName) {
      await fetch(`/api/icebreaker/room/${upperCode}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: hostName }),
      });
    }
    await advancePhase("voting:0");
    setIsStarting(false);
  }

  async function nextAnecdote() {
    if (!room) return;
    const { idx } = parsePhase(room.phase);
    const approved = anecdotes.filter((a) => a.is_approved);
    if (idx + 1 >= approved.length) {
      await advancePhase("results");
    } else {
      await advancePhase(`voting:${idx + 1}`);
    }
  }

  async function submitAnecdote() {
    if (!draftAnecdote.trim()) return;
    setSubmittingAnecdote(true);
    await fetch(`/api/icebreaker/room/${upperCode}/anecdotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: draftAnecdote.trim(), submitted_by: hostName }),
    });
    setDraftAnecdote("");
    setAddingAnecdote(false);
    setSubmittingAnecdote(false);
    await fetchData();
  }

  async function deleteAnecdote(id: string) {
    await fetch(`/api/icebreaker/room/${upperCode}/anecdotes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anecdote_id: id }),
    });
    await fetchData();
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

  // ── Loading state ─────────────────────────────────────────────────────────────

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
  const approved = anecdotes.filter((a) => a.is_approved);
  const currentAnecdote = approved[phaseIdx] ?? null;

  // ── Results phase ─────────────────────────────────────────────────────────────

  if (phaseType === "results") {
    const leaderboard = computeLeaderboard();
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
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.name}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border ${
                  idx === 0
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

          <div className="text-center">
            <Link
              href="/toolbox/anecdotes"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Retour aux sessions
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Voting or Reveal phase ────────────────────────────────────────────────────

  // Phase active mais anecdote pas encore chargée → spinner
  if ((phaseType === "voting" || phaseType === "reveal") && !currentAnecdote) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement de l&apos;anecdote…
        </div>
      </div>
    );
  }

  if ((phaseType === "voting" || phaseType === "reveal") && currentAnecdote) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col items-center">

          {/* Progress */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 self-start">
            Anecdote {phaseIdx + 1} / {approved.length}
          </p>

          {/* Card flip */}
          <div
            className="relative mb-8"
            style={{ width: 320, height: 200, perspective: 1200 }}
          >
            <div
              className="absolute inset-0 transition-transform duration-700"
              style={{
                transformStyle: "preserve-3d",
                transform: cardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Back (emerald) */}
              <div
                className="absolute inset-0 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-5xl">🤫</span>
              </div>
              {/* Front (white) */}
              <div
                className="absolute inset-0 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg flex flex-col items-center justify-center px-6 text-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-base font-medium text-gray-800 dark:text-white leading-snug">
                  « {currentAnecdote.question} »
                </p>
                {phaseType === "reveal" && currentAnecdote.submitted_by && (
                  <p className="mt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    → {currentAnecdote.submitted_by}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Voting controls */}
          {phaseType === "voting" && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={15} className={timerSeconds <= 10 ? "text-red-500" : "text-gray-400"} />
                <span className={`font-mono font-semibold ${timerSeconds <= 10 ? "text-red-500" : "text-gray-600 dark:text-gray-400"}`}>
                  {timerSeconds}s
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {room.participants.length} participant{room.participants.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => advancePhase(`reveal:${phaseIdx}`)}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Révéler →
              </button>
            </div>
          )}

          {/* Reveal controls */}
          {phaseType === "reveal" && (
            <div className="w-full flex flex-col items-center gap-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Bonne réponse : {currentAnecdote.submitted_by}
              </p>
              <button
                onClick={nextAnecdote}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                {phaseIdx + 1 >= approved.length ? "Voir les scores 🏆" : "Anecdote suivante →"}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Collecting phase ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">

        {/* Share block */}
        <div className="mb-6">
          <QRShare
            url={shareUrl}
            label="Partagez ce lien aux participants"
            filename={`anecdotes-${upperCode}`}
            wrapperCls="bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900"
            labelCls="text-blue-700 dark:text-blue-300"
            urlCls="text-blue-800 dark:text-blue-200"
            copyBtnCls="bg-white dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800"
          />
        </div>

        {/* Anecdotes section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              Anecdotes ({approved.length})
            </span>
            {!addingAnecdote && (
              <button
                onClick={() => setAddingAnecdote(true)}
                className="text-xs px-3 py-1.5 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                + Ajouter la mienne
              </button>
            )}
          </div>

          {/* Add anecdote form */}
          {addingAnecdote && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Soumis par : <span className="font-medium text-gray-700 dark:text-gray-300">{hostName || "vous"}</span>
              </p>
              <textarea
                autoFocus
                value={draftAnecdote}
                onChange={(e) => setDraftAnecdote(e.target.value)}
                placeholder="J'ai grandi dans 5 pays différents…"
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitAnecdote}
                  disabled={!draftAnecdote.trim() || submittingAnecdote}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {submittingAnecdote && <Loader2 size={13} className="animate-spin" />}
                  Envoyer
                </button>
                <button
                  onClick={() => { setAddingAnecdote(false); setDraftAnecdote(""); }}
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Approved list */}
          {approved.length > 0 && (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {approved.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      {a.question}
                    </p>
                    {a.submitted_by && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {a.submitted_by}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAnecdote(a.id)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Start game */}
        <div className="flex flex-col items-end gap-2">
          {advanceError && (
            <p className="text-xs text-red-500 dark:text-red-400">{advanceError}</p>
          )}
          <button
            onClick={startGame}
            disabled={approved.length === 0 || isStarting}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {isStarting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {isStarting ? "Démarrage…" : "Démarrer le jeu"}
          </button>
          {approved.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
              En attente d&apos;au moins 1 anecdote soumise par les participants.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
