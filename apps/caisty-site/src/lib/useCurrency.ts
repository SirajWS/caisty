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

  // Standard: Immer EUR (Auto-Detection deaktiviert)
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
      // Wenn TND gespeichert ist, auf EUR zurücksetzen
      if (stored === "TND") {
        localStorage.setItem(CURRENCY_STORAGE_KEY, "EUR");
        setCurrency("EUR");
      } else if (stored === "EUR") {
        setCurrency("EUR");
      }
      // Wenn nichts gespeichert ist, bleibt EUR (Standard)
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

