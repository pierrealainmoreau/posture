"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Crown, Play, Link2, X, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { QRShare } from "@/components/QRShare";
import { DemoBotsButton } from "@/components/DemoBotsButton";
import type { HumeurRoom, HumeurPlayer } from "@/lib/humeur/types";

interface Collaborator {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function HumeurLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState<string>("");
  const [playerSecret, setPlayerSecret] = useState<string>("");
  const [room, setRoom]         = useState<HumeurRoom | null>(null);
  const [players, setPlayers]   = useState<HumeurPlayer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const pollCountRef = useRef(0);

  // Linking state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collabsLoaded, setCollabsLoaded] = useState(false);
  const [loadingCollabs, setLoadingCollabs] = useState(false);
  const [links, setLinks] = useState<Record<string, string>>({}); // pseudo → collaboratorId
  const [linkingPseudo, setLinkingPseudo] = useState<string | null>(null);
  const [savingLink, setSavingLink] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/mini-jeux/humeur/join?code=${upperCode}`
      : "";

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/mini-jeux", label: "Mini-jeux" },
    { href: "/mini-jeux/humeur", label: "Humeur du jour" },
    { label: "Lobby" },
  ];

  // Step 1 : charger l'identité depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`humeur_player_${upperCode}`);
    if (!stored) {
      router.replace(`/mini-jeux/humeur/join?code=${upperCode}`);
      return;
    }
    try {
      const { playerId: pid, playerSecret: secret } = JSON.parse(stored) as { playerId: string; playerSecret?: string };
      setPlayerId(pid);
      setPlayerSecret(secret ?? "");
    } catch {
      router.replace(`/mini-jeux/humeur/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Step 2 : polling toutes les 2s
  useEffect(() => {
    if (!playerId) return;

    async function fetchRoom() {
      const res = await fetch(`/api/humeur/room/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as HumeurRoom & { players: HumeurPlayer[] };
      const fetchedPlayers = data.players ?? [];

      if (data.status === "lobby" && data.host_player_id !== playerId) {
        pollCountRef.current++;
        const iAmInList = fetchedPlayers.some((p) => p.id === playerId);
        if (!iAmInList && pollCountRef.current >= 2) {
          setNotRegistered(true);
        } else if (iAmInList) {
          pollCountRef.current = 0;
          setNotRegistered(false);
        }
      }

      setRoom(data);
      setPlayers(fetchedPlayers);
      setLoading(false);

      if (data.status === "playing") {
        router.push(`/mini-jeux/humeur/${upperCode}/play`);
      } else if (data.status === "finished") {
        router.push(`/mini-jeux/humeur/${upperCode}/results`);
      }
    }

    fetchRoom();
    const id = setInterval(fetchRoom, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, upperCode]);

  async function startGame() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/humeur/room/${upperCode}/start`, {
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

  // Load existing links when host lobby is ready
  useEffect(() => {
    if (!isHost || !playerId) return;
    fetch(`/api/game/humeur/${upperCode}/participant-links`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { links?: Array<{ player_pseudo: string; collaborator_id: string }> }) => {
        const map: Record<string, string> = {};
        for (const l of data.links ?? []) map[l.player_pseudo] = l.collaborator_id;
        setLinks(map);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, playerId]);

  async function openLinkModal(pseudo: string) {
    setLinkingPseudo(pseudo);
    if (collabsLoaded) return;
    setLoadingCollabs(true);
    try {
      const res = await fetch(`/api/game/humeur/${upperCode}/collaborators`, { cache: "no-store" });
      const data = await res.json() as { collaborators?: Collaborator[] };
      setCollaborators(data.collaborators ?? []);
      setCollabsLoaded(true);
    } catch {
      // silent
    } finally {
      setLoadingCollabs(false);
    }
  }

  async function saveLink(pseudo: string, collaboratorId: string | null) {
    setSavingLink(true);
    try {
      const res = await fetch(`/api/game/humeur/${upperCode}/participant-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerPseudo: pseudo, collaboratorId }),
      });
      if (res.ok) {
        setLinks((prev) => {
          const next = { ...prev };
          if (collaboratorId === null) delete next[pseudo];
          else next[pseudo] = collaboratorId;
          return next;
        });
      }
    } catch {
      // silent
    } finally {
      setSavingLink(false);
    }
  }

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
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">

        {/* Code */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Code de la session
          </p>
          <p className="text-5xl font-bold font-mono tracking-widest text-gray-900 dark:text-white mb-4">
            {upperCode}
          </p>
          <QRShare
            url={shareUrl}
            label="Partagez ce lien aux participants"
            filename={`humeur-${upperCode}`}
            wrapperCls="bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900"
            labelCls="text-rose-700 dark:text-rose-300"
            urlCls="text-rose-800 dark:text-rose-200"
            copyBtnCls="bg-white dark:bg-rose-900 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-800"
          />
        </div>

        {/* Players */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              Participants ({players.length})
            </span>
            {players.length < 2 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                En attente d&apos;au moins 2 participants…
              </span>
            )}
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
                  {p.is_host ? (
                    <Crown size={14} className="text-amber-500 flex-shrink-0" aria-label="Animateur" />
                  ) : isHost ? (
                    <button
                      onClick={() => openLinkModal(p.pseudo)}
                      title="Lier à un collaborateur"
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        links[p.pseudo]
                          ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Link2 size={11} />
                      {links[p.pseudo] ? "Lié" : "Lier"}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isHost && (
          <div className="flex flex-col items-stretch gap-2">
            {startError && (
              <p className="text-xs text-red-500 dark:text-red-400 text-center">{startError}</p>
            )}
            <button
              onClick={startGame}
              disabled={players.length < 2 || starting}
              className="flex items-center justify-center gap-2 py-3 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 disabled:opacity-40 transition-colors"
            >
              {starting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {starting ? "Démarrage…" : "Démarrer la session"}
            </button>
            {players.length < 2 && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                En attente d&apos;au moins 2 participants pour démarrer.
              </p>
            )}
            <DemoBotsButton game="humeur" code={upperCode} playerId={playerId} playerSecret={playerSecret} />
          </div>
        )}

        {!isHost && notRegistered && (
          <div className="flex flex-col items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-4 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Votre session n&apos;est plus reconnue dans cette partie.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem(`humeur_player_${upperCode}`);
                router.replace(`/mini-jeux/humeur/join?code=${upperCode}`);
              }}
              className="px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors"
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

      {/* Modal : lier un participant à un collaborateur */}
      {linkingPseudo !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setLinkingPseudo(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl pb-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Lier <span className="text-rose-500">{linkingPseudo}</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Associer ce participant à un collaborateur
                </p>
              </div>
              <button
                onClick={() => setLinkingPseudo(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 pt-3 max-h-72 overflow-y-auto">
              {loadingCollabs ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  <span className="text-sm">Chargement…</span>
                </div>
              ) : collaborators.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                  Aucun collaborateur enregistré.<br />
                  <a href="/coach" className="text-rose-500 hover:underline text-xs">
                    Ajouter un collaborateur
                  </a>
                </p>
              ) : (
                <ul className="space-y-1">
                  {/* Option délier si déjà lié */}
                  {links[linkingPseudo] && (
                    <li>
                      <button
                        disabled={savingLink}
                        onClick={() => saveLink(linkingPseudo, null)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                      >
                        <X size={14} className="flex-shrink-0" />
                        Retirer le lien
                      </button>
                    </li>
                  )}
                  {collaborators.map((c) => {
                    const isLinked = links[linkingPseudo] === c.id;
                    return (
                      <li key={c.id}>
                        <button
                          disabled={savingLink || isLinked}
                          onClick={() => saveLink(linkingPseudo, c.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors disabled:opacity-60 ${
                            isLinked
                              ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          <span className="flex-1 font-medium">
                            {c.first_name} {c.last_name}
                            {c.role && (
                              <span className="ml-1.5 text-xs font-normal text-gray-400">{c.role}</span>
                            )}
                          </span>
                          {isLinked && <Check size={14} className="flex-shrink-0 text-violet-600" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
