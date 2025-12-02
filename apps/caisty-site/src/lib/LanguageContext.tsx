// apps/caisty-site/src/lib/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { Language } from "./translations/types";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: "de",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Lade gespeicherte Sprache aus localStorage oder Browser-Sprache
    const saved = localStorage.getItem("caisty.language") as Language | null;
    if (saved && ["de", "en", "fr", "ar"].includes(saved)) {
      return saved;
    }
    // Browser-Sprache erkennen
    const browserLang = navigator.language.split("-")[0];
    if (["de", "en", "fr", "ar"].includes(browserLang)) {
      return browserLang as Language;
    }
    return "de"; // Default
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("caisty.language", lang);
    // RTL für Arabisch setzen
    if (lang === "ar") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = lang;
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

