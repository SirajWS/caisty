import type { SelectHTMLAttributes, ReactNode } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
};

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select className={`ds-select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
