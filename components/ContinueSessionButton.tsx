"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, ArrowLeft } from "lucide-react";

import Link from "next/link";

type GameType =
  | "retrospective" | "abcde" | "kudo_cards" | "roti"
  | "undercover" | "chaine" | "code_secret" | "speed_retro" | "draw"
  | "boussole" | "humeur" | "tribu" | "thisorthat" | "completephrase";

type SessionInfo = {
  sessionCode: string;
  sessionId: string;
  activityId: string | null;
  activityStatus: string | null;
};

type StoredSession = {
  participantId: string;
  playerSecret: string;
  pseudo: string;
  avatarColor: string;
  is_host: boolean;
};

type Props = {
  gameType: GameType;
  roomCode: string;
};

// Composant autonome affiché sur les pages de résultats de jeu :
// - Hôte : bouton "Continuer la session →" (marque l'activité terminée + retour au panneau hôte)
// - Participant : lien "← Retour à la session" (pour rejoindre l'écran d'attente du prochain jeu)
export function ContinueSessionButton({ gameType, roomCode }: Props) {
  const router = useRouter();
  const [sessionInfo, setSessionInfo]     = useState<SessionInfo | null>(null);
  const [storedSession, setStoredSession] = useState<StoredSession | null>(null);
  const [loading, setLoading]             = useState(true);
  const [continuing, setContinuing]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(
          `/api/sessions/by-room?gameType=${gameType}&roomCode=${roomCode}`,
          { cache: "no-store" }
        );
        const data = await res.json() as { session: SessionInfo | null };

        if (!data.session) { setLoading(false); return; }

        const stored = localStorage.getItem(`session_player_${data.session.sessionCode}`);
        if (!stored) { setLoading(false); return; }

        const parsed = JSON.parse(stored) as StoredSession;
        setSessionInfo(data.session);
        setStoredSession(parsed);
      } catch {
        // Erreur silencieuse — les boutons ne s'affichent pas
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [gameType, roomCode]);

  async function handleContinue() {
    if (!sessionInfo || !storedSession) return;
    setContinuing(true);
    setError(null);

    try {
      if (sessionInfo.activityId && sessionInfo.activityStatus === "active") {
        const res = await fetch(
          `/api/sessions/${sessionInfo.sessionCode}/activities/${sessionInfo.activityId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participantId: storedSession.participantId,
              playerSecret:  storedSession.playerSecret,
            }),
          }
        );
        if (!res.ok) {
          const d = await res.json() as { error?: string };
          if (!d.error?.includes("déjà terminée")) {
            setError(d.error ?? "Erreur lors de la clôture de l'activité.");
            setContinuing(false);
            return;
          }
        }
      }

      router.push(`/session/${sessionInfo.sessionCode}/host`);
    } catch {
      setError("Erreur de connexion.");
      setContinuing(false);
    }
  }

  if (loading || !sessionInfo || !storedSession) return null;

  // Participant non-hôte : simple lien de retour vers la salle d'attente
  if (!storedSession.is_host) {
    return (
      <Link
        href={`/session/${sessionInfo.sessionCode}`}
        className="w-full flex items-center justify-center gap-2 py-3 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-sm font-medium rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
      >
        <ArrowLeft size={15} />
        Retour à la session
      </Link>
    );
  }

  // Hôte : bouton de continuation avec clôture de l'activité
  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
      <button
        onClick={handleContinue}
        disabled={continuing}
        className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {continuing
          ? <Loader2 size={15} className="animate-spin" />
          : <ChevronRight size={15} />
        }
        {continuing ? "Retour à la session…" : "Continuer la session →"}
      </button>
    </div>
  );
}
