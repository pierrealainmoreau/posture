"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle, Brain, Check, ChevronRight, Clock, Crown, Loader2,
  Minus, Plus, Send, Star, Trash2, X,
} from "lucide-react";
import { Header } from "@/components/Header";
import {
  CINQ_POURQUOI_LABELS, ISHIKAWA_CATEGORIES, SIX_CHAPEAUX, STEP_META,
} from "@/lib/abcde/types";
import type {
  AbcdeContribution, AbcdePlayer, AbcdeRoom, AbcdeStatus, AbcdeTemplate, AbcdeVote,
} from "@/lib/abcde/types";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface RoomState extends AbcdeRoom {
  players: AbcdePlayer[];
  contributions: AbcdeContribution[];
  votes: AbcdeVote[];
  evaluation_count: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STEPS_ORDER: AbcdeStatus[] = ["step_a", "step_b", "step_c", "step_d", "step_e"];

function stepLabel(s: AbcdeStatus): { letter: string; label: string } | null {
  const k = s as keyof typeof STEP_META;
  if (!STEP_META[k]) return null;
  return STEP_META[k];
}

function nextStepLabel(current: AbcdeStatus): string {
  const map: Partial<Record<AbcdeStatus, string>> = {
    step_a: "Passer au brainstorming →",
    step_b: "Passer au vote →",
    step_c: "Clôturer les votes →",
    step_d: "Passer à l'évaluation →",
  };
  return map[current] ?? "Étape suivante →";
}

function useTimer(startedAt: string | null, timerMin: number | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!timerMin || !startedAt) { setRemaining(null); return; }
    function calc() {
      const elapsed = (Date.now() - new Date(startedAt!).getTime()) / 1000;
      const rem = Math.max(0, timerMin! * 60 - elapsed);
      setRemaining(rem);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [startedAt, timerMin]);
  return remaining;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ── Step progress ──────────────────────────────────────────────────────────

function StepProgress({ current }: { current: AbcdeStatus }) {
  const steps: AbcdeStatus[] = ["step_a", "step_b", "step_c", "step_d", "step_e"];
  const currentIdx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => {
        const meta = STEP_META[s as keyof typeof STEP_META];
        const done = i < currentIdx;
        const active = s === current;
        return (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all",
              active
                ? `${meta.badge} border-current`
                : done
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-transparent"
                  : "bg-transparent text-gray-300 dark:text-gray-700 border-transparent",
            )}>
              {done ? <Check size={10} /> : <span>{meta.letter}</span>}
              {active && <span className="hidden sm:inline">{meta.label}</span>}
            </span>
            {i < steps.length - 1 && (
              <ChevronRight size={12} className={cn(
                "flex-shrink-0",
                i < currentIdx ? "text-gray-300 dark:text-gray-700" : "text-gray-200 dark:text-gray-800",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Problem banner ─────────────────────────────────────────────────────────

function ProblemBanner({ text }: { text: string }) {
  return (
    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl px-4 py-3 mb-4">
      <p className="text-xs font-semibold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider mb-0.5">Sujet de l&apos;atelier</p>
      <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed font-medium">{text}</p>
    </div>
  );
}

// ── Timer bar ──────────────────────────────────────────────────────────────

function TimerBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = Math.round((remaining / total) * 100);
  const urgent = remaining < 60;
  return (
    <div className={cn("flex items-center gap-3 rounded-xl px-4 py-2 mb-4 border", urgent ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700")}>
      <Clock size={14} className={urgent ? "text-red-500" : "text-gray-400"} />
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", urgent ? "bg-red-500" : "bg-indigo-500")} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-sm font-mono font-semibold tabular-nums", urgent ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300")}>
        {formatTime(remaining)}
      </span>
    </div>
  );
}

// ── Post-it card ───────────────────────────────────────────────────────────

function PostItCard({
  contrib, canDelete, onDelete,
}: {
  contrib: AbcdeContribution;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
      <p className="pr-5">{contrib.content}</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: contrib.player_avatar_color ?? "#94a3b8" }} />
        {contrib.player_pseudo}
      </p>
      {canDelete && (
        <button
          onClick={() => onDelete(contrib.id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

// ── Contribution board (libre) ─────────────────────────────────────────────

function LibreBoard({ contributions, canDelete, onDelete }: {
  contributions: AbcdeContribution[];
  canDelete: (c: AbcdeContribution) => boolean;
  onDelete: (id: string) => void;
}) {
  if (contributions.length === 0) return (
    <p className="text-sm text-gray-400 dark:text-gray-600 italic py-6 text-center">Aucune contribution pour l&apos;instant…</p>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {contributions.map((c) => (
        <PostItCard key={c.id} contrib={c} canDelete={canDelete(c)} onDelete={onDelete} />
      ))}
    </div>
  );
}

// ── Contribution board (columns) ───────────────────────────────────────────

function ColumnBoard({ columns, contributions, canDelete, onDelete }: {
  columns: { key: string; label: string; subtitle?: string; bg?: string; border?: string; text?: string }[];
  contributions: AbcdeContribution[];
  canDelete: (c: AbcdeContribution) => boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {columns.map((col) => {
        const colContribs = contributions.filter((c) => c.category === col.key);
        return (
          <div key={col.key} className="rounded-xl border overflow-hidden"
            style={{ borderColor: col.border ?? "#e2e8f0", backgroundColor: col.bg ?? "#f8fafc" }}>
            <div className="px-3 py-2 border-b" style={{ borderColor: col.border ?? "#e2e8f0" }}>
              <p className="text-xs font-bold" style={{ color: col.text ?? "#334155" }}>{col.label}</p>
              {col.subtitle && <p className="text-xs opacity-70" style={{ color: col.text ?? "#334155" }}>{col.subtitle}</p>}
            </div>
            <div className="p-2 space-y-2 min-h-[80px]">
              {colContribs.length === 0
                ? <p className="text-xs opacity-40 italic py-2 text-center" style={{ color: col.text ?? "#334155" }}>Vide</p>
                : colContribs.map((c) => (
                  <PostItCard key={c.id} contrib={c} canDelete={canDelete(c)} onDelete={onDelete} />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Template selector ──────────────────────────────────────────────────────

const TEMPLATE_OPTIONS: Record<"a" | "b", { key: AbcdeTemplate; label: string; desc: string }[]> = {
  a: [
    { key: "libre",       label: "Libre",             desc: "Post-its sans structure prédéfinie" },
    { key: "5-pourquoi",  label: "5 Pourquoi",         desc: "5 questions pour aller à la cause racine" },
    { key: "ishikawa",    label: "Ishikawa (6M)",      desc: "6 catégories de causes (Méthodes, Machines…)" },
  ],
  b: [
    { key: "libre",       label: "Libre",             desc: "Brainstorming sans structure" },
    { key: "6-chapeaux",  label: "6 Chapeaux",         desc: "6 angles de réflexion (De Bono)" },
    { key: "affinites",   label: "Affinités",          desc: "Idées regroupées par thèmes" },
  ],
};

function TemplateSelector({ step, onChoose, choosing }: {
  step: "a" | "b";
  onChoose: (t: AbcdeTemplate) => void;
  choosing: boolean;
}) {
  const options = TEMPLATE_OPTIONS[step];
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Choisissez un template pour structurer cette étape :</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChoose(opt.key)}
            disabled={choosing}
            className="w-full flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all disabled:opacity-50"
          >
            {choosing ? <Loader2 size={16} className="animate-spin text-indigo-500 flex-shrink-0" /> : <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{opt.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Contribution input ─────────────────────────────────────────────────────

function ContributionInput({ step, template, onSubmit }: {
  step: "a" | "b";
  template: AbcdeTemplate | null;
  onSubmit: (content: string, category: string | null) => Promise<void>;
}) {
  const [content, setContent]   = useState("");
  const [category, setCategory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions: { key: string; label: string }[] = (() => {
    if (template === "5-pourquoi") return CINQ_POURQUOI_LABELS.map((l, i) => ({ key: `pourquoi-${i + 1}`, label: l }));
    if (template === "ishikawa")   return ISHIKAWA_CATEGORIES.map((l) => ({ key: l, label: l }));
    if (template === "6-chapeaux") return SIX_CHAPEAUX.map((c) => ({ key: c.key, label: c.label }));
    return [];
  })();

  const needsCategory = categoryOptions.length > 0;
  const canSubmit = content.trim() !== "" && (!needsCategory || category !== "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit(content.trim(), category || null);
    setContent("");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mt-4">
      {needsCategory && (
        <div className="mb-3">
          {template === "6-chapeaux" ? (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {SIX_CHAPEAUX.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold border-2 transition-all",
                    category === c.key ? "scale-105 shadow-sm" : "opacity-60 hover:opacity-80")}
                  style={{
                    backgroundColor: c.bg,
                    borderColor: category === c.key ? c.border : "transparent",
                    color: c.text,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mb-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choisir une catégorie…</option>
              {categoryOptions.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          )}
        </div>
      )}
      {template === "affinites" && (
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Tag / thème (ex: Organisation, Communication…)"
          maxLength={40}
          className="w-full mb-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={step === "a" ? "Ajouter une observation…" : "Ajouter une idée…"}
          maxLength={200}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </form>
  );
}

// ── Steps A & B ────────────────────────────────────────────────────────────

function StepABView({
  step, room, contributions, playerId, isHost, code,
  onContributionAdded, onContributionDeleted, onTemplateChosen,
}: {
  step: "a" | "b";
  room: RoomState;
  contributions: AbcdeContribution[];
  playerId: string;
  isHost: boolean;
  code: string;
  onContributionAdded: () => void;
  onContributionDeleted: () => void;
  onTemplateChosen: (t: AbcdeTemplate) => void;
}) {
  const [choosing, setChoosing] = useState(false);

  const template: AbcdeTemplate | null = step === "a" ? room.step_a_template : room.step_b_template;

  async function addContribution(content: string, category: string | null) {
    await fetch(`/api/abcde/room/${code}/contributions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, step, content, category }),
    });
    onContributionAdded();
  }

  async function deleteContribution(id: string) {
    await fetch(`/api/abcde/room/${code}/contributions/${id}?playerId=${playerId}`, { method: "DELETE" });
    onContributionDeleted();
  }

  async function chooseTemplate(t: AbcdeTemplate) {
    setChoosing(true);
    await fetch(`/api/abcde/room/${code}/template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, step, template: t }),
    });
    onTemplateChosen(t);
    setChoosing(false);
  }

  const canDelete = (c: AbcdeContribution) => c.player_id === playerId || isHost;

  if (!template) {
    return isHost ? (
      <TemplateSelector step={step} onChoose={chooseTemplate} choosing={choosing} />
    ) : (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={16} className="animate-spin mr-2" />
        <span className="text-sm">L&apos;animateur configure le template…</span>
      </div>
    );
  }

  const renderBoard = () => {
    if (template === "5-pourquoi") {
      const cols = CINQ_POURQUOI_LABELS.map((l, i) => ({ key: `pourquoi-${i + 1}`, label: `${i + 1}. ${l}` }));
      return <ColumnBoard columns={cols} contributions={contributions} canDelete={canDelete} onDelete={deleteContribution} />;
    }
    if (template === "ishikawa") {
      const cols = ISHIKAWA_CATEGORIES.map((c) => ({ key: c, label: c }));
      return <ColumnBoard columns={cols} contributions={contributions} canDelete={canDelete} onDelete={deleteContribution} />;
    }
    if (template === "6-chapeaux") {
      const cols = SIX_CHAPEAUX.map((c) => ({ key: c.key, label: c.label, subtitle: c.subtitle, bg: c.bg, border: c.border, text: c.text }));
      return <ColumnBoard columns={cols} contributions={contributions} canDelete={canDelete} onDelete={deleteContribution} />;
    }
    if (template === "affinites") {
      const tags = Array.from(new Set(contributions.map((c) => c.category).filter(Boolean))) as string[];
      const uncategorized = contributions.filter((c) => !c.category);
      return (
        <div className="space-y-4">
          {tags.map((tag) => (
            <div key={tag}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{tag}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {contributions.filter((c) => c.category === tag).map((c) => (
                  <PostItCard key={c.id} contrib={c} canDelete={canDelete(c)} onDelete={deleteContribution} />
                ))}
              </div>
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-2">Sans tag</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {uncategorized.map((c) => (
                  <PostItCard key={c.id} contrib={c} canDelete={canDelete(c)} onDelete={deleteContribution} />
                ))}
              </div>
            </div>
          )}
          {tags.length === 0 && uncategorized.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-6">Aucune idée pour l&apos;instant…</p>
          )}
        </div>
      );
    }
    return <LibreBoard contributions={contributions} canDelete={canDelete} onDelete={deleteContribution} />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{contributions.length} contribution{contributions.length > 1 ? "s" : ""}</span>
        {isHost && (
          <button
            onClick={() => chooseTemplate("libre")}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
          >
            Changer de template
          </button>
        )}
      </div>
      {renderBoard()}
      <ContributionInput step={step} template={template} onSubmit={addContribution} />
    </div>
  );
}

// ── Step C — Vote ──────────────────────────────────────────────────────────

function StepCView({
  contributions, votes, playerId, code, onVoteChanged,
}: {
  contributions: AbcdeContribution[];
  votes: AbcdeVote[];
  playerId: string;
  code: string;
  onVoteChanged: () => void;
}) {
  const TOTAL_POINTS = 3;
  const [voting, setVoting] = useState<string | null>(null);

  const myVotes = votes.filter((v) => v.player_id === playerId);
  const myTotal = myVotes.reduce((s, v) => s + v.points, 0);
  const remaining = TOTAL_POINTS - myTotal;

  const sortedContribs = [...contributions].sort((a, b) => (b.total_votes ?? 0) - (a.total_votes ?? 0));

  async function setVote(contributionId: string, points: number) {
    setVoting(contributionId);
    await fetch(`/api/abcde/room/${code}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, contributionId, points }),
    });
    onVoteChanged();
    setVoting(null);
  }

  function myPointsOn(id: string) {
    return myVotes.find((v) => v.contribution_id === id)?.points ?? 0;
  }

  return (
    <div>
      <div className={cn(
        "flex items-center justify-between rounded-xl px-4 py-2.5 mb-4 border text-sm font-semibold",
        remaining > 0
          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
          : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
      )}>
        <span>Points restants</span>
        <span className="text-lg font-bold">{remaining} / {TOTAL_POINTS}</span>
      </div>

      <div className="space-y-2">
        {sortedContribs.map((c) => {
          const mine = myPointsOn(c.id);
          const total = c.total_votes ?? 0;
          return (
            <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{c.content}</p>
                {c.category && <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{c.category}</p>}
                <p className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.player_avatar_color ?? "#94a3b8" }} />
                  {c.player_pseudo}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="font-semibold tabular-nums">{total}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={mine <= 0 || voting === c.id}
                    onClick={() => setVote(c.id, mine - 1)}
                    className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{mine}</span>
                  <button
                    disabled={(remaining <= 0 && mine < 1) || mine >= 3 || remaining <= 0 || voting === c.id}
                    onClick={() => setVote(c.id, mine + 1)}
                    className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step D — Décision ──────────────────────────────────────────────────────

const POSTURE_OPTIONS = [
  { key: "inactive",  label: "Inactive",  desc: "Décision différée" },
  { key: "reactive",  label: "Réactive",  desc: "Action immédiate" },
  { key: "proactive", label: "Proactive", desc: "Réflexion avant mise en œuvre" },
];

function StepDView({
  room, contributions, votes, playerId, code, isHost, onDecisionSaved,
}: {
  room: RoomState;
  contributions: AbcdeContribution[];
  votes: AbcdeVote[];
  playerId: string;
  code: string;
  isHost: boolean;
  onDecisionSaved: () => void;
}) {
  const [text, setText]       = useState(room.decision_text ?? "");
  const [posture, setPosture] = useState(room.decision_posture ?? "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const topOptions = [...contributions]
    .sort((a, b) => (b.total_votes ?? 0) - (a.total_votes ?? 0))
    .slice(0, 5);

  async function saveDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/abcde/room/${code}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, decisionText: text, decisionPosture: posture }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok) setError(data.error ?? "Erreur");
    else onDecisionSaved();
    setSaving(false);
  }

  // Show top voted options
  const TopVoted = () => (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Options les plus plébiscitées</p>
      <div className="space-y-2">
        {topOptions.map((c, i) => {
          const total = c.total_votes ?? 0;
          const max = topOptions[0]?.total_votes ?? 1;
          return (
            <div key={c.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-600 w-4">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{c.content}</p>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-2">{total} pts</span>
                </div>
                <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: max > 0 ? `${(total / max) * 100}%` : "0%" }} />
                </div>
              </div>
            </div>
          );
        })}
        {topOptions.length === 0 && <p className="text-sm text-gray-400 italic">Aucun vote enregistré.</p>}
      </div>
    </div>
  );

  if (room.decision_text) {
    return (
      <div>
        <TopVoted />
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Décision retenue</p>
          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-medium mb-3">{room.decision_text}</p>
          {room.decision_posture && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              Posture : {POSTURE_OPTIONS.find((p) => p.key === room.decision_posture)?.label}
            </span>
          )}
        </div>
        {isHost && (
          <button
            onClick={() => setSaving(false)}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
          >
            Modifier la décision
          </button>
        )}
      </div>
    );
  }

  if (!isHost) {
    return (
      <div>
        <TopVoted />
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 size={16} className="animate-spin mr-2" />
          <span className="text-sm">L&apos;animateur est en train de formaliser la décision…</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopVoted />
      <form onSubmit={saveDecision} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Décision retenue</label>
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Décrivez la décision prise suite à cet atelier…"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Posture adoptée</label>
          <div className="grid grid-cols-3 gap-2">
            {POSTURE_OPTIONS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPosture(p.key)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition-colors",
                  posture === p.key
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
                )}
              >
                <p className={cn("text-xs font-bold", posture === p.key ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-gray-200")}>{p.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={!text.trim() || saving}
          className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Valider la décision
        </button>
      </form>
    </div>
  );
}

// ── Step E — Évaluer ───────────────────────────────────────────────────────

function StepEView({
  room, players, playerId, code, evaluationCount, onEvaluated,
}: {
  room: RoomState;
  players: AbcdePlayer[];
  playerId: string;
  code: string;
  evaluationCount: number;
  onEvaluated: () => void;
}) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/abcde/room/${code}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, rating, comment }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok) setError(data.error ?? "Erreur");
    else { setDone(true); onEvaluated(); }
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      {room.decision_text && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Décision prise</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{room.decision_text}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Évaluations soumises</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{evaluationCount} / {players.length}</span>
        </div>
        <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: players.length > 0 ? `${(evaluationCount / players.length) * 100}%` : "0%" }} />
        </div>
      </div>

      {done ? (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-green-700 dark:text-green-300 text-sm">
          <Check size={16} />
          Votre évaluation a été soumise. En attente des autres participants…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Comment évaluez-vous la qualité de ce processus de décision ?
            </p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRating(v)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={cn("transition-colors", v <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-gray-700")}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                {["", "Décevant", "Passable", "Correct", "Bien", "Excellent"][rating]}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Commentaire <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Ce qui a bien fonctionné, ce qu'on pourrait améliorer…"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={!rating || saving}
            className="w-full py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Soumettre mon évaluation
          </button>
        </form>
      )}
    </div>
  );
}

// ── Main play page ─────────────────────────────────────────────────────────

export default function AbcdePlayPage() {
  const { code } = useParams<{ code: string }>();
  const upperCode = (code as string).toUpperCase();
  const router = useRouter();

  const [playerId, setPlayerId]     = useState("");
  const [room, setRoom]             = useState<RoomState | null>(null);
  const [loading, setLoading]       = useState(true);
  const [advancing, setAdvancing]   = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthError, setSynthError] = useState<string | null>(null);
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    const stored = localStorage.getItem(`abcde_player_${upperCode}`);
    if (!stored) { router.replace(`/mini-jeux/abcde/join?code=${upperCode}`); return; }
    try {
      const { playerId: pid } = JSON.parse(stored) as { playerId: string };
      setPlayerId(pid);
    } catch {
      router.replace(`/mini-jeux/abcde/join?code=${upperCode}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upperCode]);

  const fetchRoom = useCallback(async () => {
    if (!playerId) return;
    const res = await fetch(`/api/abcde/room/${upperCode}?playerId=${playerId}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store" },
    });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json() as RoomState;
    setRoom(data);
    setLoading(false);

    if (data.status === "lobby") router.push(`/mini-jeux/abcde/${upperCode}/lobby`);
    if (data.status === "finished") router.push(`/mini-jeux/abcde/${upperCode}/results`);
  }, [playerId, upperCode, router]);

  useEffect(() => {
    refreshRef.current = fetchRoom;
  }, [fetchRoom]);

  useEffect(() => {
    if (!playerId) return;
    fetchRoom();
    const id = setInterval(() => refreshRef.current(), 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  // Must be called unconditionally (Rules of Hooks) — passes null when room not loaded
  const timerRemaining = useTimer(room?.step_started_at ?? null, room?.timer_per_step ?? null);

  async function advanceStep() {
    if (!room || !playerId) return;
    setAdvancing(true);
    setAdvanceError(null);
    const res = await fetch(`/api/abcde/room/${upperCode}/next-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok) setAdvanceError(data.error ?? "Erreur");
    else await fetchRoom();
    setAdvancing(false);
  }

  async function synthesize() {
    if (!room || !playerId) return;
    setSynthesizing(true);
    setSynthError(null);
    const res = await fetch(`/api/abcde/room/${upperCode}/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok) setSynthError(data.error ?? "Erreur lors de la génération");
    else router.push(`/mini-jeux/abcde/${upperCode}/results`);
    setSynthesizing(false);
  }

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-400">Chargement…</span>
      </div>
    );
  }

  if (room.status === "synthesis") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-4">
        <Brain size={32} className="text-indigo-500 animate-pulse" />
        <p className="text-lg font-semibold text-gray-900 dark:text-white">Génération de la synthèse…</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Claude analyse les contributions et prépare le rapport.</p>
      </div>
    );
  }

  const isHost = room.host_player_id === playerId;
  const currentStep = room.status as AbcdeStatus;
  const meta = stepLabel(currentStep);
  const contribs = room.contributions ?? [];

  const stepContribs = {
    a: contribs.filter((c) => c.step === "a"),
    b: contribs.filter((c) => c.step === "b"),
  };

  const remaining = timerRemaining;
  const showTimer = remaining !== null && room.timer_per_step !== null;

  const isLastStep = currentStep === "step_e";
  const canAdvance = isHost && !isLastStep && ["step_a", "step_b", "step_c", "step_d"].includes(currentStep);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode={!isHost} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* Step progress + meta */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <StepProgress current={currentStep} />
          {isHost && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Crown size={11} className="text-amber-500" />
              <span>Animateur</span>
            </div>
          )}
        </div>

        {/* Timer */}
        {showTimer && remaining !== null && (
          <TimerBar remaining={remaining} total={room.timer_per_step! * 60} />
        )}

        {/* Problem */}
        {room.problem_statement && <ProblemBanner text={room.problem_statement} />}

        {/* Step header */}
        {STEPS_ORDER.includes(currentStep) && (() => {
          const m = STEP_META[currentStep as keyof typeof STEP_META];
          return (
            <div className={cn("rounded-xl border px-4 py-3 mb-4", m.border, m.bg)}>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-0.5", m.badge.split(" ")[2])}>
                {m.letter} — {m.label}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{m.description}</p>
            </div>
          );
        })()}

        {/* Step content */}
        {currentStep === "step_a" && (
          <StepABView
            step="a"
            room={room}
            contributions={stepContribs.a}
            playerId={playerId}
            isHost={isHost}
            code={upperCode}
            onContributionAdded={fetchRoom}
            onContributionDeleted={fetchRoom}
            onTemplateChosen={fetchRoom}
          />
        )}
        {currentStep === "step_b" && (
          <StepABView
            step="b"
            room={room}
            contributions={stepContribs.b}
            playerId={playerId}
            isHost={isHost}
            code={upperCode}
            onContributionAdded={fetchRoom}
            onContributionDeleted={fetchRoom}
            onTemplateChosen={fetchRoom}
          />
        )}
        {currentStep === "step_c" && (
          <StepCView
            contributions={stepContribs.b}
            votes={room.votes ?? []}
            playerId={playerId}
            code={upperCode}
            onVoteChanged={fetchRoom}
          />
        )}
        {currentStep === "step_d" && (
          <StepDView
            room={room}
            contributions={stepContribs.b}
            votes={room.votes ?? []}
            playerId={playerId}
            code={upperCode}
            isHost={isHost}
            onDecisionSaved={fetchRoom}
          />
        )}
        {currentStep === "step_e" && (
          <StepEView
            room={room}
            players={room.players ?? []}
            playerId={playerId}
            code={upperCode}
            evaluationCount={room.evaluation_count ?? 0}
            onEvaluated={fetchRoom}
          />
        )}

        {/* Host action bar */}
        {isHost && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            {advanceError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-3">
                <AlertCircle size={14} />
                {advanceError}
              </div>
            )}
            {canAdvance && (
              <button
                onClick={advanceStep}
                disabled={advancing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                {advancing ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
                {nextStepLabel(currentStep)}
              </button>
            )}
            {currentStep === "step_e" && (
              <div className="flex flex-col gap-2">
                {synthError && <p className="text-xs text-red-500">{synthError}</p>}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={synthesize}
                    disabled={synthesizing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    {synthesizing ? <Loader2 size={15} className="animate-spin" /> : <Brain size={15} />}
                    {synthesizing ? "Génération en cours…" : "Générer la synthèse IA"}
                  </button>
                  {room.evaluation_count < (room.players?.length ?? 0) && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      ({room.evaluation_count}/{room.players?.length ?? 0} évaluations — vous pouvez quand même générer)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Non-host waiting message */}
        {!isHost && currentStep === "step_e" && room.evaluation_count < (room.players?.length ?? 0) && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 size={13} className="animate-spin" />
            En attente que l&apos;animateur génère la synthèse…
          </div>
        )}
      </main>
    </div>
  );
}
