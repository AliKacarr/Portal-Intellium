import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  Button,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";

import { StyledDatePicker, StyledInput } from "../Expense.styles";
import useExpenseCategories from "../hooks/useExpenseCategories";
import useExpenseSettings from "../hooks/useExpenseSettings";
import { getExpenseCopy } from "../utils/expenseI18n";
import { updateExpenseSettingsApi } from "../../../Api/ExpenseSettingsApi";

const sectionCardStyle = {
  background: "linear-gradient(180deg, rgba(247,250,255,0.98), #ffffff)",
  border: "1px solid rgba(221, 229, 241, 0.9)",
  borderRadius: 22,
  padding: 18,
};

const sectionTitleStyle = {
  color: "#16233b",
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 6,
};

const sectionSubtitleStyle = {
  color: "#8ea0bd",
  fontSize: 14,
  marginBottom: 16,
};

const rowStyle = {
  width: "100%",
  display: "flex",
  gap: ".75rem",
  flexWrap: "wrap",
};

const addControlRowStyle = {
  ...rowStyle,
  alignItems: "flex-end",
};

const fieldStyle = {
  flex: 1,
  minWidth: "220px",
};

const stackedCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const addButtonStyle = {
  height: 32,
  minWidth: 156,
  padding: "0 12px",
  borderRadius: 16,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  flex: "0 0 auto",
  lineHeight: 1,
  alignSelf: "flex-end",
};

const footerActionButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const getCutoffDateValue = (day) => {
  const today = moment();
  const daysInMonth = today.daysInMonth();
  const safeDay = Math.min(Math.max(parseInt(day, 10) || 1, 1), daysInMonth);
  const cutoffDate = today.clone().date(safeDay);

  return cutoffDate.endOf("day").isBefore(today)
    ? today.clone().add(1, "month").date(safeDay)
    : cutoffDate;
};

const ExpenseManagementModal = ({ open, onClose }) => {
  const copy = getExpenseCopy();
  const {
    categories,
    addCategory,
    removeCategory,
    toggleCategoryVisibility,
    renameCategory,
  } = useExpenseCategories();
  const { settings, saveSettings, refreshSettings } = useExpenseSettings();
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newVatRate, setNewVatRate] = useState("");
  const [mealAcceptedDailyAmount, setMealAcceptedDailyAmount] = useState("");
  const [previousPeriodCutoffDate, setPreviousPeriodCutoffDate] =
    useState(null);
  const [vatRates, setVatRates] = useState([]);
  const [editingCategoryValue, setEditingCategoryValue] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setMealAcceptedDailyAmount(String(settings.mealAcceptedDailyAmount));
    setPreviousPeriodCutoffDate(
      getCutoffDateValue(settings.previousPeriodCutoffDay)
    );
    setVatRates(settings.vatRates);
    setNewCategoryName("");
    setNewVatRate("");
    setEditingCategoryValue(null);
    setEditingCategoryName("");
  }, [open, settings]);

  const categoryColumns = useMemo(
    () => [
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
        title: copy.visibilityColumn,
        dataIndex: "visible",
        key: "visible",
        align: "center",
        render: (value, record) => (
          <Switch
            size="small"
            checked={value}
            onChange={() => {
              toggleCategoryVisibility(record.value);
              messageApi.open({
                type: "success",
                content: copy.categoryVisibilityUpdated,
              });
            }}
          />
        ),
      },
      {
        title: copy.actionsColumn,
        dataIndex: "actions",
        key: "actions",
        align: "center",
        render: (_, record) =>
          record.system ? null : (
            <Space size={4}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingCategoryValue(record.value);
                  setEditingCategoryName(record.value);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#334667",
                }}
              />

              <Popconfirm
                title={copy.deleteCategoryConfirm}
                okText={copy.yes}
                cancelText={copy.cancel}
                okButtonProps={{ danger: true }}
                onConfirm={() => {
                  removeCategory(record.value);
                  messageApi.open({
                    type: "success",
                    content: `${record.value} ${copy.categoryDeleted}`,
                  });
                }}
              >
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </Popconfirm>
            </Space>
          ),
      },
    ],
    [
      copy.actionsColumn,
      copy.cancel,
      copy.categoryColumn,
      copy.categoryDeleted,
      copy.categoryVisibilityUpdated,
      copy.deleteCategoryConfirm,
      copy.visibilityColumn,
      copy.yes,
      messageApi,
      removeCategory,
      toggleCategoryVisibility,
    ]
  );

  const handleAddCategory = () => {
    try {
      const trimmedValue = newCategoryName.trim();

      if (!trimmedValue) {
        messageApi.open({
          type: "warning",
          content: copy.categoryRequiredError,
        });
        return;
      }

      addCategory(trimmedValue);
      setNewCategoryName("");
      messageApi.open({
        type: "success",
        content: `${trimmedValue} ${copy.categoryAdded}`,
      });
    } catch {
      messageApi.open({
        type: "error",
        content: copy.categoryExistsError,
      });
    }
  };

  const handleRenameCategory = () => {
    try {
      const trimmedValue = editingCategoryName.trim();

      if (!editingCategoryValue || !trimmedValue) {
        messageApi.open({
          type: "warning",
          content: copy.categoryRequiredError,
        });
        return;
      }

      renameCategory(editingCategoryValue, trimmedValue);
      messageApi.open({
        type: "success",
        content: copy.categoryUpdated,
      });
      setEditingCategoryValue(null);
      setEditingCategoryName("");
    } catch {
      messageApi.open({
        type: "error",
        content: copy.categoryExistsError,
      });
    }
  };

  const handleAddVatRate = () => {
    const parsedVatRate = parseInt(newVatRate, 10);

    if (!Number.isFinite(parsedVatRate) || parsedVatRate < 1) {
      messageApi.open({
        type: "warning",
        content: copy.vatRateValueRequired,
      });
      return;
    }

    if (vatRates.includes(parsedVatRate)) {
      messageApi.open({
        type: "warning",
        content: copy.vatRateExistsError,
      });
      return;
    }

    setVatRates(
      [...vatRates, parsedVatRate].sort((rateA, rateB) => rateA - rateB)
    );
    setNewVatRate("");
  };

  const handleRemoveVatRate = (vatRate) => {
    if (vatRates.length <= 1) {
      messageApi.open({
        type: "warning",
        content: copy.vatRateMinOneError,
      });
      return;
    }

    setVatRates(vatRates.filter((currentRate) => currentRate !== vatRate));
  };

  const handleSaveSettings = async () => {
    const parsedMealAcceptedDailyAmount = parseInt(mealAcceptedDailyAmount, 10);
    const parsedPreviousPeriodCutoffDay =
      previousPeriodCutoffDate &&
      typeof previousPeriodCutoffDate.date === "function"
        ? previousPeriodCutoffDate.date()
        : null;

    if (
      !Number.isFinite(parsedMealAcceptedDailyAmount) ||
      parsedMealAcceptedDailyAmount < 1
    ) {
      messageApi.open({
        type: "warning",
        content: copy.mealAcceptedDailyAmountRequired,
      });
      return;
    }

    if (
      !Number.isFinite(parsedPreviousPeriodCutoffDay) ||
      parsedPreviousPeriodCutoffDay < 1
    ) {
      messageApi.open({
        type: "warning",
        content: copy.previousPeriodCutoffDayRequired,
      });
      return;
    }

    const payload = {
      mealAcceptedDailyAmount: parsedMealAcceptedDailyAmount,
      previousPeriodCutoffDay: parsedPreviousPeriodCutoffDay,
      vatRates,
    };

    setSaving(true);
    try {
      await updateExpenseSettingsApi(payload);
      saveSettings({ ...settings, ...payload });
      await refreshSettings();
      messageApi.open({
        type: "success",
        content: copy.managementSettingsSaved,
      });
      onClose();
    } catch (err) {
      messageApi.open({
        type: "error",
        content: err?.response?.data?.message || "Ayarlar kaydedilemedi.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={copy.managementTitle}
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      destroyOnClose
    >
      {contextHolder}

      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <div style={sectionCardStyle}>
          <div style={sectionTitleStyle}>{copy.managementRulesTitle}</div>
          <div style={sectionSubtitleStyle}>{copy.managementRulesSubtitle}</div>

          <div style={rowStyle}>
            <div style={fieldStyle}>
              <div className="expense-readonly-label">
                {copy.managementMealAcceptedDailyAmount}
              </div>
              <StyledInput
                className="modal-input invoice"
                type="number"
                min={1}
                value={mealAcceptedDailyAmount}
                onChange={(event) =>
                  setMealAcceptedDailyAmount(event.target.value)
                }
                placeholder={copy.managementMealAmountPlaceholder}
              />
            </div>

            <div style={fieldStyle}>
              <div className="expense-readonly-label">
                {copy.previousPeriodCutoffDay}
              </div>
              <StyledDatePicker
                className="modal-input invoice"
                style={{ width: "100%" }}
                value={previousPeriodCutoffDate}
                onChange={(value) => setPreviousPeriodCutoffDate(value)}
                placeholder={copy.previousPeriodCutoffDayPlaceholder}
              />
            </div>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <div style={sectionTitleStyle}>{copy.managementVatRatesTitle}</div>
          <div style={sectionSubtitleStyle}>
            {copy.managementVatRatesSubtitle}
          </div>

          <div style={addControlRowStyle}>
            <div style={{ ...fieldStyle, flex: "1 1 180px", minWidth: 180 }}>
              <StyledInput
                className="modal-input invoice"
                type="number"
                min={1}
                value={newVatRate}
                onChange={(event) => setNewVatRate(event.target.value)}
                placeholder={copy.managementVatRatePlaceholder}
                onPressEnter={handleAddVatRate}
              />
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddVatRate}
              style={addButtonStyle}
            >
              {copy.addVatRate}
            </Button>
          </div>

          <Space size={[10, 10]} wrap style={{ marginTop: 16 }}>
            {vatRates.map((vatRate) => (
              <Tag
                key={vatRate}
                closable
                onClose={(event) => {
                  event.preventDefault();
                  handleRemoveVatRate(vatRate);
                }}
                style={{
                  marginInlineEnd: 0,
                  padding: "8px 12px",
                  borderRadius: 999,
                }}
              >
                %{vatRate}
              </Tag>
            ))}
          </Space>
        </div>

        <div style={sectionCardStyle}>
          <div style={sectionTitleStyle}>{copy.managementCategoriesTitle}</div>
          <div style={sectionSubtitleStyle}>
            {copy.managementCategoriesSubtitle}
          </div>

          <div style={addControlRowStyle}>
            <div style={{ ...fieldStyle, flex: "1 1 280px" }}>
              <StyledInput
                className="modal-input invoice"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder={copy.addCategoryPlaceholder}
                onPressEnter={handleAddCategory}
              />
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCategory}
              style={addButtonStyle}
            >
              {copy.addCategoryAction}
            </Button>
          </div>

          <div style={{ marginTop: 16 }}>
            <Table
              rowKey="value"
              pagination={false}
              size="middle"
              columns={categoryColumns}
              dataSource={categories}
              locale={{ emptyText: copy.emptyCategoryManager }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button icon={<CloseOutlined />} onClick={onClose} style={footerActionButtonStyle}>
            {copy.cancel}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveSettings}
            loading={saving}
            style={footerActionButtonStyle}
          >
            {copy.saveManagementSettings}
          </Button>
        </div>
      </Space>

      <Modal
        title={copy.editCategory}
        open={Boolean(editingCategoryValue)}
        onCancel={() => {
          setEditingCategoryValue(null);
          setEditingCategoryName("");
        }}
        onOk={handleRenameCategory}
        okText={copy.update}
        cancelText={copy.cancel}
        destroyOnClose
      >
        <StyledInput
          className="modal-input invoice"
          value={editingCategoryName}
          onChange={(event) => setEditingCategoryName(event.target.value)}
          placeholder={copy.addCategoryPlaceholder}
          onPressEnter={handleRenameCategory}
        />
      </Modal>
    </Modal>
  );
};

export default ExpenseManagementModal;
