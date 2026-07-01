"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Eye, EyeOff, Gift, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useI18n } from "@/lib/i18n";

// ── Page inscription ───────────────────────────────────────────────────────

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const next    = searchParams.get("next");
  const refCode = searchParams.get("ref")?.toUpperCase() ?? null;
  const [refName, setRefName] = useState<string | null>(null);
  const [form, setForm]       = useState({ firstName: "", lastName: "", email: "", password: "" });

  useEffect(() => {
    if (!refCode) return;
    createClient()
      .from("profiles")
      .select("first_name")
      .eq("referral_code", refCode)
      .single()
      .then(({ data }) => { if (data?.first_name) setRefName(data.first_name); });
  }, [refCode]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      setError(t.signup.errorWeakPassword);
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const emailRedirectTo = next && next.startsWith("/")
      ? `${window.location.origin}/email-confirmed?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/email-confirmed`;

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo,
        data: { first_name: form.firstName, last_name: form.lastName, ...(refCode ? { ref_code: refCode } : {}) },
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.replace(next && next.startsWith("/") ? next : "/");
      return;
    }
    if (data.user?.identities?.length === 0) {
      setError(t.signup.errorEmailExists);
      setLoading(false);
      return;
    }
    const verifyUrl = next && next.startsWith("/")
      ? `/verify-email?email=${encodeURIComponent(form.email)}&next=${encodeURIComponent(next)}`
      : `/verify-email?email=${encodeURIComponent(form.email)}`;
    router.replace(verifyUrl);
  }

  return (
    <AuthLayout>
        <div className="w-full max-w-sm">

          {/* Logo visible uniquement sur mobile */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <Logo withWordmark size={28} />
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded">
              Beta
            </span>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {t.signup.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
            {t.signup.subtitle}
          </p>

          {refName && (
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-5">
              <Gift size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{refName}</strong> vous invite — profitez d&apos;un accès gratuit pendant 2 mois !
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.signup.firstName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="Marie"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.signup.lastName}
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder="Dupont"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.login.emailLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={t.signup.emailPlaceholder}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.signup.password} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={t.signup.passwordPlaceholder}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? t.signup.hidePassword : t.signup.showPassword}
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
                {loading ? <><Loader2 size={15} className="animate-spin" /> {t.signup.submitting}</> : t.signup.submit}
              </button>
            </form>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.signup.alreadyAccount}{" "}
                <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-blue-700 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300">
                  {t.signup.signIn}
                </Link>
              </p>
            </div>
          </div>

          {/* Bloc offre Beta */}
          <div className="mt-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3.5">
            <Sparkles size={16} className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-snug">
              <strong>Création de compte gratuite pendant la Beta</strong> — bénéficiez d&apos;un accès gratuit de 3 mois à partir du 1er septembre.
            </p>
          </div>
        </div>
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
