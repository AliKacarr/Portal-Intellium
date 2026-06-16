const NOTES_FOLDERS_STORAGE_KEY = "notesFolders";
const NOTES_PERMANENTLY_DELETED_IDS_KEY = "notesPermanentlyDeletedIds";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function normalizeStorageId(id) {
  if (id == null || id === "") return null;
  const normalized = String(id).trim();
  return normalized || null;
}

let memoryNotesFolders = null;
let memoryPermanentlyDeletedIds = null;

export function readStoredFolders() {
  if (memoryNotesFolders) return memoryNotesFolders;
  return [];
}

export function writeStoredFolders(folders) {
  const sanitized = (Array.isArray(folders) ? folders : [])
    .map((folder) => ({
      id: normalizeStorageId(folder?.id),
      title: String(folder?.title || "").trim(),
    }))
    .filter((folder) => folder.id && folder.title);

  memoryNotesFolders = sanitized;
}

export function createInitialNotesFolderState() {
  const folders = readStoredFolders();
  const openedFolders = {};
  folders.forEach((folder) => {
    openedFolders[folder.id] = false;
  });
  return { folders, openedFolders };
}

export function readPermanentlyDeletedNoteIds() {
  if (memoryPermanentlyDeletedIds) return memoryPermanentlyDeletedIds;
  return [];
}

export function rememberPermanentlyDeletedNoteId(noteId) {
  const normalizedId = normalizeStorageId(noteId);
  if (!normalizedId) return;

  const ids = readPermanentlyDeletedNoteIds();
  if (ids.includes(normalizedId)) return;
  writePermanentlyDeletedNoteIds([...ids, normalizedId]);
}

export function writePermanentlyDeletedNoteIds(noteIds) {
  const normalized = [...new Set((noteIds || []).map(normalizeStorageId).filter(Boolean))];
  memoryPermanentlyDeletedIds = normalized;
}

export function filterOutPermanentlyDeletedNotes(notes) {
  const hiddenIds = new Set(readPermanentlyDeletedNoteIds());
  if (hiddenIds.size === 0) return Array.isArray(notes) ? notes : [];
  return (Array.isArray(notes) ? notes : []).filter(
    (note) => !hiddenIds.has(normalizeStorageId(note?.id))
  );
}
