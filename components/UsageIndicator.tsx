"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { limitForRole } from "@/lib/supabase/rateLimit";
import { useI18n } from "@/lib/i18n";

interface UsageData {
  count: number;
  limit: number;
}

export function UsageIndicator() {
  const { t } = useI18n();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).single(),
        supabase.from("usage").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setUsage({ count: count ?? 0, limit: limitForRole(profile?.role) });
    });
  }, []);

  if (!usage) return null;

  const { count, limit } = usage;
  const pct = Math.min(100, (count / limit) * 100);
  const remaining = limit - count;

  const barColor =
    pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-blue-500";

  const textColor =
    pct >= 100
      ? "text-red-600 dark:text-red-400"
      : pct >= 70
      ? "text-amber-600 dark:text-amber-400"
      : "text-gray-500 dark:text-gray-400";

  const borderColor =
    pct >= 100
      ? "border-red-200 dark:border-red-900"
      : pct >= 70
      ? "border-amber-200 dark:border-amber-900"
      : "border-gray-200 dark:border-gray-800";

  return (
    <div className={`flex items-center gap-4 rounded-xl border ${borderColor} bg-white dark:bg-gray-900 px-4 py-3 mb-6`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t.usage.title}
          </span>
          <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
            {count} / {limit}
          </span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className={`text-xs flex-shrink-0 ${textColor}`}>
        {pct >= 100
          ? t.usage.limitReached
          : `${remaining} ${remaining > 1 ? t.usage.remainingPlural : t.usage.remaining}`}
      </p>
    </div>
  );
}
