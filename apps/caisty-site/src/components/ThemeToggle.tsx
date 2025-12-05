import { useTheme } from "../lib/theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const isLight = theme === "light";

  return (
    <button
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

