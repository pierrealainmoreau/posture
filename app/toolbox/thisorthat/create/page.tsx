"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, Check, Plus, Trash2, Shuffle, X } from "lucide-react";
import { Header } from "@/components/Header";
import { AVATAR_COLORS } from "@/lib/thisorthat/types";
import { ALL_QUESTIONS } from "@/lib/thisorthat/questions";
import type { CustomQuestion } from "@/lib/thisorthat/questions";

export default function ThisOrThatCreatePage() {
  const router = useRouter();

  const breadcrumbs = [
    { href: "/", label: "Accueil" },
    { href: "/toolbox", label: "Mini-jeux" },
    { href: "/toolbox/thisorthat", label: "This or That" },
    { label: "Créer une partie" },
  ];

  const [pseudo, setPseudo]                       = useState("");
  const [avatarColor, setAvatarColor]             = useState(AVATAR_COLORS[4]);
  const [selectedIds, setSelectedIds]             = useState<Set<string>>(() => {
    // 7 questions aléatoires par défaut
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
    return new Set(shuffled.slice(0, 7).map((q) => q.id));
  });
  const [customQuestions, setCustomQuestions]     = useState<CustomQuestion[]>([]);
  const [showAddForm, setShowAddForm]             = useState(false);
  const [customA, setCustomA]                     = useState("");
  const [customB, setCustomB]                     = useState("");
  const [customCtx, setCustomCtx]                 = useState("");
  const [creating, setCreating]                   = useState(false);
  const [error, setError]                         = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
      if (data?.first_name) setPseudo(data.first_name);
    });
  }, []);

  function toggleQuestion(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function randomize(count: number) {
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
    setSelectedIds(new Set(shuffled.slice(0, count).map((q) => q.id)));
  }

  function toggleCustom(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addCustomQuestion() {
    if (!customA.trim() || !customB.trim()) return;
    const id = `custom_${Date.now()}`;
    const q: CustomQuestion = {
      id,
      a: customA.trim(),
      b: customB.trim(),
      context: customCtx.trim() || "Perso",
    };
    setCustomQuestions((prev) => [...prev, q]);
    setSelectedIds((prev) => new Set([...prev, id]));
    setCustomA("");
    setCustomB("");
    setCustomCtx("");
    setShowAddForm(false);
  }

  function removeCustomQuestion(id: string) {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const totalSelected = selectedIds.size;
  const canSubmit = pseudo.trim() && totalSelected >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setCreating(true);
    setError(null);

    const selectedCustom = customQuestions.filter((q) => selectedIds.has(q.id));

    try {
      const res = await fetch("/api/thisorthat/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: pseudo.trim(),
          avatarColor,
          questionIds: [...selectedIds],
          customQuestions: selectedCustom,
        }),
      });
      const data = await res.json() as { code?: string; playerId?: string; playerSecret?: string; error?: string };

      if (!res.ok || !data.code || !data.playerId) {
        setError(data.error ?? "Erreur lors de la création");
        setCreating(false);
        return;
      }

      localStorage.setItem(
        `thisorthat_player_${data.code}`,
        JSON.stringify({ playerId: data.playerId, playerSecret: data.playerSecret, pseudo: pseudo.trim(), avatarColor })
      );
      router.push(`/toolbox/thisorthat/${data.code}/lobby`);
    } catch {
      setError("Une erreur est survenue.");
      setCreating(false);
    }
  }

  const estDuration = totalSelected <= 5 ? "~2 min" : totalSelected <= 8 ? "~3 min" : "~4 min";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Créer une partie
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Pseudo + avatar */}
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
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                        ? "ring-2 ring-offset-2 ring-sky-500 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sélection des questions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">

            {/* Header + compteur */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Questions</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {totalSelected} sélectionnée{totalSelected !== 1 ? "s" : ""} · {estDuration}
                </p>
              </div>
              <div className="flex gap-2">
                {([5, 7, 10] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => randomize(n)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-sky-50 dark:hover:bg-sky-950 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    <Shuffle size={11} />
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions custom */}
            {customQuestions.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  Mes questions
                </p>
                {customQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      selectedIds.has(q.id)
                        ? "bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800"
                        : "bg-gray-50 dark:bg-gray-800/60 border-transparent opacity-60"
                    }`}
                    onClick={() => toggleCustom(q.id)}
                  >
                    <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                      selectedIds.has(q.id)
                        ? "bg-sky-500 border-sky-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {selectedIds.has(q.id) && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs text-sky-600 dark:text-sky-400 flex-shrink-0">{q.context}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">
                      {q.a} <span className="text-gray-400">ou</span> {q.b}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeCustomQuestion(q.id); }}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Questions built-in */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {ALL_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedIds.has(q.id)
                      ? "bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800"
                      : "bg-gray-50 dark:bg-gray-800/60 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
                  onClick={() => toggleQuestion(q.id)}
                >
                  <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                    selectedIds.has(q.id)
                      ? "bg-sky-500 border-sky-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {selectedIds.has(q.id) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 w-24">{q.context}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">
                    {q.a} <span className="text-gray-400">ou</span> {q.b}
                  </span>
                </div>
              ))}
            </div>

            {/* Formulaire question custom */}
            {showAddForm ? (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Nouvelle question</p>
                  <button type="button" onClick={() => setShowAddForm(false)}>
                    <X size={14} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  value={customA}
                  onChange={(e) => setCustomA(e.target.value)}
                  placeholder="Choix A"
                  maxLength={40}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={customB}
                  onChange={(e) => setCustomB(e.target.value)}
                  placeholder="Choix B"
                  maxLength={40}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={customCtx}
                  onChange={(e) => setCustomCtx(e.target.value)}
                  placeholder="Contexte (optionnel)"
                  maxLength={20}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!customA.trim() || !customB.trim()}
                  onClick={addCustomQuestion}
                  className="w-full py-2 text-sm font-semibold bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-40 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
              >
                <Plus size={14} />
                Ajouter ma propre question
              </button>
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
            className="w-full py-3 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? "Création…" : `Créer la partie (${totalSelected} questions) →`}
          </button>
        </form>
      </main>
    </div>
  );
}
