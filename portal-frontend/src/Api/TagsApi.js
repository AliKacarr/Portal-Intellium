import axios from "axios";
import { host } from "./host";

function getAuthHeaders(accessToken) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

/**
 * Backend'deki tüm etiketleri getirir.
 * POST/DELETE note-tag için kullanılacak tag id (Guid) veya title bu listeden gelmeli.
 * GET /api/Tags/getAll
 * @param {string} accessToken
 * @returns {Promise<Array>} [{ id, title }] veya [{ id, name }]
 */
export function getTags(accessToken) {
  return axios
    .get(`${host}/api/Tags/getAll`, { headers: getAuthHeaders(accessToken) })
    .then((res) => res.data);
}

/**
 * Etiketi kalıcı siler.
 * DELETE /api/Tags/{tagId}?permanent=true
 * @param {string} accessToken
 * @param {string} tagId
 * @returns {Promise<void>}
 */
export function deleteTag(accessToken, tagId) {
  const encodedId = encodeURIComponent(tagId);
  return axios.delete(`${host}/api/Tags/${encodedId}?permanent=true`, {
    headers: getAuthHeaders(accessToken),
  });
}

/**
 * Yeni etiket oluşturur.
 * POST /api/tags/create (veya /api/Tags/create) body: { title, colorCode }.
 * @param {string} accessToken
 * @param {string} title
 * @param {string} [colorCode] - Hex renk (örn. "#3B82F6"); yoksa varsayılan kullanılır
 * @returns {Promise<any>}
 */
export async function createTag(accessToken, title, colorCode) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) {
    throw new Error("Tag title is required");
  }

  const normalizedColor =
    colorCode && String(colorCode).trim() ? String(colorCode).trim() : "#3b82f6";

  const headers = {
    ...getAuthHeaders(accessToken),
    "Content-Type": "application/json",
  };

  const bodyWithColor = {
    title: normalizedTitle,
    colorCode: normalizedColor,
    Title: normalizedTitle,
    ColorCode: normalizedColor,
  };

  const primaryCandidates = [
    { url: `${host}/api/Tags/create`, body: bodyWithColor },
    { url: `${host}/api/tags/create`, body: bodyWithColor },
    { url: `${host}/api/Tags/create`, body: { Title: normalizedTitle, ColorCode: normalizedColor } },
    { url: `${host}/api/Tags/add`, body: bodyWithColor },
    { url: `${host}/api/Tags`, body: bodyWithColor },
  ];

  let lastError = null;
  const attempts = [];

  for (const { url, body } of primaryCandidates) {
    if (!body || typeof body !== "object") continue;
    try {
      const response = await axios.post(url, body, { headers });
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      lastError = error;
      attempts.push({ url, status: status ?? "network", data });

      if (status === 401 || status === 403 || status === 409) {
        throw error;
      }
      if (status === 400) {
        // Backend validation/body hatası; mesajı sakla, sonra fırlatırken gösteririz
        lastError.responseData = data;
        continue;
      }
      if (status === 404 || status === 405) {
        continue;
      }
      throw error;
    }
  }

  if (lastError) {
    const msg =
      lastError.response?.status === 400 && lastError.responseData
        ? typeof lastError.responseData === "string"
          ? lastError.responseData
          : lastError.responseData?.message ||
            lastError.responseData?.title ||
            lastError.responseData?.errors?.join?.(", ") ||
            JSON.stringify(lastError.responseData)
        : "Etiket oluşturulamadı. Backend 400 döndü.";
    const err = new Error(msg);
    err.attempts = attempts;
    err.status = lastError.response?.status;
    err.responseData = lastError.responseData;
    throw err;
  }

  const fallbackError = new Error("Etiket oluşturma endpoint'i bulunamadı veya 400 döndü.");
  fallbackError.attempts = attempts;
  throw fallbackError;
}
