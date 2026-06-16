import React from "react";

import {
  FilterSummary,
  FilterTag,
  InsightMeta,
  InsightRow,
  InsightValue,
} from "../Expense.styles";

const ExpenseInsights = ({ summaryItems, activeFilters }) => (
  <>
    <InsightRow>
      {summaryItems.map((item) => (
        <div key={item.label}>
          <InsightMeta>{item.label}</InsightMeta>
          <InsightValue>{item.value}</InsightValue>
        </div>
      ))}
    </InsightRow>

    {activeFilters.length ? (
      <FilterSummary>
        {activeFilters.map((filterLabel) => (
          <FilterTag key={filterLabel}>{filterLabel}</FilterTag>
        ))}
      </FilterSummary>
    ) : null}
  </>
);

export default ExpenseInsights;
