"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, Crown, Plus, CheckCircle2,
  LogOut, AlertCircle, Play, Link2, X, Check, UserCircle2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { QRShare } from "@/components/QRShare";
import { GamePicker, type GameType, type LaunchResult } from "./GamePicker";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = (code: string) => `session_player_${code}`;

// Clé localStorage attendue par chaque page de jeu
const GAME_LS_KEY: Record<GameType, (code: string) => string> = {
  retrospective: (c) => `retro_player_${c}`,
  abcde:         (c) => `abcde_player_${c}`,
  kudo_cards:    (c) => `kudo_player_${c}`,
  roti:          (c) => `roti_player_${c}`,
  undercover:    (c) => `undercover_player_${c}`,
  chaine:        (c) => `chaine_player_${c}`,
  code_secret:   (c) => `code_secret_player_${c}`,
  speed_retro:   (c) => `speed_retro_player_${c}`,
  draw:          (c) => `draw_player_${c}`,
  boussole:      (c) => `boussole_player_${c}`,
  humeur:        (c) => `humeur_player_${c}`,
  tribu:         (c) => `tribu_player_${c}`,
};

const GAME_LOBBY_URL: Record<GameType, (code: string) => string> = {
  retrospective: (c) => `/toolbox/health-radar/${c}/lobby`,
  abcde:         (c) => `/toolbox/abcde/${c}/lobby`,
  kudo_cards:    (c) => `/toolbox/kudo-cards/${c}/lobby`,
  roti:          (c) => `/toolbox/roti/${c}/lobby`,
  undercover:    (c) => `/toolbox/undercover/${c}/lobby`,
  chaine:        (c) => `/toolbox/chaine/${c}/lobby`,
  code_secret:   (c) => `/toolbox/code-secret/${c}/lobby`,
  speed_retro:   (c) => `/toolbox/speed-retro/${c}/lobby`,
  draw:          (c) => `/toolbox/draw/${c}/lobby`,
  boussole:      (c) => `/toolbox/boussole/${c}/lobby`,
  humeur:        (c) => `/toolbox/humeur/${c}/lobby`,
  tribu:         (c) => `/toolbox/tribu/${c}/lobby`,
};

const GAME_LABEL: Record<GameType, string> = {
  retrospective: "Rétrospective",
  abcde:         "ABCDE",
  kudo_cards:    "Kudo Cards",
  roti:          "ROTI",
  undercover:    "Undercover",
  chaine:        "La Chaîne",
  code_secret:   "Code Secret",
  speed_retro:   "Speed Rétro",
  draw:          "Draw",
  boussole:      "Boussole",
  humeur:        "Humeur du jour",
  tribu:         "Tribu",
};

type Participant = {
  id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
};

type Collaborator = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

type ParticipantLink = {
  session_participant_id: string;
  collaborator_id: string;
  collaborators: { first_name: string; last_name: string } | null;
};

type Activity = {
  id: string;
  game_type: GameType;
  room_code: string;
  order: number;
  status: "active" | "finished";
  started_at: string;
};

type SessionData = {
  session: {
    id: string;
    code: string;
    name: string | null;
    status: "lobby" | "playing" | "between_games" | "finished";
  };
  participants: Participant[];
  activities: Activity[];
  currentActivity: Activity | null;
};

export default function SessionHostPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [participantId, setParticipantId] = useState("");
  const [playerSecret, setPlayerSecret]   = useState("");
  const [pseudo, setPseudo]               = useState("");
  const [avatarColor, setAvatarColor]     = useState("#3b82f6");
  const [sessionData, setSessionData]     = useState<SessionData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [showPicker, setShowPicker]       = useState(false);
  const [ending, setEnding]               = useState(false);
  const [endError, setEndError]           = useState<string | null>(null);
  const [notHost, setNotHost]             = useState(false);

  const [collaborators, setCollaborators]         = useState<Collaborator[] | null>(null);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [participantLinks, setParticipantLinks]   = useState<ParticipantLink[]>([]);
  const [linkingParticipant, setLinkingParticipant] = useState<string | null>(null);
  const [savingLink, setSavingLink]               = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/session/join?code=${upperCode}`
      : "";

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { label: `Session ${upperCode}` },
  ];

  // Chargement identité depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(upperCode));
    if (!stored) {
      router.replace(`/session/create`);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        participantId: string;
        playerSecret: string;
        pseudo: string;
        avatarColor: string;
      };
      setParticipantId(parsed.participantId);
      setPlayerSecret(parsed.playerSecret);
      setPseudo(parsed.pseudo);
      setAvatarColor(parsed.avatarColor);
    } catch {
      router.replace(`/session/create`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  // Fetch + Realtime : état de la session
  useEffect(() => {
    if (!participantId) return;

    async function fetchSession() {
      const res = await fetch(`/api/sessions/${upperCode}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json() as SessionData;
      setSessionData(data);
      setLoading(false);

      // Vérifier que l'utilisateur est bien l'hôte
      const me = data.participants.find((p) => p.id === participantId);
      if (me && !me.is_host) setNotHost(true);
    }

    fetchSession();

    // Polling de secours toutes les 5s
    pollRef.current = setInterval(fetchSession, 5000);

    // Canal Realtime — participants + changements de statut
    const supabase = createClient();
    const channel = supabase
      .channel(`session-host-${upperCode}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "session_participants" },
        () => { fetchSession(); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `code=eq.${upperCode}` },
        () => { fetchSession(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_activities" },
        () => { fetchSession(); }
      )
      .subscribe();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId, upperCode]);

  // Chargement des liens existants dès que l'identité hôte est disponible
  useEffect(() => {
    if (!participantId || !playerSecret) return;

    async function loadLinks() {
      const qs = `participantId=${participantId}&playerSecret=${encodeURIComponent(playerSecret)}`;
      const res = await fetch(`/api/sessions/${upperCode}/participant-links?${qs}`, { cache: "no-store" });
      if (res.ok) {
        const d = await res.json() as { links: ParticipantLink[] };
        setParticipantLinks(d.links ?? []);
      }
    }

    loadLinks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId, playerSecret, upperCode]);

  // Ouvre la modal et charge les collaborateurs à la demande
  async function openLinkModal(targetParticipantId: string) {
    setLinkingParticipant(targetParticipantId);
    if (collaborators !== null) return; // déjà chargés
    setLoadingCollaborators(true);
    try {
      const qs = `participantId=${participantId}&playerSecret=${encodeURIComponent(playerSecret)}`;
      const res = await fetch(`/api/sessions/${upperCode}/collaborators?${qs}`, { cache: "no-store" });
      if (res.ok) {
        const d = await res.json() as { collaborators: Collaborator[] };
        setCollaborators(d.collaborators ?? []);
      } else {
        setCollaborators([]);
      }
    } catch {
      setCollaborators([]);
    } finally {
      setLoadingCollaborators(false);
    }
  }

  async function linkParticipant(targetParticipantId: string, collaboratorId: string | null) {
    setSavingLink(true);
    try {
      const res = await fetch(`/api/sessions/${upperCode}/participant-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostParticipantId: participantId,
          playerSecret,
          targetParticipantId,
          collaboratorId,
        }),
      });
      if (res.ok) {
        // Rafraîchir les liens
        const linksRes = await fetch(
          `/api/sessions/${upperCode}/participant-links?participantId=${participantId}&playerSecret=${encodeURIComponent(playerSecret)}`,
          { cache: "no-store" }
        );
        if (linksRes.ok) {
          const d = await linksRes.json() as { links: ParticipantLink[] };
          setParticipantLinks(d.links ?? []);
        }
      }
    } finally {
      setSavingLink(false);
      setLinkingParticipant(null);
    }
  }

  function handleLaunched(result: LaunchResult) {
    setShowPicker(false);

    // Récupération de l'ID du player hôte dans le jeu
    const hostGamePlayerId = result.gamePlayers[participantId];

    if (hostGamePlayerId) {
      // Stocker les credentials dans le format attendu par la page de jeu
      localStorage.setItem(
        GAME_LS_KEY[result.gameType](result.roomCode),
        JSON.stringify({
          playerId: hostGamePlayerId,
          playerSecret,
          pseudo,
          avatarColor,
        })
      );
    }

    // Arrêter le polling pendant la navigation
    if (pollRef.current) clearInterval(pollRef.current);

    router.push(GAME_LOBBY_URL[result.gameType](result.roomCode));
  }

  async function endSession() {
    setEnding(true);
    setEndError(null);
    try {
      const res = await fetch(`/api/sessions/${upperCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, playerSecret }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setEndError(d.error ?? "Erreur lors de la clôture.");
      }
      // Le polling mettra à jour le statut automatiquement
    } catch {
      setEndError("Erreur de connexion.");
    } finally {
      setEnding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Session introuvable.
        </div>
      </div>
    );
  }

  if (notHost) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-xs text-center space-y-3">
            <AlertCircle size={32} className="mx-auto text-amber-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tu n&apos;es pas l&apos;hôte de cette session.
            </p>
            <button
              onClick={() => router.push(`/session/${upperCode}`)}
              className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
            >
              Voir l&apos;écran participant
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { session, participants, activities } = sessionData;
  const finishedActivities = activities.filter((a) => a.status === "finished");
  const currentActivity    = sessionData.currentActivity;
  const isFinished         = session.status === "finished";
  const isPlaying          = session.status === "playing";
  const canLaunch          = !isFinished && !isPlaying;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <main className="flex-1 max-w-md mx-auto w-full px-6 py-8 space-y-6">

          {/* En-tête session */}
          <div className="text-center">
            {session.name && (
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-0.5">
                {session.name}
              </p>
            )}
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              Code de session
            </p>
            <p className="text-5xl font-bold font-mono tracking-widest text-gray-900 dark:text-white mb-4">
              {upperCode}
            </p>
            <QRShare
              url={shareUrl}
              label="Partager aux participants"
              filename={`session-${upperCode}`}
              wrapperCls="bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900"
              labelCls="text-violet-700 dark:text-violet-300"
              urlCls="text-violet-800 dark:text-violet-200"
              copyBtnCls="bg-white dark:bg-violet-900 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-800"
            />
          </div>

          {/* Participants */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                Participants ({participants.length})
              </span>
            </div>
            {participants.length === 0 ? (
              <div className="px-4 py-6 flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-gray-300" />
                <span className="text-sm text-gray-400">En attente…</span>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                {participants.map((p) => {
                  const link = participantLinks.find((l) => l.session_participant_id === p.id);
                  const linkedCollab = link?.collaborators;
                  return (
                    <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.avatar_color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {p.pseudo}
                          {p.id === participantId && (
                            <span className="ml-1.5 text-xs text-gray-400 font-normal">(vous)</span>
                          )}
                        </span>
                        {linkedCollab && (
                          <p className="text-xs text-violet-600 dark:text-violet-400 truncate">
                            {linkedCollab.first_name} {linkedCollab.last_name}
                          </p>
                        )}
                      </div>
                      {p.is_host ? (
                        <Crown size={14} className="text-amber-500 flex-shrink-0" />
                      ) : (
                        <button
                          onClick={() => openLinkModal(p.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                            linkedCollab
                              ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800"
                              : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-600 dark:hover:text-violet-400"
                          }`}
                        >
                          <Link2 size={11} />
                          {linkedCollab ? "Lié" : "Lier"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Activité en cours */}
          {isPlaying && currentActivity && (
            <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 mb-1">
                En cours
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                  {GAME_LABEL[currentActivity.game_type]}
                </p>
                <button
                  onClick={() => router.push(GAME_LOBBY_URL[currentActivity.game_type](currentActivity.room_code))}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  <Play size={12} /> Rejoindre
                </button>
              </div>
              <p className="text-xs text-violet-500 font-mono mt-0.5">{currentActivity.room_code}</p>
            </div>
          )}

          {/* Activités terminées */}
          {finishedActivities.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Activités jouées ({finishedActivities.length})
              </p>
              <ul className="space-y-2">
                {finishedActivities.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3"
                  >
                    <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {GAME_LABEL[a.game_type]}
                    </span>
                    <span className="text-xs font-mono text-gray-400">{a.room_code}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* État terminé */}
          {isFinished && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-5 text-center">
              <CheckCircle2 size={24} className="mx-auto text-green-500 mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Session terminée
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activities.length} activité{activities.length > 1 ? "s" : ""} jouée{activities.length > 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Actions hôte */}
          {!isFinished && (
            <div className="space-y-3">
              <button
                onClick={() => setShowPicker(true)}
                disabled={isPlaying}
                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
              >
                <Plus size={16} />
                {isPlaying ? "Activité en cours…" : "Lancer une activité"}
              </button>

              {endError && (
                <p className="text-xs text-red-500 text-center">{endError}</p>
              )}

              <button
                onClick={endSession}
                disabled={ending}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {ending
                  ? <Loader2 size={14} className="animate-spin" />
                  : <LogOut size={14} />
                }
                {ending ? "Clôture…" : "Terminer la session"}
              </button>
            </div>
          )}

        </main>
      </div>

      {showPicker && (
        <GamePicker
          sessionCode={upperCode}
          participantId={participantId}
          playerSecret={playerSecret}
          onLaunched={handleLaunched}
          onClose={() => setShowPicker(false)}
        />
      )}

      {linkingParticipant && (() => {
        const target = participants.find((p) => p.id === linkingParticipant);
        const currentLink = participantLinks.find((l) => l.session_participant_id === linkingParticipant);
        return (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm"
            onClick={() => setLinkingParticipant(null)}
          >
            <div
              className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Associer à un collaborateur
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Participant : <span className="font-medium text-gray-700 dark:text-gray-300">{target?.pseudo}</span>
                  </p>
                </div>
                <button
                  onClick={() => setLinkingParticipant(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {loadingCollaborators ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={16} className="animate-spin mr-2" /> Chargement…
                </div>
              ) : !collaborators || collaborators.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>Aucun collaborateur trouvé.</p>
                  <p className="text-xs mt-1 text-gray-400">Créez-en depuis la section{" "}
                    <span className="font-medium text-violet-600 dark:text-violet-400">1:1 Coach</span>.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {collaborators.map((c) => {
                    const isLinked = currentLink?.collaborator_id === c.id;
                    return (
                      <li key={c.id}>
                        <button
                          disabled={savingLink}
                          onClick={() => linkParticipant(linkingParticipant, isLinked ? null : c.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            isLinked
                              ? "bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                          } disabled:opacity-50`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                            <UserCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isLinked ? "text-violet-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-200"}`}>
                              {c.first_name} {c.last_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{c.role}</p>
                          </div>
                          {isLinked && (
                            savingLink
                              ? <Loader2 size={14} className="animate-spin text-violet-400 flex-shrink-0" />
                              : <Check size={14} className="text-violet-500 flex-shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {currentLink && (
                <button
                  disabled={savingLink}
                  onClick={() => linkParticipant(linkingParticipant, null)}
                  className="w-full py-2 text-xs text-red-500 dark:text-red-400 hover:underline disabled:opacity-50"
                >
                  Retirer le lien
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
