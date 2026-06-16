import React from "react";
import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownOutlined,
  FilterOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Dropdown } from "antd";

import {
  ActionGroup,
  ActionRow,
  SortActionField,
  ToolbarUniformButton,
} from "../Expense.styles";
import { getExpenseCopy } from "../utils/expenseI18n";

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
        ? copy.sortOption_dateDesc.replace("Tarih ", "").replace("Tarih", "").trim()
        : copy.sortOption_dateAsc.replace("Tarih ", "").replace("Tarih", "").trim();

    return (
      <span className="expense-sort-label">
        <span className="expense-sort-label__top">{copy.generatedOn}</span>
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

const ExpenseToolbar = ({
  onOpenCategoryModal,
  onToggleFilters,
  onCreateExpense,
  selectedSort,
  onSelectSort,
}) => {
  const copy = getExpenseCopy();
  const sortItems = [
    { key: "createdDesc", label: copy.sortOption_createdDesc, icon: <ClockCircleOutlined /> },
    { key: "createdAsc", label: copy.sortOption_createdAsc, icon: <ClockCircleOutlined /> },
    { key: "amountDesc", label: copy.sortOption_amountDesc },
    { key: "amountAsc", label: copy.sortOption_amountAsc },
  ];
  const selectedSortLabelNode = renderSortLabel(copy, selectedSort || "createdDesc");

  return (
    <ActionRow>
      <ActionGroup>
        <SortActionField>
          <Dropdown
            overlayClassName="expense-sort-dropdown"
            menu={{ items: sortItems, onClick: ({ key }) => onSelectSort(key) }}
            placement="bottomLeft"
            arrow
            trigger={["click"]}
          >
            <ToolbarUniformButton className="expense-sort-trigger expense-toolbar-btn--horizontal">
              <span className="expense-sort-trigger__main">
                <SortTriggerIcon selectedSort={selectedSort || "createdDesc"} />
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
          icon={<AppstoreOutlined />}
          onClick={onOpenCategoryModal}
        >
          {copy.manageCategories}
        </ToolbarUniformButton>
        <ToolbarUniformButton
          className="expense-toolbar-btn--horizontal"
          icon={<FilterOutlined />}
          onClick={onToggleFilters}
        >
          {copy.advancedFilters}
        </ToolbarUniformButton>
      </ActionGroup>

      <ActionGroup>
        <ToolbarUniformButton
          className="expense-toolbar-btn--horizontal"
          icon={<PlusOutlined />}
          onClick={onCreateExpense}
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
          {copy.addExpense}
        </ToolbarUniformButton>
      </ActionGroup>
    </ActionRow>
  );
};

export default ExpenseToolbar;
