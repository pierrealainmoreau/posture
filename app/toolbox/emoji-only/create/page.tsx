"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, X, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/emoji-only/types";

const CATEGORIES = [
  { key: "films",   label: "🎬 Films & Séries",    count: 25 },
  { key: "valeurs", label: "🌱 Valeurs d'équipe",   count: 25 },
  { key: "animaux", label: "🐾 Animaux & Nature",   count: 25 },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"] | "custom";

export default function EmojiOnlyCreatePage() {
  const router = useRouter();

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/emoji-only", label: "Emoji Only" },
    { label: "Créer une session" },
  ];

  const [pseudo, setPseudo]               = useState("");
  const [avatarColor, setAvatarColor]     = useState(AVATAR_COLORS[4]);
  const [category, setCategory]           = useState<CategoryKey>("films");
  const [customWords, setCustomWords]     = useState<string[]>([]);
  const [customInput, setCustomInput]     = useState("");
  const [creating, setCreating]           = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
      if (data?.first_name) setPseudo(data.first_name);
    });
  }, []);

  function addCustomWord() {
    const w = customInput.trim();
    if (!w || customWords.includes(w) || customWords.length >= 15) return;
    setCustomWords((prev) => [...prev, w]);
    setCustomInput("");
  }

  function removeWord(w: string) {
    setCustomWords((prev) => prev.filter((x) => x !== w));
  }

  const canSubmit = pseudo.trim() && (category !== "custom" || customWords.length >= 4);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/emoji-only/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim(), avatarColor, category, customWords }),
      });
      const data = await res.json() as { code?: string; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok || !data.code || !data.playerId) {
        setError(data.error ?? "Erreur lors de la création");
        setCreating(false);
        return;
      }

      localStorage.setItem(
        `emojionly_player_${data.code}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );

      router.push(`/toolbox/emoji-only/${data.code}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Créer une session
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Infos hôte */}
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
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      avatarColor === color ? "ring-2 ring-offset-2 ring-amber-500 scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Catégorie */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie de mots</p>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    category === cat.key
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <span className="font-medium">{cat.label}</span>
                  <span className="ml-2 text-xs text-gray-400">({cat.count} mots)</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory("custom")}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  category === "custom"
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200"
                    : "border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                ✏️ Mots personnalisés uniquement
              </button>
            </div>
          </div>

          {/* Mots custom */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ajouter des mots custom
                {category === "custom" && (
                  <span className="ml-1 text-xs text-amber-500">* min. 4 requis</span>
                )}
              </p>
              <span className="text-xs text-gray-400">{customWords.length}/15</span>
            </div>

            {customWords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customWords.map((w) => (
                  <span
                    key={w}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-medium border border-amber-200 dark:border-amber-800"
                  >
                    {w}
                    <button type="button" onClick={() => removeWord(w)} className="text-amber-400 hover:text-amber-600 ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {customWords.length < 15 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomWord(); } }}
                  placeholder="Ex. : offsite, sprint, notre CEO…"
                  maxLength={40}
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={addCustomWord}
                  disabled={!customInput.trim() || customWords.includes(customInput.trim())}
                  className="px-3 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 disabled:opacity-40 transition-colors"
                >
                  <Plus size={16} />
                </button>
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
            disabled={!canSubmit || creating}
            className="w-full py-3 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? "Création…" : "Créer la session →"}
          </button>
        </form>
      </main>
    </div>
  );
}
