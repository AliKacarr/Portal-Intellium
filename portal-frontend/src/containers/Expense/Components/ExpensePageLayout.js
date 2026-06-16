import React from "react";
import { Select } from "antd";

import Wrapper from "../Expense.styles";
import ExpenseDashboardHeader from "./ExpenseDashboardHeader";
import ExpenseFiltersPanel from "./ExpenseFiltersPanel";
import ExpenseInsights from "./ExpenseInsights";
import ExpenseStatsGrid from "./ExpenseStatsGrid";
import { getExpenseCopy } from "../utils/expenseI18n";

const ExpensePageLayout = ({ dashboard, headerProps, toolbar, children }) => {
  const copy = getExpenseCopy();

  return (
  <>
    <Wrapper>
      <ExpenseDashboardHeader
        searchTerm={dashboard.searchTerm}
        onSearchChange={(event) => dashboard.setSearchTerm(event.target.value)}
        {...headerProps}
      />

      {dashboard.showChartCurrencyFilter ? (
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            padding: "10px 14px",
            background: "rgba(47, 137, 217, 0.06)",
            borderRadius: 14,
            border: "1px solid rgba(47, 137, 217, 0.15)",
          }}
        >
          <span style={{ fontWeight: 600, color: "#3d4f66" }}>
            {copy.metricsCurrencyScope}
          </span>
          <Select
            value={dashboard.chartCurrencyFilter}
            onChange={dashboard.setChartCurrencyFilter}
            options={dashboard.distinctCurrencyCodes.map((code) => ({
              value: code,
              label: code,
            }))}
            placeholder={copy.chartCurrencyFilterPlaceholder}
            style={{ minWidth: 120 }}
          />
        </div>
      ) : null}

      <ExpenseStatsGrid
        totalAmount={dashboard.totalAmount}
        totalDelta={dashboard.totalDelta}
        pendingCount={dashboard.pendingExpenses.length}
        pendingShare={dashboard.pendingShare}
        approvedTotal={dashboard.approvedTotal}
        approvedDelta={dashboard.approvedDelta}
        approvedCount={dashboard.approvedExpenses.length}
        metricsCurrencyCode={dashboard.metricsCurrencyCode}
        showChartCurrencyFilter={dashboard.showChartCurrencyFilter}
      />

      {toolbar}

      <ExpenseInsights
        summaryItems={dashboard.filterSummaryItems}
        activeFilters={dashboard.activeFilters}
      />

      <ExpenseFiltersPanel
        visible={dashboard.filtersOpen}
        categoryOptions={dashboard.categoryOptions}
        selectedCategory={dashboard.selectedCategory}
        onSelectCategory={dashboard.setSelectedCategory}
        userOptions={dashboard.userOptions}
        selectedUserId={dashboard.selectedUserId}
        onSelectUserId={dashboard.setSelectedUserId}
        expenseStatusOptions={dashboard.expenseStatusOptions}
        selectedStatus={dashboard.selectedStatus}
        onSelectStatus={dashboard.setSelectedStatus}
        amountRange={dashboard.amountRange}
        onAmountRangeChange={dashboard.setAmountRange}
        selectedPeriod={dashboard.selectedPeriod}
        onSelectPeriod={dashboard.setSelectedPeriod}
        dateRange={dashboard.dateRange}
        onDateRangeChange={dashboard.setDateRange}
        onClearFilters={dashboard.clearFilters}
      />

      {children}
    </Wrapper>
  </>
  );
};

export default ExpensePageLayout;
