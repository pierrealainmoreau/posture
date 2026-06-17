"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useI18n } from "@/lib/i18n";

function EmailConfirmedContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const loginHref = next && next.startsWith("/")
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

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
          <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {t.emailConfirmed.title}
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          {t.emailConfirmed.desc}
        </p>

        <Link
          href={loginHref}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
        >
          {t.emailConfirmed.cta}
        </Link>
      </div>

    </div>
  );
}

export default function EmailConfirmedPage() {
  return (
    <Suspense>
      <EmailConfirmedContent />
    </Suspense>
  );
}
