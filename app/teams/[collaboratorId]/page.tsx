"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Check, Lock, Trash2, AlertTriangle,
  RefreshCw, Sparkles, Crown, MessageSquare, ChevronDown, ChevronUp,
  TrendingUp, X, Download, Target, Plus, Building2, BookUser, Copy, Link2,
  CalendarDays, Smile, Star,
} from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import type {
  Collaborator, CoachSeniority, CollaboratorPeriod,
  ManagerialPlan, WeeklySession, ExpertiseLevel, CareerSkill, CareerPath,
  CompanyOkr, CollaboratorOkr, KeyResult, CollaboratorManual, CollaboratorSuggestions,
} from "@/lib/types";
import { MANUAL_SECTIONS } from "@/lib/manual-questions";
import { COACH_CONFIG, LEVELS } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

type Tab = "overview" | "plan" | "career" | "sessions" | "okr" | "settings";
type SettingsSubTab = "profile" | "manual" | "ateliers";

type AtelierActivity = {
  gameType: string;
  gameLabel: string;
  roomCode: string;
  startedAt: string;
  result: {
    type: "mood";
    moodId: string | null;
    moodLabel: string | null;
    moodSublabel: string | null;
  } | {
    type: "roti";
    vote: number | null;
  } | {
    type: "participated";
  } | null;
};

type AtelierSession = {
  sessionId: string;
  sessionCode: string;
  sessionName: string | null;
  sessionDate: string;
  participantPseudo: string;
  activities: AtelierActivity[];
};

const SENIORITY_OPTIONS: CoachSeniority[] = ["junior", "confirmed", "senior"];
const PERIOD_OPTIONS: CollaboratorPeriod[] = ["onboarding", "development", "retention"];

const AXIS_COLORS: Record<string, string> = {
  Compétences:   "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Autonomie:     "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  Impact:        "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  Motivation:    "bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  Visibilité:    "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  Collaboration: "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  Leadership:    "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  Apprentissage: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
};
function axisCls(axis: string) {
  return AXIS_COLORS[axis] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700";
}

function progressColor(pct: number) {
  if (pct === 0)  return { bar: "bg-gray-200 dark:bg-gray-700", text: "text-gray-400 dark:text-gray-500", thumb: "#d1d5db" };
  if (pct >= 70)  return { bar: "bg-green-500",  text: "text-green-600 dark:text-green-400",  thumb: "#22c55e" };
  if (pct >= 40)  return { bar: "bg-amber-400",  text: "text-amber-500 dark:text-amber-400",  thumb: "#f59e0b" };
  return           { bar: "bg-red-400",   text: "text-red-500 dark:text-red-400",    thumb: "#ef4444" };
}

const DOT_FILL = ["bg-gray-400", "bg-blue-400", "bg-violet-500", "bg-amber-500"];
const LEVEL_TEXT_COLOR = ["text-gray-500", "text-blue-500", "text-violet-500", "text-amber-500"];

// ── Skill level editor ─────────────────────────────────────────────────────

function SkillRow({ skill, onUpdate }: { skill: CareerSkill; onUpdate: (level: ExpertiseLevel) => void }) {
  const { t } = useI18n();
  const currentIdx = LEVELS.indexOf(skill.level as ExpertiseLevel);
  const targetIdx  = LEVELS.indexOf(skill.target as ExpertiseLevel);
  const gap = targetIdx - currentIdx;

  return (
    <div className="py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 min-w-0">{skill.skill}</span>
        <div className="flex items-center gap-1.5">
          {LEVELS.map((level, i) => {
            const isFilled  = i <= currentIdx;
            const isTarget  = i === targetIdx;
            const isAboveTarget = i > targetIdx;
            return (
              <button key={level} onClick={() => onUpdate(level)} title={level}
                className={[
                  "w-4 h-4 rounded-full transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
                  isFilled ? DOT_FILL[currentIdx] ?? "bg-gray-400" : isAboveTarget ? "bg-gray-100 dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-800",
                  !isFilled && isTarget ? "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-gray-900" : "",
                ].filter(Boolean).join(" ")}
              />
            );
          })}
        </div>
        <span className={`text-xs font-medium w-24 text-right ${LEVEL_TEXT_COLOR[currentIdx] ?? "text-gray-500"}`}>
          {skill.level}
        </span>
        <div className="w-32 text-right">
          {gap > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Target size={10} className="text-amber-400" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">{skill.target}</span>
            </span>
          ) : gap === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
              <Check size={10} /> {t.coach.goalReachedLabel}
            </span>
          ) : (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t.coach.beyondLabel}</span>
          )}
        </div>
      </div>
      {skill.expectation && gap > 0 && (
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 italic leading-relaxed pl-0.5">
          <span className="text-amber-500 dark:text-amber-400 not-italic font-medium">{t.coach.expectedLabel} </span>
          {skill.expectation}
        </p>
      )}
    </div>
  );
}

// ── Plan progress gauge ────────────────────────────────────────────────────

function PlanProgressGauge({ step, firstName }: { step: 0 | 1 | 2 | 3 | 4; firstName: string }) {
  const { t } = useI18n();
  const planSteps = t.coach.planSteps;
  const pct = step === 0 ? 0 : Math.round((step / planSteps.length) * 100);

  return (
    <div className="w-full max-w-sm mx-auto bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
          <Sparkles size={13} className="text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {t.coach.analyzingPrefix} {firstName} {t.coach.analyzingSuffix}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t.coach.planStepLabel} {step} {t.coach.planStepOf} {planSteps.length}
          </p>
        </div>
        <span className="ml-auto text-xs font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{pct}%</span>
      </div>

      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2.5">
        {planSteps.map((s, i) => {
          const stepNum = i + 1;
          const isDone    = step > stepNum;
          const isActive  = step === stepNum;
          const isPending = step < stepNum;
          return (
            <div key={i} className={`flex items-center gap-3 transition-opacity duration-300 ${isPending ? "opacity-30" : "opacity-100"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDone ? "bg-green-100 dark:bg-green-900/40" : isActive ? "bg-blue-100 dark:bg-blue-900/40" : "bg-gray-100 dark:bg-gray-800"
              }`}>
                {isDone ? <Check size={10} className="text-green-600 dark:text-green-400" />
                  : isActive ? <Loader2 size={10} className="text-blue-600 dark:text-blue-400 animate-spin" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-medium leading-tight ${
                  isDone ? "text-green-700 dark:text-green-400" : isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-400 dark:text-gray-500"
                }`}>{s.label}</p>
                {isActive && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Misc helpers ───────────────────────────────────────────────────────────

function initials(c: Collaborator) {
  return ((c.first_name[0] ?? "") + (c.last_name[0] ?? "")).toUpperCase() || "?";
}

function exportMarkdown(session: WeeklySession, collaborator: Collaborator): void {
  const lines = [
    `# 1:1 — ${collaborator.first_name} ${collaborator.last_name} — Semaine ${session.week_number}`,
    "",
    `**Axe de développement :** ${session.development_axis}`,
    "",
    "## Sujets prioritaires",
    "",
    `### 1. ${session.priority_topic_1}`,
    `*${session.raw_content.priority_topic_1_rationale}*`,
    "",
    `### 2. ${session.priority_topic_2}`,
    `*${session.raw_content.priority_topic_2_rationale}*`,
    "",
    "## Exploration",
    "",
    session.exploration_topic,
    "",
    `*${session.raw_content.exploration_rationale}*`,
    "",
    "## Question inattendue",
    "",
    `> ${session.unexpected_question}`,
    "",
    "## Relances suggérées",
    "",
    ...session.raw_content.suggested_follow_ups.map((f) => `- ${f}`),
    "",
    "## Mes notes",
    "",
    session.manager_notes ?? "",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `1on1-${collaborator.last_name.toLowerCase()}-semaine${session.week_number}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ───────────────────────────────────────────────────────────────────

function CollaboratorPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ collaboratorId: string }>();
  const searchParams = useSearchParams();

  const collaboratorId = params.collaboratorId;
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const isNew = searchParams.get("new") === "true";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [plan, setPlan] = useState<ManagerialPlan | null>(null);
  const [sessions, setSessions] = useState<WeeklySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [profileDraft, setProfileDraft] = useState<Partial<Collaborator>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [deletingCollaborator, setDeletingCollaborator] = useState(false);

  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planStep, setPlanStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [planError, setPlanError] = useState<string | null>(null);
  const [axesOpen, setAxesOpen] = useState<boolean[]>([]);
  const [risksOpen, setRisksOpen] = useState(false);

  const [careerDraft, setCareerDraft] = useState<CareerPath | null>(null);
  const [savingCareer, setSavingCareer] = useState(false);
  const careerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [generatingWeek, setGeneratingWeek] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [confirmingWeek, setConfirmingWeek] = useState<number | null>(null);

  const [companyOkr, setCompanyOkr]   = useState<CompanyOkr | null>(null);
  const [collabOkr, setCollabOkr]     = useState<CollaboratorOkr | null>(null);
  const [okrForm, setOkrForm]         = useState<{ objective: string; key_results: KeyResult[] }>({ objective: "", key_results: [] });
  const [okrGenerating, setOkrGenerating] = useState(false);
  const [okrSaving, setOkrSaving]     = useState(false);
  const [okrSaved, setOkrSaved]       = useState(false);
  const [okrError, setOkrError]       = useState<string | null>(null);

  const [manual, setManual]                   = useState<CollaboratorManual | null>(null);
  const [creatingManual, setCreatingManual]   = useState(false);
  const [linkCopied, setLinkCopied]           = useState(false);
  const [manualDraft, setManualDraft]         = useState<Record<string, string>>({});
  const [manualSaving, setManualSaving]       = useState(false);
  const [manualSaveError, setManualSaveError] = useState<string | null>(null);
  const [openSections, setOpenSections]       = useState<Record<string, boolean>>({ fonctionnement: true });

  const [ateliers, setAteliers]               = useState<AtelierSession[] | null>(null);
  const [ateliersLoading, setAteliersLoading] = useState(false);

  const [suggestions, setSuggestions]           = useState<CollaboratorSuggestions | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("profile");

  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [inlineFollowUpsOpen, setInlineFollowUpsOpen] = useState(false);
  const [inlineNotes, setInlineNotes] = useState("");
  const [savingInlineNotes, setSavingInlineNotes] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [togglingComplete, setTogglingComplete] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const [collabRes, planRes, sessionsRes, companyOkrRes, collabOkrRes, manualRes, suggestionsRes] = await Promise.all([
      supabase.from("collaborators").select("*").eq("id", collaboratorId).eq("user_id", user.id).single<Collaborator>(),
      supabase.from("managerial_plans").select("*").eq("collaborator_id", collaboratorId).maybeSingle<ManagerialPlan>(),
      supabase.from("weekly_sessions").select("*").eq("collaborator_id", collaboratorId).order("week_number", { ascending: true }),
      fetch("/api/teams/okr/company"),
      fetch(`/api/teams/okr/collaborator?collaborator_id=${collaboratorId}`),
      fetch(`/api/teams/manual/${collaboratorId}`),
      fetch(`/api/teams/suggestions/${collaboratorId}`),
    ]);

    if (collabRes.error || !collabRes.data) { setNotFound(true); setLoading(false); return; }

    setCollaborator(collabRes.data);
    setProfileDraft(collabRes.data);
    const fetchedPlan = planRes.data ?? null;
    setPlan(fetchedPlan);
    setSessions((sessionsRes.data as WeeklySession[]) ?? []);
    if (fetchedPlan) {
      setAxesOpen((fetchedPlan.detected_development_axes ?? []).map(() => false));
      setCareerDraft(fetchedPlan.raw_content.career_path ?? null);
    }

    const companyOkrData: CompanyOkr | null = companyOkrRes.ok ? await companyOkrRes.json() : null;
    setCompanyOkr(companyOkrData);
    const collabOkrData: CollaboratorOkr | null = collabOkrRes.ok ? await collabOkrRes.json() : null;
    if (collabOkrData) {
      setCollabOkr(collabOkrData);
      setOkrForm({ objective: collabOkrData.objective, key_results: collabOkrData.key_results });
    }
    const manualData: CollaboratorManual | null = manualRes.ok ? await manualRes.json() : null;
    setManual(manualData);
    setManualDraft(manualData?.answers ?? {});

    const suggestionsData: CollaboratorSuggestions | null = suggestionsRes.ok ? await suggestionsRes.json() : null;
    setSuggestions(suggestionsData);

    setLoading(false);
    if (isNew && !fetchedPlan) navigateToTab("plan");
  }, [collaboratorId, router, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  async function generateSuggestions() {
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const res = await fetch(`/api/teams/suggestions/${collaboratorId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.common.error);
      setSuggestions(data as CollaboratorSuggestions);
    } catch (e) {
      setSuggestionsError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  useEffect(() => {
    const isAteliersTab = tab === "settings" && settingsSubTab === "ateliers";
    if (!isAteliersTab || ateliers !== null || ateliersLoading) return;
    setAteliersLoading(true);
    fetch(`/api/teams/collaborator-activities/${collaboratorId}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { sessions: [] })
      .then((d: { sessions: AtelierSession[] }) => setAteliers(d.sessions ?? []))
      .finally(() => setAteliersLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, settingsSubTab, ateliers, ateliersLoading, collaboratorId]);

  function navigateToTab(newTab: Tab) {
    setTab(newTab);
    router.replace(`/teams/${collaboratorId}?tab=${newTab}`, { scroll: false });
  }

  async function createManual() {
    setCreatingManual(true);
    try {
      const res = await fetch(`/api/teams/manual/${collaboratorId}`, { method: "POST" });
      if (!res.ok) throw new Error(t.common.error);
      const data: CollaboratorManual = await res.json();
      setManual(data);
      setManualDraft(data.answers ?? {});
    } finally {
      setCreatingManual(false);
    }
  }

  async function saveManualByManager() {
    let currentManual = manual;
    if (!currentManual) {
      setCreatingManual(true);
      try {
        const res = await fetch(`/api/teams/manual/${collaboratorId}`, { method: "POST" });
        if (!res.ok) throw new Error(t.common.error);
        currentManual = await res.json() as CollaboratorManual;
        setManual(currentManual);
      } catch (e) {
        setManualSaveError(e instanceof Error ? e.message : t.common.error);
        setCreatingManual(false);
        return;
      } finally {
        setCreatingManual(false);
      }
    }
    setManualSaving(true);
    setManualSaveError(null);
    try {
      const res = await fetch(`/api/teams/manual/${collaboratorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: manualDraft }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? t.common.error);
      }
      const updated: CollaboratorManual = await res.json();
      setManual(updated);
      setManualDraft(updated.answers ?? {});
    } catch (e) {
      setManualSaveError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setManualSaving(false);
    }
  }

  function manualLink(token: string) {
    return `${window.location.origin}/teams/manual/${token}`;
  }

  async function copyManualLink(token: string) {
    await navigator.clipboard.writeText(manualLink(token));
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  useEffect(() => {
    if (plan?.raw_content.career_path) setCareerDraft(plan.raw_content.career_path);
  }, [plan]);

  useEffect(() => {
    if (expandedWeek !== null) {
      const s = sessions.find((s) => s.week_number === expandedWeek);
      setInlineNotes(s?.manager_notes ?? "");
      setInlineFollowUpsOpen(false);
    }
  }, [expandedWeek, sessions]);

  useEffect(() => {
    if (expandedWeek !== null) setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  }, [expandedWeek]);
  useEffect(() => {
    if (confirmingWeek !== null) setTimeout(() => confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  }, [confirmingWeek]);

  // ── Profile ──────────────────────────────────────────────────────────────

  async function saveProfile() {
    if (!collaborator) return;
    setSavingProfile(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("collaborators")
      .update({
        first_name: profileDraft.first_name ?? collaborator.first_name,
        last_name: profileDraft.last_name ?? collaborator.last_name,
        role: profileDraft.role ?? collaborator.role,
        seniority: profileDraft.seniority ?? collaborator.seniority,
        period: profileDraft.period ?? collaborator.period,
        relationship_started_at: profileDraft.relationship_started_at ?? collaborator.relationship_started_at,
        current_ops_topics: profileDraft.current_ops_topics ?? collaborator.current_ops_topics,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collaboratorId)
      .select("*")
      .single<Collaborator>();
    setSavingProfile(false);
    if (data) { setCollaborator(data); setProfileDraft(data); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000); }
  }

  async function deleteCollaborator() {
    if (!confirm(`${t.common.delete} ${collaborator?.first_name} ${collaborator?.last_name} ?`)) return;
    setDeletingCollaborator(true);
    const supabase = createClient();
    await supabase.from("collaborators").delete().eq("id", collaboratorId);
    router.push("/teams");
  }

  // ── Plan ─────────────────────────────────────────────────────────────────

  async function generatePlan() {
    if (plan && !confirm(`${t.coach.regeneratePlan} ?`)) return;
    setGeneratingPlan(true);
    setPlanStep(0);
    setPlanError(null);

    const post = async (step: number, extra?: Record<string, unknown>) => {
      const res = await fetch("/api/teams/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborator_id: collaboratorId, step, ...extra }),
      });
      let data: Record<string, unknown>;
      try { data = await res.json(); }
      catch { throw new Error(`${t.coach.planStepLabel} ${step} — ${t.common.error}`); }
      if (!res.ok) throw new Error(`${data.error ?? t.common.error}${data.details ? ` — ${data.details}` : ""}`);
      return data;
    };

    try {
      setPlanStep(1);
      const { axes } = await post(1);
      setPlanStep(2);
      const { cadence } = await post(2, { axes });
      setPlanStep(3);
      const { questions } = await post(3, { axes });
      setPlanStep(4);
      const newPlan = await post(4, { axes, cadence, questions }) as unknown as ManagerialPlan;
      setPlan(newPlan);
      setAxesOpen((newPlan.detected_development_axes ?? []).map(() => false));
      setCareerDraft(newPlan.raw_content?.career_path ?? null);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setGeneratingPlan(false);
      setPlanStep(0);
    }
  }

  // ── OKR ──────────────────────────────────────────────────────────────────

  function newOkrKrId() { return `kr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
  function updateOkrKr(id: string, field: keyof KeyResult, value: string) {
    setOkrForm((f) => ({ ...f, key_results: f.key_results.map((kr) => kr.id === id ? { ...kr, [field]: value } : kr) }));
  }
  function removeOkrKr(id: string) {
    setOkrForm((f) => ({ ...f, key_results: f.key_results.filter((kr) => kr.id !== id) }));
  }
  function addOkrKr() {
    setOkrForm((f) => ({ ...f, key_results: [...f.key_results, { id: newOkrKrId(), label: "", target: "", unit: "" }] }));
  }

  async function generateOkr() {
    if (!companyOkr) { setOkrError(t.coach.noCompanyOkrWarning); return; }
    if (collabOkr && !confirm(`${t.coach.regenerateOkrWithAi} ?`)) return;
    setOkrGenerating(true);
    setOkrError(null);
    setOkrSaved(false);
    try {
      const res = await fetch("/api/teams/okr/generate-collaborator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborator_id: collaboratorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.common.error);
      setCollabOkr(data as CollaboratorOkr);
      setOkrForm({ objective: (data as CollaboratorOkr).objective, key_results: (data as CollaboratorOkr).key_results });
    } catch (e) {
      setOkrError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setOkrGenerating(false);
    }
  }

  async function saveOkr() {
    if (!okrForm.objective.trim()) { setOkrError(t.coach.okrObjectiveLabel); return; }
    if (okrForm.key_results.length === 0) { setOkrError(t.coach.addKrBtn); return; }
    const incomplete = okrForm.key_results.find((kr) => !kr.label.trim() || !kr.target.trim());
    if (incomplete) { setOkrError(t.coach.krResultsLabel); return; }
    setOkrSaving(true);
    setOkrError(null);
    setOkrSaved(false);
    try {
      const res = await fetch("/api/teams/okr/collaborator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborator_id: collaboratorId, objective: okrForm.objective, key_results: okrForm.key_results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.common.error);
      setCollabOkr(data as CollaboratorOkr);
      setOkrSaved(true);
      setTimeout(() => setOkrSaved(false), 2500);
    } catch (e) {
      setOkrError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setOkrSaving(false);
    }
  }

  // ── Career path ───────────────────────────────────────────────────────────

  function updateSkillLevel(category: "soft_skills" | "hard_skills", index: number, level: ExpertiseLevel) {
    if (!careerDraft || !plan) return;
    const updated: CareerPath = {
      ...careerDraft,
      [category]: (careerDraft[category] as CareerSkill[]).map((s, i) => i === index ? { ...s, level } : s),
    };
    setCareerDraft(updated);
    if (careerDebounceRef.current) clearTimeout(careerDebounceRef.current);
    careerDebounceRef.current = setTimeout(async () => {
      setSavingCareer(true);
      const supabase = createClient();
      await supabase.from("managerial_plans").update({ raw_content: { ...plan.raw_content, career_path: updated } }).eq("id", plan.id);
      setPlan((prev) => prev ? { ...prev, raw_content: { ...prev.raw_content, career_path: updated } } : prev);
      setSavingCareer(false);
    }, 600);
  }

  // ── Sessions ─────────────────────────────────────────────────────────────

  async function generateWeek(weekNumber: number) {
    if (!plan) { setSessionError(t.coach.noPlanForSessions); return; }
    setGeneratingWeek(weekNumber);
    setConfirmingWeek(null);
    setSessionError(null);
    const res = await fetch("/api/teams/generate-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collaborator_id: collaboratorId, week_number: weekNumber }),
    });
    const data = await res.json();
    setGeneratingWeek(null);
    if (!res.ok) {
      setSessionError(data.error === "premium_required" ? t.coach.premiumRequired : data.error ?? t.common.error);
      return;
    }
    const session = data as WeeklySession;
    setSessions((prev) => {
      const exists = prev.find((s) => s.week_number === weekNumber);
      if (exists) return prev.map((s) => s.week_number === weekNumber ? session : s);
      return [...prev, session].sort((a, b) => a.week_number - b.week_number);
    });
    setExpandedWeek(weekNumber);
  }

  function handleWeekClick(weekNumber: number) {
    const locked = weekNumber > COACH_CONFIG.freeWeeksLimit && !collaborator?.is_premium;
    if (locked) { setSessionError(t.coach.premiumRequired); return; }
    const existing = sessions.find((s) => s.week_number === weekNumber);
    if (existing) {
      setConfirmingWeek(null);
      setExpandedWeek((prev) => prev === weekNumber ? null : weekNumber);
    } else {
      setExpandedWeek(null);
      setConfirmingWeek((prev) => prev === weekNumber ? null : weekNumber);
    }
  }

  function handleInlineNotesChange(value: string) {
    setInlineNotes(value);
    setSessions((prev) => prev.map((s) => s.week_number === expandedWeek ? { ...s, manager_notes: value } : s));
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(async () => {
      const session = sessions.find((s) => s.week_number === expandedWeek);
      if (!session) return;
      setSavingInlineNotes(true);
      const supabase = createClient();
      await supabase.from("weekly_sessions").update({ manager_notes: value, updated_at: new Date().toISOString() }).eq("id", session.id);
      setSavingInlineNotes(false);
    }, 500);
  }

  async function toggleComplete(weekNumber: number) {
    const session = sessions.find((s) => s.week_number === weekNumber);
    if (!session) return;
    setTogglingComplete(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("weekly_sessions")
      .update({ is_completed: !session.is_completed, updated_at: new Date().toISOString() })
      .eq("id", session.id).select("*").single<WeeklySession>();
    setTogglingComplete(false);
    if (data) setSessions((prev) => prev.map((s) => s.week_number === weekNumber ? data : s));
  }

  async function regenerateSession(weekNumber: number) {
    if (!confirm(`${t.coach.regenerateBtn} ?`)) return;
    setRegenerating(true);
    const res = await fetch("/api/teams/generate-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collaborator_id: collaboratorId, week_number: weekNumber }),
    });
    const data = await res.json();
    setRegenerating(false);
    if (!res.ok) { setSessionError(data.error ?? t.common.error); return; }
    const session = data as WeeklySession;
    setSessions((prev) => prev.map((s) => s.week_number === weekNumber ? session : s));
    setInlineNotes(session.manager_notes ?? "");
  }

  async function saveSessionDate(weekNumber: number, dateValue: string) {
    const session = sessions.find((s) => s.week_number === weekNumber);
    if (!session) return;
    setSavingDate(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("weekly_sessions")
      .update({ scheduled_date: dateValue || null, updated_at: new Date().toISOString() })
      .eq("id", session.id).select("*").single<WeeklySession>();
    setSavingDate(false);
    if (data) setSessions((prev) => prev.map((s) => s.week_number === weekNumber ? data : s));
  }

  function suggestDate(weekNumber: number): string {
    if (!collaborator?.relationship_started_at) return "";
    const cadence = plan?.proposed_cadence ?? "";
    const cadenceLower = cadence.toLowerCase();
    let intervalDays = 14;
    if (cadenceLower.includes("hebdo") || cadenceLower.includes("semaine")) intervalDays = 7;
    else if (cadenceLower.includes("mensuel") || cadenceLower.includes("mois")) intervalDays = 30;
    const start = new Date(collaborator.relationship_started_at);
    start.setDate(start.getDate() + (weekNumber - 1) * intervalDays);
    return start.toISOString().slice(0, 10);
  }

  function formatSessionDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  // ── Loading / not found ───────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/teams" currentTool="Mon équipe" />
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> {t.common.loading}
      </div>
    </div>
  );

  if (notFound || !collaborator) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/teams" currentTool="Mon équipe" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">{t.coach.collaboratorNotFound} <Link href="/teams" className="underline">{t.common.back}</Link></p>
      </div>
    </div>
  );

  const expandedSession = expandedWeek !== null ? sessions.find((s) => s.week_number === expandedWeek) ?? null : null;

  const allSkills: CareerSkill[] = [
    ...(careerDraft?.soft_skills ?? []),
    ...(careerDraft?.hard_skills ?? []),
  ];
  const skillsAtTarget = allSkills.filter((s) => {
    const ci = LEVELS.indexOf(s.level as ExpertiseLevel);
    const ti = LEVELS.indexOf(s.target as ExpertiseLevel);
    return ci >= ti;
  }).length;

  const TABS: { id: Tab; label: string; badge?: string; count?: number }[] = [
    { id: "overview",  label: t.coach.tabOverview },
    { id: "plan",      label: t.coach.tabPlan, badge: plan ? "Actif" : undefined },
    { id: "sessions",  label: t.coach.tabSessions, count: sessions.length > 0 ? sessions.length : undefined },
    { id: "career",    label: t.coach.tabCareer, badge: allSkills.length > 0 ? `${skillsAtTarget}/${allSkills.length}` : undefined },
    { id: "okr",       label: t.coach.tabOkr },
    { id: "settings",  label: t.coach.tabSettings },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  const tenureMonths = collaborator.relationship_started_at
    ? Math.floor((Date.now() - new Date(collaborator.relationship_started_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  const okrAvg = collabOkr?.key_results.length
    ? Math.round(collabOkr.key_results.reduce((sum, kr) => sum + (parseFloat(kr.current ?? "0") || 0), 0) / collabOkr.key_results.length)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/teams" currentTool="Mon équipe" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-5 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold">{initials(collaborator)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {collaborator.first_name} {collaborator.last_name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {collaborator.role} · {t.coach.seniorityLabels[collaborator.seniority]}
                </span>
                {collaborator.period && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {t.coach.periodLabels[collaborator.period]}
                  </span>
                )}
              </div>
            </div>
            {tenureMonths !== null && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                <CalendarDays size={13} />
                {tenureMonths} mois
              </div>
            )}
          </div>

          {/* 4 stat blocks */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Sparkles size={11} /> Plan
              </div>
              <div className={`text-sm font-semibold ${plan ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                {plan ? "Actif" : "—"}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <MessageSquare size={11} /> Sessions
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {sessions.length > 0 ? (
                  <>{sessions.length} <span className="font-normal text-gray-400 dark:text-gray-500">/ 8</span></>
                ) : "—"}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <TrendingUp size={11} /> Compétences
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {allSkills.length > 0 ? (
                  <>{skillsAtTarget} <span className="font-normal text-gray-400 dark:text-gray-500">/ {allSkills.length}</span></>
                ) : "—"}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Target size={11} /> OKR
              </div>
              <div className={`text-sm font-semibold ${okrAvg !== null ? (okrAvg >= 70 ? "text-green-600 dark:text-green-400" : okrAvg >= 40 ? "text-amber-500 dark:text-amber-400" : "text-red-500 dark:text-red-400") : "text-gray-400 dark:text-gray-500"}`}>
                {okrAvg !== null ? `${okrAvg}%` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex gap-0 mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {TABS.map(({ id, label, badge, count }) => (
            <button key={id} onClick={() => navigateToTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === id
                  ? "border-blue-600 text-blue-700 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              {label}
              {badge && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  badge === "Actif"
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}>
                  {badge}
                </span>
              )}
              {count !== undefined && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Vue d'ensemble ──────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-4">

            {/* Generate / refresh button */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t.coach.suggestionsTitle}</p>
                {suggestions && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {t.coach.suggestionsGeneratedOn} {new Date(suggestions.generated_at).toLocaleDateString(undefined, { day: "2-digit", month: "long" })}
                  </p>
                )}
              </div>
              <button
                onClick={generateSuggestions}
                disabled={suggestionsLoading || !plan}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {suggestionsLoading ? <Loader2 size={13} className="animate-spin" /> : suggestions ? <RefreshCw size={13} /> : <Sparkles size={13} />}
                {suggestionsLoading ? t.coach.suggestionsGenerating : suggestions ? t.coach.suggestionsRefresh : t.coach.suggestionsGenerate}
              </button>
            </div>

            {suggestionsError && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                <AlertTriangle size={14} className="flex-shrink-0" /> {suggestionsError}
              </div>
            )}

            {!plan && !suggestionsLoading && (
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle size={14} className="flex-shrink-0" />
                {t.coach.suggestionsNoPlan}{" "}
                <button onClick={() => navigateToTab("plan")} className="underline font-medium">{t.coach.tabPlan}</button>
              </div>
            )}

            {suggestionsLoading && (
              <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <Loader2 size={20} className="animate-spin mr-2" /> {t.coach.suggestionsGenerating}
              </div>
            )}

            {!suggestionsLoading && suggestions && (
              <>
                {/* Session suggestion */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={15} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.coach.suggestionSessionTitle}</span>
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <Sparkles size={10} /> IA
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                    {suggestions.session_suggestion}
                  </p>
                  <button onClick={() => navigateToTab("sessions")}
                    className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Voir les sessions <TrendingUp size={11} />
                  </button>
                </div>

                {/* Career suggestion */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={15} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.coach.suggestionCareerTitle}</span>
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <Sparkles size={10} /> IA
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                    {suggestions.career_suggestion}
                  </p>
                  <button onClick={() => navigateToTab("career")}
                    className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Voir la feuille de route <TrendingUp size={11} />
                  </button>
                </div>

                {/* OKR suggestion */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={15} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.coach.suggestionOkrTitle}</span>
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <Sparkles size={10} /> IA
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                    {suggestions.okr_suggestion}
                  </p>
                  <button onClick={() => navigateToTab("okr")}
                    className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Voir les OKR <Target size={11} />
                  </button>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{t.coach.suggestionsHint}</p>
              </>
            )}

            {!suggestionsLoading && !suggestions && plan && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  {t.coach.suggestionsHint}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Paramètres : navigation interne ────────────────────── */}
        {tab === "settings" && (
          <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
            {([
              { id: "profile"  as SettingsSubTab, label: t.coach.tabSettingsProfile },
              { id: "manual"   as SettingsSubTab, label: t.coach.tabSettingsManual },
              { id: "ateliers" as SettingsSubTab, label: t.coach.tabSettingsAteliers },
            ]).map(({ id, label }) => (
              <button key={id} onClick={() => setSettingsSubTab(id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  settingsSubTab === id
                    ? "border-blue-600 text-blue-700 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ─── Profil ──────────────────────────────────────────────── */}
        {tab === "settings" && settingsSubTab === "profile" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.coach.firstName}</label>
                <div className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                  {collaborator.first_name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.coach.lastName}</label>
                <div className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                  {collaborator.last_name}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.coach.role}</label>
              <div className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                {collaborator.role}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.coach.seniority}</label>
              <div className="flex gap-2">
                {SENIORITY_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setProfileDraft((d) => ({ ...d, seniority: s }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${
                      (profileDraft.seniority ?? collaborator.seniority) === s
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                    }`}>
                    {t.coach.seniorityLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.coach.period}</label>
              <div className="flex gap-2">
                {PERIOD_OPTIONS.map((p) => (
                  <button key={p} onClick={() => setProfileDraft((d) => ({ ...d, period: p }))}
                    className={`flex-1 py-2 px-1 text-xs font-medium rounded-xl border transition-colors ${
                      (profileDraft.period ?? collaborator.period) === p
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                    }`}>
                    {t.coach.periodLabels[p]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                {t.coach.periodDescs[(profileDraft.period ?? collaborator.period) as CollaboratorPeriod]}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.coach.startDate}</label>
              <input type="date" value={profileDraft.relationship_started_at ?? ""} onChange={(e) => setProfileDraft((d) => ({ ...d, relationship_started_at: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.coach.topics}
              </label>
              <textarea value={profileDraft.current_ops_topics ?? ""} onChange={(e) => setProfileDraft((d) => ({ ...d, current_ops_topics: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={saveProfile} disabled={savingProfile}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                {savingProfile ? <Loader2 size={14} className="animate-spin" /> : profileSaved ? <Check size={14} /> : null}
                {savingProfile ? t.coach.saving : profileSaved ? t.coach.profileSaved : t.coach.saveProfile}
              </button>
              <button onClick={deleteCollaborator} disabled={deletingCollaborator}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50">
                {deletingCollaborator ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t.common.delete}
              </button>
            </div>
          </div>
        )}

        {/* ─── Plan managérial ─────────────────────────────────────── */}
        {tab === "plan" && (
          <div>
            {planError && (
              <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                {planError}
              </div>
            )}

            {!plan ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-5">
                  <Sparkles size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {isNew ? t.coach.readyToStart : t.coach.noPlan}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                  {t.coach.planAiDescPrefix} {collaborator.first_name} {t.coach.planAiDescSuffix}
                </p>
                {generatingPlan ? (
                  <PlanProgressGauge step={planStep} firstName={collaborator.first_name} />
                ) : (
                  <button onClick={generatePlan}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
                    <Sparkles size={15} /> {t.coach.generatePlanBtn}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                    {t.coach.proposedCadence}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{plan.proposed_cadence}</p>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    {t.coach.mutualExpectations}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{plan.mutual_expectations}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        {t.coach.youToPrefix} {collaborator.first_name}
                      </p>
                      <ul className="space-y-1.5">
                        {(plan.raw_content.expectations_manager_to_collaborator ?? []).map((e, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />{e}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        {collaborator.first_name} {t.coach.collabToYouSuffix}
                      </p>
                      <ul className="space-y-1.5">
                        {(plan.raw_content.expectations_collaborator_to_manager ?? []).map((e, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />{e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    {t.coach.developmentAxes}
                  </h3>
                  <div className="space-y-2">
                    {(plan.detected_development_axes ?? []).map((axis, i) => (
                      <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <button onClick={() => setAxesOpen((prev) => { const next = [...prev]; next[i] = !next[i]; return next; })}
                          className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${axisCls(axis.axis)}`}>
                              {axis.axis}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{axis.why}</span>
                          </div>
                          <span className="flex-shrink-0 mt-0.5">
                            {axesOpen[i] ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                          </span>
                        </button>
                        {axesOpen[i] && (
                          <div className="px-5 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                            {(axis.sample_questions ?? []).map((q, j) => (
                              <div key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <MessageSquare size={13} className="mt-0.5 flex-shrink-0 text-gray-300 dark:text-gray-600" />{q}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {(plan.raw_content.risks_to_watch ?? []).length > 0 && (
                  <div className="border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
                    <button onClick={() => setRisksOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle size={13} /> {t.coach.risksToWatch}
                      </span>
                      {risksOpen ? <ChevronUp size={13} className="text-amber-600" /> : <ChevronDown size={13} className="text-amber-600" />}
                    </button>
                    {risksOpen && (
                      <ul className="px-5 py-4 space-y-2 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-100 dark:border-amber-900">
                        {(plan.raw_content.risks_to_watch ?? []).map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />{r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  {generatingPlan ? (
                    <PlanProgressGauge step={planStep} firstName={collaborator.first_name} />
                  ) : (
                    <button onClick={generatePlan}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <RefreshCw size={13} /> {t.coach.regeneratePlan}
                    </button>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {t.coach.generatedOn} {new Date(plan.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Career ──────────────────────────────────────────────── */}
        {tab === "career" && (
          <div>
            {!plan || !careerDraft ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-5">
                  <TrendingUp size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.coach.noCareerPath}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                  {t.coach.noCareerPathDescPrefix} {collaborator.first_name}.
                </p>
                <button onClick={() => navigateToTab("plan")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
                  {t.coach.goToPlanBtn}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-500" />
                      Career path — {collaborator.first_name}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.coach.careerObjectiveHint}</p>
                  </div>
                  {savingCareer && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" /> {t.coach.saving}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t.coach.globalProgress}</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {skillsAtTarget}/{allSkills.length} {t.coach.skillsAtTargetSuffix}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${allSkills.length > 0 ? Math.round((skillsAtTarget / allSkills.length) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-violet-500 inline-block" /> {t.coach.currentLevelLabel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-amber-400 inline-block" /> {t.coach.okrKrTargetLabel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-700 inline-block" /> {t.coach.notReachedLabel}
                  </span>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Soft skills</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({careerDraft.soft_skills.filter((s) => LEVELS.indexOf(s.level as ExpertiseLevel) >= LEVELS.indexOf(s.target as ExpertiseLevel)).length}/{careerDraft.soft_skills.length} {t.coach.skillsAtTargetSuffix})
                    </span>
                  </div>
                  <div className="px-5">
                    {careerDraft.soft_skills.map((skill, i) => (
                      <SkillRow key={i} skill={skill as CareerSkill} onUpdate={(level) => updateSkillLevel("soft_skills", i, level)} />
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Hard skills</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({careerDraft.hard_skills.filter((s) => LEVELS.indexOf(s.level as ExpertiseLevel) >= LEVELS.indexOf(s.target as ExpertiseLevel)).length}/{careerDraft.hard_skills.length} {t.coach.skillsAtTargetSuffix})
                    </span>
                  </div>
                  <div className="px-5">
                    {careerDraft.hard_skills.map((skill, i) => (
                      <SkillRow key={i} skill={skill as CareerSkill} onUpdate={(level) => updateSkillLevel("hard_skills", i, level)} />
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  {generatingPlan ? (
                    <PlanProgressGauge step={planStep} firstName={collaborator.first_name} />
                  ) : (
                    <button onClick={generatePlan}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <RefreshCw size={13} /> {t.coach.regeneratePlanWithCareer}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── OKR individuel ──────────────────────────────────────── */}
        {tab === "okr" && (
          <div className="space-y-4">

            {companyOkr ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {t.coach.companyOkrSectionLabel} — {companyOkr.period}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-snug">{companyOkr.objective}</p>
                <div className="space-y-1">
                  {companyOkr.key_results.map((kr, i) => (
                    <div key={kr.id} className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <span className="w-7 font-medium">KR{i + 1}</span>
                      <span className="flex-1">{kr.label}</span>
                      <span className="font-semibold">→ {kr.target} {kr.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle size={14} />
                {t.coach.noCompanyOkrWarning}{" "}
                <Link href="/teams/okr" className="underline font-medium">{t.coach.defineCompanyOkrLink}</Link>
              </div>
            )}

            {collabOkr?.alignment_rationale && (
              <div className="px-4 py-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">{t.coach.alignmentLabel}</p>
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">{collabOkr.alignment_rationale}</p>
              </div>
            )}

            {okrForm.key_results.length > 0 && (() => {
              const allPcts = okrForm.key_results.map((kr) => Math.round(parseFloat(kr.current ?? "0") || 0));
              const avg = Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length);
              const { bar, text } = progressColor(avg);
              return (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t.coach.globalAdvancement}</span>
                    <span className={`text-base font-bold tabular-nums ${text}`}>{avg}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${avg}%` }} />
                  </div>
                </div>
              );
            })()}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target size={15} className="text-violet-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.coach.individualOkrTitle}</h3>
                {collabOkr && (
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                    {t.coach.okrUpdatedOn} {new Date(collabOkr.updated_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.coach.okrObjectiveLabel} <span className="text-gray-400 font-normal">{t.coach.okrObjectiveHint}</span>
                </label>
                <textarea value={okrForm.objective} onChange={(e) => setOkrForm((f) => ({ ...f, objective: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{t.coach.krResultsLabel}</label>
                <div className="space-y-2 mb-2.5">
                  {okrForm.key_results.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 py-1.5 text-center">{t.coach.noKrYet}</p>
                  )}
                  {okrForm.key_results.map((kr, i) => {
                    const pct = Math.round(parseFloat(kr.current ?? "0") || 0);
                    const { bar, text, thumb } = progressColor(pct);
                    return (
                      <div key={kr.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="mt-2.5 text-xs font-medium text-gray-400 w-5 flex-shrink-0">KR{i + 1}</span>
                          <input value={kr.label} onChange={(e) => updateOkrKr(kr.id, "label", e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                          <input value={kr.target} onChange={(e) => updateOkrKr(kr.id, "target", e.target.value)} placeholder="cible"
                            className="w-16 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                          <input value={kr.unit} onChange={(e) => updateOkrKr(kr.id, "unit", e.target.value)} placeholder="unit"
                            className="w-16 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                          <button onClick={() => removeOkrKr(kr.id)} className="mt-1.5 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="ml-7 flex items-center gap-3">
                          <div className="flex-1 relative h-5 flex items-center">
                            <div className="absolute w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 pointer-events-none overflow-hidden">
                              <div className={`h-full rounded-full transition-none ${bar}`} style={{ width: `${pct}%` }} />
                            </div>
                            <div className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 shadow-sm pointer-events-none transition-none"
                              style={{ left: `calc(${pct}% - 7px)`, borderColor: thumb }} />
                            <input type="range" min={0} max={100} step={5} value={pct}
                              onChange={(e) => updateOkrKr(kr.id, "current", e.target.value)}
                              className="absolute w-full opacity-0 cursor-pointer h-full" />
                          </div>
                          <span className={`text-xs font-semibold tabular-nums w-8 text-right ${text}`}>
                            {pct > 0 ? `${pct}%` : "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={addOkrKr}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  <Plus size={12} /> {t.coach.addKrBtn}
                </button>
              </div>

              {okrError && (
                <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {okrError}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={saveOkr} disabled={okrSaving || okrGenerating}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {okrSaving ? <Loader2 size={14} className="animate-spin" /> : okrSaved ? <Check size={14} /> : null}
                  {okrSaving ? t.coach.savingOkrStatus : okrSaved ? t.coach.savedOkrStatus : t.coach.saveOkrBtn}
                </button>
                {companyOkr && (
                  <button onClick={generateOkr} disabled={okrGenerating || okrSaving}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-50 transition-colors">
                    {okrGenerating ? <Loader2 size={14} className="animate-spin" /> : collabOkr ? <RefreshCw size={14} /> : <Sparkles size={14} />}
                    {okrGenerating ? t.coach.generatingOkr : collabOkr ? t.coach.regenerateOkrWithAi : t.coach.generateOkrWithAi}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Manuel ──────────────────────────────────────────────── */}
        {tab === "settings" && settingsSubTab === "manual" && (
          <div className="space-y-4">

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Link2 size={14} className="text-blue-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  {t.coach.manualShareWithPrefix} {collaborator.first_name}
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3 leading-relaxed">
                {collaborator.first_name} {t.coach.manualShareDescSuffix}
              </p>
              {!manual ? (
                <button onClick={createManual} disabled={creatingManual}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors">
                  {creatingManual ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                  {creatingManual ? t.coach.generatingLinkBtn : t.coach.generateLinkBtn}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono truncate text-blue-700 dark:text-blue-300 bg-white/60 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 px-3 py-2 rounded-xl">
                    {typeof window !== "undefined" ? manualLink(manual.token) : "…"}
                  </code>
                  <button onClick={() => copyManualLink(manual.token)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                    {linkCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {linkCopied ? t.common.copied : t.common.copy}
                  </button>
                </div>
              )}
              {manual?.completed_at && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-medium">
                  <Check size={11} />
                  {t.coach.manualFilledPrefix} {collaborator.first_name} {t.coach.manualFilledMiddle}{" "}
                  {new Date(manual.completed_at).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {MANUAL_SECTIONS.map((section) => {
                const isOpen = openSections[section.id] ?? false;
                const filledCount = section.questions.filter((q) => (manualDraft[q.id] ?? "").trim()).length;
                return (
                  <div key={section.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                    <button type="button"
                      onClick={() => setOpenSections((prev) => ({ ...prev, [section.id]: !isOpen }))}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl leading-none">{section.emoji}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</span>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        {filledCount > 0 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">{filledCount}/{section.questions.length}</span>
                        )}
                        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                        {section.questions.map((q) => (
                          <div key={q.id}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 leading-snug">{q.label}</label>
                            <textarea value={manualDraft[q.id] ?? ""}
                              onChange={(e) => setManualDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder={q.placeholder || t.coach.manualAnswerPlaceholder}
                              rows={2}
                              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {manualSaveError && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                {manualSaveError}
              </div>
            )}
            <button onClick={saveManualByManager} disabled={manualSaving || creatingManual}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-2xl hover:opacity-90 disabled:opacity-40 transition-opacity">
              {manualSaving || creatingManual ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {manualSaving ? t.coach.saving : creatingManual ? t.coach.initializingBtn : t.coach.saveManualBtn}
            </button>
          </div>
        )}

        {/* ─── Sessions ────────────────────────────────────────────── */}
        {tab === "sessions" && (
          <div className="space-y-5">
            {!plan && (
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle size={15} /> {t.coach.noPlanForSessions}
              </div>
            )}
            {sessionError && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                {sessionError}
              </div>
            )}

            {/* Timeline grid */}
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
                const session    = sessions.find((s) => s.week_number === week);
                const locked     = week > COACH_CONFIG.freeWeeksLimit && !collaborator.is_premium;
                const isGenerating = generatingWeek === week;
                const isExpanded = expandedWeek === week;
                const isConfirming = confirmingWeek === week;

                return (
                  <button key={week}
                    onClick={() => !locked && !isGenerating && handleWeekClick(week)}
                    disabled={locked || isGenerating || !plan}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 aspect-square transition-all ${
                      isExpanded
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-200 dark:ring-blue-800"
                        : isConfirming
                        ? "border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-200 dark:ring-violet-800"
                        : locked || !plan
                        ? "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-50 cursor-not-allowed"
                        : session
                        ? session.is_completed
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 hover:border-green-400"
                          : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:border-blue-300"
                        : "border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}>
                    {isGenerating ? (
                      <Loader2 size={18} className="animate-spin text-blue-500" />
                    ) : locked ? (
                      <><Lock size={14} className="text-gray-400 mb-1" /><span className="text-xs font-medium text-gray-400">{week}</span></>
                    ) : (
                      <>
                        <span className={`text-lg font-bold leading-none ${
                          isExpanded || isConfirming ? "text-blue-600 dark:text-blue-400"
                          : session?.is_completed ? "text-green-600 dark:text-green-400"
                          : session ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 dark:text-gray-500"
                        }`}>{week}</span>
                        {session?.scheduled_date && !isExpanded && (
                          <span className="text-[9px] leading-none text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                            {formatSessionDate(session.scheduled_date)}
                          </span>
                        )}
                        {session?.is_completed && !isExpanded && !session.scheduled_date && <Check size={12} className="text-green-500 mt-0.5" />}
                        {session && !session.is_completed && !isExpanded && !isConfirming && !session.scheduled_date && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5" />}
                      </>
                    )}
                    {week > COACH_CONFIG.freeWeeksLimit && !locked && (
                      <Crown size={9} className="absolute top-1.5 right-1.5 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-dashed border-gray-300 dark:border-gray-600" /> {t.coach.weekNotGenerated}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30" /> {t.common.inProgress}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30" /> {t.coach.weekCompleted}</span>
              <span className="flex items-center gap-1.5"><Lock size={10} /> {t.coach.premiumRequired}</span>
            </div>

            {/* Generation confirmation */}
            {confirmingWeek !== null && !sessions.find((s) => s.week_number === confirmingWeek) && (
              <div ref={confirmRef} className="bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t.coach.generateSessionPrefix} {t.coach.weekLabel} {confirmingWeek}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {t.coach.generateSessionAiDescPrefix} {collaborator.first_name}
                      {t.coach.generateSessionAiDescMiddle}
                      {sessions.length > 0 ? ` ${t.coach.generateSessionAiDescWithPrev}` : "."}
                    </p>
                  </div>
                  <button onClick={() => setConfirmingWeek(null)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => generateWeek(confirmingWeek)} disabled={generatingWeek !== null}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {generatingWeek === confirmingWeek ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {generatingWeek === confirmingWeek ? t.coach.generatingSessionBtn : t.coach.generateSessionBtn}
                  </button>
                  <button onClick={() => setConfirmingWeek(null)}
                    className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            )}

            {/* Inline session card */}
            {expandedSession && (
              <div ref={cardRef} className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${axisCls(expandedSession.development_axis)}`}>
                      <Sparkles size={11} /> {expandedSession.development_axis}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t.coach.weekLabel} {expandedSession.week_number}
                    </span>
                    {expandedSession.is_completed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <Check size={10} /> {t.coach.weekCompleted}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setExpandedWeek(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X size={15} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5">

                  {/* Date du 1:1 */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      Date du 1:1
                    </label>
                    <input
                      type="date"
                      defaultValue={expandedSession.scheduled_date ?? suggestDate(expandedSession.week_number)}
                      onBlur={(e) => saveSessionDate(expandedSession.week_number, e.target.value)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {savingDate && <Loader2 size={13} className="animate-spin text-gray-400" />}
                    {!expandedSession.scheduled_date && (
                      <span className="text-xs text-gray-400 italic">suggestion auto</span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                      {t.coach.priorityTopics}
                    </h3>
                    <div className="space-y-3">
                      {[
                        { topic: expandedSession.priority_topic_1, rationale: expandedSession.raw_content.priority_topic_1_rationale },
                        { topic: expandedSession.priority_topic_2, rationale: expandedSession.raw_content.priority_topic_2_rationale },
                      ].map(({ topic, rationale }, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white dark:text-gray-900 text-xs font-bold">{i + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{topic}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{rationale}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                      {t.coach.exploration}
                    </h3>
                    <p className="font-serif text-sm leading-relaxed text-gray-800 dark:text-gray-200">{expandedSession.exploration_topic}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{expandedSession.raw_content.exploration_rationale}</p>
                  </div>

                  <div className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/40 dark:to-blue-950/40 border border-violet-100 dark:border-violet-900 rounded-xl p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-2">
                      {t.coach.unexpectedQuestion}
                    </h3>
                    <p className="font-serif text-sm leading-relaxed text-gray-900 dark:text-white">{expandedSession.unexpected_question}</p>
                  </div>

                  <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                    <button onClick={() => setInlineFollowUpsOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {t.coach.followUps}
                      {inlineFollowUpsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {inlineFollowUpsOpen && (
                      <ul className="px-4 pb-4 pt-1 space-y-2 border-t border-gray-100 dark:border-gray-800">
                        {expandedSession.raw_content.suggested_follow_ups.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {t.coach.myNotesLabel}
                      </label>
                      {savingInlineNotes && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Loader2 size={11} className="animate-spin" /> {t.coach.saving}
                        </span>
                      )}
                    </div>
                    <textarea value={inlineNotes} onChange={(e) => handleInlineNotesChange(e.target.value)}
                      placeholder={t.coach.notesPlaceholder} rows={4}
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button onClick={() => toggleComplete(expandedSession.week_number)} disabled={togglingComplete}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-50 ${
                        expandedSession.is_completed
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90"
                      }`}>
                      {togglingComplete ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      {expandedSession.is_completed ? t.coach.sessionCompletedCheck : t.coach.markAsDoneBtn}
                    </button>
                    <button onClick={() => regenerateSession(expandedSession.week_number)} disabled={regenerating}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors">
                      {regenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                      {t.coach.regenerateBtn}
                    </button>
                    <button onClick={() => exportMarkdown(expandedSession, collaborator)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Download size={13} /> {t.coach.exportMdBtn}
                    </button>
                    <button onClick={() => setExpandedWeek(null)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <X size={13} /> {t.common.close}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Premium block */}
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                  <Crown size={14} /> {t.coach.premiumModeLabel}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t.coach.premiumUnlockDesc}</p>
              </div>
              <Link href="/premium"
                className="px-3 py-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors">
                {t.coach.becomePremiumBtn}
              </Link>
            </div>
          </div>
        )}

        {/* ─── Ateliers (dans Paramètres) ──────────────────────────── */}
        {tab === "settings" && settingsSubTab === "ateliers" && (
          <div className="space-y-5">
            {ateliersLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
              </div>
            ) : !ateliers || ateliers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center mx-auto mb-5">
                  <CalendarDays size={28} className="text-violet-500 dark:text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Aucun atelier enregistré
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Lorsque {collaborator.first_name} participera à une session et que vous l&apos;associerez à ce profil, l&apos;historique des ateliers apparaîtra ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ateliers.length} session{ateliers.length > 1 ? "s" : ""} • participait sous le pseudo{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {[...new Set(ateliers.map((s) => s.participantPseudo))].join(", ")}
                  </span>
                </p>
                {ateliers.map((session) => (
                  <div key={session.sessionId} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {session.sessionName ?? `Session ${session.sessionCode}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <CalendarDays size={11} />
                          {new Date(session.sessionDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          <span className="mx-1">·</span>
                          pseudo : <span className="font-medium text-gray-600 dark:text-gray-400">{session.participantPseudo}</span>
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-gray-400 font-mono">{session.sessionCode}</span>
                    </div>
                    {session.activities.length === 0 ? (
                      <p className="px-5 py-3 text-xs text-gray-400 italic">Aucune activité terminée.</p>
                    ) : (
                      <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
                        {session.activities.map((activity, i) => (
                          <li key={i} className="px-5 py-3 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{activity.gameLabel}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(activity.startedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                            {activity.result?.type === "mood" && (
                              <div className="flex-shrink-0 text-right">
                                {activity.result.moodLabel ? (
                                  <div className="flex items-center gap-1.5">
                                    <Smile size={14} className="text-violet-400" />
                                    <div>
                                      <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">{activity.result.moodLabel}</p>
                                      {activity.result.moodSublabel && <p className="text-[10px] text-gray-400">{activity.result.moodSublabel}</p>}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">pas de vote</span>
                                )}
                              </div>
                            )}
                            {activity.result?.type === "roti" && (
                              <div className="flex-shrink-0 flex items-center gap-1">
                                {activity.result.vote !== null ? (
                                  Array.from({ length: 5 }, (_, j) => (
                                    <Star key={j} size={13}
                                      className={j < (activity.result as { type: "roti"; vote: number | null }).vote! ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-gray-700"} />
                                  ))
                                ) : <span className="text-xs text-gray-400 italic">pas de vote</span>}
                              </div>
                            )}
                            {activity.result?.type === "participated" && <span className="flex-shrink-0 text-xs text-gray-400">a participé</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CollaboratorPage() {
  return (
    <Suspense>
      <CollaboratorPageContent />
    </Suspense>
  );
}
