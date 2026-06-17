"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Crown, Loader2, Play } from "lucide-react";
import { Header } from "@/components/Header";
import { QRShare } from "@/components/QRShare";
import type { AbcdeRoom, AbcdePlayer } from "@/lib/abcde/types";

export default function AbcdeLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]     = useState("");
  const [room, setRoom]             = useState<AbcdeRoom | null>(null);
  const [players, setPlayers]       = useState<AbcdePlayer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [starting, setStarting]     = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const pollRef = useRef(0);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/reunion-maker/abcde/join?code=${upperCode}`
      : "";

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/reunion-maker", label: "Réunion Maker" },
    { href: "/reunion-maker/abcde", label: "ABCDE" },
    { label: "Lobby" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`abcde_player_${upperCode}`);
    if (!stored) { router.replace(`/reunion-maker/abcde/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid } = JSON.parse(stored) as { playerId: string };
      setPlayerId(pid);
    } catch {
      router.replace(`/reunion-maker/abcde/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  useEffect(() => {
    if (!playerId) return;

    async function fetchRoom() {
      const res = await fetch(`/api/abcde/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json() as AbcdeRoom & { players: AbcdePlayer[] };
      const fetchedPlayers = data.players ?? [];

      if (data.status === "lobby" && data.host_player_id !== playerId) {
        pollRef.current++;
        const iAmIn = fetchedPlayers.some((p) => p.id === playerId);
        if (!iAmIn && pollRef.current >= 2) setNotRegistered(true);
        else if (iAmIn) { pollRef.current = 0; setNotRegistered(false); }
      }

      setRoom(data);
      setPlayers(fetchedPlayers);
      setLoading(false);

      if (data.status !== "lobby") {
        router.push(`/reunion-maker/abcde/${upperCode}/play`);
      }
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  async function startSession() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/abcde/room/${upperCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) setStartError(data.error ?? "Erreur au démarrage");
    } catch {
      setStartError("Une erreur est survenue.");
    } finally {
      setStarting(false);
    }
  }

  const isHost = room?.host_player_id === playerId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">

        {/* Code + share */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Code de la session</p>
          <p className="text-5xl font-bold font-mono tracking-widest text-gray-900 dark:text-white mb-4">{upperCode}</p>
          {room?.problem_statement && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl px-4 py-3 text-left mb-4">
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Sujet de l&apos;atelier</p>
              <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{room.problem_statement}</p>
            </div>
          )}
          <QRShare
            url={shareUrl}
            label="Partagez ce lien aux participants"
            filename={`abcde-${upperCode}`}
            wrapperCls="bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900"
            labelCls="text-indigo-700 dark:text-indigo-300"
            urlCls="text-indigo-800 dark:text-indigo-200"
            copyBtnCls="bg-white dark:bg-indigo-900 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-800"
          />
        </div>

        {/* Players */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">Participants ({players.length})</span>
          </div>
          {players.length === 0 ? (
            <div className="px-4 py-6 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin text-gray-300 mr-2" />
              <span className="text-sm text-gray-400">En attente de participants…</span>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {players.map((p) => (
                <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.avatar_color }} />
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {p.pseudo}
                    {p.id === playerId && <span className="ml-1.5 text-xs text-gray-400 font-normal">(vous)</span>}
                  </span>
                  {p.is_host && <Crown size={14} className="text-amber-500 flex-shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isHost && (
          <div className="flex flex-col gap-2">
            {startError && <p className="text-xs text-red-500 text-center">{startError}</p>}
            <button
              onClick={startSession}
              disabled={players.length < 1 || starting}
              className="flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {starting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {starting ? "Démarrage…" : "Lancer l'atelier"}
            </button>
          </div>
        )}

        {!isHost && notRegistered && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-4 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">Votre session n&apos;est plus reconnue.</p>
            <button
              onClick={() => { localStorage.removeItem(`abcde_player_${upperCode}`); router.replace(`/reunion-maker/abcde/join?code=${upperCode}`); }}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Rejoindre à nouveau
            </button>
          </div>
        )}

        {!isHost && !notRegistered && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Loader2 size={13} className="animate-spin" />
            En attente du démarrage par l&apos;animateur…
          </p>
        )}
      </main>
    </div>
  );
}
