"use client";

import { useEffect, useState } from "react";
import { Crown, Sparkles, Users, CalendarCheck, MessageSquare, CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n";

type RequestStatus = "pending" | "approved" | "rejected" | null;

export default function PremiumPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<RequestStatus>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRequested, setJustRequested] = useState(false);

  const BENEFIT_ICONS = [MessageSquare, Users, CalendarCheck, Sparkles];

  useEffect(() => {
    fetch("/api/premium-requests")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setIsAdmin(true);
        } else {
          setStatus(data?.status ?? null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleRequest() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/premium-requests", { method: "POST" });
    const data = await res.json().catch(() => ({})) as { error?: string };

    if (!res.ok) {
      setError(data.error ?? t.common.error);
      setSubmitting(false);
      return;
    }

    setStatus("pending");
    setJustRequested(true);
    setSubmitting(false);
  }

  const isAlreadyPremium = status === "approved";
  const isPending        = status === "pending";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool="Premium" />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-12">

        {/* Admin banner */}
        {!loading && isAdmin && (
          <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl mb-8">
            <Crown size={18} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t.premium.alreadyPremium}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{t.premium.alreadyPremiumDesc}</p>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-center mb-5">
            <Crown size={28} className="text-amber-500 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {t.premium.heroTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
            {t.premium.heroDesc}
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 space-y-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
            {t.premium.benefitsTitle}
          </p>
          {t.premium.benefits.map((text, i) => {
            const Icon = BENEFIT_ICONS[i] ?? Sparkles;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 flex-shrink-0 bg-amber-50 dark:bg-amber-950/40 rounded-lg flex items-center justify-center mt-0.5">
                  <Icon size={14} className="text-amber-500 dark:text-amber-400" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
              </div>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-6 text-gray-400">
            <Loader2 size={18} className="animate-spin mr-2" /> {t.common.loading}
          </div>
        )}

        {/* Already premium */}
        {!loading && isAlreadyPremium && (
          <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
            <Crown size={18} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t.premium.alreadyPremium}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{t.premium.alreadyPremiumDesc}</p>
            </div>
          </div>
        )}

        {/* Pending — just submitted */}
        {!loading && isPending && justRequested && (
          <div className="flex items-center gap-3 px-5 py-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl">
            <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">{t.premium.pendingSentTitle}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">{t.premium.pendingSentDesc}</p>
            </div>
          </div>
        )}

        {/* Pending — existing */}
        {!loading && isPending && !justRequested && (
          <div className="flex items-center gap-3 px-5 py-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
            <Clock size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{t.premium.pendingTitle}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">{t.premium.pendingDesc}</p>
            </div>
          </div>
        )}

        {/* CTA */}
        {!loading && !isPending && (
          <>
            {error && !isAlreadyPremium && !isAdmin && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 mb-4">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}
            <button
              onClick={handleRequest}
              disabled={submitting || isAlreadyPremium || isAdmin}
              className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                isAlreadyPremium || isAdmin
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm"
              }`}
            >
              {submitting ? (
                <><Loader2 size={15} className="animate-spin" /> {t.premium.sending}</>
              ) : (
                <><Crown size={15} /> {t.premium.requestBtn}</>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
              {t.premium.betaNote}
            </p>
          </>
        )}

      </main>
    </div>
  );
}
