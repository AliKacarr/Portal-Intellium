import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Button, Card, Form, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";

import ExpenseFormFields from "./Components/ExpenseFormFields";
import ReceiptExtractStatusBar from "./Components/ReceiptExtractStatusBar";
import {
  addExpenses,
  deleteIncompleteExpenseDraft,
  fetchIncompleteExpenseDraft,
  getErrorMessage,
  upsertExpenseDraft,
  upsertIncompleteExpenseDraft,
} from "./redux/actionCreators";
import { StyledSelect } from "./Expense.styles";
import useExpenseListReceiptExtract from "./hooks/useExpenseListReceiptExtract";
import useExpenseUsers from "./hooks/useExpenseUsers";
import useExpenseCurrencies from "./hooks/useExpenseCurrencies";
import useExpenseSettings from "./hooks/useExpenseSettings";
import { resolveDefaultExpenseVatRate } from "./constants/expenseSettings";
import {
  buildExpensePayload,
  convertFileToPngDataUrl,
  createEmptyExpenseEntry,
  extractBase64FromDataUrl,
  getComputedExpenseAmounts,
  omitExcludingVatAmount,
  pickComputedExpenseFormFields,
  normalizeExpenseUpload,
} from "./utils/expenseForm";
import { scrollFormToFirstExpenseError } from "./utils/formScrollToFirstError";
import { getExpenseCopy, getExpenseLocale } from "./utils/expenseI18n";
import {
  createDraftExpenseId,
  createDraftRequestId,
  normalizeDraftExpenseForList,
  upsertDraftExpenses,
} from "./utils/expenseDrafts";

const { Title, Text } = Typography;

const ExpenseEntryCard = ({
  field,
  index,
  form,
  remove,
  canRemove,
  receiptExtractBusy,
  receiptExtractPendingRowIndexes,
  receiptExtractPhase,
  receiptExtractElapsedSec,
  cancelReceiptExtract,
}) => {
  const copy = getExpenseCopy();
  const locale = getExpenseLocale();
  const invoiceDate = Form.useWatch(["expenses", field.name, "invoiceDate"], form);
  const invoiceTitle = Form.useWatch(["expenses", field.name, "invoiceTitle"], form);

  const dateLabel = invoiceDate
    ? new Date(invoiceDate).toLocaleDateString("tr-TR")
    : null;

  return (
    <Card
      style={{
        borderRadius: 18,
        border: "1px solid rgba(148, 163, 184, 0.35)",
        boxShadow:
          "0 16px 40px rgba(2, 6, 23, 0.08), 0 2px 0 rgba(255, 255, 255, 0.8) inset",
        marginBottom: 16,
        background: "#ffffff",
      }}
      bodyStyle={{ padding: 16 }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
              {copy.expenseCardTitle} {index + 1}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                marginTop: 6,
              }}
            >
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {copy.expenseCardSubtitle}
              </span>
              {dateLabel ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#0f172a",
                    background: "rgba(31,118,199,0.10)",
                    border: "1px solid rgba(31,118,199,0.25)",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                  title={locale === "en" ? "Invoice date of this expense" : "Bu masrafin fatura tarihi"}
                >
                  {dateLabel}
                </span>
              ) : null}
              {invoiceTitle ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#0f172a",
                    background: "rgba(148,163,184,0.12)",
                    border: "1px solid rgba(148,163,184,0.35)",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                  title={locale === "en" ? "Category of this expense" : "Bu masrafin kategorisi"}
                >
                  {String(invoiceTitle)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      }
      extra={
        canRemove ? (
          <Button
            danger
            type="text"
            onClick={() => remove(field.name)}
            disabled={receiptExtractBusy}
          >
            {copy.remove}
          </Button>
        ) : null
      }
    >
      <ExpenseFormFields
        form={form}
        namePrefix={[field.name]}
        watchPrefix={["expenses", field.name]}
        showUpload
        uploadRequired
        deferReceiptExtractToParent
        listReceiptExtractInline={{
          active:
            Array.isArray(receiptExtractPendingRowIndexes) &&
            receiptExtractPendingRowIndexes.includes(index) &&
            receiptExtractPhase !== "idle",
          phase: receiptExtractPhase,
          elapsedSec: receiptExtractElapsedSec,
          onCancel: cancelReceiptExtract,
        }}
      />
    </Card>
  );
};

export default function ExpenseCreatePage() {
  const copy = getExpenseCopy();
  const locale = getExpenseLocale();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const isSubmitting = useSelector((state) => state.expenses.loading);
  const expenseItems = Form.useWatch("expenses", form) || [];
  const { currentUserId, loadingUsers, userOptions } = useExpenseUsers();
  const { allowedCodes } = useExpenseCurrencies();
  const { vatRates } = useExpenseSettings();

  const showUserSelect = userOptions.length > 1;
  const skipAutosaveRef = useRef(false);
  const autosaveTimerRef = useRef(null);
  const incompleteDraftIdRef = useRef(null);
  const latestValuesRef = useRef(null);
  const [isIncompleteEditMode, setIsIncompleteEditMode] = React.useState(false);

  const initialValues = useMemo(
    () => ({
      userId: currentUserId,
      expenses: [createEmptyExpenseEntry()],
    }),
    [currentUserId]
  );

  // Tamamlanmamış (DB draft) düzenleme: /new?incompleteDraftId=...
  useEffect(() => {
    const search = new URLSearchParams(location?.search || "");
    const incompleteDraftId = String(search.get("incompleteDraftId") || "").trim();
    if (!incompleteDraftId) return;

    (async () => {
      const draft = await dispatch(fetchIncompleteExpenseDraft(incompleteDraftId));
      const draftId = draft?.id ?? draft?.draftId ?? incompleteDraftId;
      const rawPayload =
        draft?.payload ??
        draft?.payload_json ??
        draft?.payloadJson ??
        draft?.payloadJSON ??
        draft?.Payload ??
        {};
      const payload =
        typeof rawPayload === "string"
          ? (() => {
              try {
                return JSON.parse(rawPayload);
              } catch {
                return {};
              }
            })()
          : rawPayload || {};
      const rows = Array.isArray(payload?.expenses)
        ? payload.expenses
        : Array.isArray(payload?.Expenses)
        ? payload.Expenses
        : [];
      if (!rows.length) return;

      // Autosave aynı kaydı güncellesin
      incompleteDraftIdRef.current = String(draftId);
      setIsIncompleteEditMode(true);

      const mapped = rows.map((r) => ({
        ...createEmptyExpenseEntry(),
        ...r,
        upload: normalizeExpenseUpload([
          ...(typeof r?.imageData === "string" && r.imageData
            ? [
                {
                  uid: "existing-receipt",
                  name: "fis.png",
                  status: "done",
                  url: `data:image/png;base64,${r.imageData}`,
                  thumbUrl: `data:image/png;base64,${r.imageData}`,
                },
              ]
            : []),
        ]),
      }));

      form.setFieldsValue({
        userId: payload?.userId ?? form.getFieldValue("userId") ?? currentUserId,
        expenses: mapped,
      });
      latestValuesRef.current = form.getFieldsValue(true);
    })();
  }, [dispatch, location?.search, form, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      const current = form.getFieldValue("userId");
      if (!showUserSelect || !current) {
        form.setFieldValue("userId", currentUserId);
      }
    }
  }, [currentUserId, form, showUserSelect]);

  const scheduleTamamlanmamisAutosave = useCallback(() => {
    latestValuesRef.current = form.getFieldsValue(true);
    if (skipAutosaveRef.current) {
      return;
    }
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const values = latestValuesRef.current || form.getFieldsValue(true);
        const targetUserId = showUserSelect ? values.userId : currentUserId;
        const rows = Array.isArray(values?.expenses) ? values.expenses : [];

        const drafts = await Promise.all(
          rows.map(async (row) => {
            const uploadEntry = row?.upload?.[0];
            const uploadFile = uploadEntry?.originFileObj || uploadEntry;
            const canConvert =
              Boolean(uploadEntry?.originFileObj) || uploadFile instanceof Blob;
            const dataUrl = canConvert ? await convertFileToPngDataUrl(uploadFile) : "";
            const imageData =
              extractBase64FromDataUrl(
                typeof uploadEntry?.url === "string" ? uploadEntry.url : ""
              ) || extractBase64FromDataUrl(dataUrl);

            return {
              ...row,
              userId: targetUserId,
              status: "Tamamlanmamış",
              imageData: imageData || undefined,
            };
          })
        );

        const res = await dispatch(
          upsertIncompleteExpenseDraft({
            draftId: incompleteDraftIdRef.current,
            payload: {
              userId: targetUserId,
              status: "Tamamlanmamış",
              expenses: drafts,
            },
          })
        );
        const returnedId = res?.draftId ?? res?.id ?? null;
        if (returnedId) {
          incompleteDraftIdRef.current = returnedId;
        }
      } catch {
        // autosave sessiz
      }
    }, 900);
  }, [dispatch, form, currentUserId, showUserSelect]);

  const {
    receiptExtractBusy,
    receiptExtractPhase,
    receiptExtractElapsedSec,
    receiptExtractPendingRowIndexes,
    cancelReceiptExtract,
  } = useExpenseListReceiptExtract(form, {
    listName: "expenses",
    enabled: true,
    onReceiptExtractApplied: scheduleTamamlanmamisAutosave,
  });

  const handleValuesChange = (changedValues, allValues) => {
    const changedExpenses = changedValues.expenses;

    if (!changedExpenses || !Array.isArray(changedExpenses)) {
      return;
    }

    const nextExpenses = [...(allValues.expenses || [])];
    let hasUpdates = false;

    changedExpenses.forEach((changedExpense, index) => {
      if (!changedExpense) {
        return;
      }

      const hasItems =
        Array.isArray(nextExpenses[index]?.items) && nextExpenses[index].items.length > 0;

      const totalAmountChanged = Object.prototype.hasOwnProperty.call(
        changedExpense,
        "totalAmount"
      );
      const vatRateChanged = Object.prototype.hasOwnProperty.call(changedExpense, "vatRate");
      const invoiceTitleChanged = Object.prototype.hasOwnProperty.call(
        changedExpense,
        "invoiceTitle"
      );
      const mealPersonCountChanged = Object.prototype.hasOwnProperty.call(
        changedExpense,
        "mealPersonCount"
      );

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

      if (invoiceTitleChanged) {
        expenseRow = {
          ...expenseRow,
          vatRate: resolveDefaultExpenseVatRate(expenseRow.invoiceTitle, vatRates),
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
      form.setFieldsValue({
        ...allValues,
        expenses: nextExpenses,
      });
    }

    // Fiş OCR setFieldsValue onValuesChange tetiklemez; OCR sonrası scheduleTamamlanmamisAutosave hook'tan çağrılır
    scheduleTamamlanmamisAutosave();
  };

  const flushAutosave = async () => {
    if (skipAutosaveRef.current) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    try {
      const values = latestValuesRef.current || form.getFieldsValue(true);
      const targetUserId = showUserSelect ? values.userId : currentUserId;
      const rows = Array.isArray(values?.expenses) ? values.expenses : [];
      const drafts = await Promise.all(
        rows.map(async (row) => {
          const uploadEntry = row?.upload?.[0];
          const uploadFile = uploadEntry?.originFileObj || uploadEntry;
          const canConvert =
            Boolean(uploadEntry?.originFileObj) || uploadFile instanceof Blob;
          const dataUrl = canConvert ? await convertFileToPngDataUrl(uploadFile) : "";
          const imageData =
            extractBase64FromDataUrl(
              typeof uploadEntry?.url === "string" ? uploadEntry.url : ""
            ) || extractBase64FromDataUrl(dataUrl);
          return {
            ...row,
            userId: targetUserId,
            status: "Tamamlanmamış",
            imageData: imageData || undefined,
          };
        })
      );
      const res = await dispatch(
        upsertIncompleteExpenseDraft({
          draftId: incompleteDraftIdRef.current,
          payload: { userId: targetUserId, status: "Tamamlanmamış", expenses: drafts },
        })
      );
      const returnedId = res?.draftId ?? res?.id ?? null;
      if (returnedId) incompleteDraftIdRef.current = returnedId;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushAutosave();
      }
    };
    const onPageHide = () => void flushAutosave();
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [dispatch, currentUserId, showUserSelect]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields(undefined, {
        scrollToFirstError: { behavior: "smooth", block: "center" },
      });
      const targetUserId = showUserSelect ? values.userId : currentUserId;

      const fallbackMealPersonNames =
        userOptions.find((userOption) => String(userOption.value) === String(targetUserId))
          ?.label || copy.user;

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

      message.success(
        newExpenses.length === 1
          ? `${newExpenses[0].invoiceNumber} ${copy.addSuccessSingle}`
          : `${newExpenses.length} ${copy.addSuccessMultiple}`
      );

      // Tamamlanmamış kaydı gerçek masrafa dönüştürüldüyse cleanup
      if (incompleteDraftIdRef.current) {
        await dispatch(deleteIncompleteExpenseDraft(incompleteDraftIdRef.current));
        incompleteDraftIdRef.current = null;
        setIsIncompleteEditMode(false);
      }

      history.push("/dashboard/my-expenses");
    } catch (error) {
      if (error?.errorFields) {
        scrollFormToFirstExpenseError(form, error);
        return;
      }
      message.error(getErrorMessage(error, copy.addError));
    }
  };

  const handleResetForm = () => {
    const nextValues = {
      ...initialValues,
      userId: showUserSelect ? form.getFieldValue("userId") : currentUserId,
      expenses: [createEmptyExpenseEntry()],
    };
    form.setFieldsValue(nextValues);
    latestValuesRef.current = nextValues;
  };

  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue(true);
      const targetUserId = showUserSelect ? values.userId : currentUserId;
      const rows = Array.isArray(values?.expenses) ? values.expenses : [];

      const draftExpenses = await Promise.all(
        rows.map(async (row) => {
          const uploadEntry = row?.upload?.[0];
          const uploadFile = uploadEntry?.originFileObj || uploadEntry;
          const hasExistingUrl =
            typeof uploadEntry?.url === "string" && uploadEntry.url.trim() !== "";
          const canConvert =
            Boolean(uploadEntry?.originFileObj) || uploadFile instanceof Blob;
          const dataUrl = canConvert ? await convertFileToPngDataUrl(uploadFile) : "";
          const imageData =
            extractBase64FromDataUrl(hasExistingUrl ? uploadEntry.url : "") ||
            extractBase64FromDataUrl(dataUrl);
          return {
            ...row,
            userId: targetUserId,
            status: "Taslak",
            imageData: imageData || undefined,
            createdAt: new Date().toISOString(),
          };
        })
      );

      // Backend taslak (uuid) sistemi varsa onu kullan.
      // Aynı zamanda varsa incomplete autosave kaydını temizle ki listede "Tamamlanmamış" görünmesin.
      await dispatch(
        upsertExpenseDraft({
          draftId: null,
          payload: { userId: targetUserId, status: "Taslak", expenses: draftExpenses },
          silent: false,
        })
      );
      if (incompleteDraftIdRef.current) {
        await dispatch(deleteIncompleteExpenseDraft(incompleteDraftIdRef.current));
        incompleteDraftIdRef.current = null;
      }

      // Local taslak fallback (backend endpoint yoksa) - mevcut davranışı koru
      const requestId = createDraftRequestId();
      const localDrafts = draftExpenses.map((row) =>
        normalizeDraftExpenseForList(
          {
            ...row,
            id: createDraftExpenseId(),
            requestId,
          },
          targetUserId
        )
      );
      upsertDraftExpenses(localDrafts, { silent: false });
      message.success("Taslak olarak kaydedildi.");
      history.push("/dashboard/my-expenses");
    } catch (error) {
      console.error("Error saving draft:", error);
      message.error(String(error?.message || "Taslak kaydedilemedi."));
    }
  };

  return (
    <div
      style={{
        padding: "18px 18px 84px",
        maxWidth: 1180,
        margin: "0 auto",
      }}
    >
      {/* Fatura No / Kurum artık her masraf için ayrı girilir */}
      <div
        style={{
          borderRadius: 22,
          padding: 18,
          border: "1px solid rgba(148,163,184,0.28)",
          background:
            "radial-gradient(1100px 220px at 10% 0%, rgba(47,137,217,0.18) 0%, rgba(47,137,217,0) 60%), radial-gradient(900px 260px at 90% 10%, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0) 55%), linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
          boxShadow: "0 18px 46px rgba(2, 6, 23, 0.08)",
          marginBottom: 16,
        }}
      >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Button
              onClick={() => history.push("/dashboard/my-expenses")}
              style={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                height: 40,
                background: "rgba(255,255,255,0.9)",
              }}
            >
              {copy.back || "Geri"}
            </Button>
            <Title level={3} style={{ margin: 0, color: "#0f172a" }}>
              {copy.addModalTitle || "Yeni masraf talepleri"}
            </Title>
          </div>
          <Text style={{ color: "#64748b" }}>
            {copy.batchSubtitle || (locale === "en" ? "You can add multiple expenses at once." : "Birden fazla masrafi tek seferde ekleyebilirsiniz.")}
          </Text>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(255,255,255,0.85)",
              color: "#0f172a",
              fontWeight: 600,
              height: 40,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {(expenseItems.length || 1) + " " + (copy.recordReadySuffix || (locale === "en" ? "record" : "kayit"))}
          </div>
        </div>
      </div>
      </div>

      <Card
        style={{
          borderRadius: 20,
          border: "1px solid rgba(148, 163, 184, 0.28)",
          background: "#ffffff",
          boxShadow:
            "0 22px 60px rgba(2, 6, 23, 0.08), 0 2px 0 rgba(255, 255, 255, 0.75) inset",
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
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
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <ExpenseEntryCard
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

                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <Button
                    onClick={() => add(createEmptyExpenseEntry())}
                    disabled={receiptExtractBusy}
                    style={{
                      borderRadius: 16,
                      border: "1.5px dashed rgba(47,137,217,0.65)",
                      color: "#0f172a",
                      height: 44,
                      padding: "0 16px",
                      fontWeight: 600,
                      background: "rgba(47,137,217,0.06)",
                    }}
                  >
                    {copy.addNewExpense || "Yeni masraf ekle"}
                  </Button>
                </div>
              </>
            )}
          </Form.List>

          <div
            style={{
              position: "sticky",
              bottom: 0,
              marginTop: 18,
              paddingTop: 12,
              paddingBottom: 10,
              paddingRight: 16,
              background:
                "linear-gradient(180deg, rgba(248,250,252,0) 0%, rgba(255,255,255,0.92) 35%, rgba(255,255,255,1) 100%)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <Button
              onClick={handleResetForm}
              htmlType="button"
              disabled={isSubmitting || receiptExtractBusy}
              style={{
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.45)",
                background: "rgba(255,255,255,0.9)",
                fontWeight: 600,
              }}
            >
              {locale === "en" ? "Clear form" : "Formu temizle"}
            </Button>
            {isIncompleteEditMode ? (
              <Button
                onClick={flushAutosave}
                htmlType="button"
                disabled={isSubmitting || receiptExtractBusy}
                style={{
                  height: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.45)",
                  background: "rgba(255,255,255,0.9)",
                  fontWeight: 700,
                }}
              >
                {locale === "en" ? "Update" : "Guncelle"}
              </Button>
            ) : null}
            <Button
              onClick={async () => {
                // İptal: DB'ye kaydetme. Eğer autosave ile draft oluştuysa temizle.
                skipAutosaveRef.current = true;
                if (autosaveTimerRef.current) {
                  clearTimeout(autosaveTimerRef.current);
                  autosaveTimerRef.current = null;
                }
                const id = incompleteDraftIdRef.current;
                if (id) {
                  await dispatch(deleteIncompleteExpenseDraft(id));
                }
                incompleteDraftIdRef.current = null;
                setIsIncompleteEditMode(false);
                history.push("/dashboard/my-expenses");
              }}
              style={{
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.45)",
                background: "rgba(255,255,255,0.9)",
                fontWeight: 600,
              }}
            >
              {copy.cancel || (locale === "en" ? "Cancel" : "Iptal")}
            </Button>
            {!isIncompleteEditMode ? (
              <Button
                onClick={handleSaveDraft}
                htmlType="button"
                disabled={isSubmitting || receiptExtractBusy}
                style={{
                  height: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.45)",
                  background: "rgba(255,255,255,0.9)",
                  fontWeight: 700,
                }}
              >
                {locale === "en" ? "Save as draft" : "Taslak olarak kaydet"}
              </Button>
            ) : null}
            <Button
              onClick={handleSubmit}
              type="primary"
              htmlType="button"
              loading={isSubmitting}
              disabled={receiptExtractBusy}
              style={{
                height: 44,
                borderRadius: 14,
                background: "linear-gradient(180deg, #3aa0ff 0%, #2f89d9 100%)",
                borderColor: "#2f89d9",
                fontWeight: 700,
                boxShadow: "0 14px 26px rgba(47,137,217,0.26)",
              }}
            >
              {isIncompleteEditMode ? (locale === "en" ? "Request expense" : "Masraf talep et") : copy.createAllExpenses}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
