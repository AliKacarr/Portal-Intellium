import axios from "axios";
import SecureLS from "secure-ls";
import { host } from "./host";

const ls = new SecureLS({ encodingType: "aes" });

function getStoredAccessToken() {
  try {
    const t = ls.get("accessToken");
    if (typeof t === "string" && t.trim()) return t.trim();
  } catch {
    /* ignore */
  }
  const t2 = localStorage.getItem("token") || localStorage.getItem("accessToken");
  return typeof t2 === "string" && t2.trim() ? t2.trim() : null;
}

function looksLikeJwt(token) {
  if (typeof token !== "string") return false;
  const t = token.trim();
  return t.length > 20 && t.split(".").length >= 3;
}

/** @param {string | null | undefined} explicitToken Redux veya çağıranın verdiği token (öncelikli). */
function authHeaders(explicitToken) {
  const token =
    typeof explicitToken === "string" && explicitToken.trim()
      ? explicitToken.trim()
      : getStoredAccessToken();
  if (!looksLikeJwt(token)) return {};
  return { Authorization: `Bearer ${token}` };
}

export const getNotificationsByUser = async (pageNumber, pageSize, accessToken) => {
  const headers = authHeaders(accessToken);
  if (!headers.Authorization) {
    return { data: { data: [], totalCount: 0, pageNumber, pageSize } };
  }
  try {
    const response = await axios.get(
      `${host}/api/Notifications/getnotifications?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      { headers }
    );
    return response;
  } catch (err) {
    const status = err.response?.status;
    if (status === 400 || status === 404 || status === 401 || status === 403) {
      return { data: { data: [] } };
    }
    throw err;
  }
};

export const MarkAsReadNotification = (notificationId, accessToken) => {
  const headers = authHeaders(accessToken);
  if (!headers.Authorization) {
    return Promise.reject({ response: { status: 401, data: { message: "Token gerekli" } } });
  }
  return axios.patch(
    `${host}/api/Notifications/markasread?notificationId=${notificationId}`,
    null,
    { headers }
  );
};

/**
 * Tek bildirim sil (backend: notificationId query).
 */
export const deleteNotification = (notificationId, accessToken) => {
  const headers = authHeaders(accessToken);
  if (!headers.Authorization) {
    return Promise.reject({ response: { status: 401, data: { message: "Token gerekli" } } });
  }
  return axios.delete(
    `${host}/api/Notifications/deletenotification?notificationId=${encodeURIComponent(
      notificationId
    )}`,
    { headers }
  );
};

/** Eski haber dalı uyumluluğu: `id` query ile silme */
export const DeleteNotification = (id, accessToken) => {
  const headers = authHeaders(accessToken);
  if (!headers.Authorization) {
    return Promise.reject({ response: { status: 401, data: { message: "Token gerekli" } } });
  }
  return axios.delete(
    `${host}/api/Notifications/deletenotification?id=${encodeURIComponent(id)}`,
    { headers }
  );
};

/**
 * Oturumdaki kullanıcıya ait tüm bildirimleri sil.
 */
export const deleteAllNotifications = (accessToken) => {
  const headers = authHeaders(accessToken);
  if (!headers.Authorization) {
    return Promise.reject({ response: { status: 401, data: { message: "Token gerekli" } } });
  }
  return axios.delete(`${host}/api/Notifications/deleteall`, { headers });
};

export const DeleteAllNotifications = (accessToken) => deleteAllNotifications(accessToken);

export const SendNotificationToAllUsers = (data, accessToken) => {
  const headers = authHeaders(accessToken);
  return axios.post(`${host}/api/Notifications/sendallusers`, data, {
    headers: { ...headers, "Content-Type": "application/json" },
  });
};

export const SendNotificationByRoleId = (data, accessToken) => {
  const headers = authHeaders(accessToken);
  return axios.post(`${host}/api/Notifications/sendallbyroleid`, data, {
    headers: { ...headers, "Content-Type": "application/json" },
  });
};
