"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, RefreshCw, LogOut, RotateCcw } from "lucide-react";
import { Header } from "@/components/Header";
import type { TribuRoom, TribuPlayer, TribuResult, Tribe } from "@/lib/tribu/types";
import { TRIBE_PROFILES } from "@/lib/tribu/tribe-names";
import { ContinueSessionButton } from "@/components/ContinueSessionButton";

function getProfile(profileId: string) {
  return TRIBE_PROFILES.find((p) => p.id === profileId) ?? TRIBE_PROFILES[0];
}

// ── Tribe card ────────────────────────────────────────────────────────────────
function TribeCard({
  tribe,
  players,
  myPlayerId,
  index,
  visible,
}: {
  tribe: Tribe;
  players: TribuPlayer[];
  myPlayerId: string;
  index: number;
  visible: boolean;
}) {
  const profile = getProfile(tribe.profileId);
  const tribeMembers = players.filter((p) => tribe.playerIds.includes(p.id));
  const isMyTribe = tribe.playerIds.includes(myPlayerId);

  return (
    <div
      className={`transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
      }`}
      style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
    >
      <div
        className={`bg-white dark:bg-gray-900 border-2 rounded-2xl p-5 ${
          isMyTribe
            ? "border-teal-500 shadow-lg shadow-teal-100 dark:shadow-teal-950"
            : "border-gray-200 dark:border-gray-800"
        }`}
      >
        {isMyTribe && (
          <span className="inline-block mb-3 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-full">
            Votre tribu
          </span>
        )}
        <div className="flex items-start gap-4 mb-4">
          <span className="text-4xl">{profile.emoji}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {profile.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {profile.tagline}
            </p>
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tribeMembers.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-full px-2.5 py-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: p.avatar_color }}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {p.pseudo}
              </span>
            </div>
          ))}
        </div>

        {/* Affinity score */}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Affinité interne</span>
          <span className="font-semibold text-teal-600 dark:text-teal-400">
            {tribe.similarityScore} %
          </span>
        </div>
        {tribe.similarityScore > 0 && (
          <div className="mt-1.5 w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full"
              style={{ width: `${tribe.similarityScore}%` }}
            />
          </div>
        )}

        {/* Signature answers */}
        {tribe.signatureAnswers && tribe.signatureAnswers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">
              En accord total :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tribe.signatureAnswers.map((sa) => (
                <span
                  key={sa.questionId}
                  className="text-xs bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full"
                >
                  {sa.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TribuResultsPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId] = useState("");
  const [room, setRoom] = useState<TribuRoom | null>(null);
  const [players, setPlayers] = useState<TribuPlayer[]>([]);
  const [result, setResult] = useState<TribuResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"intro" | "revealing" | "done">("intro");
  const [revealedCount, setRevealedCount] = useState(0);
  const [replaying, setReplaying] = useState(false);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/mini-jeux", label: "Mini-jeux" },
    { href: "/mini-jeux/tribu", label: "Tribu" },
    { label: "Résultats" },
  ];

  // Load identity
  useEffect(() => {
    const stored = localStorage.getItem(`tribu_player_${upperCode}`);
    if (stored) {
      try {
        const { playerId: pid } = JSON.parse(stored) as { playerId: string };
        setPlayerId(pid);
      } catch { /* ignore */ }
    }
  }, [upperCode]);

  // Load room + results
  useEffect(() => {
    async function load() {
      const [roomRes, resultsRes] = await Promise.all([
        fetch(`/api/tribu/room/${upperCode}`),
        fetch(`/api/tribu/room/${upperCode}/results`),
      ]);

      if (roomRes.ok) {
        const data = await roomRes.json() as TribuRoom & { players: TribuPlayer[] };
        setRoom(data);
        setPlayers(data.players ?? []);
      }
      if (resultsRes.ok) {
        const data = await resultsRes.json() as TribuResult;
        setResult(data);
      }
      setLoading(false);
    }
    load();
  }, [upperCode]);

  // Animation sequence: intro → revealing tribes one by one
  useEffect(() => {
    if (loading || !result) return;

    const introTimer = setTimeout(() => {
      setStep("revealing");
      setRevealedCount(1);
    }, 2000);

    return () => clearTimeout(introTimer);
  }, [loading, result]);

  // Auto-advance remaining tribes every 2.5s for non-hosts
  const isHost = room?.host_player_id === playerId;

  useEffect(() => {
    if (step !== "revealing" || !result || isHost) return;

    const tribes = result.tribes ?? [];
    if (revealedCount >= tribes.length) {
      setStep("done");
      return;
    }

    const timer = setTimeout(() => {
      setRevealedCount((c) => {
        const next = c + 1;
        if (next >= tribes.length) setStep("done");
        return next;
      });
    }, 2500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, revealedCount, result, isHost]);

  async function handleReplay() {
    if (!playerId) return;
    setReplaying(true);
    try {
      const res = await fetch(`/api/tribu/room/${upperCode}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) {
        router.push(`/mini-jeux/tribu/${upperCode}/lobby`);
      }
    } catch {
      setReplaying(false);
    }
  }

  function revealNext() {
    const tribes = result?.tribes ?? [];
    if (revealedCount < tribes.length) {
      const next = revealedCount + 1;
      setRevealedCount(next);
      if (next >= tribes.length) setStep("done");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  const tribes = result?.tribes ?? [];

  // ── Intro screen
  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-6 animate-pulse">🧭</div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Les tribus se forment…
        </h2>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Revelation + done
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={isHost ? breadcrumbs : undefined} guestMode={!isHost} />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Vos tribus
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tribes.length} tribu{tribes.length !== 1 ? "s" : ""} pour {players.length} joueur{players.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {tribes.map((tribe, i) => (
            <TribeCard
              key={tribe.id}
              tribe={tribe}
              players={players}
              myPlayerId={playerId}
              index={i}
              visible={i < revealedCount}
            />
          ))}
        </div>

        {/* Host controls during revelation */}
        {isHost && step === "revealing" && revealedCount < tribes.length && (
          <button
            onClick={revealNext}
            className="w-full py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors mb-4"
          >
            Révéler la tribu suivante ({revealedCount} / {tribes.length})
          </button>
        )}

        {/* End actions */}
        {step === "done" && (
          <div className="flex flex-col gap-3 mt-4">
            <ContinueSessionButton gameType="tribu" roomCode={upperCode} />
            {isHost ? (
              <>
                <button
                  onClick={handleReplay}
                  disabled={replaying}
                  className="flex items-center justify-center gap-2 py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {replaying ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RotateCcw size={14} />
                  )}
                  {replaying ? "Réinitialisation…" : "Rejouer avec les mêmes joueurs"}
                </button>
                <Link
                  href="/mini-jeux/tribu/create"
                  className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw size={14} />
                  Nouvelle partie
                </Link>
                <Link
                  href="/mini-jeux"
                  className="flex items-center justify-center gap-2 py-3 text-gray-400 dark:text-gray-500 text-sm rounded-xl hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  <LogOut size={14} />
                  Quitter
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem(`tribu_player_${upperCode}`);
                  window.close();
                }}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogOut size={14} />
                Fermer la session
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
