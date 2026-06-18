"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, Shuffle } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/chaine/types";
import { pickRandomStarterWord, STARTER_WORDS } from "@/lib/chaine/starter-words";

const CATEGORIES = [
  { value: "nature",    label: "Nature" },
  { value: "voyage",    label: "Voyage" },
  { value: "quotidien", label: "Quotidien" },
  { value: "abstrait",  label: "Abstrait" },
  { value: "bureau",    label: "Bureau" },
] as const;

export default function ChaineCreatePage() {
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
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[5]); // violet default
  const [starterWord, setStarterWord] = useState("");
  const [wordMode, setWordMode] = useState<"random" | "custom">("random");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/chaine", label: "Chaîne" },
    { label: "Créer une partie" },
  ];

  function handleRandomWord() {
    setStarterWord(pickRandomStarterWord());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pseudo.trim()) return;
    setCreating(true);
    setError(null);

    const word = wordMode === "custom" && starterWord.trim()
      ? starterWord.trim()
      : pickRandomStarterWord();

    try {
      const res = await fetch("/api/chaine/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim(), avatarColor, starterWord: word }),
      });

      const data = await res.json() as { code?: string; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok || !data.code || !data.playerId) {
        setError(data.error ?? "Erreur lors de la création");
        setCreating(false);
        return;
      }

      localStorage.setItem(
        `chaine_player_${data.code}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );

      router.push(`/toolbox/chaine/${data.code}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-md mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Créer une partie
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-5">

            {/* Pseudo */}
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
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                        ? "ring-2 ring-offset-2 ring-violet-500 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Mot de départ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de départ
              </label>

              {/* Mode selector */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setWordMode("random")}
                  className={`flex-1 px-3 py-2 text-sm rounded-xl border transition-colors ${
                    wordMode === "random"
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-medium"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  Tiré au sort
                </button>
                <button
                  type="button"
                  onClick={() => setWordMode("custom")}
                  className={`flex-1 px-3 py-2 text-sm rounded-xl border transition-colors ${
                    wordMode === "custom"
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-medium"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  Choisir
                </button>
              </div>

              {wordMode === "random" ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {starterWord || "Mot aléatoire au démarrage"}
                  </div>
                  <button
                    type="button"
                    onClick={handleRandomWord}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                  >
                    <Shuffle size={14} />
                    Aperçu
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={starterWord}
                    onChange={(e) => setStarterWord(e.target.value.replace(/\s/g, ""))}
                    placeholder="Safari, Tempête, Réunion…"
                    maxLength={30}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setStarterWord(pickRandomStarterWord(cat.value))}
                        className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Ou choisissez une catégorie pour un mot aléatoire dans ce thème.
                  </p>
                </div>
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
            disabled={!pseudo.trim() || creating}
            className="w-full py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? "Création…" : "Créer la partie →"}
          </button>
        </form>
      </main>
    </div>
  );
}
