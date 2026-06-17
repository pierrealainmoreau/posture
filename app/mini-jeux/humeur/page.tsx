"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SmilePlus, Plus, Hash, ChevronRight, Clock, Users,
  CheckCircle2, Loader2, Zap,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n";
import type { HumeurRoom } from "@/lib/humeur/types";

interface RoomRow extends HumeurRoom {
  player_count: number;
}

function RoomCard({ room }: { room: RoomRow }) {
  const { t, locale } = useI18n();
  const date = new Date(room.created_at).toLocaleDateString(locale, {
    day: "2-digit", month: "short", year: "numeric",
  });
  const isActive = room.status !== "finished";
  const linkPath = isActive
    ? `/mini-jeux/humeur/${room.code}/lobby`
    : `/mini-jeux/humeur/${room.code}/results`;

  return (
    <Link
      href={linkPath}
      className="group flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isActive ? "bg-rose-50 dark:bg-rose-950" : "bg-gray-100 dark:bg-gray-800"
        }`}>
          {isActive
            ? <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            : <CheckCircle2 size={16} className="text-gray-400 dark:text-gray-500" />
          }
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold tracking-widest font-mono text-sm text-gray-900 dark:text-white">
              {room.code}
            </span>
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
      <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-rose-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function HumeurPage() {
  const { t } = useI18n();
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    fetch("/api/humeur/room")
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
      <Header backHref="/" parentHref="/mini-jeux" parentLabel={t.common.miniJeux} currentTool={t.humeur.title} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t.humeur.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t.humeur.subtitle}
              </p>
            </div>
          </div>

          {/* Lancer directement — CTA principal */}
          <Link
            href="/mini-jeux/humeur/direct"
            className="flex items-center justify-between w-full px-5 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-colors mb-3 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{t.humeur.launchDirect}</p>
                <p className="text-xs text-rose-100">{t.humeur.directSubtitle}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-rose-200 group-hover:text-white transition-colors flex-shrink-0" />
          </Link>

          {/* Session équipe */}
          <div className="flex items-center gap-2">
            <Link
              href="/mini-jeux/humeur/join"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Hash size={14} />
              {t.common.join}
            </Link>
            <Link
              href="/mini-jeux/humeur/create"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <Users size={14} />
              {t.humeur.teamSession}
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={18} className="animate-spin mr-2" /> {t.common.loading}
          </div>
        ) : !isAuth || rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center mb-4">
              <SmilePlus size={24} className="text-rose-500 dark:text-rose-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {t.humeur.noSessions}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {t.humeur.noSessionsDesc}
            </p>
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
