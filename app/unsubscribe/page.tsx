"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailX } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useI18n } from "@/lib/i18n";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const u = searchParams.get("u") ?? "";
  const s = searchParams.get("s") ?? "";
  const { t } = useI18n();

  const [sending, setSending]   = useState<string | null>(null);
  const [sentReason, setSentReason] = useState<string | null>(null);

  const reasons = [
    { key: "non_sollicite",          label: t.unsubscribe.reasonNonSolicited },
    { key: "trop_de_communications", label: t.unsubscribe.reasonTooMuch },
    { key: "pas_interesse",          label: t.unsubscribe.reasonNotInterested },
  ];

  async function submitReason(reasonKey: string) {
    if (sending || sentReason) return;
    setSending(reasonKey);
    try {
      await fetch("/api/unsubscribe/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u, s, reason: reasonKey }),
      });
    } finally {
      setSentReason(reasonKey);
      setSending(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">

      <div className="mb-10 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2.5">
          <Logo withWordmark size={28} />
          <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded">
            Beta
          </span>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm text-center">

        <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950 flex items-center justify-center mx-auto mb-6">
          <MailX size={28} className="text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {t.unsubscribe.title}
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-7">
          {t.unsubscribe.description}
        </p>

        {sentReason ? (
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
            {t.unsubscribe.thankYou}
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t.unsubscribe.reasonPrompt}
            </p>
            <div className="flex flex-col gap-2">
              {reasons.map((r) => (
                <button
                  key={r.key}
                  onClick={() => submitReason(r.key)}
                  disabled={!!sending}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {sending === r.key ? t.unsubscribe.sending : r.label}
                </button>
              ))}
            </div>
          </>
        )}

      </div>

    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
