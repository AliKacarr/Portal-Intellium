import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "antd";
import {
  BarChartOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownOutlined,
  EyeOutlined,
  FilterOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import {
  ActionGroup,
  ActionRow,
  HeaderActionButton,
  SortActionField,
  ToolbarUniformButton,
} from "./Expense.styles";
import AdminExpenseReviewPanel from "./Components/AdminExpenseReviewPanel";
import ExpenseManagementModal from "./Components/ExpenseManagementModal";
import InfoDrawer from "./Components/InfoDrawer";
import ExpensePageLayout from "./Components/ExpensePageLayout";
import useExpenseDashboard from "./hooks/useExpenseDashboard";
import { getReportMenuItems } from "./utils/dashboardExport";
import { getExpenseCopy } from "./utils/expenseI18n";
import { selectDeepLink, clearDeepLink } from "../../redux/deepLink/deepLinkSlice";
import { buildExpenseRequests } from "./utils/expenseRequests";

const SortTriggerIcon = ({ selectedSort }) => {
  if (selectedSort === "dateDesc" || selectedSort === "dateAsc") {
    return <CalendarOutlined className="expense-toolbar-btn__inlineIcon" aria-hidden />;
  }
  return <ClockCircleOutlined className="expense-toolbar-btn__inlineIcon" aria-hidden />;
};

const renderSortLabel = (copy, selectedSort) => {
  if (selectedSort === "dateDesc" || selectedSort === "dateAsc") {
    return (
      <span className="expense-sort-label">
        <span className="expense-sort-label__top">{copy.sortInvoiceDateLabel}</span>
        <span className="expense-sort-label__bottom">
          {selectedSort === "dateDesc"
            ? copy.sortInvoiceDateNewest
            : copy.sortInvoiceDateOldest}
        </span>
      </span>
    );
  }

  if (selectedSort === "createdDesc" || selectedSort === "createdAsc") {
    const suffix =
      selectedSort === "createdDesc"
        ? copy.sortOption_dateDesc.replace("Date ", "").replace("Tarih ", "").trim()
        : copy.sortOption_dateAsc.replace("Date ", "").replace("Tarih ", "").trim();

    return (
      <span className="expense-sort-label">
        <span className="expense-sort-label__top">Oluşturulma Tarihi</span>
        <span className="expense-sort-label__bottom">{suffix}</span>
      </span>
    );
  }

  return (
    <span className="expense-sort-label expense-sort-label--single">
      {copy[`sortOption_${selectedSort || "dateDesc"}`] || copy.sortOption_dateDesc}
    </span>
  );
};

const ExpenseAdminContent = ({ onSwitchToWorker }) => {
  const dashboard = useExpenseDashboard({ viewMode: "admin" });
  const copy = getExpenseCopy();
  const dispatch = useDispatch();
  const location = useLocation();
  const deepLink = useSelector(selectDeepLink);
  const sortItems = [
    { key: "createdDesc", label: copy.sortOption_createdDesc, icon: <ClockCircleOutlined /> },
    { key: "createdAsc", label: copy.sortOption_createdAsc, icon: <ClockCircleOutlined /> },
    { key: "amountDesc", label: copy.sortOption_amountDesc },
    { key: "amountAsc", label: copy.sortOption_amountAsc },
  ];
  const selectedSortLabelNode = renderSortLabel(
    copy,
    dashboard.selectedSort || "createdDesc"
  );
  const [openInfoDrawer, setOpenInfoDrawer] = useState(false);
  const [drawerInfo, setDrawerInfo] = useState(null);
  const [managementModalOpen, setManagementModalOpen] = useState(false);

  const handleViewExpense = (expense) => {
    setDrawerInfo(expense);
    setOpenInfoDrawer(true);
  };

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

    const matchedRequest =
      requestRows.find((r) => String(r?.requestId) === target) ||
      requestRows.find((r) => String(r?.requestId || "").endsWith(target));
    if (matchedRequest) {
      handleViewExpense(matchedRequest);
      return;
    }

    const matchedExpense =
      (dashboard.filteredExpenses || []).find((e) => String(e?.id) === target) ||
      (dashboard.filteredExpenses || []).find(
        (e) => String(e?.invoiceNumber || "") === target
      ) ||
      (dashboard.filteredExpenses || []).find(
        (e) => String(e?.requestId || "") === target
      );
    if (matchedExpense) {
      handleViewExpense(matchedExpense);
    }
  }, [deepLink, dispatch, requestRows, dashboard.filteredExpenses]);

  // Mail gibi dış linkler: /dashboard/my-expenses?requestId=... → ilgili talebi aç
  useEffect(() => {
    const params = new URLSearchParams(location?.search || "");
    const requestId = String(params.get("requestId") || "").trim();
    if (!requestId) return;
    handleViewExpense(
      requestRows.find((r) => String(r?.requestId) === requestId) ||
        requestRows.find((r) => String(r?.requestId || "").endsWith(requestId)) ||
        null
    );
  }, [location?.search, requestRows]);

  return (
    <>
      <ExpensePageLayout
        dashboard={dashboard}
        headerProps={{
          title: copy.adminTitle,
          subtitle: copy.adminSubtitle,
          searchPlaceholder: copy.adminSearchPlaceholder,
          actions: onSwitchToWorker ? (
            <HeaderActionButton icon={<EyeOutlined />} onClick={onSwitchToWorker}>
              {copy.viewAsWorker}
            </HeaderActionButton>
          ) : null,
        }}
        toolbar={
          <ActionRow>
            <ActionGroup>
              <SortActionField>
                <Dropdown
                  overlayClassName="expense-sort-dropdown"
                  menu={{
                    items: sortItems,
                    onClick: ({ key }) => dashboard.setSelectedSort(key),
                  }}
                  placement="bottomLeft"
                  arrow
                  trigger={["click"]}
                >
                  <ToolbarUniformButton className="expense-sort-trigger expense-toolbar-btn--horizontal">
                    <span className="expense-sort-trigger__main">
                      <SortTriggerIcon
                        selectedSort={dashboard.selectedSort || "createdDesc"}
                      />
                      <span className="expense-sort-trigger__label">
                        {selectedSortLabelNode}
                      </span>
                    </span>
                    <span className="expense-sort-trigger__chevron" aria-hidden="true">
                      <DownOutlined />
                    </span>
                  </ToolbarUniformButton>
                </Dropdown>
              </SortActionField>
              <ToolbarUniformButton
                className="expense-toolbar-btn--horizontal"
                icon={<FilterOutlined />}
                onClick={dashboard.toggleFilters}
              >
                {copy.advancedFilters}
              </ToolbarUniformButton>
            </ActionGroup>

            <ActionGroup>
              <Dropdown
                menu={{
                  items: getReportMenuItems(),
                  onClick: dashboard.handleReportMenuClick,
                }}
                placement="bottomRight"
                arrow
                trigger={["click"]}
              >
                <ToolbarUniformButton
                  className="expense-toolbar-btn--horizontal"
                  icon={<BarChartOutlined />}
                >
                  {copy.reports}
                </ToolbarUniformButton>
              </Dropdown>
              <ToolbarUniformButton
                className="expense-toolbar-btn--horizontal"
                icon={<SettingOutlined />}
                onClick={() => setManagementModalOpen(true)}
                style={{
                  width: 190,
                  minWidth: 190,
                  maxWidth: 190,
                  height: 54,
                  borderRadius: 16,
                  padding: "0 14px",
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#2f89d9",
                  borderColor: "#2f89d9",
                  color: "#ffffff",
                  boxShadow: "none",
                }}
              >
                {copy.management}
              </ToolbarUniformButton>
            </ActionGroup>
          </ActionRow>
        }
      >
        <AdminExpenseReviewPanel
          expenses={dashboard.filteredExpenses}
          loading={dashboard.loading}
          onViewExpense={handleViewExpense}
          showMessage={dashboard.showMessage}
          sortOption={dashboard.selectedSort}
        />
      </ExpensePageLayout>

      <InfoDrawer
        open={openInfoDrawer}
        info={drawerInfo}
        close={setOpenInfoDrawer}
      />

      <ExpenseManagementModal
        open={managementModalOpen}
        onClose={() => setManagementModalOpen(false)}
      />
    </>
  );
};

export default ExpenseAdminContent;
