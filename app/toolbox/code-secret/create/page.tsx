"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS, DIFFICULTY_META, TEAM_META, TEAMS } from "@/lib/code-secret/types";
import type { Difficulty, GameMode, Team } from "@/lib/code-secret/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/toolbox", label: "Mini-jeux" },
  { href: "/toolbox/code-secret", label: "Code Secret" },
  { label: "Créer une partie" },
];

export default function CodeSecretCreatePage() {
  const router = useRouter();

  const [pseudo, setPseudo]           = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[4]); // blue default
  const [gameMode, setGameMode]       = useState<GameMode>("coop");
  const [difficulty, setDifficulty]   = useState<Difficulty>("easy");
  const [team, setTeam]               = useState<Team>("red");
  const [creating, setCreating]       = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
      if (data?.first_name) setPseudo(data.first_name);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pseudo.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/code-secret/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: pseudo.trim(),
          avatarColor,
          gameMode,
          difficulty,
          team: gameMode === "competitive" ? team : undefined,
        }),
      });

      const data = await res.json() as { code?: string; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok || !data.code || !data.playerId) {
        setError(data.error ?? "Erreur lors de la création");
        setCreating(false);
        return;
      }

      localStorage.setItem(
        `code_secret_player_${data.code}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor, team: gameMode === "competitive" ? team : null })
      );

      router.push(`/toolbox/code-secret/${data.code}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setCreating(false);
    }
  }

  const diff = DIFFICULTY_META[difficulty];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-md mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Créer une partie</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-5">

            {/* Pseudo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Votre pseudo</label>
              <input
                type="text" required autoFocus value={pseudo} onChange={(e) => setPseudo(e.target.value)}
                placeholder="Pierre, Marie…" maxLength={20}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Avatar color */}
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

            {/* Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode de jeu</label>
              <div className="flex gap-2">
                {(["coop", "competitive"] as GameMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => setGameMode(m)}
                    className={`flex-1 px-3 py-2 text-sm rounded-xl border transition-colors ${gameMode === m ? "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"}`}
                  >
                    {m === "coop" ? "Coopératif" : "Compétitif"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                {gameMode === "coop"
                  ? "Toute l'équipe déchiffre le message ensemble."
                  : "Jusqu'à 4 équipes — la première à décoder gagne."}
              </p>
            </div>

            {/* Team (competitive only) */}
            {gameMode === "competitive" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Votre équipe</label>
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

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulté</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => {
                  const m = DIFFICULTY_META[d];
                  return (
                    <button key={d} type="button" onClick={() => setDifficulty(d)}
                      className={`flex-1 px-3 py-2 text-sm rounded-xl border transition-colors ${difficulty === d ? "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"}`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                {diff.time} · {diff.maxHints} indices max · -{diff.hintPenalty} pts / indice
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={!pseudo.trim() || creating}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? "Création…" : "Créer la partie →"}
          </button>
        </form>
      </main>
    </div>
  );
}
