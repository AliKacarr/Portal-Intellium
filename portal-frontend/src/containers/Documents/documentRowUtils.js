/** Klasör mü? (Type + TipData; "16.02" gibi isimler dosya sanılmasın) */
export function isDocumentFolder(record) {
  if (!record) return false;
  const t = String(record.type ?? record.Type ?? "").trim().toLowerCase();
  if (t === "folder") return true;
  const tip = record.tipData ?? record.TipData;
  if (typeof tip === "string" && tip.toLowerCase().includes("data:folder")) return true;
  return false;
}

export function getDocumentType(record) {
  if (isDocumentFolder(record)) return "folder";
  return String(record.type ?? record.Type ?? "").trim().toLowerCase();
}

/** PUT /api/Document/update gövdesi — klasör Type'ı korunur, TipData gönderilmez */
export function buildDocumentUpdatePayload(record, newName) {
  const folder = isDocumentFolder(record);
  return {
    Id: record.id ?? record.Id,
    UserId: record.userId ?? record.UserId,
    CustomerId: record.customerId ?? record.CustomerId ?? 0,
    Name: newName,
    Description: record.description ?? record.Description ?? "",
    Position: record.position ?? record.Position ?? "",
    Type: folder ? "folder" : String(record.type ?? record.Type ?? "txt"),
    Parent: record.parent ?? record.Parent ?? 0,
    Path: record.path ?? record.Path ?? "",
    Privacy: record.privacy ?? record.Privacy ?? "private",
    ShareWith: record.shareWith ?? record.ShareWith ?? "",
    Color: record.color ?? record.Color ?? "",
    IsActive: record.isActive ?? record.IsActive ?? true,
    TipData: "",
  };
}

export function touchDocumentUpdatedAt(row) {
  const now = new Date().toISOString();
  return { ...row, updatedAt: now, UpdatedAt: now };
}
