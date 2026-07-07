export function OrdersFilters({
  label,
  todayLabel,
}: {
  label: string;
  todayLabel: string;
}) {
  return (
    <div className="orders-filter-bar">
      <span className="orders-filter-bar-label">{label}</span>
      <span className="orders-filter-btn orders-filter-btn--active" aria-current="date">
        {todayLabel}
      </span>
    </div>
  );
}
