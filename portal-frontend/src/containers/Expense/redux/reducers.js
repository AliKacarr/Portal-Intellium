import {
  CREATOR_VISIBLE_FLAG,
  isDelegatedExpenseVisibleToCreator,
} from "../utils/expenseVisibilityCache";
import {
  normalizeExpenseDraftRouteKey,
  parseSnapshotGuidFromDraftRequestId,
  parseSnapshotGuidFromSyntheticListId,
} from "../utils/expenseDrafts";
import {
  FETCH_EXPENSES_REQUEST,
  FETCH_EXPENSES_SUCCESS,
  FETCH_EXPENSES_FAILURE,
  DELETE_EXPENSE_SUCCESS,
  DELETE_EXPENSE_FAILURE,
  REMOVE_SYNTHETIC_DRAFT_ROWS,
  ADD_EXPENSE_REQUEST,
  ADD_EXPENSE_SUCCESS,
  ADD_EXPENSE_FAILURE,
  UPDATE_EXPENSE_REQUEST,
  UPDATE_EXPENSE_SUCCESS,
  UPDATE_EXPENSE_FAILURE,
  APPROVE_EXPENSE_SUCCESS,
  REJECT_EXPENSE_SUCCESS,
  PIN_EXPENSE_SUCCESS,
  BULK_ADD_EXPENSE_SUCCESS,
} from "./actionTypes";

const getExpenseKey = (expense) =>
  String(expense?.id ?? expense?.Id ?? expense?.invoiceNumber ?? "");

const mergeVisibleCreatorExpenses = (currentExpenses, nextExpenses) => {
  const mergedExpenses = new Map(
    (Array.isArray(nextExpenses) ? nextExpenses : []).map((expense) => [
      getExpenseKey(expense),
      expense,
    ])
  );

  (Array.isArray(currentExpenses) ? currentExpenses : []).forEach((expense) => {
    const expenseKey = getExpenseKey(expense);

    if (!expenseKey || mergedExpenses.has(expenseKey)) return;

    // Eğer bu bir taslak ise ve API'den (mergedExpenses) gelmediyse, demek ki silinmiştir.
    // Eski state'ten alıp listeye GERİ EKLEME!
    const isSyntheticDraft = 
      expense?.__incompleteDraftId || 
      expense?.__expenseDraftId || 
      String(expense?.requestId || "").toLowerCase().startsWith("draft_") ||
      parseSnapshotGuidFromDraftRequestId(expense?.requestId) ||
      parseSnapshotGuidFromSyntheticListId(String(expense?.id ?? expense?.Id ?? ""));

    if (isSyntheticDraft) return; 

    if (
      expense?.[CREATOR_VISIBLE_FLAG] === true ||
      isDelegatedExpenseVisibleToCreator(expense, expense?.createdUserId)
    ) {
      mergedExpenses.set(expenseKey, expense);
    }
  });

  return Array.from(mergedExpenses.values());
};

const initialState = {
  data: [],
  loading: false,
  error: null,
  lastFilters: {},
  deletedIds: [], // NÜKLEER SİLAH: Silinenlerin tutulduğu kara liste
};

const expenseReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_EXPENSES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case FETCH_EXPENSES_SUCCESS: {
      // 1. Önce API'den gelenle LocalStorage verisini birleştir (Senin orijinal mantığın)
      const mergedData = mergeVisibleCreatorExpenses(state.data, action.payload);
      
      // 2. NÜKLEER FİLTRE: Kara listede (deletedIds) olan hiçbir hayaleti ekrana sokma
      const finalData = mergedData.filter((e) => {
        const expenseId = String(e?.id ?? e?.Id ?? "").toLowerCase().trim();
        const requestId = String(e?.requestId ?? "").toLowerCase().trim();
        const draftId = String(e?.__expenseDraftId ?? e?.__incompleteDraftId ?? "").toLowerCase().trim();
        
        const isGhost = (state.deletedIds || []).some(dId => 
           dId.length > 3 && (expenseId.includes(dId) || requestId.includes(dId) || draftId === dId)
        );
        
        return !isGhost;
      });

      return {
        ...state,
        loading: false,
        data: finalData,
        lastFilters: action.filters ?? state.lastFilters,
      };
    }

    case FETCH_EXPENSES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // --- EKSİK OLAN VE SENİ KURTARACAK BLOK ---
    case DELETE_EXPENSE_SUCCESS: {
      const rawId = action.payload?.id ?? action.payload?.Id ?? action.payload;
      const deletedId = String(rawId || "").toLowerCase().trim();

      if (!deletedId) return state;

      const cleanId = deletedId.replace('draft_', '').replace('incomplete_', '');
      const newDeletedIds = [
          ...(state.deletedIds || []), 
          deletedId, 
          cleanId, 
          `draft_${cleanId}`, 
          `incomplete_${cleanId}`
      ];

      return {
        ...state,
        deletedIds: newDeletedIds, // Sildiğin an kara listeye alır
        data: state.data.filter((e) => {
          const expenseId = String(e?.id ?? e?.Id ?? "").toLowerCase().trim();
          const requestId = String(e?.requestId ?? "").toLowerCase().trim();
          const draftId = String(e?.__expenseDraftId ?? e?.__incompleteDraftId ?? "").toLowerCase().trim();
          
          const isGhost = newDeletedIds.some(dId => 
             dId.length > 3 && (expenseId.includes(dId) || requestId.includes(dId) || draftId === dId)
          );
          
          return !isGhost; // Ekranda anında yok eder
        }),
      };
    }
    // ------------------------------------------

    case REMOVE_SYNTHETIC_DRAFT_ROWS: {
      const { incompleteDraftId, expenseDraftId } = action.payload || {};
      return {
        ...state,
        data: state.data.filter((e) => {
          if (
            incompleteDraftId != null &&
            String(e?.__incompleteDraftId) === String(incompleteDraftId)
          ) {
            return false;
          }
          if (expenseDraftId != null) {
            const needle = normalizeExpenseDraftRouteKey(expenseDraftId);
            if (needle) {
              const rowDraft = normalizeExpenseDraftRouteKey(e?.__expenseDraftId);
              if (rowDraft && rowDraft === needle) return false;
              if (String(e?.__expenseDraftId) === String(expenseDraftId))
                return false;
              if (
                parseSnapshotGuidFromSyntheticListId(
                  String(e?.id ?? e?.Id ?? "")
                ) === needle
              )
                return false;
              if (parseSnapshotGuidFromDraftRequestId(e?.requestId) === needle)
                return false;
            }
          }
          return true;
        }),
      };
    }
    case DELETE_EXPENSE_FAILURE:
      return {
        ...state,
        error: action.payload,
      };
    case ADD_EXPENSE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case ADD_EXPENSE_SUCCESS:
      return {
        ...state,
        loading: false,
        data: [...state.data, action.payload],
      };
    case ADD_EXPENSE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case UPDATE_EXPENSE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case UPDATE_EXPENSE_SUCCESS:
      return {
        ...state,
        loading: false,
        data: state.data.map((expense) =>
          expense.id === action.payload.id ? action.payload : expense
        ),
      };
    case UPDATE_EXPENSE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case APPROVE_EXPENSE_SUCCESS:
    case REJECT_EXPENSE_SUCCESS:
      return {
        ...state,
        data: state.data.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload } : e
        ),
      };
    case PIN_EXPENSE_SUCCESS:
      return {
        ...state,
        data: state.data.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload } : e
        ),
      };
    case BULK_ADD_EXPENSE_SUCCESS:
      return {
        ...state,
        loading: false,
        data: [
          ...state.data,
          ...(Array.isArray(action.payload)
            ? action.payload
            : [action.payload]),
        ],
      };
    default:
      return state;
  }
};

export default expenseReducer;