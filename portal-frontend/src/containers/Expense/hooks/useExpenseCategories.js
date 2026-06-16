import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createExpenseCategory,
  deleteExpenseCategory,
  EXPENSE_CATEGORY_STORAGE_KEY,
  getExpenseCategoryDefinitions,
  toggleExpenseCategoryVisibility,
  updateExpenseCategory,
} from "../constants/expenseOptions";

export default function useExpenseCategories() {
  const [categories, setCategories] = useState(getExpenseCategoryDefinitions);

  const refreshCategories = useCallback(() => {
    setCategories(getExpenseCategoryDefinitions());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorage = (event) => {
      if (
        !event?.key ||
        event.key === EXPENSE_CATEGORY_STORAGE_KEY ||
        event.type === "expense-categories-updated"
      ) {
        refreshCategories();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("expense-categories-updated", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("expense-categories-updated", handleStorage);
    };
  }, [refreshCategories]);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.visible),
    [categories]
  );

  return {
    categories,
    visibleCategories,
    refreshCategories,
    addCategory: createExpenseCategory,
    toggleCategoryVisibility: toggleExpenseCategoryVisibility,
    removeCategory: deleteExpenseCategory,
    renameCategory: updateExpenseCategory,
  };
}
