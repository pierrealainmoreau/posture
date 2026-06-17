"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight, Loader2, Search } from "lucide-react";

interface ModuleSuggestion {
  id: string;
  name: string;
  description: string;
  href: string;
  emoji: string;
  reason: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ModuleSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    const q = query.trim();
    if (q.length < 3) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSuggestions([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      setError("Impossible de charger les suggestions.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") clear();
  };

  const clear = () => {
    setQuery("");
    setSuggestions([]);
    setHasSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      <div
        className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/40 transition-all cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <Sparkles size={15} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Je voudrais… (ex : prendre la température de mon équipe)"
          className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border-0 min-w-0 cursor-text"
          style={{ outline: "none", boxShadow: "none" }}
        />
        {query && (
          <button
            onClick={clear}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={loading || query.trim().length < 3}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white rounded-lg transition-colors"
        >
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <Search size={12} />
          }
          <span className="hidden sm:inline">Rechercher</span>
        </button>
      </div>

      {hasSearched && !loading && (
        <div className="mt-2 space-y-2">
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 px-1">{error}</p>
          )}
          {!error && suggestions.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 px-1">Aucune suggestion trouvée.</p>
          )}
          {suggestions.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className="group flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
            >
              <span className="text-xl flex-shrink-0 leading-none">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed truncate">{s.reason}</p>
              </div>
              <ArrowRight size={14} className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
