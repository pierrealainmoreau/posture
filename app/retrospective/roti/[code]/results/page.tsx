"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ROTI_LABELS, type RotiRoom, type RotiPlayer } from "@/lib/roti/types";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";
import { cn } from "@/lib/utils";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/retrospective/roti", label: "ROTI" },
  { label: "Résultats" },
];

export default function RotiResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [room, setRoom]       = useState<RotiRoom | null>(null);
  const [players, setPlayers] = useState<RotiPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoom() {
      const res = await fetch(`/api/roti/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as RotiRoom & { players: RotiPlayer[] };
      setRoom(data);
      setPlayers(data.players ?? []);
      setLoading(false);

      if (data.status !== "finished") {
        if (data.status === "lobby") router.replace(`/retrospective/roti/${upperCode}/lobby`);
        else if (data.status === "voting") router.replace(`/retrospective/roti/${upperCode}/vote`);
      }
    }

    fetchRoom();
    const id = setInterval(() => {
      if (room && room.status === "finished") return;
      fetchRoom();
    }, 2000);
    return () => clearInterval(id);
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

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Session introuvable.
        </div>
      </div>
    );
  }

  const votedPlayers = players.filter((p) => p.vote !== null);
  const average = votedPlayers.length > 0
    ? votedPlayers.reduce((sum, p) => sum + (p.vote ?? 0), 0) / votedPlayers.length
    : 0;
  const avgRounded = Math.round(average) as 1 | 2 | 3 | 4 | 5;
  const avgLabel = avgRounded >= 1 && avgRounded <= 5 ? ROTI_LABELS[avgRounded] : null;

  const distribution = ([1, 2, 3, 4, 5] as const).map((score) => ({
    score,
    count: votedPlayers.filter((p) => p.vote === score).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  const sortedPlayers = [...players].sort((a, b) => (b.vote ?? 0) - (a.vote ?? 0));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Résultats ROTI
          </h1>
          {room.session_name && (
            <p className="text-sm text-violet-600 dark:text-violet-400">{room.session_name}</p>
          )}
        </div>

        {votedPlayers.length > 0 && (
          <div className={cn(
            "rounded-2xl border p-6 text-center mb-6",
            avgLabel ? avgLabel.bgClass : "bg-gray-50 dark:bg-gray-900",
            avgLabel ? avgLabel.borderClass : "border-gray-200 dark:border-gray-800"
          )}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Score moyen
            </p>
            <p className={cn("text-6xl font-bold mb-1", avgLabel ? avgLabel.textClass : "text-gray-900 dark:text-white")}>
              {average.toFixed(1)}
            </p>
            {avgLabel && (
              <p className={cn("text-sm font-medium", avgLabel.textClass)}>{avgLabel.label}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {votedPlayers.length} vote{votedPlayers.length > 1 ? "s" : ""}
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Légende
          </p>
          <ol className="space-y-2">
            {([1, 2, 3, 4, 5] as const).map((score) => {
              const l = ROTI_LABELS[score];
              return (
                <li key={score} className="flex items-start gap-3">
                  <span className={cn("text-sm font-bold w-4 flex-shrink-0 mt-0.5", l.textClass)}>
                    {score}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                    {l.description}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            Distribution
          </p>
          <div className="space-y-3">
            {distribution.map(({ score, count }) => {
              const l = ROTI_LABELS[score];
              const pct = (count / maxCount) * 100;
              return (
                <div key={score} className="flex items-center gap-3">
                  <span className={cn("text-sm font-bold w-4 text-right flex-shrink-0", l.textClass)}>
                    {score}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-24 flex-shrink-0 truncate">
                    {l.label}
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", l.bgClass, `border ${l.borderClass}`)}
                      style={{ width: count > 0 ? `${pct}%` : "0%", minWidth: count > 0 ? "8px" : "0" }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-4 text-right flex-shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              Participants
            </span>
          </div>
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {sortedPlayers.map((p) => {
              const voteLabel = p.vote !== null ? ROTI_LABELS[p.vote] : null;
              return (
                <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.avatar_color }} />
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {p.pseudo}
                  </span>
                  {p.vote !== null && voteLabel ? (
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-xs font-bold border",
                      voteLabel.bgClass,
                      voteLabel.borderClass,
                      voteLabel.textClass
                    )}>
                      {p.vote}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <ContinueSessionButton gameType="roti" roomCode={upperCode} />
        <Link
          href="/retrospective/roti"
          className="block w-full py-3 text-center bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
        >
          Nouvelle session
        </Link>
      </main>
    </div>
  );
}
