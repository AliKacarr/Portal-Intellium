/** Eski import uyumluluğu; formlarda üst sınır uygulanmıyor. */
export const EXPENSE_SHORT_TEXT_MAX_LEN = 12;
export const EXPENSE_ITEM_NAME_MAX_LEN = 15;

/** Yalnızca trim; kesme yok. */
export const clipExpenseShortText = (value, _maxLenIgnored) =>
  String(value ?? "").trim();
