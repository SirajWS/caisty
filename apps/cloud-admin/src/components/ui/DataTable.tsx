import type { ReactNode } from "react";

type DataTableProps = {
  children: ReactNode;
  className?: string;
};

export function DataTable({ children, className = "" }: DataTableProps) {
  return (
    <div className={`ds-table-card ${className}`.trim()}>
      <div className="ds-table-wrapper">
        <table className="ds-table admin-table">{children}</table>
      </div>
    </div>
  );
}

type DataTableRowProps = {
  children: ReactNode;
  onClick?: () => void;
  expanded?: boolean;
  detail?: boolean;
  className?: string;
};

export function DataTableRow({
  children,
  onClick,
  expanded,
  detail,
  className = "",
}: DataTableRowProps) {
  const classes = [
    detail ? "ds-table-row-detail" : "ds-table-row-main",
    expanded ? "is-expanded" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className={classes} onClick={onClick}>
      {children}
    </tr>
  );
}
