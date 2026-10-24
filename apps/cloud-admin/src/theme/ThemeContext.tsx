// apps/cloud-admin/src/theme/ThemeContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "caisty.admin.theme";

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }

  return "dark";
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = resolveInitialTheme();
    // Apply before first paint of children to avoid a dark FOUC in light mode
    applyThemeToDocument(initial);
    return initial;
  });

  useEffect(() => {
    // Existing mechanism: data-theme on <html> + admin-root--{theme} in AppShell
    applyThemeToDocument(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Theme-Farben
export const themeColors = {
  dark: {
    bg: "#020617",
    bgSecondary: "#0f172a",
    bgTertiary: "#1e293b",
    border: "#1f2937",
    borderSecondary: "#334155",
    text: "#e5e7eb",
    textSecondary: "#9ca3af",
    textTertiary: "#64748b",
    accent: "#F26722",
    accentHover: "#D9581C",
    error: "#ef4444",
    errorBg: "rgba(239, 68, 68, 0.1)",
    success: "#22c55e",
    card: "rgba(15, 23, 42, 0.9)",
    input: "#0f172a",
    button: "#F26722",
    buttonHover: "#D9581C",
  },
  light: {
    bg: "#ffffff",
    bgSecondary: "#f8fafc",
    bgTertiary: "#f1f5f9",
    border: "#e2e8f0",
    borderSecondary: "#cbd5e1",
    text: "#0f172a",
    textSecondary: "#475569",
    textTertiary: "#64748b",
    accent: "#F26722",
    accentHover: "#D9581C",
    error: "#ef4444",
    errorBg: "rgba(239, 68, 68, 0.1)",
    success: "#22c55e",
    card: "rgba(255, 255, 255, 0.95)",
    input: "#ffffff",
    button: "#F26722",
    buttonHover: "#D9581C",
  },
};

