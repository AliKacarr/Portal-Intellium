import { normalizeExpenseDraftRouteKey } from "./expenseDrafts";

const STORAGE_KEY_PREFIX = "expenseCreatorVisibleRecords";
export const CREATOR_VISIBLE_FLAG = "__visibleToCreator";

const getStorageKey = (userId) => `${STORAGE_KEY_PREFIX}:${userId}`;

const getExpenseKey = (expense) =>
  String(expense?.id ?? expense?.invoiceNumber ?? "");

const getExpenseCreatorId = (expense) =>
  expense?.createdUser?.id ??
  expense?.createdUserId ??
  expense?.createdById ??
  expense?.createdBy?.id ??
  expense?.insertUserId ??
  expense?.createdByUserId ??
  expense?.insertUser?.id ??
  expense?.createdByUser?.id;

const isBrowser = () => typeof window !== "undefined";

export const isDelegatedExpenseVisibleToCreator = (expense, creatorUserId) => {
  if (!creatorUserId || !expense) {
    return false;
  }

  if (expense?.[CREATOR_VISIBLE_FLAG] === true) {
    return true;
  }

  return (
    String(getExpenseCreatorId(expense)) === String(creatorUserId) &&
    String(expense.userId) !== String(creatorUserId)
  );
};

const memoryCreatorVisibleExpenses = new Map();

export const readCreatorVisibleExpenses = (creatorUserId) => {
  if (!creatorUserId) {
    return [];
  }
  const expenses = memoryCreatorVisibleExpenses.get(creatorUserId);
  return Array.isArray(expenses) ? expenses : [];
};

const writeCreatorVisibleExpenses = (creatorUserId, expenses) => {
  if (!creatorUserId) {
    return;
  }
  memoryCreatorVisibleExpenses.set(creatorUserId, expenses);
};

const toStoredCreatorVisibleExpense = (expense) => {
  if (!expense) {
    return expense;
  }

  const { imageData, ...restExpense } = expense;

  return {
    ...restExpense,
    [CREATOR_VISIBLE_FLAG]: true,
  };
};

export const mergeCreatorVisibleExpenses = (expenses, creatorUserId) => {
  const mergedExpenses = new Map(
    (Array.isArray(expenses) ? expenses : []).map((expense) => [
      getExpenseKey(expense),
      expense,
    ])
  );

  readCreatorVisibleExpenses(creatorUserId).forEach((expense) => {
    const expenseKey = getExpenseKey(expense);

    if (!expenseKey || mergedExpenses.has(expenseKey)) {
      return;
    }

    if (isDelegatedExpenseVisibleToCreator(expense, creatorUserId)) {
      mergedExpenses.set(expenseKey, expense);
    }
  });

  return Array.from(mergedExpenses.values());
};

export const upsertCreatorVisibleExpenses = (creatorUserId, expenses) => {
  if (!creatorUserId || !Array.isArray(expenses) || !expenses.length) {
    return;
  }

  const nextExpenses = new Map(
    readCreatorVisibleExpenses(creatorUserId).map((expense) => [
      getExpenseKey(expense),
      expense,
    ])
  );

  expenses.forEach((expense) => {
    const expenseKey = getExpenseKey(expense);

    if (!expenseKey) {
      return;
    }

    if (isDelegatedExpenseVisibleToCreator(expense, creatorUserId)) {
      nextExpenses.set(expenseKey, expense);
      return;
    }

    nextExpenses.delete(expenseKey);
  });

  writeCreatorVisibleExpenses(
    creatorUserId,
    Array.from(nextExpenses.values()).map(toStoredCreatorVisibleExpense)
  );
};

export const removeCreatorVisibleExpense = (creatorUserId, expenseId) => {
  if (!creatorUserId || expenseId == null) {
    return;
  }

  writeCreatorVisibleExpenses(
    creatorUserId,
    readCreatorVisibleExpenses(creatorUserId).filter(
      (expense) => String(expense?.id) !== String(expenseId)
    )
  );
};

/**
 * DB uuid taslağı silindiğinde delegated görünürlük localStorage kaydını da temizler.
 * Aksi halde mergeCreatorVisibleExpenses bir sonraki fetch'te silinmiş satırı geri ekler (özellikle çalışan hesabı).
 */
export const removeCreatorVisibleEntriesForExpenseDraft = (
  creatorUserId,
  expenseDraftUuid
) => {
  if (!creatorUserId || expenseDraftUuid == null || expenseDraftUuid === "") {
    return;
  }

  const needle = normalizeExpenseDraftRouteKey(expenseDraftUuid);
  if (!needle) return;

  const draftReqPrefix = `draft_${needle}`;

  const next = readCreatorVisibleExpenses(creatorUserId).filter((expense) => {
    const rowDraft = normalizeExpenseDraftRouteKey(expense?.__expenseDraftId);
    if (rowDraft === needle) return false;
    if (String(expense?.__expenseDraftId ?? "") === String(expenseDraftUuid ?? ""))
      return false;

    const rid = String(expense?.requestId ?? "");
    if (rid === draftReqPrefix || rid.startsWith(`${draftReqPrefix}_`)) return false;

    const eid = String(expense?.id ?? "");
    if (eid.startsWith(`${draftReqPrefix}_`)) return false;

    return true;
  });

  writeCreatorVisibleExpenses(creatorUserId, next);
};
