import React from "react";
import { Button, Empty, Popconfirm, Spin, Tag, Tooltip } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PushpinFilled,
  PushpinOutlined,
} from "@ant-design/icons";

import {
  AdminActions,
  AmountSummary,
  AmountSummaryLabel,
  AmountSummarySub,
  AmountText,
  CategoryPill,
  ExpenseCountChip,
  ExpenseCountChipLabel,
  ExpenseCountChipNumber,
  DescriptionCell,
  DescriptionMeta,
  DescriptionMetaRow,
  DescriptionTitle,
  LoadingState,
  Panel,
  PanelFooterActionRow,
  PanelHeader,
  PanelHeading,
  PanelMetaAction,
  PanelSubtitle,
  PanelTitle,
  PinActionButton,
  ReviewTable,
  ReviewTableHead,
  ReviewTableRow,
  StatusPill,
} from "../Expense.styles";
import {
  STATUS_TONE_MAP,
  getCategoryTone,
} from "../utils/dashboardPresentation";
import {
  formatCurrency,
  getRefundExpenseAmount,
  parseAmount,
  sumExpenseLineItemsNumeric,
} from "../utils/dashboardMetrics";
import { getExpenseCurrencyCode } from "../utils/expenseCurrency";
import { getRequestCurrencyCode } from "../utils/expenseRequests";
import {
  formatCurrencyCodeForDisplay,
  formatExpenseDate,
  getExpenseCategoryLabel,
  getExpenseCopy,
  getUniqueExpenseCategoryEntries,
  translateExpenseStatus,
} from "../utils/expenseI18n";
import { formatRequestDisplayCode8 } from "../../../utils/requestDisplayCode";

const ExpenseActivityPanel = ({
  loading,
  expenses,
  requests,
  visibleCount,
  totalCount,
  hasMoreRecords,
  onShowMore,
  onEditExpense,
  onDeleteExpense,
  onViewExpense,
  onTogglePinExpense,
  isExpensePinned,
}) => {
  const copy = getExpenseCopy();

  return (
    <Panel $shrinkToContent>
      <PanelHeader>
        <PanelHeading>
          <PanelTitle>{copy.recentExpenses}</PanelTitle>
          <PanelSubtitle>
            {Math.min(visibleCount, totalCount)} / {totalCount}{" "}
            {copy.showingRecords}
          </PanelSubtitle>
        </PanelHeading>
      </PanelHeader>

      {loading ? (
        <LoadingState>
          <Spin size="large" />
        </LoadingState>
      ) : (Array.isArray(requests) ? requests : expenses).length ? (
        <>
          <ReviewTable>
            <ReviewTableHead>
              <span>{copy.expense}</span>
              <span>{copy.user}</span>
              <span>{copy.status}</span>
              <span>{copy.amount}</span>
              <span>{copy.operation}</span>
            </ReviewTableHead>

            {(Array.isArray(requests) ? requests : expenses).map((row) => {
              const requestExpenses = Array.isArray(row?.expenses)
                ? row.expenses
                : null;
              const primary = requestExpenses ? requestExpenses[0] : row;
              const isRequestRow = Boolean(requestExpenses);
              const isPinned = isExpensePinned(row);
              const statusValue = isRequestRow ? row.status : row.status;
              const statusTone =
                STATUS_TONE_MAP[statusValue] || STATUS_TONE_MAP.Beklemede;
              const requestCode8 = formatRequestDisplayCode8(row?.requestId);
              const institution = String(primary?.projectName || "").trim();
              const expenseTitle = isRequestRow
                ? institution
                  ? `${copy.requestLabel} ${requestCode8} · ${copy.company}: ${institution}`
                  : `${copy.requestLabel} ${requestCode8}`.trim()
                : row.projectName || row.description || copy.expense;
              const categoryEntries = isRequestRow
                ? getUniqueExpenseCategoryEntries(requestExpenses)
                : getUniqueExpenseCategoryEntries([row]);
              const firstCategoryEntry = categoryEntries[0];
              const pillCategoryLabel =
                firstCategoryEntry?.label ||
                getExpenseCategoryLabel(
                  primary?.invoiceTitle,
                  primary?.extraCategorie
                );
              const categoryTone = getCategoryTone(
                firstCategoryEntry?.invoiceTitle ||
                  primary?.invoiceTitle ||
                  copy.general
              );
              const extraCategoryEntries = categoryEntries.slice(1, 3);
              const hasMoreCategoryLabels = categoryEntries.length > 3;
              const expenseSummary =
                !isRequestRow && row.description && row.projectName
                  ? row.description
                  : !isRequestRow
                    ? row.expenseType || copy.noDescription
                    : "";

              const currencyCode = isRequestRow
                ? getRequestCurrencyCode(requestExpenses)
                : getExpenseCurrencyCode(row);
              const approvedDisplay = isRequestRow
                ? row.sumApproved
                : getRefundExpenseAmount(row);
              const originalDisplay = isRequestRow
                ? row.sumOriginal
                : (() => {
                    const direct = parseAmount(row?.totalAmount);
                    if (direct > 0) return direct;
                    const fromLines = sumExpenseLineItemsNumeric(row);
                    return fromLines > 0 ? fromLines : direct;
                  })();
              const isDraftLikeStatus =
                statusValue === "Taslak" || statusValue === "Tamamlanmamış";

              const userName = primary?.ownerName || copy.unknownUser;
              const rowDate = isRequestRow
                ? row.latestInvoiceDate
                : row.invoiceDate;

              return (
                <ReviewTableRow
                  key={
                    isRequestRow
                      ? row.requestId
                      : row.id || row.invoiceNumber
                  }
                  $pinned={isPinned}
                >
                  <DescriptionCell>
                    <DescriptionTitle>{expenseTitle}</DescriptionTitle>
                    {!isRequestRow && expenseSummary ? (
                      <DescriptionMeta>{expenseSummary}</DescriptionMeta>
                    ) : null}
                    <DescriptionMetaRow>
                      <CategoryPill
                        $background={categoryTone.background}
                        $color={categoryTone.color}
                      >
                        {pillCategoryLabel}
                      </CategoryPill>
                      {extraCategoryEntries.map((entry, idx) => {
                        const tone = getCategoryTone(
                          entry.invoiceTitle || copy.general
                        );
                        return (
                          <CategoryPill
                            key={`${entry.label}-${idx}`}
                            $background={tone.background}
                            $color={tone.color}
                          >
                            {entry.label}
                          </CategoryPill>
                        );
                      })}
                      {hasMoreCategoryLabels ? (
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          ...
                        </span>
                      ) : null}
                      {isRequestRow ? (
                        <ExpenseCountChip style={{ marginLeft: 8 }}>
                          <ExpenseCountChipNumber>
                            {row.expenseCount}
                          </ExpenseCountChipNumber>
                          <ExpenseCountChipLabel>
                            {copy.expenseCountUnit}
                          </ExpenseCountChipLabel>
                        </ExpenseCountChip>
                      ) : null}
                      {(isRequestRow
                        ? row?.hasKkeg
                        : row?.hasKkeg || row?.isKkeg) ? (
                        <Tag color="volcano">{copy.kkegExists}</Tag>
                      ) : null}
                    </DescriptionMetaRow>
                    {isRequestRow && row.status === "Onaylanmadı" ? (
                      <DescriptionMeta>
                        {copy.redReasonLabel}:{" "}
                        {primary.rejectionReason || copy.reasonNotProvided}
                      </DescriptionMeta>
                    ) : null}
                    {isRequestRow && row.status === "Revize Bekliyor" ? (
                      <DescriptionMeta>
                        {copy.rejectionReason}:{" "}
                        {primary.rejectionReason || copy.reasonNotProvided}
                      </DescriptionMeta>
                    ) : null}
                  </DescriptionCell>

                  <DescriptionCell>
                    <DescriptionTitle>{userName}</DescriptionTitle>
                    <DescriptionMeta>
                      {rowDate
                        ? formatExpenseDate(rowDate)
                        : copy.noDate}
                    </DescriptionMeta>
                  </DescriptionCell>

                  <StatusPill
                    $background={statusTone.background}
                    $color={statusTone.color}
                  >
                    {translateExpenseStatus(statusValue || "Beklemede")}
                  </StatusPill>

                  <AmountSummary>
                    <AmountSummaryLabel>
                      {isDraftLikeStatus ? copy.draftTotalAmount : copy.approvedAmountLabel}
                    </AmountSummaryLabel>
                    <AmountText
                      title={
                        currencyCode === "MIX"
                          ? copy.mixedCurrencyTotalHint
                          : isDraftLikeStatus
                            ? formatCurrency(originalDisplay, currencyCode)
                            : formatCurrency(approvedDisplay, currencyCode)
                      }
                    >
                      {isDraftLikeStatus
                        ? formatCurrency(originalDisplay, currencyCode)
                        : formatCurrency(approvedDisplay, currencyCode)}
                    </AmountText>
                    {isDraftLikeStatus ? null : (
                      <AmountSummarySub>
                        {copy.overallPrice}:{" "}
                        {formatCurrency(originalDisplay, currencyCode)}
                      </AmountSummarySub>
                    )}
                    <Tag
                      style={{
                        marginTop: 6,
                        alignSelf: "flex-start",
                        fontSize: 11,
                        lineHeight: "18px",
                      }}
                    >
                      {formatCurrencyCodeForDisplay(currencyCode)}
                    </Tag>
                  </AmountSummary>

                  <AdminActions>
                    <div className="admin-actions__group admin-actions__group--meta">
                      <Tooltip title={isPinned ? copy.unpin : copy.pinToTop}>
                        <PinActionButton
                          type="text"
                          $active={isPinned}
                          icon={isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                          onClick={() => onTogglePinExpense(row)}
                          title={isPinned ? copy.unpin : copy.pinToTop}
                        />
                      </Tooltip>
                      {/* Taslakta yazılı Düzenle butonu var; ikon düzenle göstermiyoruz */}
                      {isRequestRow && row?.status === "Revize Bekliyor" ? (
                        <Tooltip title={copy.resubmitExpense}>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            className="admin-action-btn admin-action-btn--revision"
                            onClick={() => onEditExpense(row)}
                            title={copy.resubmitExpense}
                          />
                        </Tooltip>
                      ) : null}
                      {!isRequestRow && row?.status === "Beklemede" ? (
                        <Tooltip title={copy.edit}>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            className="admin-action-btn admin-action-btn--revision"
                            onClick={() => onEditExpense(row)}
                            title={copy.edit}
                          />
                        </Tooltip>
                      ) : null}
                      {row?.status === "Beklemede" ||
                      row?.status === "Taslak" ||
                      row?.status === "Tamamlanmamış" ? (
                        <Popconfirm
                          title={copy.confirmDelete}
                          okText={copy.yes}
                          cancelText={copy.cancel}
                          okButtonProps={{ danger: true }}
                          onConfirm={() => onDeleteExpense(row)}
                        >
                          <Tooltip title={copy.delete}>
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              className="admin-action-btn admin-action-btn--delete"
                              title={copy.delete}
                            />
                          </Tooltip>
                        </Popconfirm>
                      ) : null}
                      <Tooltip title={copy.detail}>
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          className="admin-action-btn admin-action-btn--view"
                          onClick={() => onViewExpense(row)}
                          title={copy.detail}
                        />
                      </Tooltip>
                    </div>

                    {row?.status === "Taslak" || row?.status === "Tamamlanmamış" ? (
                      <button
                        type="button"
                        onClick={() => onEditExpense(row)}
                        style={{
                          width: "100%",
                          height: 40,
                          borderRadius: 14,
                          fontWeight: 800,
                          border: "1px solid rgba(203, 213, 225, 0.9)",
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))",
                          color: "#0f172a",
                          cursor: "pointer",
                          boxShadow: "0 10px 20px rgba(15, 23, 42, 0.06)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {copy.edit}
                      </button>
                    ) : null}
                  </AdminActions>
                </ReviewTableRow>
              );
            })}
          </ReviewTable>
          {hasMoreRecords ? (
            <PanelFooterActionRow>
              <PanelMetaAction type="button" onClick={onShowMore}>
                {copy.showMore}
              </PanelMetaAction>
            </PanelFooterActionRow>
          ) : null}
        </>
      ) : (
        <LoadingState>
          <Empty description={copy.noExpenseRecords} />
        </LoadingState>
      )}
    </Panel>
  );
};

export default ExpenseActivityPanel;
