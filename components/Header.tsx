"use client";

import React, { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";
import { PMFBanner } from "@/components/PMFBanner";
import { BetaReferralBanner } from "@/components/BetaReferralBanner";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useI18n, type Locale } from "@/lib/i18n";

interface HeaderProps {
  backHref?: string;
  currentTool?: string;
  parentHref?: string;
  parentLabel?: string;
  breadcrumbs?: { href?: string; label: string }[];
  /** Hide navigation links — for unauthenticated game participants */
  guestMode?: boolean;
}

const LOCALES: { code: Locale; flag: string; label: string }[] = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
];

export function Header({ backHref, currentTool, parentHref, parentLabel, breadcrumbs, guestMode }: HeaderProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [dark, setDark]           = useState(false);
  const [isAdmin, setIsAdmin]     = useState(false);
  const [ready, setReady]         = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mc_theme");
    const isDark = stored !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setIsAdmin(profile?.role === "admin");
      setReady(true);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("mc_theme", next ? "dark" : "light");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      {!guestMode && <BetaReferralBanner />}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">

          {/* Logo */}
          {guestMode ? (
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white opacity-70">
              <Logo withWordmark size={30} />
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded">
                Beta
              </span>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity text-gray-900 dark:text-white">
              <Logo withWordmark size={30} />
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded">
                Beta
              </span>
            </Link>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Admin */}
            {ready && isAdmin && (
              <Link
                href="/admin"
                aria-label={t.header.adminSpace}
                title={t.header.backoffice}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LayoutDashboard size={18} />
              </Link>
            )}

            {/* Notifications */}
            {ready && <NotificationCenter />}

            {/* Suggestions */}
            {ready && (
              <Link
                href="/suggestions"
                aria-label={t.header.shareIdea}
                title={t.header.suggestions}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Lightbulb size={18} />
              </Link>
            )}

            {/* Paramètres — thème, langue, profil, premium */}
            <div ref={settingsRef} className="relative">
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                aria-label="Paramètres"
                title="Paramètres"
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  settingsOpen
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Settings
                  size={18}
                  className={`transition-transform duration-300 ${settingsOpen ? "rotate-45" : "rotate-0"}`}
                />
              </button>

              {/* Dropdown settings */}
              <div
                className={`absolute right-0 top-11 z-50 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-200 origin-top ${
                  settingsOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                {/* Dark / Light toggle */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    {dark ? <Moon size={14} /> : <Sun size={14} />}
                    <span>{dark ? "Mode sombre" : "Mode clair"}</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    aria-label={t.header.toggleTheme}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors duration-150 flex-shrink-0 ${
                      dark
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {dark ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Langue */}
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-2">
                    Langue
                  </p>
                  <div className="flex gap-1.5">
                    {LOCALES.map(({ code, flag, label }) => (
                      <button
                        key={code}
                        onClick={() => setLocale(code)}
                        title={label}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg text-base transition-colors ${
                          locale === code
                            ? "bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-300 dark:ring-blue-700"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {flag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profil & Premium */}
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setSettingsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User size={14} className="text-gray-400 dark:text-gray-500" />
                    Voir mon profil
                  </Link>
                  <Link
                    href="/premium"
                    onClick={() => setSettingsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                  >
                    <Crown size={14} />
                    Premium
                  </Link>
                </div>
              </div>
            </div>

            {/* Déconnexion */}
            {ready && (
              <button
                onClick={handleLogout}
                aria-label={t.header.logout}
                title={t.header.logoutTitle}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Fil d'Ariane — breadcrumbs prop */}
      {!guestMode && breadcrumbs && breadcrumbs.length > 0 && (
        <div className="max-w-5xl mx-auto w-full px-6 mt-5 flex items-center gap-2">
          {breadcrumbs.map((item, idx) => {
            const isFirst = idx === 0;
            const isLast  = idx === breadcrumbs.length - 1;
            return (
              <Fragment key={idx}>
                {idx > 0 && <span className="text-gray-300 dark:text-gray-700">/</span>}
                {isLast ? (
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    {isFirst && <ArrowLeft size={12} />}
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                )}
              </Fragment>
            );
          })}
        </div>
      )}

      {/* Fil d'Ariane — legacy props */}
      {!guestMode && !breadcrumbs && (backHref || currentTool) && (
        <div className="max-w-5xl mx-auto w-full px-6 mt-5 flex items-center gap-2">
          {backHref && (
            <>
              <Link
                href={backHref}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft size={12} />
                {t.header.home}
              </Link>
              {(parentLabel || currentTool) && <span className="text-gray-300 dark:text-gray-700">/</span>}
            </>
          )}
          {parentLabel && parentHref && (
            <>
              <Link
                href={parentHref}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {parentLabel}
              </Link>
              {currentTool && <span className="text-gray-300 dark:text-gray-700">/</span>}
            </>
          )}
          {currentTool && (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {currentTool}
            </span>
          )}
        </div>
      )}
    </>
  );
}
