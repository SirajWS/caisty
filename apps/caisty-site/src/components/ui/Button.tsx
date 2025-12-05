import React from "react";
import { useTheme } from "../../lib/theme";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const base =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const sizeClasses =
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";

  let variantClasses = "";

  switch (variant) {
    case "secondary":
      variantClasses = isLight
        ? "bg-slate-200 text-slate-900 hover:bg-slate-300 border border-slate-300"
        : "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700";
      break;
    case "outline":
      variantClasses = isLight
        ? "border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-50"
        : "border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-900";
      break;
    case "ghost":
      variantClasses = isLight
        ? "bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent"
        : "bg-transparent text-slate-200 hover:bg-slate-900 border border-transparent";
      break;
    default:
      variantClasses =
        "bg-emerald-500 text-slate-950 hover:bg-emerald-400 border border-emerald-500";
  }

  const widthClass = fullWidth ? "w-full" : "";
  const combined = [base, sizeClasses, variantClasses, widthClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={combined} {...rest}>
      {children}
    </button>
  );
};
