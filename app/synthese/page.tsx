"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  FileText,
  History,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { UsageIndicator } from "@/components/UsageIndicator";
import { createClient } from "@/lib/supabase/client";
import type { Collaborator } from "@/lib/types";
import type { SyntheseDestinataire, SyntheseType } from "@/lib/prompts/synthese-system";

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: SyntheseType; label: string; description: string }[] = [
  { value: "resultats",  label: "Résultats",        description: "Avancement OKR et réussites" },
  { value: "ressources", label: "Demande",           description: "Budget, recrutement, arbitrage" },
  { value: "blocage",    label: "Alerte / Blocage",  description: "Escalade, risque à signaler" },
  { value: "rh",         label: "Situation RH",      description: "Tension, départ, sous-perf." },
  { value: "general",    label: "Point d'étape",     description: "Vue d'ensemble équilibrée" },
];

const TYPE_LABELS: Record<SyntheseType, string> = {
  resultats: "Résultats", ressources: "Demande", blocage: "Alerte",
  rh: "RH", general: "Point d'étape",
};

const DESTINATAIRE_OPTIONS: { value: SyntheseDestinataire; label: string; sublabel: string }[] = [
  { value: "n1",    label: "N+1",   sublabel: "Direct, opérationnel" },
  { value: "drh",   label: "DRH",   sublabel: "Angle humain, formel" },
  { value: "codir", label: "CODIR", sublabel: "Synthétique, stratégique" },
];

const SENIORITY_COLORS: Record<string, string> = {
  junior:    "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  confirmed: "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300",
  senior:    "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
};

const SENIORITY_LABELS: Record<string, string> = {
  junior: "Junior", confirmed: "Confirmé", senior: "Senior",
};

const PERIOD_LABELS: Record<string, string> = {
  onboarding: "Intégration", development: "Progression", retention: "Fidélisation",
};

// ── History ────────────────────────────────────────────────────────────────

interface SyntheseHistoryEntry {
  id: string;
  createdAt: number;
  collaboratorIds: string[];
  collaboratorNames: string[];
  type: SyntheseType;
  destinataire: SyntheseDestinataire;
  context: string;
  result: { note: string; warnings: string[] };
}

const HISTORY_KEY = "posture_synthese_history";
const HISTORY_MAX = 20;

function loadHistory(): SyntheseHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}

function persistHistory(entries: SyntheseHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (diff < 60_000) return rtf.format(0, "second");
  if (diff < 3_600_000) return rtf.format(-Math.floor(diff / 60_000), "minute");
  if (diff < 86_400_000) return rtf.format(-Math.floor(diff / 3_600_000), "hour");
  if (diff < 172_800_000) return rtf.format(-1, "day");
  return new Date(ts).toLocaleDateString("fr", { day: "2-digit", month: "short" });
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SynthesePage() {
  const router = useRouter();

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [type, setType] = useState<SyntheseType>("resultats");
  const [destinataire, setDestinataire] = useState<SyntheseDestinataire>("n1");
  const [context, setContext] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ note: string; warnings: string[] } | null>(null);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState<SyntheseHistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => { setHistory(loadHistory()); }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }

      const { data } = await supabase
        .from("collaborators")
        .select("id, first_name, last_name, role, seniority, period, avatar_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const collabs = (data as Collaborator[]) ?? [];
      setCollaborators(collabs);
      setSelectedIds(new Set(collabs.map((c) => c.id)));
      setLoadingCollabs(false);
    }).catch(() => router.replace("/login"));
  }, [router]);

  function toggleCollab(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === collaborators.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(collaborators.map((c) => c.id)));
    }
  }

  function saveToHistory(res: { note: string; warnings: string[] }) {
    const names = collaborators
      .filter((c) => selectedIds.has(c.id))
      .map((c) => `${c.first_name} ${c.last_name}`);
    const entry: SyntheseHistoryEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      collaboratorIds: Array.from(selectedIds),
      collaboratorNames: names,
      type,
      destinataire,
      context,
      result: res,
    };
    const updated = [entry, ...history].slice(0, HISTORY_MAX);
    setHistory(updated);
    persistHistory(updated);
  }

  function loadEntry(entry: SyntheseHistoryEntry) {
    setSelectedIds(new Set(entry.collaboratorIds));
    setType(entry.type);
    setDestinataire(entry.destinataire);
    setContext(entry.context);
    setResult(entry.result);
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

  async function generate() {
    if (selectedIds.size === 0) {
      setError("Sélectionne au moins un collaborateur.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    setHistoryOpen(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    try {
      const res = await fetch("/api/generate-synthese", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaborator_ids: Array.from(selectedIds),
          type,
          destinataire,
          context: context.trim(),
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.details || data.error || "Une erreur est survenue.");
        return;
      }
      const r = data as { note: string; warnings: string[] };
      setResult(r);
      saveToHistory(r);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("La génération a pris trop de temps. Réessaie avec moins de collaborateurs.");
      } else {
        setError(e instanceof Error ? e.message : "Erreur inconnue.");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  async function copyNote() {
    if (!result) return;
    await navigator.clipboard.writeText(result.note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function initials(c: Collaborator) {
    return ((c.first_name[0] ?? "") + (c.last_name[0] ?? "")).toUpperCase() || "?";
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header backHref="/" currentTool="Synthèse managériale" />
      <main className="mx-auto max-w-5xl px-6 py-6">
        <UsageIndicator />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">

          {/* ── Left column ───────────────────────────────── */}
          <section className="space-y-6">

            {/* Collaborateurs */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Équipe concernée
                </label>
                {collaborators.length > 1 && (
                  <button
                    onClick={toggleAll}
                    className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {selectedIds.size === collaborators.length ? "Désélectionner tout" : "Tout sélectionner"}
                  </button>
                )}
              </div>

              {loadingCollabs ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement…
                </div>
              ) : collaborators.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-5 text-center">
                  <Users className="mx-auto mb-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucun collaborateur dans Mon équipe.
                  </p>
                  <a
                    href="/teams"
                    className="mt-1 inline-block text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Ajouter un collaborateur →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {collaborators.map((c) => {
                    const selected = selectedIds.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleCollab(c.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                          selected
                            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
                            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-60 hover:opacity-80",
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                          SENIORITY_COLORS[c.seniority] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                        )}>
                          {initials(c)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {c.first_name} {c.last_name}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {c.role} · {SENIORITY_LABELS[c.seniority] ?? c.seniority} · {PERIOD_LABELS[c.period] ?? c.period}
                          </p>
                        </div>
                        <div className={cn(
                          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                          selected
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-gray-300 dark:border-gray-600",
                        )}>
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Type de note */}
            <div>
              <label className="mb-3 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Type de note
              </label>
              <div className="space-y-1.5">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                      type === opt.value
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                    )}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Destinataire */}
            <div>
              <label className="mb-3 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Destinataire
              </label>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
              >
                {DESTINATAIRE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDestinataire(opt.value)}
                    className={cn(
                      "flex flex-col items-center rounded-md border px-2 py-3 text-center transition-colors",
                      destinataire === opt.value
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                    )}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500 leading-snug">{opt.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contexte */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Contexte <span className="text-gray-400 dark:text-gray-500 font-normal">(optionnel)</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                maxLength={1000}
                placeholder="Évènements récents, décision à prendre, éléments non visibles dans les données…"
                className="min-h-[90px] w-full resize-y rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              />
              <p className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">{context.length} / 1000</p>
            </div>

            {/* CTA */}
            <button
              onClick={generate}
              disabled={loading || selectedIds.size === 0}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Génération en cours…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Générer la note</>
              )}
            </button>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </section>

          {/* ── Right column ──────────────────────────────── */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
                {historyOpen ? "Historique" : "Note de synthèse"}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setHistoryOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                    historyOpen
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  <History className="h-3.5 w-3.5" />
                  Historique
                  {history.length > 0 && (
                    <span className="tabular-nums">{history.length}</span>
                  )}
                </button>

                {!historyOpen && result && (
                  <>
                    <button
                      onClick={generate}
                      disabled={loading}
                      title="Regénérer"
                      className="rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={copyNote}
                      className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Copié !" : "Copier"}
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
                {result && <NoteCard result={result} />}
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
  history: SyntheseHistoryEntry[];
  onLoad: (e: SyntheseHistoryEntry) => void;
  onDelete: (id: string, ev: React.MouseEvent) => void;
  onClear: () => void;
}) {
  if (history.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-8 text-center">
        <Clock className="mb-3 h-6 w-6 text-gray-400 dark:text-gray-500" />
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Aucun historique</p>
        <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
          Les notes générées apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-gray-500 dark:text-gray-400">
          {history.length} note{history.length > 1 ? "s" : ""} générée{history.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Tout effacer
        </button>
      </div>

      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
        {history.map((entry) => (
          <div
            key={entry.id}
            onClick={() => onLoad(entry)}
            className="group relative cursor-pointer rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 transition-colors hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
          >
            <button
              onClick={(e) => onDelete(entry.id, e)}
              className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <p className="mb-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              {relativeDate(entry.createdAt)}
            </p>

            <p className="mb-2.5 text-[13px] font-medium text-gray-900 dark:text-gray-100 pr-5 line-clamp-1">
              {entry.collaboratorNames.length > 2
                ? `${entry.collaboratorNames.slice(0, 2).join(", ")} +${entry.collaboratorNames.length - 2}`
                : entry.collaboratorNames.join(", ")}
            </p>

            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                {TYPE_LABELS[entry.type]}
              </span>
              <span className="inline-flex items-center rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                → {entry.destinataire.toUpperCase()}
              </span>
              {entry.context && (
                <span className="inline-flex items-center rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-500 dark:text-gray-500 italic line-clamp-1 max-w-[160px]">
                  {entry.context.slice(0, 40)}{entry.context.length > 40 ? "…" : ""}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-8 text-center">
      <FileText className="mb-3 h-7 w-7 text-gray-400 dark:text-gray-500" />
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Ta note apparaîtra ici
      </p>
      <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
        Sélectionne l&apos;équipe, le type et le destinataire, puis génère.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
      <div className="mb-4 space-y-3 w-full max-w-sm animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="mt-4 h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
      <p className="text-[13px] text-gray-500 dark:text-gray-400">Analyse de l&apos;équipe et rédaction…</p>
    </div>
  );
}

function NoteCard({ result }: { result: { note: string; warnings: string[] } }) {
  return (
    <>
      {result.warnings.length > 0 && (
        <div className="mb-3 flex gap-2.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400" />
          <div>
            <p className="mb-0.5 text-xs font-medium text-amber-900 dark:text-amber-200">Points d&apos;attention</p>
            <ul className="space-y-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <span className="mb-3 inline-block rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-900 dark:text-emerald-200">
          Note de synthèse managériale
        </span>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-100">
          {result.note}
        </div>
      </div>
    </>
  );
}
