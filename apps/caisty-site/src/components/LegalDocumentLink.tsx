import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

export function legalDocumentLinkClass(isLight: boolean): string {
  return isLight ? "text-[#f97316] hover:underline no-underline" : "text-emerald-400 hover:underline";
}

type LegalDocumentLinkProps = Omit<LinkProps, "target" | "rel"> & {
  isLight?: boolean;
  children: ReactNode;
};

/** Legal routes always open in a new tab (consistent with Customer Portal). */
export function LegalDocumentLink({ isLight, className, children, ...props }: LegalDocumentLinkProps) {
  return (
    <Link
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      reloadDocument
      className={className ?? (isLight !== undefined ? legalDocumentLinkClass(isLight) : undefined)}
    >
      {children}
    </Link>
  );
}
