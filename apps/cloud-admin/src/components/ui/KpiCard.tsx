type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export function KpiCard({ label, value, hint, className = "" }: KpiCardProps) {
  return (
    <div className={`ds-kpi-card ${className}`.trim()}>
      <div className="ds-kpi-label">{label}</div>
      <div className="ds-kpi-value">{value}</div>
      {hint ? <div className="ds-kpi-hint">{hint}</div> : null}
    </div>
  );
}
