import { tagPalette } from "./notesInitialData";

function toDateLocale(locale) {
  return String(locale || "").toLowerCase().startsWith("en") ? "en-US" : "tr-TR";
}

export function normalizeId(value) {
  if (value == null || value === "") return null;
  const normalized = String(value).trim();
  return normalized || null;
}

export function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function resolveRawUpdatedAt(note) {
  return (
    note.updatedAt ??
    note.UpdatedAt ??
    note.updatedDate ??
    note.UpdatedDate ??
    note.modifiedAt ??
    note.ModifiedAt ??
    note.lastModifiedAt ??
    note.LastModifiedAt ??
    note.createdAt ??
    note.CreatedAt ??
    null
  );
}

function resolveRawCreatedAt(note) {
  return (
    note.createdAt ??
    note.CreatedAt ??
    note.createdDate ??
    note.CreatedDate ??
    null
  );
}

/** API'den gelen ISO tarihi UTC kabul eder (Z yoksa ekler); böylece GET/PUT aynı saati gösterir. */
function parseDateAsUtc(value) {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const s = typeof value === "string" ? value.trim() : String(value);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !s.endsWith("Z") && !/[+-]\d{1,2}:?\d{2}$/.test(s)) {
    return new Date(s + "Z");
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatNoteDate(value, locale = "tr") {
  const parsed = parseDateAsUtc(value);
  if (parsed == null) return "";
  const dateLocale = toDateLocale(locale);
  return new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function normalizeTagIds(note) {
  if (Array.isArray(note.tagIds)) return note.tagIds;
  if (Array.isArray(note.TagIds)) return note.TagIds;
  if (Array.isArray(note.tags)) {
    return (note.tags || [])
      .map((tag) => tag?.id ?? tag?.Id)
      .filter((id) => id != null && id !== "");
  }
  return [];
}

export function getNoteFolderIds(note) {
  const rawFolderIds = Array.isArray(note?.folderIds)
    ? note.folderIds
    : Array.isArray(note?.FolderIds)
    ? note.FolderIds
    : [];
  const rawFolderId = note?.folderId ?? note?.FolderId ?? null;
  const folderIdsRaw =
    rawFolderIds.length > 0
      ? rawFolderIds
      : rawFolderId != null
      ? [rawFolderId]
      : [];

  return [...new Set(folderIdsRaw.map(normalizeId).filter(Boolean))];
}

export function getPrimaryNoteFolderId(note) {
  return (
    normalizeId(note?.folderId ?? note?.FolderId ?? null) ||
    getNoteFolderIds(note)[0] ||
    null
  );
}

export function normalizeNotesList(rawList = [], locale = "tr") {
  return rawList.map((note) => {
    const tagIds = normalizeTagIds(note);
    const folderIds = getNoteFolderIds(note);
    const folderId = getPrimaryNoteFolderId(note);

    const isDeleted =
      !!note.isDeleted ||
      !!note.IsDeleted ||
      !!(note.deletedAt != null && note.deletedAt !== "");

    const rawUpdated = resolveRawUpdatedAt(note);
    const rawCreated = resolveRawCreatedAt(note);
    return {
      ...note,
      tagIds,
      folderIds,
      folderId,
      updatedAt: formatNoteDate(rawUpdated, locale),
      updatedAtRaw: rawUpdated,
      createdAt: formatNoteDate(rawCreated, locale),
      createdAtRaw: rawCreated,
      isFavorite: !!note.isFavorite || !!note.IsFavorite,
      isPinned: !!note.isPinned || !!note.IsPinned,
      isDeleted,
    };
  });
}

export function mergeFoldersFromNotes(prevFolders = [], notesList = []) {
  const seen = new Set(
    prevFolders.map((folder) => normalizeId(folder.id) || "")
  );

  const fromNotes = [];
  notesList.forEach((note) => {
    const folderId = getPrimaryNoteFolderId(note);

    if (!folderId || seen.has(folderId)) return;

    seen.add(folderId);
    fromNotes.push({
      id: folderId,
      title:
        note.folderPath != null && note.folderPath !== ""
          ? note.folderPath
          : folderId,
    });
  });

  return fromNotes.length > 0 ? [...prevFolders, ...fromNotes] : prevFolders;
}

function isValidTagColor(c) {
  if (!c || typeof c !== "string") return false;
  const s = c.trim().toLowerCase();
  if (s === "" || s === "#000" || s === "#000000" || s.startsWith("rgb(0,0,0")) return false;
  return true;
}

export function mergeTagsFromApi(tagsData, notesList = []) {
  const rawTags = extractList(tagsData);
  const apiTags = rawTags
    .map((tag, index) => {
      const id = tag.id ?? tag.Id;
      const rawColor =
        tag.color ?? tag.Color ?? tag.colorCode ?? tag.ColorCode;
      const color = isValidTagColor(rawColor)
        ? String(rawColor).trim()
        : tagPalette[index % tagPalette.length];
      return {
        id,
        name:
          tag.title ||
          tag.Title ||
          tag.name ||
          tag.Name ||
          String(id),
        color,
      };
    })
    .filter((tag) => tag.id != null && tag.id !== "");

  return apiTags;
}

/**
 * Not için görüntülenecek etiket listesini döndürür.
 * Öncelik: note.tags (varsa) — chip text = title, renk = colorCode.
 * Fallback: note.tagIds üzerinden getTagById ile store'dan lookup.
 * tagIds GUID listesidir; string id'yi "title" sanıp store'a eklenmez.
 */
export function getNoteDisplayTags(note, getTagById) {
  const rawTags = note?.tags ?? note?.Tags;
  if (Array.isArray(rawTags) && rawTags.length > 0) {
    return rawTags
      .map((t, i) => {
        const id = t?.id ?? t?.Id ?? null;
        if (id == null) return null;
        const name =
          t?.title ?? t?.Title ?? t?.name ?? t?.Name ?? String(id);
        const rawColor =
          t?.colorCode ?? t?.ColorCode ?? t?.color ?? t?.Color;
        const color = isValidTagColor(rawColor)
          ? String(rawColor).trim()
          : tagPalette[i % tagPalette.length];
        return { id, name, color };
      })
      .filter(Boolean);
  }
  const ids = normalizeTagIds(note);
  return ids
    .map((tagId, index) => getTagById(tagId))
    .filter(Boolean)
    .map((t, index) => {
      const rawColor = t.color;
      const color = isValidTagColor(rawColor)
        ? String(rawColor).trim()
        : tagPalette[index % tagPalette.length];
      return { id: t.id, name: t.name, color };
    });
}

export function buildNotePayload(note) {
  const folderIds = getNoteFolderIds(note);
  const folderId = getPrimaryNoteFolderId(note);

  return {
    title: note.title ?? "",
    folderId,
    folderIds,
    folderPath: note.folderPath ?? "",
    tagIds: normalizeTagIds(note),
    content: note.content ?? "",
    isFavorite: !!note.isFavorite,
    isDeleted: !!note.isDeleted,
  };
}

/**
 * PUT /api/notes/{id} body. Alıcı kullanıcı için folderId, folderIds, tagIds, isFavorite, isDeleted
 * gönderilmez (backend yok sayır / 403). Sadece title ve content kullan.
 */
export function buildNotePayloadForPut(note, { sharedRecipient = false } = {}) {
  if (sharedRecipient) {
    return {
      title: note.title ?? "",
      content: note.content ?? "",
    };
  }
  return buildNotePayload(note);
}

export function normalizeCreatedNote(
  created,
  fallbackFolderId = null,
  fallbackFolderIds = [],
  locale = "tr"
) {
  const createdFolderIds = getNoteFolderIds(created);
  const folderIds = createdFolderIds.length > 0 ? createdFolderIds : fallbackFolderIds;
  const folderId = getPrimaryNoteFolderId(created) ?? normalizeId(fallbackFolderId);

  const rawUpdated = resolveRawUpdatedAt(created) || new Date();
  const rawCreated = resolveRawCreatedAt(created) || rawUpdated;
  return {
    ...created,
    folderIds,
    folderId,
    updatedAt: formatNoteDate(rawUpdated, locale),
    updatedAtRaw: rawUpdated,
    createdAt: formatNoteDate(rawCreated, locale),
    createdAtRaw: rawCreated,
  };
}

export function buildErrorHint(err, locale = "tr") {
  const isEn = String(locale || "").toLowerCase().startsWith("en");
  const status = err?.response?.status;
  const responseData = err?.response?.data;
  const messageText =
    responseData?.message ||
    responseData?.title ||
    (typeof responseData === "string" ? responseData : null);

  if (!err?.response) {
    return isEn
      ? "Backend is unreachable. Make sure server is running and URL is correct."
      : "Backend'e ulaşılamıyor. Sunucunun çalıştığından ve adresin doğru olduğundan emin olun.";
  }

  if (status === 404) {
    return isEn ? "Notes API was not found (404)." : "Notlar API'si bulunamadı (404).";
  }

  return messageText || `${isEn ? "Server error" : "Sunucu hatası"} (${status || (isEn ? "network" : "ağ")}).`;
}
