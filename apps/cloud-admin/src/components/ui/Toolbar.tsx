import type { ReactNode } from "react";

type ToolbarProps = {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Toolbar({ children, footer, className = "" }: ToolbarProps) {
  return (
    <div className={`ds-toolbar ${className}`.trim()}>
      <div className="ds-toolbar-row">{children}</div>
      {footer ? <div className="ds-toolbar-footer">{footer}</div> : null}
    </div>
  );
}
