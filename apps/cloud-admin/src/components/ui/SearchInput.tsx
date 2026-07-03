import type { InputHTMLAttributes } from "react";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className = "", ...props }: SearchInputProps) {
  return (
    <input
      type="text"
      className={`ds-input ds-input--search ${className}`.trim()}
      {...props}
    />
  );
}
