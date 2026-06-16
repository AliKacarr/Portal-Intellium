export function slugifyTag(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-öüşğıç]/g, "") // Türkçe karakterlere izin ver
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function findFolderById(folderNodes, targetId) {
  return folderNodes.find((folder) => folder.id === targetId) || null;
}

export function findFolderPathById(folderNodes, targetId) {
  const folder = findFolderById(folderNodes, targetId);
  if (!folder) return null;
  return folder.title;
}

export function escapeHtml(input = "") {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function toEditorHtml(content = "") {
  if (!content) return "<p><br></p>";
  const hasHtml = /<\s*[a-z][\s\S]*>/i.test(content);
  if (hasHtml) return content;

  return content
    .split("\n")
    .map((line) =>
      line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>"
    )
    .join("");
}

export function toPlainText(content = "") {
  if (!content) return "";
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Redux `language.locale` → Notes tarafında metin/normalizasyon için "en" | "tr". */
export function resolveNotesLocale(locale) {
  return String(locale || "").toLowerCase().startsWith("en") ? "en" : "tr";
}
