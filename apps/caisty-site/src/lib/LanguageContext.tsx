// apps/caisty-site/src/lib/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { Language } from "./translations/types";
import { isLanguage } from "./translations/types";

const TN_HOST = "tn.caisty.com";

function readInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }
  const saved = localStorage.getItem("caisty.language");
  const normalized = saved?.toLowerCase();
  if (normalized && isLanguage(normalized)) {
    return normalized;
  }
  // Tunesien-Subdomain: Standard Arabisch
  if (window.location.hostname === TN_HOST) {
    return "ar";
  }
  const browserLang = navigator.language.split("-")[0].toLowerCase();
  if (isLanguage(browserLang)) {
    return browserLang;
  }
  return "en";
}

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: "en",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  const setLanguage = (lang: Language) => {
    const next: Language = isLanguage(lang) ? lang : "en";
    setLanguageState(next);
    localStorage.setItem("caisty.language", next);
    // RTL für Arabisch setzen
    if (next === "ar") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = next;
    }
  };

  useEffect(() => {
    // Initial RTL/LTR setzen
    if (language === "ar") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

