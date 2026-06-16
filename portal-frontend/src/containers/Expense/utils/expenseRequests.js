import { getExpenseCurrencyCode } from "./expenseCurrency";
import {
  getExpenseAmountForSort,
  getExpenseCreatedAtTimestamp,
  getInvoiceDateTimestamp,
  getNumericExpenseId,
  getOriginalExpenseAmount,
  getRefundExpenseAmount,
  parseAmount,
  resolveExpenseRequestId,
  sumExpenseLineItemsNumeric,
} from "./dashboardMetrics";

const resolveRequestId = resolveExpenseRequestId;

const REQUEST_REVISED_MARKER_KEY = "expenseRequestRevisedMarker";
const EXPENSE_REVISED_MARKER_KEY = "expenseRevisedMarker";
const MARKER_TTL_MS = 45 * 24 * 60 * 60 * 1000;

let memoryRequestRevisedMarker = {};
let memoryExpenseRevisedMarker = {};

const markRequestRevised = (requestId) => {
  if (!requestId) return;
  memoryRequestRevisedMarker[String(requestId)] = Date.now();
};

const wasRequestRevised = (requestId) => {
  if (!requestId) return false;
  const ts = memoryRequestRevisedMarker[String(requestId)];
  if (!ts) return false;
  return Date.now() - Number(ts) < MARKER_TTL_MS;
};

export const __markRequestRevisedForUi = markRequestRevised;

export const __markExpensesRevisedForUi = (expenses = []) => {
  const list = Array.isArray(expenses) ? expenses : [];
  const ids = list
    .map((e) => e?.id ?? e?.Id ?? e?.expenseId ?? e?.ExpenseId)
    .filter((id) => id != null && id !== "")
    .map((id) => String(id));
  if (!ids.length) return;
  const now = Date.now();
  ids.forEach((id) => {
    memoryExpenseRevisedMarker[id] = now;
  });
};

const wasAnyExpenseRevised = (expenses = []) => {
  const list = Array.isArray(expenses) ? expenses : [];
  const ids = list
    .map((e) => e?.id ?? e?.Id ?? e?.expenseId ?? e?.ExpenseId)
    .filter((id) => id != null && id !== "")
    .map((id) => String(id));
  if (!ids.length) return false;
  
  const now = Date.now();
  return ids.some((id) => {
    const ts = memoryExpenseRevisedMarker[id];
    if (!ts) return false;
    return now - Number(ts) < MARKER_TTL_MS;
  });
};

export const getRequestStatus = (expenses = [], requestId = null) => {
  const normalize = (v) => String(v || "").trim();
  const normalized = (expenses || [])
    .map((e) => normalize(e?.status ?? e?.Status))
    .filter(Boolean);
  const statuses = new Set(normalized);

  if (statuses.has("Taslak")) return "Taslak";
  if (statuses.has("Tamamlanmamış")) return "Tamamlanmamış";
  // Öncelik: revize istenmişse her zaman onu göster
  if (statuses.has("Revize Bekliyor")) return "Revize Bekliyor";
  // Kullanıcı revize edip tekrar gönderdiğinde ayrı göster
  if (statuses.has("Revize Edildi")) return "Revize Edildi";
  // Backend resubmit sonrası status'u yine Beklemede döndürebilir; UI'da yine de "Revize edildi" göster.
  if (
    statuses.has("Beklemede") &&
    ((requestId && wasRequestRevised(requestId)) || wasAnyExpenseRevised(expenses))
  ) {
    return "Revize Edildi";
  }
  if (statuses.has("Beklemede")) return "Beklemede";
  if (statuses.has("Onaylanmadı")) return "Onaylanmadı";
  if (statuses.has("Onaylandı")) return "Onaylandı";
  return "Beklemede";
};

export const getRequestCurrencyCode = (expenses = []) => {
  const codes = new Set((expenses || []).map(getExpenseCurrencyCode).filter(Boolean));
  if (codes.size === 1) return Array.from(codes)[0];
  return "MIX";
};

const minInvoiceMs = (expenses = []) => {
  const vals = (expenses || [])
    .map((e) => getInvoiceDateTimestamp(e))
    .filter((n) => n > 0);
  return vals.length ? Math.min(...vals) : 0;
};

const maxInvoiceMs = (expenses = []) => {
  const vals = (expenses || [])
    .map((e) => getInvoiceDateTimestamp(e))
    .filter((n) => n > 0);
  return vals.length ? Math.max(...vals) : 0;
};

const minCreatedMs = (expenses = []) => {
  const vals = (expenses || [])
    .map((e) => getExpenseCreatedAtTimestamp(e))
    .filter((n) => n > 0);
  return vals.length ? Math.min(...vals) : 0;
};

const maxCreatedMs = (expenses = []) => {
  const vals = (expenses || [])
    .map((e) => getExpenseCreatedAtTimestamp(e))
    .filter((n) => n > 0);
  return vals.length ? Math.max(...vals) : 0;
};

const minIdInGroup = (expenses = []) => {
  const ids = (expenses || [])
    .map((e) => getNumericExpenseId(e))
    .filter((n) => n > 0);
  return ids.length ? Math.min(...ids) : 0;
};

const maxIdInGroup = (expenses = []) => {
  const ids = (expenses || [])
    .map((e) => getNumericExpenseId(e))
    .filter((n) => n > 0);
  return ids.length ? Math.max(...ids) : 0;
};

/** Sıralama ve talep toplamı: farklı PB'ler sayısal toplanır (kur dönüşümü yok). */
const sumAmountsForSort = (expenses = []) =>
  (expenses || []).reduce((sum, e) => sum + getExpenseAmountForSort(e), 0);

/**
 * Talep satırı sırası: tek talepte birden fazla fiş varsa
 * fatura tarihi = en erken / en geç fiş tarihi (seçime göre).
 */
const sortExpenseRequests = (requests, sortOption = "dateDesc") => {
  return [...requests].sort((a, b) => {
    const exA = a.expenses || [];
    const exB = b.expenses || [];
    let cmp = 0;

    switch (sortOption) {
      case "dateAsc":
        cmp = minInvoiceMs(exA) - minInvoiceMs(exB);
        break;
      case "createdAsc":
        cmp = minCreatedMs(exA) - minCreatedMs(exB);
        break;
      case "createdDesc":
        cmp = maxCreatedMs(exB) - maxCreatedMs(exA);
        break;
      case "amountAsc":
        cmp = sumAmountsForSort(exA) - sumAmountsForSort(exB);
        break;
      case "amountDesc":
        cmp = sumAmountsForSort(exB) - sumAmountsForSort(exA);
        break;
      case "dateDesc":
      default:
        cmp = maxInvoiceMs(exB) - maxInvoiceMs(exA);
        break;
    }

    if (cmp !== 0) return cmp;

    if (sortOption === "createdAsc" || sortOption === "createdDesc") {
      const idCmp =
        sortOption === "createdDesc"
          ? maxIdInGroup(exB) - maxIdInGroup(exA)
          : minIdInGroup(exA) - minIdInGroup(exB);
      if (idCmp !== 0) return idCmp;
    }

    return String(a.requestId).localeCompare(String(b.requestId));
  });
};

/**
 * Tek masraf veya talep satırı (`expenses[]` içeren) için silme/onay kimlik listesi.
 */
export const getExpenseIdsInRequestBundle = (target) => {
  if (!target) return [];
  const list = Array.isArray(target.expenses) ? target.expenses : [];
  if (list.length > 0) {
    return list
      .map((e) => e?.id ?? e?.Id ?? e?.expenseId ?? e?.ExpenseId)
      .filter((id) => id != null && id !== "");
  }
  const single = target?.id ?? target?.Id ?? target?.expenseId ?? target?.ExpenseId;
  return single != null && single !== "" ? [single] : [];
};

/**
 * Revize yeniden gönderiminde çoklu fatura: tek satır (request) veya tek expense ile aynı talepteki tüm fişleri birleştirir.
 */
export const resolveRequestBundleForResubmit = (expenseOrRow, allExpenses = []) => {
  if (!expenseOrRow) return expenseOrRow;
  if (Array.isArray(expenseOrRow.expenses) && expenseOrRow.expenses.length > 0) {
    return expenseOrRow;
  }
  const rid = resolveRequestId(expenseOrRow);
  if (!rid) return expenseOrRow;
  const list = Array.isArray(allExpenses) ? allExpenses : [];
  const siblings = list.filter((e) => String(resolveRequestId(e)) === String(rid));
  if (siblings.length <= 1) return expenseOrRow;
  const byInvoiceAsc = [...siblings].sort(
    (a, b) => getInvoiceDateTimestamp(a) - getInvoiceDateTimestamp(b)
  );
  return {
    requestId: rid,
    expenses: byInvoiceAsc,
    status: getRequestStatus(byInvoiceAsc, rid),
    expenseCount: byInvoiceAsc.length,
  };
};

export const buildExpenseRequests = (expenses = [], sortOption = "dateDesc") => {
  const list = Array.isArray(expenses) ? expenses : [];
  const map = new Map();

  list.forEach((expense) => {
    const requestId = resolveRequestId(expense);
    if (!requestId) return;
    const existing = map.get(requestId);
    if (existing) {
      existing.expenses.push(expense);
      return;
    }
    map.set(requestId, {
      requestId,
      expenses: [expense],
    });
  });

  const requests = Array.from(map.values()).map((request) => {
    const requestExpenses = request.expenses || [];
    const byInvoiceDesc = [...requestExpenses].sort(
      (a, b) => getInvoiceDateTimestamp(b) - getInvoiceDateTimestamp(a)
    );
    const byInvoiceAsc = [...requestExpenses].sort(
      (a, b) => getInvoiceDateTimestamp(a) - getInvoiceDateTimestamp(b)
    );
    const latestExpense = byInvoiceDesc[0];
    const earliestExpense = byInvoiceAsc[0];
    const currencyCode = getRequestCurrencyCode(requestExpenses);
    // Çalışan ekranı tutarları:
    // - Genel Toplam: sum(totalAmount)
    // - Kabul Edilen: sum(refundAmount)
    // Not: KDV/net gibi alanlardan tekrar hesaplama yapılmaz.
    const sumOriginal = requestExpenses.reduce(
      (sum, e) => {
        const direct = parseAmount(e?.totalAmount ?? e?.originalTotalAmount);
        if (direct > 0) return sum + direct;
        const fromLines = sumExpenseLineItemsNumeric(e);
        return fromLines > 0 ? sum + fromLines : sum;
      },
      0
    );
    const sumApproved = requestExpenses.reduce(
      (sum, e) => sum + parseAmount(getRefundExpenseAmount(e)),
      0
    );

    const firstWithExpenseDraftUuid = requestExpenses.find(
      (e) => e?.__expenseDraftId
    );
    return {
      ...request,
      // Tamamlanmamış DB draft bilgisi: ilk masraftan talep satırına taşı
      __incompleteDraftId:
        latestExpense?.__incompleteDraftId ??
        requestExpenses?.[0]?.__incompleteDraftId ??
        undefined,
      __expenseDraftId:
        firstWithExpenseDraftUuid?.__expenseDraftId ??
        latestExpense?.__expenseDraftId ??
        requestExpenses?.[0]?.__expenseDraftId ??
        undefined,
      status: getRequestStatus(requestExpenses, request.requestId),
      currencyCode,
      sumOriginal,
      sumApproved,
      latestInvoiceDate: latestExpense?.invoiceDate,
      earliestInvoiceDate: earliestExpense?.invoiceDate,
      ownerName: latestExpense?.ownerName,
      creatorName: latestExpense?.creatorName,
      hasKkeg: requestExpenses.some((e) => e?.hasKkeg || e?.isKkeg),
      expenseCount: requestExpenses.length,
    };
  });

  return sortExpenseRequests(requests, sortOption);
};

