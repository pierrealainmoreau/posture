"use client";

import { useState } from "react";
import { Bot, Check, Loader2 } from "lucide-react";

interface Props {
  game: string;
  code: string;
  playerId: string;
  playerSecret?: string;
}

export function DemoBotsButton({ game, code, playerId, playerSecret }: Props) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addBots() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/add-bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, code, playerId, playerSecret, count: 3 }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erreur");
      } else {
        setAdded(true);
        setTimeout(() => setAdded(false), 3000);
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        onClick={addBots}
        disabled={loading}
        className="flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm rounded-xl hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40 transition-colors"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : added ? (
          <Check size={14} className="text-green-500" />
        ) : (
          <Bot size={14} />
        )}
        {loading
          ? "Ajout en cours…"
          : added
          ? "3 participants fictifs ajoutés !"
          : "Ajouter 3 participants fictifs"}
      </button>
      {error && <p className="text-xs text-red-500 dark:text-red-400 text-center">{error}</p>}
    </div>
  );
}
