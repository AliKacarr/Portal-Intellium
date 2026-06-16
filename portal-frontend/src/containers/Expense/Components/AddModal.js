import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "antd";
import { DeleteOutlined, SaveOutlined, SendOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import ExpenseFormFields from "./ExpenseFormFields";
import ReceiptExtractStatusBar from "./ReceiptExtractStatusBar";
import { addExpenses, getErrorMessage } from "../redux/actionCreators";
import { StyledSelect } from "../Expense.styles";
import useExpenseListReceiptExtract from "../hooks/useExpenseListReceiptExtract";
import useExpenseUsers from "../hooks/useExpenseUsers";
import useExpenseCurrencies from "../hooks/useExpenseCurrencies";
import useExpenseSettings from "../hooks/useExpenseSettings";
import { resolveDefaultExpenseVatRate } from "../constants/expenseSettings";
import {
  buildExpensePayload,
  createEmptyExpenseEntry,
  extractBase64FromDataUrl,
  convertFileToPngDataUrl,
  getComputedExpenseAmounts,
  omitExcludingVatAmount,
  pickComputedExpenseFormFields,
  sanitizeExpenseFormDraft,
} from "../utils/expenseForm";
import { scrollFormToFirstExpenseError } from "../utils/formScrollToFirstError";
import { getExpenseCopy } from "../utils/expenseI18n";
import {
  createDraftExpenseId,
  createDraftRequestId,
  normalizeDraftExpenseForList,
  upsertDraftExpenses,
} from "../utils/expenseDrafts";

export const ExpenseEntryFields = ({
  field,
  index,
  form,
  remove,
  canRemove,
  showUpload = true,
  uploadRequired = true,
  receiptExtractBusy = false,
  receiptExtractPendingRowIndexes = [],
  receiptExtractPhase = "idle",
  receiptExtractElapsedSec = 0,
  cancelReceiptExtract,
}) => {
  const copy = getExpenseCopy();

  return (
    <div className="expense-batch-card">
      <div className="expense-batch-card__header">
        <div>
          <div className="expense-batch-card__title">
            {copy.expenseCardTitle} {index + 1}
          </div>
          <div className="expense-batch-card__subtitle">
            {copy.expenseCardSubtitle}
          </div>
        </div>

        {canRemove ? (
          <Button
            danger
            type="text"
            className="expense-batch-remove-button"
            icon={<DeleteOutlined />}
            onClick={() => remove(field.name)}
            disabled={receiptExtractBusy}
          >
            {copy.remove}
          </Button>
        ) : null}
      </div>

      <ExpenseFormFields
        form={form}
        namePrefix={[field.name]}
        watchPrefix={["expenses", field.name]}
        showUpload={showUpload}
        uploadRequired={uploadRequired}
        deferReceiptExtractToParent
        listReceiptExtractInline={{
          active:
            receiptExtractPendingRowIndexes.includes(index) &&
            receiptExtractPhase !== "idle",
          phase: receiptExtractPhase,
          elapsedSec: receiptExtractElapsedSec,
          onCancel: cancelReceiptExtract,
        }}
      />
    </div>
  );
};

const AddModal = ({ open, close, showMessage }) => {
  const copy = getExpenseCopy();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const isSubmitting = useSelector((state) => state.expenses.loading);
  const expenseItems = Form.useWatch("expenses", form) || [];
  const {
    receiptExtractBusy,
    receiptExtractPhase,
    receiptExtractElapsedSec,
    receiptExtractPendingRowIndexes,
    cancelReceiptExtract,
  } = useExpenseListReceiptExtract(form, { listName: "expenses", enabled: open });
  const { currentUserId, loadingUsers, userOptions } = useExpenseUsers();
  const { allowedCodes } = useExpenseCurrencies();
  const { vatRates } = useExpenseSettings();
  const showUserSelect = userOptions.length > 1;
  const [draftValues, setDraftValues] = useState(null);

  const handleValuesChange = (changedValues, allValues) => {
    const changedExpenses = changedValues.expenses;

    if (!changedExpenses || !Array.isArray(changedExpenses)) {
      setDraftValues((currentDraft) => ({
        ...(currentDraft || {}),
        ...allValues,
      }));
      return;
    }

    const nextExpenses = [...(allValues.expenses || [])];
    let hasUpdates = false;

    changedExpenses.forEach((changedExpense, index) => {
      if (!changedExpense) {
        return;
      }

      const hasItems =
        Array.isArray(nextExpenses[index]?.items) &&
        nextExpenses[index].items.length > 0;

      const totalAmountChanged = Object.prototype.hasOwnProperty.call(
        changedExpense,
        "totalAmount"
      );
      const vatRateChanged = Object.prototype.hasOwnProperty.call(
        changedExpense,
        "vatRate"
      );
      const invoiceTitleChanged = Object.prototype.hasOwnProperty.call(
        changedExpense,
        "invoiceTitle"
      );
      const mealPersonCountChanged = Object.prototype.hasOwnProperty.call(
        changedExpense,
        "mealPersonCount"
      );

      // Kalemler doluyken (items varsa) totalAmount değişimi otomatik türetildiği için
      // setFieldsValue ile tüm expense objesini geri basmıyoruz. Bu, kalem alanlarında
      // beklenmedik değer sıçramalarını önler.
      const hasAmountChange =
        vatRateChanged || invoiceTitleChanged || mealPersonCountChanged
          ? true
          : totalAmountChanged && !hasItems;

      if (!hasAmountChange) {
        return;
      }

      let expenseRow = omitExcludingVatAmount({
        ...nextExpenses[index],
        amountInputMode: "totalAmount",
      });
      if (Object.prototype.hasOwnProperty.call(changedExpense, "invoiceTitle")) {
        expenseRow = {
          ...expenseRow,
          vatRate: resolveDefaultExpenseVatRate(
            expenseRow.invoiceTitle,
            vatRates
          ),
        };
      }

      const amounts = getComputedExpenseAmounts(expenseRow);
      nextExpenses[index] = {
        ...expenseRow,
        ...pickComputedExpenseFormFields(amounts),
      };
      hasUpdates = true;
    });

    if (hasUpdates) {
      const nextFormValues = {
        ...allValues,
        expenses: nextExpenses,
      };
      form.setFieldsValue(nextFormValues);
      setDraftValues(sanitizeExpenseFormDraft(nextFormValues));
    } else {
      setDraftValues((currentDraft) =>
        sanitizeExpenseFormDraft({
          ...(currentDraft || {}),
          ...allValues,
        })
      );
    }
  };

  useEffect(() => {
    if (open) {
      if (draftValues) {
        form.setFieldsValue(sanitizeExpenseFormDraft(draftValues));
      } else if (!expenseItems.length) {
        form.setFieldsValue({ expenses: [createEmptyExpenseEntry()] });
      }
    }
  }, [draftValues, expenseItems.length, form, open]);

  useEffect(() => {
    if (open && currentUserId) {
      const current = form.getFieldValue("userId");
      if (!showUserSelect || !current) {
        form.setFieldValue("userId", currentUserId);
      }
    }
  }, [currentUserId, form, open, showUserSelect]);

  const handleCloseModal = () => {
    setDraftValues(sanitizeExpenseFormDraft(form.getFieldsValue(true)));
    close();
  };

  const resetDraftAndClose = () => {
    setDraftValues(null);
    form.resetFields();
    form.setFieldsValue({
      userId: currentUserId,
      expenses: [createEmptyExpenseEntry()],
    });
    close();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields(undefined, {
        scrollToFirstError: { behavior: "smooth", block: "center" },
      });
      const targetUserId = showUserSelect ? values.userId : currentUserId;
      const fallbackMealPersonNames =
        userOptions.find(
          (userOption) => String(userOption.value) === String(targetUserId)
        )?.label || copy.user;
      const newExpenses = await Promise.all(
        (values.expenses || []).map((expense) =>
          buildExpensePayload(
            expense,
            targetUserId,
            fallbackMealPersonNames,
            allowedCodes
          )
        )
      );

      await dispatch(addExpenses(newExpenses));
      resetDraftAndClose();

      showMessage(
        "success",
        newExpenses.length === 1
          ? `${newExpenses[0].invoiceNumber} ${copy.addSuccessSingle}`
          : `${newExpenses.length} ${copy.addSuccessMultiple}`
      );
    } catch (error) {
      if (error?.errorFields) {
        scrollFormToFirstExpenseError(form, error);
        return;
      }

      console.error("Error validating fields or handling submit:", error);
      showMessage("error", getErrorMessage(error, copy.addError));
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue(true);
      const targetUserId = showUserSelect ? values.userId : currentUserId;
      const requestId = createDraftRequestId();
      const expenseRows = Array.isArray(values?.expenses) ? values.expenses : [];

      const draftExpenses = await Promise.all(
        expenseRows.map(async (row) => {
          const uploadEntry = row?.upload?.[0];
          const uploadFile = uploadEntry?.originFileObj || uploadEntry;
          const dataUrl = await convertFileToPngDataUrl(uploadFile);
          const imageData =
            extractBase64FromDataUrl(uploadEntry?.url) ||
            extractBase64FromDataUrl(dataUrl);
          return normalizeDraftExpenseForList(
            {
              ...row,
              id: createDraftExpenseId(),
              requestId,
              userId: targetUserId,
              status: "Taslak",
              imageData: imageData || undefined,
              createdAt: new Date().toISOString(),
            },
            targetUserId
          );
        })
      );

      upsertDraftExpenses(draftExpenses);
      resetDraftAndClose();
      showMessage("success", "Taslak olarak kaydedildi.");
    } catch (error) {
      console.error("Error saving draft:", error);
      showMessage("error", "Taslak kaydedilemedi.");
    }
  };

  const modalWidth =
    typeof window === "undefined"
      ? 960
      : window.innerWidth < 768
      ? window.innerWidth - 24
      : Math.min(window.innerWidth * 0.78, 1120);

  return (
    <Modal
      destroyOnClose
      title={copy.addModalTitle}
      className="documents__details-modal"
      open={open}
      onCancel={handleCloseModal}
      centered
      width={modalWidth}
      style={{ borderRadius: "0.3rem" }}
      bodyStyle={{ maxHeight: "75vh", overflowY: "auto" }}
      footer={false}
    >
      <div className="expense-batch-intro">
        <div>
          <div className="expense-batch-intro__title">{copy.batchTitle}</div>
          <div className="expense-batch-intro__subtitle">
            {copy.batchSubtitle}
          </div>
        </div>

        <div className="expense-batch-count">
          {expenseItems.length || 1} {copy.recordReadySuffix}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          userId: currentUserId,
          expenses: [createEmptyExpenseEntry()],
        }}
        onValuesChange={handleValuesChange}
        scrollToFirstError={{ behavior: "smooth", block: "center" }}
      >
        <ReceiptExtractStatusBar
          phase={receiptExtractPhase}
          elapsedSec={receiptExtractElapsedSec}
          titlePreparing={copy.receiptExtractPhasePreparing}
          titleScanning={copy.receiptExtractPhaseScanning}
          cancelLabel={copy.receiptExtractCancel}
          onCancel={cancelReceiptExtract}
        />
        {showUserSelect && (
          <Form.Item
            name="userId"
            label={copy.userSelectLabel}
            rules={[{ required: true, message: copy.userSelectRequired }]}
          >
            <StyledSelect
              options={userOptions}
              loading={loadingUsers}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={copy.userSelectPlaceholder}
            />
          </Form.Item>
        )}

        <Form.List name="expenses">
          {(fields, { remove }) => (
            <>
              {fields.map((field, index) => (
                <ExpenseEntryFields
                  key={field.key}
                  field={field}
                  index={index}
                  form={form}
                  remove={remove}
                  canRemove={fields.length > 1}
                  receiptExtractBusy={receiptExtractBusy}
                  receiptExtractPendingRowIndexes={receiptExtractPendingRowIndexes}
                  receiptExtractPhase={receiptExtractPhase}
                  receiptExtractElapsedSec={receiptExtractElapsedSec}
                  cancelReceiptExtract={cancelReceiptExtract}
                />
              ))}
            </>
          )}
        </Form.List>

        <Form.Item
          style={{ textAlign: "end", marginTop: "1rem", marginBottom: 0 }}
        >
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
            htmlType="button"
            disabled={receiptExtractBusy}
            style={{ marginRight: 10 }}
          >
            Taslak olarak kaydet
          </Button>
          <Button
            icon={<SendOutlined />}
            onClick={handleSubmit}
            type="primary"
            htmlType="button"
            loading={isSubmitting}
            disabled={receiptExtractBusy}
          >
            {copy.createAllExpenses}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModal;
