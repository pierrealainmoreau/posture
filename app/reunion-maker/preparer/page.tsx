"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays, CheckCircle2, Clock, Copy, Check,
  History, Loader2, RotateCcw, Sparkles, Trash2, X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { TrackUsage } from "@/components/TrackUsage";
import { UsageIndicator } from "@/components/UsageIndicator";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type Objectif = "décision" | "information" | "discussion";

interface OrdreduJourItem {
  sujet: string;
  objectif: Objectif;
  raison_presence: string;
}

interface Etape {
  titre: string;
  duree_suggeree: string;
  description: string;
  tips: string[];
}

interface ReunionPlan {
  conseil_general: string;
  ordre_du_jour: OrdreduJourItem[];
  etapes: Etape[];
}

type Phase = "idle" | "loading" | "result";

interface ReunionFormSnapshot {
  type: string;
  contexte: string;
  participants: string;
  stakeholders: string;
  duree: number;
}

function formatDuree(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

interface ReunionHistoryEntry {
  id: string;
  createdAt: number;
  form: ReunionFormSnapshot;
  plan: ReunionPlan;
}

// ── Constants ──────────────────────────────────────────────────────────────

const OBJECTIF_STYLES: Record<Objectif, string> = {
  "décision":    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "information": "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  "discussion":  "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const LABEL_CLASS = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

const HISTORY_KEY = "posture_reunion_maker_history";
const HISTORY_MAX = 20;

// These option values are kept as-is (stored in history + sent to API)
const TYPES_REUNION = [
  "Réunion d'équipe hebdomadaire",
  "Réunion de kick-off projet",
  "Réunion de rétrospective",
  "Réunion de prise de décision",
  "Point d'avancement / status update",
  "Réunion de résolution de problème",
  "Autre",
];

const STAKEHOLDER_KEYS = ["direct", "peers", "hierarchy", "mixed"] as const;
type StakeholderKey = typeof STAKEHOLDER_KEYS[number];

// ── History helpers ────────────────────────────────────────────────────────

function loadHistory(): ReunionHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}

function persistHistory(entries: ReunionHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function relativeDate(ts: number, locale: string): string {
  const diff = Date.now() - ts;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diff < 60_000) return rtf.format(0, "second");
  if (diff < 3_600_000) return rtf.format(-Math.floor(diff / 60_000), "minute");
  if (diff < 86_400_000) return rtf.format(-Math.floor(diff / 3_600_000), "hour");
  if (diff < 172_800_000) return rtf.format(-1, "day");
  return new Date(ts).toLocaleDateString(locale, { day: "2-digit", month: "short" });
}

function buildAgendaText(agendaLabel: string, type: string, items: OrdreduJourItem[]): string {
  const lines = [`${agendaLabel} — ${type}`, ""];
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.sujet}`);
    lines.push(`   ${item.objectif}`);
    lines.push(`   ${item.raison_presence}`);
    if (i < items.length - 1) lines.push("");
  });
  return lines.join("\n");
}

// ── History panel ──────────────────────────────────────────────────────────

function HistoryPanel({
  history,
  onLoad,
  onDelete,
  onClear,
}: {
  history: ReunionHistoryEntry[];
  onLoad: (e: ReunionHistoryEntry) => void;
  onDelete: (id: string, ev: React.MouseEvent) => void;
  onClear: () => void;
}) {
  const { t, locale } = useI18n();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock size={24} className="mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">{t.reunionMaker.noHistory}</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {t.reunionMaker.noHistoryDesc}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-gray-400 dark:text-gray-500">
          {history.length} {history.length > 1 ? t.reunionMaker.meetingSavedPlural : t.reunionMaker.meetingSavedSingular}
        </p>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[12px] text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} /> {t.common.clearAll}
        </button>
      </div>
      <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
        {history.map((entry) => (
          <div
            key={entry.id}
            onClick={() => onLoad(entry)}
            className="group relative cursor-pointer rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 transition-colors hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
          >
            <button
              onClick={(e) => onDelete(entry.id, e)}
              className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
            >
              <X size={13} />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                <CalendarDays size={10} />
                {entry.form.participants}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{relativeDate(entry.createdAt, locale)}</span>
            </div>

            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug pr-5 line-clamp-1">
              {entry.form.type}
            </p>
            {entry.form.stakeholders && (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                {entry.form.stakeholders}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <CalendarDays size={24} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500">
        {t.reunionMaker.formPrompt}
      </p>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          </div>
          <div className="ml-8 space-y-2">
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Result panel ───────────────────────────────────────────────────────────

function ResultPanel({
  plan,
  type,
  checked,
  allChecked,
  onToggle,
}: {
  plan: ReunionPlan;
  type: string;
  checked: boolean[];
  allChecked: boolean;
  onToggle: (i: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {plan.conseil_general}
        </p>
      </div>

      {plan.ordre_du_jour?.length > 0 && (
        <AgendaCard items={plan.ordre_du_jour} type={type} />
      )}

      {plan.etapes.map((etape, i) => (
        <EtapeCard
          key={i}
          etape={etape}
          checked={checked[i] ?? false}
          onToggle={() => onToggle(i)}
        />
      ))}

      {allChecked && (
        <div className="flex items-center gap-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
          <CheckCircle2 size={16} className="text-gray-700 dark:text-gray-300 flex-shrink-0" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t.reunionMaker.ready}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Agenda card ────────────────────────────────────────────────────────────

function AgendaCard({ items, type }: { items: OrdreduJourItem[]; type: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(buildAgendaText(t.reunionMaker.agenda, type, items));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t.reunionMaker.agenda}
        </h3>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-500" />
              {t.common.copied}
            </>
          ) : (
            <>
              <Copy size={12} />
              {t.common.copy}
            </>
          )}
        </button>
      </div>

      <ol className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                  {item.sujet}
                </p>
                <span
                  className={cn(
                    "flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] font-medium",
                    OBJECTIF_STYLES[item.objectif] ?? OBJECTIF_STYLES["discussion"],
                  )}
                >
                  {item.objectif}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {item.raison_presence}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Étape card ─────────────────────────────────────────────────────────────

function EtapeCard({
  etape,
  checked,
  onToggle,
}: {
  etape: Etape;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-800 p-5 transition-colors duration-150",
        checked ? "bg-gray-50 dark:bg-gray-800/40" : "bg-white dark:bg-gray-900",
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-left"
      >
        <div
          className={cn(
            "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all duration-200",
            checked
              ? "border-gray-900 bg-gray-900 dark:border-white dark:bg-white"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
          )}
        >
          <svg
            viewBox="0 0 10 8"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "h-2 w-2.5 transition-all duration-200",
              checked ? "opacity-100 scale-100" : "opacity-0 scale-50",
            )}
          >
            <path d="M1 4l2.5 2.5L9 1" className="stroke-white dark:stroke-gray-900" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                "text-sm font-semibold leading-snug transition-all duration-200",
                checked
                  ? "text-gray-400 dark:text-gray-600 line-through"
                  : "text-gray-900 dark:text-gray-100",
              )}
            >
              {etape.titre}
            </span>
            <span className="flex-shrink-0 tabular-nums text-xs text-gray-400 dark:text-gray-500">
              {etape.duree_suggeree}
            </span>
          </div>
          <p
            className={cn(
              "mt-0.5 text-sm italic leading-relaxed transition-colors duration-150",
              checked ? "text-gray-400 dark:text-gray-600" : "text-gray-400 dark:text-gray-500",
            )}
          >
            {etape.description}
          </p>
        </div>
      </button>

      {etape.tips.length > 0 && (
        <div
          className={cn(
            "ml-8 mt-3 rounded-lg border p-3 transition-colors duration-150",
            checked
              ? "bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800"
              : "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900",
          )}
        >
          <ul className="space-y-1.5">
            {etape.tips.map((tip, j) => (
              <li
                key={j}
                className={cn(
                  "flex items-start gap-1.5 text-sm leading-relaxed",
                  checked ? "text-gray-400 dark:text-gray-600" : "text-blue-800 dark:text-blue-300",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex-shrink-0",
                    checked ? "text-gray-300 dark:text-gray-600" : "text-blue-400 dark:text-blue-500",
                  )}
                >
                  •
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReunionMakerPreparerPage() {
  const { t } = useI18n();

  const [phase, setPhase]               = useState<Phase>("idle");
  const [type, setType]                 = useState("");
  const [contexte, setContexte]         = useState("");
  const [participants, setParticipants] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [duree, setDuree]               = useState(45);
  const [plan, setPlan]                 = useState<ReunionPlan | null>(null);
  const [checked, setChecked]           = useState<boolean[]>([]);
  const [error, setError]               = useState<string | null>(null);

  const [history, setHistory]         = useState<ReunionHistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const canSubmit = type !== "" && participants !== "" && stakeholders !== "";
  const allChecked = checked.length > 0 && checked.every(Boolean);

  // Build stakeholder options from translations (value = French string for API compat)
  const STAKEHOLDER_OPTIONS: { value: string; label: string }[] = STAKEHOLDER_KEYS.map((k) => ({
    value: t.reunionMaker.stakeholders[k],
    label: t.reunionMaker.stakeholders[k],
  }));

  function saveToHistory(form: ReunionFormSnapshot, result: ReunionPlan) {
    const entry: ReunionHistoryEntry = { id: crypto.randomUUID(), createdAt: Date.now(), form, plan: result };
    const updated = [entry, ...history].slice(0, HISTORY_MAX);
    setHistory(updated);
    persistHistory(updated);
  }

  function loadEntry(entry: ReunionHistoryEntry) {
    setType(entry.form.type);
    setContexte(entry.form.contexte);
    setParticipants(entry.form.participants);
    setStakeholders(entry.form.stakeholders);
    setDuree(entry.form.duree ?? 45);
    setPlan(entry.plan);
    setChecked(new Array(entry.plan.etapes.length).fill(false));
    setPhase("result");
    setError(null);
    setHistoryOpen(false);
  }

  function deleteEntry(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    persistHistory(updated);
  }

  function clearHistory() {
    setHistory([]);
    persistHistory([]);
  }

  function reset() {
    setPhase("idle");
    setType("");
    setContexte("");
    setParticipants("");
    setStakeholders("");
    setDuree(45);
    setPlan(null);
    setChecked([]);
    setError(null);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setPhase("loading");
    setError(null);
    setHistoryOpen(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch("/api/reunion-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, contexte, participants, stakeholders, duree }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.details ?? data.error ?? t.common.error);
        setPhase("idle");
        return;
      }

      const result = data as ReunionPlan;
      setPlan(result);
      setChecked(new Array(result.etapes.length).fill(false));
      setPhase("result");
      saveToHistory({ type, contexte, participants, stakeholders, duree }, result);
    } catch (e) {
      setError(t.common.error);
      setPhase("idle");
    } finally {
      clearTimeout(timeout);
    }
  }

  function toggleCheck(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  const breadcrumbs = [
    { href: "/", label: t.common.home },
    { href: "/reunion-maker", label: t.reunionMaker.title },
    { label: t.reunionMaker.prepareTitle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />
      <TrackUsage toolId="reunion-maker" />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <UsageIndicator />

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left column: form ──────────────────────────── */}
          <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="space-y-5">
                <div>
                  <label className={LABEL_CLASS}>{t.reunionMaker.meetingTypeLabel}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={cn(INPUT_CLASS, type === "" && "text-gray-400 dark:text-gray-500")}
                  >
                    <option value="" disabled>{"—"}</option>
                    {TYPES_REUNION.map((mt) => (
                      <option key={mt} value={mt}>{mt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    {t.reunionMaker.context}
                  </label>
                  <textarea
                    value={contexte}
                    onChange={(e) => setContexte(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder={t.reunionMaker.contextPlaceholder}
                    className={cn(INPUT_CLASS, "resize-none leading-relaxed")}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>{t.reunionMaker.participants}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["< 5", "5–10", "10+"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setParticipants(opt)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          participants === opt
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.reunionMaker.duration}
                    </label>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                      {formatDuree(duree)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={120}
                    step={15}
                    value={duree}
                    onChange={(e) => setDuree(Number(e.target.value))}
                    className="w-full cursor-pointer accent-blue-600"
                    style={{
                      background: `linear-gradient(to right, #1d4ed8 0%, #1d4ed8 ${((duree - 15) / 105) * 100}%, #e5e7eb ${((duree - 15) / 105) * 100}%, #e5e7eb 100%)`,
                      height: "6px",
                      borderRadius: "9999px",
                      appearance: "none",
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">15 min</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">1h</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">2h</span>
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>{t.reunionMaker.stakeholderLevel}</label>
                  <select
                    value={stakeholders}
                    onChange={(e) => setStakeholders(e.target.value)}
                    className={cn(INPUT_CLASS, stakeholders === "" && "text-gray-400 dark:text-gray-500")}
                  >
                    <option value="" disabled>{"—"}</option>
                    {STAKEHOLDER_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || phase === "loading"}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
                >
                  {phase === "loading" ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {t.reunionMaker.preparing}
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      {t.reunionMaker.prepare}
                    </>
                  )}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          </div>

          {/* ── Right column: results ─────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {historyOpen
                  ? t.recruitment.history
                  : phase === "result"
                  ? t.reunionMaker.generated
                  : t.recruitment.results}
              </h2>
              <div className="flex items-center gap-2">
                {phase === "result" && !historyOpen && (
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <RotateCcw size={13} />
                    {t.reunionMaker.restart}
                  </button>
                )}
                <button
                  onClick={() => setHistoryOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    historyOpen
                      ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  <History size={13} />
                  {t.recruitment.history}
                  {history.length > 0 && (
                    <span className="tabular-nums">{history.length}</span>
                  )}
                </button>
              </div>
            </div>

            {historyOpen ? (
              <HistoryPanel
                history={history}
                onLoad={loadEntry}
                onDelete={deleteEntry}
                onClear={clearHistory}
              />
            ) : (
              <>
                {phase === "idle"    && <EmptyState />}
                {phase === "loading" && <LoadingState />}
                {phase === "result"  && plan && (
                  <ResultPanel
                    plan={plan}
                    type={type}
                    checked={checked}
                    allChecked={allChecked}
                    onToggle={toggleCheck}
                  />
                )}
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
