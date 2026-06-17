"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

function VerifyEmailContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const next = searchParams.get("next");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    if (!email || resendState === "sending") return;
    setResendState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResendState(error ? "error" : "sent");
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

        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-blue-600 dark:text-blue-400" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t.verify.title}
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
          {t.verify.desc}
        </p>
        {email && (
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4 break-all">
            {email}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          {t.verify.checkSpam}
        </p>

        <div className="space-y-3">
          {email.includes("gmail") && (
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Ouvrir Gmail
            </a>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          {t.verify.noEmail}{" "}
          {resendState === "sent" ? (
            <span className="text-emerald-600 dark:text-emerald-400">{t.verify.resent}</span>
          ) : resendState === "error" ? (
            <span className="text-red-500 dark:text-red-400">{t.common.error}</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={!email || resendState === "sending"}
              className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {resendState === "sending" ? t.login.sending : t.verify.resend}
            </button>
          )}
        </p>
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          ← {t.verify.backToLogin}
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
