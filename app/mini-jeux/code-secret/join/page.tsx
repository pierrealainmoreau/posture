"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS, TEAM_META, TEAMS } from "@/lib/code-secret/types";
import type { Team } from "@/lib/code-secret/types";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/mini-jeux", label: "Mini-jeux" },
  { href: "/mini-jeux/code-secret", label: "Code Secret" },
  { label: "Rejoindre" },
];

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode]               = useState(searchParams.get("code") ?? "");
  const [pseudo, setPseudo]           = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [team, setTeam]               = useState<Team>("red");
  const [gameMode, setGameMode]       = useState<"coop" | "competitive" | null>(null);
  const [joining, setJoining]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Fetch room mode when code is complete
  useEffect(() => {
    const upper = code.trim().toUpperCase();
    if (upper.length !== 6) { setGameMode(null); return; }

    let cancelled = false;
    fetch(`/api/code-secret/room/${upper}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!cancelled && data?.game_mode) setGameMode(data.game_mode);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const upperCode = code.trim().toUpperCase();
    if (!upperCode || !pseudo.trim()) return;
    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/code-secret/room/${upperCode}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim(), avatarColor, team: gameMode === "competitive" ? team : undefined }),
      });

      const data = await res.json() as { ok?: boolean; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok) {
        if (res.status === 404) setError("Code invalide. Vérifiez le code partagé par l'animateur.");
        else if (res.status === 409) setError("La partie a déjà commencé.");
        else setError(data.error ?? "Erreur lors de la connexion.");
        setJoining(false);
        return;
      }

      if (!data.playerId) {
        setError("Erreur lors de la création du joueur.");
        setJoining(false);
        return;
      }

      localStorage.setItem(
        `code_secret_player_${upperCode}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor, team: gameMode === "competitive" ? team : null })
      );

      router.push(`/mini-jeux/code-secret/${upperCode}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} guestMode />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Rejoindre une partie</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Code de la partie</label>
              <input
                type="text" required autoFocus value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="ABC123" maxLength={6}
                className="w-full px-3 py-2.5 text-sm font-mono tracking-widest uppercase rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Votre pseudo</label>
              <input
                type="text" required value={pseudo} onChange={(e) => setPseudo(e.target.value)}
                placeholder="Pierre, Marie…" maxLength={20}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur d&apos;avatar</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${avatarColor === color ? "ring-2 ring-offset-2 ring-amber-500 scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Team selection (competitive only) */}
            {gameMode === "competitive" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choisissez votre équipe</label>
                <div className="flex gap-2 flex-wrap">
                  {TEAMS.map((t) => {
                    const meta = TEAM_META[t];
                    return (
                      <button key={t} type="button" onClick={() => setTeam(t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${team === t ? `${meta.tailwindBg} ${meta.tailwindText} ${meta.tailwindBorder} ring-1 ${meta.tailwindRing} font-medium` : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.hex }} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={!code.trim() || !pseudo.trim() || joining}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {joining && <Loader2 size={15} className="animate-spin" />}
            {joining ? "Connexion…" : "Rejoindre →"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function CodeSecretJoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
