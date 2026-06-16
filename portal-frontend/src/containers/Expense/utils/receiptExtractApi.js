import axios from "axios";

import {
  convertFileToPngDataUrlForExtract,
  extractBase64FromDataUrl,
} from "./expenseForm";
import { host } from "../../../Api/host";

/**
 * Kanonik fiş okuma (Groq, sunucu tarafı).
 * Tek URL: `{host}/api/expense/receipt/extract` — JSON veya multipart.
 * Eski `/ReceiptExtract/OCR`, ayrı portlar veya `groq-vision` yolu kullanılmaz.
 *
 * `host`: `REACT_APP_API_BASE_URL` veya `REACT_APP_BACKEND_URL` (`src/Api/host.js`).
 */
export const RECEIPT_EXTRACT_PATH = "/api/expense/receipt/extract";
export const RECEIPT_EXTRACT_BULK_PATH = "/api/expense/receipt/extract/bulk";

const EXTRACT_URL = `${host}${RECEIPT_EXTRACT_PATH}`;
const EXTRACT_BULK_URL = `${host}${RECEIPT_EXTRACT_BULK_PATH}`;

/** Tekil fiş OCR; sunucu 10–90 sn sürebilir. */
export const RECEIPT_EXTRACT_SINGLE_TIMEOUT_MS = 90000;

const authHeaders = (accessToken) =>
  accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

/** Sunucu `code` → expenseI18n anahtarı */
export const RECEIPT_EXTRACT_ERROR_CODE_COPY_KEYS = {
  RECEIPT_AI_MAX_TOKENS: "receiptExtractErrMaxTokens",
  RECEIPT_AI_PARSE: "receiptExtractErrParse",
  RECEIPT_AI_UPSTREAM: "receiptExtractErrUpstream",
  RECEIPT_AI_QUOTA: "receiptExtractErrQuota",
  RECEIPT_AI_NOT_CONFIGURED: "receiptExtractErrNotConfigured",
  RECEIPT_AI_EMPTY_MODEL: "receiptExtractErrEmptyModel",
  EMPTY_IMAGE: "receiptExtractErrEmptyImage",
  MISSING_IMAGE: "receiptExtractErrMissingImage",
};

const stripOcrMetaFromPayload = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const next = { ...obj };
  delete next.ocr_duration_ms;
  delete next.ocrDurationMs;
  return next;
};

const parseOcrDurationMsFromResponse = (res) => {
  const headers = res?.headers || {};
  const hRaw =
    headers["x-ocr-duration-ms"] ??
    headers["X-Ocr-Duration-Ms"] ??
    headers["X-OCR-DURATION-MS"];
  let v = Number(hRaw);
  if (Number.isFinite(v)) return Math.round(v);

  const b = res?.data;
  if (!b || typeof b !== "object") return undefined;
  const top = b.ocr_duration_ms ?? b.ocrDurationMs;
  v = Number(top);
  if (Number.isFinite(v)) return Math.round(v);

  const inner = b.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    v = Number(inner.ocr_duration_ms ?? inner.ocrDurationMs);
    if (Number.isFinite(v)) return Math.round(v);
  }
  return undefined;
};

/**
 * HTTP 200 gövdesinden OCR `data` nesnesini ve süreyi ayırır.
 * Beklenen: `{ data: { invoice_number, items, ... }, ocr_duration_ms? }`
 */
export const parseExtractSuccessResponse = (res) => {
  const ocrDurationMs = parseOcrDurationMsFromResponse(res);
  const b = res?.data;
  if (!b || typeof b !== "object") {
    return { payload: null, ocrDurationMs };
  }
  let payload = b.data !== undefined ? b.data : b;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    payload = stripOcrMetaFromPayload(payload);
  }
  return { payload, ocrDurationMs };
};

export const isReceiptExtractApiKeyError = (error) => {
  const status = error?.response?.status;
  if (status !== 400) return false;
  const d = error?.response?.data;
  const code = d?.code ?? d?.Code;
  if (code === "RECEIPT_AI_NOT_CONFIGURED") return true;
  const text = [d?.message, d?.Message, d?.errorMessage, d?.title, String(d || "")]
    .filter(Boolean)
    .join(" ");
  return /apikey|api.?key|yapılandır|yapilandir|groq|GroqReceiptVision|GROQ_API_KEY/i.test(
    text
  );
};

export const isReceiptExtractClientTimeout = (error) =>
  error?.code === "ECONNABORTED" ||
  error?.name === "CanceledError" ||
  /timeout of \d+ms exceeded/i.test(String(error?.message || ""));

export const isReceiptExtractRequestCancelled = (error) =>
  error?.code === "ERR_CANCELED";

export const getReceiptExtractErrorMessage = (error, expenseCopy) => {
  if (isReceiptExtractRequestCancelled(error)) return null;
  if (isReceiptExtractClientTimeout(error)) return null;
  const d = error?.response?.data;
  const code = d?.code ?? d?.Code;
  if (code && expenseCopy && typeof expenseCopy === "object") {
    const copyKey = RECEIPT_EXTRACT_ERROR_CODE_COPY_KEYS[code];
    if (copyKey && typeof expenseCopy[copyKey] === "string") {
      const t = expenseCopy[copyKey].trim();
      if (t) return t.slice(0, 400);
    }
  }
  if (typeof d === "string" && d.trim()) {
    return d.trim().slice(0, 300);
  }
  const msg = d?.message ?? d?.Message ?? d?.errorMessage ?? d?.title;
  if (typeof msg === "string" && msg.trim()) {
    return msg.trim().slice(0, 300);
  }
  return null;
};

const normalizeBase64ForJson = (value) => {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  if (!s) return "";
  const marker = "base64,";
  const idx = s.indexOf(marker);
  if (idx !== -1) return s.slice(idx + marker.length).trim();
  return s;
};

const postExtractJson = async (accessToken, raw, contentType, options = {}) => {
  const { signal, imageData } = options;
  const body = {
    ...(raw ? { image_base64: raw, imageBase64: raw } : {}),
    ...(contentType ? { content_type: contentType, contentType } : {}),
  };
  if (imageData != null && String(imageData).trim()) {
    const id = String(imageData).trim();
    body.imageData = id;
    body.image_data = id;
  }
  if (!body.image_base64 && !body.imageData) {
    throw new Error("missing_image");
  }
  const res = await axios.post(EXTRACT_URL, body, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    timeout: RECEIPT_EXTRACT_SINGLE_TIMEOUT_MS,
    signal,
  });
  return parseExtractSuccessResponse(res);
};

/**
 * Aynı endpoint’e multipart: alan adı `file` (varsayılan), `image` veya `receipt`
 * — `REACT_APP_RECEIPT_MULTIPART_FIELD` ile değiştirilebilir.
 */
const postExtractMultipart = async (accessToken, file, options = {}) => {
  const { signal, onPhase } = options;
  const field =
    String(process.env.REACT_APP_RECEIPT_MULTIPART_FIELD || "file")
      .trim()
      .toLowerCase() || "file";
  const allowed = ["file", "image", "receipt"];
  const formField = allowed.includes(field) ? field : "file";

  onPhase?.("preparing");
  const dataUrl = await convertFileToPngDataUrlForExtract(file);
  const blob = await (await fetch(dataUrl)).blob();

  const formData = new FormData();
  formData.append(formField, blob, "receipt.jpg");

  onPhase?.("scanning");
  const res = await axios.post(EXTRACT_URL, formData, {
    headers: {
      ...authHeaders(accessToken),
    },
    timeout: RECEIPT_EXTRACT_SINGLE_TIMEOUT_MS,
    signal,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return parseExtractSuccessResponse(res);
};

const blobToImageBase64ForExtract = async (file) => {
  const dataUrl = await convertFileToPngDataUrlForExtract(file);
  const raw = normalizeBase64ForJson(extractBase64FromDataUrl(dataUrl || ""));
  return { raw, contentType: "image/jpeg" };
};

/**
 * `true` ise dosya `multipart/form-data` ile gönderilir (`REACT_APP_RECEIPT_MULTIPART_FIELD`).
 * Varsayılan: JSON `imageBase64` / `image_base64` (çoğu ASP.NET [FromBody] ile uyumlu).
 */
const isReceiptExtractMultipartEnabled = () =>
  String(process.env.REACT_APP_RECEIPT_EXTRACT_MULTIPART || "")
    .toLowerCase()
    .trim() === "true";

/**
 * Fiş görüntüsü → `POST .../api/expense/receipt/extract`.
 *
 * @param {string} accessToken JWT
 * @param {object} input `{ file?: Blob, imageBase64?, imageData?, contentType?, signal?, onPhase? }`
 * @returns {Promise<{ payload, ocrDurationMs }>}
 */
export async function extractReceipt(accessToken, input = {}) {
  if (!accessToken) {
    throw new Error("missing_token");
  }

  let file;
  let imageBase64;
  let contentType;
  let signal;
  let onPhase;
  let imageDataOpt;

  if (input && typeof input === "object") {
    file = input.file;
    imageBase64 = input.imageBase64 ?? input.image_base64;
    contentType = input.contentType ?? input.content_type;
    signal = input.signal;
    onPhase = input.onPhase;
    imageDataOpt = input.imageData ?? input.image_data;
  }

  if (
    !imageDataOpt &&
    typeof imageBase64 === "string" &&
    /^data:/i.test(imageBase64.trim())
  ) {
    imageDataOpt = imageBase64.trim();
  }

  if (file instanceof Blob) {
    if (isReceiptExtractMultipartEnabled()) {
      return postExtractMultipart(accessToken, file, { signal, onPhase });
    }
    onPhase?.("preparing");
    const { raw, contentType: imgCt } = await blobToImageBase64ForExtract(file);
    if (!raw) {
      throw new Error("missing_image");
    }
    onPhase?.("scanning");
    return postExtractJson(accessToken, raw, contentType || imgCt, {
      signal,
      imageData: imageDataOpt,
    });
  }

  const raw = normalizeBase64ForJson(imageBase64);
  if (!raw && !(imageDataOpt && String(imageDataOpt).trim())) {
    throw new Error("missing_image");
  }
  onPhase?.("scanning");
  return postExtractJson(accessToken, raw, contentType, {
    signal,
    imageData: imageDataOpt,
  });
}

/**
 * @deprecated `extractReceipt` kullanın. Geriye dönük uyumluluk.
 */
export const postReceiptVisionSingle = (accessToken, arg2, arg3) => {
  if (typeof arg2 === "string" || arg2 == null) {
    return extractReceipt(accessToken, {
      imageBase64: arg2,
      contentType: arg3,
    });
  }
  return extractReceipt(accessToken, arg2);
};

/**
 * Ham base64 / data URL (dosya olmadan).
 */
export const postReceiptExtract = async (accessToken, arg2, arg3) => {
  if (!accessToken) {
    throw new Error("missing_token");
  }
  if (typeof arg2 === "string" || arg2 == null) {
    return extractReceipt(accessToken, {
      imageBase64: arg2,
      contentType: arg3,
    });
  }
  return extractReceipt(accessToken, arg2);
};

const normalizeBulkResultArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.receipts)) return raw.receipts;
  return [];
};

/**
 * Toplu: `POST .../api/expense/receipt/extract/bulk`
 */
export const postReceiptExtractBulk = async (accessToken, receipts, options = {}) => {
  if (!accessToken || !Array.isArray(receipts) || !receipts.length) {
    throw new Error("missing_token_or_receipts");
  }

  const { signal } = options;

  const body = {
    receipts: receipts.map((r) => {
      const raw = normalizeBase64ForJson(r?.imageBase64 ?? r?.image_base64);
      const ct = r?.contentType ?? r?.content_type;
      return {
        image_base64: raw,
        imageBase64: raw,
        ...(ct ? { content_type: ct, contentType: ct } : {}),
      };
    }),
  };

  const res = await axios.post(EXTRACT_BULK_URL, body, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    timeout: 180000,
    signal,
  });

  const ocrDurationMs = parseOcrDurationMsFromResponse(res);
  const b = res?.data;
  const inner = b?.data !== undefined ? b.data : b;
  const arr = normalizeBulkResultArray(inner);
  const results = arr.map((item) =>
    item && typeof item === "object" ? stripOcrMetaFromPayload(item) : item
  );

  return { results, ocrDurationMs };
};
