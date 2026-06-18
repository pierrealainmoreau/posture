"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Trophy, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import type { SpeedRetroRoom, SpeedRetroPlayer, SpeedRetroItem } from "@/lib/speed-retro/types";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/retrospective/speed", label: "Speed Retro" },
  { label: "Résultats" },
];

export default function SpeedRetroResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [room, setRoom]   = useState<SpeedRetroRoom | null>(null);
  const [items, setItems] = useState<SpeedRetroItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(`speed_retro_player_${upperCode}`);
    const playerSecret = stored ? (JSON.parse(stored) as { playerSecret?: string }).playerSecret ?? "" : "";

    async function fetchRoom() {
      const res = await fetch(`/api/speed-retro/room/${upperCode}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store",
          "X-Player-Secret": playerSecret,
        },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as SpeedRetroRoom & { players: SpeedRetroPlayer[]; items?: SpeedRetroItem[] };
      setRoom(data);
      if (data.items) setItems(data.items);
      setLoading(false);

      if (data.status === "voting") router.push(`/toolbox/speed-retro/${upperCode}/vote`);
      else if (data.status === "writing") router.push(`/toolbox/speed-retro/${upperCode}/write`);
      else if (data.status === "lobby") router.push(`/toolbox/speed-retro/${upperCode}/lobby`);
    }

    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  const questions = room?.questions ?? [];

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Trophy size={22} className="text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Résultats de la session
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Code : <span className="font-mono font-bold">{upperCode}</span>
          </p>
        </div>

        <div className="space-y-8 mb-8">
          {questions.map((question, qi) => {
            const qItems = items
              .filter((it) => it.question_index === qi)
              .sort((a, b) => b.vote_count - a.vote_count);

            const topVotes = qItems[0]?.vote_count ?? 0;

            return (
              <section key={qi}>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-orange-100 dark:bg-orange-900 rounded-md flex items-center justify-center text-orange-700 dark:text-orange-300 text-[10px] font-bold flex-shrink-0">
                    {qi + 1}
                  </span>
                  {question}
                </h2>

                {qItems.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic px-1">
                    Aucune réponse pour cette question.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {qItems.map((item) => {
                      const isTop = topVotes > 0 && item.vote_count === topVotes;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "px-4 py-3 rounded-xl border",
                            isTop
                              ? "bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700"
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed flex-1">
                              {item.content}
                            </p>
                            <span className={cn(
                              "flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full",
                              isTop
                                ? "bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            )}>
                              {item.vote_count} ▲
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <ContinueSessionButton gameType="speed_retro" roomCode={upperCode} />
        <Link
          href="/toolbox/speed-retro"
          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 transition-colors"
        >
          <Zap size={15} />
          Nouvelle session
        </Link>
      </main>
    </div>
  );
}
