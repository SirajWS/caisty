import React from "react";

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
  const base =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed";

  const sizeClasses =
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";

  let variantClasses = "";

  switch (variant) {
    case "secondary":
      variantClasses =
        "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700";
      break;
    case "outline":
      variantClasses =
        "border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-900";
      break;
    case "ghost":
      variantClasses =
        "bg-transparent text-slate-200 hover:bg-slate-900 border border-transparent";
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
