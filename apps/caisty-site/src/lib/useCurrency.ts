import { useState, useEffect } from "react";
import type { Currency } from "../config/pricing";

const CURRENCY_STORAGE_KEY = "caisty_currency";

// Auto-Detection basierend auf Browser-Sprache
function detectCurrency(): Currency {
  if (typeof window === "undefined") return "EUR";
  
  const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
  if (stored === "EUR" || stored === "TND") {
    return stored;
  }

  // Auto-Detection: Wenn Sprache arabisch oder französisch + Tunesien → TND
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("ar") || (lang.startsWith("fr") && lang.includes("tn"))) {
    return "TND";
  }

  // Default: EUR
  return "EUR";
}

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof window === "undefined") return "EUR";
    return detectCurrency();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored === "EUR" || stored === "TND") {
        setCurrency(stored);
      }
    }
  }, []);

  const setCurrencyAndStore = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    }
  };

  return { currency, setCurrency: setCurrencyAndStore };
}

