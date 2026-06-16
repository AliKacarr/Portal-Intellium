/** İş bilgilerindeki "Bölüm" alanı ile aynı; haber/duyuru hedefi `Departments.Name` ile eşleşir. */
export const JOB_BOLUMU_NAMES = ["Ar&Ge", "Merkez", "Dış Kaynak"];

/** `GetAllDepartments` axios yanıtından liste çıkarır (data / Data / düz dizi). */
export function unwrapDepartmentList(res) {
  const r = res?.data;
  if (!r) return [];
  if (Array.isArray(r)) return r;
  const inner = r.data ?? r.Data;
  if (Array.isArray(inner)) return inner;
  return [];
}

function findDeptForBolum(valid, targetName) {
  const t = String(targetName || "").trim();
  if (!t) return null;
  return (
    valid.find((x) => x.name === t) ||
    valid.find((x) => x.name.localeCompare(t, "tr", { sensitivity: "accent" }) === 0) ||
    valid.find((x) => x.name.toLowerCase() === t.toLowerCase())
  );
}

export function pickBolumDepartmentsFromApi(list) {
  const rows = Array.isArray(list) ? list : [];
  const valid = rows
    .map((d) => {
      const rawId = d.id ?? d.Id;
      const id = typeof rawId === "number" ? rawId : Number(rawId);
      return {
        id: Number.isFinite(id) ? id : null,
        name: String(d.name ?? d.Name ?? "").trim(),
      };
    })
    .filter((x) => x.name && x.id != null);

  return JOB_BOLUMU_NAMES.map((target) => {
    const found = findDeptForBolum(valid, target);
    return found ? { id: found.id, name: target } : null;
  }).filter(Boolean);
}
