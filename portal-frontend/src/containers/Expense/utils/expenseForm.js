import moment from "moment";

import {
  isKnownExpenseCategory,
  resolveExpenseCategoryValue,
} from "../constants/expenseOptions";
import { resolveExpenseRequestId } from "./dashboardMetrics";
import {
  getExpenseSettings,
  resolveDefaultExpenseVatRate,
} from "../constants/expenseSettings";
import {
  calculateExcludingVatAmountFromTotal,
  calculateExpenseTotal,
  calculateUncoveredMealAmountFromTotal,
  calculateVatAmount,
  calculateVatAmountFromTotal,
  parseExpenseLineQuantity,
  parseExpenseLineUnitPrice,
  parseMoney,
  pickExpenseLineField,
} from "./expenseMoney";
import { DEFAULT_EXPENSE_CURRENCY } from "./expenseCurrency";
import { clipExpenseShortText } from "../constants/expenseFieldLimits";

/** Backend: opsiyonel; TRY veya bilinmeyen kod gönderme — 400 önlenir */
export const pickCurrencyCodeForApi = (currencyCode, allowedCodes) => {
  const c =
    typeof currencyCode === "string" ? currencyCode.trim().toUpperCase() : "";
  if (!c || c === DEFAULT_EXPENSE_CURRENCY) return undefined;
  if (allowedCodes instanceof Set && allowedCodes.size > 0) {
    return allowedCodes.has(c) ? c : undefined;
  }
  return /^[A-Z]{3}$/.test(c) ? c : undefined;
};

export const createEmptyExpenseEntry = () => {
  const { mealAcceptedDailyAmount } = getExpenseSettings();

  return {
    expenseType: undefined,
    amountInputMode: "totalAmount",
    currencyCode: DEFAULT_EXPENSE_CURRENCY,
    items: [],
    mealPersonCount: 1,
    acceptedDailyAmount: mealAcceptedDailyAmount,
    uncoveredAmount: 0,
    vatRate: resolveDefaultExpenseVatRate(),
    upload: [],
  };
};

export const normalizeExpenseUpload = (event) => {
  if (Array.isArray(event)) {
    return event.slice(-1);
  }

  return event?.fileList?.slice(-1);
};

const buildExistingUploadListItem = (info) => {
  const imageData = info?.imageData;
  if (!imageData || typeof imageData !== "string") return [];
  const invoiceNumber = String(info?.invoiceNumber || info?.invoiceNo || "").trim();
  return [
    {
      uid: "existing-receipt",
      name: invoiceNumber ? `fis-${invoiceNumber}.png` : "fis.png",
      status: "done",
      url: `data:image/png;base64,${imageData}`,
      thumbUrl: `data:image/png;base64,${imageData}`,
    },
  ];
};

export const convertFileToPngDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = reject;
      img.src = event.target?.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Fiş OCR API çağrısı için: uzun kenarı sınırla (ör. 12MP foto → daha küçük base64, daha kısa süre).
 * Çıktı JPEG (PNG’e göre çok daha küçük payload; yükleme ve sunucu işlemi hızlanır).
 * Masraf kaydına giden tam çözünürlük `convertFileToPngDataUrl` ile ayrı kalır.
 */
export const RECEIPT_EXTRACT_MAX_LONG_EDGE = 1920;
export const RECEIPT_EXTRACT_JPEG_QUALITY = 0.85;

export const convertFileToPngDataUrlForExtract = (
  file,
  maxLongEdge = RECEIPT_EXTRACT_MAX_LONG_EDGE
) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        const longEdge = Math.max(w, h);
        if (longEdge > maxLongEdge && longEdge > 0) {
          const scale = maxLongEdge / longEdge;
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
        }
        resolve(canvas.toDataURL("image/jpeg", RECEIPT_EXTRACT_JPEG_QUALITY));
      };

      img.onerror = reject;
      img.src = event.target?.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const extractBase64FromDataUrl = (value) => {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return "";
  const marker = "base64,";
  const idx = s.indexOf(marker);
  if (idx !== -1) return s.slice(idx + marker.length).trim();
  return s;
};

/** KDV oranı seçilmeden / boşken 0 saymayın; %0 ile karışır ve KDV yanlış görünür */
export const hasValidExpenseVatRate = (vatRate) => {
  if (vatRate === undefined || vatRate === null) return false;
  if (typeof vatRate === "string" && vatRate.trim() === "") return false;
  const n = Number(vatRate);
  return Number.isFinite(n) && n >= 0;
};

export const getComputedExpenseAmounts = (expense = {}) => {
  const hasValidVatRate = hasValidExpenseVatRate(expense.vatRate);
  const safeVatRate = hasValidVatRate ? Number(expense.vatRate) : 0;
  const isMealExpense = expense.invoiceTitle === "Yemek";
  const { mealAcceptedDailyAmount } = getExpenseSettings();
  const mealPersonCount = isMealExpense
    ? parseInt(expense.mealPersonCount, 10) || 1
    : 1;
  const acceptedDailyAmount = isMealExpense
    ? mealAcceptedDailyAmount * mealPersonCount
    : undefined;
  /**
   * Brüt (`totalAmount`) tek kaynak. `enteredTotalAmount` yokken eskiden
   * `excludingVatAmount` → brüt türetiliyordu; formda kalan eski net (ör. 180)
   * ile 180×1,1=198 gibi yanlış brütlere ve yazarken 200→198 sıçramasına yol açıyordu.
   * totalAmount modunda netten brüt türetme: sadece amountInputMode net odaklıysa (ileride).
   */
  const amountInputMode = expense.amountInputMode ?? "totalAmount";
  const rawTotal = expense.totalAmount;
  const isUserClearedTotal =
    typeof rawTotal === "string" && rawTotal.trim() === "";

  const enteredTotalAmount = parseMoney(rawTotal);
  /** totalAmount modunda forma yazılmış eski net (excludingVatAmount) brüt türetiminde kullanılmaz */
  const fallbackTotalAmount =
    amountInputMode === "totalAmount" || !hasValidVatRate
      ? undefined
      : calculateExpenseTotal(
          parseMoney(expense.excludingVatAmount),
          safeVatRate
        );

  const totalAmount =
    enteredTotalAmount != null
      ? enteredTotalAmount
      : isUserClearedTotal
        ? undefined
        : amountInputMode === "totalAmount"
          ? undefined
          : fallbackTotalAmount;

  /**
   * OCR/AI entegrasyonu: Backend bazen TOPKDV (vat) tutarını doğru verir ama oran karışık/yanlış olabilir.
   * Bu durumda frontend'in vatRate üzerinden yeniden KDV hesaplayıp API'dan gelen vat'ı ezmesi büyük sapma yaratır.
   * Kural: vat alanı doluysa (ve totalAmount da varsa) vat'ı KORU ve neti total-vat olarak türet.
   */
  const enteredVat = parseMoney(expense.vat);
  const hasEnteredVat = enteredVat != null && Number.isFinite(enteredVat);

  const excludingVatAmount =
    totalAmount != null && hasEnteredVat
      ? Math.round((totalAmount - enteredVat + Number.EPSILON) * 100) / 100
      : hasValidVatRate
        ? calculateExcludingVatAmountFromTotal(totalAmount, safeVatRate)
        : undefined;

  /** KDV = brüt − net (tek ayrıştırma) — vat girilmişse onu koru */
  const vat =
    totalAmount != null && hasEnteredVat
      ? enteredVat
      : hasValidVatRate &&
          totalAmount != null &&
          totalAmount !== undefined &&
          excludingVatAmount !== undefined
        ? calculateVatAmountFromTotal(totalAmount, safeVatRate)
        : undefined;

  return {
    excludingVatAmount,
    vat,
    totalAmount,
    acceptedDailyAmount,
    uncoveredAmount: isMealExpense
      ? calculateUncoveredMealAmountFromTotal(
          totalAmount,
          acceptedDailyAmount
        )
      : undefined,
  };
};

/**
 * Form state’e yazılacak türetilmiş alanlar. Brüt (`totalAmount`) ve net (`excludingVatAmount`)
 * burada tutulmaz; kullanıcı brütünü doğrudan girer, net API/submit anında hesaplanır.
 * Aksi halde forma yazılan eski net (ör. 165) sonraki turda brütü bozar (200→198).
 */
export const pickComputedExpenseFormFields = (amounts = {}) => {
  const next = {};
  if (Object.prototype.hasOwnProperty.call(amounts, "vat")) {
    next.vat = amounts.vat;
  }
  if (Object.prototype.hasOwnProperty.call(amounts, "acceptedDailyAmount")) {
    next.acceptedDailyAmount = amounts.acceptedDailyAmount;
  }
  if (Object.prototype.hasOwnProperty.call(amounts, "uncoveredAmount")) {
    next.uncoveredAmount = amounts.uncoveredAmount;
  }
  return next;
};

/** Formda tutulmamalı — türetilmiş net; stale kalınca brüt bozuluyor (200→198). */
export const omitExcludingVatAmount = (row) => {
  if (!row || typeof row !== "object") return row;
  const { excludingVatAmount, ...rest } = row;
  return rest;
};

/** Masraf ekle modalı taslak state: her kalemden excludingVatAmount atılır. */
export const sanitizeExpenseFormDraft = (values) => {
  if (!values || typeof values !== "object") return values;
  const next = { ...values };
  if (Array.isArray(next.expenses)) {
    next.expenses = next.expenses.map(omitExcludingVatAmount);
  }
  return next;
};

export const resolveExpenseCategoryInput = (invoiceTitle) =>
  invoiceTitle && !isKnownExpenseCategory(invoiceTitle)
    ? {
        invoiceTitle: "Diğer",
        extraCategorie: invoiceTitle,
      }
    : {
        invoiceTitle: resolveExpenseCategoryValue(invoiceTitle),
        extraCategorie: undefined,
      };

export const getFieldName = (prefix = [], name) =>
  prefix.length ? [...prefix, name] : name;

const resolvePersonCount = (value, fallback = 1) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const formatExpenseDateForApi = (value) =>
  value && typeof value.format === "function"
    ? value.format("YYYY-MM-DD")
    : null;

export const formatExpensePeriodForApi = (value, fallback = null) =>
  value && typeof value.format === "function"
    ? value.format("YYYY-MM")
    : fallback;

const normalizeExpenseItems = (items = [], fallbackVatRate = 0) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      const itemName = clipExpenseShortText(
        String(
          pickExpenseLineField(item, [
            "itemName",
            "item_name",
            "name",
            "description",
          ]) ?? ""
        ).trim()
      );
      const quantity = parseExpenseLineQuantity(item);
      const unitPrice = parseExpenseLineUnitPrice(item);
      const kdvRaw = pickExpenseLineField(item, [
        "kdvRate",
        "kdv_rate",
        "KdvRate",
      ]);
      const kdvNum = Number(kdvRaw);
      const kdvRate = Number.isFinite(kdvNum) ? kdvNum : fallbackVatRate ?? 0;

      if (!itemName || quantity === null || unitPrice === null) {
        return null;
      }

      const totalAmount = Number.isFinite(quantity * unitPrice)
        ? Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100
        : undefined;

      return {
        itemName,
        quantity,
        unitPrice,
        ...(totalAmount != null ? { totalAmount } : {}),
        kdvRate,
      };
    })
    .filter(Boolean);

export const buildExpensePayload = async (
  expense,
  userId,
  fallbackMealPersonNames,
  allowedCurrencyCodes = null
) => {
  const uploadEntry = expense.upload?.[0];
  const uploadFile = uploadEntry?.originFileObj || uploadEntry;
  const vatRateVal = Number(expense.vatRate);
  const safeVatRate = Number.isFinite(vatRateVal) ? vatRateVal : 0;
  const invoiceTitle = expense.invoiceTitle;
  const extraCategorieRaw =
    invoiceTitle === "Diğer" ? String(expense.extraCategorie || "").trim() : "";
  const extraCategorie = extraCategorieRaw
    ? clipExpenseShortText(extraCategorieRaw)
    : "";
  const amounts = getComputedExpenseAmounts({
    ...expense,
    amountInputMode: expense.amountInputMode,
    vatRate: safeVatRate,
  });
  const excludingVat = amounts.excludingVatAmount ?? 0;
  const items = normalizeExpenseItems(expense.items, safeVatRate);
  const personCount = resolvePersonCount(
    expense.personCount ?? expense.mealPersonCount,
    1
  );
  const currencyCode = pickCurrencyCodeForApi(
    expense.currencyCode,
    allowedCurrencyCodes
  );
  const imageDataFromUrl = uploadEntry?.url
    ? extractBase64FromDataUrl(uploadEntry.url)
    : "";

  return {
    userId: userId != null ? Number(userId) : undefined,
    projectName: clipExpenseShortText(expense.projectName),
    description: expense.description,
    expenseType: expense.expenseType,
    excludingVatAmount: excludingVat,
    vatRate: safeVatRate,
    vat: amounts.vat,
    totalAmount: amounts.totalAmount,
    acceptedDailyAmount: amounts.acceptedDailyAmount,
    uncoveredAmount: amounts.uncoveredAmount,
    invoiceDate: formatExpenseDateForApi(expense.invoiceDate),
    expensePeriod: formatExpensePeriodForApi(expense.invoiceDate),
    invoiceNumber: clipExpenseShortText(expense.invoiceNumber),
    invoiceTitle,
    ...(extraCategorie ? { extraCategorie } : {}),
    ...(items.length ? { items } : {}),
    personCount,
    mealPersonCount: personCount,
    mealPersonNames:
      invoiceTitle === "Yemek" || invoiceTitle === "Ulaşım"
        ? expense.mealPersonNames || fallbackMealPersonNames
        : expense.mealPersonNames,
    mealDescription: expense.mealDescription,
    imageData:
      imageDataFromUrl ||
      extractBase64FromDataUrl(await convertFileToPngDataUrl(uploadFile)),
    ...(currencyCode ? { currencyCode } : {}),
  };
};

export const buildUpdateExpensePayload = (
  values,
  currentExpense,
  fallbackUserId,
  overrides = {},
  allowedCurrencyCodes = null
) => {
  const amounts = getComputedExpenseAmounts(values);
  const excludingVatAmount = amounts.excludingVatAmount ?? 0;
  const vatRateNum = Number(values.vatRate);
  const vatRate = Number.isFinite(vatRateNum) ? vatRateNum : 0;
  const invoiceTitle = values.invoiceTitle;
  const extraCategorieRaw =
    invoiceTitle === "Diğer" ? String(values.extraCategorie || "").trim() : "";
  const extraCategorie = extraCategorieRaw
    ? clipExpenseShortText(extraCategorieRaw)
    : "";
  const items = normalizeExpenseItems(values.items, vatRate);
  const personCount = resolvePersonCount(
    values.personCount ?? values.mealPersonCount,
    1
  );
  const currencyCode = pickCurrencyCodeForApi(
    values.currencyCode,
    allowedCurrencyCodes
  );

  return {
    userId: values.userId ?? fallbackUserId ?? currentExpense?.userId,
    id: currentExpense?.id,
    projectName: clipExpenseShortText(values.projectName),
    description: values.description,
    expenseType: values.expenseType,
    excludingVatAmount,
    vatRate,
    vat: amounts.vat,
    totalAmount: amounts.totalAmount,
    acceptedDailyAmount: amounts.acceptedDailyAmount,
    uncoveredAmount: amounts.uncoveredAmount,
    invoiceDate: formatExpenseDateForApi(values.invoiceDate),
    expensePeriod: formatExpensePeriodForApi(
      values.invoiceDate,
      currentExpense?.expensePeriod
    ),
    invoiceNumber: clipExpenseShortText(values.invoiceNumber),
    invoiceTitle,
    ...(extraCategorie ? { extraCategorie } : {}),
    ...(items.length ? { items } : {}),
    personCount,
    mealPersonCount: personCount,
    mealPersonNames:
      invoiceTitle === "Yemek" || invoiceTitle === "Ulaşım"
        ? values.mealPersonNames
        : values.mealPersonNames,
    mealDescription: values.mealDescription,
    imageData: currentExpense?.imageData,
    status: currentExpense?.status,
    rejectReason: currentExpense?.rejectReason,
    rejectionReason: currentExpense?.rejectionReason,
    statusReason: currentExpense?.statusReason,
    ...(currencyCode ? { currencyCode } : {}),
    ...overrides,
  };
};

export const buildResubmitExpensePayload = (
  values,
  currentExpense,
  fallbackUserId,
  fallbackMealPersonNames,
  allowedCurrencyCodes = null
) => {
  const amounts = getComputedExpenseAmounts(values);
  const excludingVatAmount = amounts.excludingVatAmount ?? 0;
  const vatRateNum = Number(values.vatRate);
  const vatRate = Number.isFinite(vatRateNum) ? vatRateNum : 0;
  const invoiceTitle = values.invoiceTitle;
  const extraCategorieRaw =
    invoiceTitle === "Diğer" ? String(values.extraCategorie || "").trim() : "";
  const extraCategorie = extraCategorieRaw
    ? clipExpenseShortText(extraCategorieRaw)
    : "";
  const items = normalizeExpenseItems(values.items, vatRate);
  const personCount = resolvePersonCount(
    values.personCount ?? values.mealPersonCount,
    1
  );
  const currencyCode = pickCurrencyCodeForApi(
    values.currencyCode,
    allowedCurrencyCodes
  );

  const uploadEntry = values?.upload?.[0];
  const uploadFile = uploadEntry?.originFileObj || uploadEntry;
  const shouldConvertUpload =
    Boolean(uploadEntry?.originFileObj) ||
    (uploadFile instanceof Blob && typeof uploadFile?.arrayBuffer === "function");

  const resolveImageData = async () => {
    if (shouldConvertUpload) {
      const converted = await convertFileToPngDataUrl(uploadFile);
      return converted || currentExpense?.imageData;
    }
    return currentExpense?.imageData;
  };

  return resolveImageData().then((resolvedImageData) => ({
    // Talep anahtarını her zaman stabil tut (storage map fallback dahil)
    // Aksi halde resubmit sonrası yeni kayıtlar farklı requestId ile gruplanır ve UI "Beklemede" kalır.
    ...(String(
      currentExpense?.requestId ??
        currentExpense?.RequestId ??
        currentExpense?.RequestID ??
        resolveExpenseRequestId(currentExpense ?? {}) ??
        ""
    ).trim()
      ? (() => {
          const rid = String(
            currentExpense?.requestId ??
              currentExpense?.RequestId ??
              currentExpense?.RequestID ??
              resolveExpenseRequestId(currentExpense ?? {}) ??
              ""
          ).trim();
          return { requestId: rid, RequestId: rid };
        })()
      : {}),
    // Talep bazlı kaydı aynı requestId altında tut
    userId: values.userId ?? fallbackUserId ?? currentExpense?.userId,
    projectName: clipExpenseShortText(values.projectName),
    description: values.description,
    expenseType: values.expenseType,
    excludingVatAmount,
    vatRate,
    vat: amounts.vat,
    totalAmount: amounts.totalAmount,
    acceptedDailyAmount: amounts.acceptedDailyAmount,
    uncoveredAmount: amounts.uncoveredAmount,
    invoiceDate: formatExpenseDateForApi(values.invoiceDate),
    expensePeriod: formatExpensePeriodForApi(
      values.invoiceDate,
      currentExpense?.expensePeriod
    ),
    invoiceNumber: clipExpenseShortText(values.invoiceNumber),
    invoiceTitle,
    ...(extraCategorie ? { extraCategorie } : {}),
    ...(items.length ? { items } : {}),
    personCount,
    mealPersonCount: personCount,
    mealPersonNames:
      invoiceTitle === "Yemek" || invoiceTitle === "Ulaşım"
        ? values.mealPersonNames ||
          currentExpense?.mealPersonNames ||
          fallbackMealPersonNames
        : values.mealPersonNames,
    mealDescription: values.mealDescription,
    imageData: resolvedImageData,
    ...(currencyCode ? { currencyCode } : {}),
  }));
};

export const buildInitialExpenseFormValues = ({
  info,
  authUserId,
  currentUserId,
}) => {
  const resolvedCategory = resolveExpenseCategoryInput(info?.invoiceTitle);
  const currentVatRate =
    info?.vatRate ??
    resolveDefaultExpenseVatRate(resolvedCategory.invoiceTitle);
  const ownerId = info?.userId ?? authUserId ?? currentUserId;
  const { mealAcceptedDailyAmount } = getExpenseSettings();
  const mealPersonCount = resolvePersonCount(
    info?.personCount ?? info?.mealPersonCount,
    1
  );
  const totalAcceptedAmount =
    resolvedCategory.invoiceTitle === "Yemek"
      ? mealAcceptedDailyAmount * mealPersonCount
      : undefined;

  const rawItems = Array.isArray(info?.items) ? info.items : [];
  const clippedItems = rawItems.map((row) => ({
    ...row,
    itemName: clipExpenseShortText(String(row?.itemName ?? "").trim()),
  }));

  return {
    userId: ownerId,
    invoiceNumber: clipExpenseShortText(info?.invoiceNumber) || "",
    invoiceDate: info?.invoiceDate ? moment(info.invoiceDate) : null,
    projectName: clipExpenseShortText(info?.projectName) || "",
    invoiceTitle: resolvedCategory.invoiceTitle,
    extraCategorie: resolvedCategory.extraCategorie
      ? clipExpenseShortText(String(resolvedCategory.extraCategorie).trim())
      : resolvedCategory.extraCategorie,
    expenseType: info?.expenseType ?? undefined,
    amountInputMode: "totalAmount",
    currencyCode: info?.currencyCode ?? DEFAULT_EXPENSE_CURRENCY,
    excludingVatAmount:
      info?.excludingVatAmount ??
      calculateExcludingVatAmountFromTotal(info?.totalAmount, currentVatRate),
    vatRate: currentVatRate ?? 0,
    vat:
      info?.vat ?? calculateVatAmount(info?.excludingVatAmount, currentVatRate),
    totalAmount:
      info?.totalAmount ??
      calculateExpenseTotal(info?.excludingVatAmount, currentVatRate),
    acceptedDailyAmount: totalAcceptedAmount,
    uncoveredAmount:
      resolvedCategory.invoiceTitle === "Yemek"
        ? calculateUncoveredMealAmountFromTotal(
            info?.totalAmount ??
              calculateExpenseTotal(
                info?.excludingVatAmount,
                currentVatRate
              ),
            totalAcceptedAmount
          )
        : undefined,
    description: info?.description || "",
    items: clippedItems,
    personCount: mealPersonCount,
    mealPersonCount,
    mealPersonNames: info?.mealPersonNames || "",
    mealDescription: info?.mealDescription || "",
    upload: buildExistingUploadListItem(info),
  };
};
