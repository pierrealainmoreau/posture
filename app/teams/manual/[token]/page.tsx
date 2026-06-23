"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import { MANUAL_SECTIONS } from "@/lib/manual-questions";
import type { ManualAnswers } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

// ── Section accordion ─────────────────────────────────────────────────────────

function SectionCard({
  emoji,
  title,
  questions,
  answers,
  onChange,
  defaultOpen,
  answerPlaceholder,
}: {
  emoji: string;
  title: string;
  questions: { id: string; label: string; placeholder?: string }[];
  answers: ManualAnswers;
  onChange: (id: string, value: string) => void;
  defaultOpen?: boolean;
  answerPlaceholder: string;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const filledCount = questions.filter((q) => (answers[q.id] ?? "").trim()).length;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">{emoji}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {filledCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {filledCount}/{questions.length}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-100 dark:border-gray-800 pt-4">
          {questions.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 leading-snug">
                {q.label}
              </label>
              <AutoTextarea
                value={answers[q.id] ?? ""}
                onChange={(v) => onChange(q.id, v)}
                placeholder={q.placeholder ?? answerPlaceholder}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Auto-resize textarea ──────────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden leading-relaxed"
    />
  );
}

// ── Page content ──────────────────────────────────────────────────────────────

function FillManualContent() {
  const { t } = useI18n();
  const params = useParams<{ token: string }>();

  const [collaboratorName, setCollaboratorName] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ManualAnswers>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyFilled, setAlreadyFilled] = useState(false);

  useEffect(() => {
    fetch(`/api/teams/manual/fill/${params.token}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        if (!res.ok) { setError(t.common.error); setLoading(false); return; }
        const data = await res.json();
        setCollaboratorName(`${data.collaborator_first_name} ${data.collaborator_last_name}`.trim());
        setAnswers(data.answers ?? {});
        setAlreadyFilled(!!data.completed_at);
        setLoading(false);
      })
      .catch(() => { setError(t.common.error); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  function handleChange(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/manual/fill/${params.token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? t.common.error);
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSubmitting(false);
    }
  }

  const filledTotal = MANUAL_SECTIONS.flatMap((s) => s.questions).filter(
    (q) => (answers[q.id] ?? "").trim()
  ).length;
  const totalQuestions = MANUAL_SECTIONS.flatMap((s) => s.questions).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t.coach.manualNotFoundTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {t.coach.manualNotFoundDesc}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header guestMode />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-green-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t.coach.manualSentTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {t.coach.manualSentDesc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header guestMode />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {alreadyFilled ? t.coach.manualGuestUpdateTitle : t.coach.manualGuestTitle}
          </h1>
          {collaboratorName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{collaboratorName}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed max-w-lg">
            {t.coach.manualGuestDescLine1}{" "}
            {t.coach.manualGuestDescLine2}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((filledTotal / totalQuestions) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {filledTotal}/{totalQuestions} {t.coach.manualAnswersSuffix}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {MANUAL_SECTIONS.map((section, i) => (
            <SectionCard
              key={section.id}
              emoji={section.emoji}
              title={section.title}
              questions={section.questions}
              answers={answers}
              onChange={handleChange}
              defaultOpen={i === 0}
              answerPlaceholder={t.coach.manualAnswerPlaceholder}
            />
          ))}
        </div>

        {error && (
          <div className="mt-5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting || filledTotal === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-2xl hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {submitting
              ? t.coach.manualSubmitting
              : alreadyFilled
              ? t.coach.manualUpdateBtn
              : t.coach.manualSubmitBtn}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            {t.coach.manualReuseLink}
          </p>
        </div>

      </main>
    </div>
  );
}

export default function FillManualPage() {
  return (
    <Suspense>
      <FillManualContent />
    </Suspense>
  );
}
