"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Crown, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { QRShare } from "@/components/QRShare";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = (code: string) => `session_player_${code}`;
const GAME_STORAGE_KEY = (game: string, code: string) => `${game}_player_${code}`;

type GameType =
  | "retrospective"
  | "abcde"
  | "kudo_cards"
  | "roti"
  | "undercover"
  | "chaine"
  | "code_secret"
  | "speed_retro"
  | "draw"
  | "boussole"
  | "humeur"
  | "tribu";

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

// URL du lobby pour chaque jeu, paramétrée par le code de la room
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

// Clé localStorage utilisée par chaque jeu (doit correspondre aux pages existantes)
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

type Participant = {
  id: string;
  pseudo: string;
  avatar_color: string;
  is_host: boolean;
  joined_at: string;
};

type Activity = {
  id: string;
  game_type: GameType;
  room_code: string;
  order: number;
  status: "active" | "finished";
  started_at: string;
  finished_at: string | null;
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

export default function SessionWaitPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [participantId, setParticipantId]   = useState<string>("");
  const [playerSecret, setPlayerSecret]     = useState<string>("");
  const [pseudo, setPseudo]                 = useState<string>("");
  const [avatarColor, setAvatarColor]       = useState<string>("#3b82f6");
  const [sessionData, setSessionData]       = useState<SessionData | null>(null);
  const [loading, setLoading]               = useState(true);
  const [redirecting, setRedirecting]       = useState(false);

  const lastActivityIdRef = useRef<string | null>(null);
  const sessionIdRef      = useRef<string | null>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/session/join?code=${upperCode}`
      : "";

  // Chargement de l'identité depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(upperCode));
    if (!stored) {
      router.replace(`/session/join?code=${upperCode}`);
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
      router.replace(`/session/join?code=${upperCode}`);
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

      // Mémoriser l'ID de session pour le canal Realtime
      if (data.session.id && !sessionIdRef.current) {
        sessionIdRef.current = data.session.id;
      }

      // Nouvelle activité détectée → préparer la redirection
      if (
        data.currentActivity &&
        data.currentActivity.id !== lastActivityIdRef.current &&
        !redirecting
      ) {
        lastActivityIdRef.current = data.currentActivity.id;
        await prepareAndRedirect(data.currentActivity, participantId, playerSecret, pseudo, avatarColor);
      }
    }

    fetchSession();

    // Polling de secours toutes les 5s
    const interval = setInterval(fetchSession, 5000);

    // Canal Realtime — écoute les changements sur sessions et session_activities
    const supabase = createClient();
    const channel = supabase
      .channel(`session-wait-${upperCode}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `code=eq.${upperCode}` },
        () => { fetchSession(); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "session_activities" },
        () => { fetchSession(); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "session_participants" },
        () => { fetchSession(); }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId, upperCode]);

  async function prepareAndRedirect(
    activity: Activity,
    pid: string,
    secret: string,
    userPseudo: string,
    userAvatarColor: string
  ) {
    setRedirecting(true);

    try {
      // Récupération de l'ID joueur dans le jeu via le endpoint de lookup
      const res = await fetch(
        `/api/sessions/${upperCode}/activities/${activity.id}/my-player?participantId=${pid}&playerSecret=${encodeURIComponent(secret)}`,
        { cache: "no-store" }
      );

      if (res.ok) {
        const { gamePlayerId } = await res.json() as { gamePlayerId: string };

        // Stockage dans localStorage au format attendu par les pages de jeu
        const lsKey = GAME_LS_KEY[activity.game_type](activity.room_code);
        localStorage.setItem(
          lsKey,
          JSON.stringify({
            playerId: gamePlayerId,
            playerSecret: secret,
            pseudo: userPseudo,
            avatarColor: userAvatarColor,
          })
        );
      }
    } catch {
      // Si le lookup échoue, on redirige quand même — le jeu gèrera l'absence de credentials
    }

    router.push(GAME_LOBBY_URL[activity.game_type](activity.room_code));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Session introuvable.
        </div>
      </div>
    );
  }

  const { session, participants, activities } = sessionData;
  const finishedActivities = activities.filter((a) => a.status === "finished");
  const isHost = participants.find((p) => p.id === participantId)?.is_host ?? false;

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500">
          <Loader2 size={24} className="animate-spin text-violet-500" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Lancement du jeu…
          </p>
        </div>
      </div>
    );
  }

  if (session.status === "finished") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Session terminée
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Merci d&apos;avoir participé !
            </p>
          </div>
          {finishedActivities.length > 0 && (
            <ActivityList activities={finishedActivities} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10 space-y-6">

        {/* Code + partage */}
        <div className="text-center">
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
            <div className="px-4 py-6 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin text-gray-300 mr-2" />
              <span className="text-sm text-gray-400">En attente de participants…</span>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {participants.map((p) => (
                <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.avatar_color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {p.pseudo}
                    {p.id === participantId && (
                      <span className="ml-1.5 text-xs text-gray-400 font-normal">(vous)</span>
                    )}
                  </span>
                  {p.is_host && <Crown size={14} className="text-amber-500 flex-shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Activités passées */}
        {finishedActivities.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Activités jouées
            </p>
            <ActivityList activities={finishedActivities} />
          </div>
        )}

        {/* Statut d'attente */}
        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 rounded-2xl px-4 py-5 text-center">
          {session.status === "playing" ? (
            <div className="flex items-center justify-center gap-2 text-sm text-violet-700 dark:text-violet-300">
              <Loader2 size={14} className="animate-spin" />
              Un jeu est en cours, tu vas être redirigé…
            </div>
          ) : (
            <>
              <Clock size={20} className="mx-auto text-violet-400 mb-2" />
              <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                {isHost
                  ? "Lance la prochaine activité depuis le panneau hôte."
                  : "L’hôte prépare la prochaine activité…"}
              </p>
            </>
          )}
        </div>

      </main>
    </div>
  );
}

function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <ul className="space-y-2">
      {activities.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3"
        >
          <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {GAME_LABEL[a.game_type] ?? a.game_type}
          </span>
          <span className="text-xs font-mono text-gray-400">{a.room_code}</span>
        </li>
      ))}
    </ul>
  );
}
