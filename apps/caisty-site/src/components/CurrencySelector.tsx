// apps/caisty-site/src/components/CurrencySelector.tsx
import { useState, useRef, useEffect } from "react";
import { useCurrency } from "../lib/useCurrency";
import { useTheme } from "../lib/theme";
import type { Currency } from "../config/pricing";

const currencies: { code: Currency; name: string; symbol: string }[] = [
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "TND", name: "Tunisian Dinar", symbol: "TND" },
];

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentCurrency = currencies.find((c) => c.code === currency);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
          isLight
            ? "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            : "border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
        }`}
        aria-label="Select currency"
      >
        <span className="font-medium">{currentCurrency?.code || currency}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-48 rounded-lg border shadow-xl z-50 overflow-hidden ${
            isLight
              ? "border-slate-300 bg-white"
              : "border-slate-700 bg-slate-900"
          }`}
        >
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => {
                setCurrency(curr.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                currency === curr.code
                  ? isLight
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-800 text-emerald-400"
                  : isLight
                  ? "text-slate-700 hover:bg-slate-50"
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{curr.name}</span>
                <span
                  className={`text-xs ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {curr.symbol}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

