import moment from "moment";

import { isKnownExpenseCategory } from "../constants/expenseOptions";
import {
  extractBase64FromDataUrl,
  getComputedExpenseAmounts,
  omitExcludingVatAmount,
  pickComputedExpenseFormFields,
} from "./expenseForm";
import { calculateExpenseTotal, parseMoney } from "./expenseMoney";

const pickFirst = (obj, keys) => {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

const normalizeTaxRatePercent = (raw, fallback) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  // 0,2 → %20 gibi kesirler; `1` tek başına fişte %1 KDV anlamına gelir — %100 yapılmamalı.
  if (n > 0 && n < 1) return Math.round(n * 100);
  return n;
};

/**
 * OCR / API satır KDV’si: sayı, "20", "20%", "0,2", 0.2 → yüzde
 */
const parseVatPercentValue = (raw) => {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null;
    return normalizeTaxRatePercent(raw, null);
  }
  const s = String(raw)
    .trim()
    .replace(/%/g, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return normalizeTaxRatePercent(n, null);
};

/** Ürün adına gömülü "%10", "KDV %1" vb. (OCR tek sütunda birleştirdiyse) */
const inferVatPercentFromLineText = (text) => {
  if (!text || typeof text !== "string") return null;
  const m = text.match(/%\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  return parseVatPercentValue(m[1]);
};

const parseInvoiceDate = (raw) => {
  if (raw == null || raw === "") return null;
  if (moment.isMoment(raw)) return raw;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return moment(raw);
  }
  const s = String(raw).trim();
  if (!s) return null;
  const mIso = moment(s, moment.ISO_8601, true);
  if (mIso.isValid()) return mIso;
  const mDmy = moment(s, ["DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"], true);
  if (mDmy.isValid()) return mDmy;
  const loose = moment(s);
  return loose.isValid() ? loose : null;
};

const mapLineItem = (line, headerVatFallback, multiLineReceipt = false) => {
  if (!line || typeof line !== "object") return null;
  const itemName = String(
    pickFirst(line, [
      "item_name",
      "ItemName",
      "itemName",
      "name",
      "description",
      "product_name",
      "ProductName",
      "line_description",
    ]) || ""
  ).trim();
  if (!itemName) return null;

  let quantity = parseMoney(
    pickFirst(line, ["quantity", "qty", "Quantity", "adet", "Adet"])
  );
  let unitPrice = parseMoney(
    pickFirst(line, ["unit_price", "unitPrice", "UnitPrice", "birim_fiyat", "price"])
  );
  const lineTotal = parseMoney(
    pickFirst(line, [
      "line_total",
      "lineTotal",
      "totalAmount",
      "total",
      "gross",
      "amount",
      "tutar",
    ])
  );

  if (quantity == null && lineTotal != null) {
    quantity = 1;
    unitPrice = lineTotal;
  }
  if (quantity == null) quantity = 1;
  if (unitPrice == null && lineTotal != null) {
    unitPrice = Number.isFinite(quantity) && quantity !== 0 ? lineTotal / quantity : lineTotal;
  }

  // Satıra özel alanlar önce; genel `tax_rate` sıkça 0 (yer tutucu) gelir ve `line_vat_rate` ezilir.
  let kdvRaw = pickFirst(line, [
    "line_vat_rate",
    "lineVatRate",
    "line_vat_percent",
    "lineVatPercent",
    "line_tax_rate",
    "lineTaxRate",
    "kdv_rate",
    "KdvRate",
    "kdvRate",
    "kdv",
    "vat_rate",
    "vatRate",
    "VatRate",
    "vat_percent",
    "vatPercent",
    "KDV",
    "kdv_oran",
    "kdvOran",
    "KdvOrani",
    "kdv_orani",
    "vergi_orani",
    "VergiOrani",
    "oran",
    "tax_rate",
    "taxRate",
    "TaxRate",
  ]);
  if (kdvRaw === undefined) {
    const taxBlock = line.tax ?? line.Tax ?? line.vergi ?? line.Vergi;
    if (taxBlock && typeof taxBlock === "object" && !Array.isArray(taxBlock)) {
      kdvRaw = pickFirst(taxBlock, [
        "rate",
        "Rate",
        "percent",
        "vat_rate",
        "vatRate",
        "kdv_rate",
        "kdvRate",
      ]);
    }
  }
  let parsedLineVat = parseVatPercentValue(kdvRaw);
  const inferredFromName = inferVatPercentFromLineText(itemName);
  if (inferredFromName != null && (parsedLineVat == null || parsedLineVat === 0)) {
    parsedLineVat = inferredFromName;
  }
  // Birçok API satır KDV’si yokken tax_rate: 0 yazar; gerçek %0 ile karışmasın diye “bilinmiyor” say.
  if (parsedLineVat === 0 && inferredFromName == null) {
    parsedLineVat = null;
  }
  let kdvRate;
  if (parsedLineVat != null && Number.isFinite(parsedLineVat)) {
    kdvRate = parsedLineVat;
  } else {
    /**
     * Birçok fişte satır bazında KDV yazmaz; sadece "TOPKDV / KDV %20" gibi header bilgisi vardır.
     * Bu durumda (özellikle çok satırlı fişlerde) header fallback'i uygulamazsak UI'da KDV boş kalıyor.
     */
    kdvRate = headerVatFallback;
  }

  const row = {
    itemName,
    quantity: quantity != null ? quantity : 1,
    unitPrice: unitPrice != null ? unitPrice : 0,
  };
  if (kdvRate !== undefined) {
    row.kdvRate = kdvRate;
  }
  return row;
};

/**
 * Backend `data` nesnesini form satırı patch'ine çevirir (öneri; kullanıcı düzenler)
 */
export const mapReceiptExtractDataToFormPatch = (data, { defaultVatRate = 10 } = {}) => {
  if (!data || typeof data !== "object") return null;

  const invoiceTitleRaw = pickFirst(data, [
    "invoice_title",
    "invoiceTitle",
    "InvoiceTitle",
    "category",
    "Category",
  ]);
  const vendorOrProject = pickFirst(data, [
    "project_name",
    "projectName",
    "vendor_name",
    "merchant_name",
    "company_name",
    "kurum",
    "institution",
  ]);

  let invoiceTitle;
  let extraCategorie;
  const titleStr = String(invoiceTitleRaw || "").trim();
  if (titleStr && isKnownExpenseCategory(titleStr)) {
    invoiceTitle = titleStr;
  } else if (titleStr) {
    invoiceTitle = "Diğer";
    extraCategorie = titleStr;
  } else {
    invoiceTitle = undefined;
  }

  const invoiceDate = parseInvoiceDate(
    pickFirst(data, ["invoice_date", "invoiceDate", "InvoiceDate", "date", "fatura_tarihi"])
  );

  const invoiceNumber = pickFirst(data, [
    "invoice_number",
    "invoiceNumber",
    "InvoiceNumber",
    "fatura_no",
  ]);
  const currencyRaw = pickFirst(data, ["currency_code", "currencyCode", "CurrencyCode", "currency"]);
  const currencyCode =
    typeof currencyRaw === "string" && currencyRaw.trim()
      ? currencyRaw.trim().toUpperCase()
      : undefined;

  const totalAmount = parseMoney(
    pickFirst(data, [
      "total_amount",
      "totalAmount",
      "TotalAmount",
      "gross_total",
      "gross",
      "vergiler_dahil_toplam",
    ])
  );

  const excludingVatFromApi = parseMoney(
    pickFirst(data, [
      "excluding_vat_amount",
      "excludingVatAmount",
      "ExcludingVatAmount",
      "net_amount",
      "netAmount",
    ])
  );

  const vatFromApi = parseMoney(
    pickFirst(data, [
      "vat_amount",
      "vatAmount",
      "VatAmount",
      "vat_total",
      "kdv_tutari",
      "vat",
    ])
  );

  // Header KDV oranı: API bazen 0 döndürüyor (placeholder). 0 ise ve KDV/Toplam sıfır değilse default'a dön.
  const headerVatRateRaw = pickFirst(data, [
    "vat_rate",
    "vatRate",
    "VatRate",
    "kdv_rate",
    "KdvRate",
    "taxRate",
    "TaxRate",
  ]);
  let headerVatRate = normalizeTaxRatePercent(
    headerVatRateRaw ?? defaultVatRate,
    defaultVatRate
  );
  if (
    headerVatRate === 0 &&
    ((vatFromApi != null && Math.abs(vatFromApi) > 0.0001) ||
      (totalAmount != null && Math.abs(totalAmount) > 0.0001))
  ) {
    headerVatRate = defaultVatRate;
  }
  const safeHeaderVat = Number.isFinite(headerVatRate) ? headerVatRate : defaultVatRate;

  const itemsRaw = pickFirst(data, ["items", "Items", "lines", "Lines", "line_items", "kalemler"]);
  const multiLineItems = Array.isArray(itemsRaw) && itemsRaw.length > 1;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((line) => mapLineItem(line, safeHeaderVat, multiLineItems)).filter(Boolean)
    : [];

  const patch = {};

  if (vendorOrProject != null && String(vendorOrProject).trim()) {
    patch.projectName = String(vendorOrProject).trim();
  }
  if (invoiceTitle) patch.invoiceTitle = invoiceTitle;
  if (extraCategorie) patch.extraCategorie = extraCategorie;
  if (invoiceDate) patch.invoiceDate = invoiceDate;
  if (invoiceNumber != null && String(invoiceNumber).trim()) {
    patch.invoiceNumber = String(invoiceNumber).trim();
  }
  if (currencyCode) patch.currencyCode = currencyCode;
  if (Number.isFinite(safeHeaderVat)) patch.vatRate = safeHeaderVat;

  let resolvedTotalAmount = totalAmount;
  if (
    resolvedTotalAmount == null &&
    excludingVatFromApi != null &&
    Number.isFinite(safeHeaderVat) &&
    safeHeaderVat >= 0
  ) {
    resolvedTotalAmount = calculateExpenseTotal(excludingVatFromApi, safeHeaderVat);
  }
  if (resolvedTotalAmount != null) patch.totalAmount = resolvedTotalAmount;
  if (vatFromApi != null) patch.vat = vatFromApi;
  if (items.length) patch.items = items;

  const descriptionFromApi = pickFirst(data, ["description", "Description", "aciklama", "notes"]);
  if (descriptionFromApi != null && String(descriptionFromApi).trim()) {
    patch.description = String(descriptionFromApi).trim();
  } else {
    const descHint = [titleStr, patch.projectName].filter(Boolean).join(" — ");
    if (descHint) {
      patch.description = descHint;
    }
  }

  return Object.keys(patch).length ? patch : null;
};

/**
 * Yanıtta yalnızca camelCase özet alanlar varsa (ör. totalAmount, taxAmount) forma tamamlayıcı patch.
 */
export const mapGroqVisionResponseToFormPatch = (
  data,
  { defaultVatRate = 10 } = {}
) => {
  if (!data || typeof data !== "object") return null;

  const totalAmount = parseMoney(data.totalAmount);
  const taxAmount = parseMoney(data.taxAmount);
  const rateRaw = data.taxRate;
  const invoiceDate = parseInvoiceDate(
    pickFirst(data, ["date", "Date", "invoiceDate", "invoice_date"])
  );

  const patch = {};
  if (invoiceDate) patch.invoiceDate = invoiceDate;
  if (totalAmount != null) patch.totalAmount = totalAmount;
  if (taxAmount != null) patch.vat = taxAmount;
  if (rateRaw !== undefined && rateRaw !== null && rateRaw !== "") {
    const vr = normalizeTaxRatePercent(rateRaw, defaultVatRate);
    if (Number.isFinite(vr)) patch.vatRate = vr;
  }

  const coreKeys = Object.keys(patch);
  if (!coreKeys.length) return null;

  const descRaw = pickFirst(data, ["description", "Description", "notes"]);
  patch.description =
    descRaw != null && String(descRaw).trim()
      ? String(descRaw).trim()
      : "Fiş";

  return patch;
};

/**
 * OCR `data` → form patch. Öncelik: sunucunun `data` şeması (`mapReceiptExtractDataToFormPatch`);
 * yanıtta yalnızca camelCase özet alanlar varsa üzerine birleştirilir (satır `items` korunur).
 */
export const mapVisionExtractToFormPatch = (
  data,
  { defaultVatRate = 10 } = {}
) => {
  const fullPatch = mapReceiptExtractDataToFormPatch(data, { defaultVatRate });
  const camelPatch = mapGroqVisionResponseToFormPatch(data, { defaultVatRate });
  if (!camelPatch) return fullPatch;
  if (!fullPatch) return camelPatch;
  const descFromFull =
    fullPatch.description != null && String(fullPatch.description).trim()
      ? String(fullPatch.description).trim()
      : null;
  return {
    ...fullPatch,
    ...camelPatch,
    ...(Array.isArray(fullPatch.items) && fullPatch.items.length > 0
      ? { items: fullPatch.items }
      : {}),
    ...(descFromFull ? { description: descFromFull } : {}),
  };
};

/**
 * Bazı yanıtlarda alanlar `data` altında gelir; üst düzey boşsa iç nesneyi kullan.
 */
const unwrapNestedExtractPayload = (raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const inner = raw.data;
  if (!inner || typeof inner !== "object" || Array.isArray(inner)) return raw;
  const topHas =
    raw.total_amount != null ||
    raw.totalAmount != null ||
    (Array.isArray(raw.items) && raw.items.length > 0) ||
    raw.invoice_date != null ||
    raw.invoiceDate != null;
  if (topHas) return raw;
  return inner;
};

/**
 * OCR `data` → patch → forma (tekil veya Form.List satırı). Yeni masraf / taslak / revize ortak.
 */
export function applyReceiptExtractionToForm(
  form,
  rowPath,
  extractPayload,
  options = {}
) {
  const { defaultVatRate = 10 } = options;
  const normalized = unwrapNestedExtractPayload(extractPayload);
  const patch = mapVisionExtractToFormPatch(normalized, {
    defaultVatRate,
  });
  if (!patch || typeof patch !== "object") return false;
  applyReceiptPatchToFormRow(form, rowPath, patch, { defaultVatRate });
  return true;
}

/**
 * Dosyadan PNG data URL → ham base64 (API için)
 */
export const fileToPngBase64Payload = async (file, convertFileToPngDataUrl) => {
  if (!file) return { base64: "", contentType: "image/png" };
  const dataUrl = await convertFileToPngDataUrl(file);
  const base64 = extractBase64FromDataUrl(dataUrl || "");
  return { base64, contentType: "image/png" };
};

/**
 * Form satırına patch uygular; brüt/KDV türevlerini günceller.
 * rowPath: [] = kök form (tekil masraf), ['expenses', i] = çoklu liste satırı
 */
export const applyReceiptPatchToFormRow = (form, rowPath, patch, { defaultVatRate } = {}) => {
  if (!form || !patch || typeof patch !== "object") return;

  let merged;
  const patchHasVat =
    Object.prototype.hasOwnProperty.call(patch, "vat") &&
    patch.vat !== undefined &&
    patch.vat !== null &&
    String(patch.vat).trim?.() !== "";
  if (!rowPath || rowPath.length === 0) {
    merged = {
      ...form.getFieldsValue(true),
      ...patch,
    };
  } else {
    const [listKey, index] = rowPath;
    const list = form.getFieldValue(listKey) || [];
    const cur = list[index] || {};
    merged = { ...cur, ...patch };
    const amounts = getComputedExpenseAmounts(
      omitExcludingVatAmount({
        ...merged,
        amountInputMode: "totalAmount",
        vatRate: merged.vatRate ?? defaultVatRate,
      })
    );
    // OCR/AI vat geldiyse frontend hesaplaması vat'ı EZMEMELİ.
    const computed = pickComputedExpenseFormFields(amounts);
    if (patchHasVat) {
      delete computed.vat;
    }
    const nextRow = { ...merged, ...computed };
    const nextList = [...list];
    nextList[index] = nextRow;
    form.setFieldsValue({ [listKey]: nextList });
    return;
  }

  const amounts = getComputedExpenseAmounts(
    omitExcludingVatAmount({
      ...merged,
      amountInputMode: "totalAmount",
      vatRate: merged.vatRate ?? defaultVatRate,
    })
  );
  const computed = pickComputedExpenseFormFields(amounts);
  if (patchHasVat) {
    delete computed.vat;
  }
  form.setFieldsValue({
    ...merged,
    ...computed,
  });
};
