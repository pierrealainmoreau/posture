"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Target, Plus, Trash2, Loader2, Sparkles, Check, ChevronRight,
  AlertTriangle, Building2, Users, Pencil,
} from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import type { Collaborator, CompanyOkr, CollaboratorOkr, KeyResult } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

// ── Helpers ────────────────────────────────────────────────────────────────

function newKrId() {
  return `kr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function initials(c: Collaborator) {
  return ((c.first_name[0] ?? "") + (c.last_name[0] ?? "")).toUpperCase() || "?";
}

const PERIOD_PRESETS = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "2025", "2026"];

type AssistStep = "improve_objective" | "suggest_key_results" | "critique";

interface CompanyForm {
  period: string;
  objective: string;
  key_results: KeyResult[];
}

const EMPTY_FORM: CompanyForm = { period: "", objective: "", key_results: [] };

function emptyKr(): KeyResult {
  return { id: newKrId(), label: "", target: "", unit: "" };
}

function computeOkrProgress(krs: Array<{ current?: string }>): number | null {
  const values = krs.map((kr) => Math.round(parseFloat(kr.current ?? "0") || 0));
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function progressColor(pct: number) {
  if (pct === 0)  return { bar: "bg-gray-200 dark:bg-gray-700", text: "text-gray-400 dark:text-gray-500" };
  if (pct >= 70)  return { bar: "bg-green-500",  text: "text-green-600 dark:text-green-400" };
  if (pct >= 40)  return { bar: "bg-amber-400",  text: "text-amber-500 dark:text-amber-400" };
  return           { bar: "bg-red-400",   text: "text-red-500 dark:text-red-400" };
}

// ── Page content ───────────────────────────────────────────────────────────

function OkrPageContent() {
  const { t } = useI18n();
  const router = useRouter();

  const [companyOkr, setCompanyOkr]       = useState<CompanyOkr | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collabOkrs, setCollabOkrs]       = useState<Record<string, CollaboratorOkr>>({});
  const [loading, setLoading]             = useState(true);

  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState<CompanyForm>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [assisting, setAssisting]     = useState<AssistStep | null>(null);
  const [critique, setCritique]       = useState<string | null>(null);
  const [assistError, setAssistError] = useState<string | null>(null);

  const [generating, setGenerating] = useState<string | null>(null);
  const [genError, setGenError]     = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }

      const [collabsRes, okrRes] = await Promise.all([
        supabase.from("collaborators").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        fetch("/api/coach/okr/company"),
      ]);

      const collabs = (collabsRes.data as Collaborator[]) ?? [];
      setCollaborators(collabs);

      const okrData: CompanyOkr | null = okrRes.ok ? await okrRes.json() : null;
      setCompanyOkr(okrData);

      if (okrData) {
        const res = await fetch(`/api/coach/okr/collaborator?company_okr_id=${okrData.id}`);
        if (res.ok) {
          const rows = (await res.json()) as CollaboratorOkr[];
          const map: Record<string, CollaboratorOkr> = {};
          for (const r of rows) map[r.collaborator_id] = r;
          setCollabOkrs(map);
        }
        setEditing(false);
      } else {
        setEditing(true);
        setForm(EMPTY_FORM);
      }

      setLoading(false);
    });
  }, [router]);

  function startEditing() {
    if (companyOkr) {
      setForm({ period: companyOkr.period, objective: companyOkr.objective, key_results: companyOkr.key_results });
    } else {
      setForm(EMPTY_FORM);
    }
    setCritique(null);
    setAssistError(null);
    setSaveError(null);
    setEditing(true);
  }

  function updateKr(id: string, field: keyof KeyResult, value: string) {
    setForm((f) => ({ ...f, key_results: f.key_results.map((kr) => kr.id === id ? { ...kr, [field]: value } : kr) }));
  }
  function removeKr(id: string) {
    setForm((f) => ({ ...f, key_results: f.key_results.filter((kr) => kr.id !== id) }));
  }
  function addKr() {
    setForm((f) => ({ ...f, key_results: [...f.key_results, emptyKr()] }));
  }

  async function assist(step: AssistStep) {
    if (!form.period.trim()) { setAssistError(t.coach.okrPeriodLabel + " ?"); return; }
    if (step !== "suggest_key_results" && !form.objective.trim()) {
      setAssistError(t.coach.okrObjectiveLabel + " ?"); return;
    }
    setAssisting(step);
    setAssistError(null);
    setCritique(null);
    try {
      const res = await fetch("/api/coach/okr/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, period: form.period, current_objective: form.objective, current_key_results: form.key_results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.common.error);
      if (step === "improve_objective") {
        setForm((f) => ({ ...f, objective: data.suggestion as string }));
      } else if (step === "suggest_key_results") {
        const krs = (data.suggestion as KeyResult[]).map((kr) => ({ ...kr, id: newKrId() }));
        setForm((f) => ({ ...f, key_results: krs }));
      } else {
        setCritique(data.suggestion as string);
      }
    } catch (e) {
      setAssistError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setAssisting(null);
    }
  }

  async function saveCompanyOkr() {
    if (!form.period.trim() || !form.objective.trim()) {
      setSaveError(t.coach.okrPeriodLabel + " + " + t.coach.okrObjectiveLabel); return;
    }
    if (form.key_results.length === 0) { setSaveError(t.coach.addKrBtn); return; }
    const incomplete = form.key_results.find((kr) => !kr.label.trim() || !kr.target.trim());
    if (incomplete) { setSaveError(t.coach.krResultsLabel); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/coach/okr/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: form.period, objective: form.objective, key_results: form.key_results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.common.error);
      setCompanyOkr(data as CompanyOkr);
      setEditing(false);
      setCritique(null);
      const collabRes = await fetch(`/api/coach/okr/collaborator?company_okr_id=${(data as CompanyOkr).id}`);
      if (collabRes.ok) {
        const rows = (await collabRes.json()) as CollaboratorOkr[];
        const map: Record<string, CollaboratorOkr> = {};
        for (const r of rows) map[r.collaborator_id] = r;
        setCollabOkrs(map);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function generateCollaboratorOkr(collaboratorId: string) {
    setGenerating(collaboratorId);
    setGenError(null);
    try {
      const res = await fetch("/api/coach/okr/generate-collaborator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborator_id: collaboratorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.common.error);
      setCollabOkrs((prev) => ({ ...prev, [collaboratorId]: data as CollaboratorOkr }));
    } catch (e) {
      setGenError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header backHref="/coach" currentTool="1:1 Coach" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const okrsDefined = Object.keys(collabOkrs).length;
  const okrsTotal   = collaborators.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool="OKR" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center flex-shrink-0">
            <Target size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">OKR</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.coach.okrPageSubtitle}</p>
          </div>
        </div>

        {/* Company OKR form */}
        {editing && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 size={16} className="text-violet-500 dark:text-violet-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {companyOkr ? t.coach.editCompanyOkr : t.coach.newCompanyOkr}
              </h2>
            </div>

            {/* Period */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.coach.okrPeriodLabel}
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {PERIOD_PRESETS.map((p) => (
                  <button key={p} onClick={() => setForm((f) => ({ ...f, period: p }))}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                      form.period === p
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
              <input value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                placeholder="ex: Q3 2025, 2026…"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>

            {/* Objective */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t.coach.okrObjectiveLabel}{" "}
                  <span className="text-gray-400 font-normal">{t.coach.okrObjectiveFormHint}</span>
                </label>
                <button onClick={() => assist("improve_objective")}
                  disabled={assisting !== null || !form.objective.trim()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-40 transition-colors">
                  {assisting === "improve_objective" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {t.coach.improveObjectiveBtn}
                </button>
              </div>
              <textarea value={form.objective} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
            </div>

            {/* Key Results */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t.coach.krResultsLabel}{" "}
                  <span className="text-gray-400 font-normal">(mesurables)</span>
                </label>
                <button onClick={() => assist("suggest_key_results")}
                  disabled={assisting !== null || !form.objective.trim()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-40 transition-colors">
                  {assisting === "suggest_key_results" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {t.coach.suggestKrBtn}
                </button>
              </div>

              <div className="space-y-3 mb-3">
                {form.key_results.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 py-2 text-center">
                    {t.coach.noKrYetForm}
                  </p>
                )}
                {form.key_results.map((kr, i) => (
                  <div key={kr.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-5 flex-shrink-0">KR{i + 1}</span>
                      <input value={kr.label} onChange={(e) => updateKr(kr.id, "label", e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                      <button onClick={() => removeKr(kr.id)}
                        className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 ml-7">
                      <div className="flex-1">
                        <label className="block text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide">
                          {t.coach.okrKrTargetLabel}
                        </label>
                        <input value={kr.target} onChange={(e) => updateKr(kr.id, "target", e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide">
                          {t.coach.okrKrUnitLabel}
                        </label>
                        <input value={kr.unit} onChange={(e) => updateKr(kr.id, "unit", e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addKr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <Plus size={12} /> {t.coach.addKrBtn}
              </button>
            </div>

            {/* Critique */}
            {form.key_results.length > 0 && (
              <div className="mb-5">
                <button onClick={() => assist("critique")}
                  disabled={assisting !== null || !form.objective.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 disabled:opacity-40 transition-colors">
                  {assisting === "critique" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {t.coach.analyzeAllBtn}
                </button>
              </div>
            )}

            {critique && (
              <div className="mb-5 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">{t.coach.aiAnalysisLabel}</p>
                <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-line">{critique}</p>
              </div>
            )}

            {(saveError || assistError) && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                {saveError ?? assistError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={saveCompanyOkr} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? t.coach.savingOkrStatus : t.coach.validateCompanyOkrBtn}
              </button>
              {companyOkr && (
                <button onClick={() => { setEditing(false); setCritique(null); }}
                  className="px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {t.common.cancel}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Company OKR recap + collaborators */}
        {companyOkr && !editing && (
          <>
            <div className="bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800 rounded-2xl p-5 mb-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 size={15} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                        {t.coach.companyOkrSectionLabel}
                      </span>
                      <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full border border-violet-200 dark:border-violet-800">
                        {companyOkr.period}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 leading-snug">{companyOkr.objective}</p>
                    <div className="space-y-1">
                      {companyOkr.key_results.map((kr, i) => (
                        <div key={kr.id} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-400 dark:text-gray-600 w-8">KR{i + 1}</span>
                          <span className="flex-1">{kr.label}</span>
                          <span className="font-semibold text-violet-600 dark:text-violet-400">→ {kr.target} {kr.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={startEditing}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Pencil size={11} /> {t.common.edit}
                </button>
              </div>
            </div>

            {genError && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {genError}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  <Users size={13} /> {t.coach.collaboratorsOkrSection}
                </h2>
                {okrsTotal > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {okrsDefined}/{okrsTotal} {t.coach.collaborators}
                  </span>
                )}
              </div>

              {collaborators.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
                  {t.coach.noCollaborators}{" "}
                  <Link href="/coach" className="underline hover:text-gray-600 dark:hover:text-gray-300">
                    {t.coach.noCollabsLink}
                  </Link>
                </div>
              )}

              {collaborators.map((c) => {
                const okr = collabOkrs[c.id];
                const isGenerating = generating === c.id;
                return (
                  <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 dark:text-blue-300 text-xs font-semibold">{initials(c)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{c.role}</p>
                        {okr && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{okr.objective}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {okr.key_results.length} KR{okr.key_results.length > 1 ? "s" : ""} · {t.coach.okrKrModifiedOn}{" "}
                              {new Date(okr.updated_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                            </p>
                            {(() => {
                              const avg = computeOkrProgress(okr.key_results);
                              if (avg === null || avg === 0) return null;
                              const { bar, text } = progressColor(avg);
                              return (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${avg}%` }} />
                                  </div>
                                  <span className={`text-xs font-semibold ${text}`}>{avg}%</span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {okr ? (
                          <Link href={`/coach/okr/${c.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            {t.coach.viewModifyBtn} <ChevronRight size={11} />
                          </Link>
                        ) : (
                          <>
                            <button onClick={() => generateCollaboratorOkr(c.id)}
                              disabled={isGenerating || generating !== null}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-50 transition-colors">
                              {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                              {isGenerating ? t.coach.generatingOkr : t.coach.generateOkrWithAi}
                            </button>
                            <Link href={`/coach/okr/${c.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <Pencil size={11} /> {t.coach.writeOkrBtn}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {!okr && !isGenerating && (
                      <div className="mt-3 pl-12">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" />
                          {t.coach.noOkrDefinedLabel}
                        </span>
                      </div>
                    )}
                    {okr && (
                      <div className="mt-3 pl-12">
                        {(() => {
                          const avg = computeOkrProgress(okr.key_results);
                          if (avg !== null && avg > 0) {
                            const { text } = progressColor(avg);
                            return (
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${text}`}>
                                <Check size={11} /> {avg}{t.coach.okrPercentReached}
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <Check size={11} /> {t.coach.okrDefinedLabel}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty state */}
        {!companyOkr && !editing && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center mx-auto mb-5">
              <Target size={28} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t.coach.startWithCompanyOkrTitle}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
              {t.coach.startWithCompanyOkrDesc}
            </p>
            <button onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
              <Target size={15} /> {t.coach.newCompanyOkr}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OkrPage() {
  return (
    <Suspense>
      <OkrPageContent />
    </Suspense>
  );
}
