import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Image, message, Spin, Tooltip } from "antd";
import { useSelector } from "react-redux";
import {
  DeleteOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  StopOutlined,
  SwapOutlined,
} from "@ant-design/icons";

import {
  StyledDatePicker,
  StyledDivider,
  StyledInput,
  StyledSelect,
  StyledTextArea,
  StyledUploadDragger,
} from "../Expense.styles";
import {
  buildExpenseCategoryOptions,
  buildExpensePaymentTypeOptions,
  getExpenseCopy,
  getExpenseLocale,
} from "../utils/expenseI18n";
import useExpenseCategories from "../hooks/useExpenseCategories";
import useExpenseCurrencies from "../hooks/useExpenseCurrencies";
import useExpenseSettings from "../hooks/useExpenseSettings";
import { resolveDefaultExpenseVatRate } from "../constants/expenseSettings";
import {
  getFieldName,
  hasValidExpenseVatRate,
  normalizeExpenseUpload,
} from "../utils/expenseForm";
import { applyReceiptExtractionToForm } from "../utils/mapReceiptExtractToForm";
import {
  extractReceipt,
  getReceiptExtractErrorMessage,
  isReceiptExtractApiKeyError,
  isReceiptExtractClientTimeout,
  isReceiptExtractRequestCancelled,
} from "../utils/receiptExtractApi";
import {
  getSplitVatFromGrossAmount,
  parseExpenseLineQuantity,
  parseExpenseLineUnitPrice,
  parseMoney,
} from "../utils/expenseMoney";
import {
  calculateUncoveredMealAmountFromTotal,
} from "../utils/calculateExpenseTotal";
import {
  disableFutureInvoiceDates,
  disablePastInvoiceMonths,
  getInvoicePeriodLabel,
  isFutureInvoiceDate,
  isPastInvoiceMonth,
} from "../utils/invoicePeriod";

const rowStyle = {
  width: "100%",
  display: "flex",
  gap: ".75rem",
  flexWrap: "wrap",
};

const fieldStyle = {
  flex: 1,
  minWidth: "220px",
};

const vatRateFieldStyle = {
  display: "flex",
  alignItems: "stretch",
  width: "100%",
  overflow: "hidden",
  borderRadius: 16,
};

const vatRatePrefixStyle = {
  width: 52,
  minWidth: 52,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(213, 221, 235, 0.92)",
  borderRight: "none",
  borderRadius: "16px 0 0 16px",
  background: "#f8fbff",
  color: "#7f91b0",
  fontWeight: 700,
};

const EMPTY_RECEIPT_ROW_PATH = [];

/**
 * Form.Item `valuePropName="fileList"` değerini Upload'a iletir; ara `div` DOM'a `fileList` basmasın diye tek çocuk olarak kullanılır.
 */
const ReceiptUploadWithOverlay = React.forwardRef(
  ({ overlay, draggerStyle, children, ...uploadProps }, ref) => (
    <div style={{ position: "relative" }}>
      {overlay}
      <StyledUploadDragger ref={ref} style={draggerStyle} {...uploadProps}>
        {children}
      </StyledUploadDragger>
    </div>
  )
);
ReceiptUploadWithOverlay.displayName = "ReceiptUploadWithOverlay";

const ExpenseFormFields = ({
  form,
  namePrefix = [],
  watchPrefix = namePrefix,
  uploadRequired = false,
  showUpload = false,
  initialInvoiceDate = null,
  hideRequestSharedFields = false,
  /** Çoklu masraf: üst bileşen useExpenseListReceiptExtract ile bulk çağrısı yapar */
  deferReceiptExtractToParent = false,
  /** Fiş OCR patch uygulandıktan sonra (setFieldsValue onValuesChange tetiklemez — autosave için) */
  onReceiptExtractApplied,
  /** Tekil masraf: OCR sırasında üst çekmece/sayfa gönder butonlarını kilitlemek için */
  onReceiptExtractLoadingChange,
  /** defer=true: useExpenseListReceiptExtract bu satır için OCR sürüyorsa (görsel yanı metin + overlay) */
  listReceiptExtractInline,
}) => {
  const copy = getExpenseCopy();
  const locale = getExpenseLocale();
  const { categories } = useExpenseCategories();
  const { currencyOptions, allowedCodes, loading: currenciesLoading } =
    useExpenseCurrencies();
  const { mealAcceptedDailyAmount, previousPeriodCutoffDay, vatRates } =
    useExpenseSettings();
  const accessToken = useSelector((s) => s.Auth?.accessToken);
  const defaultVatRateForExtract = useMemo(
    () => resolveDefaultExpenseVatRate(undefined, vatRates),
    [vatRates]
  );
  const receiptRowPathForExtract = useMemo(() => {
    if (Array.isArray(watchPrefix) && watchPrefix.length >= 2) {
      return [watchPrefix[0], watchPrefix[1]];
    }
    return EMPTY_RECEIPT_ROW_PATH;
  }, [
    Array.isArray(watchPrefix) && watchPrefix.length >= 2
      ? `${watchPrefix[0]}:${watchPrefix[1]}`
      : "root",
  ]);
  const lastReceiptExtractUidRef = useRef(null);
  const receiptExtractApiKeyWarnedRef = useRef(false);
  const receiptExtractAbortRef = useRef(null);
  const receiptExtractElapsedTimerRef = useRef(null);
  const [receiptExtractPhase, setReceiptExtractPhase] = useState("idle");
  const [receiptExtractElapsedSec, setReceiptExtractElapsedSec] = useState(0);
  const invoiceTitle = Form.useWatch(
    getFieldName(watchPrefix, "invoiceTitle"),
    form
  );
  const invoiceDate = Form.useWatch(
    getFieldName(watchPrefix, "invoiceDate"),
    form
  );
  const vatRate = Form.useWatch(getFieldName(watchPrefix, "vatRate"), form);
  const totalAmount = Form.useWatch(
    getFieldName(watchPrefix, "totalAmount"),
    form
  );
  const itemsWatch = Form.useWatch(getFieldName(watchPrefix, "items"), form);
  const uploadWatch = Form.useWatch(getFieldName(watchPrefix, "upload"), form);
  const currencyCodeWatch =
    Form.useWatch(getFieldName(watchPrefix, "currencyCode"), form) || "TRY";
  const hasItemRows = Array.isArray(itemsWatch) && itemsWatch.length > 0;
  const invoicePeriodLabel = getInvoicePeriodLabel(invoiceDate);
  const isMealExpense = invoiceTitle === "Yemek";
  const shouldShowParticipantNames =
    invoiceTitle === "Yemek" || invoiceTitle === "Ulaşım";
  const shouldShowPersonCount =
    invoiceTitle === "Yemek" || invoiceTitle === "Ulaşım";
  const isOtherExpense = invoiceTitle === "Diğer";
  const hasInitializedVatRateRef = useRef(false);
  const previousInvoiceTitleRef = useRef(invoiceTitle);
  const [uploadObjectUrl, setUploadObjectUrl] = useState(null);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);
  const categoryOptions = buildExpenseCategoryOptions(categories, {
    includeHidden: Boolean(invoiceTitle),
  });
  const vatRateOptions = useMemo(
    () =>
      vatRates.map((value) => ({
        value,
        label: String(value),
      })),
    [vatRates]
  );

  const listInline = listReceiptExtractInline;
  const receiptExtractUiActive = useMemo(() => {
    if (deferReceiptExtractToParent) {
      return Boolean(listInline?.active);
    }
    return receiptExtractPhase !== "idle";
  }, [deferReceiptExtractToParent, listInline, receiptExtractPhase]);

  const receiptExtractUiPhase = useMemo(() => {
    if (deferReceiptExtractToParent && listInline?.active) {
      return listInline.phase === "preparing" || listInline.phase === "scanning"
        ? listInline.phase
        : "scanning";
    }
    return receiptExtractPhase;
  }, [deferReceiptExtractToParent, listInline, receiptExtractPhase]);

  const receiptExtractUiElapsed = useMemo(() => {
    if (deferReceiptExtractToParent && listInline?.active) {
      return listInline.elapsedSec ?? 0;
    }
    return receiptExtractElapsedSec;
  }, [deferReceiptExtractToParent, listInline, receiptExtractElapsedSec]);

  const cancelReceiptExtractUi = useCallback(() => {
    if (deferReceiptExtractToParent && typeof listInline?.onCancel === "function") {
      listInline.onCancel();
      return;
    }
    receiptExtractAbortRef.current?.abort();
  }, [deferReceiptExtractToParent, listInline]);

  useEffect(() => {
    const mealPersonCountField = getFieldName(watchPrefix, "mealPersonCount");

    if (shouldShowPersonCount) {
      const currentValue = form.getFieldValue(mealPersonCountField);
      if (currentValue === undefined || currentValue === null) {
        form.setFieldValue(mealPersonCountField, 1);
      }
      return;
    }

    form.setFieldValue(mealPersonCountField, 1);
  }, [form, shouldShowPersonCount, watchPrefix]);

  useEffect(() => {
    const vatRateField = getFieldName(watchPrefix, "vatRate");
    const currentVatRate = form.getFieldValue(vatRateField);
    const targetVatRate = resolveDefaultExpenseVatRate(invoiceTitle, vatRates);
    const hasCurrentVatRate = vatRates.includes(Number(currentVatRate));

    if (!hasInitializedVatRateRef.current) {
      if (
        currentVatRate === undefined ||
        currentVatRate === null ||
        currentVatRate === ""
      ) {
        form.setFieldValue(vatRateField, targetVatRate);
      }
      hasInitializedVatRateRef.current = true;
      previousInvoiceTitleRef.current = invoiceTitle;
      return;
    }

    if (
      previousInvoiceTitleRef.current !== invoiceTitle ||
      !hasCurrentVatRate
    ) {
      form.setFieldValue(vatRateField, targetVatRate);
    }

    previousInvoiceTitleRef.current = invoiceTitle;
  }, [form, invoiceTitle, vatRates, watchPrefix]);

  /**
   * Kategori (ör. Yemek) değişince KDV oranı useEffect ile güncellenir; AddModal onValuesChange
   * bu güncellemeyi her zaman yakalamaz. Brüt + oran değişince KDV tutarı alanını her zaman türet.
   */
  useEffect(() => {
    const vatField = getFieldName(watchPrefix, "vat");

    // Kalem bazlı giriş varsa KDV tutarını kalemlerden türet.
    if (hasItemRows) {
      const normalizedItems = Array.isArray(itemsWatch) ? itemsWatch : [];
      const multiLineItems = normalizedItems.length > 1;
      const vatFromItems = normalizedItems.reduce((sum, item) => {
        const unitPrice = parseExpenseLineUnitPrice(item);
        const quantity =
          parseExpenseLineQuantity(item) ?? (unitPrice != null ? 1 : null);
        if (quantity == null || unitPrice == null) return sum;
        const gross = quantity * unitPrice;
        let effectiveRate;
        if (hasValidExpenseVatRate(item?.kdvRate)) {
          effectiveRate = item.kdvRate;
        } else if (!multiLineItems) {
          effectiveRate = vatRate;
        } else {
          return sum;
        }
        if (!hasValidExpenseVatRate(effectiveRate)) return sum;
        const split = getSplitVatFromGrossAmount(gross, effectiveRate);
        return sum + (split?.vat || 0);
      }, 0);
      form.setFieldValue(vatField, Number(vatFromItems.toFixed(2)));
      return;
    }

    if (!hasValidExpenseVatRate(vatRate)) {
      form.setFieldValue(vatField, undefined);
      return;
    }

    const split = getSplitVatFromGrossAmount(totalAmount, vatRate);
    if (!split) {
      return;
    }

    form.setFieldValue(vatField, split.vat);
  }, [form, watchPrefix, totalAmount, vatRate, itemsWatch, hasItemRows]);

  useEffect(() => {
    const acceptedDailyAmountField = getFieldName(
      watchPrefix,
      "acceptedDailyAmount"
    );
    const uncoveredAmountField = getFieldName(watchPrefix, "uncoveredAmount");
    const mealPersonCountField = getFieldName(watchPrefix, "mealPersonCount");

    if (!isMealExpense) {
      form.setFieldValue(acceptedDailyAmountField, undefined);
      form.setFieldValue(uncoveredAmountField, undefined);
      return;
    }

    const mealPersonCount =
      parseInt(form.getFieldValue(mealPersonCountField), 10) || 1;
    const totalAcceptedDailyAmount = mealAcceptedDailyAmount * mealPersonCount;
    const computedTotalAmount = totalAmount;

    form.setFieldValue(acceptedDailyAmountField, totalAcceptedDailyAmount);
    form.setFieldValue(
      uncoveredAmountField,
      calculateUncoveredMealAmountFromTotal(
        computedTotalAmount,
        totalAcceptedDailyAmount
      ) ?? 0
    );
  }, [
    form,
    isMealExpense,
    mealAcceptedDailyAmount,
    totalAmount,
    vatRate,
    watchPrefix,
  ]);

  /**
   * Kalemlerden otomatik toplam:
   * toplam = Σ(adet × birim fiyat)
   * Birim fiyatlar KDV dahil girildiği için ek KDV uygulanmaz.
   */
  useEffect(() => {
    const totalAmountField = getFieldName(watchPrefix, "totalAmount");
    const normalizedItems = Array.isArray(itemsWatch) ? itemsWatch : [];
    if (!normalizedItems.length) {
      return;
    }

    let hasAnyCompleteLine = false;
    const calculatedTotal = normalizedItems.reduce((sum, item) => {
      const unitPrice = parseExpenseLineUnitPrice(item);
      const quantity =
        parseExpenseLineQuantity(item) ?? (unitPrice != null ? 1 : null);
      if (quantity == null || unitPrice == null) return sum;
      hasAnyCompleteLine = true;
      return sum + quantity * unitPrice;
    }, 0);

    // Kullanıcı ilk satırı doldururken (henüz quantity/unitPrice tamam değilken)
    // toplam alanını 0'a çekmeyelim.
    if (!hasAnyCompleteLine) {
      return;
    }

    const currentTotal = parseMoney(form.getFieldValue(totalAmountField));
    if ((currentTotal ?? 0) !== calculatedTotal) {
      form.setFieldValue(totalAmountField, Number(calculatedTotal.toFixed(2)));
    }
  }, [form, itemsWatch, watchPrefix]);

  const currentUploadItem = useMemo(() => {
    const list = Array.isArray(uploadWatch) ? uploadWatch : [];
    return list[0] || null;
  }, [uploadWatch]);

  const uploadPreviewSrc = useMemo(() => {
    if (!currentUploadItem) return null;
    const fromUrl = currentUploadItem.thumbUrl || currentUploadItem.url;
    if (typeof fromUrl === "string" && fromUrl.trim()) return fromUrl;
    if (typeof uploadObjectUrl === "string" && uploadObjectUrl.trim()) {
      return uploadObjectUrl;
    }
    return null;
  }, [currentUploadItem, uploadObjectUrl]);

  useEffect(() => {
    // Yeni dosya seçildiyse stabil bir blob URL üret; preview açıkken değişmesin.
    const fileObj = currentUploadItem?.originFileObj;
    if (!(fileObj instanceof Blob)) {
      // Mevcut kayıt (data url) ise objectUrl gerekmez.
      if (uploadObjectUrl) {
        try {
          if (uploadObjectUrl.startsWith("blob:")) URL.revokeObjectURL(uploadObjectUrl);
        } catch {}
        setUploadObjectUrl(null);
      }
      return;
    }

    let nextUrl = null;
    try {
      nextUrl = URL.createObjectURL(fileObj);
    } catch {
      nextUrl = null;
    }

    setUploadObjectUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(prev);
        } catch {}
      }
      return nextUrl;
    });

    return () => {
      if (nextUrl && nextUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(nextUrl);
        } catch {}
      }
    };
    // Sadece dosya objesi değişince çalışsın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUploadItem?.originFileObj]);

  useEffect(() => {
    if (receiptExtractPhase === "idle") {
      setReceiptExtractElapsedSec(0);
      if (receiptExtractElapsedTimerRef.current) {
        clearInterval(receiptExtractElapsedTimerRef.current);
        receiptExtractElapsedTimerRef.current = null;
      }
      return;
    }
    setReceiptExtractElapsedSec(0);
    receiptExtractElapsedTimerRef.current = setInterval(() => {
      setReceiptExtractElapsedSec((n) => n + 1);
    }, 1000);
    return () => {
      if (receiptExtractElapsedTimerRef.current) {
        clearInterval(receiptExtractElapsedTimerRef.current);
        receiptExtractElapsedTimerRef.current = null;
      }
    };
  }, [receiptExtractPhase]);

  useEffect(() => {
    onReceiptExtractLoadingChange?.({
      busy: receiptExtractUiActive,
      phase: receiptExtractUiPhase,
    });
  }, [receiptExtractUiActive, receiptExtractUiPhase, onReceiptExtractLoadingChange]);

  useEffect(
    () => () => {
      receiptExtractAbortRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    if (!showUpload || deferReceiptExtractToParent || !accessToken) {
      return undefined;
    }
    const list = Array.isArray(uploadWatch) ? uploadWatch : [];
    const f = list[0];
    if (!f?.originFileObj) {
      return undefined;
    }
    const uid = f.uid;
    if (lastReceiptExtractUidRef.current === uid) {
      return undefined;
    }
    let cancelled = false;
    receiptExtractAbortRef.current?.abort();
    const ac = new AbortController();
    receiptExtractAbortRef.current = ac;

    (async () => {
      try {
        const { payload, ocrDurationMs } = await extractReceipt(accessToken, {
          file: f.originFileObj,
          signal: ac.signal,
          onPhase: (p) => setReceiptExtractPhase(p),
        });
        if (cancelled) return;
        lastReceiptExtractUidRef.current = uid;
        if (
          !applyReceiptExtractionToForm(
            form,
            receiptRowPathForExtract,
            payload,
            { defaultVatRate: defaultVatRateForExtract }
          )
        ) {
          return;
        }
        onReceiptExtractApplied?.();
        if (ocrDurationMs != null && ocrDurationMs > 0) {
          const sec = Math.max(1, Math.round(ocrDurationMs / 1000));
          message.success(
            copy.receiptExtractCompleted.replace("{seconds}", String(sec)),
            4
          );
        }
      } catch (e) {
        if (isReceiptExtractRequestCancelled(e)) {
          return;
        }
        const expenseCopy = getExpenseCopy();
        if (isReceiptExtractApiKeyError(e)) {
          if (!receiptExtractApiKeyWarnedRef.current) {
            receiptExtractApiKeyWarnedRef.current = true;
            message.warning(expenseCopy.receiptExtractUnavailable);
          }
          return;
        }
        if (isReceiptExtractClientTimeout(e)) {
          message.warning(expenseCopy.receiptExtractTimeout);
          return;
        }
        const serverMsg = getReceiptExtractErrorMessage(e, expenseCopy);
        message.warning(
          serverMsg || expenseCopy.receiptExtractUnavailable
        );
      } finally {
        setReceiptExtractPhase("idle");
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [
    uploadWatch,
    deferReceiptExtractToParent,
    showUpload,
    accessToken,
    form,
    receiptRowPathForExtract,
    defaultVatRateForExtract,
    onReceiptExtractApplied,
  ]);

  const hasReceiptPreview = Boolean(uploadPreviewSrc);

  const validatePositiveTotalAmount = (_, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.reject(new Error(copy.amountEitherRequired));
    }
    const numericValue = Number(String(value).replace(",", "."));
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return Promise.reject(new Error(copy.amountEitherRequired));
    }
    return Promise.resolve();
  };

  const validateCurrencyCode = (_, value) => {
    const code = typeof value === "string" ? value.trim().toUpperCase() : "";
    if (!code) {
      return Promise.reject(new Error(copy.currencyRequired));
    }
    if (allowedCodes.size > 0 && !allowedCodes.has(code)) {
      return Promise.reject(new Error(copy.currencyRequired));
    }
    return Promise.resolve();
  };

  const validateVatRateRange = (_, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.reject(new Error(copy.vatRateRequired));
    }
    const numericValue = Number(String(value).replace(",", "."));
    if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100) {
      return Promise.reject(new Error(copy.vatRateRequired));
    }
    return Promise.resolve();
  };

  const validateInvoiceDate = (_, value) => {
    if (!value) {
      return Promise.resolve();
    }

    if (isFutureInvoiceDate(value)) {
      return Promise.reject(new Error(copy.futureInvoiceError));
    }

    if (!isPastInvoiceMonth(value, undefined, previousPeriodCutoffDay)) {
      return Promise.resolve();
    }

    if (initialInvoiceDate && value.isSame(initialInvoiceDate, "month")) {
      return Promise.resolve();
    }

    return Promise.reject(new Error(copy.pastInvoiceError));
  };

  const disabledInvoiceDate = (currentDate) => {
    if (disableFutureInvoiceDates(currentDate)) {
      return true;
    }

    if (
      !disablePastInvoiceMonths(currentDate, undefined, previousPeriodCutoffDay)
    ) {
      return false;
    }

    return !(
      initialInvoiceDate &&
      currentDate &&
      currentDate.isSame(initialInvoiceDate, "month")
    );
  };

  return (
    <>
      <Form.Item
        hidden
        name={getFieldName(namePrefix, "amountInputMode")}
      >
        <input type="hidden" />
      </Form.Item>

      <div style={rowStyle}>
        {!hideRequestSharedFields ? (
          <Form.Item
            rules={[{ required: true, message: copy.invoiceNumberRequired }]}
            label={copy.invoiceNumber}
            name={getFieldName(namePrefix, "invoiceNumber")}
            style={fieldStyle}
          >
            <StyledInput
              className="modal-input invoice"
              placeholder={copy.invoiceNumberPlaceholder}
            />
          </Form.Item>
        ) : null}

        <Form.Item
          rules={[
            { required: true, message: copy.invoiceDateRequired },
            { validator: validateInvoiceDate },
          ]}
          label={copy.invoiceDate}
          name={getFieldName(namePrefix, "invoiceDate")}
          style={fieldStyle}
        >
          <StyledDatePicker
            className="modal-input invoice"
            style={{ width: "100%" }}
            disabledDate={disabledInvoiceDate}
          />
        </Form.Item>

        <div style={fieldStyle}>
          <div className="expense-readonly-label">{copy.invoicePeriod}</div>
          <StyledInput
            className="modal-input invoice"
            value={invoicePeriodLabel}
            placeholder={copy.invoicePeriodPlaceholder}
            readOnly
          />
        </div>
      </div>

      {!hideRequestSharedFields ? (
        <Form.Item
          rules={[{ required: true, message: copy.companyRequired }]}
          label={copy.company}
          name={getFieldName(namePrefix, "projectName")}
        >
          <StyledInput
            className="modal-input invoice"
            placeholder={copy.companyPlaceholder}
          />
        </Form.Item>
      ) : null}

      <Form.Item
        rules={[{ required: true, message: copy.categoryRequired }]}
        label={copy.category}
        name={getFieldName(namePrefix, "invoiceTitle")}
      >
        <StyledSelect
          className="modal-input invoice"
          options={categoryOptions}
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={copy.categoryPlaceholder}
        />
      </Form.Item>

      {isOtherExpense ? (
        <Form.Item
          rules={[{ required: true, message: copy.otherCategoryRequired }]}
          name={getFieldName(namePrefix, "extraCategorie")}
        >
          <StyledInput
            className="modal-input invoice"
            placeholder={copy.otherCategoryPlaceholder}
          />
        </Form.Item>
      ) : null}

      <StyledDivider />

      <Form.Item
        label={copy.paymentType}
        name={getFieldName(namePrefix, "expenseType")}
      >
        <StyledSelect
          options={buildExpensePaymentTypeOptions()}
          allowClear
          placeholder={copy.paymentTypePlaceholder}
        />
      </Form.Item>

      <div className="expense-amount-section">
        <div className="expense-amount-section__title">
          {locale === "en" ? "Invoice Items" : "Fatura Kalemleri"}
        </div>

        <Form.List name={getFieldName(namePrefix, "items")}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <div key={field.key} style={rowStyle}>
                  <Form.Item
                    style={{ ...fieldStyle, minWidth: "180px" }}
                    name={[field.name, "itemName"]}
                    rules={[{ required: true, message: locale === "en" ? "Item name is required" : "Kalem adi gerekli" }]}
                  >
                    <StyledInput placeholder={locale === "en" ? "Item name" : "Kalem adi"} />
                  </Form.Item>

                  <Form.Item
                    style={{ ...fieldStyle, minWidth: "120px", flex: "0 0 120px" }}
                    name={[field.name, "quantity"]}
                    rules={[{ required: true, message: locale === "en" ? "Quantity is required" : "Adet gerekli" }]}
                  >
                    <StyledInput
                      type="number"
                      min={1}
                      step={1}
                      placeholder={locale === "en" ? "Qty" : "Adet"}
                      addonAfter={locale === "en" ? "qty" : "adet"}
                      onWheel={(event) => event.currentTarget.blur()}
                    />
                  </Form.Item>

                  <Form.Item
                    style={{ ...fieldStyle, minWidth: "150px", flex: "0 0 150px" }}
                    name={[field.name, "unitPrice"]}
                    rules={[{ required: true, message: locale === "en" ? "Unit price is required" : "Birim fiyat gerekli" }]}
                  >
                    <StyledInput
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={locale === "en" ? "Unit price" : "Birim fiyat"}
                      onWheel={(event) => event.currentTarget.blur()}
                    />
                  </Form.Item>

                  <Form.Item
                    style={{ ...fieldStyle, minWidth: "170px", flex: "0 0 170px" }}
                    labelCol={{ span: 0 }}
                    wrapperCol={{ span: 24 }}
                  >
                    <div style={{ display: "flex", alignItems: "stretch", width: "100%" }}>
                      <Form.Item name={[field.name, "kdvRate"]} noStyle>
                        <StyledSelect
                          options={vatRateOptions}
                          placeholder={locale === "en" ? "VAT %" : "KDV %"}
                          allowClear
                          style={{ flex: 1, minWidth: 0 }}
                        />
                      </Form.Item>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "#4b5f7e",
                          border: "1px solid rgba(213, 221, 235, 0.92)",
                          borderLeft: "none",
                          borderRadius: "0 16px 16px 0",
                          padding: "4px 10px",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          background: "#f8fbff",
                          marginLeft: -1,
                        }}
                      >
                        {locale === "en" ? "VAT %" : "KDV %"}
                      </span>
                    </div>
                  </Form.Item>

                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                    style={{ alignSelf: "center" }}
                  />
                </div>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ quantity: 1, kdvRate: vatRate || undefined })}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {locale === "en" ? "Add item" : "Kalem Ekle"}
              </Button>
            </>
          )}
        </Form.List>
      </div>

      <div className="expense-amount-section">
        <div className="expense-amount-section__title">
          {copy.amountSectionTitle}
        </div>
        <div
          style={{
            color: "#6d7f9b",
            fontSize: ".92rem",
            marginBottom: ".85rem",
          }}
        >
          {copy.amountInputHint}
        </div>

        <Form.Item
          rules={[{ validator: validateCurrencyCode }]}
          label={copy.currency}
          name={getFieldName(namePrefix, "currencyCode")}
        >
          <StyledSelect
            className="modal-input invoice"
            options={currencyOptions}
            loading={currenciesLoading}
            showSearch
            optionFilterProp="label"
            placeholder={copy.currency}
          />
        </Form.Item>

        <Form.Item
          rules={[{ validator: validatePositiveTotalAmount }]}
          name={getFieldName(namePrefix, "totalAmount")}
          label={copy.totalInCurrency.replace("{code}", currencyCodeWatch)}
        >
          <StyledInput
            className="modal-input invoice"
            min={0}
            type="number"
            placeholder={copy.totalPlaceholder}
            disabled={hasItemRows}
          />
        </Form.Item>

        <div style={rowStyle}>
          {!hasItemRows ? (
            <Form.Item style={fieldStyle} label={copy.vatRate} required>
              <div style={vatRateFieldStyle}>
                <div style={vatRatePrefixStyle}>%</div>
                <Form.Item
                  noStyle
                  rules={[{ validator: validateVatRateRange }]}
                  name={getFieldName(namePrefix, "vatRate")}
                >
                  <StyledSelect
                    className="joined-select"
                    placeholder={copy.vatRatePlaceholder}
                    options={vatRateOptions}
                    style={{ width: "100%" }}
                    dropdownStyle={{ borderRadius: 16 }}
                  />
                </Form.Item>
              </div>
            </Form.Item>
          ) : null}

          <Form.Item
            style={hasItemRows ? { width: "100%" } : fieldStyle}
            name={getFieldName(namePrefix, "vat")}
            label={copy.vatInCurrency.replace("{code}", currencyCodeWatch)}
          >
            <StyledInput
              className="modal-input invoice"
              min={0}
              type="number"
              step="0.01"
              placeholder={copy.vatAmountPlaceholder}
              readOnly
            />
          </Form.Item>
        </div>

        {isMealExpense ? (
          <div style={rowStyle}>
            <Form.Item
              style={fieldStyle}
              name={getFieldName(namePrefix, "acceptedDailyAmount")}
              label={copy.acceptedDailyAmount}
            >
              <StyledInput
                className="modal-input invoice"
                min={0}
                type="number"
                placeholder={copy.acceptedDailyAmountPlaceholder}
                readOnly
              />
            </Form.Item>

            <Form.Item
              style={fieldStyle}
              name={getFieldName(namePrefix, "uncoveredAmount")}
              label={copy.uncoveredAmount}
            >
              <StyledInput
                className="modal-input invoice"
                min={0}
                type="number"
                placeholder={copy.uncoveredAmountPlaceholder}
                readOnly
              />
            </Form.Item>
          </div>
        ) : null}

      </div>

      {shouldShowPersonCount ? (
        <Form.Item
          rules={[{ required: true, message: copy.personCountRequired }]}
          label={copy.personCount}
          name={getFieldName(namePrefix, "mealPersonCount")}
        >
          <StyledInput
            className="modal-input invoice"
            type="number"
            min={1}
            placeholder={copy.personCountPlaceholder}
          />
        </Form.Item>
      ) : null}

      {shouldShowParticipantNames ? (
        <Form.Item
          rules={[
            {
              required: true,
              message:
                locale === "en"
                  ? "You must enter participant names."
                  : "Katilimci isimlerini girmelisiniz.",
            },
          ]}
          label={locale === "en" ? "Participant Names" : "Katilimci Isimleri"}
          name={getFieldName(namePrefix, "mealPersonNames")}
        >
          <StyledTextArea
            className="modal-input invoice"
            rows={2}
            style={{ resize: "none" }}
            placeholder={locale === "en" ? "E.g. Alice, Bob, Carol" : "Orn: Ali, Veli, Ayse"}
          />
        </Form.Item>
      ) : null}

      <Form.Item
        rules={[{ required: true, message: copy.descriptionRequired }]}
        label={copy.description}
        name={getFieldName(namePrefix, "description")}
      >
        <StyledTextArea
          className="modal-input invoice"
          rows={3}
          style={{ resize: "none" }}
          placeholder={copy.descriptionPlaceholder}
        />
      </Form.Item>

      {showUpload ? (
        <>
          <Form.Item
            rules={
              uploadRequired
                ? [{ required: true, message: copy.invoiceImageRequired }]
                : undefined
            }
            label={
              <span>
                {copy.invoiceImage}{" "}
                <Tooltip title={copy.receiptExtractExpectationHint}>
                  <InfoCircleOutlined
                    style={{ color: "#94a3b8", cursor: "help" }}
                    aria-label={copy.receiptExtractExpectationHint}
                  />
                </Tooltip>
              </span>
            }
            name={getFieldName(namePrefix, "upload")}
            valuePropName="fileList"
            getValueFromEvent={normalizeExpenseUpload}
          >
            <ReceiptUploadWithOverlay
              accept="image/*"
              multiple={false}
              maxCount={1}
              beforeUpload={() => false}
              disabled={receiptExtractUiActive}
              showUploadList={false}
              draggerStyle={
                hasReceiptPreview
                  ? {
                      padding: 0,
                      background: "transparent",
                      border: "none",
                    }
                  : undefined
              }
              overlay={
                receiptExtractUiActive ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 2,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.88)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: 12,
                      textAlign: "center",
                    }}
                  >
                    <Spin />
                    <div
                      style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}
                    >
                      {receiptExtractUiPhase === "preparing"
                        ? copy.receiptExtractPhasePreparing
                        : copy.receiptExtractPhaseScanning}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      ({receiptExtractUiElapsed}s)
                    </div>
                    <Button
                      type="link"
                      size="small"
                      icon={<StopOutlined />}
                      onClick={cancelReceiptExtractUi}
                      style={{ padding: 0, height: "auto", fontWeight: 600 }}
                    >
                      {copy.receiptExtractCancel}
                    </Button>
                  </div>
                ) : null
              }
            >
              {hasReceiptPreview ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 16,
                    border: "1px solid rgba(213, 221, 235, 0.92)",
                    background: "#f8fbff",
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReceiptPreviewOpen(true);
                    }}
                    style={{
                      border: 0,
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 0,
                      textAlign: "left",
                      flex: "1 1 auto",
                    }}
                    title={locale === "en" ? "Enlarge image" : "Gorseli buyut"}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid rgba(213, 221, 235, 0.92)",
                        background: "#ffffff",
                        flex: "0 0 auto",
                      }}
                    >
                      <img
                        src={uploadPreviewSrc}
                        alt={copy.originalInvoice}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#0f172a",
                          fontSize: 13,
                          lineHeight: 1.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 320,
                        }}
                        title={currentUploadItem?.name}
                      >
                        {currentUploadItem?.name || (locale === "en" ? "receipt.png" : "fis.png")}
                      </div>
                      {receiptExtractUiActive ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 6,
                            marginTop: 4,
                            lineHeight: 1.3,
                          }}
                        >
                          <Spin size="small" />
                          <span
                            style={{
                              fontSize: 12,
                              color: "#2563eb",
                              fontWeight: 700,
                            }}
                          >
                            {copy.receiptExtractFieldsLoading}
                          </span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            ({receiptExtractUiElapsed}s)
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginTop: 4,
                            lineHeight: 1.2,
                          }}
                        >
                          {locale === "en" ? "Image uploaded" : "Gorsel yuklu"}
                        </div>
                      )}
                    </div>
                  </button>

                  <Button
                    type="default"
                    icon={<SwapOutlined />}
                    onClick={(e) => {
                      // Dragger click'i ile çakışmasın; sadece dosya seçiciyi açsın.
                      e.preventDefault();
                      e.stopPropagation();
                      // Upload'ın kendi input'una tıkla (antd DOM yapısı versiyona göre değişebilir).
                      const formItem = e.currentTarget?.closest?.(".ant-form-item");
                      const input =
                        formItem?.querySelector?.('input[type="file"]') ||
                        e.currentTarget
                          ?.closest?.(".ant-upload")
                          ?.querySelector?.('input[type="file"]') ||
                        e.currentTarget
                          ?.parentElement
                          ?.querySelector?.('input[type="file"]');
                      input?.click?.();
                    }}
                    style={{ borderRadius: 12, fontWeight: 700 }}
                  >
                    {locale === "en" ? "Change image" : "Gorseli degistir"}
                  </Button>

                  <Image
                    style={{ display: "none" }}
                    preview={{
                      visible: receiptPreviewOpen,
                      onVisibleChange: (visible) => setReceiptPreviewOpen(visible),
                    }}
                    src={uploadPreviewSrc}
                  />
                </div>
              ) : (
                <>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">{copy.uploadHintPrimary}</p>
                  <p className="ant-upload-hint">{copy.uploadHintSecondary}</p>
                </>
              )}
            </ReceiptUploadWithOverlay>
          </Form.Item>
          <div
            style={{
              marginTop: -6,
              marginBottom: 12,
              fontSize: 12,
              color: "#ef4444",
              fontWeight: 600,
            }}
          >
            {locale === "en"
              ? "Info receipt: It is not considered an official document by itself and is not accepted for expense requests."
              : "Bilgi Fisi: Tek basina resmi bir belge niteligi tasimaz, masraf talebinde kabul edilmez."}
          </div>
        </>
      ) : null}
    </>
  );
};

export default ExpenseFormFields;
