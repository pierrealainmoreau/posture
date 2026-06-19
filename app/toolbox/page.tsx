"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Scale, BookOpen, Shuffle, ChevronRight, PenLine, Users, Compass, Clock, SmilePlus, Link2, EyeOff, Lock, SplitSquareHorizontal, MessageSquare, Zap, Star, Gift, Layers, Activity } from "lucide-react";
import { Header } from "@/components/Header";
import { TrackUsage } from "@/components/TrackUsage";
import { useI18n } from "@/lib/i18n";

type Tag =
  | "onboarding"
  | "meetingStart"
  | "meetingEnd"
  | "cohesion"
  | "fun"
  | "knowledge"
  | "seminar";

const TAG_STYLES: Record<Tag, string> = {
  onboarding:   "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  meetingStart: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  meetingEnd:   "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
  cohesion:     "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  fun:          "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800",
  knowledge:    "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800",
  seminar:      "bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-800",
};

type GameKey = keyof ReturnType<typeof useI18n>["t"]["miniJeux"]["descriptions"];

type GameBase = {
  key: GameKey;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  available: boolean;
  tags: Tag[];
  duration: string;
};

const GAMES_STATIC: GameBase[] = [
  {
    key:       "humeur",
    href:      "/toolbox/humeur",
    icon:      <SmilePlus size={22} className="text-rose-500 dark:text-rose-400" />,
    iconBg:    "bg-rose-50 dark:bg-rose-950",
    available: true,
    tags:      ["meetingStart", "cohesion", "onboarding"],
    duration:  "3 min",
  },
  {
    key:       "icebreaker",
    href:      "/icebreaker",
    icon:      <Shuffle size={22} className="text-cyan-600 dark:text-cyan-400" />,
    iconBg:    "bg-cyan-50 dark:bg-cyan-950",
    available: true,
    tags:      ["meetingStart", "onboarding"],
    duration:  "5 min",
  },
  {
    key:       "anecdotes",
    href:      "/toolbox/anecdotes",
    icon:      <BookOpen size={22} className="text-emerald-600 dark:text-emerald-400" />,
    iconBg:    "bg-emerald-50 dark:bg-emerald-950",
    available: true,
    tags:      ["meetingStart", "knowledge", "cohesion"],
    duration:  "10 min",
  },
  {
    key:       "draw",
    href:      "/toolbox/draw",
    icon:      <PenLine size={22} className="text-orange-600 dark:text-orange-400" />,
    iconBg:    "bg-orange-50 dark:bg-orange-950",
    available: true,
    tags:      ["fun", "seminar"],
    duration:  "15 min",
  },
  {
    key:       "tvml",
    href:      "/toolbox/tvml",
    icon:      <Scale size={22} className="text-purple-600 dark:text-purple-400" />,
    iconBg:    "bg-purple-50 dark:bg-purple-950",
    available: true,
    tags:      ["knowledge", "onboarding", "fun", "cohesion"],
    duration:  "10 min",
  },
  {
    key:       "tribu",
    href:      "/toolbox/tribu",
    icon:      <Users size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg:    "bg-teal-50 dark:bg-teal-950",
    available: true,
    tags:      ["cohesion", "knowledge", "seminar"],
    duration:  "15 min",
  },
  {
    key:       "speedRetro",
    href:      "/toolbox/speed-retro",
    icon:      <Zap size={22} className="text-violet-600 dark:text-violet-400" />,
    iconBg:    "bg-violet-50 dark:bg-violet-950",
    available: true,
    tags:      ["meetingEnd", "cohesion", "seminar"],
    duration:  "20 min",
  },
  {
    key:       "roti",
    href:      "/toolbox/roti",
    icon:      <Star size={22} className="text-amber-500 dark:text-amber-400" />,
    iconBg:    "bg-amber-50 dark:bg-amber-950",
    available: true,
    tags:      ["meetingEnd"],
    duration:  "1 min",
  },
  {
    key:       "healthRadar",
    href:      "/toolbox/health-radar",
    icon:      <Activity size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg:    "bg-teal-50 dark:bg-teal-950",
    available: true,
    tags:      ["meetingEnd", "cohesion", "seminar"],
    duration:  "15 min",
  },
  {
    key:       "kudoCards",
    href:      "/toolbox/kudo-cards",
    icon:      <Gift size={22} className="text-rose-600 dark:text-rose-400" />,
    iconBg:    "bg-rose-50 dark:bg-rose-950",
    available: true,
    tags:      ["meetingEnd", "cohesion"],
    duration:  "10 min",
  },
  {
    key:       "abcde",
    href:      "/toolbox/abcde",
    icon:      <Layers size={22} className="text-indigo-600 dark:text-indigo-400" />,
    iconBg:    "bg-indigo-50 dark:bg-indigo-950",
    available: true,
    tags:      ["knowledge", "seminar"],
    duration:  "20-30 min",
  },
  {
    key:       "boussole",
    href:      "/toolbox/boussole",
    icon:      <Compass size={22} className="text-indigo-600 dark:text-indigo-400" />,
    iconBg:    "bg-indigo-50 dark:bg-indigo-950",
    available: true,
    tags:      ["meetingEnd", "onboarding", "knowledge"],
    duration:  "15 min",
  },
  {
    key:       "chaine",
    href:      "/toolbox/chaine",
    icon:      <Link2 size={22} className="text-violet-600 dark:text-violet-400" />,
    iconBg:    "bg-violet-50 dark:bg-violet-950",
    available: true,
    tags:      ["meetingStart", "fun"],
    duration:  "3 min",
  },
  {
    key:       "undercover",
    href:      "/toolbox/undercover",
    icon:      <EyeOff size={22} className="text-indigo-600 dark:text-indigo-400" />,
    iconBg:    "bg-indigo-50 dark:bg-indigo-950",
    available: true,
    tags:      ["fun", "cohesion", "seminar"],
    duration:  "30 min",
  },
  {
    key:       "codeSecret",
    href:      "/toolbox/code-secret",
    icon:      <Lock size={22} className="text-amber-600 dark:text-amber-400" />,
    iconBg:    "bg-amber-50 dark:bg-amber-950",
    available: true,
    tags:      ["fun", "cohesion", "seminar"],
    duration:  "5-10 min",
  },
  {
    key:       "thisorthat",
    href:      "/toolbox/thisorthat",
    icon:      <SplitSquareHorizontal size={22} className="text-sky-600 dark:text-sky-400" />,
    iconBg:    "bg-sky-50 dark:bg-sky-950",
    available: true,
    tags:      ["meetingStart", "fun"],
    duration:  "2-4 min",
  },
  {
    key:       "completephrase",
    href:      "/toolbox/completephrase",
    icon:      <MessageSquare size={22} className="text-fuchsia-600 dark:text-fuchsia-400" />,
    iconBg:    "bg-fuchsia-50 dark:bg-fuchsia-950",
    available: true,
    tags:      ["meetingStart", "cohesion", "knowledge", "seminar"],
    duration:  "5 min",
  },
];

const ALL_TAGS: Tag[] = [
  "onboarding",
  "meetingStart",
  "meetingEnd",
  "cohesion",
  "fun",
  "knowledge",
  "seminar",
];

export default function ToolboxPage() {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState<Tag | null>(null);

  const TAG_LABELS: Record<Tag, string> = {
    onboarding:   t.miniJeux.tags.onboarding,
    meetingStart: t.miniJeux.tags.meetingStart,
    meetingEnd:   t.miniJeux.tags.meetingEnd,
    cohesion:     t.miniJeux.tags.cohesion,
    fun:          t.miniJeux.tags.fun,
    knowledge:    t.miniJeux.tags.knowledge,
    seminar:      t.miniJeux.tags.seminar,
  };
  const [fromParams, setFromParams]     = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const fromGame = p.get("fromGame");
    const fromCode = p.get("fromCode");
    if (fromGame && fromCode) {
      setFromParams(`?fromGame=${encodeURIComponent(fromGame)}&fromCode=${encodeURIComponent(fromCode)}`);
    }
  }, []);

  const filtered = activeFilter
    ? GAMES_STATIC.filter((g) => g.tags.includes(activeFilter))
    : GAMES_STATIC;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header backHref="/" currentTool={t.common.toolbox} />
      <TrackUsage toolId="toolbox" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t.common.toolbox}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {t.miniJeux.subtitle}
          </p>
        </div>

        {/* Filter by moment */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === null
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            {t.miniJeux.all}
          </button>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(activeFilter === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFilter === tag
                  ? TAG_STYLES[tag]
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
              }`}
            >
              {TAG_LABELS[tag]}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((game) => (
            <Link
              key={game.href}
              href={game.available ? `${game.href}${fromParams}` : "#"}
              onClick={game.available ? undefined : (e) => e.preventDefault()}
              className={`group flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 transition-all duration-150 ${
                game.available
                  ? "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer"
                  : "opacity-60 cursor-default"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 flex-shrink-0 ${game.iconBg} rounded-lg flex items-center justify-center`}>
                  {game.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.miniJeux.labels[game.key]}</p>
                    <ChevronRight
                      size={14}
                      className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {t.miniJeux.descriptions[game.key]}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap gap-1.5">
                  {game.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${TAG_STYLES[tag]}`}
                    >
                      {TAG_LABELS[tag]}
                    </span>
                  ))}
                </div>
                <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 ml-3">
                  <Clock size={10} />
                  {game.duration}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-16">
            {t.miniJeux.noGames}
          </p>
        )}
      </main>
    </div>
  );
}
