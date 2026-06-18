"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Users, ChevronRight, Clock, CheckCircle2, Scale } from "lucide-react";
import { Header } from "@/components/Header";

interface RoomRow {
  id: string;
  code: string;
  is_active: boolean;
  created_at: string;
  phase: string;
  participant_count: number;
  submitted_count: number;
}

function phaseLabel(phase: string): string {
  if (phase === "collecting") return "Collecte";
  if (phase === "results") return "Terminée";
  if (phase.startsWith("voting:") || phase.startsWith("reveal:")) return "En jeu";
  return phase;
}

function RoomCard({ room }: { room: RoomRow }) {
  const date = new Date(room.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <Link
      href={`/toolbox/tvml/room/${room.code}/host`}
      className="group flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          room.is_active
            ? "bg-violet-50 dark:bg-violet-950"
            : "bg-gray-100 dark:bg-gray-800"
        }`}>
          {room.is_active
            ? <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            : <CheckCircle2 size={16} className="text-gray-400 dark:text-gray-500" />
          }
        </div>

        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold tracking-widest font-mono text-sm text-gray-900 dark:text-white">
              {room.code}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
              {phaseLabel(room.phase)}
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Clock size={11} />
            {date}
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <Users size={11} />
            {room.participant_count} joueur{room.participant_count !== 1 ? "s" : ""}
            {room.submitted_count > 0 && (
              <> · {room.submitted_count} soumission{room.submitted_count !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>
      </div>

      <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-violet-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function TvmlPage() {
  const router = useRouter();
  const [rooms, setRooms]       = useState<RoomRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/tvml/room")
      .then((r) => r.json())
      .then((data) => { setRooms(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function createRoom() {
    setCreating(true);
    const res = await fetch("/api/tvml/room", { method: "POST" });
    const data = await res.json();
    setCreating(false);
    if (res.ok && data.code) router.push(`/toolbox/tvml/room/${data.code}/host`);
  }

  const active   = rooms.filter((r) =>  r.is_active);
  const archived = rooms.filter((r) => !r.is_active);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" parentHref="/toolbox" parentLabel="Mini-jeux" currentTool="2 Vérités 1 Mensonge" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
                <Scale size={16} className="text-violet-600 dark:text-violet-400" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mes sessions</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Créez une session, invitez vos collègues et devinez le mensonge !
            </p>
          </div>
          <button
            onClick={createRoom}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Nouvelle session
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center mb-4">
              <Scale size={24} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Aucune session créée
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              Créez votre première session, partagez le lien à vos collègues et lancez le jeu.
            </p>
            <button
              onClick={createRoom}
              disabled={creating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Créer une session
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  En cours ({active.length})
                </h2>
                <div className="space-y-2">
                  {active.map((r) => <RoomCard key={r.id} room={r} />)}
                </div>
              </section>
            )}
            {archived.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  Terminées ({archived.length})
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
