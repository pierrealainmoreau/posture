"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Users, ChevronRight, Clock, CheckCircle2, BookOpen } from "lucide-react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n";

interface RoomRow {
  id: string;
  code: string;
  is_active: boolean;
  created_at: string;
  pending_count: number;
  approved_count: number;
  total_count: number;
  player_count: number;
}

function RoomCard({ room }: { room: RoomRow }) {
  const { t, locale } = useI18n();
  const date = new Date(room.created_at).toLocaleDateString(locale, {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <Link
      href={`/mini-jeux/anecdotes/room/${room.code}/host`}
      className="group flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          room.is_active
            ? "bg-emerald-50 dark:bg-emerald-950"
            : "bg-gray-100 dark:bg-gray-800"
        }`}>
          {room.is_active
            ? <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            : <CheckCircle2 size={16} className="text-gray-400 dark:text-gray-500" />
          }
        </div>

        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold tracking-widest font-mono text-sm text-gray-900 dark:text-white">
              {room.code}
            </span>
            {room.pending_count > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {room.pending_count}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Clock size={11} />
            {date}
            <span className="text-gray-300 dark:text-gray-600">·</span>
            {room.approved_count} {room.approved_count !== 1 ? t.anecdotes.anecdotes : t.anecdotes.anecdote}
            {room.player_count > 0 && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <Users size={11} />
                {room.player_count} {room.player_count !== 1 ? t.common.players : t.common.player}
              </>
            )}
          </p>
        </div>
      </div>

      <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function AnecdotesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [rooms, setRooms]       = useState<RoomRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/icebreaker/room")
      .then((r) => r.json())
      .then((data) => { setRooms(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function createRoom() {
    setCreating(true);
    const res = await fetch("/api/icebreaker/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_type: "anecdotes" }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok && data.code) router.push(`/mini-jeux/anecdotes/room/${data.code}/host`);
  }

  const active   = rooms.filter((r) =>  r.is_active);
  const archived = rooms.filter((r) => !r.is_active);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" parentHref="/mini-jeux" parentLabel={t.common.miniJeux} currentTool="Anecdotes" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t.anecdotes.mySessions}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t.anecdotes.subtitle}
            </p>
          </div>
          <button
            onClick={createRoom}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {t.common.newSession}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={18} className="animate-spin mr-2" /> {t.common.loading}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {t.anecdotes.noSessions}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              {t.anecdotes.createFirst}
            </p>
            <button
              onClick={createRoom}
              disabled={creating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {t.common.createSession}
            </button>
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
