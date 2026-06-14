import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";

export type ThemeToggleVariant = "default" | "compact";

export default function ThemeToggle({
  variant = "default",
}: {
  variant?: ThemeToggleVariant;
}) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const isLight = theme === "light";

  if (variant === "compact") {
    const pill = isLight
      ? "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-800 transition-colors hover:bg-slate-100"
      : "inline-flex items-center justify-center rounded-lg border border-white/20 bg-transparent p-2 text-slate-200 transition-colors hover:bg-white/10";

    return (
      <button
        type="button"
        onClick={toggle}
        className={pill}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <Moon className="h-4 w-4" strokeWidth={2} aria-hidden />
        ) : (
          <Sun className="h-4 w-4" strokeWidth={2} aria-hidden />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        isLight
          ? "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
          : "border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
      }`}
      aria-label="Theme umschalten"
      title="Theme umschalten"
    >
      <span className="text-xs font-semibold">{isDark ? "Dark" : "Light"}</span>
      <span aria-hidden className="text-lg">
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
