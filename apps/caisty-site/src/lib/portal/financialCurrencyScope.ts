export type FinancialCurrencySummary = {
  financialCurrency?: string | null;
  currency?: string | null;
  mixedCurrency?: boolean;
  excludedTransactionCount?: number;
  hasCurrencyInconsistencies?: boolean;
  paymentSummary?: { currency?: string | null };
};

export function financialCurrencyScope(summary?: FinancialCurrencySummary | null) {
  const financialCurrency = (
    summary?.financialCurrency ||
    summary?.currency ||
    summary?.paymentSummary?.currency ||
    ""
  )
    .trim()
    .toUpperCase();
  const excludedTransactionCount = summary?.excludedTransactionCount ?? 0;
  return {
    financialCurrency,
    showMoney: financialCurrency.length > 0,
    showExclusionBanner:
      excludedTransactionCount > 0 ||
      Boolean(summary?.hasCurrencyInconsistencies),
    excludedTransactionCount,
    hasCurrencyInconsistencies: Boolean(summary?.hasCurrencyInconsistencies),
  };
}

export function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{${key}}}`, String(value));
  }
  return result;
}

export function formatCurrencyExclusionBanner(input: {
  summary?: FinancialCurrencySummary | null;
  warning: string;
  inconsistencyWarning?: string;
}): string | null {
  const scope = financialCurrencyScope(input.summary);
  if (!scope.showExclusionBanner) return null;
  const warning = formatTemplate(input.warning, {
    currency: scope.financialCurrency,
    count: scope.excludedTransactionCount,
  });
  if (scope.hasCurrencyInconsistencies && input.inconsistencyWarning) {
    return `${warning} ${input.inconsistencyWarning}`;
  }
  return warning;
}
