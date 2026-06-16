/**
 * Masraf formlarında alan sırası (üstten alta) — validate hatalarında ilk eksik görünür alana gitmek için.
 */
const MASRAF_TOP_DOWN_FIELDS = [
  "invoiceNumber",
  "invoiceDate",
  "projectName",
  "invoiceTitle",
  "extraCategorie",
  "expenseType",
  "items",
  "currencyCode",
  "totalAmount",
  "vatRate",
  "vat",
  "acceptedDailyAmount",
  "uncoveredAmount",
  "mealPersonCount",
  "mealPersonNames",
  "description",
  "upload",
];

const fieldOrderKey = (fieldName) => {
  const i = MASRAF_TOP_DOWN_FIELDS.indexOf(String(fieldName || ""));
  return i === -1 ? 1000 : i;
};

/** @returns {number[]} */
const namePathRank = (name) => {
  const path = Array.isArray(name) ? name : [name];
  if (!path.length) return [9999, 0, 0, 0];

  if (path[0] === "userId") {
    return [0, 0, 0, 0];
  }

  if (path[0] === "expenses") {
    const expenseIndex = Number(path[1]);
    const ei = Number.isFinite(expenseIndex) ? expenseIndex : 9999;
    const rest = path.slice(2);
    if (rest[0] === "items" && rest.length >= 2) {
      const itemIndex = Number(rest[1]);
      const ii = Number.isFinite(itemIndex) ? itemIndex : 9999;
      const subField = rest[2] || "";
      return [1, ei, 0, ii, fieldOrderKey(subField)];
    }
    const topField = rest[0] || "";
    return [1, ei, 1, fieldOrderKey(topField), 0];
  }

  if (path[0] === "items" && path.length >= 2) {
    const itemIndex = Number(path[1]);
    const ii = Number.isFinite(itemIndex) ? itemIndex : 9999;
    const subField = path[2] || "";
    return [2, 0, 0, ii, fieldOrderKey(subField)];
  }

  return [2, 0, 1, fieldOrderKey(path[0] || ""), 0];
};

const compareRanks = (a, b) => {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const av = a[i] ?? -1;
    const bv = b[i] ?? -1;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
};

export const getSortedValidationErrorFields = (errorFields) => {
  if (!Array.isArray(errorFields) || !errorFields.length) return [];
  return [...errorFields].sort((x, y) =>
    compareRanks(namePathRank(x?.name), namePathRank(y?.name))
  );
};

/** Ant Design Form: üstten alta sıraya göre ilk hatalı alana kaydır. */
export const scrollFormToFirstExpenseError = (form, error) => {
  if (!form?.scrollToField || !error?.errorFields?.length) return;
  const sorted = getSortedValidationErrorFields(error.errorFields);
  const first = sorted[0]?.name;
  if (first == null) return;
  try {
    form.scrollToField(first, { behavior: "smooth", block: "center" });
  } catch {
    form.scrollToField(first);
  }
};
