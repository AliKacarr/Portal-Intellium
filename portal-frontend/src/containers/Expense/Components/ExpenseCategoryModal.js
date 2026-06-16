import React, { useMemo } from "react";
import { Modal, Space, Switch, Table, Typography, message } from "antd";

import useExpenseCategories from "../hooks/useExpenseCategories";
import { formatCurrency } from "../utils/dashboardMetrics";
import { getExpenseCopy } from "../utils/expenseI18n";

const sectionCardStyle = {
  background: "linear-gradient(180deg, rgba(247,250,255,0.98), #ffffff)",
  border: "1px solid rgba(221, 229, 241, 0.9)",
  borderRadius: 22,
  padding: 18,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  width: "100%",
};

const summaryCardStyle = {
  background: "rgba(255,255,255,0.96)",
  border: "1px solid rgba(221, 229, 241, 0.9)",
  borderRadius: 18,
  padding: "14px 16px",
  minHeight: 88,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const summaryLabelStyle = {
  color: "#8ea0bd",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const summaryValueStyle = {
  color: "#16233b",
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.35,
};

const stackedCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const helperTextStyle = {
  color: "#8ea0bd",
  fontSize: 12,
  lineHeight: 1.4,
};

const ExpenseCategoryModal = ({
  open,
  onClose,
  categoryBreakdown,
  topCategory,
  metricsCurrencyCode = "TRY",
}) => {
  const copy = getExpenseCopy();
  const { categories, toggleCategoryVisibility } = useExpenseCategories();
  const [messageApi, contextHolder] = message.useMessage();

  const usageByCategory = useMemo(
    () =>
      Object.fromEntries(
        (categoryBreakdown || []).map((category) => [
          category.key,
          {
            amount: category.amount,
            percentage: category.percentage,
            count: category.count,
          },
        ])
      ),
    [categoryBreakdown]
  );

  const categoryRows = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        usageAmount: usageByCategory[category.value]?.amount || 0,
        usagePercentage: usageByCategory[category.value]?.percentage || 0,
        usageCount: usageByCategory[category.value]?.count || 0,
      })),
    [categories, usageByCategory]
  );

  const visibleCount = categoryRows.filter(
    (category) => category.visible
  ).length;
  const hiddenCount = categoryRows.length - visibleCount;

  const handleToggleVisibility = (categoryValue) => {
    toggleCategoryVisibility(categoryValue);
    messageApi.open({
      type: "success",
      content: copy.categoryVisibilityUpdated,
    });
  };

  const columns = [
    {
      title: copy.categoryColumn,
      dataIndex: "value",
      key: "value",
      render: (value) => (
        <div style={stackedCellStyle}>
          <Typography.Text
            strong
            style={{ color: "#16233b", fontSize: 16, lineHeight: 1.2 }}
          >
            {value}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: copy.usageColumn,
      dataIndex: "usageAmount",
      key: "usageAmount",
      render: (_, record) => (
        <div style={stackedCellStyle}>
          <Typography.Text
            strong
            style={{ color: "#16233b", fontSize: 15, lineHeight: 1.2 }}
          >
            {formatCurrency(record.usageAmount, metricsCurrencyCode)}
          </Typography.Text>
          <span style={helperTextStyle}>{record.usageCount} kayıt</span>
        </div>
      ),
    },
    {
      title: copy.shareColumn,
      dataIndex: "usagePercentage",
      key: "usagePercentage",
      align: "center",
      render: (value) => (
        <Typography.Text strong style={{ color: "#16233b" }}>
          %{value.toFixed(1)}
        </Typography.Text>
      ),
    },
    {
      title: copy.visibilityColumn,
      dataIndex: "visible",
      key: "visible",
      align: "center",
      render: (value, record) => (
        <Space align="center">
          <Switch
            size="small"
            checked={value}
            onChange={() => handleToggleVisibility(record.value)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={copy.categoryManagerTitle}
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnClose
    >
      {contextHolder}

      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <div style={sectionCardStyle}>
          <div style={{ color: "#8ea0bd", fontSize: 14 }}>
            {copy.categoryManagerSubtitle}
          </div>
        </div>

        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>{copy.totalCategories}</div>
            <div style={summaryValueStyle}>{categoryRows.length}</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>{copy.visibleCategories}</div>
            <div style={summaryValueStyle}>{visibleCount}</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>{copy.hiddenCategories}</div>
            <div style={summaryValueStyle}>{hiddenCount}</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>{copy.topCategorySummary}</div>
            <div style={summaryValueStyle}>
              {topCategory ? topCategory.label : copy.noCategoryData}
            </div>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <Table
            rowKey="value"
            pagination={false}
            size="middle"
            columns={columns}
            dataSource={categoryRows}
            locale={{ emptyText: copy.emptyCategoryManager }}
          />
        </div>
      </Space>
    </Modal>
  );
};

export default ExpenseCategoryModal;
