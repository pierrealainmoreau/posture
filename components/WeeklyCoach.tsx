"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays, Check, ChevronRight, Coffee,
  Heart, Loader2, MessageCircle, Sparkles, Target, UserPlus, Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

// ── Need types ────────────────────────────────────────────────────────────────

const NEED_TYPES = [
  {
    id: "cohesion",
    labelKey: "needCohesion",
    Icon: Users,
    iconBg: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-700 dark:text-blue-400",
    selectedRing: "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/40",
  },
  {
    id: "performance",
    labelKey: "needPerformance",
    Icon: Target,
    iconBg: "bg-violet-50 dark:bg-violet-950",
    iconColor: "text-violet-700 dark:text-violet-400",
    selectedRing: "border-violet-500 dark:border-violet-400 bg-violet-50/50 dark:bg-violet-950/40",
  },
  {
    id: "wellbeing",
    labelKey: "needWellbeing",
    Icon: Heart,
    iconBg: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-700 dark:text-emerald-400",
    selectedRing: "border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40",
  },
  {
    id: "communication",
    labelKey: "needCommunication",
    Icon: MessageCircle,
    iconBg: "bg-amber-50 dark:bg-amber-950",
    iconColor: "text-amber-700 dark:text-amber-400",
    selectedRing: "border-amber-500 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-950/40",
  },
  {
    id: "onboarding",
    labelKey: "needOnboarding",
    Icon: UserPlus,
    iconBg: "bg-cyan-50 dark:bg-cyan-950",
    iconColor: "text-cyan-700 dark:text-cyan-400",
    selectedRing: "border-cyan-500 dark:border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/40",
  },
] as const;

const CATEGORY_COLOR: Record<string, string> = {
  "Mini-jeu":       "bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400",
  "Rétrospective":  "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
  "Feedback":       "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
  "Quiz":           "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
  "Réunion":        "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
  "Atelier":        "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400",
  "Reconnaissance": "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400",
  "1:1 Coach":      "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
};

const CATEGORY_I18N: Record<string, string> = {
  "Mini-jeu":       "catMinigame",
  "Rétrospective":  "catRetrospective",
  "Feedback":       "catFeedback",
  "Quiz":           "catQuiz",
  "Réunion":        "catMeeting",
  "Atelier":        "catWorkshop",
  "Reconnaissance": "catRecognition",
  "1:1 Coach":      "catCoach",
};

const DAY_LABELS = ["L", "M", "M", "J", "V"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface WeeklyCoachData {
  configured: boolean;
  need_type?: string;
  is_weekend?: boolean;
  template?: {
    title: string;
    description?: string;
    category: string;
    action_type: string;
    route: string;
  } | null;
  completed?: boolean;
  week_progress?: { day: number; completed: boolean }[];
}

// ── Main component ────────────────────────────────────────────────────────────

export function WeeklyCoach() {
  const { t } = useI18n();
  const wc = t.weeklyCoach as Record<string, string>;

  const [data, setData] = useState<WeeklyCoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/weekly-coach/today");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setSetupMode(!json.configured);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const onFocus = () => fetchData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchData]);

  function handleEditRequest() {
    if (data?.completed) {
      setShowConfirmModal(true);
    } else {
      setSetupMode(true);
    }
  }

  async function saveNeed() {
    if (!selectedNeed) return;
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/weekly-coach/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ need_type: selectedNeed }),
        }),
        fetch("/api/weekly-coach/complete", { method: "DELETE" }),
      ]);
      await fetchData();
      setSetupMode(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-xl p-6 flex items-center justify-center min-h-[220px]">
        <Loader2 size={18} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Setup ────────────────────────────────────────────────────────────────

  if (setupMode || !data?.configured) {
    return (
      <div className="rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarDays size={18} className="text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">Weekly Coach</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{t.weeklyCoach.mainNeed}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {NEED_TYPES.map((need) => {
            const { Icon } = need;
            const isSelected = selectedNeed === need.id;
            return (
              <button
                key={need.id}
                onClick={() => setSelectedNeed(need.id)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? `border-2 ${need.selectedRing}`
                    : "border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${need.iconBg}`}>
                  <Icon size={15} className={need.iconColor} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight">{wc[need.labelKey]}</p>
                </div>
                {isSelected && (
                  <Check size={13} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={saveNeed}
          disabled={!selectedNeed || saving}
          className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Sparkles size={13} />
          )}
          {t.weeklyCoach.activate}
        </button>
      </div>
    );
  }

  const progress = data.week_progress ?? [];
  const weekDone = progress.filter((p) => p.completed).length;
  const todayJsDay = new Date().getDay(); // 0=Dim, 1=Lun…6=Sam
  const weekProgressLabel = `${weekDone}${t.weeklyCoach.weekProgress}`;

  // ── Modal de confirmation changement de besoin ────────────────────────────

  const confirmModal = showConfirmModal ? (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 rounded-xl">
      <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950 rounded-xl flex items-center justify-center mb-4">
        <CalendarDays size={20} className="text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 text-center">
        {t.weeklyCoach.changeNeed}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-5 text-center">
        {t.weeklyCoach.changeNeedDesc}
      </p>
      <div className="flex gap-2 w-full">
        <button
          onClick={() => setShowConfirmModal(false)}
          className="flex-1 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {t.common.cancel}
        </button>
        <button
          onClick={() => { setShowConfirmModal(false); setSetupMode(true); }}
          className="flex-1 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
        >
          {t.weeklyCoach.continue}
        </button>
      </div>
    </div>
  ) : null;

  // ── Weekend ───────────────────────────────────────────────────────────────

  if (data.is_weekend) {
    return (
      <div className="relative overflow-hidden rounded-xl p-5">
        {confirmModal}
        <CoachHeader onEdit={handleEditRequest} weekProgressLabel={weekProgressLabel} editLabel={t.weeklyCoach.edit} />
        <WeekDots progress={progress} todayJsDay={null} />
        <div className="mt-4 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Coffee size={17} className="text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.weeklyCoach.weekend}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{t.weeklyCoach.weekendDesc}</p>
          </div>
        </div>
      </div>
    );
  }

  const template = data.template;
  const catLabel = wc[CATEGORY_I18N[template?.category ?? ""] ?? ""] ?? template?.category ?? "";

  // ── Active / completed ────────────────────────────────────────────────────

  return (
    <div className="relative overflow-hidden rounded-xl p-5">
      {confirmModal}
      <CoachHeader onEdit={handleEditRequest} weekProgressLabel={weekProgressLabel} editLabel={t.weeklyCoach.edit} />
      <WeekDots progress={progress} todayJsDay={todayJsDay} />

      {!template ? (
        <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500 text-center py-3">
          {t.weeklyCoach.noAction}
        </p>
      ) : data.completed ? (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Check size={11} className="text-white" />
            </div>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400">{t.weeklyCoach.completed}</p>
          </div>
          <p className="text-[11px] text-green-600 dark:text-green-500 leading-relaxed pl-7">{template.title}</p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500 mb-2">
            {t.weeklyCoach.actionOfDay}
          </p>
          <Link
            href={template.route}
            className="group flex flex-col p-4 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded-xl transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  CATEGORY_COLOR[template.category] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {catLabel}
              </span>
              <ChevronRight
                size={14}
                className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
              />
            </div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug">{template.title}</p>
            {template.description && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {template.description}
              </p>
            )}
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CoachHeader({
  onEdit,
  weekProgressLabel,
  editLabel,
}: {
  onEdit: () => void;
  weekProgressLabel: string;
  editLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
          <CalendarDays size={18} className="text-blue-700 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900 dark:text-white">Weekly Coach</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{weekProgressLabel}</p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        {editLabel}
      </button>
    </div>
  );
}

function WeekDots({
  progress,
  todayJsDay,
}: {
  progress: { day: number; completed: boolean }[];
  todayJsDay: number | null;
}) {
  return (
    <div className="flex items-center gap-2 justify-between mb-0">
      {DAY_LABELS.map((label, i) => {
        const day = i + 1; // 1=Lun…5=Ven
        const p = progress.find((p) => p.day === day);
        const isDone = p?.completed ?? false;
        const isToday = todayJsDay === day;

        return (
          <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isDone
                  ? "bg-blue-700 dark:bg-blue-600"
                  : isToday
                  ? "bg-blue-100 dark:bg-blue-950 border-2 border-blue-700 dark:border-blue-500"
                  : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {isDone ? (
                <Check size={12} className="text-white" />
              ) : isToday ? (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-700 dark:bg-blue-500 block" />
              ) : null}
            </div>
            <span
              className={`text-[9px] font-medium ${
                isToday ? "text-blue-700 dark:text-blue-400" : "text-gray-400 dark:text-gray-600"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
