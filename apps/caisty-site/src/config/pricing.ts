// Zentrale Pricing-Konfiguration für alle Währungen

export type Currency = "EUR" | "TND";

// Billing läuft immer in EUR (PayPal). TND ist nur Anzeige.
export const DEFAULT_BILLING_CURRENCY: Currency = "EUR";
export const SUPPORTED_DISPLAY_CURRENCIES: Currency[] = ["EUR", "TND"];
// Statische Display-Werte für TND (kein Live-Rate, Marketing-Orientierung)
export const DISPLAY_CONVERSION = {
  EUR_TO_TND_FACTOR: 2.6, // Dokumentationszweck – Preise unten bereits gesetzt
};

export const PRICING: Record<Currency, {
  starter: {
    monthly: number;
    yearly: number;
  };
  pro: {
    monthly: number;
    yearly: number;
  };
  trial: {
    monthly: number;
    yearly: number;
  };
}> = {
  EUR: {
    starter: {
      monthly: 14.99,
      yearly: 152, // ~15% Rabatt: 14.99 * 12 * 0.85
    },
    pro: {
      monthly: 29.99,
      yearly: 306, // ~15% Rabatt: 29.99 * 12 * 0.85
    },
    trial: {
      monthly: 0,
      yearly: 0,
    },
  },
  TND: {
    starter: {
      monthly: 39,
      yearly: 398, // ~15% Rabatt: 39 * 12 * 0.85
    },
    pro: {
      monthly: 99,
      yearly: 1010, // ~15% Rabatt: 99 * 12 * 0.85
    },
    trial: {
      monthly: 0,
      yearly: 0,
    },
  },
};

// Weitere Konfiguration
export const TRIAL_DAYS = 3;
export const MAX_DEVICES = {
  starter: 1,
  pro: 3,
  trial: 1,
};

// Währungssymbole
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: "€",
  TND: "TND",
};

// Formatierung
export function formatPrice(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (currency === "EUR") {
    return `${amount.toFixed(2)} ${symbol}`;
  }
  return `${amount} ${symbol}`;
}

