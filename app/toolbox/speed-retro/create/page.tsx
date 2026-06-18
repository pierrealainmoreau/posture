"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/retrospective/types";
import { DEFAULT_QUESTIONS } from "@/lib/speed-retro/types";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/toolbox/speed-retro", label: "Speed Retro" },
  { label: "Créer une session" },
];

export default function SpeedRetroCreatePage() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
      if (data?.first_name) setPseudo(data.first_name);
    });
  }, []);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[1]);
  const [questions, setQuestions] = useState<string[]>([...DEFAULT_QUESTIONS]);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [voteLimited, setVoteLimited] = useState(false);
  const [voteLimit, setVoteLimit] = useState(3);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(index: number, value: string) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pseudo.trim()) return;
    for (const q of questions) {
      if (!q.trim()) { setError("Toutes les questions doivent être remplies."); return; }
    }
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/speed-retro/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: pseudo.trim(),
          avatarColor,
          questions,
          voteLimit: voteLimited ? voteLimit : null,
          timerEnabled,
        }),
      });
      const data = await res.json() as { code?: string; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok || !data.code || !data.playerId) {
        setError(data.error ?? "Erreur lors de la création");
        setCreating(false);
        return;
      }

      localStorage.setItem(
        `speed_retro_player_${data.code}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );
      router.push(`/toolbox/speed-retro/${data.code}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-md mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Créer une session
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Partagez le code avec votre équipe. Vous serez l&apos;animateur.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Votre pseudo
              </label>
              <input
                type="text"
                required
                autoFocus
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Pierre, Marie…"
                maxLength={20}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur d&apos;avatar
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      avatarColor === color
                        ? "ring-2 ring-offset-2 ring-orange-500 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Questions
            </label>
            {questions.map((q, i) => (
              <input
                key={i}
                type="text"
                required
                value={q}
                onChange={(e) => updateQuestion(i, e.target.value)}
                maxLength={120}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timer
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Afficher un compte à rebours pendant les phases
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTimerEnabled((v) => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  timerEnabled ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    timerEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budget de votes
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Limiter le nombre de votes par participant
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVoteLimited((v) => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  voteLimited ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    voteLimited ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {voteLimited && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Votes par participant
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={voteLimit}
                  onChange={(e) => setVoteLimit(Math.max(1, Math.min(20, parseInt(e.target.value) || 3)))}
                  className="w-24 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!pseudo.trim() || creating}
            className="w-full py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? "Création…" : "Créer la session"}
          </button>
        </form>
      </main>
    </div>
  );
}
