import axios from "axios";

import authAction from "@iso/redux/auth/actions";
import { host } from "../../../Api/host";
import {
  CREATOR_VISIBLE_FLAG,
  mergeCreatorVisibleExpenses,
  removeCreatorVisibleExpense,
  removeCreatorVisibleEntriesForExpenseDraft,
  upsertCreatorVisibleExpenses,
} from "../utils/expenseVisibilityCache";
import {
  ADD_EXPENSE_FAILURE,
  ADD_EXPENSE_REQUEST,
  ADD_EXPENSE_SUCCESS,
  APPROVE_EXPENSE_SUCCESS,
  BULK_ADD_EXPENSE_SUCCESS,
  DELETE_EXPENSE_FAILURE,
  DELETE_EXPENSE_SUCCESS,
  REMOVE_SYNTHETIC_DRAFT_ROWS,
  FETCH_EXPENSES_FAILURE,
  FETCH_EXPENSES_REQUEST,
  FETCH_EXPENSES_SUCCESS,
  PIN_EXPENSE_SUCCESS,
  REJECT_EXPENSE_SUCCESS,
  UPDATE_EXPENSE_FAILURE,
  UPDATE_EXPENSE_REQUEST,
  UPDATE_EXPENSE_SUCCESS,
} from "./actionTypes";
import { resolveExpenseRequestId } from "../utils/dashboardMetrics";
import { extractDbDraftSnapshotUuid } from "../utils/employeeDraftDelete";
import {
  deleteDraftExpenseById,
  isDraftExpenseId,
  isExpenseDbSnapshotSyntheticListId,
  listDraftExpenses,
  normalizeDraftExpenseForList,
  normalizeExpenseDraftRouteKey,
  parseSnapshotGuidFromSyntheticListId,
  upsertDraftExpenses,
} from "../utils/expenseDrafts";

/** Paralel fetch yarışı: önce başlayan istek geç bitince silinmiş taslağı listede geri göstermesin. */
let fetchExpensesGeneration = 0;

/** Yeni liste çekilince önceki axios zincirini iptal et (tamamlanan eski yanıt Redux'a yazılmasın). */
let expenseFetchAbortController = null;

/**
 * Yeni silinen taslak/tamamlanmamış ID'leri: fetchExpenses yanıtından filtrelenir.
 * Böylece silme → hemen fetch yarış koşulunda kayıt listeye geri gelmiyor.
 * ID 8 saniye sonra otomatik temizlenir (fetch'lerin tamamlanması için yeterli süre).
 */
const recentlyDeletedDraftIds = new Set();
const markDraftDeleted = (id) => {
  if (!id) return;
  const key = String(id);
  recentlyDeletedDraftIds.add(key);
  setTimeout(() => recentlyDeletedDraftIds.delete(key), 8000);
};

const isExpenseFetchCanceled = (error) =>
  error?.code === "ERR_CANCELED" ||
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  (typeof axios.isCancel === "function" && axios.isCancel(error));

export const fetchExpensesRequest = () => ({
  type: FETCH_EXPENSES_REQUEST,
});

export const fetchExpensesSuccess = (expenses, filters) => ({
  type: FETCH_EXPENSES_SUCCESS,
  payload: expenses,
  filters,
});

export const fetchExpensesFailure = (error) => ({
  type: FETCH_EXPENSES_FAILURE,
  payload: error,
});

export const deleteExpenseSuccess = (id) => ({
  type: DELETE_EXPENSE_SUCCESS,
  payload: id,
});

export const deleteExpenseFailure = (error) => ({
  type: DELETE_EXPENSE_FAILURE,
  payload: error,
});

export const removeSyntheticDraftRowsFromList = ({
  incompleteDraftId,
  expenseDraftId,
} = {}) => ({
  type: REMOVE_SYNTHETIC_DRAFT_ROWS,
  payload: { incompleteDraftId, expenseDraftId },
});

export const addExpenseRequest = () => ({
  type: ADD_EXPENSE_REQUEST,
});

export const addExpenseSuccess = (expense) => ({
  type: ADD_EXPENSE_SUCCESS,
  payload: expense,
});

export const addExpenseFailure = (error) => ({
  type: ADD_EXPENSE_FAILURE,
  payload: error,
});

export const updateExpenseRequest = () => ({
  type: UPDATE_EXPENSE_REQUEST,
});

export const updateExpenseSuccess = (expense) => ({
  type: UPDATE_EXPENSE_SUCCESS,
  payload: expense,
});

export const updateExpenseFailure = (error) => ({
  type: UPDATE_EXPENSE_FAILURE,
  payload: error,
});

export const approveExpenseSuccess = (expense) => ({
  type: APPROVE_EXPENSE_SUCCESS,
  payload: expense,
});

export const rejectExpenseSuccess = (expense) => ({
  type: REJECT_EXPENSE_SUCCESS,
  payload: expense,
});

export const pinExpenseSuccess = (expense) => ({
  type: PIN_EXPENSE_SUCCESS,
  payload: expense,
});

export const bulkAddExpenseSuccess = (expenses) => ({
  type: BULK_ADD_EXPENSE_SUCCESS,
  payload: expenses,
});

const getAuthHeaders = (getState) => {
  const accessToken = getState()?.Auth?.accessToken;

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const checkIsAdmin = (auth) => {
  const roleName = auth?.role?.roleName ?? auth?.role?.name ?? "";
  return String(roleName).toLowerCase() === "admin";
};

const buildQueryParams = (params) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });

  return search.toString();
};

const getResponsePayload = (response) =>
  response?.data?.data ?? response?.data ?? null;

export const getErrorMessage = (error, fallback = "Bağlantı hatası.") => {
  if (error?.code === "ECONNABORTED") {
    return "Masraf servisi zaman aşımına uğradı. Lütfen tekrar deneyin.";
  }
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.Message) return data.Message;
  if (data?.errorMessage) return data.errorMessage;
  if (data?.title) return data.title;
  if (typeof data === "string" && data.trim()) {
    const trimmed = data.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed?.message) return parsed.message;
        if (parsed?.Message) return parsed.Message;
        if (parsed?.errorMessage) return parsed.errorMessage;
        if (parsed?.title) return parsed.title;
      } catch {
        // ignore
      }
    }
    return trimmed;
  }
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message || e).join("; ");
  }
  if (data?.error) return data.error;
  if (data?.Error) return data.Error;
  if (data && typeof data === "object") {
    try {
      return JSON.stringify(data);
    } catch {
      // no-op
    }
  }
  return error?.message || fallback;
};

const handleUnauthorized = (dispatch, status) => {
  if (status === 401) {
    dispatch(authAction.logout());
    window.location.href = "/signin";
    return true;
  }

  return false;
};

const getLastFilters = (getState) => getState()?.expenses?.lastFilters ?? {};

const resolveExpenseId = (expense) =>
  expense?.id ?? expense?.Id ?? expense?.expenseId ?? expense?.ExpenseId ?? null;

const REQUEST_ID_MAP_STORAGE_KEY = "expenseRequestIdMap";
const EXPENSE_META_MAP_STORAGE_KEY = "expenseMetaMap";
const REQUEST_META_MAP_STORAGE_KEY = "expenseRequestMetaMap";

let memoryExpenseRequestIdMap = {};
let memoryExpenseMetaMap = {};
let memoryRequestMetaMap = {};

const getStoredExpenseRequestIdMap = () => memoryExpenseRequestIdMap;

const storeExpenseRequestIdMap = (nextMap) => {
  memoryExpenseRequestIdMap = nextMap || {};
};

const attachRequestIdsFromStorage = (expenses = []) => {
  const map = getStoredExpenseRequestIdMap();
  return (Array.isArray(expenses) ? expenses : []).map((expense) => {
    const normalizedStatus = expense?.status ?? expense?.Status ?? "Beklemede";
    const directRequestId =
      expense?.requestId ??
      expense?.RequestId ??
      expense?.RequestID ??
      expense?.requestID ??
      null;

    if (directRequestId) {
      return {
        ...expense,
        requestId: String(directRequestId),
        status: normalizedStatus,
      };
    }
    const key = String(resolveExpenseId(expense) ?? "");
    if (!key) {
      return {
        ...expense,
        status: normalizedStatus,
      };
    }
    const requestId = map[key];
    const withRequest = requestId ? { ...expense, requestId } : expense;
    return {
      ...withRequest,
      status: withRequest?.status ?? withRequest?.Status ?? normalizedStatus,
    };
  });
};

const getStoredExpenseMetaMap = () => memoryExpenseMetaMap;

const storeExpenseMetaMap = (nextMap) => {
  memoryExpenseMetaMap = nextMap || {};
};

const getStoredRequestMetaMap = () => memoryRequestMetaMap;

const storeRequestMetaMap = (nextMap) => {
  memoryRequestMetaMap = nextMap || {};
};

const attachExpenseMetaFromStorage = (expenses = []) => {
  const map = getStoredExpenseMetaMap();
  return (Array.isArray(expenses) ? expenses : []).map((expense) => {
    const id = resolveExpenseId(expense);
    if (!id) return expense;
    const meta = map[String(id)];
    if (!meta || typeof meta !== "object") return expense;
    return {
      ...expense,
      invoiceNumber: expense?.invoiceNumber ?? meta.invoiceNumber,
      projectName: expense?.projectName ?? meta.projectName,
    };
  });
};

const generateClientRequestId = () => {
  try {
    if (typeof crypto !== "undefined" && crypto?.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `req_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const normalizeCreatedExpense = (expense, auth, fallbackOwnerId) => ({
  ...expense,
  id: resolveExpenseId(expense) ?? expense?.id,
  status: expense?.status ?? expense?.Status ?? "Beklemede",
  userId:
    expense?.userId ?? fallbackOwnerId ?? auth?.id ?? auth?.Id ?? undefined,
  createdUserId:
    expense?.createdUserId ?? auth?.id ?? auth?.Id ?? expense?.createdById,
  createdUserName:
    expense?.createdUserName ??
    auth?.name ??
    auth?.fullName ??
    auth?.Name ??
    auth?.FullName,
  creatorName:
    expense?.creatorName ??
    expense?.createdUserName ??
    auth?.name ??
    auth?.fullName ??
    auth?.Name ??
    auth?.FullName,
  [CREATOR_VISIBLE_FLAG]:
    String(
      expense?.userId ?? fallbackOwnerId ?? auth?.id ?? auth?.Id ?? ""
    ) !== String(auth?.id ?? auth?.Id ?? ""),
});

const postExpense = async (expense, getState) => {
  const response = await axios.post(`${host}/api/expense/add`, expense, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(getState),
    },
  });

  return getResponsePayload(response);
};

const postBulkExpenses = async (expenses, getState) => {
  const payload = { expenses: Array.isArray(expenses) ? expenses : [] };
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(getState),
  };

  try {
    const response = await axios.post(`${host}/api/expense/bulkAdd`, payload, {
      headers,
    });
    return getResponsePayload(response);
  } catch (error) {
    // Bazı ortamlarda endpoint /bulk olabilir
    if (error?.response?.status === 404) {
      const response = await axios.post(`${host}/api/expense/bulk`, payload, {
        headers,
      });
      return getResponsePayload(response);
    }
    throw error;
  }
};

export const fetchExpenses = (filters = {}) => {
  return async (dispatch, getState) => {
    const auth = getState()?.Auth;
    const userId = auth?.id ?? auth?.Id;
    const isAdmin = checkIsAdmin(auth);
    const onlyCurrentUser = filters.onlyCurrentUser === true;
    const useAdminSource = filters.useAdminSource === true;
    // Worker modunda (kendi masraflarım) her zaman my-expenses kullan
    const canUseAdminView = isAdmin && !onlyCurrentUser;

    if (!userId) {
      dispatch(
        fetchExpensesFailure("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
      );
      return;
    }

    expenseFetchAbortController?.abort();
    const abortController = new AbortController();
    expenseFetchAbortController = abortController;
    const { signal } = abortController;

    const generation = ++fetchExpensesGeneration;
    dispatch(fetchExpensesRequest());

    try {
      const shouldUseAdminDefaultScope =
        canUseAdminView && filters.userId === undefined;
      const filterUserId =
        shouldUseAdminDefaultScope
          ? undefined
          : canUseAdminView &&
            (filters.userId === "all" || filters.userId === "")
          ? undefined
          : filters.userId ?? userId;
      const params = {
        userId: filterUserId,
        period: filters.period,
        status: filters.status,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        sortByPinnedFirst: filters.sortByPinnedFirst !== false,
      };
      const headers = getAuthHeaders(getState);
      let response;

      if (!canUseAdminView) {
        response = await axios.get(
          `${host}/api/expense/my-expenses?PinnedFirst=true`,
          { headers, timeout: 15000, signal }
        );
      } else {
        // Backend GetallforAdmin: Skip, limit, PinnedFirst, Search bekliyor
        const adminParams = {
          Skip: filters.skip ?? 0,
          limit: filters.limit ?? 1000,
          PinnedFirst: params.sortByPinnedFirst,
          Search: filters.search ?? "",
          ...(filterUserId != null && { userId: filterUserId }),
          ...(params.period && { period: params.period }),
          ...(params.status && { status: params.status }),
          ...(params.minAmount != null && { minAmount: params.minAmount }),
          ...(params.maxAmount != null && { maxAmount: params.maxAmount }),
        };
        const query = buildQueryParams(adminParams);
        response = await axios.get(
          `${host}/api/expense/getAllForAdmin${query ? `?${query}` : ""}`,
          { headers, timeout: 15000, signal }
        );
      }

      const list = getResponsePayload(response);
      const normalizedList = attachExpenseMetaFromStorage(
        attachRequestIdsFromStorage(Array.isArray(list) ? list : [])
      );
     const visibleList = normalizedList;

      // Tamamlanmamış (DB) kayıtları sadece çalışan görünümünde listelensin; admin ekranında görünmesin.
      let incompleteRows = [];
      if (!canUseAdminView) {
        try {
          const incompleteRes = await axios.get(
            `${host}/api/expense/incomplete/my`,
            { headers, timeout: 15000, signal }
          );
          const incompleteList = getResponsePayload(incompleteRes);
          const drafts = Array.isArray(incompleteList)
            ? incompleteList
            : Array.isArray(incompleteList?.items)
            ? incompleteList.items
            : Array.isArray(incompleteList?.Items)
            ? incompleteList.Items
            : incompleteList
            ? [incompleteList]
            : [];
          incompleteRows = drafts
            // Yakın zamanda silinen tamamlanmamış taslakları fetch yanıtından filtrele
            .filter((draft) => {
              const draftId = String(draft?.id ?? draft?.draftId ?? "");
              return !draftId || !recentlyDeletedDraftIds.has(draftId);
            })
            .flatMap((draft) => {
            const draftId = draft?.id ?? draft?.draftId;
            const rawPayload =
              draft?.payload ??
              draft?.payload_json ??
              draft?.payloadJson ??
              draft?.payloadJSON ??
              draft?.Payload ??
              {};
            const payload =
              typeof rawPayload === "string"
                ? (() => {
                    try {
                      return JSON.parse(rawPayload);
                    } catch {
                      return {};
                    }
                  })()
                : rawPayload || {};
            const rows = Array.isArray(payload?.expenses)
              ? payload.expenses
              : Array.isArray(payload?.Expenses)
              ? payload.Expenses
              : [];
            const requestId = String(draftId ? `incomplete_${draftId}` : `incomplete_${Date.now()}`);
            const createdAt = draft?.updatedAt || draft?.updated_at || draft?.createdAt || draft?.created_at;
            return rows.map((row, index) => ({
              ...row,
              id: String(row?.id || `${requestId}_${index}`),
              requestId,
              status: "Tamamlanmamış",
              createdAt: row?.createdAt || createdAt || new Date().toISOString(),
              // Masraf sahibi (gösterim / gönderim); masraf sahibi değişse bile kayıt kaybolmasın
              userId: payload?.userId ?? row?.userId ?? filterUserId ?? userId,
              // Taslağı oluşturan / düzenleyen = bu isteği atan kullanıcı (incomplete/my zaten ona ait)
              createdUserId: userId,
              createdById: userId,
              __incompleteDraftId: draftId || undefined,
            }));
          });
        } catch (error) {
          if (isExpenseFetchCanceled(error)) throw error;
          // Endpoint yoksa (404) veya hata varsa sessiz geç.
          if (error?.response?.status !== 404) {
            // ignore
          }
        }
      }

      // Taslaklar (DB - uuid) sadece çalışan görünümünde listelensin; admin ekranında görünmesin.
      let draftRowsFromDb = [];
      if (!canUseAdminView) {
        try {
          const draftRes = await axios.get(`${host}/api/expense/draft/my`, {
            headers,
            timeout: 15000,
            signal,
          });
          const draftPayload = getResponsePayload(draftRes);
          const drafts = Array.isArray(draftPayload)
            ? draftPayload
            : Array.isArray(draftPayload?.items)
            ? draftPayload.items
            : Array.isArray(draftPayload?.Items)
            ? draftPayload.Items
            : draftPayload
            ? [draftPayload]
            : [];
          draftRowsFromDb = drafts
            // Yakın zamanda silinen DB taslakları fetch yanıtından filtrele
            .filter((draft) => {
              const draftId = draft?.id ?? draft?.draftId;
              if (!draftId) return true;
              const normalized = normalizeExpenseDraftRouteKey(String(draftId));
              return !recentlyDeletedDraftIds.has(normalized) && !recentlyDeletedDraftIds.has(String(draftId));
            })
            .flatMap((draft) => {
            const draftId = draft?.id ?? draft?.draftId;
            const rawPayload =
              draft?.payload ??
              draft?.payload_json ??
              draft?.payloadJson ??
              draft?.payloadJSON ??
              draft?.Payload ??
              {};
            const payload =
              typeof rawPayload === "string"
                ? (() => {
                    try {
                      return JSON.parse(rawPayload);
                    } catch {
                      return {};
                    }
                  })()
                : rawPayload || {};
            const rows = Array.isArray(payload?.expenses)
              ? payload.expenses
              : Array.isArray(payload?.Expenses)
              ? payload.Expenses
              : [];
            const requestId = String(
              draftId ? `draft_${draftId}` : `draft_${Date.now()}`
            );
            const createdAt =
              draft?.updatedAt ||
              draft?.updated_at ||
              draft?.createdAt ||
              draft?.created_at;
            return rows.map((row, index) => ({
              ...row,
              id: String(row?.id || `${requestId}_${index}`),
              requestId,
              status: "Taslak",
              createdAt: row?.createdAt || createdAt || new Date().toISOString(),
              userId: payload?.userId ?? row?.userId ?? filterUserId ?? userId,
              createdUserId: userId,
              createdById: userId,
              __expenseDraftId:
                normalizeExpenseDraftRouteKey(draftId) || draftId || undefined,
            }));
          });
        } catch (error) {
          if (isExpenseFetchCanceled(error)) throw error;
          if (error?.response?.status !== 404) {
            // ignore
          }
        }
      }

      // Taslaklar sadece çalışan görünümünde listelensin; admin ekranında görünmesin.
      // Taslak / tamamlanmamış: draft/my ve incomplete/my zaten giriş yapan kullanıcıya ait.
      // Masraf sahibi (userId) başkası olsa bile listede kalmalı; userId ile filtreleme yapma.
    const withDrafts =
        !canUseAdminView
          ? [
              ...visibleList,
              ...incompleteRows,
              ...draftRowsFromDb, 
              // BURADA BAŞKA HİÇBİR ŞEY YAZMAMALI!
            ]
          : visibleList;

      if (generation !== fetchExpensesGeneration) {
        return;
      }

      dispatch(
        fetchExpensesSuccess(withDrafts, {
          ...params,
          userId: filterUserId,
          onlyCurrentUser,
          useAdminSource,
        })
      );

          // --- HAYALET AVCISI (GHOSTBUSTER) FİLTRESİ ---
      // Redux'a gönderilmeden hemen önce, silinmiş tüm taslakları son bir kez daha eziyoruz.
      const finalCleanList = withDrafts.filter(expense => {
          const eId = String(expense?.id ?? expense?.Id ?? "");
          const rId = String(expense?.requestId ?? "");
          const dId = String(expense?.__expenseDraftId ?? expense?.__incompleteDraftId ?? "");
          
          const isGhost = recentlyDeletedDraftIds.has(eId) || 
                          recentlyDeletedDraftIds.has(rId) || 
                          recentlyDeletedDraftIds.has(dId) ||
                          recentlyDeletedDraftIds.has(eId.replace('draft_', '')) ||
                          recentlyDeletedDraftIds.has(eId.replace('incomplete_', ''));
                          
          return !isGhost; // Eğer kara listedeyse listeye ASLA alma
      });
      // ---------------------------------------------

      if (generation !== fetchExpensesGeneration) {
        return;
      }

      // DİKKAT: Burada withDrafts yerine finalCleanList gönderiyoruz!
      dispatch(
        fetchExpensesSuccess(finalCleanList, {
          ...params,
          userId: filterUserId,
          onlyCurrentUser,
          useAdminSource,
        })
      );

      if (generation !== fetchExpensesGeneration) {
        return;
      }

      dispatch(
        fetchExpensesSuccess(withDrafts, {
          ...params,
          userId: filterUserId,
          onlyCurrentUser,
          useAdminSource,
        })
      );
    } catch (error) {
      if (isExpenseFetchCanceled(error)) {
        return;
      }

      if (generation !== fetchExpensesGeneration) {
        return;
      }

      const status = error?.response?.status;

      if (handleUnauthorized(dispatch, status)) {
        return;
      }

      if (status === 500) {
        dispatch(
          fetchExpensesFailure(
            getErrorMessage(error, "Sunucu hatası. Lütfen daha sonra tekrar deneyin.")
          )
        );
        return;
      }

      dispatch(fetchExpensesFailure(getErrorMessage(error)));
    }
  };
};

export const deleteExpense = (id) => {
  return async (dispatch, getState) => {
    const authUid = getState()?.Auth?.id ?? getState()?.Auth?.Id;

    try {
      if (isExpenseDbSnapshotSyntheticListId(id)) {
        const guid = parseSnapshotGuidFromSyntheticListId(id);
        if (!guid) {
          dispatch(deleteExpenseFailure("Geçersiz taslak satırı."));
          throw new Error("Geçersiz taslak satırı.");
        }

        // --- ZIRH 1: Bütün ID varyasyonlarını kara listeye al (Fetch geri getiremesin) ---
        markDraftDeleted(id);
        markDraftDeleted(guid);
        markDraftDeleted(`draft_${guid}`);
        markDraftDeleted(`incomplete_${guid}`);

        // --- ZIRH 2: Tarayıcı Önbelleğini (Local Storage) Acımasızca Temizle ---
        if (authUid) {
          removeCreatorVisibleEntriesForExpenseDraft(authUid, guid);
          removeCreatorVisibleEntriesForExpenseDraft(authUid, `draft_${guid}`); // Cache kaçağını kapatır
          removeCreatorVisibleExpense(authUid, id);
          removeCreatorVisibleExpense(authUid, guid);
        }

        await axios.delete(
          `${host}/api/expense/draft/${encodeURIComponent(guid)}`,
          { headers: getAuthHeaders(getState) }
        );

        dispatch(removeSyntheticDraftRowsFromList({ expenseDraftId: guid }));
        dispatch(deleteExpenseSuccess(String(id))); // Reducer'a anında silindiğini söyle
        
        // Fetch'e 300ms nefes payı ver
        setTimeout(() => {
            dispatch(fetchExpenses(getLastFilters(getState)));
        }, 300);

        return;
      }

      // Normal Masraf & Browser Taslağı Akışı
      markDraftDeleted(id);
      
      if (isDraftExpenseId(id)) {
        deleteDraftExpenseById(id);
        dispatch(deleteExpenseSuccess(id));
        return;
      }

      if (authUid) {
        removeCreatorVisibleExpense(authUid, id);
      }

      await axios.delete(`${host}/api/expense/delete/${id}`, {
        headers: getAuthHeaders(getState),
      });
      
      dispatch(deleteExpenseSuccess(id));
      
      setTimeout(() => {
          dispatch(fetchExpenses(getLastFilters(getState)));
      }, 300);

    } catch (error) {
      const status = error?.response?.status;
      if (handleUnauthorized(dispatch, status)) return;
      dispatch(deleteExpenseFailure(getErrorMessage(error)));
      throw error;
    }
  };
};


/** Çalışan listesindeki DB taslağı (expense_drafts): tek akış — satırı ver, sunucudan sil, listeyi yenile */
export const deleteEmployeeDbDraft = (row) => {
  return async (dispatch, getState) => {
    const uuid = extractDbDraftSnapshotUuid(row);
    if (!uuid) {
      throw new Error("Taslak kimliği bulunamadı.");
    }
    const draftKey = normalizeExpenseDraftRouteKey(uuid);
    if (!draftKey) {
      throw new Error("Geçersiz taslak kimliği.");
    }
    try {
      await axios.delete(
        `${host}/api/expense/draft/${encodeURIComponent(draftKey)}`,
        {
          headers: getAuthHeaders(getState),
        }
      );
      // Silinen ID'yi işaretle: sonraki fetch yanıtından filtrelenecek (yarış koşulunu önler)
      markDraftDeleted(draftKey);
      markDraftDeleted(uuid);
      const uid = getState()?.Auth?.id ?? getState()?.Auth?.Id;
      if (uid) {
        removeCreatorVisibleEntriesForExpenseDraft(uid, draftKey);
      }
      dispatch(removeSyntheticDraftRowsFromList({ expenseDraftId: draftKey }));
      await dispatch(fetchExpenses(getLastFilters(getState)));
    } catch (error) {
      const status = error?.response?.status;
      if (handleUnauthorized(dispatch, status)) return;
      throw error;
    }
  };
};

export const addExpenses = (expenses = []) => {
  return async (dispatch, getState) => {
    const auth = getState()?.Auth;
    const userId = auth?.id ?? auth?.Id;

    if (!userId) {
      dispatch(
        addExpenseFailure("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
      );
      return;
    }

    dispatch(addExpenseRequest());

    try {
      const clientRequestId = generateClientRequestId();
      const normalizedExpenses = expenses.map((expense) => {
        let expenseUserId = userId;
        if (expense.userId != null && expense.userId !== "") {
          const parsed = Number(expense.userId);
          if (Number.isFinite(parsed) && parsed > 0) {
            expenseUserId = parsed;
          }
        }
        return {
          ...expense,
          userId: expenseUserId,
          requestId: expense?.requestId || clientRequestId,
        };
      });
      const bulkResponse = await postBulkExpenses(normalizedExpenses, getState);
      const addedExpenses = Array.isArray(bulkResponse)
        ? bulkResponse
        : bulkResponse?.data && Array.isArray(bulkResponse.data)
          ? bulkResponse.data
          : bulkResponse?.expenses && Array.isArray(bulkResponse.expenses)
            ? bulkResponse.expenses
            : [];

      const normalizedAddedExpenses =
        addedExpenses.length && addedExpenses.length === normalizedExpenses.length
          ? addedExpenses.map((expense, index) => {
              const clientRequestIdForExpense =
                normalizedExpenses[index]?.requestId || clientRequestId;
              const sentExpense = normalizedExpenses[index] || {};
              return normalizeCreatedExpense(
                {
                  ...expense,
                  requestId: expense?.requestId || clientRequestIdForExpense,
                  // Backend response bazı alanları dönmeyebilir; gönderilen payload ile birleştir.
                  invoiceNumber: expense?.invoiceNumber ?? sentExpense?.invoiceNumber,
                  projectName: expense?.projectName ?? sentExpense?.projectName,
                  personCount: expense?.personCount ?? sentExpense?.personCount,
                  mealPersonCount:
                    expense?.mealPersonCount ?? sentExpense?.mealPersonCount,
                },
                auth,
                normalizedExpenses[index]?.userId
              );
            })
          : // fallback: backend farklı uzunluk/order döndürürse en azından requestId'yi sabitle
            (addedExpenses.length ? addedExpenses : normalizedExpenses).map((expense) =>
              normalizeCreatedExpense(
                {
                  ...expense,
                  requestId: expense?.requestId || clientRequestId,
                },
                auth,
                expense?.userId
              )
            );

      // Backend requestId dönmese bile UI için eşle
      const storedMap = getStoredExpenseRequestIdMap();
      const nextMap = { ...(storedMap || {}) };
      normalizedAddedExpenses.forEach((expense) => {
        const expenseId = resolveExpenseId(expense);
        if (!expenseId || !expense?.requestId) return;
        nextMap[String(expenseId)] = expense.requestId;
      });
      storeExpenseRequestIdMap(nextMap);

      // Backend liste response'u bu alanları dönmeyebilir; cache'le
      const storedMeta = getStoredExpenseMetaMap();
      const nextMeta = { ...(storedMeta || {}) };
      normalizedAddedExpenses.forEach((expense) => {
        const expenseId = resolveExpenseId(expense);
        if (!expenseId) return;
        nextMeta[String(expenseId)] = {
          invoiceNumber: expense?.invoiceNumber,
          projectName: expense?.projectName,
        };
      });
      storeExpenseMetaMap(nextMeta);

      // Talep (requestId) bazlı meta cache (PDF header için en sağlam kaynak)
      const requestIdForBatch =
        normalizedAddedExpenses?.[0]?.requestId ||
        normalizedExpenses?.[0]?.requestId ||
        clientRequestId;
      if (requestIdForBatch) {
        const storedReqMeta = getStoredRequestMetaMap();
        const nextReqMeta = { ...(storedReqMeta || {}) };
        nextReqMeta[String(requestIdForBatch)] = {
          invoiceNumber:
            normalizedExpenses?.[0]?.invoiceNumber ??
            normalizedAddedExpenses?.[0]?.invoiceNumber,
          projectName:
            normalizedExpenses?.[0]?.projectName ??
            normalizedAddedExpenses?.[0]?.projectName,
        };
        storeRequestMetaMap(nextReqMeta);
      }

      upsertCreatorVisibleExpenses(userId, normalizedAddedExpenses);
      dispatch(bulkAddExpenseSuccess(normalizedAddedExpenses));
      await dispatch(fetchExpenses(getLastFilters(getState)));
      return normalizedAddedExpenses;
    } catch (error) {
      const status = error?.response?.status;

      if (handleUnauthorized(dispatch, status)) {
        return;
      }

      if (status === 500) {
        dispatch(
          addExpenseFailure("Sunucu hatası. Lütfen daha sonra tekrar deneyin.")
        );
        return;
      }

      dispatch(addExpenseFailure(getErrorMessage(error)));
      throw error;
    }
  };
};

export const addExpense = (expense) => {
  return async (dispatch, getState) => {
    const auth = getState()?.Auth;
    const userId = auth?.id ?? auth?.Id;
    const finalUserId =
      expense?.userId != null && expense?.userId !== ""
        ? Number(expense.userId) || userId
        : userId;

    if (!finalUserId) {
      dispatch(
        addExpenseFailure("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
      );
      return;
    }

    dispatch(addExpenseRequest());

    try {
      const createdExpense = await postExpense(
        { ...expense, userId: finalUserId },
        getState
      );
      const normalizedCreatedExpense = normalizeCreatedExpense(
        createdExpense,
        auth,
        finalUserId
      );

      // Bulk akışı gibi requestId map/meta cache'lerini güncel tut.
      // Böylece resubmit sonrası talep gruplaması stabil kalır.
      const storedMap = getStoredExpenseRequestIdMap();
      const nextMap = { ...(storedMap || {}) };
      const createdId = resolveExpenseId(normalizedCreatedExpense);
      const createdRequestId =
        normalizedCreatedExpense?.requestId ??
        normalizedCreatedExpense?.RequestId ??
        normalizedCreatedExpense?.RequestID ??
        expense?.requestId ??
        expense?.RequestId ??
        expense?.RequestID ??
        null;
      if (createdId && createdRequestId) {
        nextMap[String(createdId)] = String(createdRequestId);
        storeExpenseRequestIdMap(nextMap);
      }

      const storedMeta = getStoredExpenseMetaMap();
      const nextMeta = { ...(storedMeta || {}) };
      if (createdId) {
        nextMeta[String(createdId)] = {
          invoiceNumber: normalizedCreatedExpense?.invoiceNumber ?? expense?.invoiceNumber,
          projectName: normalizedCreatedExpense?.projectName ?? expense?.projectName,
        };
        storeExpenseMetaMap(nextMeta);
      }

      if (createdRequestId) {
        const storedReqMeta = getStoredRequestMetaMap();
        const nextReqMeta = { ...(storedReqMeta || {}) };
        nextReqMeta[String(createdRequestId)] = {
          invoiceNumber:
            expense?.invoiceNumber ?? normalizedCreatedExpense?.invoiceNumber,
          projectName:
            expense?.projectName ?? normalizedCreatedExpense?.projectName,
        };
        storeRequestMetaMap(nextReqMeta);
      }

      upsertCreatorVisibleExpenses(userId, [normalizedCreatedExpense]);
      dispatch(addExpenseSuccess(normalizedCreatedExpense));
      await dispatch(fetchExpenses(getLastFilters(getState)));
      return normalizedCreatedExpense;
    } catch (error) {
      const status = error?.response?.status;

      if (handleUnauthorized(dispatch, status)) {
        return;
      }

      if (status === 500) {
        dispatch(
          addExpenseFailure("Sunucu hatası. Lütfen daha sonra tekrar deneyin.")
        );
        return;
      }

      dispatch(addExpenseFailure(getErrorMessage(error)));
      throw error;
    }
  };
};

export const updateExpense = (id, updatedExpense) => {
  return async (dispatch, getState) => {
    const auth = getState()?.Auth;
    const fallbackUserId = auth?.id ?? auth?.Id;
    const finalUserId = updatedExpense?.userId ?? fallbackUserId;

    if (!finalUserId) {
      dispatch(
        updateExpenseFailure("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
      );
      return;
    }

    dispatch(updateExpenseRequest());

    try {
      if (isDraftExpenseId(id) || isDraftExpenseId(updatedExpense?.id)) {
        const next = upsertDraftExpenses([
          normalizeDraftExpenseForList(
            {
              ...(updatedExpense || {}),
              id: updatedExpense?.id ?? id,
              status: "Taslak",
            },
            finalUserId
          ),
        ]);
        const saved = next.find((e) => String(e?.id) === String(updatedExpense?.id ?? id));
        dispatch(updateExpenseSuccess(saved ?? updatedExpense));
        return saved ?? updatedExpense;
      }
      const response = await axios.put(
        `${host}/api/expense/update/${id}`,
        {
          ...updatedExpense,
          userId: finalUserId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(getState),
          },
        }
      );

      const savedExpense = normalizeCreatedExpense(
        getResponsePayload(response),
        auth,
        finalUserId
      );
      upsertCreatorVisibleExpenses(fallbackUserId, [savedExpense]);
      dispatch(updateExpenseSuccess(savedExpense));
      await dispatch(fetchExpenses(getLastFilters(getState)));
      return savedExpense;
    } catch (error) {
      const status = error?.response?.status;

      if (handleUnauthorized(dispatch, status)) {
        return;
      }

      if (status === 500) {
        dispatch(
          updateExpenseFailure(
            "Sunucu hatası. Lütfen daha sonra tekrar deneyin."
          )
        );
        return;
      }

      dispatch(updateExpenseFailure(getErrorMessage(error)));
      throw error;
    }
  };
};

export const approveExpense = ({
  expenseId,
  kkegItemIds = [],
  approvedTotalAmountOverride,
} = {}) => {
  return async (dispatch, getState) => {
    try {
      const requestBody = {
        expenseId,
        kkegItemIds: Array.isArray(kkegItemIds) ? kkegItemIds : [],
      };
      if (
        approvedTotalAmountOverride !== undefined &&
        approvedTotalAmountOverride !== null
      ) {
        requestBody.approvedTotalAmountOverride = approvedTotalAmountOverride;
      }
      const response = await axios.put(
        `${host}/api/expense/approve`,
        requestBody,
        { headers: getAuthHeaders(getState) }
      );
      const expense = getResponsePayload(response);
      dispatch(
        approveExpenseSuccess(expense ?? { id: expenseId, status: "Onaylandı" })
      );
      await dispatch(fetchExpenses(getLastFilters(getState)));
    } catch (error) {
      const status = error?.response?.status;

      if (handleUnauthorized(dispatch, status)) {
        return;
      }

      throw error;
    }
  };
};

export const approveExpenseRequest = ({ requestId, items = [] } = {}) => {
  return async (dispatch, getState) => {
    try {
      if (!requestId) throw new Error("requestId bulunamadı.");
      const response = await axios.put(
        `${host}/api/expense/request/${requestId}/approve`,
        { items: Array.isArray(items) ? items : [] },
        { headers: getAuthHeaders(getState) }
      );
      const payload = getResponsePayload(response);
      // Listeyi yenilemek yeterli; reducer merge zaten buradan besleniyor.
      await dispatch(fetchExpenses(getLastFilters(getState)));
      return payload;
    } catch (error) {
      const status = error?.response?.status;
      if (handleUnauthorized(dispatch, status)) return;
      throw error;
    }
  };
};

export const rejectExpense = (id) => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.put(
        `${host}/api/expense/reject/${id}`,
        {},
        { headers: getAuthHeaders(getState) }
      );
      const expense = getResponsePayload(response);
      dispatch(rejectExpenseSuccess(expense ?? { id, status: "Onaylanmadı" }));
      await dispatch(fetchExpenses(getLastFilters(getState)));
    } catch (error) {
      const status = error?.response?.status;

      if (handleUnauthorized(dispatch, status)) {
        return;
      }

      throw error;
    }
  };
};

export const rejectExpenseRequest = ({
  requestId,
  reason,
  expenseTypeFallback,
} = {}) => {
  return async (dispatch, getState) => {
    try {
      if (!requestId) throw new Error("requestId bulunamadı.");
      const response = await axios.put(
        `${host}/api/expense/request/${requestId}/reject`,
        {
          reason: reason ?? "",
          expenseTypeFallback,
        },
        { headers: getAuthHeaders(getState) }
      );
      const payload = getResponsePayload(response);
      await dispatch(fetchExpenses(getLastFilters(getState)));
      return payload;
    } catch (error) {
      const status = error?.response?.status;
      if (handleUnauthorized(dispatch, status)) return;
      throw error;
    }
  };
};

/** Talep bazlı revize; backend `PUT /api/expense/request/{requestId}/revision` ile uyumlu olmalı */
export const revisionExpenseRequest = ({
  requestId,
  reason,
  expenseTypeFallback,
} = {}) => {
  return async (dispatch, getState) => {
    try {
      if (!requestId) throw new Error("requestId bulunamadı.");
      const response = await axios.put(
        `${host}/api/expense/request/${requestId}/revision`,
        {
          // Backend DTO (C#) bazen PascalCase bekleyebilir; ikisini de gönderelim.
          reason: reason ?? "",
          Reason: reason ?? "",
          expenseTypeFallback,
          ExpenseTypeFallback: expenseTypeFallback,
        },
        { headers: getAuthHeaders(getState) }
      );
      const payload = getResponsePayload(response);

      // UI anında güncellensin: filtre "Beklemede" olsa bile satır "Revize Bekliyor" görünmeli.
      // Aksi halde fetch sonucu bu kayıt filtre dışına düşüp store'da eski "Beklemede" versiyonu kalabiliyor.
      const stateExpenses = getState()?.expenses?.data || [];
      const affected = (Array.isArray(stateExpenses) ? stateExpenses : []).filter(
        (e) => String(resolveExpenseRequestId(e) || "") === String(requestId)
      );
      affected.forEach((e) => {
        const id = e?.id ?? e?.Id ?? e?.expenseId ?? e?.ExpenseId;
        if (!id) return;
        dispatch(
          updateExpenseSuccess({
            ...e,
            id,
            status: "Revize Bekliyor",
            rejectionReason: reason ?? e?.rejectionReason,
            rejectReason: reason ?? e?.rejectReason,
            statusReason: reason ?? e?.statusReason,
          })
        );
      });

      await dispatch(fetchExpenses(getLastFilters(getState)));
      return payload;
    } catch (error) {
      const status = error?.response?.status;
      if (handleUnauthorized(dispatch, status)) return;
      throw error;
    }
  };
};

export const pinExpense = (id) => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.put(
        `${host}/api/expense/pin/${id}`,
        {},
        { headers: getAuthHeaders(getState) }
      );
      const expense = getResponsePayload(response);
      dispatch(pinExpenseSuccess(expense ?? { id, isPinned: true }));
      await dispatch(fetchExpenses(getLastFilters(getState)));
    } catch (error) {
      const status = error?.response?.status;

      if (handleUnauthorized(dispatch, status)) {
        return;
      }

      throw error;
    }
  };
};

export const bulkAddExpense = (expenses) => addExpenses(expenses);

// --- Tamamlanmamış (DB) autosave ---
export const upsertIncompleteExpenseDraft = ({ draftId, payload, silent = true } = {}) => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.post(
        `${host}/api/expense/incomplete/upsert`,
        { draftId: draftId ?? null, payload: payload ?? {} },
        { headers: { "Content-Type": "application/json", ...getAuthHeaders(getState) } }
      );
      return getResponsePayload(response);
    } catch (error) {
      const status = error?.response?.status;
      if (handleUnauthorized(dispatch, status)) return null;
      // Autosave sessiz fail: kullanıcı akışını bozma.
      if (silent) return null;
      throw error;
    }
  };
};

export const deleteIncompleteExpenseDraft = (draftId) => {
  return async (dispatch, getState) => {
    if (!draftId) return;
    try {
      await axios.delete(`${host}/api/expense/incomplete/${draftId}`, {
        headers: getAuthHeaders(getState),
      });
      // Silinen ID'yi işaretle: sonraki fetch yanıtından filtrelenecek (yarış koşulunu önler)
      markDraftDeleted(String(draftId));
      dispatch(removeSyntheticDraftRowsFromList({ incompleteDraftId: draftId }));
      await dispatch(fetchExpenses(getLastFilters(getState)));
    } catch (error) {
      const status = error?.response?.status;
      if (handleUnauthorized(dispatch, status)) return;
      // ignore
    }
  };
};

export const fetchIncompleteExpenseDraft = (draftId) => {
  return async (dispatch, getState) => {
    if (!draftId) return null;
    const headers = getAuthHeaders(getState);
    try {
      const res = await axios.get(`${host}/api/expense/incomplete/${draftId}`, {
        headers,
        timeout: 15000,
      });
      return getResponsePayload(res);
    } catch (error) {
      const status = error?.response?.status;
      if (handleUnauthorized(dispatch, status)) return null;
      // Fallback: listeden bulmayı dene
      if (status === 404) {
        try {
          const listRes = await axios.get(`${host}/api/expense/incomplete/my`, {
            headers,
            timeout: 15000,
          });
          const listPayload = getResponsePayload(listRes);
          const drafts = Array.isArray(listPayload)
            ? listPayload
            : Array.isArray(listPayload?.items)
            ? listPayload.items
            : Array.isArray(listPayload?.Items)
            ? listPayload.Items
            : listPayload
            ? [listPayload]
            : [];
          return (
            drafts.find((d) => String(d?.id ?? d?.draftId) === String(draftId)) || null
          );
        } catch {
          return null;
        }
      }
      return null;
    }
  };
};

// --- Taslak (DB - uuid) ---
export const upsertExpenseDraft = ({ draftId, payload, silent = true } = {}) => {
  return async (dispatch, getState) => {
    try {
      const response = await axios.post(
        `${host}/api/expense/draft/upsert`,
        { draftId: draftId ?? null, payload: payload ?? {} },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(getState),
          },
        }
      );
      return getResponsePayload(response);
    } catch (error) {
      const status = error?.response?.status;
      if (handleUnauthorized(dispatch, status)) return null;
      if (silent) return null;
      throw error;
    }
  };
};

/** Eski çağrılar: yalnızca uuid string — yeni kod satır objesi ile deleteEmployeeDbDraft kullanmalı */
export const deleteExpenseDraft = (draftId) => {
  return async (dispatch) => {
    await dispatch(deleteEmployeeDbDraft({ __expenseDraftId: draftId }));
  };
};
