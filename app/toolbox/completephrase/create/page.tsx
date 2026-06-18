"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, Check, Pencil, X, GripVertical } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/completephrase/types";
import { STARTER_PHRASES, CATEGORY_LABELS } from "@/lib/completephrase/starters";
import type { StarterPhrase } from "@/lib/completephrase/starters";

const MAX_PHRASES = 5;
const TIMER_SECONDS = 30;

export default function CompletePhraseCreatePage() {
  const router = useRouter();

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/completephrase", label: "Continuez la phrase" },
    { label: "Créer une session" },
  ];

  const [pseudo, setPseudo]                   = useState("");
  const [avatarColor, setAvatarColor]         = useState(AVATAR_COLORS[4]);
  const [selectedPhrases, setSelectedPhrases] = useState<string[]>([]);
  const [customMode, setCustomMode]           = useState(false);
  const [customText, setCustomText]           = useState("");
  const [creating, setCreating]               = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [fromGame, setFromGame]               = useState<string | null>(null);
  const [fromCode, setFromCode]               = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setFromGame(p.get("fromGame"));
    setFromCode(p.get("fromCode"));

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
      if (data?.first_name) setPseudo(data.first_name);
    });
  }, []);

  function togglePhrase(text: string) {
    setSelectedPhrases((prev) => {
      if (prev.includes(text)) return prev.filter((p) => p !== text);
      if (prev.length >= MAX_PHRASES) return prev;
      return [...prev, text];
    });
  }

  function removePhrase(text: string) {
    setSelectedPhrases((prev) => prev.filter((p) => p !== text));
  }

  function addCustomPhrase() {
    const text = customText.trim();
    if (!text || selectedPhrases.includes(text) || selectedPhrases.length >= MAX_PHRASES) return;
    setSelectedPhrases((prev) => [...prev, text]);
    setCustomText("");
    setCustomMode(false);
  }

  const canSubmit = pseudo.trim() && selectedPhrases.length >= 1;
  const estDuration = `~${selectedPhrases.length * TIMER_SECONDS}s`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/completephrase/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: pseudo.trim(),
          avatarColor,
          starterPhrases: selectedPhrases,
        }),
      });
      const data = await res.json() as { code?: string; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok || !data.code || !data.playerId) {
        setError(data.error ?? "Erreur lors de la création");
        setCreating(false);
        return;
      }

      localStorage.setItem(
        `completephrase_player_${data.code}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );

      // Notifier les participants du jeu précédent
      if (fromGame === "thisorthat" && fromCode) {
        fetch(`/api/thisorthat/room/${fromCode}/next-game`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ next_game_type: "completephrase", next_game_code: data.code }),
        }).catch(() => {});
      }

      router.push(`/toolbox/completephrase/${data.code}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setCreating(false);
    }
  }

  const categories = [...new Set(STARTER_PHRASES.map((s) => s.category))] as StarterPhrase["category"][];

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
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
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
                        ? "ring-2 ring-offset-2 ring-fuchsia-500 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sélection des phrases */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">

            {/* En-tête */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phrases de départ
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {selectedPhrases.length === 0
                    ? `Sélectionnez jusqu'à ${MAX_PHRASES} phrases`
                    : `${selectedPhrases.length} phrase${selectedPhrases.length > 1 ? "s" : ""} · ${estDuration} · timer ${TIMER_SECONDS}s chacune`
                  }
                </p>
              </div>
            </div>

            {/* Playlist sélectionnée */}
            {selectedPhrases.length > 0 && (
              <div className="space-y-1.5">
                {selectedPhrases.map((phrase, i) => (
                  <div
                    key={phrase}
                    className="flex items-center gap-2 px-3 py-2.5 bg-fuchsia-50 dark:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-800 rounded-xl"
                  >
                    <GripVertical size={13} className="text-fuchsia-300 dark:text-fuchsia-700 flex-shrink-0" />
                    <span className="w-5 h-5 rounded-full bg-fuchsia-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-fuchsia-900 dark:text-fuchsia-100 flex-1 min-w-0 truncate">
                      {phrase} <span className="text-fuchsia-400">_____</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => removePhrase(phrase)}
                      className="flex-shrink-0 p-0.5 text-fuchsia-300 hover:text-fuchsia-600 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Catalogue par catégorie */}
            {!customMode && selectedPhrases.length < MAX_PHRASES && (
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                      {CATEGORY_LABELS[cat]}
                    </p>
                    <div className="space-y-1.5">
                      {STARTER_PHRASES.filter((s) => s.category === cat).map((s) => {
                        const isSelected = selectedPhrases.includes(s.text);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={!isSelected && selectedPhrases.length >= MAX_PHRASES}
                            onClick={() => togglePhrase(s.text)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-start gap-2 ${
                              isSelected
                                ? "bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-800 dark:text-fuchsia-200"
                                : "bg-gray-50 dark:bg-gray-800/60 border border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700 disabled:opacity-40"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-colors ${
                              isSelected
                                ? "bg-fuchsia-500 border-fuchsia-500"
                                : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {isSelected && <Check size={10} className="text-white" />}
                            </div>
                            {s.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mode custom */}
            {customMode ? (
              <div className="space-y-3">
                <textarea
                  autoFocus
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Ex. : Ce matin, j'arrive avec l'envie de…"
                  maxLength={150}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-fuchsia-300 dark:border-fuchsia-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{customText.length}/150</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setCustomMode(false); setCustomText(""); }}
                    className="flex-1 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={!customText.trim() || selectedPhrases.includes(customText.trim())}
                    onClick={addCustomPhrase}
                    className="flex-1 py-2 text-xs font-semibold bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 disabled:opacity-40 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            ) : (
              selectedPhrases.length < MAX_PHRASES && (
                <button
                  type="button"
                  onClick={() => setCustomMode(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-colors"
                >
                  <Pencil size={14} />
                  Écrire ma propre phrase…
                </button>
              )
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
            className="w-full py-3 bg-fuchsia-500 text-white text-sm font-semibold rounded-xl hover:bg-fuchsia-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating
              ? "Création…"
              : selectedPhrases.length === 1
                ? "Créer la session →"
                : `Créer la session (${selectedPhrases.length} phrases) →`
            }
          </button>
        </form>
      </main>
    </div>
  );
}
