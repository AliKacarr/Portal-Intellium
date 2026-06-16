/** ISO 4217 — backend ile uyumlu; kur dönüşümü yok */
export const DEFAULT_EXPENSE_CURRENCY = "TRY";

export const getExpenseCurrencyCode = (expense) => {
  const c = expense?.currencyCode;
  if (c && typeof c === "string" && c.trim()) {
    return c.trim().toUpperCase();
  }
  return DEFAULT_EXPENSE_CURRENCY;
};

export const getDistinctCurrencyCodes = (expenses) => {
  const set = new Set(
    (expenses || []).map((e) => getExpenseCurrencyCode(e))
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};
