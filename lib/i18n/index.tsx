"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, type Translations } from "./translations";

export type Locale = "fr" | "en" | "es";

interface I18nContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContext>({
  locale: "fr",
  setLocale: () => {},
  t: translations.fr,
});

function detectLocale(): Locale {
  const stored = localStorage.getItem("mc_locale") as Locale | null;
  if (stored && stored in translations) return stored;

  const lang = navigator.language?.split("-")[0].toLowerCase();
  if (lang === "en") return "en";
  if (lang === "es") return "es";
  return "fr";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const detected = detectLocale();
    setLocaleState(detected);
    document.documentElement.lang = detected;
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("mc_locale", l);
    document.documentElement.lang = l;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
