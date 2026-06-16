import { useEffect, useState } from "react";
import moment from "moment";
import "moment/locale/tr";

export function resolveMomentLocale(intlLocale) {
  const loc = String(intlLocale || "").toLowerCase();
  return loc.startsWith("tr") ? "tr" : "en-gb";
}

export function applyMomentLocale(intlLocale) {
  moment.locale(resolveMomentLocale(intlLocale));
}

/**
 * API bildirim tarihleri: yeni kayıtlar ISO-8601 + Z; eski kayıtlar timezone içermeyebilir.
 * Z/offset yoksa UTC kabul edilir (sunucu CreatedDate = UtcNow).
 */
export function notificationFromNow(value, intlLocale) {
  if (intlLocale) applyMomentLocale(intlLocale);
  if (value == null || value === "") return "";
  const s = String(value).trim();
  if (!s) return "";
  const hasTz = /Z$/i.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
  const m = hasTz ? moment(s) : moment.utc(s).local();
  return m.isValid() ? m.fromNow() : "";
}

export function notificationTooltipTime(value, intlLocale) {
  if (intlLocale) applyMomentLocale(intlLocale);
  if (value == null || value === "") return "";
  const s = String(value).trim();
  if (!s) return "";
  const hasTz = /Z$/i.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
  const m = hasTz ? moment(s) : moment.utc(s).local();
  return m.isValid() ? m.format("DD.MM.YYYY HH:mm") : "";
}

/** Göreli zaman metninin (ör. "5 dakika önce") periyodik yenilenmesi */
export function useNotificationTimeRefresh(intervalMs = 30000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}

/**
 * @param {object} n — bildirim: type, targetId, navigationData, referenceId (eski)
 */
function includesAny(text, needles = []) {
  const t = String(text || "").toLowerCase();
  return needles.some((needle) => t.includes(String(needle).toLowerCase()));
}

export function getNotificationTargetPath(n) {
  if (!n) return "/dashboard/notification";
  const type = (n.type || "").trim().toLowerCase();
  const targetId = String(n.targetId ?? n.referenceId ?? "").trim();
  const title = String(n.title ?? "").trim();
  const content = String(n.content ?? "").trim();
  const combined = `${title} ${content}`;

  let extra = {};
  try {
    if (n.navigationData && typeof n.navigationData === "string") {
      extra = JSON.parse(n.navigationData);
    } else if (n.navigationData && typeof n.navigationData === "object") {
      extra = n.navigationData;
    }
  } catch {
    extra = {};
  }

  if (extra.path && String(extra.path).startsWith("/dashboard")) {
    return String(extra.path);
  }

  switch (type) {
    case "news":
    case "news_comment":
      return targetId ? `/dashboard/news/${targetId}` : "/dashboard/news";
    case "announcement":
      return targetId ? `/dashboard/announcements/${targetId}` : "/dashboard/announcements";
    case "poll":
      return targetId ? `/dashboard/polls/${targetId}` : "/dashboard/polls";
    case "ticket":
      return targetId ? `/dashboard/ticketDetail/${targetId}` : "/dashboard/tickets";
    case "project":
      return targetId ? `/dashboard/projectDetail/${targetId}` : "/dashboard/projectList";
    case "permission":
      if (includesAny(combined, ["başvuru"])) return "/dashboard/approvalProcess";
      return "/dashboard/my-requests";
    case "debit":
      if (includesAny(combined, ["yeni zimmet talebi"])) return "/dashboard/incoming-requests";
      return "/dashboard/my-assets-requests";
    case "scrumtask":
    case "aitaskpreview":
      return targetId ? `/dashboard/scrum-board/board/${targetId}` : "/dashboard/scrum-board";
    case "request_created_admin":
      return "/dashboard/requests/admin";
    case "request_status_changed":
      return targetId ? `/dashboard/requests/${encodeURIComponent(targetId)}` : "/dashboard/requests";
    case "note_reminder":
      return targetId ? `/dashboard/notes?noteId=${encodeURIComponent(targetId)}` : "/dashboard/notes";
    case "time":
      return "/dashboard/holidays";
    case "birthday":
      return "/dashboard/my-profile";
    case "health":
    case "insurance":
      return "/dashboard/healthInfo";
    case "military":
      return "/dashboard/personalInfo";
    case "expense_revision_requested":
    case "expense_approved":
    case "expense_rejected":
    case "expensereminder":
    case "expense":
    case "expenserequest":
      return targetId
        ? `/dashboard/my-expenses?requestId=${encodeURIComponent(targetId)}`
        : "/dashboard/my-expenses";
    case "expensereminder_admin":
      return targetId
        ? `/dashboard/approvalProcess?requestId=${encodeURIComponent(targetId)}`
        : "/dashboard/approvalProcess";
    default:
      if (extra.projectId) return `/dashboard/projectDetail/${extra.projectId}`;
      if (extra.newsId) return `/dashboard/news/${extra.newsId}`;
      if (extra.announcementId) return `/dashboard/announcements/${extra.announcementId}`;
      if (extra.pollId) return `/dashboard/polls/${extra.pollId}`;
      if (extra.requestId) return `/dashboard/requests/${encodeURIComponent(extra.requestId)}`;
      return "/dashboard/notification";
  }
}
