"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n";
import type {
  InterviewType,
  InterviewRequest,
  InterviewResponse,
  InterviewQuestion,
} from "@/lib/types";

function QuestionCard({
  question,
  index,
}: {
  question: InterviewQuestion;
  index: number;
}) {
  const { t } = useI18n();
  const [followUpOpen, setFollowUpOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-semibold">
          {index}
        </span>
        <p className="font-semibold text-gray-900 text-base leading-snug">
          {question.question}
        </p>
      </div>

      {question.objective && (
        <p className="text-sm text-gray-400 italic mb-4 ml-10">
          {question.objective}
        </p>
      )}

      {question.follow_up.length > 0 && (
        <div className="ml-10 mb-4">
          <button
            type="button"
            onClick={() => setFollowUpOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
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
            <ul className="mt-2 space-y-1.5 pl-2 border-l-2 border-blue-100">
              {question.follow_up.map((fu, i) => (
                <li key={i} className="text-sm text-gray-600">
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
              <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                <CheckCircle size={13} />
                {t.recruitment.greenFlags}
              </p>
              <ul className="space-y-1">
                {question.green_flags.map((flag, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-600 flex items-start gap-1.5"
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
              <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                {t.recruitment.redFlags}
              </p>
              <ul className="space-y-1">
                {question.red_flags.map((flag, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-600 flex items-start gap-1.5"
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

function PreparationTips({ tips }: { tips: string[] }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const THRESHOLD = 3;
  const visible = expanded ? tips : tips.slice(0, THRESHOLD);
  const hasMore = tips.length > THRESHOLD;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
      <h3 className="font-semibold text-blue-900 mb-3 text-sm">
        {t.recruitment.prepTips}
      </h3>
      <ul className="space-y-1.5">
        {visible.map((tip, i) => (
          <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
            <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
            {tip}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors"
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

export default function InterviewPage() {
  const { t } = useI18n();
  const INTERVIEW_TYPES = Object.keys(t.interview.types) as InterviewType[];

  const [form, setForm] = useState<InterviewRequest>({
    type: "recruitment",
    context: "",
    candidateName: "",
  });
  const [result, setResult] = useState<InterviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? t.common.error);
      }

      const data: InterviewResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.common.error
      );
    } finally {
      setLoading(false);
    }
  }

  function downloadMarkdown() {
    if (!result) return;
    const blob = new Blob([result.markdown_export], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const candidate = form.candidateName ? `-${form.candidateName}` : "";
    a.download = `interview-${form.type}${candidate}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyMarkdown() {
    if (!result) return;
    await navigator.clipboard.writeText(result.markdown_export);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool={t.interview.title} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t.interview.title}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t.interview.subtitle}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t.interview.typeLabel}
              </label>
              <select
                id="type"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as InterviewType,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t.interview.types[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="candidateName"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t.interview.collaboratorName}{" "}
                <span className="text-gray-400 font-normal">({t.common.optional})</span>
              </label>
              <input
                id="candidateName"
                type="text"
                value={form.candidateName ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, candidateName: e.target.value }))
                }
                placeholder="Ex. Marie Dupont"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-5">
            <label
              htmlFor="context"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t.interview.contextLabel}
            </label>
            <textarea
              id="context"
              value={form.context}
              onChange={(e) =>
                setForm((f) => ({ ...f, context: e.target.value }))
              }
              rows={5}
              required
              placeholder={t.interview.contextPlaceholder}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !form.context.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {t.interview.generating}
                </>
              ) : (
                t.interview.generateBtn
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {t.interview.guide}
                {form.candidateName && (
                  <span className="text-gray-400 font-normal ml-2">
                    — {form.candidateName}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                  onClick={downloadMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Download size={13} />
                  {t.recruitment.downloadMd}
                </button>
              </div>
            </div>

            {result.preparation_tips.length > 0 && (
              <PreparationTips tips={result.preparation_tips} />
            )}

            {result.bias_warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  {t.recruitment.biasWarning}
                </p>
                <ul className="space-y-1">
                  {result.bias_warnings.map((w, i) => (
                    <li
                      key={i}
                      className="text-sm text-amber-900 flex items-start gap-2"
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

            {result.questions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {t.recruitment.generateQuestions} ({result.questions.length})
                </h3>
                <div className="space-y-4">
                  {result.questions.map((q, i) => (
                    <QuestionCard key={i} question={q} index={i + 1} />
                  ))}
                </div>
              </div>
            )}

            {result.closing_tips && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t.recruitment.closingInterview}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result.closing_tips}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
