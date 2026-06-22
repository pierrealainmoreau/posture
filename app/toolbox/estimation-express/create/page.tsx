"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS, QUESTION_BANK, EEQuestion } from "@/lib/estimation-express/types";

const BANK_LABELS: Record<string, string> = {
  fun: "😄 Fun & Culture",
  tech: "💻 Tech & Digital",
};

export default function EstimationExpressCreatePage() {
  const router = useRouter();

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/estimation-express", label: "Estimation Express" },
    { label: "Créer une session" },
  ];

  const [pseudo, setPseudo]           = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[5]);
  const [selected, setSelected]       = useState<EEQuestion[]>([]);
  const [customText, setCustomText]   = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [customMin, setCustomMin]     = useState("");
  const [customMax, setCustomMax]     = useState("");
  const [customUnit, setCustomUnit]   = useState("");
  const [customFunfact, setCustomFunfact] = useState("");
  const [showCustom, setShowCustom]   = useState(false);
  const [creating, setCreating]       = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
      if (data?.first_name) setPseudo(data.first_name);
    });
  }, []);

  function toggleQuestion(q: EEQuestion) {
    setSelected((prev) => {
      const exists = prev.some((x) => x.text === q.text);
      if (exists) return prev.filter((x) => x.text !== q.text);
      if (prev.length >= 10) return prev;
      return [...prev, q];
    });
  }

  function addCustomQuestion() {
    const text = customText.trim();
    const answer = parseFloat(customAnswer);
    const min = parseFloat(customMin);
    const max = parseFloat(customMax);
    const unit = customUnit.trim();

    if (!text || isNaN(answer) || isNaN(min) || isNaN(max) || !unit) return;
    if (min >= max || answer < min || answer > max) {
      setError("Vérifiez min/max/réponse");
      return;
    }
    if (selected.length >= 10) { setError("Maximum 10 questions"); return; }

    const step = (max - min) <= 10 ? 0.1 : (max - min) <= 100 ? 1 : 10;
    setSelected((prev) => [...prev, { text, answer, min, max, unit, step, funfact: customFunfact.trim() || undefined }]);
    setCustomText(""); setCustomAnswer(""); setCustomMin(""); setCustomMax(""); setCustomUnit(""); setCustomFunfact("");
    setError(null);
  }

  const canSubmit = pseudo.trim() && selected.length >= 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/estimation-express/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim(), avatarColor, questions: selected }),
      });
      const data = await res.json() as { code?: string; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok || !data.code || !data.playerId) {
        setError(data.error ?? "Erreur lors de la création");
        setCreating(false);
        return;
      }

      localStorage.setItem(
        `estimationexpress_player_${data.code}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );

      router.push(`/toolbox/estimation-express/${data.code}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Créer une session</h1>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Profil hôte */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Votre profil</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Pseudo</label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Votre prénom"
                maxLength={24}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Couleur avatar</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${avatarColor === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Banque de questions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Questions</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${selected.length >= 3 ? "bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                {selected.length}/10 sélectionnées
              </span>
            </div>

            {Object.entries(QUESTION_BANK).map(([bankKey, questions]) => (
              <div key={bankKey}>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  {BANK_LABELS[bankKey] ?? bankKey}
                </p>
                <div className="space-y-1.5">
                  {questions.map((q) => {
                    const isSelected = selected.some((x) => x.text === q.text);
                    return (
                      <button
                        key={q.text}
                        type="button"
                        onClick={() => toggleQuestion(q)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all border ${
                          isSelected
                            ? "bg-violet-50 dark:bg-violet-950 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                            : "border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {q.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Custom question */}
            <div>
              <button
                type="button"
                onClick={() => setShowCustom((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-violet-500 transition-colors"
              >
                {showCustom ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Ajouter une question personnalisée
              </button>

              {showCustom && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Question (ex: Combien de…?)"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={customMin} onChange={(e) => setCustomMin(e.target.value)} placeholder="Min" className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <input type="number" value={customMax} onChange={(e) => setCustomMax(e.target.value)} placeholder="Max" className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <input type="number" value={customAnswer} onChange={(e) => setCustomAnswer(e.target.value)} placeholder="Réponse" className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <input type="text" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} placeholder="Unité (ex: %)" className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <input type="text" value={customFunfact} onChange={(e) => setCustomFunfact(e.target.value)} placeholder="Fun fact (optionnel)" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  <button
                    type="button"
                    onClick={addCustomQuestion}
                    disabled={!customText || !customAnswer || !customMin || !customMax || !customUnit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={13} /> Ajouter
                  </button>
                </div>
              )}
            </div>

            {/* Selected list */}
            {selected.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Sélection</p>
                <div className="space-y-1">
                  {selected.map((q, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 bg-violet-50 dark:bg-violet-950 px-3 py-2 rounded-xl">
                      <span className="text-xs text-violet-700 dark:text-violet-300 line-clamp-1">{q.text}</span>
                      <button type="button" onClick={() => setSelected((prev) => prev.filter((_, j) => j !== i))}>
                        <X size={14} className="text-violet-400 hover:text-violet-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || creating}
            className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {creating ? <><Loader2 size={16} className="animate-spin" /> Création…</> : "Créer la session"}
          </button>

          {selected.length < 3 && (
            <p className="text-center text-xs text-gray-400">Sélectionnez au moins 3 questions pour commencer.</p>
          )}
        </form>
      </main>
    </div>
  );
}
