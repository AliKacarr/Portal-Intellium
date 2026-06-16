import React, { useMemo, useState } from "react";
import { Badge } from "antd";
import {
  CloseOutlined,
  DownOutlined,
  EyeOutlined,
  FormOutlined,
  RightOutlined,
  UpOutlined,
} from "@ant-design/icons";

import {
  AmountText,
  CategoryPill,
  MetaBadge,
  Panel,
  PanelHeader,
  PanelHeading,
  PanelSubtitle,
  PanelTitle,
  PrimaryCompactButton,
  RejectedActionRow,
  RejectedActions,
  RejectedCard,
  RejectedCardBody,
  RejectedCardHeading,
  RejectedCardSubtitle,
  RejectedCardSummary,
  RejectedCardTags,
  RejectedCardTitle,
  RejectedHint,
  RejectedList,
  RejectedMetaCard,
  RejectedMetaGrid,
  RejectedMetaLabel,
  RejectedMetaValue,
  RejectedReasonCard,
  RejectedReasonLabel,
  RejectedReasonText,
  SecondaryCompactButton,
  StatIcon,
} from "../Expense.styles";
import {
  formatCurrency,
  getExpenseCreatedAtTimestamp,
} from "../utils/dashboardMetrics";
import { getExpenseCurrencyCode } from "../utils/expenseCurrency";
import {
  formatExpenseDate,
  getExpenseCategoryLabel,
  getExpenseCopy,
  resolveExpenseStatusReason,
  translateExpenseStatus,
} from "../utils/expenseI18n";
import { getCategoryTone } from "../utils/dashboardPresentation";
import { formatRequestDisplayCode8 } from "../../../utils/requestDisplayCode";

const RejectedExpensesPanel = ({
  requests = [],
  selectedPeriod,
  onViewExpense,
  onEditExpense,
}) => {
  const copy = getExpenseCopy();
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const activePeriod = useMemo(() => {
    if (selectedPeriod) return String(selectedPeriod);
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }, [selectedPeriod]);

  const currentPeriodRejectedRequests = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    const createdToPeriod = (requestRow) => {
      const primary = Array.isArray(requestRow?.expenses)
        ? requestRow.expenses[0]
        : requestRow;
      const ts = getExpenseCreatedAtTimestamp(primary);
      if (!ts) return null;
      const d = new Date(ts);
      if (!Number.isFinite(d.getTime())) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    return list.filter((row) => {
      const period = createdToPeriod(row);
      return period ? period === activePeriod : false;
    });
  }, [activePeriod, requests]);

  const sortedRejectedRequests = useMemo(
    () =>
      [...currentPeriodRejectedRequests].sort((a, b) => {
        const aPrimary = Array.isArray(a?.expenses) ? a.expenses[0] : a;
        const bPrimary = Array.isArray(b?.expenses) ? b.expenses[0] : b;
        return (
          getExpenseCreatedAtTimestamp(bPrimary) -
          getExpenseCreatedAtTimestamp(aPrimary)
        );
      }),
    [currentPeriodRejectedRequests]
  );

  const handleToggleExpense = (expenseId) => {
    setExpandedExpenseId((currentId) =>
      currentId === expenseId ? null : expenseId
    );
  };

  if (!sortedRejectedRequests.length) {
    return null;
  }

  return (
    <Panel>
      <PanelHeader
        role="button"
        tabIndex={0}
        className="rejected-notification__header"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen((current) => !current);
          }
        }}
      >
        <PanelHeading>
          <PanelTitle>
            {copy.rejectedDetails || "Needs revision"}{" "}
            <Badge
              count={sortedRejectedRequests.length}
              style={{
                backgroundColor: "#ef4444",
                boxShadow: "none",
                marginLeft: 10,
              }}
            />
          </PanelTitle>
          <PanelSubtitle>
            {`Bu dönem için ${sortedRejectedRequests.length} talep işlem bekliyor`}
          </PanelSubtitle>
        </PanelHeading>
        <StatIcon $tone="amber" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isOpen ? (
            <CloseOutlined style={{ fontSize: 18 }} />
          ) : (
            <RightOutlined style={{ fontSize: 18 }} />
          )}
        </StatIcon>
      </PanelHeader>

      <div
        className={`rejected-notification__body ${
          isOpen ? "rejected-notification__body--open" : ""
        }`}
      >
        <RejectedList>
          {sortedRejectedRequests.map((requestRow) => {
            const requestId = requestRow?.requestId || requestRow?.id || "";
            const requestExpenses = Array.isArray(requestRow?.expenses)
              ? requestRow.expenses
              : [];
            const primary = requestExpenses[0] || {};
            const expenseKey = String(requestId || primary?.id || primary?.invoiceNumber);
            const isExpanded = expandedExpenseId === expenseKey;
            const rejectionReason =
              requestExpenses.map(resolveExpenseStatusReason).find(Boolean) ||
              resolveExpenseStatusReason(primary) ||
              copy.reasonNotProvided;
            const categoryTone = getCategoryTone(primary.invoiceTitle || "Other");

            return (
              <RejectedCard
                key={expenseKey}
                role="button"
                tabIndex={0}
                onClick={() => handleToggleExpense(expenseKey)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleToggleExpense(expenseKey);
                  }
                }}
              >
                <RejectedCardSummary>
                  <RejectedCardHeading>
                    <RejectedCardTitle>
                      {primary.projectName ||
                        (requestId ? `Talep ${formatRequestDisplayCode8(requestId)}` : "") ||
                        primary.invoiceNumber ||
                        copy.general}
                    </RejectedCardTitle>
                    <RejectedCardSubtitle>
                      {primary.description || copy.noDescription}
                    </RejectedCardSubtitle>

                    <RejectedCardTags>
                      <MetaBadge>
                        {copy.invoiceNumber}:{" "}
                        {requestExpenses.map((e) => e?.invoiceNumber).filter(Boolean).join(", ") ||
                          primary.invoiceNumber ||
                          "-"}
                      </MetaBadge>
                      <MetaBadge>
                        {copy.owner}: {primary.ownerName || copy.unknownUser}
                      </MetaBadge>
                      <MetaBadge>
                        {copy.createdBy}:{" "}
                        {primary.creatorName || copy.unknownUser}
                      </MetaBadge>
                      {requestExpenses.length ? (
                        <MetaBadge>
                          {copy.expenseCountUnit}: {requestExpenses.length}
                        </MetaBadge>
                      ) : null}
                      <CategoryPill
                        $background={categoryTone.background}
                        $color={categoryTone.color}
                      >
                        {getExpenseCategoryLabel(
                          primary.invoiceTitle,
                          primary.extraCategorie
                        )}
                      </CategoryPill>
                    </RejectedCardTags>
                  </RejectedCardHeading>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <AmountText>
                      {formatCurrency(
                        requestRow?.sumApproved ?? primary.totalAmount,
                        requestRow?.currencyCode || getExpenseCurrencyCode(primary)
                      )}
                    </AmountText>
                    {isExpanded ? <UpOutlined /> : <DownOutlined />}
                  </div>
                </RejectedCardSummary>

                {isExpanded ? (
                  <RejectedCardBody
                    onClick={(event) => event.stopPropagation()}
                  >
                    <RejectedReasonCard>
                      <RejectedReasonLabel>
                        {copy.rejectionReason}
                      </RejectedReasonLabel>
                      <RejectedReasonText>{rejectionReason}</RejectedReasonText>
                    </RejectedReasonCard>

                    <RejectedMetaGrid>
                      <RejectedMetaCard>
                        <RejectedMetaLabel>{copy.date}</RejectedMetaLabel>
                        <RejectedMetaValue>
                          {primary.invoiceDate
                            ? formatExpenseDate(primary.invoiceDate, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : copy.noDate}
                        </RejectedMetaValue>
                      </RejectedMetaCard>

                      <RejectedMetaCard>
                        <RejectedMetaLabel>{copy.status}</RejectedMetaLabel>
                        <RejectedMetaValue>
                          {translateExpenseStatus("Revize Bekliyor")}
                        </RejectedMetaValue>
                      </RejectedMetaCard>
                    </RejectedMetaGrid>

                    <RejectedActionRow>
                      <RejectedHint>{copy.tapToInspectRejected}</RejectedHint>

                      <RejectedActions>
                        <SecondaryCompactButton
                          icon={<EyeOutlined />}
                          onClick={() => onViewExpense?.(requestRow)}
                        >
                          {copy.detail}
                        </SecondaryCompactButton>
                        <PrimaryCompactButton
                          type="primary"
                          icon={<FormOutlined />}
                          onClick={() => onEditExpense?.(requestRow)}
                        >
                          {copy.resubmitExpense}
                        </PrimaryCompactButton>
                      </RejectedActions>
                    </RejectedActionRow>
                  </RejectedCardBody>
                ) : null}
              </RejectedCard>
            );
          })}
        </RejectedList>
      </div>
    </Panel>
  );
};

export default RejectedExpensesPanel;
