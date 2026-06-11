import { useState, useEffect } from "react";
import type { Currency } from "../config/pricing";

const CURRENCY_STORAGE_KEY = "caisty_currency";

const TN_HOST = "tn.caisty.com";

function isTunisiaHost(): boolean {
  return typeof window !== "undefined" && window.location.hostname === TN_HOST;
}

// Auto-Detection basierend auf Browser-Sprache
function detectCurrency(): Currency {
  if (typeof window === "undefined") return "EUR";

  if (isTunisiaHost()) {
    return "TND";
  }

  const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
  if (stored === "EUR" || stored === "TND") {
    return stored;
  }

  return "EUR";
}

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof window === "undefined") return "EUR";
    return detectCurrency();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isTunisiaHost()) {
      localStorage.setItem(CURRENCY_STORAGE_KEY, "TND");
      setCurrency("TND");
      return;
    }
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    // Global site: normalisiere alte TND-Speicherung zurück auf EUR (Abrechnung EUR)
    if (stored === "TND") {
      localStorage.setItem(CURRENCY_STORAGE_KEY, "EUR");
      setCurrency("EUR");
    } else if (stored === "EUR") {
      setCurrency("EUR");
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

