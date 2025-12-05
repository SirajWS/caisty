import React from "react";
import { useTheme } from "../../lib/theme";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...rest }, ref) => {
    const { theme } = useTheme();
    const isLight = theme === "light";
    const base = isLight
      ? "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      : "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
    const combined = [base, className].filter(Boolean).join(" ");

    return <input ref={ref} className={combined} {...rest} />;
  }
);

Input.displayName = "Input";
