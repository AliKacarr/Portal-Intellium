/**
 * Çift tıklanınca FileViewer ile açılabilen dosya türleri (API type alanı, küçük harf).
 * FolderView / ShowDocuments senkron kalsın diye tek kaynak.
 */
const OPENABLE_FILE_TYPES = new Set([
  "pdf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "tif",
  "tiff",
  "odt",
  "ods",
  "odp",
  "csv",
  "md",
  "rtf",
]);

export function isOpenableDocumentType(type) {
  if (type == null || type === "") return false;
  return OPENABLE_FILE_TYPES.has(String(type).toLowerCase());
}
