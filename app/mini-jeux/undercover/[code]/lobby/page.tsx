"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Crown, Play, Users, Minus, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { QRShare } from "@/components/QRShare";
import { suggestRoles } from "@/lib/undercover/types";
import type { RoomStateResponse, UndercoverPlayer } from "@/lib/undercover/types";

function RoleCounter({
  label,
  color,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  color: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: color }} />
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="w-5 text-center font-semibold text-sm text-gray-900 dark:text-white">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

export default function UndercoverLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState("");
  const [playerSecret, setPlayerSecret] = useState("");
  const [room, setRoom] = useState<RoomStateResponse | null>(null);
  const [players, setPlayers] = useState<UndercoverPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [nbUndercovers, setNbUndercovers] = useState(1);
  const [nbMrWhites, setNbMrWhites] = useState(1);
  const [savingSettings, setSavingSettings] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/mini-jeux/undercover/join?code=${upperCode}`
      : "";

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/mini-jeux", label: "Mini-jeux" },
    { href: "/mini-jeux/undercover", label: "Undercover" },
    { label: "Lobby" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(`undercover_player_${upperCode}`);
    if (!stored) {
      router.replace(`/mini-jeux/undercover/join?code=${upperCode}`);
      return;
    }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/mini-jeux/undercover/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/undercover/room/${upperCode}?playerId=${playerId}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store", "X-Player-Secret": playerSecret },
    });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json() as RoomStateResponse;
    setRoom(data);
    setPlayers(data.players ?? []);
    setNbUndercovers(data.nb_undercovers);
    setNbMrWhites(data.nb_mr_whites);
    setLoading(false);

    if (data.status === "description" || data.status === "discussion" || data.status === "voting" || data.status === "mr_white_guess") {
      router.push(`/mini-jeux/undercover/${upperCode}/play`);
    } else if (data.status === "finished") {
      router.push(`/mini-jeux/undercover/${upperCode}/results`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode, playerId, playerSecret]);

  useEffect(() => {
    if (!playerId) return;
    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  }, [playerId, fetchRoom]);

  // Auto-suggest roles when player count changes
  useEffect(() => {
    if (!room || room.host_player_id !== playerId) return;
    const suggested = suggestRoles(players.length);
    setNbUndercovers(room.nb_undercovers);
    setNbMrWhites(room.nb_mr_whites);
    // Only auto-apply suggestion if settings haven't been manually adjusted
    if (room.nb_undercovers === 1 && room.nb_mr_whites <= 1) {
      setNbUndercovers(suggested.nbUndercovers);
      setNbMrWhites(suggested.nbMrWhites);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  async function saveSettings(nb: number, nw: number) {
    if (!playerId || room?.host_player_id !== playerId) return;
    setSavingSettings(true);
    await fetch(`/api/undercover/room/${upperCode}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
      body: JSON.stringify({ playerId, nbUndercovers: nb, nbMrWhites: nw }),
    }).catch(() => null);
    setSavingSettings(false);
  }

  async function startGame() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/undercover/room/${upperCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Player-Secret": playerSecret },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) setStartError(data.error ?? "Erreur lors du démarrage");
    } catch {
      setStartError("Une erreur est survenue.");
    } finally {
      setStarting(false);
    }
  }

  const isHost = room?.host_player_id === playerId;
  const civilCount = players.length - nbUndercovers - nbMrWhites;
  const canStart = players.length >= 3 && civilCount >= 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode={!isHost} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} guestMode />
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Session introuvable.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10 space-y-5">

        {/* Room code + QR */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Code de la partie
          </p>
          <p className="text-5xl font-bold font-mono tracking-widest text-gray-900 dark:text-white mb-4">
            {upperCode}
          </p>
          <QRShare
            url={shareUrl}
            label="Partagez ce lien aux joueurs"
            filename={`undercover-${upperCode}`}
            wrapperCls="bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900"
            labelCls="text-indigo-700 dark:text-indigo-300"
            urlCls="text-indigo-800 dark:text-indigo-200"
            copyBtnCls="bg-white dark:bg-indigo-900 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-800"
          />
        </div>

        {/* Players list */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
              <Users size={14} className="text-gray-400" />
              Joueurs ({players.length})
            </span>
            {players.length < 3 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Minimum 3 joueurs
              </span>
            )}
          </div>
          {players.length === 0 ? (
            <div className="px-4 py-6 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin text-gray-300 mr-2" />
              <span className="text-sm text-gray-400">En attente de joueurs…</span>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {players.map((p) => (
                <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.avatar_color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {p.pseudo}
                    {p.id === playerId && (
                      <span className="ml-1.5 text-xs text-gray-400 font-normal">(vous)</span>
                    )}
                  </span>
                  {p.is_host && (
                    <Crown size={14} className="text-amber-500 flex-shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Role configuration (host only) */}
        {isHost && players.length >= 3 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Répartition des rôles
            </p>

            <RoleCounter
              label="Civils"
              color="#22c55e"
              value={civilCount}
              min={1}
              max={players.length - 1 - nbMrWhites}
              onChange={(v) => {
                // Ajuster les undercovers en miroir (civils ↑ = undercovers ↓)
                const delta = v - civilCount;
                let newUndercovers = Math.max(1, nbUndercovers - delta);
                // Si undercovers ne peut pas absorber tout le delta, ajuster mr_whites aussi
                const absorbed = nbUndercovers - newUndercovers;
                const remainder = delta - absorbed;
                const newMrWhites = Math.max(0, nbMrWhites - remainder);
                setNbUndercovers(newUndercovers);
                setNbMrWhites(newMrWhites);
                saveSettings(newUndercovers, newMrWhites);
              }}
              disabled={savingSettings}
            />
            <RoleCounter
              label="Undercover"
              color="#6366f1"
              value={nbUndercovers}
              min={1}
              max={players.length - 1 - nbMrWhites}
              onChange={(v) => {
                setNbUndercovers(v);
                saveSettings(v, nbMrWhites);
              }}
              disabled={savingSettings}
            />
            <RoleCounter
              label="Mr. White"
              color="#f59e0b"
              value={nbMrWhites}
              min={0}
              max={Math.max(0, players.length - nbUndercovers - 1)}
              onChange={(v) => {
                setNbMrWhites(v);
                saveSettings(nbUndercovers, v);
              }}
              disabled={savingSettings}
            />

            {civilCount < 1 && (
              <p className="mt-3 text-xs text-red-500 dark:text-red-400">
                Il faut au moins 1 Civil.
              </p>
            )}
          </div>
        )}

        {/* Non-host role info */}
        {!isHost && players.length >= 3 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Rôles configurés</p>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span><span className="font-semibold text-indigo-600">{nbUndercovers}</span> Undercover</span>
              <span><span className="font-semibold text-amber-600">{nbMrWhites}</span> Mr. White</span>
              <span><span className="font-semibold text-emerald-600">{Math.max(0, civilCount)}</span> Civils</span>
            </div>
          </div>
        )}

        {/* Start button / waiting */}
        {isHost ? (
          <div className="flex flex-col items-stretch gap-2">
            {startError && (
              <p className="text-xs text-red-500 dark:text-red-400 text-center">{startError}</p>
            )}
            <button
              onClick={startGame}
              disabled={!canStart || starting}
              className="flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {starting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {starting ? "Démarrage…" : "Démarrer la partie"}
            </button>
            {!canStart && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                {players.length < 3
                  ? "Il faut au moins 3 joueurs."
                  : "Réduisez le nombre d'infiltrés — il faut au moins 1 Civil."}
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Loader2 size={13} className="animate-spin" />
            En attente du démarrage par l&apos;animateur…
          </p>
        )}
      </main>
    </div>
  );
}
