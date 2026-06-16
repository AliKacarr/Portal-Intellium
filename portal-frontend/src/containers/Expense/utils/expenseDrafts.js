const DRAFTS_STORAGE_KEY = "expenseDraftsV1";

const isBrowser = () => typeof window !== "undefined";

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const generateId = (prefix) => {
  try {
    if (typeof crypto !== "undefined" && crypto?.randomUUID) {
      return `${prefix}${crypto.randomUUID()}`;
    }
  } catch {
    // ignore
  }
  return `${prefix}${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

export const createDraftRequestId = () => generateId("draftreq_");
export const createDraftExpenseId = () => generateId("draft_");

/** fetchExpenses → draft/my: id = `draft_<snapshotGuid>_<index>` (localStorage V1 taslağı değil) */
const SNAPSHOT_LIST_ROW_ID =
  /^draft_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_(\d+)$/i;

export const isExpenseDbSnapshotSyntheticListId = (id) =>
  typeof id === "string" && SNAPSHOT_LIST_ROW_ID.test(id);

/** Sentetik liste satırından expense_drafts satır uuid'si */
export const parseSnapshotGuidFromSyntheticListId = (id) => {
  if (typeof id !== "string") return null;
  const m = id.match(SNAPSHOT_LIST_ROW_ID);
  return m ? m[1] : null;
};

/** fetchExpenses draft satırında requestId = `draft_<snapshotGuid>` — PK'yı çıkarır */
export const parseSnapshotGuidFromDraftRequestId = (requestId) => {
  const s = String(requestId ?? "").trim();
  const lower = s.toLowerCase();
  if (!lower.startsWith("draft_")) return null;
  const rest = s.slice(6).trim();
  const m = rest.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  return m ? m[1] : null;
};

/** Tarayıcı-only taslak (expenseDraftsV1); DB snapshot satır kimlikleri hariç */
export const isDraftExpenseId = (id) =>
  typeof id === "string" &&
  id.startsWith("draft_") &&
  !isExpenseDbSnapshotSyntheticListId(id);

/** UI veya payload bazen `draft_<uuid>` döner; DELETE /api/expense/draft/{key} için saf GUID/tamsayı kalmalı. */
export const normalizeExpenseDraftRouteKey = (draftId) => {
  const s = String(draftId ?? "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower.startsWith("draft_")) {
    const rest = s.slice(6).trim();
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        rest
      )
    ) {
      return rest;
    }
    if (/^\d+$/.test(rest)) return rest;
  }
  return s;
};

let memoryDraftExpenses = [];

export const listDraftExpenses = () => {
  return memoryDraftExpenses;
};

const writeDraftExpenses = (next, { silent = true } = {}) => {
  memoryDraftExpenses = next || [];
};

export const upsertDraftExpenses = (draftExpenses = [], options = {}) => {
  const list = Array.isArray(draftExpenses) ? draftExpenses : [];
  if (!list.length) return listDraftExpenses();
  const current = listDraftExpenses();
  const map = new Map(current.map((e) => [String(e?.id || ""), e]));
  list.forEach((e) => {
    const id = String(e?.id || "");
    if (!id) return;
    map.set(id, e);
  });
  const next = Array.from(map.values());
  writeDraftExpenses(next, options);
  return next;
};

export const deleteDraftExpenseById = (draftExpenseId) => {
  const id = String(draftExpenseId || "");
  if (!id) return listDraftExpenses();
  const next = listDraftExpenses().filter((e) => String(e?.id || "") !== id);
  writeDraftExpenses(next);
  return next;
};

export const deleteDraftRequestById = (draftRequestId) => {
  const rid = String(draftRequestId || "");
  if (!rid) return listDraftExpenses();
  const next = listDraftExpenses().filter(
    (e) => String(e?.requestId || "") !== rid
  );
  writeDraftExpenses(next);
  return next;
};

export const normalizeDraftExpenseForList = (draftExpense, authUserId) => {
  const nowIso = new Date().toISOString();
  // Masraf sahibi ile taslağı kaydeden kullanıcı ayrı: liste filtresi createdUserId ile eşleşsin
  const ownerUserId =
    draftExpense?.userId != null && draftExpense?.userId !== ""
      ? draftExpense.userId
      : authUserId;
  return {
    ...draftExpense,
    id: draftExpense?.id || createDraftExpenseId(),
    requestId: draftExpense?.requestId || createDraftRequestId(),
    status: "Taslak",
    userId: ownerUserId,
    createdUserId: authUserId ?? draftExpense?.createdUserId,
    createdById: authUserId ?? draftExpense?.createdById,
    createdAt: draftExpense?.createdAt || nowIso,
    invoiceDate: draftExpense?.invoiceDate || null,
  };
};

