"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Bug, Sparkles, MessageSquare, CheckCircle2, Loader2, AlertCircle, Pencil, X, Check, Zap, Clock, Telescope, ThumbsUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { PMFBanner } from "@/components/PMFBanner";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

type RoadmapPhase = "now" | "next" | "later";

interface RoadmapItem {
  id: string;
  title: string;
  desc: string;
  tag?: string;
}

type Category = "idea" | "improvement" | "bug" | "other";
type SuggestionStatus = "pending" | "planned" | "done" | "rejected";

interface MySuggestion {
  id: string;
  category: string;
  message: string;
  created_at: string;
  status: SuggestionStatus;
  rejection_reason?: string | null;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  idea: Lightbulb,
  improvement: Sparkles,
  bug: Bug,
  other: MessageSquare,
};

const CATEGORY_COLORS = {
  idea:        { color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",   cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"  },
  improvement: { color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",         cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"       },
  bug:         { color: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",             cls: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"             },
  other:       { color: "text-gray-600 dark:text-gray-400",    bg: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700",           cls: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"         },
};

const STATUS_COLORS: Record<SuggestionStatus, string> = {
  pending:  "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  planned:  "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  done:     "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  rejected: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

type ActiveTab = "suggestions" | "roadmap";

export default function SuggestionsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("suggestions");

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "roadmap") setActiveTab("roadmap");
  }, []);

  function switchTab(tab: ActiveTab) {
    setActiveTab(tab);
    router.replace(`/suggestions?tab=${tab}`, { scroll: false });
  }

  const CATEGORIES: { value: Category; label: string; Icon: LucideIcon }[] = [
    { value: "idea",        label: t.suggestions.types.idea,        Icon: Lightbulb     },
    { value: "improvement", label: t.suggestions.types.improvement,  Icon: Sparkles      },
    { value: "bug",         label: t.suggestions.types.bug,          Icon: Bug           },
    { value: "other",       label: t.suggestions.types.other,        Icon: MessageSquare },
  ];

  const STATUS_LABELS: Record<SuggestionStatus, string> = {
    pending:  t.suggestions.statuses.pending,
    planned:  t.suggestions.statuses.planned,
    done:     t.suggestions.statuses.done,
    rejected: t.suggestions.statuses.rejected,
  };

  const [category, setCategory] = useState<Category>("idea");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [suggestions, setSuggestions]     = useState<MySuggestion[]>([]);
  const [listLoading, setListLoading]     = useState(true);
  const [page, setPage]                   = useState(1);
  const [statusFilter, setStatusFilter]   = useState<"all" | "planned" | "done" | "rejected">("all");
  const PAGE_SIZE = 5;

  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editCategory, setEditCategory]   = useState<Category>("idea");
  const [editMessage, setEditMessage]     = useState("");
  const [editSaving, setEditSaving]       = useState(false);
  const [editError, setEditError]         = useState<string | null>(null);

  interface DbRoadmapItem { id: string; phase: string; title: string; description: string; tag: string | null; sort_order: number; likes_count: number; user_liked: boolean; updated_at: string }
  const [dbRoadmap, setDbRoadmap] = useState<DbRoadmapItem[] | null>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchMine();
    fetch("/api/roadmap").then(r => r.ok ? r.json() : null).then((items: DbRoadmapItem[] | null) => {
      if (items) {
        setDbRoadmap(items);
        const counts: Record<string, number> = {};
        const liked = new Set<string>();
        for (const i of items) {
          counts[i.id] = i.likes_count;
          if (i.user_liked) liked.add(i.id);
        }
        setLikeCounts(counts);
        setLikedItems(liked);
      }
    }).catch(() => {});
  }, []);

  async function toggleLike(id: string) {
    const wasLiked = likedItems.has(id);
    // Optimistic update
    setLikedItems(prev => { const n = new Set(prev); wasLiked ? n.delete(id) : n.add(id); return n; });
    setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? -1 : 1)) }));
    try {
      const res = await fetch("/api/roadmap/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: id }),
      });
      if (res.ok) {
        const { liked, count } = await res.json() as { liked: boolean; count: number };
        setLikedItems(prev => { const n = new Set(prev); liked ? n.add(id) : n.delete(id); return n; });
        setLikeCounts(prev => ({ ...prev, [id]: count }));
      } else {
        // Revert
        setLikedItems(prev => { const n = new Set(prev); wasLiked ? n.add(id) : n.delete(id); return n; });
        setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? 1 : -1)) }));
      }
    } catch {
      setLikedItems(prev => { const n = new Set(prev); wasLiked ? n.add(id) : n.delete(id); return n; });
      setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? 1 : -1)) }));
    }
  }

  async function fetchMine() {
    setListLoading(true);
    const res = await fetch("/api/suggestions/me");
    if (res.ok) setSuggestions(await res.json());
    setListLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, message }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setError(d.error ?? t.suggestions.errorOccurred);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
    setMessage("");
    setPage(1);
    fetchMine();
  }

  function startEdit(s: MySuggestion) {
    setEditingId(s.id);
    setEditCategory(s.category as Category);
    setEditMessage(s.message);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditSaving(true);
    setEditError(null);
    const res = await fetch("/api/suggestions/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, category: editCategory, message: editMessage }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string };
    if (!res.ok) {
      setEditError(data.error ?? t.suggestions.errorSave);
      setEditSaving(false);
      return;
    }
    setSuggestions((prev) =>
      prev.map((s) => s.id === id ? { ...s, category: editCategory, message: editMessage } : s)
    );
    setEditingId(null);
    setEditSaving(false);
  }

  const PHASE_CONFIG: { phase: RoadmapPhase; label: string; desc: string; icon: LucideIcon; color: string; bg: string; border: string; dot: string }[] = [
    {
      phase: "now",
      label: t.suggestions.roadmapNowLabel,
      desc: t.suggestions.roadmapNowDesc,
      icon: Zap,
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
    },
    {
      phase: "next",
      label: t.suggestions.roadmapNextLabel,
      desc: t.suggestions.roadmapNextDesc,
      icon: Clock,
      color: "text-orange-700 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      border: "border-orange-200 dark:border-orange-800",
      dot: "bg-orange-500",
    },
    {
      phase: "later",
      label: t.suggestions.roadmapLaterLabel,
      desc: t.suggestions.roadmapLaterDesc,
      icon: Telescope,
      color: "text-blue-700 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-800",
      dot: "bg-blue-400",
    },
  ];

  const filteredSuggestions = suggestions.filter(s => statusFilter === "all" || s.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool={t.suggestions.title} />
      {userId && <PMFBanner userId={userId} requireUsage={false} />}

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 space-y-8">

        {/* ── Tab selector ── */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => switchTab("suggestions")}
            className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              activeTab === "suggestions"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900"
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === "suggestions" ? "bg-blue-100 dark:bg-blue-900/60" : "bg-gray-100 dark:bg-gray-800"
            }`}>
              <Lightbulb size={20} className={activeTab === "suggestions" ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"} />
            </div>
            <div>
              <p className={`font-semibold text-sm mb-0.5 ${activeTab === "suggestions" ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}`}>
                {t.suggestions.tabSuggestions}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t.suggestions.tabSuggestionsDesc}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => switchTab("roadmap")}
            className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              activeTab === "roadmap"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900"
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === "roadmap" ? "bg-blue-100 dark:bg-blue-900/60" : "bg-gray-100 dark:bg-gray-800"
            }`}>
              <Telescope size={20} className={activeTab === "roadmap" ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"} />
            </div>
            <div>
              <p className={`font-semibold text-sm mb-0.5 ${activeTab === "roadmap" ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}`}>
                {t.suggestions.tabRoadmap}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t.suggestions.tabRoadmapDesc}</p>
            </div>
          </button>
        </div>

        {/* ── Roadmap view ── */}
        {activeTab === "roadmap" && (
          <section className="space-y-10">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{t.suggestions.roadmapTitle}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.suggestions.roadmapSubtitle}</p>
            </div>

            {/* Grille Now / Next / Later */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PHASE_CONFIG.map(({ phase, label, desc, icon: Icon, color, bg, border }) => {
                const items: RoadmapItem[] = (dbRoadmap ?? [])
                  .filter(i => i.phase === phase)
                  .map(i => ({ id: i.id, title: i.title, desc: i.description, tag: i.tag ?? undefined }));
                return (
                  <div key={phase}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border mb-3 ${bg} ${border}`}>
                      <Icon size={13} className={color} />
                      <span className={`text-xs font-bold tracking-wide uppercase ${color}`}>{label}</span>
                      <span className={`text-xs ${color} opacity-70`}>— {desc}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 flex items-start gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                            {item.tag && (
                              <span className="inline-flex mt-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => toggleLike(item.id)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                              likedItems.has(item.id)
                                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                                : "text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            }`}
                          >
                            <ThumbsUp size={14} className={likedItems.has(item.id) ? "fill-blue-600 dark:fill-blue-400" : ""} />
                            {(likeCounts[item.id] ?? 0) > 0 && (
                              <span className="tabular-nums leading-none">{likeCounts[item.id]}</span>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Release Notes */}
            {(() => {
              const released = (dbRoadmap ?? [])
                .filter(i => i.phase === "released")
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
              if (released.length === 0) return null;

              const byMonth: Record<string, typeof released> = {};
              for (const item of released) {
                const d = new Date(item.updated_at);
                const key = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
                (byMonth[key] ??= []).push(item);
              }

              return (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800">
                      <Check size={13} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold tracking-wide uppercase text-purple-700 dark:text-purple-400">Release Notes</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  </div>

                  <div className="space-y-8">
                    {Object.entries(byMonth).map(([month, items]) => (
                      <div key={month}>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 capitalize">{month}</p>
                        <div className="space-y-3">
                          {items.map(item => (
                            <div
                              key={item.id}
                              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 flex items-start gap-3"
                            >
                              <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                <Check size={11} className="text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                                {item.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.description}</p>
                                )}
                                {item.tag && (
                                  <span className="inline-flex mt-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                    {item.tag}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* ── Suggestions view ── */}
        {activeTab === "suggestions" && <>

        {/* ── Form ── */}
        <section>
          {success ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-14 h-14 bg-green-50 dark:bg-green-950/40 rounded-2xl flex items-center justify-center mb-5">
                <CheckCircle2 size={26} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.suggestions.successTitle}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                {t.suggestions.successDesc}
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                {t.suggestions.sendAnother}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{t.suggestions.titlePage}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.suggestions.subtitlePage}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t.suggestions.typeLabel}</label>
                  <div className="space-y-2">
                    {CATEGORIES.map(({ value, label, Icon }) => {
                      const isSelected = category === value;
                      const colors = CATEGORY_COLORS[value];
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setCategory(value)}
                          className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                            isSelected
                              ? `${colors.bg} ${colors.color} border-2`
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.suggestions.messageLabel}</label>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{message.length} / 2000</span>
                    </div>
                    <textarea
                      rows={6}
                      required
                      minLength={10}
                      maxLength={2000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t.suggestions.messagePlaceholder}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 mt-2">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || message.trim().length < 10}
                    className="mt-2 py-2.5 px-6 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 size={15} className="animate-spin" /> {t.suggestions.sending}</> : t.suggestions.submitBtn}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        {/* ── My suggestions ── */}
        {(listLoading || suggestions.length > 0) && (
          <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t.suggestions.mySuggestions}</h2>
              <div className="space-y-1">
                {([
                  { value: "all" as const,      label: t.suggestions.filterAll },
                  { value: "planned" as const,  label: t.suggestions.statuses.planned },
                  { value: "done" as const,     label: t.suggestions.statuses.done },
                  { value: "rejected" as const, label: t.suggestions.statuses.rejected },
                ]).map(({ value, label }) => {
                  const count = value === "all" ? suggestions.length : suggestions.filter(s => s.status === value).length;
                  const isActive = statusFilter === value;
                  return (
                    <button
                      key={value}
                      onClick={() => { setStatusFilter(value); setPage(1); }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span>{label}</span>
                      <span className="text-xs tabular-nums opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 size={18} className="animate-spin mr-2" /> {t.common.loading}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSuggestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((s) => {
                  const isEditing = editingId === s.id;
                  const catKey = s.category in CATEGORY_COLORS ? s.category as Category : "other";
                  const catColors = CATEGORY_COLORS[catKey];
                  const catLabel = t.suggestions.types[catKey as keyof typeof t.suggestions.types] ?? t.suggestions.types.other;
                  const statusLabel = STATUS_LABELS[s.status ?? "pending"];
                  const statusCls = STATUS_COLORS[s.status ?? "pending"];

                  return (
                    <div key={s.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map(({ value, label, Icon }) => {
                              const isSelected = editCategory === value;
                              const colors = CATEGORY_COLORS[value];
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setEditCategory(value)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                    isSelected
                                      ? `${colors.bg} ${colors.color} border-2`
                                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  <Icon size={13} />
                                  {label}
                                </button>
                              );
                            })}
                          </div>

                          <textarea
                            rows={4}
                            minLength={10}
                            maxLength={2000}
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                          <p className="text-xs text-gray-400 text-right -mt-2">{editMessage.length} / 2000</p>

                          {editError && (
                            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                              <AlertCircle size={12} className="flex-shrink-0" />
                              {editError}
                            </div>
                          )}

                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={cancelEdit}
                              disabled={editSaving}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                              <X size={12} /> {t.common.cancel}
                            </button>
                            <button
                              onClick={() => saveEdit(s.id)}
                              disabled={editSaving || editMessage.trim().length < 10}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
                            >
                              {editSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              {t.common.save}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${catColors.cls}`}>
                                {(() => { const Icon = CATEGORY_ICONS[catKey] ?? MessageSquare; return <Icon size={12} />; })()}
                                {catLabel}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusCls}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(s.created_at).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                              {s.status === "pending" && (
                                <button
                                  onClick={() => startEdit(s)}
                                  title={t.common.edit}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                >
                                  <Pencil size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{s.message}</p>
                          {s.status === "rejected" && s.rejection_reason && (
                            <div className="mt-3 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">{t.suggestions.rejectionReason}</p>
                              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{s.rejection_reason}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                {filteredSuggestions.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">{t.suggestions.noSuggestions}</p>
                )}
                {filteredSuggestions.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {t.suggestions.previous}
                    </button>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {page} / {Math.ceil(filteredSuggestions.length / PAGE_SIZE)}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(Math.ceil(filteredSuggestions.length / PAGE_SIZE), p + 1))}
                      disabled={page === Math.ceil(filteredSuggestions.length / PAGE_SIZE)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {t.suggestions.next}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
        </>}
      </main>
    </div>
  );
}
