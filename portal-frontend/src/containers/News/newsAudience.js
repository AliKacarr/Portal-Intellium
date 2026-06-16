/** "Herkes" sabiti; `Departments` id'leri ile çakışmaz. */
export const NEWS_AUDIENCE_EVERYONE_VALUE = "__NEWS_AUDIENCE_EVERYONE__";

/**
 * Form `audience`: Herkes | bölüm departmanı id (number).
 * Hedefleme iş profilindeki `UserJobDetail.Department` ile `Departments.Name` üzerinden yapılır; ServiceArea kullanılmaz.
 */
export function resolveNewsAudienceForSubmit(values) {
  const v = values.audience;
  const everyone =
    v === NEWS_AUDIENCE_EVERYONE_VALUE || v === undefined || v === null || v === "";

  const rawId = everyone ? null : v;
  let departmentId = null;
  if (rawId != null && rawId !== "") {
    if (typeof rawId === "number" && Number.isFinite(rawId)) departmentId = rawId;
    else {
      const n = Number(rawId);
      if (Number.isFinite(n)) departmentId = n;
    }
  }

  const isGeneral = everyone;
  const serviceArea = null;

  return { everyone, departmentId, isGeneral, serviceArea };
}
