// Legacy-Kompatibilität - wird durch pricing.ts ersetzt
// Diese Datei bleibt für Rückwärtskompatibilität
import { PRICING, TRIAL_DAYS, MAX_DEVICES } from "./pricing";

export const PRICING_PLANS = {
  trialDays: TRIAL_DAYS,
  starter: {
    monthly: PRICING.EUR.starter.monthly,
    yearly: PRICING.EUR.starter.yearly,
    devices: MAX_DEVICES.starter,
  },
  pro: {
    monthly: PRICING.EUR.pro.monthly,
    yearly: PRICING.EUR.pro.yearly,
    devices: MAX_DEVICES.pro,
  },
};
  