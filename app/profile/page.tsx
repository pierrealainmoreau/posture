"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Quote,
  CircleHelp,
  Users,
  GraduationCap,
  UserRoundCheck,
  CalendarDays,
  Trophy,
  Lock,
  Lightbulb,
  Sparkles,
  Bug,
  MessageSquare,
  ChevronRight,
  Loader2,
  Hand,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { PMFBanner } from "@/components/PMFBanner";
import { createClient } from "@/lib/supabase/client";
import { loadProgress } from "@/lib/academie/storage";
import { ALL_PATHWAYS } from "@/lib/academie/pathways/index";
import { computePathwayStatus } from "@/lib/academie/progress";
import { useI18n } from "@/lib/i18n";

const TOOL_COLORS = {
  blue:   { card: "border-blue-100 dark:border-blue-900",     icon: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",       num: "text-blue-700 dark:text-blue-300",     bar: "bg-blue-400"   },
  violet: { card: "border-violet-100 dark:border-violet-900", icon: "bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400", num: "text-violet-700 dark:text-violet-300", bar: "bg-violet-400" },
  teal:   { card: "border-teal-100 dark:border-teal-900",     icon: "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400",       num: "text-teal-700 dark:text-teal-300",     bar: "bg-teal-400"   },
  green:  { card: "border-green-100 dark:border-green-900",   icon: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400",     num: "text-green-700 dark:text-green-300",   bar: "bg-green-400"  },
  amber:  { card: "border-amber-100 dark:border-amber-900",   icon: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",     num: "text-amber-700 dark:text-amber-300",   bar: "bg-amber-400"  },
  rose:   { card: "border-rose-100 dark:border-rose-900",     icon: "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",       num: "text-rose-700 dark:text-rose-300",     bar: "bg-rose-400"   },
};

interface ProfileStats {
  role: string;
  usage_limit: number;
  feedback_count: number;
  recruitment_count: number;
  reunion_maker_count: number;
  collaborators_count: number;
  collaborators_limit: number;
  mini_games_count: number;
}

interface ToolStat {
  count: number;
  limit?: number;
  label: string;
  used: boolean;
}

interface Suggestion {
  id: string;
  category: string;
  message: string;
  created_at: string;
  status: string | null;
}

function rankPercent(rank: number, total: number): number {
  if (total <= 1) return 1;
  return Math.max(1, Math.ceil((rank / total) * 100));
}

function ToolCard({ toolId, shortLabel, href, icon: Icon, color, stat }: {
  toolId: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  color: keyof typeof TOOL_COLORS;
  stat: ToolStat;
}) {
  const { t } = useI18n();
  const colors = TOOL_COLORS[color];
  const pct = stat.limit && stat.limit > 0 ? Math.min(100, Math.round((stat.count / stat.limit) * 100)) : 0;

  return (
    <Link
      href={href}
      className={`group flex flex-col bg-white dark:bg-gray-900 border rounded-xl p-5 hover:shadow-sm transition-all duration-150 ${
        stat.used
          ? `${colors.card} hover:border-opacity-80`
          : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.used ? colors.icon : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"}`}>
          <Icon size={17} />
        </div>
        {!stat.used && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Hand size={11} />
            {t.profile.discover}
          </span>
        )}
      </div>

      <p className={`text-3xl font-bold tabular-nums mb-0.5 ${stat.used ? colors.num : "text-gray-300 dark:text-gray-700"}`}>
        {stat.used ? stat.count : "—"}
      </p>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-auto">
        {stat.used
          ? stat.limit
            ? `${stat.label} / ${stat.limit}`
            : stat.label
          : t.profile.notTriedYet}
      </p>

      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-3 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
        {shortLabel}
      </p>

      {stat.used && stat.limit && (
        <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>
      )}
    </Link>
  );
}

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [userId, setUserId]                         = useState<string | null>(null);
  const [firstName, setFirstName]                   = useState<string | null>(null);
  const [createdAt, setCreatedAt]                   = useState<string | null>(null);
  const [rank, setRank]                             = useState<{ rank: number; total: number } | null>(null);
  const [stats, setStats]                           = useState<ProfileStats | null>(null);
  const [academiePassedCount, setAcademiePassedCount] = useState(0);
  const [academieTotal]                             = useState(() => ALL_PATHWAYS.reduce((s, p) => s + p.quizzes.length, 0));
  const [badgesEarned, setBadgesEarned]             = useState<string[]>([]);
  const [suggestions, setSuggestions]               = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);
      setCreatedAt(user.created_at ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();
      setFirstName(profile?.first_name ?? user.email ?? "");
      const progress = await loadProgress(user.id);
      setBadgesEarned(progress.badges_earned);
      const passed = ALL_PATHWAYS.reduce((total, pathway) => {
        const statuses = computePathwayStatus(pathway, progress);
        return total + statuses.filter((s) => s.passed).length;
      }, 0);
      setAcademiePassedCount(passed);
    });
  }, [router]);

  useEffect(() => {
    fetch("/api/profile/stats")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setStats(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/profile/rank")
      .then((r) => r.json())
      .then((d) => { if (d.rank && d.total) setRank(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/suggestions/me")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSuggestions(data); })
      .catch(() => {})
      .finally(() => setSuggestionsLoading(false));
  }, []);

  if (firstName === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const fc = stats?.feedback_count ?? 0;
  const rc = stats?.recruitment_count ?? 0;
  const rmc = stats?.reunion_maker_count ?? 0;
  const mgc = stats?.mini_games_count ?? 0;
  const cc = stats?.collaborators_count ?? 0;

  const TOOLS = [
    { id: "feedback",      shortLabel: "Feedback",                href: "/feedback",       icon: Quote,         color: "blue"   as const,
      stat: { count: fc,  limit: stats?.usage_limit, label: fc !== 1 ? t.profile.usagePlural : t.profile.usageSingular, used: fc > 0 } },
    { id: "recruitment",   shortLabel: t.recruitment.title,       href: "/recruitment",    icon: CircleHelp,    color: "violet" as const,
      stat: { count: rc,  limit: stats?.usage_limit, label: rc !== 1 ? t.profile.usagePlural : t.profile.usageSingular, used: rc > 0 } },
    { id: "reunion-maker", shortLabel: t.reunionMaker.title,      href: "/reunion-maker",  icon: CalendarDays,  color: "teal"   as const,
      stat: { count: rmc, limit: stats?.usage_limit, label: rmc !== 1 ? t.profile.meetingPlural : t.profile.meetingSingular, used: rmc > 0 } },
    { id: "mini-jeux",     shortLabel: t.common.miniJeux,         href: "/mini-jeux",      icon: Users,         color: "green"  as const,
      stat: { count: mgc, label: mgc !== 1 ? t.profile.gamePlural : t.profile.gameSingular, used: mgc > 0 } },
    { id: "academie",      shortLabel: t.academie.title,          href: "/academie",       icon: GraduationCap, color: "amber"  as const,
      stat: { count: academiePassedCount, limit: academieTotal, label: academiePassedCount !== 1 ? t.profile.quizPlural : t.profile.quizSingular, used: academiePassedCount > 0 } },
    { id: "coach",         shortLabel: t.coach.title,             href: "/coach",          icon: UserRoundCheck,color: "rose"   as const,
      stat: { count: cc, limit: stats?.collaborators_limit, label: cc !== 1 ? t.profile.collaboratorPlural : t.profile.collaboratorSingular, used: cc > 0 } },
  ];

  const untriedCount = TOOLS.filter((tool) => !tool.stat.used).length;

  const suggCatLabels: Record<string, string> = {
    idea: t.suggestions.types.idea,
    improvement: t.suggestions.types.improvement,
    bug: t.suggestions.types.bug,
    other: t.suggestions.types.other,
  };
  const suggCatIcons: Record<string, React.ReactNode> = {
    idea:        <Lightbulb size={14} />,
    improvement: <Sparkles size={14} />,
    bug:         <Bug size={14} />,
    other:       <MessageSquare size={14} />,
  };
  const suggCatColors: Record<string, string> = {
    idea:        "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    improvement: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    bug:         "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    other:       "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  };
  const suggStatusLabels: Record<string, string> = {
    planned: t.suggestions.statuses.planned,
    done:    t.suggestions.statuses.done,
  };
  const suggStatusColors: Record<string, string> = {
    planned: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    done:    "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool={t.profile.title} />
      {userId && <PMFBanner userId={userId} requireUsage={false} />}

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pt-6 pb-16 space-y-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xl font-bold select-none">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{firstName}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              {createdAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.profile.memberSince} {new Date(createdAt).toLocaleDateString(locale, { month: "long", year: "numeric" })}
                </p>
              )}
              {rank && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Star size={10} className="fill-current" />
                  {t.profile.topMembers.replace("premiers", `${rankPercent(rank.rank, rank.total)}%`)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Tools ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {t.profile.yourTools}
            </h2>
            {untriedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Hand size={12} />
                {untriedCount} {t.profile.toDiscover}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} toolId={tool.id} shortLabel={tool.shortLabel} href={tool.href} icon={tool.icon} color={tool.color} stat={tool.stat} />
            ))}
          </div>
        </section>

        {/* ── Badges ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
            {t.profile.yourBadges}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_PATHWAYS.filter((p) => badgesEarned.includes(p.id)).map((pathway) => (
              <Link
                key={pathway.id}
                href={`/academie/${pathway.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-gray-900 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400">
                  <Trophy size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                    {pathway.final_badge.name}
                  </p>
                  <p className="text-xs truncate text-gray-500 dark:text-gray-400">
                    {t.profile.badgeEarned} · {pathway.title}
                  </p>
                </div>
                <span className="shrink-0 ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                  {t.profile.obtained}
                </span>
              </Link>
            ))}

            <Link
              href="/academie"
              className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Lock size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-gray-500 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  {badgesEarned.length === 0 ? t.profile.unlockFirst : t.profile.unlockMore}
                </p>
                <p className="text-xs truncate text-gray-400 dark:text-gray-600">
                  {t.profile.badgeHint}
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 ml-auto text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>
        </section>

        {/* ── Suggestions ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {t.profile.yourSuggestions}
            </h2>
            <Link href="/suggestions" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              {t.profile.newSuggestion}
            </Link>
          </div>

          {suggestionsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin text-gray-300 dark:text-gray-600" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.profile.noSuggestions}</p>
              <Link href="/suggestions" className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                {t.profile.giveFeedback} <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
              {suggestions.map((s) => {
                const catKey = s.category in suggCatLabels ? s.category : "other";
                const status = s.status && s.status in suggStatusLabels ? s.status : null;
                return (
                  <div key={s.id} className="px-5 py-4 flex gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(s.created_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${suggCatColors[catKey]}`}>
                          {suggCatIcons[catKey]}{suggCatLabels[catKey]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{s.message}</p>
                    </div>
                    {status && (
                      <div className="shrink-0 pt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${suggStatusColors[status]}`}>
                          {suggStatusLabels[status]}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
