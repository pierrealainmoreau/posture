"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Hash, ChevronRight, Clock, Users, CheckCircle2, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";

interface RoomRow {
  id: string;
  code: string;
  status: "lobby" | "playing" | "finished";
  starter_phrase: string;
  created_at: string;
  player_count: number;
}

function RoomCard({ room }: { room: RoomRow }) {
  const date = new Date(room.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const isActive = room.status !== "finished";

  return (
    <Link
      href={`/toolbox/completephrase/${room.code}/lobby`}
      className="group flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isActive ? "bg-fuchsia-50 dark:bg-fuchsia-950" : "bg-gray-100 dark:bg-gray-800"
        }`}>
          {isActive
            ? <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 animate-pulse" />
            : <CheckCircle2 size={16} className="text-gray-400 dark:text-gray-500" />
          }
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold tracking-widest font-mono text-sm text-gray-900 dark:text-white">
              {room.code}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
            {room.starter_phrase}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2 mt-0.5">
            <Clock size={11} />
            {date}
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <Users size={11} />
            {room.player_count} {room.player_count !== 1 ? "participants" : "participant"}
          </p>
        </div>
      </div>
      <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-fuchsia-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function CompletePhrasePage() {
  const [rooms, setRooms]       = useState<RoomRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const fromParamsRef           = useRef("");

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { label: "Continuez la phrase" },
  ];

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const fromGame = p.get("fromGame");
    const fromCode = p.get("fromCode");
    if (fromGame && fromCode) {
      fromParamsRef.current = `?fromGame=${encodeURIComponent(fromGame)}&fromCode=${encodeURIComponent(fromCode)}`;
    }

    fetch("/api/completephrase/room", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRooms(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active   = rooms.filter((r) => r.status !== "finished");
  const finished = rooms.filter((r) => r.status === "finished");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950 flex items-center justify-center">
              <MessageSquare size={20} className="text-fuchsia-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Continuez la phrase</h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                Un starter, des réponses anonymes, un mur de post-its.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <Link
            href={`/toolbox/completephrase/create${fromParamsRef.current}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-fuchsia-500 text-white text-sm font-semibold rounded-xl hover:bg-fuchsia-600 transition-colors"
          >
            <Plus size={16} />
            Créer une session
          </Link>
          <Link
            href="/toolbox/completephrase/join"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <Hash size={16} />
            Rejoindre avec un code
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950 flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-fuchsia-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aucune session créée</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Choisissez une phrase starter et partagez le code à vos collègues.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">En cours</p>
                <div className="space-y-2">
                  {active.map((r) => <RoomCard key={r.id} room={r} />)}
                </div>
              </div>
            )}
            {finished.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Terminées</p>
                <div className="space-y-2">
                  {finished.map((r) => <RoomCard key={r.id} room={r} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
