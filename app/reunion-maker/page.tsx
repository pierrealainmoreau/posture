"use client";

import Link from "next/link";
import { Activity, Brain, CalendarDays, Gift, Sparkles, Star, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n";

export default function ReunionMakerHubPage() {
  const { t } = useI18n();

  const breadcrumbs = [
    { href: "/", label: t.common.home },
    { label: t.reunionMaker.title },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header breadcrumbs={breadcrumbs} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.reunionMaker.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.reunionMaker.subtitle}
          </p>
        </div>

        {/* ── Section 1 : Classic meeting ─────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            {t.reunionMaker.classicSection}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Link
              href="/reunion-maker/preparer"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                  <CalendarDays size={16} className="text-blue-700 dark:text-blue-400" />
                </div>
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded">
                  <Sparkles size={9} />
                  {t.common.aiPowered}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {t.reunionMaker.prepare}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t.reunionMaker.prepareDesc}
              </p>
            </Link>

            <Link
              href="/reunion-maker/abcde"
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
                  <Brain size={16} className="text-indigo-700 dark:text-indigo-400" />
                </div>
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded">
                  <Sparkles size={9} />
                  {t.common.aiPowered}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {t.reunionMaker.abcde.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t.reunionMaker.abcde.subtitle}
              </p>
            </Link>

          </div>
        </section>

        {/* ── Section 2 : Team retrospective ───────────────── */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
            {t.reunionMaker.retroSection}
          </h2>

          <div className="bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 rounded-2xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <Link
                href="/retrospective"
                className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 bg-teal-50 dark:bg-teal-950 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-100 dark:group-hover:bg-teal-900 transition-colors">
                  <Activity size={16} className="text-teal-700 dark:text-teal-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  Health Radar
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.reunionMaker.healthRadarDesc}
                </p>
              </Link>

              <Link
                href="/retrospective/speed"
                className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 dark:group-hover:bg-orange-900 transition-colors">
                  <Zap size={16} className="text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  Speed Retro
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.reunionMaker.speedRetroDesc}
                </p>
              </Link>

              <Link
                href="/retrospective/roti"
                className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 bg-violet-50 dark:bg-violet-950 rounded-lg flex items-center justify-center mb-4 group-hover:bg-violet-100 dark:group-hover:bg-violet-900 transition-colors">
                  <Star size={16} className="text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  ROTI
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.reunionMaker.rotiDesc}
                </p>
              </Link>

              <Link
                href="/reunion-maker/kudo-cards"
                className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-100 dark:group-hover:bg-amber-900 transition-colors">
                  <Gift size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  Kudos
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t.reunionMaker.kudosDesc}
                </p>
              </Link>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
