"use client";

import { Brain, Users, Shuffle, Target, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

function MarketingPanel() {
  const { t } = useI18n();
  const FEATURES: { icon: LucideIcon; text: string }[] = [
    { icon: Brain,   text: t.login.features.coach },
    { icon: Users,   text: t.login.features.games },
    { icon: Shuffle, text: t.login.features.icebreakers },
    { icon: Target,  text: t.login.features.okr },
  ];

  return (
    <div className="hidden lg:flex flex-col justify-between w-[46%] min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 px-14 py-12 text-white flex-shrink-0">

      {/* Logo + Badge */}
      <div className="flex items-center gap-2.5">
        <Logo withWordmark size={30} />
        <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-400/15 text-blue-300 border border-blue-400/25 rounded">
          Beta
        </span>
      </div>

      {/* Contenu principal */}
      <div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight mb-5">
          {t.login.tagline1}<br />{t.login.tagline2}
        </h1>
        <p className="text-slate-400 text-[15px] leading-relaxed mb-10 max-w-[17rem]">
          {t.login.taglineDesc}
        </p>

        <ul className="space-y-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-blue-400" />
              </div>
              <span className="text-sm text-slate-300 leading-snug">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pied de page */}
      <a
        href="https://pamoreau.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-slate-700 hover:text-slate-500 transition-colors"
      >
        © 2026 Pierre-Alain Moreau
      </a>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <MarketingPanel />
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 py-12">
        {children}
      </div>
    </div>
  );
}
