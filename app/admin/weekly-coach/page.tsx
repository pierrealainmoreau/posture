"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Pencil, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";

interface Template {
  id: string;
  need_type: string;
  day_of_week: number;
  title: string;
  description: string | null;
  category: string;
  action_type: string;
  route: string;
}

const NEED_LABELS: Record<string, string> = {
  cohesion:      "Cohésion d'équipe",
  performance:   "Performance collective",
  wellbeing:     "Bien-être au travail",
  communication: "Communication d'équipe",
  onboarding:    "Intégrer un collaborateur",
};

const NEED_TYPES = ["cohesion", "performance", "wellbeing", "communication", "onboarding"] as const;
const DAY_LABELS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

export default function WeeklyCoachAdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNeed, setActiveNeed] = useState<string>("cohesion");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Template>>({});
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") { router.replace("/"); return; }
      setAuthorized(true);
    });
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    fetch("/api/admin/weekly-coach/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [authorized]);

  function startEdit(t: Template) {
    setEditingId(t.id);
    setEditForm({ ...t });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit() {
    if (!editingId || !editForm) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/weekly-coach/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingId ? ({ ...t, ...editForm } as Template) : t))
        );
        setSavedId(editingId);
        setTimeout(() => setSavedId(null), 2000);
        setEditingId(null);
        setEditForm({});
      }
    } finally {
      setSaving(false);
    }
  }

  if (!authorized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const filtered = templates.filter((t) => t.need_type === activeNeed);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">

        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Coach — Templates</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Configurez les actions quotidiennes par besoin manager
            </p>
          </div>
        </div>

        {/* Onglets besoin */}
        <div className="flex gap-2 flex-wrap mb-6">
          {NEED_TYPES.map((need) => (
            <button
              key={need}
              onClick={() => setActiveNeed(need)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                activeNeed === need
                  ? "bg-blue-700 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {NEED_LABELS[need]}
            </button>
          ))}
        </div>

        {/* Table des templates */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 w-24">Jour</th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Titre</th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 w-32">Catégorie</th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 w-28">Action type</th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 w-36">Route</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const isEditing = editingId === t.id;
                const isSaved = savedId === t.id;

                return (
                  <tr key={t.id} className="border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {DAY_LABELS[t.day_of_week]}
                    </td>

                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.title ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            value={editForm.description ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Description (optionnel)"
                            className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.category ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                            className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.action_type ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, action_type: e.target.value }))}
                            className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.route ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, route: e.target.value }))}
                            className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1.5">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="p-1.5 rounded-md bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-50"
                            >
                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-900 dark:text-white">{t.title}</p>
                          {t.description && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-xs">
                              {t.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-gray-600 dark:text-gray-400">{t.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                            {t.action_type}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-gray-500 dark:text-gray-500 font-mono">{t.route}</span>
                        </td>
                        <td className="px-4 py-3">
                          {isSaved ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <button
                              onClick={() => startEdit(t)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500">
          Le champ <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">action_type</code> doit correspondre exactement à la clé utilisée dans <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">lib/weeklyCoach.ts</code> pour déclencher l&apos;auto-validation.
        </p>
      </main>
    </div>
  );
}
