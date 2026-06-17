"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "pmf_survey_v1";

type PMFAnswer = "very_disappointed" | "somewhat_disappointed" | "not_disappointed";

interface PMFState {
  shown: boolean;
  answered: boolean;
  answer: PMFAnswer | null;
}

function loadState(): PMFState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { shown: false, answered: false, answer: null };
  } catch {
    return { shown: false, answered: false, answer: null };
  }
}

function saveState(s: PMFState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function PMFBanner({ userId, requireUsage = true }: { userId: string; requireUsage?: boolean }) {
  const [visible, setVisible]   = useState(false);
  const [answered, setAnswered] = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    const state = loadState();
    if (state.answered) return;

    if (!requireUsage) {
      setVisible(true);
      return;
    }

    const supabase = createClient();
    supabase
      .from("usage")
      .select("tool")
      .eq("user_id", userId)
      .then(({ data }) => {
        const distinct = new Set((data ?? []).map((r: { tool: string }) => r.tool));
        if (distinct.size >= 1) {
          setVisible(true);
        }
      });
  }, [userId, requireUsage]);

  function dismiss() {
    setVisible(false);
    if (!answered) {
      saveState({ shown: true, answered: false, answer: null });
    }
  }

  async function handleAnswer(a: PMFAnswer) {
    setSaving(true);
    try {
      const r = await fetch("/api/pmf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: a }),
      });
      if (r.ok) {
        saveState({ shown: true, answered: true, answer: a });
      }
    } catch { /* silent */ }

    setAnswered(true);
    setSaving(false);
  }

  if (!visible) return null;

  return (
    /* z-[9999] ensures this sits above any sticky/fixed header */
    <div className="max-w-5xl mx-auto w-full px-6 mt-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md p-5">
        {!answered ? (
          <>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                  Une question rapide 🙏
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Si Posture disparaissait demain, comment vous sentiriez-vous ?
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { a: "very_disappointed"     as PMFAnswer, label: "😢 Très déçu" },
                { a: "somewhat_disappointed" as PMFAnswer, label: "😕 Assez déçu" },
                { a: "not_disappointed"      as PMFAnswer, label: "🤷 Pas vraiment déçu" },
              ]).map(({ a, label }) => (
                <button
                  key={a}
                  type="button"
                  disabled={saving}
                  onClick={() => handleAnswer(a)}
                  className="px-5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                Merci pour votre retour !
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dites-nous ce qui vous manquerait le plus.{" "}
                <Link
                  href="/suggestions"
                  onClick={dismiss}
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Laisser un commentaire →
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
