import React from "react";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  WalletOutlined,
} from "@ant-design/icons";

import {
  SecondaryStatLabel,
  StatCard,
  StatFooter,
  StatHeader,
  StatIcon,
  StatLabel,
  StatMeta,
  StatValue,
  StatsGrid,
  TrendBadge,
} from "../Expense.styles";
import { formatCurrency } from "../utils/dashboardMetrics";
import { getExpenseCopy } from "../utils/expenseI18n";

const ExpenseStatsGrid = ({
  totalAmount,
  totalDelta,
  pendingCount,
  pendingShare,
  approvedTotal,
  approvedDelta,
  approvedCount,
  metricsCurrencyCode = "TRY",
  showChartCurrencyFilter = false,
}) => {
  const copy = getExpenseCopy();
  const scopeSubtitle = showChartCurrencyFilter
    ? `${copy.metricsCurrencyScope}: ${metricsCurrencyCode}`
    : copy.totalExpenseSubtitle;

  return (
    <StatsGrid>
      <StatCard>
        <StatHeader>
          <div>
            <StatLabel>{copy.totalExpense}</StatLabel>
            <SecondaryStatLabel>{scopeSubtitle}</SecondaryStatLabel>
          </div>
          <StatIcon $tone="blue">
            <WalletOutlined />
          </StatIcon>
        </StatHeader>
        <StatValue>{formatCurrency(totalAmount, metricsCurrencyCode)}</StatValue>
        <StatFooter>
          <TrendBadge $tone={totalDelta >= 0 ? "positive" : "negative"}>
            {totalDelta >= 0 ? "+" : ""}
            {totalDelta.toFixed(1)}%
          </TrendBadge>
          <StatMeta>{copy.comparedToLastMonth}</StatMeta>
        </StatFooter>
      </StatCard>

      <StatCard>
        <StatHeader>
          <div>
            <StatLabel>{copy.pendingApprovals}</StatLabel>
            <SecondaryStatLabel>
              {copy.pendingApprovalsSubtitle}
            </SecondaryStatLabel>
          </div>
          <StatIcon $tone="amber">
            <ClockCircleOutlined />
          </StatIcon>
        </StatHeader>
        <StatValue>{pendingCount}</StatValue>
        <StatFooter>
          <TrendBadge $tone="neutral">{pendingShare.toFixed(0)}%</TrendBadge>
          <StatMeta>{copy.withinOpenRecords}</StatMeta>
        </StatFooter>
      </StatCard>

      <StatCard>
        <StatHeader>
          <div>
            <StatLabel>{copy.approvedExpenses}</StatLabel>
            <SecondaryStatLabel>
              {showChartCurrencyFilter
                ? `${copy.approvedExpensesSubtitle} (${metricsCurrencyCode})`
                : copy.approvedExpensesSubtitle}
            </SecondaryStatLabel>
          </div>
          <StatIcon $tone="green">
            <CheckCircleFilled />
          </StatIcon>
        </StatHeader>
        <StatValue>
          {formatCurrency(approvedTotal, metricsCurrencyCode)}
        </StatValue>
        <StatFooter>
          <TrendBadge $tone={approvedDelta >= 0 ? "positive" : "negative"}>
            {approvedDelta >= 0 ? "+" : ""}
            {approvedDelta.toFixed(1)}%
          </TrendBadge>
          <StatMeta>
            {approvedCount} {copy.recordCount}
          </StatMeta>
        </StatFooter>
      </StatCard>
    </StatsGrid>
  );
};

export default ExpenseStatsGrid;
