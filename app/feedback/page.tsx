"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Copy,
  Eye,
  History,
  RefreshCw,
  Scale,
  Sparkles,
  Target,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { TrackUsage } from "@/components/TrackUsage";
import { UsageIndicator } from "@/components/UsageIndicator";
import type {
  FeedbackFormat,
  FeedbackHistoryEntry,
  FeedbackRequest,
  FeedbackResponse,
  FeedbackTone,
  FeedbackType,
} from "@/lib/types";
import { useI18n } from "@/lib/i18n";

const HISTORY_KEY = "posture_feedback_history";
const HISTORY_MAX = 20;

function loadHistory(): FeedbackHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persistHistory(entries: FeedbackHistoryEntry[]) {
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

const TYPE_CLS: Record<FeedbackType, string> = {
  positive:   "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  corrective: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  mixed:      "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
};

export default function FeedbackPage() {
  const { t } = useI18n();
  const [context, setContext] = useState("");
  const [type, setType] = useState<FeedbackType>("corrective");
  const [tone, setTone] = useState<FeedbackTone>("direct");
  const [format, setFormat] = useState<FeedbackFormat>("oral_1on1");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FeedbackResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState<FeedbackHistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function saveToHistory(request: FeedbackRequest, response: FeedbackResponse) {
    const entry: FeedbackHistoryEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      request,
      response,
    };
    const updated = [entry, ...history].slice(0, HISTORY_MAX);
    setHistory(updated);
    persistHistory(updated);
  }

  function loadEntry(entry: FeedbackHistoryEntry) {
    setContext(entry.request.context);
    setType(entry.request.type);
    setTone(entry.request.tone);
    setFormat(entry.request.format);
    setResult(entry.response);
    setHistoryOpen(false);
    setError(null);
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

  async function generate() {
    if (context.trim().length < 20) {
      setError(t.feedback.errorMinChars);
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    setHistoryOpen(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, type, tone, format }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.details || data.error || t.common.error);
        return;
      }
      const response = data as FeedbackResponse;
      setResult(response);
      saveToHistory({ context, type, tone, format }, response);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError(t.feedback.errorTimeout);
      } else {
        setError(e instanceof Error ? e.message : t.common.error);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  async function copyFeedback() {
    if (!result) return;
    await navigator.clipboard.writeText(result.feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header backHref="/" currentTool={t.feedback.title} />
      <TrackUsage toolId="feedback" />
      <main className="mx-auto max-w-5xl px-6 py-6">
        <UsageIndicator />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* ── Left column: form ──────────────────────────────── */}
          <section>
            <h2 className="text-base font-medium">{t.feedback.describeLabel}</h2>
            <p className="mb-4 text-[13px] text-gray-500 dark:text-gray-400">
              {t.feedback.describePlaceholder}
            </p>

            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              maxLength={2000}
              placeholder={t.feedback.contextPlaceholder}
              className="min-h-[140px] w-full resize-y rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
            <div className="mb-6 mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t.feedback.describeHint}</span>
              <span>{context.length} / 2000</span>
            </div>

            <FieldGroup label={t.feedback.typeLabel}>
              <SegmentedControl
                value={type}
                onChange={setType}
                options={[
                  { value: "positive", label: t.feedback.types.positive, icon: ThumbsUp },
                  { value: "corrective", label: t.feedback.types.corrective, icon: Target },
                  { value: "mixed", label: t.feedback.types.mixed, icon: Scale },
                ]}
              />
            </FieldGroup>

            <FieldGroup label={t.feedback.toneLabel}>
              <SegmentedControl
                value={tone}
                onChange={setTone}
                options={[
                  { value: "caring", label: t.feedback.tones.kind },
                  { value: "direct", label: t.feedback.tones.direct },
                  { value: "coaching", label: t.feedback.tones.coaching },
                ]}
              />
            </FieldGroup>

            <FieldGroup label={t.feedback.formatLabel}>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as FeedbackFormat)}
                className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="oral_1on1">{t.feedback.formats.oral}</option>
                <option value="written_slack">{t.feedback.formats.slack}</option>
                <option value="written_email">{t.feedback.formats.email}</option>
              </select>
            </FieldGroup>

            <button
              onClick={generate}
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> {t.feedback.generating}</>
              ) : (
                <><Sparkles className="h-4 w-4" /> {t.feedback.generate}</>
              )}
            </button>

            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </section>

          {/* ── Right column: result + history ───────────────────── */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium">
                {historyOpen ? t.feedback.history : t.feedback.generated}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setHistoryOpen((v) => !v)}
                  title={t.feedback.history}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                    historyOpen
                      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <History className="h-3.5 w-3.5" />
                  {history.length > 0 && (
                    <span className="tabular-nums">{history.length}</span>
                  )}
                </button>

                {!historyOpen && result && (
                  <>
                    <button
                      onClick={generate}
                      disabled={loading}
                      title={t.feedback.regenerate}
                      className="rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={copyFeedback}
                      className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? t.feedback.copied : t.feedback.copy}
                    </button>
                  </>
                )}
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
                {!result && !loading && <EmptyState />}
                {loading && <LoadingState />}
                {result && (
                  <FeedbackCard result={result} tone={tone} type={type} format={format} />
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ── History panel ──────────────────────────────────────────────────────────

function HistoryPanel({
  history,
  onLoad,
  onDelete,
  onClear,
}: {
  history: FeedbackHistoryEntry[];
  onLoad: (e: FeedbackHistoryEntry) => void;
  onDelete: (id: string, ev: React.MouseEvent) => void;
  onClear: () => void;
}) {
  const { t, locale } = useI18n();

  if (history.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-8 text-center">
        <Clock className="mb-3 h-6 w-6 text-gray-400 dark:text-gray-500" />
        <p className="text-sm font-medium">{t.feedback.noHistory}</p>
        <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
          {t.feedback.noHistoryDesc}
        </p>
      </div>
    );
  }

  const typeLabel: Record<FeedbackType, string> = {
    positive: t.feedback.types.positive,
    corrective: t.feedback.types.corrective,
    mixed: t.feedback.types.mixed,
  };
  const toneLabel: Record<FeedbackTone, string> = {
    caring: t.feedback.tones.kind,
    direct: t.feedback.tones.direct,
    coaching: t.feedback.tones.coaching,
  };
  const formatShort: Record<FeedbackFormat, string> = {
    oral_1on1: "1:1",
    written_slack: "Slack",
    written_email: "Email",
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-gray-500 dark:text-gray-400">
          {history.length} {history.length > 1 ? t.common.feedbacks : t.common.feedback}
        </p>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          {t.common.clearAll}
        </button>
      </div>

      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
        {history.map((entry) => (
          <div
            key={entry.id}
            onClick={() => onLoad(entry)}
            className="group relative cursor-pointer rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 transition-colors hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
          >
            <button
              onClick={(e) => onDelete(entry.id, e)}
              className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <p className="mb-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              {relativeDate(entry.createdAt, locale)}
            </p>

            <p className="mb-2.5 text-[13px] text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 pr-5">
              {entry.request.context}
            </p>

            <div className="flex flex-wrap gap-1.5">
              <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium", TYPE_CLS[entry.request.type])}>
                {typeLabel[entry.request.type]}
              </span>
              <span className="inline-flex items-center rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                {toneLabel[entry.request.tone]}
              </span>
              <span className="inline-flex items-center rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                {formatShort[entry.request.format]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Form helpers ───────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-[13px] font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  );
}

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
}) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md border px-2 py-2 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              isActive
                ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            {Icon && <Icon className="mx-auto mb-1 h-3.5 w-3.5" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Result states ──────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-8 text-center">
      <Sparkles className="mb-3 h-6 w-6 text-gray-400 dark:text-gray-500" />
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.feedback.placeholder}</p>
      <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
        {t.feedback.placeholderDesc}
      </p>
    </div>
  );
}

function LoadingState() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
      <div className="mb-4 space-y-3 w-full max-w-sm animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto" />
      </div>
      <p className="text-[13px] text-gray-500 dark:text-gray-400">{t.feedback.writing}</p>
    </div>
  );
}

function FeedbackCard({
  result,
  tone,
  format,
}: {
  result: FeedbackResponse;
  tone: FeedbackTone;
  type: FeedbackType;
  format: FeedbackFormat;
}) {
  const { t } = useI18n();
  const [showAlternative, setShowAlternative] = useState(false);

  const toneLabels: Record<FeedbackTone, string> = {
    caring: t.feedback.tones.kind,
    direct: t.feedback.tones.direct,
    coaching: t.feedback.tones.coaching,
  };
  const formatShort: Record<FeedbackFormat, string> = {
    oral_1on1: "1:1",
    written_slack: "Slack",
    written_email: "Email",
  };

  return (
    <>
      <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <span className="mb-3 inline-block rounded-md bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[11px] font-medium text-blue-900 dark:text-blue-200">
          SBI · {toneLabels[tone]} · {formatShort[format]}
        </span>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-100">
          {result.feedback}
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="mb-3 flex gap-2.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400" />
          <div>
            <p className="mb-0.5 text-xs font-medium text-amber-900 dark:text-amber-200">{t.feedback.caution}</p>
            <ul className="space-y-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      {result.missing_context.length > 0 && (
        <div className="mb-3 rounded-md border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p className="mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            {t.feedback.beforeDelivering}
          </p>
          <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            {result.missing_context.map((q, i) => <li key={i}>· {q}</li>)}
          </ul>
        </div>
      )}

      {result.alternative_phrasing && (
        <div className="mb-3 rounded-md border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <button
            onClick={() => setShowAlternative((v) => !v)}
            className="flex w-full items-center justify-between text-[13px] font-medium text-gray-700 dark:text-gray-300"
          >
            <span>{t.feedback.variant}</span>
            <span className="text-gray-400 dark:text-gray-500">{showAlternative ? "▲" : "▼"}</span>
          </button>
          {showAlternative && (
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
              {result.alternative_phrasing}
            </p>
          )}
        </div>
      )}

      <details className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
        <summary className="flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300">
          <Eye className="h-3.5 w-3.5" />
          {t.feedback.sbiLabel}
        </summary>
        <div className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
          <p>
            <span className="font-medium text-blue-700 dark:text-blue-400">Situation</span> —{" "}
            {result.structure.situation}
          </p>
          <p>
            <span className="font-medium text-blue-700 dark:text-blue-400">Behavior</span> —{" "}
            {result.structure.behavior}
          </p>
          <p>
            <span className="font-medium text-blue-700 dark:text-blue-400">Impact</span> —{" "}
            {result.structure.impact}
          </p>
        </div>
      </details>
    </>
  );
}
