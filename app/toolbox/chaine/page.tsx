"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2, Plus, Hash, ChevronRight, Clock, Users, CheckCircle2, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n";

interface RoomRow {
  id: string;
  code: string;
  status: "lobby" | "playing" | "voting" | "finished";
  starter_word: string;
  created_at: string;
  player_count: number;
}

function RoomCard({ room }: { room: RoomRow }) {
  const { t, locale } = useI18n();
  const date = new Date(room.created_at).toLocaleDateString(locale, {
    day: "2-digit", month: "short", year: "numeric",
  });
  const isActive = room.status !== "finished";

  return (
    <Link
      href={`/toolbox/chaine/${room.code}/lobby`}
      className="group flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isActive ? "bg-violet-50 dark:bg-violet-950" : "bg-gray-100 dark:bg-gray-800"
        }`}>
          {isActive
            ? <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            : <CheckCircle2 size={16} className="text-gray-400 dark:text-gray-500" />
          }
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold tracking-widest font-mono text-sm text-gray-900 dark:text-white">
              {room.code}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">· {room.starter_word}</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Clock size={11} />
            {date}
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <Users size={11} />
            {room.player_count} {room.player_count !== 1 ? t.common.players : t.common.player}
          </p>
        </div>
      </div>
      <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-violet-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function ChainePage() {
  const { t } = useI18n();
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const breadcrumbs = [
    { href: "/", label: t.common.home },
    { href: "/toolbox", label: t.common.miniJeux },
    { label: "Chaîne" },
  ];

  useEffect(() => {
    fetch("/api/chaine/room")
      .then((r) => {
        if (r.status === 401) { setLoading(false); return null; }
        setIsAuth(true);
        return r.json();
      })
      .then((data) => {
        if (data) setRooms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const active   = rooms.filter((r) => r.status !== "finished");
  const archived = rooms.filter((r) => r.status === "finished");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chaîne</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t.chaine.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/toolbox/chaine/join"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Hash size={14} />
              {t.common.join}
            </Link>
            <Link
              href="/toolbox/chaine/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              {t.common.newGame}
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={18} className="animate-spin mr-2" /> {t.common.loading}
          </div>
        ) : !isAuth || rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center mb-4">
              <Link2 size={24} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {t.chaine.noGames}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              {t.chaine.createFirst}
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/toolbox/chaine/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                <Plus size={14} />
                {t.common.createGame}
              </Link>
              <Link
                href="/toolbox/chaine/join"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Hash size={14} />
                {t.common.join}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  {t.common.inProgress} ({active.length})
                </h2>
                <div className="space-y-2">
                  {active.map((r) => <RoomCard key={r.id} room={r} />)}
                </div>
              </section>
            )}
            {archived.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  {t.common.finished} ({archived.length})
                </h2>
                <div className="space-y-2">
                  {archived.map((r) => <RoomCard key={r.id} room={r} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
