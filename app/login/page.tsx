"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, MailCheck, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useI18n } from "@/lib/i18n";

// ── Login form ─────────────────────────────────────────────────────────────

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [forgotMode, setForgotMode]     = useState(false);
  const [resetSent, setResetSent]       = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError]     = useState<string | null>(null);

  const checkEmail = searchParams.get("check-email") === "true";
  const next = searchParams.get("next");

  useEffect(() => {
    if (checkEmail) {
      const url = new URL(window.location.href);
      url.searchParams.delete("check-email");
      window.history.replaceState({}, "", url.toString());
    }
  }, [checkEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(t.login.errorCredentials);
      setLoading(false);
      return;
    }
    router.replace(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    const supabase = createClient();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetErr) {
      setResetError(t.login.resetError);
      setResetLoading(false);
      return;
    }
    setResetSent(true);
    setResetLoading(false);
  }

  // ── Contenu du panneau droit ─────────────────────────────────────────────
  const rightContent = forgotMode ? (
    /* Vue mot de passe oublié */
    <div className="w-full max-w-sm">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
        {t.login.forgotTitle}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
        {t.login.forgotSubtitle}
      </p>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        {resetSent ? (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <MailCheck size={28} className="text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t.login.emailSentTitle}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.login.emailSentPrefix} <span className="font-medium">{email}</span>.{" "}
              {t.login.checkSpam}
            </p>
            <button
              onClick={() => { setForgotMode(false); setResetSent(false); }}
              className="mt-2 text-sm text-blue-700 dark:text-blue-400 hover:underline"
            >
              {t.login.backToLogin}
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.login.emailLabel}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.login.emailPlaceholder}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {resetError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                {resetError}
              </div>
            )}

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {resetLoading ? <><Loader2 size={15} className="animate-spin" /> {t.login.sending}</> : t.login.sendLink}
            </button>

            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {t.login.backToLogin}
            </button>
          </form>
        )}
      </div>
    </div>
  ) : (
    /* Vue connexion normale */
    <div className="w-full max-w-sm">
      {/* Logo visible uniquement sur mobile */}
      <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
        <Logo withWordmark size={28} />
        <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded">
          Beta
        </span>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
        {t.login.title}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
        {t.login.subtitle}
      </p>

      {checkEmail && (
        <div className="mb-5 flex items-start gap-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <MailCheck size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t.login.emailConfirmation}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.login.emailLabel}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.login.passwordLabel}</label>
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="text-xs text-blue-700 dark:text-blue-400 hover:underline"
              >
                {t.login.forgotPasswordLink}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> {t.login.submitting}</> : t.login.submit}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.login.noAccount}{" "}
            <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="text-blue-700 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300">
              {t.login.createAccount}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );

  return <AuthLayout>{rightContent}</AuthLayout>;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
