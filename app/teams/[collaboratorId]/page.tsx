"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Check, Lock, Trash2, AlertTriangle,
  RefreshCw, Sparkles, Crown, MessageSquare, ChevronDown, ChevronUp, ChevronRight,
  TrendingUp, X, Download, Target, Plus, Building2, BookUser, Copy, Link2,
  CalendarDays, Smile, Star, Camera, UserRound, BookOpen, LayoutGrid, Pencil,
  Rocket, BarChart3, Handshake,
} from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import type {
  Collaborator, CoachSeniority, CollaboratorPeriod,
  ManagerialPlan, WeeklySession, ExpertiseLevel, CareerSkill, CareerPath,
  CompanyOkr, CollaboratorOkr, KeyResult, CollaboratorManual, CollaboratorSuggestions,
  CareerSelfAssessment, CareerSelfLevels,
  CollabInterview, OnboardingMilestone, OnboardingMilestoneType, OnboardingChecklist, ChecklistAxis,
  MidYearInterview, MidYearPast, MidYearPresent, MidYearFuture, MidYearObjectif, ObjectifRating, FeelingPoste, Score5,
  MonthlyReviewInterview, MonthlyReviewData,
} from "@/lib/types";
import { MANUAL_SECTIONS } from "@/lib/manual-questions";
import { COACH_CONFIG, LEVELS } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

type Tab = "overview" | "plan" | "career" | "entretiens" | "okr" | "settings";
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

const SELF_DOT_FILL = ["bg-green-400", "bg-green-400", "bg-green-500", "bg-emerald-500"];

function SkillRow({
  skill,
  selfLevel,
  onUpdate,
  onFieldUpdate,
  onDelete,
  defaultEditing = false,
}: {
  skill: CareerSkill;
  selfLevel?: ExpertiseLevel;
  onUpdate: (level: ExpertiseLevel) => void;
  onFieldUpdate: (field: keyof CareerSkill, value: string) => void;
  onDelete: () => void;
  defaultEditing?: boolean;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(defaultEditing);
  const currentIdx = LEVELS.indexOf(skill.level as ExpertiseLevel);
  const targetIdx  = LEVELS.indexOf(skill.target as ExpertiseLevel);
  const selfIdx    = selfLevel ? LEVELS.indexOf(selfLevel) : -1;
  const gap = targetIdx - currentIdx;

  if (editing) {
    return (
      <div className="py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0 space-y-3">
        {/* Nom */}
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={skill.skill}
            onChange={(e) => onFieldUpdate("skill", e.target.value)}
            placeholder="Nom de la compétence"
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={onDelete}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0">
            <Trash2 size={14} />
          </button>
        </div>

        {/* Niveau actuel (manager) */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Niveau actuel</span>
          <div className="flex items-center gap-1.5">
            {LEVELS.map((level, i) => (
              <button key={level} onClick={() => onUpdate(level)} title={level}
                className={[
                  "w-4 h-4 rounded-full transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
                  i <= currentIdx ? (DOT_FILL[currentIdx] ?? "bg-gray-400") : "bg-gray-100 dark:bg-gray-800",
                ].join(" ")}
              />
            ))}
          </div>
          <span className={`text-xs font-medium ${LEVEL_TEXT_COLOR[currentIdx] ?? "text-gray-500"}`}>{skill.level}</span>
        </div>

        {/* Niveau cible */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Objectif</span>
          <div className="flex items-center gap-1.5">
            {LEVELS.map((level, i) => (
              <button key={level} onClick={() => onFieldUpdate("target", level)} title={level}
                className={[
                  "w-4 h-4 rounded-full transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-400",
                  i <= targetIdx ? "bg-amber-400" : "bg-gray-100 dark:bg-gray-800",
                ].join(" ")}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{skill.target}</span>
        </div>

        {/* Attente concrète */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Attente concrète <span className="font-normal text-gray-400">(optionnel)</span></label>
          <textarea
            value={skill.expectation ?? ""}
            onChange={(e) => onFieldUpdate("expectation", e.target.value)}
            placeholder="Ex : capable de mener un code review seul·e"
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button onClick={() => setEditing(false)}
          disabled={!skill.skill.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity">
          <Check size={12} /> Valider
        </button>
      </div>
    );
  }

  return (
    <div className="group py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {/* Ligne manager */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 min-w-0">{skill.skill}</span>
        <div className="flex items-center gap-1.5">
          {LEVELS.map((level, i) => {
            const isFilled = i <= currentIdx;
            const isTarget = i === targetIdx;
            return (
              <button key={level} onClick={() => onUpdate(level)} title={level}
                className={[
                  "w-4 h-4 rounded-full transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
                  isFilled ? DOT_FILL[currentIdx] ?? "bg-gray-400" : "bg-gray-100 dark:bg-gray-800",
                  !isFilled && isTarget ? "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-gray-900" : "",
                ].filter(Boolean).join(" ")}
              />
            );
          })}
        </div>
        <span className={`text-xs font-medium w-24 text-right ${LEVEL_TEXT_COLOR[currentIdx] ?? "text-gray-500"}`}>
          {skill.level}
        </span>
        <div className="w-24 text-right">
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
        <button onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all rounded flex-shrink-0">
          <Pencil size={13} />
        </button>
      </div>
      {/* Auto-évaluation collaborateur */}
      {selfLevel && (
        <div className="flex items-center gap-4 mt-1.5">
          <span className="text-xs text-green-600 dark:text-green-400 flex-1 min-w-0 pl-0.5">Auto-éval.</span>
          <div className="flex items-center gap-1.5">
            {LEVELS.map((_, i) => (
              <span key={i} className={[
                "w-4 h-4 rounded-full",
                i <= selfIdx ? (SELF_DOT_FILL[selfIdx] ?? "bg-green-400") : "bg-gray-100 dark:bg-gray-800",
              ].join(" ")} />
            ))}
          </div>
          <span className="text-xs font-medium w-24 text-right text-green-600 dark:text-green-400">{selfLevel}</span>
          <div className="w-24 text-right">
            {selfIdx > currentIdx && <span className="text-xs text-green-600 dark:text-green-400 font-medium">+{selfIdx - currentIdx}</span>}
            {selfIdx < currentIdx && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{selfIdx - currentIdx}</span>}
            {selfIdx === currentIdx && selfLevel && <span className="text-xs text-gray-400 dark:text-gray-500">=</span>}
          </div>
          <div className="w-5 flex-shrink-0" />
        </div>
      )}
      {skill.expectation && (
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

// ── MidYearCard ────────────────────────────────────────────────────────────

const RATING_OPTIONS: { value: ObjectifRating; label: string; color: string }[] = [
  { value: "non_atteint", label: "Non atteint", color: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" },
  { value: "partiel",     label: "Partiel",     color: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  { value: "atteint",     label: "Atteint",     color: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" },
  { value: "depasse",     label: "Dépassé",     color: "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800" },
];

const FEELING_CONFIG: Record<FeelingPoste, { label: string; sub: string; dot: string }> = {
  1: { label: "Pas bien dans mon poste",          sub: "En difficulté, peu motivé",               dot: "bg-red-500" },
  2: { label: "Moyennement bien",                  sub: "Jours avec et sans",                      dot: "bg-amber-400" },
  3: { label: "À ma place, je monte en puissance", sub: "J'apprends, je progresse",                dot: "bg-blue-500" },
  4: { label: "Vraiment bon et j'adore",           sub: "Référence dans mon domaine, fort impact", dot: "bg-green-500" },
  5: { label: "Je m'ennuie, ça tourne en rond",    sub: "Zone de confort, plus vraiment motivé",   dot: "bg-gray-400" },
};

function MYTextarea({ value, onChange, placeholder, rows = 3, disabled }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; rows?: number; disabled?: boolean;
}) {
  return (
    <textarea value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} rows={rows}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50" />
  );
}

function MYLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function MYScore({ label, value, collab, onChange }: {
  label: string; value: Score5 | null; collab?: Score5 | null; onChange: (v: Score5) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 pt-0.5">{label}</span>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center gap-1">
          {([1, 2, 3, 4, 5] as Score5[]).map(n => (
            <button key={n} type="button" onClick={() => onChange(n)}
              className={`w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                value === n ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>{n}</button>
          ))}
        </div>
        {collab !== undefined && collab !== null && (
          <div className="flex items-center gap-1">
            {([1, 2, 3, 4, 5] as Score5[]).map(n => (
              <div key={n}
                className={`w-7 h-2 rounded-full ${collab === n ? "bg-green-400" : "bg-gray-100 dark:bg-gray-800"}`} />
            ))}
            <span className="text-[10px] text-green-600 dark:text-green-400 ml-0.5">collab</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MidYearCard({
  interview,
  collaboratorId,
  collaborator,
  onUpdate,
}: {
  interview: MidYearInterview;
  collaboratorId: string;
  collaborator: Collaborator;
  onUpdate: (updated: MidYearInterview) => void;
}) {
  type MYTab = "past" | "present" | "future";
  const [activeTab, setActiveTab] = useState<MYTab>("past");
  const [miroir, setMiroir] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyOk, setCopyOk] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[] | null>(null);
  const [aiSection, setAiSection] = useState<MYTab | null>(null);
  const [interviewDate, setInterviewDate] = useState<string>(interview.interview_date ?? "");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local copies of sections
  const [past, setPast] = useState<MidYearPast>(() => interview.past ?? {
    bilan_global: "", moments_forts: ["","",""], kifs: ["","",""],
    frustrations: ["","",""], objectifs_s1: [], apprentissages: ["","",""], manager_notes: "",
  });
  const [present, setPresent] = useState<MidYearPresent>(() => interview.present ?? {
    feeling_poste: null, entreprise_vision: null, entreprise_mission: null,
    entreprise_forces: null, entreprise_challenges: null,
    equipe_mission: null, equipe_forces: null, equipe_challenges: null,
    bien_etre_notes: "", manager_notes: "",
  });
  const [future, setFuture] = useState<MidYearFuture>(() => interview.future ?? {
    succes_si: ["","",""], daki_drop: "", daki_add: "", daki_keep: "", daki_improve: "",
    feedback_manager: "", objectifs_s2: [], demandes: "", manager_notes: "",
  });

  async function saveInterviewDate(date: string) {
    setInterviewDate(date);
    await fetch(`/api/teams/entretiens/mid-year/${interview.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interview_date: date || null }),
    });
    onUpdate({ ...interview, interview_date: date || null });
  }

  const debounceSave = (newPast?: MidYearPast, newPresent?: MidYearPresent, newFuture?: MidYearFuture) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      const res = await fetch(`/api/teams/entretiens/mid-year/${interview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ past: newPast ?? past, present: newPresent ?? present, future: newFuture ?? future }),
      });
      if (res.ok) {
        const updated = await res.json() as MidYearInterview;
        onUpdate({ ...interview, ...updated });
      }
      setSaving(false);
    }, 700);
  };

  const updatePast = (patch: Partial<MidYearPast>) => {
    const next = { ...past, ...patch };
    setPast(next);
    debounceSave(next, undefined, undefined);
  };
  const updatePresent = (patch: Partial<MidYearPresent>) => {
    const next = { ...present, ...patch };
    setPresent(next);
    debounceSave(undefined, next, undefined);
  };
  const updateFuture = (patch: Partial<MidYearFuture>) => {
    const next = { ...future, ...patch };
    setFuture(next);
    debounceSave(undefined, undefined, next);
  };

  const updateList = (
    field: "moments_forts" | "kifs" | "frustrations" | "apprentissages" | "succes_si",
    idx: number, val: string, section: "past" | "future",
  ) => {
    if (section === "past") {
      const arr = [...(past[field as keyof MidYearPast] as string[])];
      arr[idx] = val;
      updatePast({ [field]: arr } as Partial<MidYearPast>);
    } else {
      const arr = [...(future[field as keyof MidYearFuture] as string[])];
      arr[idx] = val;
      updateFuture({ [field]: arr } as Partial<MidYearFuture>);
    }
  };

  // Objectifs helpers
  const addObjectif = (section: "s1" | "s2") => {
    const newObj: MidYearObjectif = { id: crypto.randomUUID(), title: "", rating: null, manager_comment: "" };
    if (section === "s1") updatePast({ objectifs_s1: [...past.objectifs_s1, newObj] });
    else updateFuture({ objectifs_s2: [...future.objectifs_s2, newObj] });
  };
  const removeObjectif = (section: "s1" | "s2", id: string) => {
    if (section === "s1") updatePast({ objectifs_s1: past.objectifs_s1.filter(o => o.id !== id) });
    else updateFuture({ objectifs_s2: future.objectifs_s2.filter(o => o.id !== id) });
  };
  const updateObjectif = (section: "s1" | "s2", id: string, patch: Partial<MidYearObjectif>) => {
    if (section === "s1") {
      updatePast({ objectifs_s1: past.objectifs_s1.map(o => o.id === id ? { ...o, ...patch } : o) });
    } else {
      updateFuture({ objectifs_s2: future.objectifs_s2.map(o => o.id === id ? { ...o, ...patch } : o) });
    }
  };

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/teams/mid-year/${interview.share_token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    });
  };

  const generateAiQuestions = async (section: MYTab) => {
    setAiLoading(true);
    setAiSection(section);
    setAiQuestions(null);
    const res = await fetch(`/api/teams/entretiens/mid-year/${interview.id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section }),
    });
    if (res.ok) {
      const { questions } = await res.json() as { questions: string[] };
      setAiQuestions(questions);
    }
    setAiLoading(false);
  };

  const hasCollab = !!interview.collaborator_submitted_at;
  const cp = interview.collab_past;
  const cpr = interview.collab_present;
  const cf = interview.collab_future;

  const TABS: { id: MYTab; label: string }[] = [
    { id: "past",    label: "Les 6 derniers mois" },
    { id: "present", label: "Le présent" },
    { id: "future",  label: "Le S2" },
  ];

  const mf  = past.moments_forts as string[];
  const kfs = past.kifs as string[];
  const frs = past.frustrations as string[];
  const app = past.apprentissages as string[];
  const scs = future.succes_si as string[];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
            <BarChart3 size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Mi-année {interview.year}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {interview.status === "completed" ? "Complété" : interview.status === "collab_sent" ? "En attente du collaborateur" : "En préparation"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {saving && <Loader2 size={12} className="animate-spin text-gray-400" />}
            {hasCollab && (
              <button type="button" onClick={() => setMiroir(v => !v)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                  miroir ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                         : "border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}>
                Vue miroir
              </button>
            )}
            <button type="button" onClick={copyLink}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              {copyOk ? <Check size={11} className="text-green-500" /> : <Link2 size={11} />}
              {copyOk ? "Copié !" : "Partager"}
            </button>
            <button
              type="button"
              onClick={() => exportMidYearMarkdown(interview, collaborator)}
              title="Exporter en Markdown"
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Download size={11} /> MD
            </button>
            <button
              type="button"
              onClick={() => exportMidYearPDF(interview, collaborator)}
              title="Exporter en PDF"
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Download size={11} /> PDF
            </button>
          </div>
          {/* Date de l'entretien + ICS */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">Date entretien</label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              onBlur={(e) => saveInterviewDate(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {interviewDate && (
              <button
                type="button"
                onClick={() => downloadMidYearICS(interviewDate, `${collaborator.first_name} ${collaborator.last_name}`, interview.year)}
                title="Ajouter à l'agenda (ICS)"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
              >
                <CalendarDays size={11} /> Agenda
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              activeTab === t.id
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* AI questions panel */}
      {aiQuestions && aiSection === activeTab && (
        <div className="mx-5 mt-4 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Questions IA — à poser en entretien</p>
            <button type="button" onClick={() => setAiQuestions(null)} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300">
              <X size={13} />
            </button>
          </div>
          <ul className="space-y-2">
            {aiQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-indigo-800 dark:text-indigo-200">
                <span className="mt-1 w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />{q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-5 space-y-5">

        {/* ── Passé ──────────────────────────────────────────────────── */}
        {activeTab === "past" && (
          <div className="space-y-5">
            {/* Bilan global */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <MYLabel label="Bilan global" hint="Si ces 6 mois étaient un film, ce serait lequel ?" />
                <button type="button" onClick={() => generateAiQuestions("past")} disabled={aiLoading}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50">
                  {aiLoading && aiSection === "past" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Questions IA
                </button>
              </div>
              <MYTextarea value={past.bilan_global} onChange={v => updatePast({ bilan_global: v })}
                placeholder="Résumé macro des 6 derniers mois…" rows={3} />
              {miroir && cp?.bilan_global && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Collaborateur</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{cp.bilan_global}</p>
                </div>
              )}
            </div>

            {/* Moments forts */}
            <div>
              <MYLabel label="Moments forts" hint="3 grands moments de ces 6 mois" />
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <MYTextarea value={mf[i] ?? ""} onChange={v => updateList("moments_forts", i, v, "past")}
                      placeholder={`Moment fort ${i + 1}…`} rows={2} />
                    {miroir && (cp?.moments_forts as string[] | undefined)?.[i] && (
                      <div className="mt-1 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <span className="text-xs text-green-600 dark:text-green-400">Collab : </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{(cp?.moments_forts as string[])[i]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Kifs */}
            <div>
              <MYLabel label="Kifs — satisfactions & fiertés" hint="3 principales sources de satisfaction" />
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <MYTextarea value={kfs[i] ?? ""} onChange={v => updateList("kifs", i, v, "past")}
                      placeholder={`Satisfaction ${i + 1}…`} rows={2} />
                    {miroir && (cp?.kifs as string[] | undefined)?.[i] && (
                      <div className="mt-1 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <span className="text-xs text-green-600 dark:text-green-400">Collab : </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{(cp?.kifs as string[])[i]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Frustrations */}
            <div>
              <MYLabel label="Frustrations & difficultés" hint="3 principales frustrations" />
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <MYTextarea value={frs[i] ?? ""} onChange={v => updateList("frustrations", i, v, "past")}
                      placeholder={`Frustration ${i + 1}…`} rows={2} />
                    {miroir && (cp?.frustrations as string[] | undefined)?.[i] && (
                      <div className="mt-1 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <span className="text-xs text-green-600 dark:text-green-400">Collab : </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{(cp?.frustrations as string[])[i]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Objectifs S1 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <MYLabel label="Objectifs S1 — bilan" />
                <button type="button" onClick={() => addObjectif("s1")}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <Plus size={11} /> Ajouter
                </button>
              </div>
              {past.objectifs_s1.length === 0 && (
                <p className="text-xs text-gray-400 italic">Aucun objectif — clique sur Ajouter pour commencer</p>
              )}
              <div className="space-y-3">
                {past.objectifs_s1.map(obj => (
                  <div key={obj.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <input type="text" value={obj.title}
                        onChange={e => updateObjectif("s1", obj.id, { title: e.target.value })}
                        placeholder="Objectif…"
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => removeObjectif("s1", obj.id)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {RATING_OPTIONS.map(r => (
                        <button key={r.value} type="button" onClick={() => updateObjectif("s1", obj.id, { rating: r.value })}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                            obj.rating === r.value ? r.color : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                          }`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <MYTextarea value={obj.manager_comment}
                      onChange={v => updateObjectif("s1", obj.id, { manager_comment: v })}
                      placeholder="Commentaire…" rows={2} />
                  </div>
                ))}
              </div>
            </div>

            {/* Apprentissages */}
            <div>
              <MYLabel label="Apprentissages" hint="3 principaux enseignements" />
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <MYTextarea value={app[i] ?? ""} onChange={v => updateList("apprentissages", i, v, "past")}
                      placeholder={`Enseignement ${i + 1}…`} rows={2} />
                    {miroir && (cp?.apprentissages as string[] | undefined)?.[i] && (
                      <div className="mt-1 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <span className="text-xs text-green-600 dark:text-green-400">Collab : </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{(cp?.apprentissages as string[])[i]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes manager */}
            <div>
              <MYLabel label="Notes du manager (privées)" />
              <MYTextarea value={past.manager_notes} onChange={v => updatePast({ manager_notes: v })}
                placeholder="Tes observations personnelles sur la séquence passé…" rows={3} />
            </div>
          </div>
        )}

        {/* ── Présent ────────────────────────────────────────────────── */}
        {activeTab === "present" && (
          <div className="space-y-5">
            {/* Feeling poste */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <MYLabel label="Feeling par rapport au poste" hint="Catégorie dans laquelle le collaborateur se place" />
                <button type="button" onClick={() => generateAiQuestions("present")} disabled={aiLoading}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50">
                  {aiLoading && aiSection === "present" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Questions IA
                </button>
              </div>
              <div className="space-y-2">
                {([1, 2, 3, 4, 5] as FeelingPoste[]).map(n => (
                  <button key={n} type="button" onClick={() => updatePresent({ feeling_poste: n })}
                    className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-xl border-2 transition-all ${
                      present.feeling_poste === n
                        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${FEELING_CONFIG[n].dot}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{FEELING_CONFIG[n].label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{FEELING_CONFIG[n].sub}</p>
                    </div>
                    {miroir && cpr?.feeling_poste === n && (
                      <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">collab</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Entreprise */}
            <div>
              <MYLabel label="L'entreprise" hint="Clarté du collaborateur · 5 = super clair · 1 = pas du tout clair" />
              <div className="space-y-3 mt-2">
                <MYScore label="La vision de l'entreprise (là où elle va)"
                  value={present.entreprise_vision} collab={miroir ? cpr?.entreprise_vision ?? null : undefined}
                  onChange={v => updatePresent({ entreprise_vision: v })} />
                <MYScore label="La mission de l'entreprise (à quoi elle sert)"
                  value={present.entreprise_mission} collab={miroir ? cpr?.entreprise_mission ?? null : undefined}
                  onChange={v => updatePresent({ entreprise_mission: v })} />
                <MYScore label="Les forces de l'entreprise"
                  value={present.entreprise_forces} collab={miroir ? cpr?.entreprise_forces ?? null : undefined}
                  onChange={v => updatePresent({ entreprise_forces: v })} />
                <MYScore label="Les challenges à relever par l'entreprise"
                  value={present.entreprise_challenges} collab={miroir ? cpr?.entreprise_challenges ?? null : undefined}
                  onChange={v => updatePresent({ entreprise_challenges: v })} />
              </div>
            </div>

            {/* Equipe */}
            <div>
              <MYLabel label="L'équipe" hint="Clarté du collaborateur · 5 = super clair · 1 = pas du tout clair" />
              <div className="space-y-3 mt-2">
                <MYScore label="La mission de l'équipe (à quoi elle sert, son impact)"
                  value={present.equipe_mission} collab={miroir ? cpr?.equipe_mission ?? null : undefined}
                  onChange={v => updatePresent({ equipe_mission: v })} />
                <MYScore label="Les forces de notre équipe"
                  value={present.equipe_forces} collab={miroir ? cpr?.equipe_forces ?? null : undefined}
                  onChange={v => updatePresent({ equipe_forces: v })} />
                <MYScore label="Les challenges à relever par l'équipe"
                  value={present.equipe_challenges} collab={miroir ? cpr?.equipe_challenges ?? null : undefined}
                  onChange={v => updatePresent({ equipe_challenges: v })} />
              </div>
            </div>

            {/* Bien-être */}
            <div>
              <MYLabel label="Bien-être & motivations" />
              <MYTextarea value={present.bien_etre_notes} onChange={v => updatePresent({ bien_etre_notes: v })}
                placeholder="Observations sur l'engagement, la charge de travail, l'équilibre…" rows={3} />
              {miroir && cpr?.bien_etre_notes && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Collaborateur</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{cpr.bien_etre_notes}</p>
                </div>
              )}
            </div>

            <div>
              <MYLabel label="Notes du manager (privées)" />
              <MYTextarea value={present.manager_notes} onChange={v => updatePresent({ manager_notes: v })}
                placeholder="Tes observations personnelles sur la séquence présent…" rows={3} />
            </div>
          </div>
        )}

        {/* ── Futur S2 ───────────────────────────────────────────────── */}
        {activeTab === "future" && (
          <div className="space-y-5">
            {/* Succès si */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <MYLabel label="Mon S2 sera réussi si…" hint="3 critères de succès pour le 2e semestre" />
                <button type="button" onClick={() => generateAiQuestions("future")} disabled={aiLoading}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50">
                  {aiLoading && aiSection === "future" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Questions IA
                </button>
              </div>
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <MYTextarea value={scs[i] ?? ""} onChange={v => updateList("succes_si", i, v, "future")}
                      placeholder={`Critère de succès ${i + 1}…`} rows={2} />
                    {miroir && (cf?.succes_si as string[] | undefined)?.[i] && (
                      <div className="mt-1 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <span className="text-xs text-green-600 dark:text-green-400">Collab : </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{(cf?.succes_si as string[])[i]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* DAKI */}
            <div>
              <MYLabel label="DAKI — plan d'actions S2" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "daki_drop" as const, label: "Drop — arrêter", placeholder: "Ce que j'arrête de faire…" },
                  { key: "daki_add"  as const, label: "Add — commencer", placeholder: "Ce que je commence à faire…" },
                  { key: "daki_keep" as const, label: "Keep — continuer", placeholder: "Ce que je maintiens…" },
                  { key: "daki_improve" as const, label: "Improve — améliorer", placeholder: "Ce que j'améliore…" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{label}</p>
                    <MYTextarea value={future[key] as string} onChange={v => updateFuture({ [key]: v } as Partial<MidYearFuture>)}
                      placeholder={placeholder} rows={3} />
                    {miroir && cf?.[key as keyof typeof cf] && (
                      <div className="mt-2 px-2 py-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <span className="text-[10px] text-green-600 dark:text-green-400">Collab : </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{cf[key as keyof typeof cf] as string}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback manager */}
            <div>
              <MYLabel label="Un encore meilleur binôme" hint="Feedback du collaborateur sur le management" />
              {miroir && cf?.feedback_manager ? (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">Ce que dit le collaborateur</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{cf.feedback_manager}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic px-1">Visible après que le collaborateur ait soumis ses réponses via le lien de partage.</p>
              )}
            </div>

            {/* Objectifs S2 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <MYLabel label="Objectifs S2" hint="Objectifs pour le 2e semestre" />
                <button type="button" onClick={() => addObjectif("s2")}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <Plus size={11} /> Ajouter
                </button>
              </div>
              {future.objectifs_s2.length === 0 && (
                <p className="text-xs text-gray-400 italic">Aucun objectif S2 défini</p>
              )}
              <div className="space-y-2">
                {future.objectifs_s2.map(obj => (
                  <div key={obj.id} className="flex gap-2 items-center">
                    <input type="text" value={obj.title}
                      onChange={e => updateObjectif("s2", obj.id, { title: e.target.value })}
                      placeholder="Objectif S2…"
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => removeObjectif("s2", obj.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Demandes */}
            <div>
              <MYLabel label="Demandes du collaborateur" />
              {miroir && cf?.demandes ? (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">Ce que demande le collaborateur</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{cf.demandes}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic px-1">Visible après la soumission du collaborateur.</p>
              )}
            </div>

            <div>
              <MYLabel label="Notes du manager (privées)" />
              <MYTextarea value={future.manager_notes} onChange={v => updateFuture({ manager_notes: v })}
                placeholder="Tes observations et décisions pour le S2…" rows={3} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── MonthlyReviewCard ──────────────────────────────────────────────────────

const MONTH_NAMES = ["janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const MONTHLY_QUESTIONS: { field: keyof MonthlyReviewData; label: string; hint: string; placeholder: string }[] = [
  {
    field: "apprentissages",
    label: "Ce qui m'a le plus appris",
    hint: "Qu'est-ce que t'a le plus appris ces derniers mois ?",
    placeholder: "Une situation, un projet, une rencontre qui t'a fait grandir…",
  },
  {
    field: "different_si",
    label: "Ce que je ferais différemment",
    hint: "Qu'est-ce que tu ferais différemment si tu pouvais revenir en arrière ?",
    placeholder: "Un choix, une approche, une réaction…",
  },
  {
    field: "competences_progressees",
    label: "Compétences où j'ai progressé",
    hint: "Sur quelles compétences tu penses avoir progressé ?",
    placeholder: "Techniques, relationnelles, managériales…",
  },
  {
    field: "focus_prochain_mois",
    label: "Mon focus le mois prochain",
    hint: "Ce sur quoi tu vas te concentrer le mois prochain ?",
    placeholder: "Une priorité, un objectif, une intention…",
  },
];

function MonthlyReviewCard({
  interview,
  collaboratorId,
  onUpdate,
}: {
  interview: MonthlyReviewInterview;
  collaboratorId: string;
  onUpdate: (updated: MonthlyReviewInterview) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [interviewDate, setInterviewDate] = useState<string>(interview.interview_date ?? "");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [reviewData, setReviewData] = useState<MonthlyReviewData>(() => interview.data ?? {
    apprentissages: "",
    different_si: "",
    competences_progressees: "",
    focus_prochain_mois: "",
    manager_notes: "",
  });

  const debounceSave = (next: MonthlyReviewData) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      const res = await fetch(`/api/teams/entretiens/monthly-review/${interview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: next }),
      });
      if (res.ok) {
        const updated = await res.json() as MonthlyReviewInterview;
        onUpdate({ ...interview, ...updated });
      }
      setSaving(false);
    }, 700);
  };

  const updateField = (field: keyof MonthlyReviewData, value: string) => {
    const next = { ...reviewData, [field]: value };
    setReviewData(next);
    debounceSave(next);
  };

  const saveDate = async (date: string) => {
    setInterviewDate(date);
    await fetch(`/api/teams/entretiens/monthly-review/${interview.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interview_date: date || null }),
    });
    onUpdate({ ...interview, interview_date: date || null });
  };

  const toggleComplete = async () => {
    const newStatus = interview.status === "completed" ? "draft" : "completed";
    const res = await fetch(`/api/teams/entretiens/monthly-review/${interview.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) onUpdate({ ...interview, status: newStatus });
  };

  const monthLabel = MONTH_NAMES[(interview.month ?? 1) - 1];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Bilan mensuel — {monthLabel} {interview.year}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {interview.status === "completed" ? "Complété" : "En cours"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {saving && <Loader2 size={12} className="animate-spin text-gray-400" />}
            <button
              type="button"
              onClick={toggleComplete}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                interview.status === "completed"
                  ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {interview.status === "completed" ? "✓ Terminé" : "Marquer terminé"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">Date</label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              onBlur={(e) => saveDate(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="p-5 space-y-5">
        {MONTHLY_QUESTIONS.map(({ field, label, hint, placeholder }) => (
          <div key={field}>
            <div className="mb-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">{hint}</p>
            </div>
            <textarea
              value={reviewData[field]}
              onChange={(e) => updateField(field, e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        ))}

        {/* Notes manager */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Notes du manager (privées)</p>
          <textarea
            value={reviewData.manager_notes}
            onChange={(e) => updateField("manager_notes", e.target.value)}
            placeholder="Tes observations, engagements pris, points de suivi…"
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// ── OnboardingCard ─────────────────────────────────────────────────────────

const MILESTONE_ORDER: OnboardingMilestoneType[] = ["j7", "j30", "j90"];

const MILESTONE_LABELS: Record<OnboardingMilestoneType, { title: string; sub: string }> = {
  j7:  { title: "Jour 7",  sub: "Premières impressions" },
  j30: { title: "Jour 30", sub: "Intégration active" },
  j90: { title: "Jour 90", sub: "Autonomie & projection" },
};

function axisScore(axis: ChecklistAxis) {
  const checked = axis.items.filter((i) => i.checked).length;
  const total   = axis.items.length;
  return { checked, total, pct: total > 0 ? Math.round((checked / total) * 100) : 0 };
}

function OnboardingCard({
  interview,
  collaborator,
  onUpdate,
}: {
  interview: CollabInterview;
  collaborator: Collaborator;
  onUpdate: (updated: CollabInterview) => void;
}) {
  const [generatingMilestone, setGeneratingMilestone] = useState<string | null>(null);
  const [milestoneError, setMilestoneError]           = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone]     = useState<string | null>(null);
  const [editingItem, setEditingItem]                 = useState<{ milestoneId: string; axisName: string; itemId: string; text: string } | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedMilestones = MILESTONE_ORDER
    .map((type) => interview.milestones.find((m) => m.milestone_type === type))
    .filter(Boolean) as OnboardingMilestone[];

  function isUnlocked(milestoneType: OnboardingMilestoneType): boolean {
    const idx = MILESTONE_ORDER.indexOf(milestoneType);
    if (idx === 0) return true;
    const prev = interview.milestones.find((m) => m.milestone_type === MILESTONE_ORDER[idx - 1]);
    return prev?.is_completed === true;
  }

  function updateLocal(milestoneId: string, patch: Partial<OnboardingMilestone>) {
    onUpdate({
      ...interview,
      milestones: interview.milestones.map((m) => m.id === milestoneId ? { ...m, ...patch } : m),
    });
  }

  function scheduleSave(milestoneId: string, updates: Record<string, unknown>) {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      fetch(`/api/teams/entretiens/milestones/${milestoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    }, 500);
  }

  async function generateChecklist(milestoneId: string) {
    setGeneratingMilestone(milestoneId);
    setMilestoneError(null);
    try {
      const res  = await fetch(`/api/teams/entretiens/milestones/${milestoneId}/generate`, { method: "POST" });
      const data = await res.json() as OnboardingMilestone & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur de génération");
      updateLocal(milestoneId, data);
      setExpandedMilestone(milestoneId);
    } catch (e) {
      setMilestoneError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setGeneratingMilestone(null);
    }
  }

  function toggleItem(milestoneId: string, axisName: string, itemId: string) {
    const milestone = interview.milestones.find((m) => m.id === milestoneId);
    if (!milestone?.checklist) return;
    const newChecklist: OnboardingChecklist = {
      axes: milestone.checklist.axes.map((axis) =>
        axis.name !== axisName ? axis : {
          ...axis,
          items: axis.items.map((item) => item.id !== itemId ? item : { ...item, checked: !item.checked }),
        }
      ),
    };
    updateLocal(milestoneId, { checklist: newChecklist });
    scheduleSave(milestoneId, { checklist: newChecklist });
  }

  async function toggleComplete(milestoneId: string) {
    const milestone = interview.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return;
    const newCompleted = !milestone.is_completed;
    updateLocal(milestoneId, { is_completed: newCompleted });
    await fetch(`/api/teams/entretiens/milestones/${milestoneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: newCompleted }),
    });
  }

  function addItem(milestoneId: string, axisName: string) {
    const milestone = interview.milestones.find((m) => m.id === milestoneId);
    if (!milestone?.checklist) return;
    const newItemId = `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newChecklist: OnboardingChecklist = {
      axes: milestone.checklist.axes.map((axis) =>
        axis.name !== axisName ? axis : {
          ...axis,
          items: [...axis.items, { id: newItemId, text: "", checked: false }],
        }
      ),
    };
    updateLocal(milestoneId, { checklist: newChecklist });
    setEditingItem({ milestoneId, axisName, itemId: newItemId, text: "" });
  }

  function deleteItem(milestoneId: string, axisName: string, itemId: string) {
    const milestone = interview.milestones.find((m) => m.id === milestoneId);
    if (!milestone?.checklist) return;
    const newChecklist: OnboardingChecklist = {
      axes: milestone.checklist.axes.map((axis) =>
        axis.name !== axisName ? axis : {
          ...axis,
          items: axis.items.filter((item) => item.id !== itemId),
        }
      ),
    };
    updateLocal(milestoneId, { checklist: newChecklist });
    scheduleSave(milestoneId, { checklist: newChecklist });
    if (editingItem?.itemId === itemId) setEditingItem(null);
  }

  function commitItemText(milestoneId: string, axisName: string, itemId: string, text: string) {
    const milestone = interview.milestones.find((m) => m.id === milestoneId);
    if (!milestone?.checklist) return;
    const newChecklist: OnboardingChecklist = {
      axes: milestone.checklist.axes.map((axis) =>
        axis.name !== axisName ? axis : {
          ...axis,
          items: axis.items
            .map((item) => item.id !== itemId ? item : { ...item, text })
            .filter((item) => item.text.trim()),
        }
      ),
    };
    updateLocal(milestoneId, { checklist: newChecklist });
    scheduleSave(milestoneId, { checklist: newChecklist });
    setEditingItem(null);
  }

  function updateNotes(milestoneId: string, notes: string) {
    updateLocal(milestoneId, { manager_notes: notes });
    scheduleSave(milestoneId, { manager_notes: notes });
  }

  const completedCount  = interview.milestones.filter((m) => m.is_completed).length;
  const totalMilestones = interview.milestones.length;
  const isAllDone       = completedCount === totalMilestones && totalMilestones > 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* ── Card header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
          <Rocket size={16} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Onboarding</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {interview.start_date
              ? `Démarrage : ${new Date(interview.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
              : `Créé le ${new Date(interview.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {interview.start_date && (
            <button
              onClick={() => downloadOnboardingICS(interview.start_date!, `${collaborator.first_name} ${collaborator.last_name}`)}
              title="Télécharger les invitations calendrier (J+7, J+30, J+90)"
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <CalendarDays size={11} /> ICS
            </button>
          )}
          <button
            onClick={() => exportOnboardingMarkdown(interview, collaborator)}
            title="Exporter en Markdown"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Download size={11} /> MD
          </button>
          <button
            onClick={() => exportOnboardingPDF(interview, collaborator)}
            title="Exporter en PDF"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Download size={11} /> PDF
          </button>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isAllDone
              ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
              : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
          }`}>
            {isAllDone ? "Terminé" : `${completedCount}/${totalMilestones} jalons`}
          </span>
        </div>
      </div>

      {/* ── Milestones ── */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {sortedMilestones.map((milestone) => {
          const locked        = !isUnlocked(milestone.milestone_type);
          const label         = MILESTONE_LABELS[milestone.milestone_type];
          const isGenerating  = generatingMilestone === milestone.id;
          const isExpanded    = expandedMilestone === milestone.id && !locked;
          const hasChecklist  = (milestone.checklist?.axes?.length ?? 0) > 0;
          const allItems      = hasChecklist ? milestone.checklist!.axes.flatMap((a) => a.items) : [];
          const checkedItems  = allItems.filter((i) => i.checked).length;

          return (
            <div key={milestone.id} className={locked ? "opacity-50" : ""}>
              {/* Row */}
              <button
                onClick={() => !locked && setExpandedMilestone(isExpanded ? null : milestone.id)}
                disabled={locked}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors disabled:cursor-not-allowed"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                  milestone.is_completed
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                    : locked
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700"
                    : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                }`}>
                  {milestone.is_completed ? <Check size={12} /> : label.title.split(" ")[1]}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${locked ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
                    {label.title} — {label.sub}
                  </p>
                  {hasChecklist && !milestone.is_completed && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {checkedItems}/{allItems.length} objectifs validés
                    </p>
                  )}
                  {locked && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Disponible après validation du jalon précédent
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {milestone.is_completed ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                      <Check size={11} /> Réalisé
                    </span>
                  ) : !hasChecklist && !locked ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); generateChecklist(milestone.id); }}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
                    >
                      {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      {isGenerating ? "Génération…" : "Préparer"}
                    </button>
                  ) : null}
                  {!locked && <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />}
                </div>
              </button>

              {/* Expanded: no checklist yet */}
              {isExpanded && !hasChecklist && (
                <div className="px-5 pb-5 pt-1 bg-gray-50/50 dark:bg-gray-800/20">
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">
                    Clique sur &quot;Préparer&quot; pour générer la checklist d&apos;objectifs de ce jalon avec l&apos;IA.
                  </p>
                  <button
                    onClick={() => generateChecklist(milestone.id)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors"
                  >
                    {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {isGenerating ? "Génération en cours…" : "Préparer ce jalon"}
                  </button>
                  {milestoneError && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{milestoneError}</p>}
                </div>
              )}

              {/* Expanded: checklist */}
              {isExpanded && hasChecklist && (
                <div className="px-5 pb-5 pt-3 space-y-5 bg-gray-50/50 dark:bg-gray-800/20">
                  {/* Axis progress bars */}
                  <div className="space-y-2">
                    {milestone.checklist!.axes.map((axis) => {
                      const score = axisScore(axis);
                      return (
                        <div key={axis.name} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-40 flex-shrink-0">{axis.name}</span>
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${score.pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right tabular-nums">
                            {score.checked}/{score.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Per-axis checklists */}
                  {milestone.checklist!.axes.map((axis) => (
                    <div key={axis.name} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">{axis.name}</p>
                      <div className="space-y-0.5">
                        {axis.items.map((item) => {
                          const isEditingThis =
                            editingItem?.milestoneId === milestone.id &&
                            editingItem?.axisName === axis.name &&
                            editingItem?.itemId === item.id;
                          return (
                            <div key={item.id} className="group flex items-start gap-2.5 py-1.5">
                              <button
                                onClick={() => toggleItem(milestone.id, axis.name, item.id)}
                                className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                                  item.checked
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                                }`}
                              >
                                {item.checked && <Check size={10} className="text-white" />}
                              </button>
                              {isEditingThis ? (
                                <input
                                  autoFocus
                                  value={editingItem.text}
                                  onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                                  onBlur={() => commitItemText(milestone.id, axis.name, item.id, editingItem.text)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitItemText(milestone.id, axis.name, item.id, editingItem.text);
                                    if (e.key === "Escape") setEditingItem(null);
                                  }}
                                  className="flex-1 text-sm px-2 py-0.5 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <span
                                  onClick={() => setEditingItem({ milestoneId: milestone.id, axisName: axis.name, itemId: item.id, text: item.text })}
                                  className={`flex-1 text-sm cursor-text leading-snug select-none ${
                                    item.checked
                                      ? "line-through text-gray-400 dark:text-gray-500"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {item.text || <span className="italic text-gray-400">Cliquer pour saisir…</span>}
                                </span>
                              )}
                              <button
                                onClick={() => deleteItem(milestone.id, axis.name, item.id)}
                                className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}
                        <button
                          onClick={() => addItem(milestone.id, axis.name)}
                          className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Plus size={12} /> Ajouter un objectif
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                      Mes notes
                    </label>
                    <textarea
                      value={milestone.manager_notes ?? ""}
                      onChange={(e) => updateNotes(milestone.id, e.target.value)}
                      rows={3}
                      placeholder="Notes de l'entretien…"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleComplete(milestone.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                        milestone.is_completed
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90"
                      }`}
                    >
                      <Check size={13} />
                      {milestone.is_completed ? "Jalon réalisé ✓" : "Marquer comme réalisé"}
                    </button>
                    <button
                      onClick={() => generateChecklist(milestone.id)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                      Regénérer
                    </button>
                  </div>
                  {milestoneError && <p className="text-xs text-red-500 dark:text-red-400">{milestoneError}</p>}
                </div>
              )}
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

// ── ICS helpers ────────────────────────────────────────────────────────────

function buildICS(events: Array<{ title: string; start: Date; end: Date; description?: string }>): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@posture`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Posture//Copilot//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const ev of events) {
    const startStr = ev.start.toISOString().slice(0, 10).replace(/-/g, "");
    const end = new Date(ev.end); end.setDate(end.getDate() + 1);
    const endStr = end.toISOString().slice(0, 10).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid()}`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART;VALUE=DATE:${startStr}`,
      `DTEND;VALUE=DATE:${endStr}`,
      `SUMMARY:${ev.title}`,
      ...(ev.description ? [`DESCRIPTION:${ev.description.replace(/\n/g, "\\n")}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadOnboardingICS(startDate: string, collabName: string): void {
  const base = new Date(startDate);
  const addDays = (n: number) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
  downloadICS(buildICS([
    { title: `Onboarding J+7 — ${collabName}`,  start: addDays(7),  end: addDays(7),  description: "Point onboarding J+7" },
    { title: `Onboarding J+30 — ${collabName}`, start: addDays(30), end: addDays(30), description: "Point onboarding J+30" },
    { title: `Onboarding J+90 — ${collabName}`, start: addDays(90), end: addDays(90), description: "Point onboarding J+90" },
  ]), `onboarding-${collabName.toLowerCase().replace(/\s+/g, "-")}.ics`);
}

function downloadMidYearICS(interviewDate: string, collabName: string, year: number): void {
  const d = new Date(interviewDate);
  downloadICS(buildICS([
    { title: `Entretien mi-année ${year} — ${collabName}`, start: d, end: d, description: "Entretien mi-année" },
  ]), `mi-annee-${year}-${collabName.toLowerCase().replace(/\s+/g, "-")}.ics`);
}

// ── PDF export ─────────────────────────────────────────────────────────────

function exportPDF(title: string, htmlContent: string): void {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title}</title><style>
    *{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:760px;margin:2rem auto;color:#111;line-height:1.6;padding:0 1rem}
    h1{font-size:1.4rem;margin-bottom:.25rem}h2{font-size:1.05rem;margin-top:1.5rem;border-bottom:1px solid #e5e7eb;padding-bottom:.2rem}
    h3{font-size:.9rem;margin-top:1rem;color:#374151}ul{padding-left:1.5rem}li{margin-bottom:.2rem}
    p{margin:.4rem 0}.meta{font-size:.8rem;color:#6b7280}.section{margin-top:1.2rem}
    .badge{display:inline-block;padding:.15rem .5rem;border-radius:4px;font-size:.75rem;background:#f3f4f6;color:#374151;border:1px solid #e5e7eb}
    @media print{body{margin:0}a{display:none}}
  </style></head><body>${htmlContent}<script>window.print();<\/script></body></html>`);
  win.document.close();
}

function exportSessionPDF(session: WeeklySession, collaborator: Collaborator): void {
  const followUps = (session.raw_content?.suggested_follow_ups ?? []).map((f: string) => `<li>${f}</li>`).join("");
  exportPDF(
    `1:1 — ${collaborator.first_name} ${collaborator.last_name} — Semaine ${session.week_number}`,
    `<h1>1:1 — ${collaborator.first_name} ${collaborator.last_name}</h1>
     <p class="meta">Semaine ${session.week_number} · Axe : ${session.development_axis}</p>
     <h2>Sujets prioritaires</h2>
     <h3>1. ${session.priority_topic_1}</h3><p>${session.raw_content?.priority_topic_1_rationale ?? ""}</p>
     <h3>2. ${session.priority_topic_2}</h3><p>${session.raw_content?.priority_topic_2_rationale ?? ""}</p>
     <h2>Exploration</h2><p>${session.exploration_topic}</p><p><em>${session.raw_content?.exploration_rationale ?? ""}</em></p>
     <h2>Question inattendue</h2><blockquote>${session.unexpected_question}</blockquote>
     <h2>Relances suggérées</h2><ul>${followUps}</ul>
     <h2>Mes notes</h2><p>${(session.manager_notes ?? "").replace(/\n/g, "<br>")}</p>`,
  );
}

function exportOnboardingPDF(interview: CollabInterview, collaborator: Collaborator): void {
  const milestonesHtml = interview.milestones.map((m) => {
    const label = MILESTONE_LABELS[m.milestone_type];
    const axesHtml = (m.checklist?.axes ?? []).map((ax) => {
      const items = ax.items.map((it) => `<li>${it.checked ? "✓" : "○"} ${it.text}</li>`).join("");
      return `<h3>${ax.name}</h3><ul>${items}</ul>`;
    }).join("");
    return `<div class="section"><h2>${label.title} — ${label.sub}</h2>${axesHtml}${m.manager_notes ? `<p><strong>Notes :</strong> ${m.manager_notes.replace(/\n/g, "<br>")}</p>` : ""}<p class="badge">${m.is_completed ? "✓ Réalisé" : "En cours"}</p></div>`;
  }).join("");
  exportPDF(
    `Onboarding — ${collaborator.first_name} ${collaborator.last_name}`,
    `<h1>Onboarding — ${collaborator.first_name} ${collaborator.last_name}</h1>
     ${interview.start_date ? `<p class="meta">Démarrage : ${new Date(interview.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
     ${milestonesHtml}`,
  );
}

function exportMidYearPDF(interview: MidYearInterview, collaborator: Collaborator): void {
  const p = interview.past; const pr = interview.present; const f = interview.future;
  const list = (arr: string[] | undefined) => (arr ?? []).filter(Boolean).map((x) => `<li>${x}</li>`).join("");
  const objList = (arr: MidYearObjectif[] | undefined) => (arr ?? []).map((o) => `<li>${o.title}${o.rating ? ` [${o.rating}]` : ""}${o.manager_comment ? ` — ${o.manager_comment}` : ""}</li>`).join("");
  exportPDF(
    `Mi-année ${interview.year} — ${collaborator.first_name} ${collaborator.last_name}`,
    `<h1>Entretien mi-année ${interview.year} — ${collaborator.first_name} ${collaborator.last_name}</h1>
     ${interview.interview_date ? `<p class="meta">Date : ${new Date(interview.interview_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
     <h2>Les 6 derniers mois</h2>
     ${p?.bilan_global ? `<p><strong>Bilan :</strong> ${p.bilan_global}</p>` : ""}
     ${list(p?.moments_forts) ? `<p><strong>Moments forts :</strong></p><ul>${list(p?.moments_forts)}</ul>` : ""}
     ${list(p?.kifs) ? `<p><strong>Kifs :</strong></p><ul>${list(p?.kifs)}</ul>` : ""}
     ${list(p?.frustrations) ? `<p><strong>Frustrations :</strong></p><ul>${list(p?.frustrations)}</ul>` : ""}
     ${objList(p?.objectifs_s1) ? `<p><strong>Objectifs S1 :</strong></p><ul>${objList(p?.objectifs_s1)}</ul>` : ""}
     ${list(p?.apprentissages) ? `<p><strong>Apprentissages :</strong></p><ul>${list(p?.apprentissages)}</ul>` : ""}
     ${p?.manager_notes ? `<p><strong>Notes manager :</strong> ${p.manager_notes.replace(/\n/g, "<br>")}</p>` : ""}
     <h2>Le présent</h2>
     ${pr?.feeling_poste != null ? `<p><strong>Feeling poste :</strong> ${pr.feeling_poste}/5</p>` : ""}
     ${pr?.bien_etre_notes ? `<p><strong>Bien-être :</strong> ${pr.bien_etre_notes.replace(/\n/g, "<br>")}</p>` : ""}
     ${pr?.manager_notes ? `<p><strong>Notes manager :</strong> ${pr.manager_notes.replace(/\n/g, "<br>")}</p>` : ""}
     <h2>Le S2</h2>
     ${list(f?.succes_si) ? `<p><strong>Succès si :</strong></p><ul>${list(f?.succes_si)}</ul>` : ""}
     ${f?.daki_drop ? `<p><strong>DAKI Drop :</strong> ${f.daki_drop}</p>` : ""}
     ${f?.daki_add  ? `<p><strong>DAKI Add :</strong> ${f.daki_add}</p>`  : ""}
     ${f?.daki_keep ? `<p><strong>DAKI Keep :</strong> ${f.daki_keep}</p>` : ""}
     ${f?.daki_improve ? `<p><strong>DAKI Improve :</strong> ${f.daki_improve}</p>` : ""}
     ${f?.feedback_manager ? `<p><strong>Feedback manager :</strong> ${f.feedback_manager.replace(/\n/g, "<br>")}</p>` : ""}
     ${objList(f?.objectifs_s2) ? `<p><strong>Objectifs S2 :</strong></p><ul>${objList(f?.objectifs_s2)}</ul>` : ""}
     ${f?.demandes ? `<p><strong>Demandes :</strong> ${f.demandes.replace(/\n/g, "<br>")}</p>` : ""}
     ${f?.manager_notes ? `<p><strong>Notes manager :</strong> ${f.manager_notes.replace(/\n/g, "<br>")}</p>` : ""}`,
  );
}

// ── Markdown exports ────────────────────────────────────────────────────────

function exportOnboardingMarkdown(interview: CollabInterview, collaborator: Collaborator): void {
  const lines: string[] = [
    `# Onboarding — ${collaborator.first_name} ${collaborator.last_name}`,
    "",
    interview.start_date ? `**Démarrage :** ${new Date(interview.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : "",
    "",
  ];
  for (const m of interview.milestones) {
    const label = MILESTONE_LABELS[m.milestone_type];
    lines.push(`## ${label.title} — ${label.sub}`, "");
    for (const ax of m.checklist?.axes ?? []) {
      lines.push(`### ${ax.name}`, "");
      for (const it of ax.items) lines.push(`- [${it.checked ? "x" : " "}] ${it.text}`);
      lines.push("");
    }
    if (m.manager_notes) lines.push(`**Notes :** ${m.manager_notes}`, "");
    lines.push(`*${m.is_completed ? "✓ Réalisé" : "En cours"}*`, "", "---", "");
  }
  const blob = new Blob([lines.filter(Boolean).join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `onboarding-${collaborator.last_name.toLowerCase()}.md`; a.click();
  URL.revokeObjectURL(url);
}

function exportMidYearMarkdown(interview: MidYearInterview, collaborator: Collaborator): void {
  const p = interview.past; const pr = interview.present; const f = interview.future;
  const list = (arr: string[] | undefined) => (arr ?? []).filter(Boolean).map((x) => `- ${x}`).join("\n");
  const objList = (arr: MidYearObjectif[] | undefined) => (arr ?? []).map((o) => `- ${o.title}${o.rating ? ` [${o.rating}]` : ""}${o.manager_comment ? ` — ${o.manager_comment}` : ""}`).join("\n");
  const lines = [
    `# Entretien mi-année ${interview.year} — ${collaborator.first_name} ${collaborator.last_name}`,
    interview.interview_date ? `\n**Date :** ${new Date(interview.interview_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : "",
    "\n## Les 6 derniers mois",
    p?.bilan_global ? `\n**Bilan :** ${p.bilan_global}` : "",
    list(p?.moments_forts) ? `\n**Moments forts :**\n${list(p?.moments_forts)}` : "",
    list(p?.kifs) ? `\n**Kifs :**\n${list(p?.kifs)}` : "",
    list(p?.frustrations) ? `\n**Frustrations :**\n${list(p?.frustrations)}` : "",
    objList(p?.objectifs_s1) ? `\n**Objectifs S1 :**\n${objList(p?.objectifs_s1)}` : "",
    list(p?.apprentissages) ? `\n**Apprentissages :**\n${list(p?.apprentissages)}` : "",
    p?.manager_notes ? `\n**Notes manager :** ${p.manager_notes}` : "",
    "\n## Le présent",
    pr?.feeling_poste != null ? `\n**Feeling poste :** ${pr.feeling_poste}/5` : "",
    pr?.bien_etre_notes ? `\n**Bien-être :** ${pr.bien_etre_notes}` : "",
    pr?.manager_notes ? `\n**Notes manager :** ${pr.manager_notes}` : "",
    "\n## Le S2",
    list(f?.succes_si) ? `\n**Succès si :**\n${list(f?.succes_si)}` : "",
    f?.daki_drop    ? `\n**DAKI Drop :** ${f.daki_drop}` : "",
    f?.daki_add     ? `\n**DAKI Add :** ${f.daki_add}` : "",
    f?.daki_keep    ? `\n**DAKI Keep :** ${f.daki_keep}` : "",
    f?.daki_improve ? `\n**DAKI Improve :** ${f.daki_improve}` : "",
    f?.feedback_manager ? `\n**Feedback manager :** ${f.feedback_manager}` : "",
    objList(f?.objectifs_s2) ? `\n**Objectifs S2 :**\n${objList(f?.objectifs_s2)}` : "",
    f?.demandes ? `\n**Demandes :** ${f.demandes}` : "",
    f?.manager_notes ? `\n**Notes manager :** ${f.manager_notes}` : "",
  ];
  const blob = new Blob([lines.filter(Boolean).join("")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `mi-annee-${interview.year}-${collaborator.last_name.toLowerCase()}.md`; a.click();
  URL.revokeObjectURL(url);
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planStep, setPlanStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [planError, setPlanError] = useState<string | null>(null);
  const [axesOpen, setAxesOpen] = useState<boolean[]>([]);
  const [risksOpen, setRisksOpen] = useState(false);

  const [careerDraft, setCareerDraft] = useState<CareerPath | null>(null);
  const [savingCareer, setSavingCareer] = useState(false);
  const careerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [careerSelfAssessment, setCareerSelfAssessment] = useState<CareerSelfAssessment | null>(null);
  const [creatingCareerLink, setCreatingCareerLink] = useState(false);
  const [careerLinkCopied, setCareerLinkCopied] = useState(false);

  const [generatingWeek, setGeneratingWeek] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [pickerWeek, setPickerWeek]         = useState<number | null>(null);
  const [pickerStep, setPickerStep]         = useState<"type" | "confirm_1on1" | "onboarding_date" | "monthly_review_month">("type");
  const [pickerOnboardingDate, setPickerOnboardingDate] = useState<string>("");

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

  const [interviews, setInterviews]               = useState<CollabInterview[]>([]);
  const [midYearInterviews, setMidYearInterviews] = useState<MidYearInterview[]>([]);
  const [monthlyReviewInterviews, setMonthlyReviewInterviews] = useState<MonthlyReviewInterview[]>([]);
  const [creatingInterview, setCreatingInterview] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId]         = useState<string | null>(null);
  const [isAdmin, setIsAdmin]                                 = useState(false);

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

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const [collabRes, planRes, sessionsRes, companyOkrRes, collabOkrRes, manualRes, suggestionsRes, careerSelfRes, interviewsRes, profileRes] = await Promise.all([
      supabase.from("collaborators").select("*").eq("id", collaboratorId).eq("user_id", user.id).single<Collaborator>(),
      supabase.from("managerial_plans").select("*").eq("collaborator_id", collaboratorId).maybeSingle<ManagerialPlan>(),
      supabase.from("weekly_sessions").select("*").eq("collaborator_id", collaboratorId).order("week_number", { ascending: true }),
      fetch("/api/teams/okr/company"),
      fetch(`/api/teams/okr/collaborator?collaborator_id=${collaboratorId}`),
      fetch(`/api/teams/manual/${collaboratorId}`),
      fetch(`/api/teams/suggestions/${collaboratorId}`),
      fetch(`/api/teams/career/${collaboratorId}`),
      fetch(`/api/teams/entretiens/${collaboratorId}`),
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle<{ role: string }>(),
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

    const careerSelfData: CareerSelfAssessment | null = careerSelfRes.ok ? await careerSelfRes.json() : null;
    setCareerSelfAssessment(careerSelfData);

    const allInterviews: (CollabInterview | MidYearInterview | MonthlyReviewInterview)[] = interviewsRes.ok ? await interviewsRes.json() : [];
    const onboardingInterviews    = allInterviews.filter((i) => i.type === "onboarding")      as CollabInterview[];
    const midYearData             = allInterviews.filter((i) => i.type === "mid_year")         as MidYearInterview[];
    const monthlyReviewData       = allInterviews.filter((i) => i.type === "monthly_review")   as MonthlyReviewInterview[];
    setInterviews(onboardingInterviews);
    setMonthlyReviewInterviews(monthlyReviewData);
    setMidYearInterviews(midYearData);
    setIsAdmin(profileRes.data?.role === "admin");

    setLoading(false);
    if (isNew && !fetchedPlan) { navigateToTab("plan"); return; }

    // Deep-link : ?tab=entretiens&slot=N
    const slotParam = searchParams.get("slot");
    if (slotParam) {
      const slot = parseInt(slotParam, 10);
      if (!isNaN(slot)) {
        navigateToTab("entretiens");
        const linkedSession    = ((sessionsRes.data as WeeklySession[]) ?? []).find((s) => s.week_number === slot);
        const linkedOnboarding = onboardingInterviews.find((i) => i.slot_number === slot);
        const linkedMidYear    = midYearData.find((i) => i.slot_number === slot);
        if (linkedSession)    setExpandedWeek(slot);
        else if (linkedOnboarding) setSelectedInterviewId(linkedOnboarding.id);
        else if (linkedMidYear)    setSelectedInterviewId(linkedMidYear.id);
      }
    }
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

  function careerLink(token: string) {
    return `${window.location.origin}/teams/career/${token}`;
  }

  async function createCareerLink() {
    setCreatingCareerLink(true);
    try {
      const res = await fetch(`/api/teams/career/${collaboratorId}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data: CareerSelfAssessment = await res.json();
      setCareerSelfAssessment(data);
    } finally {
      setCreatingCareerLink(false);
    }
  }

  async function copyCareerLink(token: string) {
    await navigator.clipboard.writeText(careerLink(token));
    setCareerLinkCopied(true);
    setTimeout(() => setCareerLinkCopied(false), 2000);
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

  async function uploadAvatar(file: File) {
    if (!collaborator) return;
    setUploadingAvatar(true);
    setAvatarError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/teams/avatar/${collaboratorId}`, { method: "POST", body: fd });
    const json = await res.json() as { url?: string; error?: string };
    setUploadingAvatar(false);
    if (!res.ok || !json.url) { setAvatarError(json.error ?? "Erreur upload"); return; }
    setCollaborator((c) => c ? { ...c, avatar_url: json.url! } : c);
  }

  async function removeAvatar() {
    if (!collaborator) return;
    await fetch(`/api/teams/avatar/${collaboratorId}`, { method: "DELETE" });
    setCollaborator((c) => c ? { ...c, avatar_url: null } : c);
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

  function saveCareerPath(updated: CareerPath) {
    if (!plan) return;
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

  function updateSkillLevel(category: "soft_skills" | "hard_skills", index: number, level: ExpertiseLevel) {
    if (!careerDraft) return;
    saveCareerPath({
      ...careerDraft,
      [category]: careerDraft[category].map((s, i) => i === index ? { ...s, level } : s),
    });
  }

  function updateSkillField(category: "soft_skills" | "hard_skills", index: number, field: keyof CareerSkill, value: string) {
    if (!careerDraft) return;
    saveCareerPath({
      ...careerDraft,
      [category]: careerDraft[category].map((s, i) => i === index ? { ...s, [field]: value } : s),
    });
  }

  function addSkill(category: "soft_skills" | "hard_skills") {
    if (!careerDraft) return;
    const newSkill: CareerSkill = { skill: "", level: "débutant", target: "intermédiaire", expectation: "" };
    saveCareerPath({
      ...careerDraft,
      [category]: [...careerDraft[category], newSkill],
    });
  }

  function deleteSkill(category: "soft_skills" | "hard_skills", index: number) {
    if (!careerDraft) return;
    saveCareerPath({
      ...careerDraft,
      [category]: careerDraft[category].filter((_, i) => i !== index),
    });
  }

  // ── Entretiens ───────────────────────────────────────────────────────────

  async function createOnboardingInterview(slotNumber: number, startDate?: string) {
    setCreatingInterview(true);
    try {
      const res  = await fetch(`/api/teams/entretiens/${collaboratorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "onboarding", slot_number: slotNumber, start_date: startDate ?? null }),
      });
      const data = await res.json() as CollabInterview & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur de création");
      setInterviews((prev) => [...prev, data]);
      setSelectedInterviewId(data.id);
      if (startDate && collaborator) {
        downloadOnboardingICS(startDate, `${collaborator.first_name} ${collaborator.last_name}`);
      }
    } catch (e) {
      setSessionError(e instanceof Error ? e.message : "Erreur lors de la création de l'entretien");
    } finally {
      setCreatingInterview(false);
    }
  }

  async function createMidYearInterview(slotNumber: number) {
    setCreatingInterview(true);
    try {
      const res = await fetch(`/api/teams/entretiens/${collaboratorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mid_year", year: new Date().getFullYear(), slot_number: slotNumber }),
      });
      const data = await res.json() as MidYearInterview & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur de création");
      setMidYearInterviews((prev) => [...prev, data]);
      setSelectedInterviewId(data.id);
    } catch (e) {
      setSessionError(e instanceof Error ? e.message : "Erreur lors de la création de l'entretien");
    } finally {
      setCreatingInterview(false);
    }
  }

  async function createMonthlyReviewInterview(slotNumber: number, month: number, year: number) {
    setCreatingInterview(true);
    try {
      const res = await fetch(`/api/teams/entretiens/${collaboratorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "monthly_review", month, year, slot_number: slotNumber }),
      });
      const data = await res.json() as MonthlyReviewInterview & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur de création");
      setMonthlyReviewInterviews((prev) => [...prev, data]);
      setSelectedInterviewId(data.id);
    } catch (e) {
      setSessionError(e instanceof Error ? e.message : "Erreur lors de la création du bilan mensuel");
    } finally {
      setCreatingInterview(false);
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────

  async function generateWeek(weekNumber: number) {
    if (!plan) { setSessionError(t.coach.noPlanForSessions); return; }
    setGeneratingWeek(weekNumber);
    setPickerWeek(null);
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
    const locked = weekNumber > COACH_CONFIG.freeWeeksLimit && !collaborator?.is_premium && !isAdmin;
    if (locked) { setSessionError(t.coach.premiumRequired); return; }
    const existing = sessions.find((s) => s.week_number === weekNumber);
    if (existing) {
      setExpandedWeek((prev) => prev === weekNumber ? null : weekNumber);
    } else {
      setPickerStep("type");
      setPickerWeek(weekNumber);
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
    { id: "plan",      label: t.coach.tabPlan },
    { id: "entretiens", label: "Entretiens", count: (sessions.length + interviews.length + midYearInterviews.length + monthlyReviewInterviews.length) > 0 ? sessions.length + interviews.length + midYearInterviews.length + monthlyReviewInterviews.length : undefined },
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
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {collaborator.avatar_url
                ? <img src={collaborator.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold">{initials(collaborator)}</span>
              }
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
                  <button onClick={() => navigateToTab("entretiens")}
                    className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Voir les entretiens <TrendingUp size={11} />
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
          <div className="grid grid-cols-3 gap-3 mb-6">
            {([
              { id: "profile"  as SettingsSubTab, label: t.coach.tabSettingsProfile,  icon: UserRound },
              { id: "manual"   as SettingsSubTab, label: t.coach.tabSettingsManual,   icon: BookOpen },
              { id: "ateliers" as SettingsSubTab, label: t.coach.tabSettingsAteliers, icon: LayoutGrid },
            ]).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setSettingsSubTab(id)}
                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border text-sm font-medium transition-all ${
                  settingsSubTab === id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                }`}>
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ─── Profil ──────────────────────────────────────────────── */}
        {tab === "settings" && settingsSubTab === "profile" && (
          <div className="space-y-5">

            {/* Photo de profil */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {collaborator.avatar_url
                  ? <img src={collaborator.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-blue-700 dark:text-blue-300 text-lg font-semibold">{initials(collaborator)}</span>
                }
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }} />
                <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors disabled:opacity-50">
                  <Camera size={13} /> {collaborator.avatar_url ? "Changer la photo" : "Ajouter une photo"}
                </button>
                {collaborator.avatar_url && (
                  <button onClick={removeAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                    <X size={13} /> Supprimer
                  </button>
                )}
                {avatarError && <p className="text-xs text-red-500">{avatarError}</p>}
                <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG ou WebP · max 2 Mo</p>
              </div>
            </div>

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

                {/* ── Partager pour auto-évaluation ── */}
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Link2 size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                      Auto-évaluation de {collaborator.first_name}
                    </span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-400 mb-3 leading-relaxed">
                    Partagez ce lien à {collaborator.first_name} pour qu&apos;il·elle s&apos;auto-évalue sur chaque compétence.
                    Vous verrez ensuite sa perception à côté de la vôtre.
                  </p>
                  {!careerSelfAssessment ? (
                    <button
                      onClick={createCareerLink}
                      disabled={creatingCareerLink}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
                    >
                      {creatingCareerLink ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                      {creatingCareerLink ? "Génération du lien…" : "Générer le lien"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono truncate text-green-700 dark:text-green-300 bg-white/60 dark:bg-green-900/40 border border-green-200 dark:border-green-700 px-3 py-2 rounded-xl">
                        {typeof window !== "undefined" ? careerLink(careerSelfAssessment.token) : "…"}
                      </code>
                      <button
                        onClick={() => copyCareerLink(careerSelfAssessment.token)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-green-900/50 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-xs font-medium rounded-xl hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
                      >
                        {careerLinkCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        {careerLinkCopied ? t.common.copied : t.common.copy}
                      </button>
                    </div>
                  )}
                  {careerSelfAssessment?.completed_at && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-medium">
                      <Check size={11} />
                      Auto-évaluation reçue le{" "}
                      {new Date(careerSelfAssessment.completed_at).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}
                    </div>
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
                    <span className="w-3.5 h-3.5 rounded-full bg-violet-500 inline-block" /> {t.coach.currentLevelLabel} (manager)
                  </span>
                  {careerSelfAssessment?.completed_at && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-green-400 inline-block" /> Auto-éval. ({collaborator.first_name})
                    </span>
                  )}
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
                      <SkillRow
                        key={`soft-${i}`}
                        skill={skill as CareerSkill}
                        selfLevel={(careerSelfAssessment?.self_levels as CareerSelfLevels | undefined)?.[skill.skill]}
                        defaultEditing={!skill.skill}
                        onUpdate={(level) => updateSkillLevel("soft_skills", i, level)}
                        onFieldUpdate={(field, value) => updateSkillField("soft_skills", i, field, value)}
                        onDelete={() => deleteSkill("soft_skills", i)}
                      />
                    ))}
                  </div>
                  <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-800/60">
                    <button onClick={() => addSkill("soft_skills")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                      <Plus size={12} /> Ajouter un soft skill
                    </button>
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
                      <SkillRow
                        key={`hard-${i}`}
                        skill={skill as CareerSkill}
                        selfLevel={(careerSelfAssessment?.self_levels as CareerSelfLevels | undefined)?.[skill.skill]}
                        defaultEditing={!skill.skill}
                        onUpdate={(level) => updateSkillLevel("hard_skills", i, level)}
                        onFieldUpdate={(field, value) => updateSkillField("hard_skills", i, field, value)}
                        onDelete={() => deleteSkill("hard_skills", i)}
                      />
                    ))}
                  </div>
                  <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-800/60">
                    <button onClick={() => addSkill("hard_skills")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                      <Plus size={12} /> Ajouter un hard skill
                    </button>
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

        {/* ─── Entretiens ──────────────────────────────────────────── */}
        {tab === "entretiens" && (
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

            {/* Grille unifiée */}
            {(() => {
              const usedSlots = [
                ...interviews.map((i) => i.slot_number).filter(Boolean) as number[],
                ...midYearInterviews.map((i) => i.slot_number).filter(Boolean) as number[],
                ...monthlyReviewInterviews.map((i) => i.slot_number).filter(Boolean) as number[],
              ];
              const totalSlots = usedSlots.length > 0 ? Math.max(12, ...usedSlots) : 12;

              return (
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: totalSlots }, (_, i) => i + 1).map((slot) => {
                    const session       = sessions.find((s) => s.week_number === slot);
                    const onboarding   = interviews.find((i) => i.slot_number === slot);
                    const midYear      = midYearInterviews.find((i) => i.slot_number === slot);
                    const monthlyReview = monthlyReviewInterviews.find((i) => i.slot_number === slot);

                    const type = session ? "session" : onboarding ? "onboarding" : midYear ? "midyear" : monthlyReview ? "monthly" : "empty";
                    const hasContent = type !== "empty";

                    // Premium lock: vide + pas premium → lock visuel seulement sur les carrés sans contenu
                    const premiumLocked = !hasContent && slot > COACH_CONFIG.freeWeeksLimit && !collaborator.is_premium && !isAdmin;
                    const isGenerating  = generatingWeek === slot;

                    const isSelected =
                      pickerWeek === slot ||
                      (type === "session"    && expandedWeek === slot) ||
                      (type === "onboarding" && selectedInterviewId === onboarding?.id) ||
                      (type === "midyear"    && selectedInterviewId === midYear?.id) ||
                      (type === "monthly"    && selectedInterviewId === monthlyReview?.id);

                    // Indicateur de complétion
                    const isDone =
                      (type === "session"    && !!session?.is_completed) ||
                      (type === "onboarding" && !!onboarding?.milestones.every((m) => m.is_completed)) ||
                      (type === "midyear"    && midYear?.status === "completed") ||
                      (type === "monthly"    && monthlyReview?.status === "completed");
                    const inProgress = hasContent && !isDone;

                    // Label de type
                    const typeLabel =
                      type === "session"    ? "1:1" :
                      type === "onboarding" ? "Onboarding" :
                      type === "midyear"    ? `Mi-${midYear!.year}` :
                      type === "monthly"    ? `${MONTH_NAMES[(monthlyReview!.month ?? 1) - 1]}` : null;

                    function handleSlotClick() {
                      if (isGenerating) return;
                      if (type === "session") {
                        setExpandedWeek((prev) => prev === slot ? null : slot);
                      } else if (type === "onboarding") {
                        setSelectedInterviewId(onboarding!.id);
                      } else if (type === "midyear") {
                        setSelectedInterviewId(midYear!.id);
                      } else if (type === "monthly") {
                        setSelectedInterviewId(monthlyReview!.id);
                      } else {
                        if (!plan) { setSessionError(t.coach.noPlanForSessions); return; }
                        setPickerStep("type");
                        setPickerWeek(slot);
                      }
                    }

                    // Couleurs selon le type
                    const isMid     = type === "midyear";
                    const isMonthly = type === "monthly";
                    const borderCls = isSelected
                      ? isMid
                        ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-200 dark:ring-indigo-800"
                        : isMonthly
                        ? "border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-200 dark:ring-emerald-800"
                        : "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-200 dark:ring-blue-800"
                      : premiumLocked
                      ? "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-50 cursor-not-allowed"
                      : isDone
                      ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 hover:border-green-400"
                      : hasContent
                      ? isMid
                        ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 hover:border-indigo-300"
                        : isMonthly
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300"
                        : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:border-blue-300"
                      : "border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700";

                    const numCls = isSelected
                      ? isMid ? "text-indigo-600 dark:text-indigo-400" : isMonthly ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                      : isDone ? "text-green-600 dark:text-green-400"
                      : hasContent
                      ? isMid ? "text-indigo-600 dark:text-indigo-400" : isMonthly ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500";

                    return (
                      <button key={slot}
                        onClick={handleSlotClick}
                        disabled={isGenerating || premiumLocked}
                        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 aspect-square transition-all ${borderCls}`}
                      >
                        {isGenerating ? (
                          <Loader2 size={18} className="animate-spin text-blue-500" />
                        ) : premiumLocked ? (
                          <>
                            <Lock size={13} className="text-gray-400 mb-0.5" />
                            <span className="text-xs font-medium text-gray-400">{slot}</span>
                          </>
                        ) : !hasContent ? (
                          // Vide non bloqué : numéro seul
                          <span className={`text-2xl font-bold leading-none ${numCls}`}>{slot}</span>
                        ) : isDone ? (
                          // Terminé : check seul
                          <Check size={28} className="text-green-500" />
                        ) : (
                          // En cours : icône + label, sans numéro
                          <>
                            {type === "session"
                              ? <Handshake size={24} className="text-blue-400 my-1" />
                              : type === "onboarding"
                              ? <Rocket size={24} className="text-blue-400 my-1" />
                              : type === "monthly"
                              ? <TrendingUp size={24} className="text-emerald-400 my-1" />
                              : <BarChart3 size={24} className="text-indigo-400 my-1" />
                            }
                            <span className="text-xl leading-none font-medium text-gray-400 dark:text-gray-500 truncate max-w-full px-1">
                              {typeLabel}
                            </span>
                          </>
                        )}
                        {/* Crown pour les cases premium vides */}
                        {slot > COACH_CONFIG.freeWeeksLimit && !hasContent && !premiumLocked && (
                          <Crown size={9} className="absolute top-1.5 right-1.5 text-amber-400" />
                        )}
                      </button>
                    );
                  })}

                  {/* Carrés legacy : interviews sans slot_number */}
                  {interviews.filter((i) => !i.slot_number).map((interview) => (
                    <button key={interview.id} onClick={() => setSelectedInterviewId(interview.id)}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 aspect-square transition-all ${
                        selectedInterviewId === interview.id
                          ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-200 dark:ring-blue-800"
                          : interview.milestones.every((m) => m.is_completed)
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 hover:border-green-400"
                          : "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-300"
                      }`}>
                      <Rocket size={12} className="text-blue-500 mb-0.5" />
                      {interview.milestones.every((m) => m.is_completed)
                        ? <Check size={11} className="text-green-500 my-0.5" />
                        : <span className="w-1.5 h-1.5 rounded-full bg-blue-400 my-0.5" />}
                      <span className="text-[9px] leading-none font-medium text-gray-400">Onboarding</span>
                    </button>
                  ))}
                  {midYearInterviews.filter((i) => !i.slot_number).map((myi) => (
                    <button key={myi.id} onClick={() => setSelectedInterviewId(myi.id)}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 aspect-square transition-all ${
                        selectedInterviewId === myi.id
                          ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-200 dark:ring-indigo-800"
                          : myi.status === "completed"
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 hover:border-green-400"
                          : "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 hover:border-indigo-300"
                      }`}>
                      <BarChart3 size={12} className="text-indigo-500 mb-0.5" />
                      {myi.status === "completed"
                        ? <Check size={11} className="text-green-500 my-0.5" />
                        : <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 my-0.5" />}
                      <span className="text-[9px] leading-none font-medium text-gray-400">Mi-{myi.year}</span>
                    </button>
                  ))}
                  {monthlyReviewInterviews.filter((i) => !i.slot_number).map((mr) => (
                    <button key={mr.id} onClick={() => setSelectedInterviewId(mr.id)}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 aspect-square transition-all ${
                        selectedInterviewId === mr.id
                          ? "border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-200 dark:ring-emerald-800"
                          : mr.status === "completed"
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 hover:border-green-400"
                          : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300"
                      }`}>
                      <TrendingUp size={12} className="text-emerald-500 mb-0.5" />
                      {mr.status === "completed"
                        ? <Check size={11} className="text-green-500 my-0.5" />
                        : <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 my-0.5" />}
                      <span className="text-[9px] leading-none font-medium text-gray-400">{MONTH_NAMES[(mr.month ?? 1) - 1]}</span>
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Légende */}
            <div className="flex items-center gap-5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-dashed border-gray-300 dark:border-gray-600" /> {t.coach.weekNotGenerated}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30" /> {t.common.inProgress}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30" /> {t.coach.weekCompleted}</span>
              {!isAdmin && <span className="flex items-center gap-1.5"><Lock size={10} /> {t.coach.premiumRequired}</span>}
            </div>

            {/* Bloc premium — masqué pour les admins */}
            {!isAdmin && !collaborator.is_premium && (
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
            )}

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

        {/* ─── Modal — contenu d'un entretien ─────────────────────── */}
        {selectedInterviewId && (() => {
          const onboarding    = interviews.find((i) => i.id === selectedInterviewId);
          const midYear       = midYearInterviews.find((i) => i.id === selectedInterviewId);
          const monthlyReview = monthlyReviewInterviews.find((i) => i.id === selectedInterviewId);
          if (!onboarding && !midYear && !monthlyReview) return null;
          return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="min-h-full flex items-start justify-center p-4 py-6">
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => setSelectedInterviewId(null)}
                />
                <div className="relative w-full max-w-2xl z-10">
                  <div className="flex items-center justify-end mb-2">
                    <button
                      onClick={() => setSelectedInterviewId(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {onboarding && (
                    <OnboardingCard
                      interview={onboarding}
                      collaborator={collaborator!}
                      onUpdate={(updated) => setInterviews((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
                    />
                  )}
                  {midYear && (
                    <MidYearCard
                      interview={midYear}
                      collaboratorId={collaboratorId}
                      collaborator={collaborator!}
                      onUpdate={(updated) => setMidYearInterviews((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
                    />
                  )}
                  {monthlyReview && (
                    <MonthlyReviewCard
                      interview={monthlyReview}
                      collaboratorId={collaboratorId}
                      onUpdate={(updated) => setMonthlyReviewInterviews((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ─── Modal — picker type d'entretien (2 étapes) ─────────── */}
        {pickerWeek !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setPickerWeek(null)}
            />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
              {pickerStep === "type" && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      Semaine {pickerWeek} — quel type ?
                    </p>
                    <button
                      onClick={() => setPickerWeek(null)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setPickerStep("confirm_1on1")}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">1:1 hebdomadaire</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Suivi régulier généré par l&apos;IA</p>
                      </div>
                      {pickerWeek !== null && pickerWeek > COACH_CONFIG.freeWeeksLimit && !collaborator.is_premium && !isAdmin && (
                        <Crown size={13} className="text-amber-400 flex-shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={() => { setPickerOnboardingDate(""); setPickerStep("onboarding_date"); }}
                      disabled={creatingInterview}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                        <Rocket size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Onboarding</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Jalons J7, J30 et J90</p>
                      </div>
                    </button>
                    <button
                      onClick={async () => {
                        const slot = pickerWeek!;
                        setPickerWeek(null);
                        await createMidYearInterview(slot);
                      }}
                      disabled={creatingInterview}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                        <BarChart3 size={18} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Entretien mi-année</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Bilan S1 · Présent · Objectifs S2</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setPickerStep("monthly_review_month")}
                      disabled={creatingInterview}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Bilan mensuel</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Apprentissages · Progression · Focus</p>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {pickerStep === "onboarding_date" && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setPickerStep("type")}
                      className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      ← Retour
                    </button>
                    <button onClick={() => setPickerWeek(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                      <Rocket size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Onboarding</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date de démarrage</p>
                    </div>
                  </div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                    Date d&apos;arrivée du collaborateur
                  </label>
                  <input
                    type="date"
                    value={pickerOnboardingDate}
                    onChange={(e) => setPickerOnboardingDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  />
                  {pickerOnboardingDate && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-1.5">
                      <CalendarDays size={11} /> Invitations J+7, J+30 et J+90 téléchargées automatiquement
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const slot = pickerWeek!;
                        const date = pickerOnboardingDate;
                        setPickerWeek(null);
                        setPickerOnboardingDate("");
                        await createOnboardingInterview(slot, date || undefined);
                      }}
                      disabled={creatingInterview}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors"
                    >
                      {creatingInterview ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
                      Créer l&apos;onboarding
                    </button>
                    <button onClick={() => setPickerWeek(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      Annuler
                    </button>
                  </div>
                </>
              )}

              {pickerStep === "monthly_review_month" && (() => {
                const now = new Date();
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setPickerStep("type")}
                        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        ← Retour
                      </button>
                      <button onClick={() => setPickerWeek(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Bilan mensuel</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Quel mois ?</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {MONTH_NAMES.map((name, idx) => {
                        const m = idx + 1;
                        const isCurrentMonth = m === now.getMonth() + 1;
                        return (
                          <button
                            key={m}
                            onClick={async () => {
                              const slot = pickerWeek!;
                              setPickerWeek(null);
                              await createMonthlyReviewInterview(slot, m, now.getFullYear());
                            }}
                            disabled={creatingInterview}
                            className={`py-2 text-sm font-medium rounded-xl border transition-all disabled:opacity-50 ${
                              isCurrentMonth
                                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{now.getFullYear()}</p>
                  </>
                );
              })()}

              {pickerStep === "confirm_1on1" && (() => {
                const isLockedForSessions = pickerWeek !== null && pickerWeek > COACH_CONFIG.freeWeeksLimit && !collaborator.is_premium && !isAdmin;
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setPickerStep("type")}
                        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        ← Retour
                      </button>
                      <button
                        onClick={() => setPickerWeek(null)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      {t.coach.generateSessionPrefix} {t.coach.weekLabel} {pickerWeek}
                    </p>
                    {isLockedForSessions ? (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                          <Crown size={14} /> {t.coach.premiumRequired}
                        </p>
                        <Link href="/premium"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-200 underline underline-offset-2">
                          {t.coach.becomePremiumBtn} →
                        </Link>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                          {t.coach.generateSessionAiDescPrefix} {collaborator.first_name}
                          {t.coach.generateSessionAiDescMiddle}
                          {sessions.length > 0 ? ` ${t.coach.generateSessionAiDescWithPrev}` : "."}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { generateWeek(pickerWeek!); }}
                            disabled={generatingWeek !== null}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            {generatingWeek === pickerWeek ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                            {generatingWeek === pickerWeek ? t.coach.generatingSessionBtn : t.coach.generateSessionBtn}
                          </button>
                          <button
                            onClick={() => setPickerWeek(null)}
                            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            {t.common.cancel}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ─── Modal — session 1:1 ──────────────────────────────────── */}
        {expandedSession && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="min-h-full flex items-start justify-center p-4 py-6">
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setExpandedWeek(null)}
              />
              <div className="relative w-full max-w-2xl z-10">
                <div className="flex items-center justify-end mb-2">
                  <button
                    onClick={() => setExpandedWeek(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-2xl overflow-hidden shadow-sm">
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
                  </div>

                  <div className="px-6 py-5 space-y-5">
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
                      <button onClick={() => exportSessionPDF(expandedSession, collaborator)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Download size={13} /> PDF
                      </button>
                      <button onClick={() => setExpandedWeek(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <X size={13} /> {t.common.close}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
