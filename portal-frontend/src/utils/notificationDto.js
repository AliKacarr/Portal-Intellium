/**
 * GET /api/Notifications/getnotifications yanıtı farklı şekillerde dönebildiği için
 * (data / Data / items / Items / doğrudan dizi) listeyi ve sayfalamayı güvenli çıkarır.
 * Backend PascalCase; UI camelCase bekler — normalizeNotificationItem ile birleştirilir.
 */

import { formatRequestDisplayCode8 } from "./requestDisplayCode";

const firstArray = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  const keys = ["data", "Data", "items", "Items", "result", "Result", "notifications", "Notifications"];
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  return null;
};

/**
 * Axios response'tan bildirim dizisini döndürür.
 */
export const parseNotificationsListFromResponse = (res) => {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];

  const nested = firstArray(body);
  if (nested) return nested;

  if (Array.isArray(body.data)) return body.data;
  return [];
};

/**
 * Tek bildirim kaydını UI için camelCase + type küçük harf ile uyumlu hale getirir.
 * expensereminder / ExpenseReminder vb. → type: expensereminder (routing için)
 */
export const normalizeNotificationItem = (raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const typeRaw = raw.type ?? raw.Type ?? "";
  const typeNormalized =
    typeof typeRaw === "string" ? typeRaw.trim().toLowerCase() : String(typeRaw || "").toLowerCase();

  return {
    ...raw,
    id: raw.id ?? raw.Id,
    type: typeNormalized || typeRaw,
    title: raw.title ?? raw.Title ?? "",
    content: raw.content ?? raw.Content ?? "",
    createdDate:
      raw.createdDate ??
      raw.CreatedDate ??
      raw.createdAt ??
      raw.CreatedAt,
    targetId:
      raw.targetId ??
      raw.TargetId ??
      raw.referenceId ??
      raw.ReferenceId ??
      raw.referenceID ??
      raw.ReferenceID ??
      null,
    referenceId:
      raw.referenceId ??
      raw.ReferenceId ??
      raw.referenceID ??
      raw.ReferenceID ??
      raw.ReferenceIdValue ??
      raw.targetId ??
      raw.TargetId ??
      null,
    navigationData: raw.navigationData ?? raw.NavigationData ?? null,
    isChecked: Boolean(raw.isChecked ?? raw.IsChecked),
  };
};

/**
 * Bildirim listesi sayfası için sayfalama alanları (backend değişken adları farklı olabilir).
 */
export const parseNotificationsPageMeta = (res) => {
  const body = res?.data;
  if (!body || typeof body !== "object") {
    return {
      pageNumber: 1,
      totalPages: 1,
    };
  }
  return {
    pageNumber: body.pageNumber ?? body.PageNumber ?? 1,
    totalPages: body.totalPages ?? body.TotalPages ?? 1,
    totalCount: body.totalCount ?? body.TotalCount,
    ...body,
  };
};

const includesAny = (text, needles = []) => {
  const t = String(text || "").toLowerCase();
  return needles.some((n) => t.includes(String(n).toLowerCase()));
};

/**
 * Masraf hatırlatma bildirimlerinde başlığı tek bir duruma indirger.
 * Amaç: "Bekleyen / revize ..." gibi birleşik başlıklar yerine,
 * ya "Revize talepleri var" ya da "Onay bekleyen masraflar var" göstermek.
 */
export const getNotificationDisplayTitle = (notification) => {
  const typeKey = String(notification?.type || "").trim().toLowerCase();
  const rawTitle = String(notification?.title || "").trim();
  // Yeni workflow bildirimleri: backend title zaten net.
  if (
    typeKey === "expense_revision_requested" ||
    typeKey === "expense_rejected" ||
    typeKey === "expense_approved"
  ) {
    return rawTitle;
  }
  if (typeKey !== "expensereminder" && typeKey !== "expensereminder_admin") {
    return rawTitle;
  }

  const content = String(notification?.content || "");
  const combined = `${rawTitle} ${content}`;

  const isRevision = includesAny(combined, [
    "revize",
    "revize edildi",
    "revize bekliyor",
    "revizyon",
  ]);
  const isPending = includesAny(combined, [
    "beklemede",
    "onay bekliyor",
    "onay bekleyen",
    "onay sürecinde",
  ]);

  if (isRevision && !isPending) return "Revize talepleri var";
  if (isPending && !isRevision) return "Onay bekleyen masraflar var";
  if (isRevision) return "Revize talepleri var";
  if (isPending) return "Onay bekleyen masraflar var";
  return rawTitle || "Masraf bildirimleri";
};

const extractRequestShort = (notification) => {
  const ref =
    notification?.referenceId ??
    notification?.ReferenceId ??
    notification?.referenceID ??
    notification?.ReferenceID ??
    notification?.requestId ??
    notification?.RequestId ??
    notification?.RequestID ??
    "";
  const refStr = String(ref || "").trim();
  if (refStr) return refStr.slice(-6);

  const combined = `${notification?.title || ""} ${notification?.content || ""}`;
  // Örn: "Talep ...105040" veya "Talep 105040"
  const m = String(combined).match(/talep\\s*(?:\\.\\.\\.)?\\s*([a-z0-9_-]{4,})/i);
  if (m?.[1]) return String(m[1]).slice(-6);
  return "";
};

export const getNotificationDisplayRequestCode8 = (notification) =>
  formatRequestDisplayCode8(notification?.referenceId ?? notification?.ReferenceId);

const extractUserName = (notification) => {
  const combined = `${notification?.title || ""} ${notification?.content || ""}`;
  // Backend önerisi: "Kullanıcı: Ahmet Yılmaz" veya "Talep eden: Ahmet Yılmaz"
  const m = String(combined).match(/(?:kullanıcı|talep eden)\\s*[:\\-]\\s*([^\\n\\r·|]+?)(?:\\s{2,}|\\s+talep\\b|$)/i);
  return m?.[1] ? String(m[1]).trim() : "";
};

/**
 * Masraf hatırlatma bildirimlerinde içerik tek satır, kısa ve ayırt edici olsun.
 * Örn: \"Revize edildi · Talep …105040 · Turgut Özç.\" gibi.
 */
export const getNotificationDisplayBody = (notification) => {
  const typeKey = String(notification?.type || "").trim().toLowerCase();
  const rawContent = String(notification?.content || "").trim();
  // Yeni workflow bildirimleri: backend content formatı yeterli (Talep …123456 · Neden/Toplam).
  if (
    typeKey === "expense_revision_requested" ||
    typeKey === "expense_rejected" ||
    typeKey === "expense_approved"
  ) {
    return rawContent;
  }
  if (typeKey !== "expensereminder" && typeKey !== "expensereminder_admin") {
    return rawContent;
  }

  const title = getNotificationDisplayTitle(notification);
  const isRevision = title.toLowerCase().includes("revize");
  const requestShort = extractRequestShort(notification);
  const userName = extractUserName(notification);

  const parts = [
    isRevision ? "Revize edildi" : "Onay bekliyor",
    requestShort ? `Talep …${requestShort}` : null,
    userName || null,
  ].filter(Boolean);

  return parts.join(" · ");
};
