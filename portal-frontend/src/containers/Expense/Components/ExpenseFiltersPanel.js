import React from "react";
import { Button, DatePicker, InputNumber, Select } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import moment from "moment";

import { FiltersPanel } from "../Expense.styles";
import {
  formatExpenseDate,
  getExpenseCopy,
  getExpenseLocale,
} from "../utils/expenseI18n";

const { RangePicker } = DatePicker;

const getMonthOptions = () => {
  const now = new Date();
  const options = [];

  for (let i = 0; i <= 12; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const label = formatExpenseDate(d, {
      locale: getExpenseLocale(),
      year: "numeric",
      month: "long",
    });

    options.push({ label, value });
  }

  return options;
};

const FilterField = ({ label, children, className }) => (
  <div className={`filters-panel__field ${className || ""}`.trim()}>
    <label
      style={{
        display: "block",
        marginBottom: 5,
        fontSize: 12,
        fontWeight: 600,
        color: "#7f91b0",
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const ExpenseFiltersPanel = ({
  visible,
  categoryOptions,
  selectedCategory,
  onSelectCategory,
  userOptions = [],
  selectedUserId,
  onSelectUserId,
  expenseStatusOptions,
  selectedStatus,
  onSelectStatus,
  amountRange,
  onAmountRangeChange,
  selectedPeriod,
  onSelectPeriod,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  dateRange = [null, null],
  onDateRangeChange,
  onClearFilters,
}) => {
  const copy = getExpenseCopy();

  const resolvedMinAmount =
    minAmount !== undefined ? minAmount : amountRange?.minAmount;
  const resolvedMaxAmount =
    maxAmount !== undefined ? maxAmount : amountRange?.maxAmount;

  if (!visible) {
    return null;
  }

  const handleMinAmountChange = (value) => {
    if (onMinAmountChange) {
      onMinAmountChange(value);
      return;
    }

    if (onAmountRangeChange) {
      onAmountRangeChange({
        minAmount: value,
        maxAmount: amountRange?.maxAmount,
      });
    }
  };

  const handleMaxAmountChange = (value) => {
    if (onMaxAmountChange) {
      onMaxAmountChange(value);
      return;
    }

    if (onAmountRangeChange) {
      onAmountRangeChange({
        minAmount: amountRange?.minAmount,
        maxAmount: value,
      });
    }
  };

  const normalizeAmountValue = (value) =>
    value === null || value === undefined ? undefined : value;

  const onMinAmountInputChange = (value) => {
    handleMinAmountChange(normalizeAmountValue(value));
  };

  const onMaxAmountInputChange = (value) => {
    handleMaxAmountChange(normalizeAmountValue(value));
  };

  return (
    <FiltersPanel>
      {userOptions.length ? (
        <FilterField label={copy.user} className="filters-panel__field--user">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={copy.selectUser}
            options={userOptions}
            value={selectedUserId}
            onChange={onSelectUserId}
          />
        </FilterField>
      ) : null}

      {onSelectPeriod ? (
        <FilterField label={copy.period} className="filters-panel__field--period">
          <Select
            allowClear
            placeholder={copy.selectPeriod}
            options={getMonthOptions()}
            value={selectedPeriod}
            onChange={onSelectPeriod}
          />
        </FilterField>
      ) : null}

      <FilterField label={copy.category} className="filters-panel__field--category">
        <Select
          allowClear
          placeholder={copy.categoryPlaceholder}
          options={categoryOptions}
          value={selectedCategory}
          onChange={onSelectCategory}
        />
      </FilterField>

      <FilterField label={copy.status} className="filters-panel__field--status">
        <Select
          allowClear
          placeholder={copy.selectStatus}
          options={expenseStatusOptions}
          value={selectedStatus}
          onChange={onSelectStatus}
        />
      </FilterField>

      <FilterField label={copy.minAmount} className="filters-panel__field--min">
        <InputNumber
          min={0}
          allowClear
          placeholder={copy.minAmountPlaceholder}
          value={resolvedMinAmount}
          onChange={onMinAmountInputChange}
        />
      </FilterField>

      <FilterField label={copy.maxAmount} className="filters-panel__field--max">
        <InputNumber
          min={0}
          allowClear
          placeholder={copy.maxAmountPlaceholder}
          value={resolvedMaxAmount}
          onChange={onMaxAmountInputChange}
        />
      </FilterField>

      <FilterField label={copy.dateRange} className="filters-panel__field--date-range">
        <RangePicker
          style={{ width: "100%" }}
          value={[
            dateRange?.[0] ? moment(dateRange[0], "YYYY-MM-DD") : null,
            dateRange?.[1] ? moment(dateRange[1], "YYYY-MM-DD") : null,
          ]}
          onChange={(_, dateStrings) => {
            const start = dateStrings?.[0] ? String(dateStrings[0]).trim() : "";
            const end = dateStrings?.[1] ? String(dateStrings[1]).trim() : "";
            onDateRangeChange(start && end ? [start, end] : [null, null]);
          }}
        />
      </FilterField>

      <div className="filters-panel__field filters-panel__field--action filters-panel__action">
        <Button icon={<ClearOutlined />} onClick={onClearFilters}>
          {copy.clear}
        </Button>
      </div>
    </FiltersPanel>
  );
};

export default ExpenseFiltersPanel;
