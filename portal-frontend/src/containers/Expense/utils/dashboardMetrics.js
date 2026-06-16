import {
  buildExpenseCategoryOptions,
  formatExpenseCurrency,
  getExpenseCopy,
  translateExpenseCategory,
} from "./expenseI18n";
import { getCategoryTone } from "./dashboardPresentation";
import { parseMoney, pickExpenseLineField } from "./expenseMoney";
import { DEFAULT_EXPENSE_CURRENCY } from "./expenseCurrency";
import { getExpenseSettings } from "../constants/expenseSettings";

const REQUEST_ID_MAP_STORAGE_KEY = "expenseRequestIdMap";

const getClientRequestIdForExpense = (expense) => {
  if (typeof window === "undefined") return null;
  const expenseId = expense?.id ?? expense?.Id ?? expense?.expenseId ?? expense?.ExpenseId;
  if (!expenseId) return null;
  try {
    const raw = window.localStorage.getItem(REQUEST_ID_MAP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed[String(expenseId)];
    return value ? String(value) : null;
  } catch {
    return null;
  }
};

/** Filtre ve talep gruplaması ile aynı talep anahtarı (expenseRequests ile uyumlu) */
export const resolveExpenseRequestId = (expense) =>
  String(
    expense?.requestId ??
      getClientRequestIdForExpense(expense) ??
      expense?.batchId ??
      expense?.groupId ??
      expense?.requestID ??
      expense?.RequestId ??
      expense?.RequestID ??
      expense?.id ??
      expense?.invoiceNumber ??
      ""
  );

/** Liste / özet tutarları — expenseMoney ile aynı 2 ondalık kuralları */
export const parseAmount = (value) => {
  const parsed = parseMoney(value);
  return parsed ?? 0;
};

export const formatCurrency = (value, currencyCode = DEFAULT_EXPENSE_CURRENCY) =>
  formatExpenseCurrency(parseAmount(value), {
    currencyCode: currencyCode || DEFAULT_EXPENSE_CURRENCY,
  });

export const formatCompactCurrency = (
  value,
  currencyCode = DEFAULT_EXPENSE_CURRENCY
) => {
  const numericValue = parseAmount(value);
  return formatExpenseCurrency(numericValue, {
    compact: true,
    currencyCode: currencyCode || DEFAULT_EXPENSE_CURRENCY,
  });
};

export const getOriginalExpenseAmount = (expense) =>
  parseAmount(expense?.originalTotalAmount ?? expense?.totalAmount);

/**
 * Çalışan ekranı "Kabul Edilen Tutar" kaynağı.
 * KDV/net gibi alanlardan tekrar hesaplama yapmayın; backend'in verdiği refundAmount esas.
 */
export const getRefundExpenseAmount = (expense) =>
  parseAmount(
    expense?.refundAmount ??
      expense?.RefundAmount ??
      expense?.approvedTotalAmount ??
      expense?.ApprovedTotalAmount ??
      0
  );

/** Yemek: günlük kabul limiti kişi başı × kişi sayısı (form ile aynı mantık). */
const resolveMealPersonCount = (expense) => {
  const n = Number(expense?.personCount ?? expense?.mealPersonCount);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
};

/** Yemek: API’deki toplam kabul tutarı veya ayarlardan kişi başı × kişi sayısı (liste/KKEG önizlemesi ortak). */
export const getMealAcceptedLimit = (expense) => {
  if (expense?.invoiceTitle !== "Yemek") return null;
  const fromApi = parseAmount(expense?.acceptedDailyAmount);
  if (fromApi > 0) return fromApi;
  const { mealAcceptedDailyAmount } = getExpenseSettings();
  const perPerson = parseAmount(mealAcceptedDailyAmount);
  if (perPerson <= 0) return null;
  return perPerson * resolveMealPersonCount(expense);
};

/**
 * Fişte beyan edilen brüt üst sınır. Ödeme / onaylı tutar bunu aşmaz (API’deki hatalı approvedTotalAmount için).
 * Önce header total; yoksa kalem adet×birim toplamı.
 */
const getDeclaredExpenseGrossCeiling = (expense) => {
  const header = parseAmount(expense?.originalTotalAmount ?? expense?.totalAmount);
  if (header > 0) return header;
  const items = Array.isArray(expense?.items) ? expense.items : [];
  if (!items.length) return 0;
  // Backend sözleşmesi: satır totalAmount KDV dahil brüt toplam olabilir.
  // Öncelik brüt satır toplamı; yoksa qty×unitPrice fallback.
  return items.reduce((sum, item) => {
    const direct = parseAmount(
      item?.totalAmount ?? item?.lineTotal ?? item?.amount ?? item?.grossAmount
    );
    if (direct > 0) return sum + direct;
    const line =
      parseAmount(
        pickExpenseLineField(item, [
          "quantity",
          "qty",
          "Quantity",
          "adet",
          "Adet",
        ])
      ) *
      parseAmount(
        pickExpenseLineField(item, [
          "unitPrice",
          "unit_price",
          "UnitPrice",
          "price",
          "birim_fiyat",
        ])
      );
    return sum + (Number.isFinite(line) ? line : 0);
  }, 0);
};

export const getApprovedExpenseAmount = (expense) => {
  const rawApproved = parseAmount(
    expense?.approvedTotalAmount ??
      expense?.totalAmount ??
      expense?.originalTotalAmount
  );
  const grossCeiling = getDeclaredExpenseGrossCeiling(expense);
  const mealLimit = getMealAcceptedLimit(expense);
  let capped = rawApproved;
  if (mealLimit != null) {
    capped = Math.min(capped, mealLimit);
  }
  if (grossCeiling > 0) {
    capped = Math.min(capped, grossCeiling);
  }
  return Math.max(0, capped);
};

/**
 * Dashboard metriklerinde kullanılacak tutar.
 * approvedTotalAmount varsa ödenecek tutar odur; yoksa original/total fallback.
 * Her zaman fiş brütü (total/original veya kalem toplamı) ile tavanlanır.
 */
export const getEffectiveExpenseAmount = (expense) => {
  if (!expense) return 0;
  return getApprovedExpenseAmount(expense);
};

/**
 * Fiş kalemlerinin sayısal toplamı (para birimi dönüşümü yok; sıralama için birim gibi toplanır).
 */
export const sumExpenseLineItemsNumeric = (expense) => {
  const items = Array.isArray(expense?.items) ? expense.items : [];
  if (!items.length) return 0;
  return items.reduce((sum, item) => {
    const direct = parseAmount(
      item?.approvedAmount ??
        item?.totalAmount ??
        item?.lineTotal ??
        item?.amount
    );
    if (direct > 0) return sum + direct;
    const q = parseAmount(
      pickExpenseLineField(item, [
        "quantity",
        "qty",
        "Quantity",
        "adet",
        "Adet",
      ])
    );
    const p = parseAmount(
      pickExpenseLineField(item, [
        "unitPrice",
        "unit_price",
        "UnitPrice",
        "price",
        "birim_fiyat",
      ])
    );
    const line = q * p;
    return sum + (Number.isFinite(line) ? line : 0);
  }, 0);
};

/**
 * Tutar sıralaması: tek veya çoklu para biriminde kalemler sayısal toplanır; yoksa tepe tutar.
 */
export const getExpenseAmountForSort = (expense) => {
  if (!expense) return 0;
  const fromLines = sumExpenseLineItemsNumeric(expense);
  if (fromLines > 0) return fromLines;
  return getEffectiveExpenseAmount(expense);
};

const calculatePercentChange = (currentValue, previousValue) => {
  if (!previousValue) {
    return currentValue ? 100 : 0;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
};

const getMonthWindow = (date) => {
  const currentMonthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const currentMonthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const previousMonthStart = new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    1
  );
  const previousMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);

  return {
    currentMonthStart,
    currentMonthEnd,
    previousMonthStart,
    previousMonthEnd,
  };
};

const filterByMonth = (expenses, startDate, endDate, status) =>
  expenses.filter((expense) => {
    const invoiceDate = new Date(expense.invoiceDate);
    const matchesStatus = status ? expense.status === status : true;

    return matchesStatus && invoiceDate >= startDate && invoiceDate <= endDate;
  });

export const calculateDelta = (expenses, status) => {
  const today = new Date();
  const {
    currentMonthStart,
    currentMonthEnd,
    previousMonthStart,
    previousMonthEnd,
  } = getMonthWindow(today);

  const currentExpenses = filterByMonth(
    expenses,
    currentMonthStart,
    currentMonthEnd,
    status
  );
  const previousExpenses = filterByMonth(
    expenses,
    previousMonthStart,
    previousMonthEnd,
    status
  );

  const currentTotal = currentExpenses.reduce(
    (sum, expense) => sum + getEffectiveExpenseAmount(expense),
    0
  );
  const previousTotal = previousExpenses.reduce(
    (sum, expense) => sum + getEffectiveExpenseAmount(expense),
    0
  );

  return calculatePercentChange(currentTotal, previousTotal);
};

export const calculateCategoryBreakdown = (expenses) => {
  const totalsByCategory = expenses.reduce((acc, expense) => {
    const categoryName = expense.invoiceTitle || "Diğer";
    if (!acc[categoryName]) {
      acc[categoryName] = {
        amount: 0,
        count: 0,
      };
    }

    acc[categoryName].amount += getEffectiveExpenseAmount(expense);
    acc[categoryName].count += 1;
    return acc;
  }, {});

  const grandTotal = Object.values(totalsByCategory).reduce(
    (sum, category) => sum + category.amount,
    0
  );

  return Object.entries(totalsByCategory)
    .sort(([, categoryA], [, categoryB]) => categoryB.amount - categoryA.amount)
    .map(([label, category]) => ({
      key: label,
      label: translateExpenseCategory(label),
      amount: category.amount,
      count: category.count,
      color: getCategoryTone(label).color,
      percentage: grandTotal ? (category.amount / grandTotal) * 100 : 0,
    }));
};

/** Ham tarih/sayı değerini ms'ye çevirir (ISO, DD.MM.YYYY, unix s/ms) */
export const parseExpenseDateValueToMs = (raw) => {
  if (raw === undefined || raw === null || raw === "") return 0;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    if (raw <= 0) return 0;
    return raw < 1e12 ? Math.round(raw * 1000) : Math.round(raw);
  }

  if (raw instanceof Date) {
    const t = raw.getTime();
    return Number.isFinite(t) ? t : 0;
  }

  const dateText = String(raw).trim();
  if (!dateText) return 0;

  const dotnetMs = dateText.match(/\/Date\((-?\d+)\)\//);
  if (dotnetMs) {
    const t = Number(dotnetMs[1]);
    return Number.isFinite(t) ? t : 0;
  }

  const direct = new Date(dateText).getTime();
  if (Number.isFinite(direct) && !Number.isNaN(direct)) return direct;

  const dmyMatch = dateText.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    const t = new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  return 0;
};

/** Liste sıralaması ve talep (çoklu fiş) gruplamasında ortak fatura tarihi */
export const getInvoiceDateTimestamp = (expense) => {
  const rawDate = expense?.invoiceDate;
  if (!rawDate) return 0;

  if (rawDate instanceof Date) {
    const direct = rawDate.getTime();
    return Number.isFinite(direct) ? direct : 0;
  }

  return parseExpenseDateValueToMs(rawDate);
};

/** Masraf kaydı kimliği — sıralama eşitliğinde kullanılır */
export const getNumericExpenseId = (expense) => {
  const raw =
    expense?.id ??
    expense?.Id ??
    expense?.expenseId ??
    expense?.ExpenseId;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

const CREATED_AT_FIELD_KEYS = [
  "createdAt",
  "CreatedAt",
  "createdDate",
  "CreatedDate",
  "createdOn",
  "CreatedOn",
  "insertDate",
  "InsertDate",
  "recordDate",
  "RecordDate",
  "dateCreated",
  "DateCreated",
  "createdTime",
  "CreatedTime",
  "createdTimestamp",
  "CreatedTimestamp",
  "created",
  "Created",
];

export const getExpenseCreatedAtTimestamp = (expense) => {
  if (!expense || typeof expense !== "object") {
    return getInvoiceDateTimestamp(expense);
  }

  for (const key of CREATED_AT_FIELD_KEYS) {
    const raw = expense[key];
    const ms = parseExpenseDateValueToMs(raw);
    if (ms > 0) return ms;
  }

  return getInvoiceDateTimestamp(expense);
};

const compareByCreatedAt = (expenseA, expenseB, desc) => {
  const tA = getExpenseCreatedAtTimestamp(expenseA);
  const tB = getExpenseCreatedAtTimestamp(expenseB);
  if (tA !== tB) {
    return desc ? tB - tA : tA - tB;
  }
  const idA = getNumericExpenseId(expenseA);
  const idB = getNumericExpenseId(expenseB);
  if (idA !== idB) {
    return desc ? idB - idA : idA - idB;
  }
  return 0;
};

const invoiceTimestampInRange = (expense, startDate, endDate) => {
  if (!startDate) return true;
  const ts = getInvoiceDateTimestamp(expense);
  if (!ts) return false;
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate || startDate).getTime();
  const lo = Math.min(startMs, endMs);
  const hi = Math.max(startMs, endMs);
  return ts >= lo && ts <= hi;
};

export const filterExpenses = (expenses, filters = {}) => {
  const {
    searchTerm = "",
    selectedCategory,
    selectedStatus,
    selectedUserId,
    amountRange = {},
    dateRange = [null, null],
    period,
    /** 'invoice': fiş tarihi ayı (varsayılan). 'created': masrafın oluşturulduğu ay (revize paneli vb.). */
    periodSource = "invoice",
    minAmount: rawMinAmount,
    maxAmount: rawMaxAmount,
  } = filters;

  const minAmount =
    rawMinAmount !== undefined ? rawMinAmount : amountRange?.minAmount;
  const maxAmount =
    rawMaxAmount !== undefined ? rawMaxAmount : amountRange?.maxAmount;

  const [startDate, endDate] = dateRange;
  /** Tarih aralığında en az bir fişi olan talepler: aynı talepteki diğer satırlar da listelenir */
  const requestIdsWithDateInRange = (() => {
    if (!startDate) return null;
    const set = new Set();
    (expenses || []).forEach((e) => {
      if (!invoiceTimestampInRange(e, startDate, endDate)) return;
      const rid = resolveExpenseRequestId(e);
      if (rid) set.add(rid);
    });
    return set;
  })();

  return (expenses || []).filter((expense) => {
    const query = searchTerm.trim().toLowerCase();
    const searchableText = [
      expense.invoiceNumber,
      expense.projectName,
      expense.description,
      expense.invoiceTitle,
      expense.expenseType,
      expense.ownerName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = query ? searchableText.includes(query) : true;
    const matchesCategory = selectedCategory
      ? expense.invoiceTitle === selectedCategory
      : true;
    const matchesStatus = selectedStatus
      ? expense.status === selectedStatus
      : true;

    const expenseUserId = expense.userId ?? expense.user?.id;
    const draftCreatorId =
      expense?.createdUserId ??
      expense?.createdById ??
      expense?.createdUser?.id;
    const isDraftLike =
      expense?.status === "Taslak" || expense?.status === "Tamamlanmamış";
    const matchesUser =
      selectedUserId && selectedUserId !== "all"
        ? String(expenseUserId) === String(selectedUserId) ||
          (isDraftLike &&
            draftCreatorId != null &&
            String(draftCreatorId) === String(selectedUserId))
        : true;

    const numericAmount = getEffectiveExpenseAmount(expense);
    const matchesMinAmount =
      minAmount === undefined || minAmount === null || minAmount === ""
        ? true
        : numericAmount >= parseAmount(minAmount);
    const matchesMaxAmount =
      maxAmount === undefined || maxAmount === null || maxAmount === ""
        ? true
        : numericAmount <= parseAmount(maxAmount);

    const invoiceDate = expense.invoiceDate
      ? new Date(expense.invoiceDate)
      : null;
    const matchesDate = (() => {
      if (!startDate) return true;
      const rid = resolveExpenseRequestId(expense);
      if (rid && requestIdsWithDateInRange?.has(rid)) return true;
      return invoiceTimestampInRange(expense, startDate, endDate);
    })();

    const matchesPeriod = period
      ? (() => {
          let d = null;
          if (periodSource === "created") {
            const ts = getExpenseCreatedAtTimestamp(expense);
            d = ts ? new Date(ts) : null;
          } else {
            d = invoiceDate;
          }
          if (!d || !Number.isFinite(d.getTime())) return false;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
          return key === period;
        })()
      : true;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesUser &&
      matchesMinAmount &&
      matchesMaxAmount &&
      matchesDate &&
      matchesPeriod
    );
  });
};

export const sortExpenses = (expenses, sortOption = "dateDesc") => {
  const safeExpenses = Array.isArray(expenses) ? [...expenses] : [];

  return safeExpenses.sort((expenseA, expenseB) => {
    if (sortOption === "dateAsc") {
      const d =
        getInvoiceDateTimestamp(expenseA) - getInvoiceDateTimestamp(expenseB);
      return d !== 0
        ? d
        : getNumericExpenseId(expenseA) - getNumericExpenseId(expenseB);
    }

    if (sortOption === "createdAsc") {
      return compareByCreatedAt(expenseA, expenseB, false);
    }

    if (sortOption === "createdDesc") {
      return compareByCreatedAt(expenseA, expenseB, true);
    }

    if (sortOption === "amountAsc") {
      const d =
        getExpenseAmountForSort(expenseA) - getExpenseAmountForSort(expenseB);
      return d !== 0
        ? d
        : getNumericExpenseId(expenseA) - getNumericExpenseId(expenseB);
    }

    if (sortOption === "amountDesc") {
      const d =
        getExpenseAmountForSort(expenseB) - getExpenseAmountForSort(expenseA);
      return d !== 0
        ? d
        : getNumericExpenseId(expenseB) - getNumericExpenseId(expenseA);
    }

    const inv =
      getInvoiceDateTimestamp(expenseB) - getInvoiceDateTimestamp(expenseA);
    return inv !== 0
      ? inv
      : getNumericExpenseId(expenseB) - getNumericExpenseId(expenseA);
  });
};

export const buildCategoryOptions = (expenses, managedCategories) =>
  Array.from(
    new Set(
      (expenses || []).map((expense) => expense.invoiceTitle).filter(Boolean)
    )
  ).length
    ? Array.from(
        new Set(
          (expenses || [])
            .map((expense) => expense.invoiceTitle)
            .filter(Boolean)
        )
      ).map((category) => ({
        label:
          buildExpenseCategoryOptions(managedCategories, {
            includeHidden: true,
          }).find((option) => option.value === category)?.label || category,
        value: category,
      }))
    : buildExpenseCategoryOptions(managedCategories);

export const buildFilterSummaryItems = ({
  filteredExpenses,
  averageAmount,
  topCategory,
  rejectedExpenses,
  metricsCurrencyCode = DEFAULT_EXPENSE_CURRENCY,
}) => {
  const copy = getExpenseCopy();

  return [
    {
      label: copy.summaryRecords,
      value: `${filteredExpenses.length} ${copy.summaryItemCount}`,
    },
    {
      label: copy.summaryAverage,
      value: formatCurrency(averageAmount, metricsCurrencyCode),
    },
    {
      label: copy.summaryHighlight,
      value: topCategory ? topCategory.label : copy.noCategory,
    },
    {
      label: copy.summaryRejected,
      value: `${rejectedExpenses.length} ${copy.recordCount}`,
    },
  ];
};
