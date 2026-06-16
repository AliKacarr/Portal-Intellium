import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
// useHistory artık gerekli değil (tamamlanmamış UpdateDrawer ile açılıyor)

import { DashboardGrid, SidePanelStack } from "../Expense.styles";
import {
  deleteExpense,
  deleteEmployeeDbDraft,
  deleteIncompleteExpenseDraft,
} from "../redux/actionCreators";
import { sortExpenses } from "../utils/dashboardMetrics";
import {
  buildExpenseRequests,
  getExpenseIdsInRequestBundle,
  resolveRequestBundleForResubmit,
} from "../utils/expenseRequests";
import { formatRequestDisplayCode8 } from "../../../utils/requestDisplayCode";
import ExpenseActivityPanel from "./ExpenseActivityPanel";
import ExpenseCategoryBreakdownPanel from "./ExpenseCategoryBreakdownPanel";
import InfoDrawer from "./InfoDrawer";
import RejectedExpensesPanel from "./RejectedExpensesPanel";
import UpdateDrawer from "./UpdateDrawer";
import { extractDbDraftSnapshotUuid } from "../utils/employeeDraftDelete";
import { getExpenseCopy } from "../utils/expenseI18n";

const INITIAL_VISIBLE_RECORDS = 10;
const LOAD_MORE_RECORDS = 10;

const getExpensePinKey = (row) =>
  String(row?.requestId ?? row?.id ?? row?.invoiceNumber ?? "");

const getStoredPinnedExpenseKeys = () => {
  return [];
};

const ExpensesTable = ({
  expenses,
  chartScopedExpenses,
  loading,
  rejectedExpenses,
  rejectedRequests,
  selectedPeriod,
  formatCompactCurrency,
  showMessage,
  sortOption = "createdDesc",
  forceOpenRequestId,
  onForceOpenHandled,
}) => {
  const dispatch = useDispatch();
  const copy = getExpenseCopy();
  const [openInfoDrawer, setOpenInfoDrawer] = useState(false);
  const [drawerInfo, setDrawerInfo] = useState(null);
  const [openUpdateDrawer, setOpenUpdateDrawer] = useState(false);
  const [updateDrawerInfo, setUpdateDrawerInfo] = useState({});
  const [updateDrawerMode, setUpdateDrawerMode] = useState("edit");
  const [visibleRecordCount, setVisibleRecordCount] = useState(
    INITIAL_VISIBLE_RECORDS
  );
  const [pinnedExpenseKeys, setPinnedExpenseKeys] = useState(
    getStoredPinnedExpenseKeys
  );



  const sortedExpenses = useMemo(
    () => sortExpenses(expenses || [], sortOption),
    [expenses, sortOption]
  );

  useEffect(() => {
    setVisibleRecordCount(INITIAL_VISIBLE_RECORDS);
  }, [expenses]);

  const visibleExpenses = sortedExpenses.slice(0, visibleRecordCount);

  const requestRows = useMemo(() => {
    const rows = buildExpenseRequests(sortedExpenses, sortOption);
    const validKeys = new Set(rows.map(getExpensePinKey));
    const activePinnedKeys = pinnedExpenseKeys.filter((key) => validKeys.has(key));
    if (!activePinnedKeys.length) return rows;
    return [...rows].sort((a, b) => {
      const aKey = getExpensePinKey(a);
      const bKey = getExpensePinKey(b);
      const aIndex = activePinnedKeys.indexOf(aKey);
      const bIndex = activePinnedKeys.indexOf(bKey);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [sortedExpenses, pinnedExpenseKeys, sortOption]);

  const visibleRequests = requestRows.slice(0, visibleRecordCount);

  const rejectedRequestRows = useMemo(() => {
    if (Array.isArray(rejectedRequests) && rejectedRequests.length) {
      return rejectedRequests;
    }
    return buildExpenseRequests(rejectedExpenses || [], sortOption);
  }, [rejectedExpenses, rejectedRequests, sortOption]);

  const handleDeleteExpense = async (expenseOrRequestRow) => {
    // Tamamlanmamış (DB draft) silme: tek draftId üzerinden silinir.
    const incompleteDraftId = expenseOrRequestRow?.__incompleteDraftId;
    if (expenseOrRequestRow?.status === "Tamamlanmamış" && incompleteDraftId) {
      try {
        await dispatch(deleteIncompleteExpenseDraft(incompleteDraftId));
        showMessage("success", copy.deleted || "Incomplete expense deleted.");
      } catch {
        showMessage("error", "Masraf silinemedi.");
      }
      return;
    }

    const isTaslakRow =
      expenseOrRequestRow?.status === "Taslak" ||
      (Array.isArray(expenseOrRequestRow?.expenses) &&
        expenseOrRequestRow.expenses.some((e) => e?.status === "Taslak"));

    // DB taslağı (expense_drafts): tek thunk; uuid yoksa yerel taslağı aşağıdaki id döngüsü siler
    if (isTaslakRow && extractDbDraftSnapshotUuid(expenseOrRequestRow)) {
      try {
        await dispatch(deleteEmployeeDbDraft(expenseOrRequestRow));
        showMessage("success", "Taslak silindi.");
      } catch {
        showMessage("error", "Taslak silinemedi.");
      }
      return;
    }

    const ids = getExpenseIdsInRequestBundle(expenseOrRequestRow);
    if (!ids.length) {
      showMessage("error", copy.expenseIdMissing || "Expense id not found.");
      return;
    }
    const expenses = Array.isArray(expenseOrRequestRow?.expenses)
      ? expenseOrRequestRow.expenses
      : [expenseOrRequestRow];
    const blocked = expenses.some((e) => {
      const s = e?.status;
      // Taslaklar (lokal) her zaman silinebilir.
      if (s === "Taslak") return false;
      if (s === "Tamamlanmamış") return false;
      return s && s !== "Beklemede";
    });
    if (blocked) {
      showMessage(
        "warning",
        "Sadece bekleyen masraflar silinebilir. Onaylanan veya reddedilen masraflar silinemez."
      );
      return;
    }

    try {
      for (const id of ids) {
        await dispatch(deleteExpense(id));
      }
      const primary = expenses[0];
      const n = ids.length;
      const reqShort = formatRequestDisplayCode8(expenseOrRequestRow?.requestId);
      const rawSingleLabel = primary?.invoiceNumber || ids[0];
      const singleOkText =
        typeof rawSingleLabel === "string" &&
        /^draft_/i.test(String(rawSingleLabel))
          ? "Taslak silindi."
          : `${rawSingleLabel} nolu fatura başarılı bir şekilde silindi`;
      showMessage(
        "success",
        n > 1
          ? `Talepteki ${n} masraf silindi${reqShort ? ` (…${reqShort})` : ""}.`
          : singleOkText
      );
    } catch {
      showMessage("error", "Masraf silinemedi.");
    }
  };

  const handleEditExpense = (expense) => {
    if (expense?.status === "Tamamlanmamış") {
      setUpdateDrawerMode("incomplete");
      setUpdateDrawerInfo(expense);
      setOpenUpdateDrawer(true);
      return;
    }
    if (expense?.status === "Taslak" && expense?.__expenseDraftId) {
      setUpdateDrawerMode("draft");
      setUpdateDrawerInfo(expense);
      setOpenUpdateDrawer(true);
      return;
    }
    if (
      expense?.status === "Onaylanmadı" ||
      expense?.status === "Revize Bekliyor"
    ) {
      handleResubmitExpense(expense);
      return;
    }

    setUpdateDrawerMode(expense?.status === "Taslak" ? "draft" : "edit");
    setUpdateDrawerInfo(expense);
    setOpenUpdateDrawer(true);
  };

  const handleResubmitExpense = (expense) => {
    setUpdateDrawerMode("resubmit");
    setUpdateDrawerInfo(
      resolveRequestBundleForResubmit(expense, sortedExpenses)
    );
    setOpenUpdateDrawer(true);
  };

  const handleViewExpense = (expense) => {
    setDrawerInfo(expense);
    setOpenInfoDrawer(true);
  };

  useEffect(() => {
    const target = forceOpenRequestId ? String(forceOpenRequestId).trim() : "";
    if (!target) return;
    const matched =
      requestRows.find((r) => String(r?.requestId) === target) ||
      requestRows.find((r) => String(r?.requestId || "").endsWith(target));
    if (matched) {
      handleViewExpense(matched);
      onForceOpenHandled?.();
    }
  }, [forceOpenRequestId, requestRows, onForceOpenHandled]);

  const handleTogglePinExpense = (expense) => {
    const expenseKey = getExpensePinKey(expense);

    setPinnedExpenseKeys((currentKeys) =>
      currentKeys.includes(expenseKey)
        ? currentKeys.filter((currentKey) => currentKey !== expenseKey)
        : [expenseKey, ...currentKeys]
    );
  };

  return (
    <>
      <DashboardGrid>
        <ExpenseActivityPanel
          loading={loading}
          expenses={visibleExpenses}
          requests={visibleRequests}
          visibleCount={visibleRequests.length}
          totalCount={requestRows.length}
          hasMoreRecords={visibleRecordCount < requestRows.length}
          onShowMore={() =>
            setVisibleRecordCount(
              (currentValue) => currentValue + LOAD_MORE_RECORDS
            )
          }
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
          onViewExpense={handleViewExpense}
          onTogglePinExpense={handleTogglePinExpense}
          isExpensePinned={(row) => pinnedExpenseKeys.includes(getExpensePinKey(row))}
        />

        <SidePanelStack>
          <ExpenseCategoryBreakdownPanel
            expenses={chartScopedExpenses ?? expenses}
            formatCompactCurrency={formatCompactCurrency}
          />

          <RejectedExpensesPanel
            requests={rejectedRequestRows}
            selectedPeriod={selectedPeriod}
            onViewExpense={handleViewExpense}
            onEditExpense={handleResubmitExpense}
          />
        </SidePanelStack>
      </DashboardGrid>

      <InfoDrawer
        open={openInfoDrawer}
        info={drawerInfo}
        close={setOpenInfoDrawer}
      />

      <UpdateDrawer
        showMessage={showMessage}
        open={openUpdateDrawer}
        close={setOpenUpdateDrawer}
        info={updateDrawerInfo}
        mode={updateDrawerMode}
        rejectionReason={
          updateDrawerInfo?.rejectionReason ||
          updateDrawerInfo?.rejectReason ||
          updateDrawerInfo?.expenses?.[0]?.rejectionReason ||
          updateDrawerInfo?.expenses?.[0]?.rejectReason
        }
      />
    </>
  );
};

export default ExpensesTable;
