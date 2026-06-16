import { getDocumentType } from "./documentRowUtils";

/** API'den gelen tarih metnini Date'e çevirir (ISO / .NET formatları). */
export function parseDocumentDate(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s.includes("T") || s.includes(" ") ? s : `${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** API Document satırı: CreatedAt / UpdatedAt (PascalCase) veya createdAt (camelCase). */
export function pickDocumentDate(record, field = "createdAt") {
  if (!record) return null;
  const camel = field === "updatedAt" ? "updatedAt" : "createdAt";
  const pascal = field === "updatedAt" ? "UpdatedAt" : "CreatedAt";
  return record[camel] ?? record[pascal] ?? null;
}

/**
 * @param {unknown} value
 * @param {{ withTime?: boolean }} [options] — detay modalında saat de gösterilir
 */
export function formatDocumentDate(value, options = {}) {
  const { withTime = false } = options;
  if (value == null || value === "") return "-";
  const d = parseDocumentDate(value);
  if (!d) return "-";
  if (withTime) {
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Liste/detay için ortak alan adları (Ant Design dataIndex uyumu). */
export function normalizeDocumentRow(row) {
  if (!row || typeof row !== "object") return row;
  const type = getDocumentType(row) || (row.type ?? row.Type);
  return {
    ...row,
    id: row.id ?? row.Id,
    name: row.name ?? row.Name,
    type,
    Type: type,
    description: row.description ?? row.Description,
    position: row.position ?? row.Position,
    userId: row.userId ?? row.UserId,
    userName: row.userName ?? row.UserName,
    createdAt: pickDocumentDate(row, "createdAt"),
    updatedAt: pickDocumentDate(row, "updatedAt"),
  };
}

export function normalizeDocumentList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeDocumentRow);
}
