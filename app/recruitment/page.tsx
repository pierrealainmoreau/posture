"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  UserCheck,
  Briefcase,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Download,
  Copy,
  Check,
  Loader2,
  FileText,
  History,
  Clock,
  Trash2,
  X,
  ClipboardList,
  ListChecks,
} from "lucide-react";
import { Header } from "@/components/Header";
import { TrackUsage } from "@/components/TrackUsage";
import { UsageIndicator } from "@/components/UsageIndicator";
import { useI18n } from "@/lib/i18n";
import type {
  RecruitmentMode,
  RecruiterQuestion,
  RecruiterResponse,
  CandidateProbableQuestion,
  CandidateQuestionsToAsk,
  CandidateResponse,
  SeniorityLevel,
  PostType,
  CandidatePriority,
  ContractType,
  JobDescriptionResponse,
} from "@/lib/types";
import { CONTRACT_LABELS } from "@/lib/types";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y";

const LABEL_CLASS =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <label htmlFor={htmlFor} className={LABEL_CLASS}>
      {children}{" "}
      {required ? (
        <span className="text-red-400 font-normal">*</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 font-normal">
          ({t.common.optional})
        </span>
      )}
    </label>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-blue-700 text-white"
              : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PreparationTips({ tips }: { tips: string[] }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const THRESHOLD = 3;
  const visible = expanded ? tips : tips.slice(0, THRESHOLD);
  const hasMore = tips.length > THRESHOLD;

  return (
    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-5">
      <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 text-sm">
        {t.recruitment.prepTips}
      </h3>
      <ul className="space-y-1.5">
        {visible.map((tip, i) => (
          <li
            key={i}
            className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2"
          >
            <span className="text-blue-400 dark:text-blue-500 mt-0.5 flex-shrink-0">
              •
            </span>
            {tip}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={13} /> {t.recruitment.seeLess}
            </>
          ) : (
            <>
              <ChevronDown size={13} /> {t.recruitment.seeMore} ({tips.length - THRESHOLD})
            </>
          )}
        </button>
      )}
    </div>
  );
}

function ExportActions({
  onCopy,
  onDownload,
  copied,
}: {
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {copied ? (
          <>
            <Check size={13} className="text-green-500" />
            {t.common.copied}
          </>
        ) : (
          <>
            <Copy size={13} />
            {t.recruitment.copyMarkdown}
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onDownload}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
      >
        <Download size={13} />
        {t.recruitment.downloadMd}
      </button>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          </div>
          <div className="ml-10 space-y-2">
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Recruiter components ─────────────────────────────────────────────────────

const THEME_COLORS: Record<string, string> = {
  Comportement:
    "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  Compétences:
    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  "Fit culturel":
    "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  Motivation:
    "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
};

function themeBadgeClass(theme: string): string {
  return (
    THEME_COLORS[theme] ??
    "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
  );
}

function RecruiterQuestionCard({
  question,
  index,
}: {
  question: RecruiterQuestion;
  index: number;
}) {
  const { t } = useI18n();
  const [followUpOpen, setFollowUpOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-2">
        <span className="flex-shrink-0 w-7 h-7 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-semibold">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${themeBadgeClass(question.theme)}`}
            >
              {question.theme}
            </span>
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-snug">
            {question.question}
          </p>
        </div>
      </div>

      {question.objective && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-4 ml-10">
          {question.objective}
        </p>
      )}

      {question.follow_up.length > 0 && (
        <div className="ml-10 mb-4">
          <button
            type="button"
            onClick={() => setFollowUpOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {followUpOpen ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
            {followUpOpen ? t.recruitment.hideFollowUps : t.recruitment.showFollowUps} (
            {question.follow_up.length})
          </button>
          {followUpOpen && (
            <ul className="mt-2 space-y-1.5 pl-2 border-l-2 border-blue-100 dark:border-blue-900">
              {question.follow_up.map((fu, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  {fu}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(question.green_flags.length > 0 || question.red_flags.length > 0) && (
        <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.green_flags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1.5 flex items-center gap-1">
                <CheckCircle size={13} />
                {t.recruitment.greenFlags}
              </p>
              <ul className="space-y-1">
                {question.green_flags.map((flag, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5"
                  >
                    <span className="text-green-500 mt-0.5 flex-shrink-0">
                      ✓
                    </span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {question.red_flags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                {t.recruitment.redFlags}
              </p>
              <ul className="space-y-1">
                {question.red_flags.map((flag, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5"
                  >
                    <span className="text-red-500 mt-0.5 flex-shrink-0">
                      ✗
                    </span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Candidate components ─────────────────────────────────────────────────────

function CandidateQuestionCard({
  question,
  index,
}: {
  question: CandidateProbableQuestion;
  index: number;
}) {
  const { t } = useI18n();
  const [starOpen, setStarOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-2">
        <span className="flex-shrink-0 w-7 h-7 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-semibold">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              {question.theme}
            </span>
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-snug">
            {question.question}
          </p>
        </div>
      </div>

      {question.how_to_answer && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4 ml-10 leading-relaxed">
          {question.how_to_answer}
        </p>
      )}

      {question.star_example && (
        <div className="ml-10">
          <button
            type="button"
            onClick={() => setStarOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {starOpen ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
            {t.recruitment.showExample}
          </button>
          {starOpen && (
            <div className="mt-2 pl-3 border-l-2 border-blue-100 dark:border-blue-900 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {question.star_example}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CandidateQuestionsToAskGroup({
  group,
}: {
  group: CandidateQuestionsToAsk;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        {group.theme}
      </h4>
      <ul className="space-y-2">
        {group.questions.map((q, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <MessageSquare
              size={14}
              className="text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5"
            />
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <FileText size={24} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500">
        {t.recruitment.formPrompt}
      </p>
    </div>
  );
}

// ─── Form state interfaces ────────────────────────────────────────────────────

interface RecruiterFormState {
  jobTitle: string;
  seniority: SeniorityLevel;
  postType: PostType;
  keySkills: string;
  context: string;
}

interface CandidateFormState {
  companyName: string;
  jobTitle: string;
  priority: CandidatePriority;
  jobUrl: string;
}

interface JobDescriptionFormState {
  jobTitle: string;
  contractType: ContractType;
  seniority: SeniorityLevel;
  department: string;
  teamContext: string;
  keyMissions: string;
  technicalSkills: string;
  softSkills: string;
  perks: string;
}

// ─── History ──────────────────────────────────────────────────────────────────

interface RecruitmentHistoryEntry {
  id: string;
  createdAt: number;
  mode: RecruitmentMode;
  recruiterForm?: RecruiterFormState;
  candidateForm?: CandidateFormState;
  jobDescriptionForm?: JobDescriptionFormState;
  result: RecruiterResponse | CandidateResponse | JobDescriptionResponse;
}

const HISTORY_KEY = "posture_recruitment_history";
const HISTORY_MAX = 20;

function loadHistory(): RecruitmentHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}
function persistHistory(entries: RecruitmentHistoryEntry[]) {
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

function HistoryPanel({
  history,
  onLoad,
  onDelete,
  onClear,
}: {
  history: RecruitmentHistoryEntry[];
  onLoad: (e: RecruitmentHistoryEntry) => void;
  onDelete: (id: string, ev: React.MouseEvent) => void;
  onClear: () => void;
}) {
  const { t, locale } = useI18n();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock size={24} className="mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">{t.recruitment.noHistory}</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {t.recruitment.noHistoryDesc}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-gray-400 dark:text-gray-500">
          {history.length} {history.length > 1 ? t.recruitment.savedPlural : t.recruitment.savedSingular}
        </p>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[12px] text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} /> {t.common.clearAll}
        </button>
      </div>
      <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
        {history.map((entry) => {
          const isRecruiter = entry.mode === "recruiter";
          const isJobDesc = entry.mode === "job-description";
          const label = isRecruiter
            ? entry.recruiterForm?.jobTitle
            : isJobDesc
            ? entry.jobDescriptionForm?.jobTitle
            : `${entry.candidateForm?.companyName} — ${entry.candidateForm?.jobTitle}`;
          const sub = isRecruiter
            ? entry.recruiterForm?.keySkills
            : isJobDesc
            ? entry.jobDescriptionForm ? CONTRACT_LABELS[entry.jobDescriptionForm.contractType] : ""
            : entry.candidateForm
            ? t.recruitment.priorities[entry.candidateForm.priority]
            : "";
          const modeLabel = isRecruiter
            ? t.recruitment.modeLabels.recruiter
            : isJobDesc
            ? t.recruitment.modeLabels.jobDescription
            : t.recruitment.modeLabels.candidate;

          return (
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
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  isRecruiter
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    : isJobDesc
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                }`}>
                  {isRecruiter ? <UserCheck size={10} /> : isJobDesc ? <ClipboardList size={10} /> : <Briefcase size={10} />}
                  {modeLabel}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{relativeDate(entry.createdAt, locale)}</span>
              </div>

              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug pr-5 line-clamp-1">
                {label}
              </p>
              {sub && (
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{sub}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function RecruitmentPageInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab");
  const [mode, setMode] = useState<RecruitmentMode>(
    initialTab === "recruiter" || initialTab === "candidate" || initialTab === "job-description"
      ? initialTab
      : "recruiter"
  );

  function changeMode(m: RecruitmentMode) {
    setMode(m);
    setResult(null);
    setError(null);
    router.replace(`/recruitment?tab=${m}`, { scroll: false });
  }

  const [recruiterForm, setRecruiterForm] = useState<RecruiterFormState>({
    jobTitle: "",
    seniority: "4-5",
    postType: "mixte",
    keySkills: "",
    context: "",
  });

  const [candidateForm, setCandidateForm] = useState<CandidateFormState>({
    companyName: "",
    jobTitle: "",
    priority: "career",
    jobUrl: "",
  });

  const [jobDescriptionForm, setJobDescriptionForm] = useState<JobDescriptionFormState>({
    jobTitle: "",
    contractType: "cdi",
    seniority: "4-5",
    department: "",
    teamContext: "",
    keyMissions: "",
    technicalSkills: "",
    softSkills: "",
    perks: "",
  });

  const [result, setResult] = useState<
    RecruiterResponse | CandidateResponse | JobDescriptionResponse | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState<RecruitmentHistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => { setHistory(loadHistory()); }, []);

  function saveToHistory(entry: Omit<RecruitmentHistoryEntry, "id" | "createdAt">) {
    const full: RecruitmentHistoryEntry = { id: crypto.randomUUID(), createdAt: Date.now(), ...entry };
    const updated = [full, ...history].slice(0, HISTORY_MAX);
    setHistory(updated);
    persistHistory(updated);
  }

  function loadEntry(entry: RecruitmentHistoryEntry) {
    setMode(entry.mode);
    router.replace(`/recruitment?tab=${entry.mode}`, { scroll: false });
    if (entry.recruiterForm) setRecruiterForm(entry.recruiterForm);
    if (entry.candidateForm) setCandidateForm(entry.candidateForm);
    if (entry.jobDescriptionForm) setJobDescriptionForm(entry.jobDescriptionForm);
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

  function buildRecruiterMarkdown(r: RecruiterResponse, jobTitle: string): string {
    const lines: string[] = [`# ${t.recruitment.recruiterGuide} — ${jobTitle}`, ""];

    if (r.preparation_tips.length > 0) {
      lines.push(`## ${t.recruitment.prepTips}`, "");
      r.preparation_tips.forEach((tip) => lines.push(`- ${tip}`));
      lines.push("");
    }

    if (r.bias_warnings.length > 0) {
      lines.push(`## ⚠ ${t.recruitment.biasWarning}`, "");
      r.bias_warnings.forEach((w) => lines.push(`- ${w}`));
      lines.push("");
    }

    if (r.questions.length > 0) {
      lines.push(`## ${t.recruitment.generateQuestions}`, "");
      r.questions.forEach((q, i) => {
        lines.push(`### ${i + 1}. ${q.question}`, "");
        lines.push(`**${t.recruitment.theme} :** ${q.theme}`, "");
        if (q.objective) lines.push(`*${t.recruitment.objective} : ${q.objective}*`, "");
        if (q.follow_up.length > 0) {
          lines.push(`**${t.recruitment.followUps} :**`);
          q.follow_up.forEach((f) => lines.push(`- ${f}`));
          lines.push("");
        }
        if (q.green_flags.length > 0) {
          lines.push(`**${t.recruitment.greenFlags} :**`);
          q.green_flags.forEach((f) => lines.push(`- ✓ ${f}`));
          lines.push("");
        }
        if (q.red_flags.length > 0) {
          lines.push(`**${t.recruitment.redFlags} :**`);
          r.bias_warnings.forEach((f) => lines.push(`- ✗ ${f}`));
          lines.push("");
        }
      });
    }

    if (r.closing_tips) {
      lines.push(`## ${t.recruitment.closingInterview}`, "", r.closing_tips, "");
    }

    return lines.join("\n");
  }

  function buildCandidateMarkdown(r: CandidateResponse, companyName: string, jobTitle: string): string {
    const lines: string[] = [`# ${t.recruitment.candidatePrep} — ${companyName} — ${jobTitle}`, ""];

    if (r.preparation_tips.length > 0) {
      lines.push(`## ${t.recruitment.prepTips}`, "");
      r.preparation_tips.forEach((tip) => lines.push(`- ${tip}`));
      lines.push("");
    }

    if (r.probable_questions.length > 0) {
      lines.push(`## ${t.recruitment.likelyQuestions}`, "");
      r.probable_questions.forEach((q, i) => {
        lines.push(`### ${i + 1}. ${q.question}`, "");
        lines.push(`**${t.recruitment.theme} :** ${q.theme}`, "");
        if (q.how_to_answer) lines.push(`**${t.recruitment.howToAnswer} :** ${q.how_to_answer}`, "");
        if (q.star_example) {
          lines.push(`**${t.recruitment.answerStructure} :**`, "");
          lines.push(`> ${q.star_example.replace(/\n/g, "\n> ")}`, "");
        }
      });
    }

    if (r.questions_to_ask.length > 0) {
      lines.push(`## ${t.recruitment.questionsForRecruiter}`, "");
      r.questions_to_ask.forEach((group) => {
        lines.push(`### ${group.theme}`, "");
        group.questions.forEach((q) => lines.push(`- ${q}`));
        lines.push("");
      });
    }

    if (r.closing_tips) {
      lines.push(`## ${t.recruitment.closingTip}`, "", r.closing_tips, "");
    }

    return lines.join("\n");
  }

  function buildJobDescriptionMarkdown(r: JobDescriptionResponse, jobTitle: string): string {
    const lines: string[] = [`# ${t.recruitment.jobDescription} — ${jobTitle}`, ""];

    lines.push(`## ${t.recruitment.yourMissions}`, "");
    if (r.missions.intro) lines.push(`*${r.missions.intro}*`, "");
    r.missions.items.forEach((m) => lines.push(`- ${m}`));
    lines.push("");

    lines.push(`## ${t.recruitment.expectedSkills}`, "");
    if (r.competences.intro) lines.push(`*${r.competences.intro}*`, "");
    if (r.competences.required.length > 0) {
      lines.push(`**${t.recruitment.required} :**`);
      r.competences.required.forEach((c) => lines.push(`- ${c}`));
      lines.push("");
    }
    if (r.competences.nice_to_have.length > 0) {
      lines.push(`**${t.recruitment.niceToHave} :**`);
      r.competences.nice_to_have.forEach((c) => lines.push(`- ${c}`));
      lines.push("");
    }

    return lines.join("\n");
  }

  const currentMarkdown = result
    ? mode === "recruiter"
      ? buildRecruiterMarkdown(result as RecruiterResponse, recruiterForm.jobTitle)
      : mode === "job-description"
      ? buildJobDescriptionMarkdown(result as JobDescriptionResponse, jobDescriptionForm.jobTitle)
      : buildCandidateMarkdown(result as CandidateResponse, candidateForm.companyName, candidateForm.jobTitle)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let apiUrl = "/api/generate-recruitment";
      let body: Record<string, unknown>;

      if (mode === "job-description") {
        apiUrl = "/api/generate-job-description";
        body = {
          jobTitle: jobDescriptionForm.jobTitle,
          contractType: jobDescriptionForm.contractType,
          seniority: jobDescriptionForm.seniority,
          department: jobDescriptionForm.department || undefined,
          teamContext: jobDescriptionForm.teamContext || undefined,
          keyMissions: jobDescriptionForm.keyMissions,
          technicalSkills: jobDescriptionForm.technicalSkills || undefined,
          softSkills: jobDescriptionForm.softSkills || undefined,
          perks: jobDescriptionForm.perks || undefined,
        };
      } else if (mode === "recruiter") {
        body = {
          mode,
          jobTitle: recruiterForm.jobTitle,
          seniority: recruiterForm.seniority,
          postType: recruiterForm.postType,
          keySkills: recruiterForm.keySkills,
          context: recruiterForm.context || undefined,
        };
      } else {
        body = {
          mode,
          companyName: candidateForm.companyName,
          jobTitle: candidateForm.jobTitle,
          priority: candidateForm.priority,
          jobUrl: candidateForm.jobUrl || undefined,
        };
      }

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(t.recruitment.limitReached);
        }
        const data = (await res.json().catch(() => ({}))) as { error?: string; details?: string; raw?: string };
        const msg = [data.error, data.details, data.raw ? `Raw: ${data.raw}` : ""].filter(Boolean).join(" — ");
        throw new Error(msg || `Error ${res.status}`);
      }

      const parsed = await res.json() as RecruiterResponse | CandidateResponse;
      setResult(parsed);
      setHistoryOpen(false);
      saveToHistory({
        mode,
        recruiterForm: mode === "recruiter" ? { ...recruiterForm } : undefined,
        candidateForm: mode === "candidate" ? { ...candidateForm } : undefined,
        jobDescriptionForm: mode === "job-description" ? { ...jobDescriptionForm } : undefined,
        result: parsed,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  function downloadMarkdown() {
    if (!currentMarkdown) return;
    const blob = new Blob([currentMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug =
      mode === "recruiter" ? recruiterForm.jobTitle
      : mode === "job-description" ? jobDescriptionForm.jobTitle
      : candidateForm.jobTitle;
    a.download = `recruitment-${mode}-${slug.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyMarkdown() {
    if (!currentMarkdown) return;
    await navigator.clipboard.writeText(currentMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const recruiterCanSubmit =
    recruiterForm.jobTitle.trim().length > 0 &&
    recruiterForm.keySkills.trim().length > 0;

  const candidateCanSubmit =
    candidateForm.companyName.trim().length > 0 &&
    candidateForm.jobTitle.trim().length > 0;

  const jobDescriptionCanSubmit =
    jobDescriptionForm.jobTitle.trim().length > 0 &&
    jobDescriptionForm.keyMissions.trim().length > 0;

  const canSubmit =
    mode === "recruiter" ? recruiterCanSubmit
    : mode === "job-description" ? jobDescriptionCanSubmit
    : candidateCanSubmit;

  const recruiterResult =
    mode === "recruiter" && result ? (result as RecruiterResponse) : null;
  const candidateResult =
    mode === "candidate" && result ? (result as CandidateResponse) : null;
  const jobDescriptionResult =
    mode === "job-description" && result ? (result as JobDescriptionResponse) : null;

  const seniorityOptions = (["1-3", "4-5", "6-8", "8-10", "10+"] as SeniorityLevel[]).map((v) => ({
    value: v,
    label: t.recruitment.seniority[v],
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool={t.recruitment.title} />
      <TrackUsage toolId="recruitment" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <UsageIndicator />
        {/* Mode selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* 1 — Job description */}
          <button
            type="button"
            onClick={() => changeMode("job-description")}
            className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              mode === "job-description"
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900"
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              mode === "job-description" ? "bg-emerald-100 dark:bg-emerald-900/60" : "bg-gray-100 dark:bg-gray-800"
            }`}>
              <ClipboardList size={20} className={mode === "job-description" ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"} />
            </div>
            <div>
              <p className={`font-semibold text-sm mb-0.5 ${mode === "job-description" ? "text-emerald-700 dark:text-emerald-300" : "text-gray-900 dark:text-gray-100"}`}>
                {t.recruitment.createJobDesc}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t.recruitment.writeJobPost}</p>
            </div>
          </button>

          {/* 2 — Recruiter */}
          <button
            type="button"
            onClick={() => changeMode("recruiter")}
            className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              mode === "recruiter"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900"
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              mode === "recruiter" ? "bg-blue-100 dark:bg-blue-900/60" : "bg-gray-100 dark:bg-gray-800"
            }`}>
              <UserCheck size={20} className={mode === "recruiter" ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"} />
            </div>
            <div>
              <p className={`font-semibold text-sm mb-0.5 ${mode === "recruiter" ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}`}>
                {t.recruitment.candidateQuestionsTitle}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t.recruitment.candidateQuestionsDesc}</p>
            </div>
          </button>

          {/* 3 — Candidate */}
          <button
            type="button"
            onClick={() => changeMode("candidate")}
            className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              mode === "candidate"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900"
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              mode === "candidate" ? "bg-blue-100 dark:bg-blue-900/60" : "bg-gray-100 dark:bg-gray-800"
            }`}>
              <Briefcase size={20} className={mode === "candidate" ? "text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"} />
            </div>
            <div>
              <p className={`font-semibold text-sm mb-0.5 ${mode === "candidate" ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}`}>
                {t.recruitment.companyQuestionsTitle}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t.recruitment.companyQuestionsDesc}</p>
            </div>
          </button>
        </div>

        {/* Split layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left column — form */}
          <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24">
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6"
            >
              {mode === "job-description" ? (
                <div className="space-y-5">
                  <div>
                    <FieldLabel htmlFor="jd-jobTitle" required>{t.recruitment.jobTitle}</FieldLabel>
                    <input
                      id="jd-jobTitle"
                      type="text"
                      required
                      value={jobDescriptionForm.jobTitle}
                      onChange={(e) => setJobDescriptionForm((f) => ({ ...f, jobTitle: e.target.value }))}
                      placeholder={t.recruitment.jobTitlePlaceholder}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="jd-contract" className={LABEL_CLASS}>{t.recruitment.contract}</label>
                      <select
                        id="jd-contract"
                        value={jobDescriptionForm.contractType}
                        onChange={(e) => setJobDescriptionForm((f) => ({ ...f, contractType: e.target.value as ContractType }))}
                        className={INPUT_CLASS}
                      >
                        <option value="cdi">CDI</option>
                        <option value="cdd">CDD</option>
                        <option value="alternance">Alternance</option>
                        <option value="stage">Stage</option>
                        <option value="freelance">Freelance</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="jd-seniority" className={LABEL_CLASS}>{t.recruitment.experience}</label>
                      <select
                        id="jd-seniority"
                        value={jobDescriptionForm.seniority}
                        onChange={(e) => setJobDescriptionForm((f) => ({ ...f, seniority: e.target.value as SeniorityLevel }))}
                        className={INPUT_CLASS}
                      >
                        {seniorityOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="jd-department">{t.recruitment.team}</FieldLabel>
                    <input
                      id="jd-department"
                      type="text"
                      value={jobDescriptionForm.department}
                      onChange={(e) => setJobDescriptionForm((f) => ({ ...f, department: e.target.value }))}
                      placeholder="Ex : Produit, Engineering…"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="jd-missions" required>{t.recruitment.missions}</FieldLabel>
                    <textarea
                      id="jd-missions"
                      rows={3}
                      required
                      value={jobDescriptionForm.keyMissions}
                      onChange={(e) => setJobDescriptionForm((f) => ({ ...f, keyMissions: e.target.value }))}
                      placeholder="Ex : Définir la roadmap produit, animer les rituels agile, piloter les KPIs…"
                      className={TEXTAREA_CLASS}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="jd-tech">{t.recruitment.technicalSkills}</FieldLabel>
                    <input
                      id="jd-tech"
                      type="text"
                      value={jobDescriptionForm.technicalSkills}
                      onChange={(e) => setJobDescriptionForm((f) => ({ ...f, technicalSkills: e.target.value }))}
                      placeholder={t.recruitment.technicalSkillsPlaceholder}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="jd-soft">{t.recruitment.humanQualities}</FieldLabel>
                    <input
                      id="jd-soft"
                      type="text"
                      value={jobDescriptionForm.softSkills}
                      onChange={(e) => setJobDescriptionForm((f) => ({ ...f, softSkills: e.target.value }))}
                      placeholder={t.recruitment.humanQualitiesPlaceholder}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="jd-perks">{t.recruitment.offer}</FieldLabel>
                    <input
                      id="jd-perks"
                      type="text"
                      value={jobDescriptionForm.perks}
                      onChange={(e) => setJobDescriptionForm((f) => ({ ...f, perks: e.target.value }))}
                      placeholder={t.recruitment.offerPlaceholder}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              ) : mode === "recruiter" ? (
                <div className="space-y-5">
                  <div>
                    <FieldLabel htmlFor="recruiter-jobTitle" required>
                      {t.recruitment.jobTitle}
                    </FieldLabel>
                    <input
                      id="recruiter-jobTitle"
                      type="text"
                      required
                      value={recruiterForm.jobTitle}
                      onChange={(e) =>
                        setRecruiterForm((f) => ({
                          ...f,
                          jobTitle: e.target.value,
                        }))
                      }
                      placeholder="Ex : Lead Developer React"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="recruiter-seniority"
                      className={LABEL_CLASS}
                    >
                      {t.recruitment.experience}
                    </label>
                    <select
                      id="recruiter-seniority"
                      value={recruiterForm.seniority}
                      onChange={(e) =>
                        setRecruiterForm((f) => ({
                          ...f,
                          seniority: e.target.value as SeniorityLevel,
                        }))
                      }
                      className={INPUT_CLASS}
                    >
                      {seniorityOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={LABEL_CLASS}>{t.recruitment.postType}</label>
                    <SegmentedControl<PostType>
                      options={[
                        { value: "execution", label: t.recruitment.postTypes.execution },
                        { value: "strategie", label: t.recruitment.postTypes.strategie },
                        { value: "mixte", label: t.recruitment.postTypes.mixte },
                      ]}
                      value={recruiterForm.postType}
                      onChange={(v) =>
                        setRecruiterForm((f) => ({ ...f, postType: v }))
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="recruiter-keySkills" required>
                      {t.recruitment.expectedSkill}
                    </FieldLabel>
                    <input
                      id="recruiter-keySkills"
                      type="text"
                      required
                      value={recruiterForm.keySkills}
                      onChange={(e) =>
                        setRecruiterForm((f) => ({
                          ...f,
                          keySkills: e.target.value,
                        }))
                      }
                      placeholder={t.recruitment.expectedSkillPlaceholder}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="recruiter-context">
                      {t.recruitment.context}
                    </FieldLabel>
                    <textarea
                      id="recruiter-context"
                      rows={3}
                      value={recruiterForm.context}
                      onChange={(e) =>
                        setRecruiterForm((f) => ({
                          ...f,
                          context: e.target.value,
                        }))
                      }
                      placeholder={t.recruitment.contextPlaceholder}
                      className={TEXTAREA_CLASS}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <FieldLabel htmlFor="candidate-companyName" required>
                      {t.recruitment.companyName}
                    </FieldLabel>
                    <input
                      id="candidate-companyName"
                      type="text"
                      required
                      value={candidateForm.companyName}
                      onChange={(e) =>
                        setCandidateForm((f) => ({
                          ...f,
                          companyName: e.target.value,
                        }))
                      }
                      placeholder="Ex : SNCF"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="candidate-jobTitle" required>
                      {t.recruitment.targetRole}
                    </FieldLabel>
                    <input
                      id="candidate-jobTitle"
                      type="text"
                      required
                      value={candidateForm.jobTitle}
                      onChange={(e) =>
                        setCandidateForm((f) => ({
                          ...f,
                          jobTitle: e.target.value,
                        }))
                      }
                      placeholder="Ex : Lead Developer React"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLASS}>{t.recruitment.priority}</label>
                    <SegmentedControl<CandidatePriority>
                      options={[
                        { value: "career", label: t.recruitment.priorities.career },
                        { value: "balance", label: t.recruitment.priorities.balance },
                        { value: "benefits", label: t.recruitment.priorities.benefits },
                      ]}
                      value={candidateForm.priority}
                      onChange={(v) =>
                        setCandidateForm((f) => ({ ...f, priority: v }))
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="candidate-jobUrl">
                      {t.recruitment.jobLink}
                    </FieldLabel>
                    <input
                      id="candidate-jobUrl"
                      type="url"
                      value={candidateForm.jobUrl}
                      onChange={(e) =>
                        setCandidateForm((f) => ({
                          ...f,
                          jobUrl: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {t.recruitment.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      {mode === "recruiter"
                        ? t.recruitment.generateQuestions
                        : mode === "job-description"
                        ? t.recruitment.generateJobDesc
                        : t.recruitment.prepare}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right column — results */}
          <div className="flex-1 min-w-0">
            {/* History toggle */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {historyOpen ? t.recruitment.history : t.recruitment.results}
              </h2>
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  historyOpen
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <History size={13} />
                {t.recruitment.history}
                {history.length > 0 && (
                  <span className="tabular-nums">{history.length}</span>
                )}
              </button>
            </div>

            {/* History panel */}
            {historyOpen ? (
              <HistoryPanel
                history={history}
                onLoad={loadEntry}
                onDelete={deleteEntry}
                onClear={clearHistory}
              />
            ) : (
            <>
            {/* Error */}
            {!loading && error && (
              <div className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle
                  size={16}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && <SkeletonLoader />}

            {/* Empty state */}
            {!loading && !error && !result && <EmptyState />}

            {/* Recruiter results */}
            {!loading && recruiterResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t.recruitment.recruiterGuide}
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-2 text-base">
                      — {recruiterForm.jobTitle}
                    </span>
                  </h2>
                  <ExportActions
                    onCopy={copyMarkdown}
                    onDownload={downloadMarkdown}
                    copied={copied}
                  />
                </div>

                {recruiterResult.preparation_tips.length > 0 && (
                  <PreparationTips tips={recruiterResult.preparation_tips} />
                )}

                {recruiterResult.bias_warnings.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-5">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      {t.recruitment.biasWarning}
                    </p>
                    <ul className="space-y-1">
                      {recruiterResult.bias_warnings.map((w, i) => (
                        <li
                          key={i}
                          className="text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2"
                        >
                          <span className="flex-shrink-0 mt-0.5 text-amber-500">
                            ⚠
                          </span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recruiterResult.questions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {t.recruitment.generateQuestions} ({recruiterResult.questions.length})
                    </h3>
                    <div className="space-y-4">
                      {recruiterResult.questions.map((q, i) => (
                        <RecruiterQuestionCard
                          key={i}
                          question={q}
                          index={i + 1}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {recruiterResult.closing_tips && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      {t.recruitment.closingInterview}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {recruiterResult.closing_tips}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Job description results */}
            {!loading && jobDescriptionResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t.recruitment.jobDescription}
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-2 text-base">
                      — {jobDescriptionForm.jobTitle}
                    </span>
                  </h2>
                  <ExportActions onCopy={copyMarkdown} onDownload={downloadMarkdown} copied={copied} />
                </div>

                {/* Missions */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
                      <ListChecks size={16} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t.recruitment.yourMissions}</h3>
                  </div>
                  {jobDescriptionResult.missions.intro && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4 leading-relaxed">
                      {jobDescriptionResult.missions.intro}
                    </p>
                  )}
                  <ul className="space-y-2.5">
                    {jobDescriptionResult.missions.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[11px] font-semibold mt-0.5">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expected skills */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t.recruitment.expectedSkills}</h3>
                  </div>
                  {jobDescriptionResult.competences.intro && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4 leading-relaxed">
                      {jobDescriptionResult.competences.intro}
                    </p>
                  )}
                  <div className="space-y-4">
                    {jobDescriptionResult.competences.required.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          {t.recruitment.required}
                        </p>
                        <ul className="space-y-2">
                          {jobDescriptionResult.competences.required.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-blue-500 mt-0.5 flex-shrink-0">✓</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {jobDescriptionResult.competences.nice_to_have.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          {t.recruitment.niceToHave}
                        </p>
                        <ul className="space-y-2">
                          {jobDescriptionResult.competences.nice_to_have.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-400 dark:text-gray-500">
                              <span className="text-gray-400 mt-0.5 flex-shrink-0">+</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Candidate results */}
            {!loading && candidateResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t.recruitment.candidatePrep}
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-2 text-base">
                      — {candidateForm.jobTitle}
                    </span>
                  </h2>
                  <ExportActions
                    onCopy={copyMarkdown}
                    onDownload={downloadMarkdown}
                    copied={copied}
                  />
                </div>

                {candidateResult.preparation_tips.length > 0 && (
                  <PreparationTips tips={candidateResult.preparation_tips} />
                )}

                {candidateResult.probable_questions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {t.recruitment.likelyQuestions} (
                      {candidateResult.probable_questions.length})
                    </h3>
                    <div className="space-y-4">
                      {candidateResult.probable_questions.map((q, i) => (
                        <CandidateQuestionCard
                          key={i}
                          question={q}
                          index={i + 1}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {candidateResult.questions_to_ask.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {t.recruitment.questionsForRecruiter}
                    </h3>
                    <div className="space-y-3">
                      {candidateResult.questions_to_ask.map((group, i) => (
                        <CandidateQuestionsToAskGroup key={i} group={group} />
                      ))}
                    </div>
                  </div>
                )}

                {candidateResult.closing_tips && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      {t.recruitment.closingTip}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {candidateResult.closing_tips}
                    </p>
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RecruitmentPage() {
  return (
    <Suspense>
      <RecruitmentPageInner />
    </Suspense>
  );
}
