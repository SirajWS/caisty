export type StatusPillTone = "green" | "amber" | "red" | "gray";

type StatusPillProps = {
  tone: StatusPillTone;
  label: string;
  className?: string;
};

export function StatusPill({ tone, label, className = "" }: StatusPillProps) {
  return (
    <span className={`ds-status-pill ds-status-pill--${tone} ${className}`.trim()}>
      <span className="ds-status-pill__dot" aria-hidden />
      {label}
    </span>
  );
}
