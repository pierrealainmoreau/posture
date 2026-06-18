"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/humeur/types";
import { useI18n } from "@/lib/i18n";

export default function HumeurCreatePage() {
  const router = useRouter();
  const { t } = useI18n();
  const breadcrumbs = [
    { href: "/", label: t.common.home },
    { href: "/toolbox", label: t.common.miniJeux },
    { href: "/toolbox/humeur", label: t.humeur.title },
    { label: t.humeur.createSession },
  ];
  const [pseudo, setPseudo] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
      if (data?.first_name) setPseudo(data.first_name);
    });
  }, []);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[4]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pseudo.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/humeur/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim(), avatarColor }),
      });
      const data = await res.json() as { code?: string; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok || !data.code || !data.playerId) {
        setError(data.error ?? t.gameSetup.createError);
        setCreating(false);
        return;
      }

      localStorage.setItem(
        `humeur_player_${data.code}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );
      router.push(`/toolbox/humeur/${data.code}/lobby`);
    } catch {
      setError(t.common.error);
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-md mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {t.humeur.createSession}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.gameSetup.pseudo}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder={t.gameSetup.pseudoPlaceholder}
                maxLength={20}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.gameSetup.avatarColor}
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      avatarColor === color
                        ? "ring-2 ring-offset-2 ring-rose-500 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
            className="w-full py-3 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? t.gameSetup.creating : t.humeur.createSession}
          </button>
        </form>
      </main>
    </div>
  );
}
