"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Clock, Users, CheckCircle2, Hash, Plus, Loader2, Trash2, X } from "lucide-react";
import { Header } from "@/components/Header";
import type { KudoRoom } from "@/lib/kudo-cards/types";

interface RoomRow extends KudoRoom {
  player_count: number;
}

const STATUS_LABEL: Record<KudoRoom["status"], string> = {
  lobby: "Lobby",
  writing: "Écriture en cours",
  revealed: "Terminée",
};

const STATUS_CLASS: Record<KudoRoom["status"], string> = {
  lobby: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  writing: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  revealed: "bg-gray-100 text-gray-400 dark:bg-gray-800",
};

function RoomCard({ room, onDelete }: { room: RoomRow; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const date = new Date(room.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const isActive = room.status !== "revealed";
  const href = isActive
    ? `/toolbox/kudo-cards/${room.code}/lobby`
    : `/toolbox/kudo-cards/${room.code}/wall`;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/kudo-cards/room?code=${room.code}`, { method: "DELETE" });
      if (res.ok) onDelete(room.id);
      else setDeleting(false);
    } catch { setDeleting(false); }
  }

  return (
    <div className="group flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all">
      <Link href={href} className="flex-1 flex items-center gap-4 px-5 py-4 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isActive ? "bg-amber-50 dark:bg-amber-950" : "bg-gray-100 dark:bg-gray-800"
        }`}>
          {isActive
            ? <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            : <CheckCircle2 size={16} className="text-gray-400 dark:text-gray-500" />
          }
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold tracking-widest font-mono text-sm text-gray-900 dark:text-white">
              {room.code}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${STATUS_CLASS[room.status]}`}>
              {STATUS_LABEL[room.status]}
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Clock size={11} />
            {date}
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <Users size={11} />
            {room.player_count} participant{room.player_count !== 1 ? "s" : ""}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-1 pr-3 flex-shrink-0">
        {confirmDelete ? (
          <>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(false); }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={13} />
            </button>
            <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40">
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </>
        ) : (
          <button onClick={handleDelete} className="p-1.5 rounded-lg text-gray-300 dark:text-gray-700 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/reunion-maker", label: "Réunion Maker" },
  { label: "Kudo Cards" },
];

export default function KudoCardsPage() {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    fetch("/api/kudo-cards/room")
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

  function handleDelete(id: string) {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }

  const active   = rooms.filter((r) => r.status !== "revealed");
  const archived = rooms.filter((r) => r.status === "revealed");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950 rounded-xl flex items-center justify-center">
              <Gift size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Kudo Cards</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-0">
            Envoyez des cartes de reconnaissance à vos coéquipiers — révélées ensemble à la fin.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/toolbox/kudo-cards/join"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Hash size={14} />
            Rejoindre
          </Link>
          <Link
            href="/toolbox/kudo-cards/create"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 dark:bg-amber-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Nouvelle session
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={18} className="animate-spin mr-2" /> Chargement…
          </div>
        ) : !isAuth || rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center mb-4">
              <Gift size={24} className="text-amber-500 dark:text-amber-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Aucune session
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Créez une session et partagez le code à votre équipe. Les cartes seront révélées ensemble.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  En cours ({active.length})
                </h2>
                <div className="space-y-2">
                  {active.map((r) => <RoomCard key={r.id} room={r} onDelete={handleDelete} />)}
                </div>
              </section>
            )}
            {archived.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  Terminées ({archived.length})
                </h2>
                <div className="space-y-2">
                  {archived.map((r) => <RoomCard key={r.id} room={r} onDelete={handleDelete} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
