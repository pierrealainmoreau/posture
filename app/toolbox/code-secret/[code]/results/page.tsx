"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Trophy, Clock, Eye, XCircle, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { TEAM_META, DIFFICULTY_META } from "@/lib/code-secret/types";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";
import type { RoomResponse, Team } from "@/lib/code-secret/types";

function computeScore(
  timeLimitSeconds: number,
  startedAt: string,
  solvedAt: string | null,
  hintsUsed: number,
  wrongGuesses: number,
  hintPenalty: number,
  wrongGuessPenalty: number
): number {
  if (!solvedAt) return 0;
  const elapsed = (new Date(solvedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  const timeBonus = Math.max(0, timeLimitSeconds - elapsed);
  return Math.max(0, Math.round(1000 - hintsUsed * hintPenalty - wrongGuesses * wrongGuessPenalty + timeBonus));
}

export default function CodeSecretResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState("");
  const [myTeam, setMyTeam]     = useState<Team | null>(null);
  const [room, setRoom]         = useState<RoomResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [answer, setAnswer]     = useState<string | null>(null);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/code-secret", label: "Code Secret" },
    { label: "Résultats" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`code_secret_player_${upperCode}`);
    if (stored) {
      try {
        const { playerId: pid, team } = JSON.parse(stored) as { playerId: string; team?: Team | null };
        setPlayerId(pid);
        setMyTeam(team ?? null);
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    fetch(`/api/code-secret/room/${upperCode}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: RoomResponse | null) => {
        if (!data) return;
        setRoom(data);
        // Answer is populated by API only when status === 'finished'
        if (data.challenge?.answer) setAnswer(data.challenge.answer);
        if (data.status !== "finished") {
          router.replace(`/toolbox/code-secret/${upperCode}/play`);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  const isHost = room?.host_player_id === playerId;

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  const challenge = room.challenge;
  const diff = DIFFICULTY_META[room.difficulty];
  const isCoop = room.game_mode === "coop";
  const solved = !!room.solved_at;

  // Coop: stats for everyone
  const coopHints = room.revealedHints.filter(h => h.team === null);
  const coopWrong = room.recentSubmissions.filter(s => !s.is_correct);
  const coopScore = solved && room.started_at
    ? computeScore(challenge.timeLimitSeconds, room.started_at, room.solved_at, coopHints.length, coopWrong.length, challenge.hintPenalty, challenge.wrongGuessPenalty)
    : 0;

  // Competitive: per-team stats
  const teams = isCoop ? [] : (["red", "blue", "green", "yellow"] as Team[])
    .filter(t => room.players.some(p => p.team === t))
    .map(t => {
      const hints = room.revealedHints.filter(h => h.team === t).length;
      const wrongs = room.recentSubmissions.filter(s => !s.is_correct && s.team === t).length;
      const won = room.winner_team === t;
      const score = won && room.started_at
        ? computeScore(challenge.timeLimitSeconds, room.started_at, room.solved_at, hints, wrongs, challenge.hintPenalty, challenge.wrongGuessPenalty)
        : 0;
      return { team: t, hints, wrongs, won, score };
    })
    .sort((a, b) => (b.won ? 1 : 0) - (a.won ? 1 : 0) || b.score - a.score);

  const elapsed = room.started_at && room.solved_at
    ? Math.round((new Date(room.solved_at).getTime() - new Date(room.started_at).getTime()) / 1000)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10 flex flex-col gap-6">

        {/* Result banner */}
        {solved ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} className="text-amber-500" />
            </div>
            {isCoop ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Code déchiffré !</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">L&apos;équipe a réussi à déchiffrer le message.</p>
              </>
            ) : (
              <>
                {room.winner_team && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-2 ${TEAM_META[room.winner_team].tailwindBg} ${TEAM_META[room.winner_team].tailwindText}`}>
                    <Trophy size={14} />
                    {TEAM_META[room.winner_team].label} a gagné !
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Code déchiffré en premier !</h1>
              </>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Temps écoulé…</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Le code n&apos;a pas été déchiffré à temps.</p>
          </div>
        )}

        {/* Answer reveal */}
        <div className="bg-gray-900 dark:bg-black rounded-2xl p-5 border border-gray-800 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Message chiffré</p>
          <p className="font-mono text-base text-amber-400 dark:text-amber-300 mb-4 break-all">{challenge.encodedMessage}</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Réponse</p>
          <p className="font-mono text-3xl font-black text-white tracking-widest">{answer ?? "—"}</p>
          <p className="mt-2 text-xs text-gray-600">{challenge.cipherDescription}</p>
        </div>

        {/* Coop score */}
        {isCoop && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Résultats de l&apos;équipe</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-amber-500">{solved ? coopScore : 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{coopHints.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Indice{coopHints.length !== 1 ? "s" : ""} utilisé{coopHints.length !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {elapsed !== null ? (elapsed >= 60 ? `${Math.floor(elapsed / 60)}m${String(elapsed % 60).padStart(2, "0")}s` : `${elapsed}s`) : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Temps</p>
              </div>
            </div>
            {coopWrong.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 justify-center">
                <XCircle size={12} /> {coopWrong.length} mauvaise{coopWrong.length !== 1 ? "s" : ""} tentative{coopWrong.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        {/* Competitive leaderboard */}
        {!isCoop && teams.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Classement</span>
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {teams.map((ts, i) => {
                const meta = TEAM_META[ts.team];
                const isMe = ts.team === myTeam;
                return (
                  <li key={ts.team} className={`px-4 py-4 flex items-center gap-3 ${isMe ? "bg-amber-50/40 dark:bg-amber-950/20" : ""}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 && ts.won ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                      {i + 1}
                    </span>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: meta.hex }} />
                    <span className={`flex-1 text-sm font-medium ${meta.tailwindText}`}>
                      {meta.label} {isMe && <span className="text-gray-400 text-xs font-normal">(vous)</span>}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {ts.hints > 0 && (
                        <span className="flex items-center gap-0.5"><Eye size={11} /> {ts.hints}</span>
                      )}
                      {ts.wrongs > 0 && (
                        <span className="flex items-center gap-0.5 text-red-400"><XCircle size={11} /> {ts.wrongs}</span>
                      )}
                      {ts.won && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </div>
                    <span className="text-sm font-bold text-amber-500 min-w-[40px] text-right">
                      {ts.won ? ts.score : <span className="text-gray-400 font-normal text-xs">—</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Difficulty badge + play again */}
        <div className="flex items-center justify-between gap-4">
          <span className={`text-xs font-medium ${diff.color}`}>{diff.label} · {diff.time}</span>
          <div className="flex gap-2">
            <Link
              href="/toolbox/code-secret/join"
              className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Rejoindre une partie
            </Link>
            {isHost && (
              <Link
                href="/toolbox/code-secret/create"
                className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
              >
                Nouvelle partie
              </Link>
            )}
          </div>
          <ContinueSessionButton gameType="code_secret" roomCode={upperCode} />
        </div>
      </main>
    </div>
  );
}
