"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/draw/types";
import { Suspense } from "react";

const breadcrumbs = [
  { href: "/", label: "Accueil" },
  { href: "/toolbox", label: "Mini-jeux" },
  { href: "/toolbox/draw", label: "Draw It" },
  { label: "Rejoindre" },
];

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [pseudo, setPseudo] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = searchParams.get("code");
    if (c) setCode(c.toUpperCase());
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const upperCode = code.trim().toUpperCase();
    if (!upperCode || !pseudo.trim()) return;
    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/draw/room/${upperCode}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim(), avatarColor }),
      });

      const data = await res.json() as { ok?: boolean; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok) {
        if (res.status === 404) setError("Code invalide. Vérifiez le code partagé par l'animateur.");
        else if (res.status === 409) setError("La partie a déjà commencé. Vous ne pouvez plus rejoindre.");
        else setError(data.error ?? "Erreur lors de la connexion.");
        setJoining(false);
        return;
      }

      if (!data.playerId) {
        setError("Erreur lors de la création du joueur.");
        setJoining(false);
        return;
      }

      // Store the server-generated player id
      localStorage.setItem(
        `draw_player_${upperCode}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );

      router.push(`/toolbox/draw/${upperCode}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} guestMode />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Rejoindre une partie
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Code de la partie
              </label>
              <input
                type="text"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-3 py-2.5 text-sm font-mono tracking-widest uppercase rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Pseudo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Votre pseudo
              </label>
              <input
                type="text"
                required
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Pierre, Marie…"
                maxLength={20}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Avatar color */}
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

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || !pseudo.trim() || joining}
            className="w-full py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {joining && <Loader2 size={15} className="animate-spin" />}
            {joining ? "Connexion…" : "Rejoindre →"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function DrawJoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
