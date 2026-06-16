import { useCallback, useEffect, useRef, useState } from "react";

import {
  addExpenseVatRate,
  EXPENSE_SETTINGS_EVENT,
  EXPENSE_SETTINGS_STORAGE_KEY,
  getExpenseSettings,
  removeExpenseVatRate,
  saveExpenseSettings,
  updateExpenseSettings,
} from "../constants/expenseSettings";
import { getExpenseSettingsApi } from "../../../Api/ExpenseSettingsApi";

export default function useExpenseSettings() {
  const [settings, setSettings] = useState(getExpenseSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshSettings = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await getExpenseSettingsApi();
      const apiSettings = response?.data || response;
      const normalized = saveExpenseSettings(apiSettings);
      if (isMountedRef.current) {
        setSettings(normalized);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setSettings(getExpenseSettings());
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorage = (event) => {
      if (!isMountedRef.current) {
        return;
      }
      if (
        !event?.key ||
        event.key === EXPENSE_SETTINGS_STORAGE_KEY ||
        event.type === EXPENSE_SETTINGS_EVENT
      ) {
        setSettings(getExpenseSettings());
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(EXPENSE_SETTINGS_EVENT, handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(EXPENSE_SETTINGS_EVENT, handleStorage);
    };
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return {
    settings,
    mealAcceptedDailyAmount: settings.mealAcceptedDailyAmount,
    previousPeriodCutoffDay: settings.previousPeriodCutoffDay,
    vatRates: settings.vatRates,
    loading,
    error,
    refreshSettings,
    saveSettings: saveExpenseSettings,
    updateSettings: updateExpenseSettings,
    addVatRate: addExpenseVatRate,
    removeVatRate: removeExpenseVatRate,
  };
}
