export const EXPENSE_SETTINGS_STORAGE_KEY = "expenseAdminSettingsV1";
export const EXPENSE_SETTINGS_EVENT = "expense-settings-updated";

export const DEFAULT_EXPENSE_SETTINGS = {
  mealAcceptedDailyAmount: 500,
  previousPeriodCutoffDay: 5,
  vatRates: [1, 10, 20],
};

const isBrowser = () => typeof window !== "undefined";

const clampInteger = (value, min, max, fallback) => {
  const parsedValue = parseInt(value, 10);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(parsedValue, min), max);
};

const normalizeVatRates = (vatRates = []) => {
  const normalizedVatRates = Array.from(
    new Set(
      (Array.isArray(vatRates) ? vatRates : [])
        .map((value) => clampInteger(value, 1, 100, null))
        .filter((value) => value !== null)
    )
  ).sort((rateA, rateB) => rateA - rateB);

  return normalizedVatRates.length
    ? normalizedVatRates
    : DEFAULT_EXPENSE_SETTINGS.vatRates;
};

export const normalizeExpenseSettings = (settings = {}) => ({
  mealAcceptedDailyAmount: clampInteger(
    settings.mealAcceptedDailyAmount,
    1,
    1000000,
    DEFAULT_EXPENSE_SETTINGS.mealAcceptedDailyAmount
  ),
  previousPeriodCutoffDay: clampInteger(
    settings.previousPeriodCutoffDay,
    1,
    31,
    DEFAULT_EXPENSE_SETTINGS.previousPeriodCutoffDay
  ),
  vatRates: normalizeVatRates(settings.vatRates),
});

const dispatchExpenseSettingsUpdate = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(EXPENSE_SETTINGS_EVENT));
};

let memoryExpenseSettings = null;

export const getExpenseSettings = () => {
  if (memoryExpenseSettings) {
    return memoryExpenseSettings;
  }
  return DEFAULT_EXPENSE_SETTINGS;
};

export const saveExpenseSettings = (settings = {}) => {
  const normalizedSettings = normalizeExpenseSettings(settings);

  memoryExpenseSettings = normalizedSettings;
  dispatchExpenseSettingsUpdate();

  return normalizedSettings;
};

export const updateExpenseSettings = (patch = {}) =>
  saveExpenseSettings({
    ...getExpenseSettings(),
    ...patch,
  });

export const addExpenseVatRate = (value) => {
  const settings = getExpenseSettings();

  return updateExpenseSettings({
    vatRates: [...settings.vatRates, value],
  });
};

export const removeExpenseVatRate = (value) => {
  const settings = getExpenseSettings();

  return updateExpenseSettings({
    vatRates: settings.vatRates.filter(
      (vatRate) => Number(vatRate) !== Number(value)
    ),
  });
};

export const resolveDefaultExpenseVatRate = (
  invoiceTitle,
  vatRates = getExpenseSettings().vatRates
) => {
  const normalizedVatRates = normalizeVatRates(vatRates);
  const preferredRate = invoiceTitle === "Yemek" ? 10 : 20;

  if (normalizedVatRates.includes(preferredRate)) {
    return preferredRate;
  }

  return normalizedVatRates[normalizedVatRates.length - 1] || preferredRate;
};
