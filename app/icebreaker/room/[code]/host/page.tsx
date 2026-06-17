"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Check, X, Trash2, Copy, CheckCheck,
  Play, Power, ArrowLeft, RefreshCw, Users, Trophy, ChevronRight,
} from "lucide-react";
import { Header } from "@/components/Header";

interface RoomAnecdote {
  id: string;
  question: string;
  is_approved: boolean;
  created_at: string;
}

interface RoomInfo {
  id: string;
  code: string;
  is_active: boolean;
  phase: "collecting" | "voting" | "results";
  participants: string[];
}

interface ResultItem {
  id: string;
  question: string;
  submitted_by: string;
  votes: { voter_name: string; guessed_participant: string }[];
  correct_count: number;
}

export default function HostPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [room, setRoom]                   = useState<RoomInfo | null>(null);
  const [anecdotes, setAnecdotes]         = useState<RoomAnecdote[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [actionId, setActionId]           = useState<string | null>(null);
  const [copied, setCopied]               = useState(false);
  const [launching, setLaunching]         = useState(false);
  const [togglingRoom, setTogglingRoom]   = useState(false);
  const [togglingPhase, setTogglingPhase] = useState(false);
  const [lastRefresh, setLastRefresh]     = useState<Date>(new Date());
  const [results, setResults]             = useState<ResultItem[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const upperCode = code.toUpperCase();
  const shareUrl  = typeof window !== "undefined"
    ? `${window.location.origin}/icebreaker/room/${upperCode}`
    : "";

  const pending  = anecdotes.filter((a) => !a.is_approved);
  const approved = anecdotes.filter((a) =>  a.is_approved);

  const fetchData = useCallback(async () => {
    const [roomRes, anecdotesRes] = await Promise.all([
      fetch(`/api/icebreaker/room/${upperCode}`),
      fetch(`/api/icebreaker/room/${upperCode}/anecdotes`),
    ]);

    if (roomRes.status === 403 || anecdotesRes.status === 403) {
      router.replace("/icebreaker");
      return;
    }

    if (roomRes.ok) setRoom(await roomRes.json());
    if (anecdotesRes.ok) setAnecdotes(await anecdotesRes.json());

    setLoading(false);
    setLastRefresh(new Date());
  }, [upperCode, router]);

  useEffect(() => {
    fetchData();
    // Poll for new submissions every 5s
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function setApproved(id: string, is_approved: boolean) {
    setActionId(id);
    await fetch(`/api/icebreaker/room/${upperCode}/anecdotes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anecdote_id: id, is_approved }),
    });
    setAnecdotes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_approved } : a))
    );
    setActionId(null);
  }

  async function deleteAnecdote(id: string) {
    setActionId(id);
    await fetch(`/api/icebreaker/room/${upperCode}/anecdotes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anecdote_id: id }),
    });
    setAnecdotes((prev) => prev.filter((a) => a.id !== id));
    setActionId(null);
  }

  async function toggleRoom() {
    if (!room) return;
    setTogglingRoom(true);
    const res  = await fetch(`/api/icebreaker/room/${upperCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !room.is_active }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Impossible de modifier la session");
      setTogglingRoom(false);
      return;
    }
    setRoom((r) => r ? { ...r, is_active: !r.is_active } : r);
    setTogglingRoom(false);
    // Re-sync immediately so polling doesn't overwrite the new state
    fetchData();
  }

  async function setPhase(phase: "collecting" | "voting" | "results") {
    if (!room) return;
    setTogglingPhase(true);
    const res  = await fetch(`/api/icebreaker/room/${upperCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Impossible de changer la phase");
      setTogglingPhase(false);
      return;
    }
    setRoom((r) => r ? { ...r, phase } : r);
    setTogglingPhase(false);

    if (phase === "results") {
      setResultsLoading(true);
      const res = await fetch(`/api/icebreaker/room/${upperCode}/votes`);
      const data = await res.json();
      if (Array.isArray(data)) setResults(data);
      setResultsLoading(false);
    }
  }

  async function launchDraw() {
    if (approved.length === 0) return;
    setLaunching(true);
    setError(null);
    const res = await fetch(`/api/icebreaker/room/${upperCode}/launch`, {
      method: "POST",
    });
    const data = await res.json();
    setLaunching(false);
    if (!res.ok) { setError(data.error ?? "Erreur lors du lancement"); return; }
    router.push("/icebreaker");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header backHref="/icebreaker" currentTool="Icebreakers — Room" />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header backHref="/icebreaker" currentTool="Icebreakers — Room" />
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Session introuvable ou accès refusé.</p>
            <Link href="/icebreaker" className="text-sm text-cyan-600 dark:text-cyan-400 underline flex items-center gap-1 justify-center">
              <ArrowLeft size={13} /> Retour aux Icebreakers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/icebreaker" currentTool="Icebreakers — Room" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">

        {/* ── Context block ───────────────────────────────────────────── */}
        <div className="bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900 rounded-2xl px-5 py-4 mb-6 flex gap-3">
          <span className="text-lg flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-medium text-cyan-900 dark:text-cyan-100 mb-0.5">
              Comment animer cette activité ?
            </p>
            <p className="text-sm text-cyan-700 dark:text-cyan-300 leading-relaxed">
              Invitez vos collègues à partager un fait ou une anecdote sur eux-mêmes que personne ne soupçonnerait.
              Une fois le tirage lancé, l&apos;équipe devra retrouver à qui appartient chaque anecdote.
            </p>
          </div>
        </div>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-widest font-mono text-gray-900 dark:text-white">
                {room.code}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                room.is_active
                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${room.is_active ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                {room.is_active ? "Active" : "Fermée"}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Users size={13} />
              {anecdotes.length} soumission{anecdotes.length !== 1 ? "s" : ""} reçue{anecdotes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Refresh indicator */}
            <button
              onClick={fetchData}
              title="Actualiser"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw size={14} />
            </button>

            {/* Share link */}
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copied ? "Copié !" : "Copier le lien"}
            </button>

            {/* Close / reopen */}
            <button
              onClick={toggleRoom}
              disabled={togglingRoom}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {togglingRoom ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
              {room.is_active ? "Fermer la session" : "Rouvrir"}
            </button>
          </div>
        </div>

        {/* Share URL display */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 mb-6 text-sm font-mono text-gray-500 dark:text-gray-400 overflow-hidden">
          <span className="truncate flex-1">{shareUrl}</span>
          <button onClick={copyLink} className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {copied ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── Participants ──────────────────────────────────────────────── */}
        {(room.participants ?? []).length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-shrink-0">
              <Users size={12} /> {room.participants.length} participant{room.participants.length > 1 ? "s" : ""}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {room.participants.map((name) => (
                <span key={name} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Phase stepper ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-medium">
            {(["collecting", "voting", "results"] as const).map((p, i) => {
              const labels = { collecting: "Collecte", voting: "Vote", results: "Résultats" };
              const active = room.phase === p;
              const done   = ["collecting", "voting", "results"].indexOf(room.phase) > i;
              return (
                <span key={p} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight size={12} className="text-gray-300 dark:text-gray-600" />}
                  <span className={`px-2.5 py-1 rounded-full border ${
                    active
                      ? "bg-cyan-600 border-cyan-600 text-white"
                      : done
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                  }`}>
                    {labels[p]}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Results view ─────────────────────────────────────────────── */}
        {room.phase === "results" && (
          <div className="mb-8">
            {resultsLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 size={18} className="animate-spin mr-2" /> Chargement des résultats…
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                        « {item.question} »
                      </p>
                      <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {item.submitted_by}
                      </span>
                    </div>
                    {item.votes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.votes.map((v) => {
                          const correct = v.guessed_participant === item.submitted_by;
                          return (
                            <span
                              key={v.voter_name}
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                correct
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {v.voter_name} → {v.guessed_participant}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {item.correct_count} / {item.votes.length} bonne{item.correct_count !== 1 ? "s" : ""} réponse{item.correct_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Pending + Approved grid (collecting / voting) ──────────────── */}
        {room.phase !== "results" && (
          <div className="grid sm:grid-cols-2 gap-4 mb-8">

            {/* Pending */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  En attente
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{pending.length}</span>
              </div>
              {pending.length === 0 ? (
                <p className="px-4 py-6 text-xs text-center text-gray-400 dark:text-gray-500">
                  Aucune soumission en attente
                </p>
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                  {pending.map((a) => {
                    const busy = actionId === a.id;
                    return (
                      <li key={a.id} className="px-4 py-3 flex items-start gap-2">
                        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-snug">{a.question}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setApproved(a.id, true)}
                            disabled={busy}
                            title="Approuver"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors disabled:opacity-40"
                          >
                            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          </button>
                          <button
                            onClick={() => deleteAnecdote(a.id)}
                            disabled={busy}
                            title="Supprimer"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Approved */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Approuvées
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{approved.length}</span>
              </div>
              {approved.length === 0 ? (
                <p className="px-4 py-6 text-xs text-center text-gray-400 dark:text-gray-500">
                  Approuvez des anecdotes pour les inclure dans le tirage
                </p>
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                  {approved.map((a) => {
                    const busy = actionId === a.id;
                    return (
                      <li key={a.id} className="px-4 py-3 flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-snug">{a.question}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setApproved(a.id, false)}
                            disabled={busy}
                            title="Retirer l'approbation"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors disabled:opacity-40"
                          >
                            {busy ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                          </button>
                          <button
                            onClick={() => deleteAnecdote(a.id)}
                            disabled={busy}
                            title="Supprimer"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Actualisé à {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <div className="flex items-center gap-2">
            {/* Collecting → start vote */}
            {room.phase === "collecting" && (
              <button
                onClick={() => setPhase("voting")}
                disabled={approved.length === 0 || togglingPhase}
                title={approved.length === 0 ? "Approuvez au moins une anecdote" : undefined}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {togglingPhase ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                Lancer le vote ({approved.length})
              </button>
            )}
            {/* Voting → reveal results */}
            {room.phase === "voting" && (
              <button
                onClick={() => setPhase("results")}
                disabled={togglingPhase}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {togglingPhase ? <Loader2 size={15} className="animate-spin" /> : <Trophy size={15} />}
                Révéler les résultats
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
