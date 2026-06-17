"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/abcde/types";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/reunion-maker", label: "Réunion Maker" },
  { href: "/reunion-maker/abcde", label: "ABCDE" },
  { label: "Créer" },
];

const INPUT_CLS = "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function AbcdeCreatePage() {
  const router = useRouter();
  const [pseudo, setPseudo]               = useState("");
  const [avatarColor, setAvatarColor]     = useState(AVATAR_COLORS[4]);
  const [problem, setProblem]             = useState("");
  const [timer, setTimer]                 = useState<number>(0);
  const [creating, setCreating]           = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const canSubmit = pseudo.trim() !== "" && problem.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/abcde/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: pseudo.trim(),
          avatarColor,
          problemStatement: problem.trim(),
          timerPerStep: timer > 0 ? timer : 0,
        }),
      });
      const data = await res.json() as { code?: string; playerId?: string; error?: string };
      if (!res.ok || !data.code || !data.playerId) {
        setError(data.error ?? "Erreur lors de la création");
        setCreating(false);
        return;
      }
      localStorage.setItem(`abcde_player_${data.code}`, JSON.stringify({ playerId: data.playerId, pseudo: pseudo.trim(), avatarColor }));
      router.push(`/reunion-maker/abcde/${data.code}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-md mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Créer une session ABCDE</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Vous serez l&apos;animateur. Partagez le code avec votre groupe de travail.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Sujet de travail <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Ex : Comment réduire le taux de turnover de l'équipe ? Comment améliorer notre processus de livraison ?"
                maxLength={280}
                rows={3}
                className={`${INPUT_CLS} resize-none leading-relaxed`}
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Ce sujet sera affiché en permanence pendant l&apos;atelier.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Votre prénom</label>
              <input
                type="text"
                required
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Pierre, Marie…"
                maxLength={20}
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur d&apos;avatar</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${avatarColor === color ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Timer par étape <span className="font-normal text-gray-400">(optionnel)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={timer}
                  onChange={(e) => setTimer(Math.max(0, Math.min(60, Number(e.target.value))))}
                  className={`${INPUT_CLS} w-24`}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">minutes / étape</span>
              </div>
              {timer > 0 && (
                <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">Un compte à rebours de {timer} min s&apos;affichera à chaque étape.</p>
              )}
              {timer === 0 && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">0 = pas de timer, vous avancez manuellement.</p>
              )}
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
            disabled={!canSubmit || creating}
            className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? "Création…" : "Créer l'atelier"}
          </button>
        </form>
      </main>
    </div>
  );
}
