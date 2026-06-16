export const EXPENSE_CATEGORY_STORAGE_KEY = "expenseCategoryDefinitionsV1";

export const DEFAULT_EXPENSE_CATEGORY_DEFINITIONS = [
  {
    value: "Ulaşım",
    system: true,
    visible: true,
  },
  {
    value: "Yemek",
    system: true,
    visible: true,
  },
  {
    value: "Teknoloji",
    system: true,
    visible: true,
  },
  {
    value: "Telekom",
    system: true,
    visible: true,
  },
  {
    value: "Diğer",
    system: true,
    visible: true,
  },
];

const isBrowser = () => typeof window !== "undefined";

const normalizeExpenseCategoryValue = (value) => String(value || "").trim();
const normalizeExpenseCategoryAliases = (aliases = []) =>
  Array.from(
    new Set(
      (Array.isArray(aliases) ? aliases : [])
        .map((value) => normalizeExpenseCategoryValue(value))
        .filter(Boolean)
    )
  );
const matchesExpenseCategoryValue = (category, value) => {
  const normalizedValue = normalizeExpenseCategoryValue(value).toLowerCase();

  if (!normalizedValue) {
    return false;
  }

  return (
    category.value.toLowerCase() === normalizedValue ||
    normalizeExpenseCategoryAliases(category.aliases).some(
      (alias) => alias.toLowerCase() === normalizedValue
    )
  );
};

let memoryExpenseCategories = [];

const readStoredExpenseCategories = () => {
  return memoryExpenseCategories;
};

const dispatchExpenseCategoryUpdate = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event("expense-categories-updated"));
};

export const getExpenseCategoryDefinitions = () => {
  const storedCategories = readStoredExpenseCategories();
  const mergedCategories = new Map();

  DEFAULT_EXPENSE_CATEGORY_DEFINITIONS.forEach((category) => {
    mergedCategories.set(category.value.toLowerCase(), {
      ...category,
    });
  });

  storedCategories.forEach((category) => {
    const normalizedValue = normalizeExpenseCategoryValue(category?.value);

    if (!normalizedValue) {
      return;
    }

    const categoryKey = normalizedValue.toLowerCase();
    const existingCategory = mergedCategories.get(categoryKey);

    if (existingCategory) {
      mergedCategories.set(categoryKey, {
        ...existingCategory,
        visible: category?.visible !== false,
        aliases: normalizeExpenseCategoryAliases(category?.aliases),
      });
      return;
    }

    mergedCategories.set(categoryKey, {
      value: normalizedValue,
      system: false,
      visible: category?.visible !== false,
      aliases: normalizeExpenseCategoryAliases(category?.aliases),
    });
  });

  return Array.from(mergedCategories.values());
};

export const saveExpenseCategoryDefinitions = (categories = []) => {
  const normalizedCategories = categories
    .map((category) => ({
      value: normalizeExpenseCategoryValue(category?.value),
      system: category?.system === true,
      visible: category?.visible !== false,
      aliases: normalizeExpenseCategoryAliases(category?.aliases).filter(
        (alias) =>
          alias.toLowerCase() !==
          normalizeExpenseCategoryValue(category?.value).toLowerCase()
      ),
    }))
    .filter((category) => category.value);

  memoryExpenseCategories = normalizedCategories;
  dispatchExpenseCategoryUpdate();

  return normalizedCategories;
};

export const createExpenseCategory = (value) => {
  const normalizedValue = normalizeExpenseCategoryValue(value);

  if (!normalizedValue) {
    throw new Error("Kategori adı boş olamaz.");
  }

  const categories = getExpenseCategoryDefinitions();
  const alreadyExists = categories.some((category) =>
    matchesExpenseCategoryValue(category, normalizedValue)
  );

  if (alreadyExists) {
    throw new Error("Bu kategori zaten mevcut.");
  }

  return saveExpenseCategoryDefinitions([
    ...categories,
    {
      value: normalizedValue,
      system: false,
      visible: true,
      aliases: [],
    },
  ]);
};

export const toggleExpenseCategoryVisibility = (value) => {
  const normalizedValue = normalizeExpenseCategoryValue(value).toLowerCase();

  return saveExpenseCategoryDefinitions(
    getExpenseCategoryDefinitions().map((category) =>
      matchesExpenseCategoryValue(category, normalizedValue)
        ? { ...category, visible: !category.visible }
        : category
    )
  );
};

export const updateExpenseCategory = (currentValue, nextValue) => {
  const normalizedCurrentValue = normalizeExpenseCategoryValue(currentValue);
  const normalizedNextValue = normalizeExpenseCategoryValue(nextValue);

  if (!normalizedCurrentValue || !normalizedNextValue) {
    throw new Error("Kategori adı boş olamaz.");
  }

  const categories = getExpenseCategoryDefinitions();
  const currentCategory = categories.find((category) =>
    matchesExpenseCategoryValue(category, normalizedCurrentValue)
  );

  if (!currentCategory) {
    throw new Error("Kategori bulunamadı.");
  }

  const alreadyExists = categories.some(
    (category) =>
      !matchesExpenseCategoryValue(category, normalizedCurrentValue) &&
      matchesExpenseCategoryValue(category, normalizedNextValue)
  );

  if (alreadyExists) {
    throw new Error("Bu kategori zaten mevcut.");
  }

  return saveExpenseCategoryDefinitions(
    categories.map((category) =>
      matchesExpenseCategoryValue(category, normalizedCurrentValue)
        ? {
            ...category,
            value: normalizedNextValue,
            aliases: normalizeExpenseCategoryAliases([
              ...(category.aliases || []),
              normalizedCurrentValue,
            ]),
          }
        : category
    )
  );
};

export const deleteExpenseCategory = (value) => {
  const normalizedValue = normalizeExpenseCategoryValue(value).toLowerCase();

  return saveExpenseCategoryDefinitions(
    getExpenseCategoryDefinitions().filter(
      (category) =>
        category.system ||
        !matchesExpenseCategoryValue(category, normalizedValue)
    )
  );
};

export const EXPENSE_CATEGORY_VALUES = DEFAULT_EXPENSE_CATEGORY_DEFINITIONS.map(
  (category) => category.value
);

export const EXPENSE_PAYMENT_TYPE_VALUES = ["Kredi Kartı", "Nakit", "Havale"];

export const EXPENSE_STATUS_VALUES = [
  "Onaylandı",
  "Beklemede",
  "Taslak",
  "Tamamlanmamış",
  "Revize Bekliyor",
  "Onaylanmadı",
];

export const isKnownExpenseCategory = (value) =>
  getExpenseCategoryDefinitions().some((category) =>
    matchesExpenseCategoryValue(category, value)
  );

export const isExpenseCategoryVisible = (value) => {
  const normalizedValue = normalizeExpenseCategoryValue(value);

  if (!normalizedValue) {
    return true;
  }

  const matchedCategory = getExpenseCategoryDefinitions().find((category) =>
    matchesExpenseCategoryValue(category, normalizedValue)
  );

  return matchedCategory ? matchedCategory.visible !== false : true;
};

export const resolveExpenseCategoryDefinition = (value) =>
  getExpenseCategoryDefinitions().find((category) =>
    matchesExpenseCategoryValue(category, value)
  );

export const resolveExpenseCategoryValue = (value) =>
  resolveExpenseCategoryDefinition(value)?.value ||
  normalizeExpenseCategoryValue(value);
