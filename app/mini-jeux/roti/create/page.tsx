"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/retrospective/types";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/reunion-maker", label: "Réunion Maker" },
  { href: "/retrospective/roti", label: "ROTI" },
  { label: "Créer" },
];

export default function RotiCreatePage() {
  const router = useRouter();

  const [pseudo, setPseudo]           = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [sessionName, setSessionName] = useState("");
  const [creating, setCreating]       = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pseudo.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/roti/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim(), avatarColor, sessionName: sessionName.trim() || undefined }),
      });

      const data = await res.json() as { code?: string; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la création.");
        setCreating(false);
        return;
      }

      const { code, playerId, playerSecret } = data;
      if (!code || !playerId) {
        setError("Erreur lors de la création de la session.");
        setCreating(false);
        return;
      }

      localStorage.setItem(
        `roti_player_${code}`,
        JSON.stringify({ playerId, playerSecret, pseudo: pseudo.trim(), avatarColor })
      );
      router.push(`/mini-jeux/roti/${code}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Créer une session ROTI
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Votre prénom
              </label>
              <input
                type="text"
                required
                autoFocus
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Pierre, Marie…"
                maxLength={20}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                        ? "ring-2 ring-offset-2 ring-violet-500 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom de la session{" "}
                <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Sprint 12 Review, Atelier UX…"
                maxLength={60}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
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
            className="w-full py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? "Création…" : "Créer la session →"}
          </button>
        </form>
      </main>
    </div>
  );
}
