import React, { useEffect, useMemo, useState } from "react";
import { RollbackOutlined } from "@ant-design/icons";
import { useHistory, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "./expenseStyle.css";

import { HeaderActionButton } from "./Expense.styles";
import ExpenseCategoryModal from "./Components/ExpenseCategoryModal";
import ExpensePageLayout from "./Components/ExpensePageLayout";
import ExpenseToolbar from "./Components/ExpenseToolbar";
import ExpensesTable from "./Components/ExpensesTable";
import useExpenseDashboard from "./hooks/useExpenseDashboard";
import { getExpenseCopy } from "./utils/expenseI18n";
import { selectDeepLink, clearDeepLink } from "../../redux/deepLink/deepLinkSlice";
import { buildExpenseRequests } from "./utils/expenseRequests";

const ExpenseDashboardContent = ({ onReturnToAdmin }) => {
  const dashboard = useExpenseDashboard({ viewMode: "worker" });
  const copy = getExpenseCopy();
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const deepLink = useSelector(selectDeepLink);
  const [forceOpenRequestId, setForceOpenRequestId] = useState(null);

  const requestRows = useMemo(
    () =>
      buildExpenseRequests(
        dashboard.filteredExpenses || [],
        dashboard.selectedSort || "dateDesc"
      ),
    [dashboard.filteredExpenses, dashboard.selectedSort]
  );

  useEffect(() => {
    if (deepLink?.route !== "my-expenses" || !deepLink?.deepLinkId) return;
    const target = String(deepLink.deepLinkId).trim();
    if (!target) return;
    dispatch(clearDeepLink());

    // Worker sayfasında InfoDrawer ExpensesTable içinde; tablo deep-link ile açsın diye state geçiriyoruz.
    const matchedRequest =
      requestRows.find((r) => String(r?.requestId) === target) ||
      requestRows.find((r) => String(r?.requestId || "").endsWith(target));
    if (matchedRequest?.requestId) {
      setForceOpenRequestId(String(matchedRequest.requestId));
      return;
    }
    const matchedExpense =
      (dashboard.filteredExpenses || []).find((e) => String(e?.requestId || "") === target) ||
      (dashboard.filteredExpenses || []).find((e) => String(e?.id) === target);
    if (matchedExpense?.requestId) {
      setForceOpenRequestId(String(matchedExpense.requestId));
    }
  }, [deepLink, dispatch, requestRows, dashboard.filteredExpenses]);

  // Mail gibi dış linkler: /dashboard/my-expenses?requestId=... → ilgili talebi aç
  useEffect(() => {
    const params = new URLSearchParams(location?.search || "");
    const requestId = String(params.get("requestId") || "").trim();
    if (!requestId) return;
    setForceOpenRequestId(requestId);
  }, [location?.search]);

  return (
    <>
      <ExpensePageLayout
        dashboard={dashboard}
        headerProps={{
          title: copy.workerTitle,
          subtitle: copy.workerSubtitle,
          searchPlaceholder: copy.workerSearchPlaceholder,
          actions: onReturnToAdmin ? (
            <HeaderActionButton icon={<RollbackOutlined />} onClick={onReturnToAdmin}>
              {copy.backToAdmin}
            </HeaderActionButton>
          ) : null,
        }}
        toolbar={
          <ExpenseToolbar
            onOpenCategoryModal={dashboard.openCategoryModal}
            onToggleFilters={dashboard.toggleFilters}
            onReportMenuClick={dashboard.handleReportMenuClick}
            onCreateExpense={() => history.push("/dashboard/my-expenses/new")}
            selectedSort={dashboard.selectedSort}
            onSelectSort={dashboard.setSelectedSort}
          />
        }
      >
        <ExpensesTable
          expenses={dashboard.filteredExpenses}
          chartScopedExpenses={dashboard.chartScopedExpenses}
          loading={dashboard.loading}
          rejectedExpenses={dashboard.rejectedExpenses}
          rejectedRequests={dashboard.rejectedRequests}
          selectedPeriod={dashboard.selectedPeriod}
          formatCompactCurrency={dashboard.formatCompactCurrency}
          showMessage={dashboard.showMessage}
          sortOption={dashboard.selectedSort}
          forceOpenRequestId={forceOpenRequestId}
          onForceOpenHandled={() => setForceOpenRequestId(null)}
        />
      </ExpensePageLayout>

      <ExpenseCategoryModal
        open={dashboard.categoryModalOpen}
        onClose={dashboard.closeCategoryModal}
        categoryBreakdown={dashboard.categoryBreakdown}
        topCategory={dashboard.topCategory}
        metricsCurrencyCode={dashboard.metricsCurrencyCode}
      />
    </>
  );
};

export default ExpenseDashboardContent;
