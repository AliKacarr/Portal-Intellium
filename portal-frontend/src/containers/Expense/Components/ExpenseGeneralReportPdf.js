import React from "react";

import { formatCurrency, parseAmount } from "../utils/dashboardMetrics";
import {
  formatExpenseDate,
  getExpenseCopy,
  translateExpenseStatus,
} from "../utils/expenseI18n";
import { getExpenseCurrencyCode } from "../utils/expenseCurrency";

const cell = {
  borderBottom: "1px solid #e8edf6",
  padding: "5px 6px",
  fontSize: 9,
  lineHeight: 1.25,
};

/**
 * Raporlar → PDF: pano ile aynı özet metrikleri + filtrelenmiş kayıt tablosu (html2pdf).
 */
function ExpenseGeneralReportPdf({
  scopeLabel,
  generatedAt,
  totalAmount,
  totalDelta,
  pendingCount,
  pendingShare,
  approvedTotal,
  approvedDelta,
  approvedCount,
  metricsCurrencyCode,
  showChartCurrencyFilter,
  filterSummaryItems,
  activeFilters,
  expenses,
}) {
  const copy = getExpenseCopy();
  const scopeSubtitle = showChartCurrencyFilter
    ? `${copy.metricsCurrencyScope}: ${metricsCurrencyCode}`
    : copy.totalExpenseSubtitle;

  return (
    <div
      id="expense-general-report-root"
      style={{
        width: "190mm",
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: "12px 14px",
        fontFamily:
          '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
        color: "#0f172a",
        background: "#fff",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1f2b4a 0%, #243963 100%)",
          color: "#f8fbff",
          borderRadius: 8,
          padding: "14px 18px",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700 }}>{copy.generalReportTitle}</div>
        <div style={{ opacity: 0.8, fontSize: 10, letterSpacing: "0.06em", marginTop: 4 }}>
          OFFICIAL EXPENSE SUMMARY
        </div>
      </div>

      <div style={{ fontSize: 10, color: "#475569", marginBottom: 10, lineHeight: 1.45 }}>
        <div>
          <strong style={{ color: "#1e293b" }}>{copy.generalReportScopePrefix}</strong> {scopeLabel}
        </div>
        <div style={{ marginTop: 4 }}>
          <strong style={{ color: "#1e293b" }}>{copy.generalReportGeneratedAt}</strong> {generatedAt}
        </div>
      </div>

      {activeFilters?.length ? (
        <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {activeFilters.map((label) => (
            <span
              key={label}
              style={{
                fontSize: 9,
                padding: "3px 8px",
                borderRadius: 999,
                background: "rgba(47, 137, 217, 0.1)",
                color: "#1f4f7a",
                border: "1px solid rgba(47, 137, 217, 0.2)",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 10,
            background: "#fafbff",
          }}
        >
          <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>{copy.totalExpense}</div>
          <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{scopeSubtitle}</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>
            {formatCurrency(totalAmount, metricsCurrencyCode)}
          </div>
          <div style={{ fontSize: 9, marginTop: 6, color: "#64748b" }}>
            <span style={{ fontWeight: 700, color: totalDelta >= 0 ? "#15803d" : "#b91c1c" }}>
              {totalDelta >= 0 ? "+" : ""}
              {totalDelta.toFixed(1)}%
            </span>{" "}
            {copy.comparedToLastMonth}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 10,
            background: "#fffdf8",
          }}
        >
          <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>{copy.pendingApprovals}</div>
          <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{copy.pendingApprovalsSubtitle}</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{pendingCount}</div>
          <div style={{ fontSize: 9, marginTop: 6, color: "#64748b" }}>
            <span style={{ fontWeight: 700 }}>{pendingShare.toFixed(0)}%</span> {copy.withinOpenRecords}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 10,
            background: "#f6fff9",
          }}
        >
          <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>{copy.approvedExpenses}</div>
          <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>
            {showChartCurrencyFilter
              ? `${copy.approvedExpensesSubtitle} (${metricsCurrencyCode})`
              : copy.approvedExpensesSubtitle}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>
            {formatCurrency(approvedTotal, metricsCurrencyCode)}
          </div>
          <div style={{ fontSize: 9, marginTop: 6, color: "#64748b" }}>
            <span style={{ fontWeight: 700, color: approvedDelta >= 0 ? "#15803d" : "#b91c1c" }}>
              {approvedDelta >= 0 ? "+" : ""}
              {approvedDelta.toFixed(1)}%
            </span>{" "}
            · {approvedCount} {copy.recordCount}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 8,
          marginBottom: 14,
          padding: "10px 12px",
          border: "1px solid #e8edf6",
          borderRadius: 8,
          background: "#f8fafc",
        }}
      >
        {(filterSummaryItems || []).map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: 9, color: "#94a3b8" }}>{item.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#1f2b4a", marginBottom: 8 }}>
        {copy.generalReportTableTitle}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0" }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={{ ...cell, textAlign: "left", fontWeight: 700, color: "#475569" }}>
              {copy.invoiceDate}
            </th>
            <th style={{ ...cell, textAlign: "left", fontWeight: 700, color: "#475569" }}>
              {copy.invoiceNumber}
            </th>
            <th style={{ ...cell, textAlign: "left", fontWeight: 700, color: "#475569" }}>
              {copy.category}
            </th>
            <th style={{ ...cell, textAlign: "left", fontWeight: 700, color: "#475569" }}>
              {copy.owner}
            </th>
            <th style={{ ...cell, textAlign: "right", fontWeight: 700, color: "#475569" }}>
              {copy.amount}
            </th>
            <th style={{ ...cell, textAlign: "left", fontWeight: 700, color: "#475569" }}>
              {copy.status}
            </th>
          </tr>
        </thead>
        <tbody>
          {(expenses || []).length ? (
            expenses.map((row, idx) => (
              <tr key={`${row?.id ?? row?.invoiceNumber ?? "r"}-${idx}`}>
                <td style={{ ...cell, textAlign: "left" }}>{formatExpenseDate(row?.invoiceDate)}</td>
                <td style={{ ...cell, textAlign: "left" }}>{row?.invoiceNumber || "-"}</td>
                <td style={{ ...cell, textAlign: "left" }}>{row?.invoiceTitle || "-"}</td>
                <td style={{ ...cell, textAlign: "left" }}>{row?.ownerName || "-"}</td>
                <td style={{ ...cell, textAlign: "right", whiteSpace: "nowrap" }}>
                  {formatCurrency(parseAmount(row?.totalAmount), getExpenseCurrencyCode(row))}
                </td>
                <td style={{ ...cell, textAlign: "left" }}>
                  {translateExpenseStatus(row?.status || "Beklemede")}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ ...cell, textAlign: "center", opacity: 0.75 }}>
                {copy.noExpenseRecords}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ExpenseGeneralReportPdf;
