/** German EUR formatting: 1.234,56 € */
export function formatMoneyDE(cents: number, currency = "EUR"): string {
  const value = cents / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatPercentDE(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
