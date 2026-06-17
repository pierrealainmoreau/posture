"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { MOODS, getMoodById, getMoodImageUrl, pickSetForRoom } from "@/lib/humeur/moods";
import type { HumeurRoom, HumeurPlayer } from "@/lib/humeur/types";

// ── Écran d'attente après avoir choisi ───────────────────────────────────────
function WaitingScreen({
  players,
  myPlayerId,
  myMoodId,
  setId,
  isHost,
  onReveal,
  revealing,
}: {
  players: HumeurPlayer[];
  myPlayerId: string;
  myMoodId: string;
  setId: string;
  isHost: boolean;
  onReveal: () => void;
  revealing: boolean;
}) {
  const myMood = getMoodById(myMoodId);
  const doneCount = players.filter((p) => p.mood_id !== null).length;
  const total = players.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">

        {/* Ma sélection */}
        {myMood && (
          <div className="relative w-32 h-32 rounded-3xl overflow-hidden mx-auto mb-4 ring-4 ring-rose-400 shadow-lg">
            <Image
              src={getMoodImageUrl(setId, myMood.index)}
              alt={myMood.label}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex items-center justify-center gap-2 mb-8">
          <CheckCircle2 size={16} className="text-rose-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Humeur enregistrée !</h2>
        </div>

        {/* Avatars des participants */}
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {players.map((p) => {
            const pMood = p.mood_id ? getMoodById(p.mood_id) : null;
            return (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <div
                  className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold transition-opacity ${
                    p.mood_id ? "opacity-100" : "opacity-25"
                  }`}
                  style={{ backgroundColor: p.avatar_color }}
                >
                  {pMood ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={getMoodImageUrl(setId, pMood.index)}
                        alt={pMood.label}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    p.pseudo[0].toUpperCase()
                  )}
                </div>
                <span className={`text-xs ${p.mood_id ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}`}>
                  {p.id === myPlayerId ? "Vous" : p.pseudo}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          {doneCount} / {total} participant{total !== 1 ? "s" : ""} ont choisi leur humeur
        </p>

        {isHost ? (
          <button
            onClick={onReveal}
            disabled={revealing}
            className="w-full py-3 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {revealing ? (
              <><Loader2 size={15} className="animate-spin" /> Révélation…</>
            ) : (
              "Révéler les humeurs →"
            )}
          </button>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            En attente de la révélation par l&apos;animateur…
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function HumeurPlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]       = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom]               = useState<HumeurRoom | null>(null);
  const [players, setPlayers]         = useState<HumeurPlayer[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [moodError, setMoodError]     = useState<string | null>(null);
  const [revealing, setRevealing]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [setId, setSetId]             = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Charger l'identité
  useEffect(() => {
    const stored = localStorage.getItem(`humeur_player_${upperCode}`);
    if (!stored) { router.replace(`/mini-jeux/humeur/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/mini-jeux/humeur/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Set d'images déterministe via le code de room
  useEffect(() => {
    if (upperCode) setSetId(pickSetForRoom(upperCode));
  }, [upperCode]);

  // Charger la room
  useEffect(() => {
    if (!playerId) return;

    async function init() {
      const res = await fetch(`/api/humeur/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as HumeurRoom & { players: HumeurPlayer[] };
      setRoom(data);
      setPlayers(data.players ?? []);

      if (data.status === "lobby") { router.replace(`/mini-jeux/humeur/${upperCode}/lobby`); return; }
      if (data.status === "finished") { router.replace(`/mini-jeux/humeur/${upperCode}/results`); return; }

      const me = (data.players ?? []).find((p) => p.id === playerId);
      if (me?.mood_id) setSelectedMood(me.mood_id);

      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  // Polling après sélection
  useEffect(() => {
    if (!selectedMood || !playerId) return;

    async function pollRoom() {
      const res = await fetch(`/api/humeur/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) return;
      const data = await res.json() as HumeurRoom & { players: HumeurPlayer[] };
      setPlayers(data.players ?? []);
      if (data.status === "finished") router.push(`/mini-jeux/humeur/${upperCode}/results`);
    }

    pollRoom();
    pollRef.current = setInterval(pollRoom, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMood, playerId, upperCode]);

  async function handleSelectMood(moodId: string) {
    if (submitting || selectedMood) return;
    setSubmitting(true);
    setMoodError(null);

    const res = await fetch(`/api/humeur/room/${upperCode}/mood`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ playerId, moodId }),
    });

    if (res.ok) {
      setSelectedMood(moodId);
      setPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, mood_id: moodId } : p));
    } else {
      setMoodError("Erreur lors de l'enregistrement. Réessayez.");
    }
    setSubmitting(false);
  }

  async function handleReveal() {
    setRevealing(true);
    try {
      await fetch(`/api/humeur/room/${upperCode}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
      router.push(`/mini-jeux/humeur/${upperCode}/results`);
    } catch {
      setRevealing(false);
    }
  }

  if (loading || !setId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  const isHost = room?.host_player_id === playerId;

  if (selectedMood) {
    return (
      <WaitingScreen
        players={players}
        myPlayerId={playerId}
        myMoodId={selectedMood}
        setId={setId}
        isHost={isHost}
        onReveal={handleReveal}
        revealing={revealing}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Comment tu te sens aujourd&apos;hui ?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choisissez l&apos;image qui vous correspond le mieux.
          </p>
        </div>

        {/* Grille 3×3 */}
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleSelectMood(mood.id)}
              disabled={submitting}
              className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-rose-400 hover:scale-[1.03] transition-all duration-150 active:scale-95 disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              <Image
                src={getMoodImageUrl(setId, mood.index)}
                alt={mood.label}
                fill
                className="object-cover"
                sizes="33vw"
              />
            </button>
          ))}
        </div>

        {submitting && (
          <div className="flex items-center justify-center gap-2 mt-6 text-gray-400 text-sm">
            <Loader2 size={14} className="animate-spin" /> Enregistrement…
          </div>
        )}
        {moodError && (
          <p className="mt-4 text-sm text-red-500 text-center">{moodError}</p>
        )}
      </main>
    </div>
  );
}
