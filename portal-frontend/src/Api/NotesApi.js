import axios from "axios";
import { host } from "./host";

/**
 * Notlar API – tüm isteklerde Authorization: Bearer <accessToken> kullanılmalı.
 * Token Notes.jsx içinde Redux'tan alınıp her çağrıda verilir.
 */

function getAuthHeaders(accessToken) {
  return accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

/**
 * Kullanıcının tüm notlarını getirir. Not yoksa backend [] döner.
 * @param {string} accessToken
 * @param {{ search?: string, sortBy?: string, order?: string }} [options]
 *   - search: arama metni
 *   - sortBy: updatedAt | createdAt | title | contentLength
 *   - order: asc | desc
 * @returns {Promise<Array|any>} Note listesi veya backend cevabı (data ile)
 */
export function getNotes(accessToken, options = {}) {
  const params = {};
  if (options.search && String(options.search).trim()) {
    params.search = String(options.search).trim();
  }
  const sortBy = options.sortBy && ["updatedAt", "createdAt", "title", "contentLength"].includes(options.sortBy)
    ? options.sortBy
    : "updatedAt";
  const order = options.order === "asc" || options.order === "desc" ? options.order : "desc";
  params.sortBy = sortBy;
  params.order = order;
  return axios
    .get(`${host}/api/notes`, {
      headers: getAuthHeaders(accessToken),
      params,
    })
    .then((res) => res.data);
}

/**
 * Çöp kutusundaki (silinmiş) notları getirir.
 * GET /api/notes/deleted?sortBy=updatedAt&order=desc
 * @param {string} accessToken
 * @param {{ sortBy?: string, order?: string }} [options]
 * @returns {Promise<Array|any>}
 */
export function getDeletedNotes(accessToken, options = {}) {
  const sortBy = options.sortBy && ["updatedAt", "createdAt", "title", "contentLength"].includes(options.sortBy)
    ? options.sortBy
    : "updatedAt";
  const order = options.order === "asc" || options.order === "desc" ? options.order : "desc";
  return axios
    .get(`${host}/api/notes/deleted`, {
      headers: getAuthHeaders(accessToken),
      params: { sortBy, order },
    })
    .then((res) => res.data);
}

/**
 * Notu sabitler / sabitlemeyi kaldırır.
 * @param {string} accessToken
 * @param {string} id - Not id
 * @param {boolean} isPinned
 * @returns {Promise<any>}
 */
export function pinNote(accessToken, id, isPinned) {
  return axios
    .patch(`${host}/api/notes/${id}/pin`, null, {
      headers: getAuthHeaders(accessToken),
      params: { isPinned: !!isPinned },
    })
    .then((res) => res.data);
}

/**
 * Tek not getirir. id Guid string olmalı.
 * @param {string} accessToken
 * @param {string} id - Not id (Guid)
 * @returns {Promise<Object>}
 */
export function getNote(accessToken, id) {
  return axios
    .get(`${host}/api/notes/${id}`, { headers: getAuthHeaders(accessToken) })
    .then((res) => res.data);
}

/**
 * Yeni not oluşturur. Body'de folderIds dizisi kabul edilir.
 * @param {string} accessToken
 * @param {Object} payload - { title?, folderId?, folderIds?, folderPath?, tagIds?, content?, isFavorite?, isDeleted? }
 * @returns {Promise<Object>} Oluşturulan not
 */
export function createNote(accessToken, payload = {}) {
  const folderIds = Array.isArray(payload.folderIds)
    ? payload.folderIds
    : payload.folderId != null
      ? [payload.folderId]
      : [];
  const body = {
    title: payload.title ?? "",
    folderId: payload.folderId ?? folderIds[0] ?? null,
    folderIds,
    folderPath: payload.folderPath ?? "",
    tagIds: Array.isArray(payload.tagIds) ? payload.tagIds : [],
    content: payload.content ?? "",
    isFavorite: !!payload.isFavorite,
    isDeleted: !!payload.isDeleted,
  };
  return axios
    .post(`${host}/api/notes`, body, {
      headers: { ...getAuthHeaders(accessToken), "Content-Type": "application/json" },
    })
    .then((res) => res.data);
}

/**
 * Notu günceller.
 * @param {string} accessToken
 * @param {string} id - Not id
 * @param {Object} payload - Kısmi veya tam alanlar
 * @returns {Promise<Object>} Güncellenmiş not
 */
export function updateNote(accessToken, id, payload) {
  return axios
    .put(`${host}/api/notes/${id}`, payload, {
      headers: { ...getAuthHeaders(accessToken), "Content-Type": "application/json" },
    })
    .then((res) => res.data);
}

/**
 * Not hatırlatıcısını ayarlar/kaldırır.
 * PATCH /api/notes/:id/reminder body: { reminderAt: ISO-8601 string | null }
 * @param {string} accessToken
 * @param {string} id - Not id
 * @param {string|null} reminderAtIso - Örn: 2026-05-11T11:38:00+03:00, null => kaldır
 */
export function setNoteReminder(accessToken, id, reminderAtIso) {
  return axios
    .patch(
      `${host}/api/notes/${encodeURIComponent(id)}/reminder`,
      { reminderAt: reminderAtIso ?? null },
      {
        headers: { ...getAuthHeaders(accessToken), "Content-Type": "application/json" },
      }
    )
    .then((res) => res.data);
}

/**
 * Nota hatırlatıcı ekler (çoklu).
 * POST /api/notes/:id/reminders body: { reminderAt: ISO-8601 string }
 */
export function addNoteReminder(accessToken, id, reminderAtIso) {
  return axios
    .post(
      `${host}/api/notes/${encodeURIComponent(id)}/reminders`,
      { reminderAt: reminderAtIso },
      { headers: { ...getAuthHeaders(accessToken), "Content-Type": "application/json" } }
    )
    .then((res) => res.data);
}

/**
 * Not hatırlatıcısını siler.
 * DELETE /api/notes/:id/reminders/:reminderId
 */
export function deleteNoteReminder(accessToken, noteId, reminderId) {
  return axios.delete(
    `${host}/api/notes/${encodeURIComponent(noteId)}/reminders/${encodeURIComponent(reminderId)}`,
    { headers: getAuthHeaders(accessToken) }
  );
}

/**
 * Notu soft delete yapar (backend 204 döner). Frontend state'te isDeleted: true yapılır.
 * @param {string} accessToken
 * @param {string} id - Not id (Guid)
 * @returns {Promise<void>}
 */
export function deleteNote(accessToken, id) {
  return axios.delete(`${host}/api/notes/${id}`, {
    headers: getAuthHeaders(accessToken),
  });
}

/**
 * Notu kalıcı olarak siler.
 * Backend implementasyon farkları için birden fazla endpoint sırasıyla denenir.
 * @param {string} accessToken
 * @param {string} id - Not id (Guid)
 * @returns {Promise<any>}
 */
export async function permanentlyDeleteNote(accessToken, id) {
  const encodedId = encodeURIComponent(id);
  const headers = getAuthHeaders(accessToken);
  const candidates = [
    `${host}/api/notes/${encodedId}/permanent`,
    `${host}/api/notes/${encodedId}/hard-delete`,
    `${host}/api/notes/${encodedId}?permanent=true`,
    `${host}/api/notes/delete?id=${encodedId}`,
    `${host}/api/notes/${encodedId}`,
  ];

  let lastError = null;

  for (const url of candidates) {
    try {
      return await axios.delete(url, { headers });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Permanent delete endpoint not found");
}

/**
 * Nota etiket ekler. Body yok.
 * POST /api/notes/:noteId/tags/:tagId
 * @param {string} accessToken
 * @param {string} noteId - Not id (Guid)
 * @param {string} tagId - Etiket id
 * @returns {Promise<any>}
 */
export function addTagToNote(accessToken, noteId, tagId) {
  const nid = encodeURIComponent(noteId);
  const tid = encodeURIComponent(tagId);
  return axios.post(
    `${host}/api/notes/${nid}/tags/${tid}`,
    {},
    {
      headers: {
        ...getAuthHeaders(accessToken),
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Nottan etiket kaldırır.
 * DELETE /api/notes/:noteId/tags/:tagId
 * @param {string} accessToken
 * @param {string} noteId - Not id (Guid)
 * @param {string} tagId - Etiket id
 * @returns {Promise<void>}
 */
export function removeTagFromNote(accessToken, noteId, tagId) {
  const nid = encodeURIComponent(noteId);
  const tid = encodeURIComponent(tagId);
  return axios.delete(`${host}/api/notes/${nid}/tags/${tid}`, {
    headers: getAuthHeaders(accessToken),
  });
}

/**
 * Nota klasör ekler. N:N (FolderNotes). POST /api/notes/:id/folders/:folderId
 */
export function addFolderToNote(accessToken, noteId, folderId) {
  const nid = encodeURIComponent(noteId);
  const fid = encodeURIComponent(folderId);
  return axios.post(
    `${host}/api/notes/${nid}/folders/${fid}`,
    {},
    { headers: { ...getAuthHeaders(accessToken), "Content-Type": "application/json" } }
  ).then((res) => res.data);
}

/**
 * Nottan klasör kaldırır. DELETE /api/notes/:id/folders/:folderId
 */
export function removeFolderFromNote(accessToken, noteId, folderId) {
  const nid = encodeURIComponent(noteId);
  const fid = encodeURIComponent(folderId);
  return axios.delete(`${host}/api/notes/${nid}/folders/${fid}`, {
    headers: getAuthHeaders(accessToken),
  });
}

/**
 * Notu tüm klasörlerden çıkarır (root’a alır). Başarıda NoteDto döner.
 * DELETE /api/notes/:noteId/folder — fallback: DELETE /api/notes/:noteId/folders
 */
export async function removeNoteFromFolder(accessToken, noteId) {
  const nid = encodeURIComponent(noteId);
  const headers = getAuthHeaders(accessToken);
  const candidates = [
    `${host}/api/notes/${nid}/folder`,
    `${host}/api/notes/${nid}/folders`,
  ];
  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await axios.delete(url, { headers });
      return res?.data ?? {};
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  if (lastError) throw lastError;
  return {};
}

/**
 * Klasörü siler; backend notları root’a alır.
 * Tek istek: DELETE /api/folders/delete?title={folderTitle}
 */
export function deleteFolder(accessToken, folderTitle) {
  const encoded = encodeURIComponent(folderTitle);
  const url = `${host}/api/folders/delete?title=${encoded}`;
  return axios.delete(url, { headers: getAuthHeaders(accessToken) });
}

/**
 * Notun eklerini listeler. Backend bu endpoint'i sunmuyorsa sahte: boş dizi döner.
 * GET /api/notes/:id/attachments
 */
export function getNoteAttachments(accessToken, noteId) {
  return Promise.resolve([]);
}

/**
 * Nota ek ekler. Backend sunmuyorsa no-op (başarılı döner, ek eklenmez).
 * POST /api/notes/:id/attachments Body: { title, urlOrPath }
 */
export function addNoteAttachment(accessToken, noteId, payload) {
  return Promise.resolve();
}

/**
 * Not eki siler. Backend sunmuyorsa no-op.
 * DELETE /api/notes/:id/attachments/:attachmentId
 */
export function deleteNoteAttachment(accessToken, noteId, attachmentId) {
  return Promise.resolve();
}

/**
 * Notu kullanıcıyla paylaşır.
 * POST /api/notes/:id/share
 * Body: { userId, readOnly } – .NET için UserId, ReadOnly de gönderilir.
 */
export function shareNote(accessToken, noteId, payload) {
  const body = {
    userId: payload.userId,
    readOnly: !!payload.readOnly,
    UserId: payload.userId,
    ReadOnly: !!payload.readOnly,
  };
  return axios
    .post(`${host}/api/notes/${noteId}/share`, body, {
      headers: { ...getAuthHeaders(accessToken), "Content-Type": "application/json" },
    })
    .then((res) => res.data);
}

/**
 * Notun paylaşım listesini getirir. GET /api/notes/:noteId/shares
 * @returns {Promise<Array>} [{ userId, userName, userEmail, readOnly }, ...]
 */
export function patchNoteShare(accessToken, noteId, userId, payload) {
  const nid = encodeURIComponent(noteId);
  const uid = encodeURIComponent(userId);
  const body = { readOnly: !!payload.readOnly, ReadOnly: !!payload.readOnly };
  return axios.patch(`${host}/api/notes/${nid}/share/${uid}`, body, {
    headers: { ...getAuthHeaders(accessToken), "Content-Type": "application/json" },
  }).then((res) => res.data);
}

/**
 * Paylaşımı kaldırır. DELETE /api/notes/:id/share/:targetUserId
 */
export function unshareNote(accessToken, noteId, targetUserId) {
  const nid = encodeURIComponent(noteId);
  const uid = encodeURIComponent(targetUserId);
  return axios.delete(`${host}/api/notes/${nid}/share/${uid}`, {
    headers: getAuthHeaders(accessToken),
  });
}

function extractShareList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.sharedUsers)) return data.sharedUsers;
  if (Array.isArray(data?.shareUsers)) return data.shareUsers;
  if (Array.isArray(data?.shares)) return data.shares;
  return [];
}

/**
 * Notun paylaşım listesini getirir.
 * Farklı backend implementasyonları için birden fazla endpoint denenir.
 */
export async function getNoteShares(accessToken, noteId) {
  const nid = encodeURIComponent(noteId);
  const headers = getAuthHeaders(accessToken);
  const candidates = [
    `${host}/api/notes/${nid}/share`,
    `${host}/api/notes/${nid}/shares`,
    `${host}/api/notes/${nid}/shared-users`,
    `${host}/api/notes/${nid}`,
  ];

  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await axios.get(url, { headers });
      const list = extractShareList(res?.data);
      if (Array.isArray(list)) return list;
      return [];
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  if (lastError) throw lastError;
  return [];
}

/**
 * Benimle paylaşılan notları getirir. GET /api/notes/shared
 */
export function getSharedNotes(accessToken) {
  return axios
    .get(`${host}/api/notes/shared`, { headers: getAuthHeaders(accessToken) })
    .then((res) => res.data);
}

/**
 * Benim paylaştığım notları getirir (paylaşan kullanıcı için).
 * GET /api/notes/shared-by-me veya GET /api/notes/shared/owned
 * Backend yoksa boş dizi döner.
 */
export async function getSharedNotesByMe(accessToken) {
  const headers = getAuthHeaders(accessToken);
  const candidates = [
    `${host}/api/notes/shared-by-me`,
    `${host}/api/notes/shared/owned`,
  ];
  for (const url of candidates) {
    try {
      const res = await axios.get(url, { headers });
      const data = res?.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.items)) return data.items;
      return [];
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 405) continue;
      throw err;
    }
  }
  return [];
}

/**
 * Notu dışa aktarır (PDF veya TXT); dosyayı indirir.
 * @param {string} accessToken
 * @param {string} id - Not id
 * @param {"pdf"|"txt"} format
 * @param {string} filename - İndirilecek dosya adı (opsiyonel)
 */
export function exportNote(accessToken, id, format, filename) {
  const url = `${host}/api/notes/${id}/export?format=${format}`;
  return axios
    .get(url, {
      headers: getAuthHeaders(accessToken),
      responseType: "blob",
    })
    .then((res) => {
      const blob = res.data;
      const name = filename || `not-${id}.${format}`;
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = name;
      link.click();
      window.URL.revokeObjectURL(link.href);
    });
}

/**
 * Not paylaşımları için sistemdeki tüm kullanıcıları getirir. GET /api/users/getuserlist
 */
export function getSystemUsers(accessToken) {
  // worker-outsource/user rolünde bu endpoint yetkisiz olabiliyor; console'da 401/403 kirletmesin.
  // Paylaşım ekranı kullanıcı listesi olmadan da açılabilsin.
  if (!accessToken) return Promise.resolve([]);
  return axios
    .get(`${host}/api/users/getuserlist`, { headers: getAuthHeaders(accessToken) })
    .then((res) => res.data)
    .catch((err) => {
      const status = err?.response?.status;
      if (status === 401 || status === 403) return [];
      throw err;
    });
}

/**
 * Kullanıcının klasörlerini getirir. GET /api/folders
 */
export function getFolders(accessToken) {
  if (!accessToken) return Promise.resolve([]);
  return axios
    .get(`${host}/api/folders`, { headers: getAuthHeaders(accessToken) })
    .then((res) => res.data);
}

/**
 * Yeni klasör oluşturur. POST /api/folders
 */
export function createFolder(accessToken, title) {
  return axios
    .post(
      `${host}/api/folders`,
      { title },
      {
        headers: { ...getAuthHeaders(accessToken), "Content-Type": "application/json" },
      }
    )
    .then((res) => res.data);
}
