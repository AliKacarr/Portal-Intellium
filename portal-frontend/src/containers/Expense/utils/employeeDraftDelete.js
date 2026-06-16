/**
 * Çalışan listesindeki DB taslağı (expense_drafts uuid snapshot) silmek için tek kaynak:
 * snapshot PK'yı satırdan çıkarır.
 */
import {
  normalizeExpenseDraftRouteKey,
  parseSnapshotGuidFromDraftRequestId,
  parseSnapshotGuidFromSyntheticListId,
} from "./expenseDrafts";

const UUID_HEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function collectBundleIds(row) {
  if (!row) return [];
  if (Array.isArray(row.expenses) && row.expenses.length) {
    return row.expenses
      .map((e) => e?.id ?? e?.Id ?? e?.expenseId ?? e?.ExpenseId)
      .filter((id) => id != null && id !== "");
  }
  const single = row?.id ?? row?.Id ?? row?.expenseId ?? row?.ExpenseId;
  return single != null && single !== "" ? [single] : [];
}

/**
 * @param {object} row — talep satırı veya tek masraf (buildExpenseRequests çıktısı veya ham liste öğesi)
 * @returns {string|null} expense_drafts satır uuid (normalize edilmiş)
 */
export function extractDbDraftSnapshotUuid(row) {
  if (!row || typeof row !== "object") return null;

  const candidates = [];
  candidates.push(row.__expenseDraftId);
  if (Array.isArray(row.expenses)) {
    for (const e of row.expenses) {
      candidates.push(e?.__expenseDraftId);
      const g = parseSnapshotGuidFromSyntheticListId(String(e?.id ?? e?.Id ?? ""));
      if (g) return normalizeExpenseDraftRouteKey(g) || g;
    }
  }

  for (const c of candidates) {
    const k = normalizeExpenseDraftRouteKey(c);
    if (k && UUID_HEX.test(k)) return k;
  }

  for (const raw of collectBundleIds(row)) {
    const g = parseSnapshotGuidFromSyntheticListId(String(raw));
    if (g) return g;
  }

  const rid =
    row.requestId ??
    (Array.isArray(row.expenses) ? row.expenses[0]?.requestId : null);
  const fromReq = parseSnapshotGuidFromDraftRequestId(rid);
  if (!fromReq) return null;
  const k = normalizeExpenseDraftRouteKey(fromReq);
  return k && UUID_HEX.test(k) ? k : fromReq;
}
