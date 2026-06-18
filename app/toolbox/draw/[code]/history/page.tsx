"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Trophy, Clock, Users, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import type { Stroke } from "@/lib/draw/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HistoryPlayer {
  id: string;
  pseudo: string;
  avatar_color: string;
  score: number;
  is_host: boolean;
}

interface HistoryRound {
  round_number: number;
  drawer_player_id: string | null;
  word: string | null;
  strokes: Stroke[];
  correct_guesses: { player_id: string; points_earned: number }[];
}

interface HistoryRoom {
  code: string;
  status: string;
  rounds_total: number;
  current_round: number;
  created_at: string;
}

interface HistoryData {
  room: HistoryRoom;
  players: HistoryPlayer[];
  rounds: HistoryRound[];
}

// ── Canvas component ──────────────────────────────────────────────────────────

function RoundCanvas({ strokes }: { strokes: Stroke[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (!stroke.points || stroke.points.length === 0) continue;
      ctx.save();
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : "#111827";
      ctx.globalCompositeOperation = "source-over";

      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(
          stroke.points[0].x * canvas.width,
          stroke.points[0].y * canvas.height,
          stroke.brushSize / 2,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = stroke.tool === "eraser" ? "#ffffff" : "#111827";
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
        for (const p of stroke.points.slice(1)) {
          ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [strokes]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={320}
      className="w-full rounded-xl border border-gray-100 dark:border-gray-800 bg-white"
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DrawHistoryPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();

  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/draw", label: "Draw It" },
    { label: upperCode },
  ];

  useEffect(() => {
    fetch(`/api/draw/room/${upperCode}/history`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({})) as { error?: string };
          setError(d.error ?? `Erreur ${r.status}`);
          setLoading(false);
          return;
        }
        setData(await r.json() as HistoryData);
        setLoading(false);
      })
      .catch(() => { setError("Impossible de charger l'historique."); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500">
          <p className="text-sm">{error ?? "Session introuvable."}</p>
          <Link href="/toolbox/draw" className="text-sm text-orange-600 hover:underline">
            ← Retour aux parties
          </Link>
        </div>
      </div>
    );
  }

  const { room, players, rounds } = data;
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const medals = ["🥇", "🥈", "🥉"];

  const date = new Date(room.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-8">

        {/* ── Header info ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold tracking-widest font-mono text-lg text-gray-900 dark:text-white">
                {room.code}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                room.status === "finished"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  : "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
              }`}>
                {room.status === "finished" ? "Terminée" : "En cours"}
              </span>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <Clock size={12} />
              {date}
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <Users size={12} />
              {players.length} joueur{players.length !== 1 ? "s" : ""}
              <span className="text-gray-300 dark:text-gray-600">·</span>
              {rounds.length}/{room.rounds_total} manche{room.rounds_total !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/toolbox/draw"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={12} />
            Mes parties
          </Link>
        </div>

        {/* ── Leaderboard ── */}
        {players.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
              <Trophy size={12} />
              Classement
            </h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
              {players.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-base w-7 text-center flex-shrink-0">
                    {idx < 3 ? medals[idx] : <span className="text-sm text-gray-400">{idx + 1}.</span>}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.avatar_color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{p.pseudo}</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {p.score} pts
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Rounds ── */}
        {rounds.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
            Aucune manche enregistrée — la partie n&apos;a peut-être pas encore commencé.
          </div>
        ) : (
          <section className="space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              Manches jouées
            </h2>
            {rounds.map((round) => {
              const drawer = round.drawer_player_id ? playerMap[round.drawer_player_id] : null;
              return (
                <div
                  key={round.round_number}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden"
                >
                  {/* Round header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center text-xs font-bold text-orange-700 dark:text-orange-300 flex-shrink-0">
                        {round.round_number}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {round.word
                            ? <>&ldquo;{round.word}&rdquo;</>
                            : <span className="text-gray-400 italic">Mot inconnu</span>
                          }
                        </p>
                        {drawer && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: drawer.avatar_color }}
                            />
                            dessiné par <span className="font-medium text-gray-600 dark:text-gray-300">{drawer.pseudo}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Correct guessers */}
                    {round.correct_guesses.length > 0 && (
                      <div className="flex items-center gap-1">
                        {round.correct_guesses.map((g) => {
                          const gp = playerMap[g.player_id];
                          return gp ? (
                            <div
                              key={g.player_id}
                              title={`${gp.pseudo} · +${g.points_earned} pts`}
                              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: gp.avatar_color }}
                            >
                              {gp.pseudo[0].toUpperCase()}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Canvas */}
                  <div className="p-4">
                    {round.strokes.length > 0 ? (
                      <RoundCanvas strokes={round.strokes} />
                    ) : (
                      <div className="flex items-center justify-center h-28 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-600">
                        Aucun trait enregistré
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

      </main>
    </div>
  );
}
