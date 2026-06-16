/**
 * Masraf Excel/PDF export query — fetchExpenses (getAllForAdmin) ile aynı kullanıcı kapsamı.
 *
 * Admin + tüm şirket: userId yok → includeAllUsers=true
 * Admin + çalışan X: userId=X
 * Çalışan / admin worker (my-expenses): canUseAdminView=false → userId=authUserId
 */

export const resolveExpenseExportFilterUserId = (filters = {}) => {
  const { canUseAdminView = false, userId: filtersUserId, authUserId } =
    filters;

  if (!canUseAdminView) {
    return authUserId ?? filtersUserId;
  }

  const shouldUseAdminDefaultScope =
    canUseAdminView && filtersUserId === undefined;
  const filterUserId = shouldUseAdminDefaultScope
    ? undefined
    : canUseAdminView &&
      (filtersUserId === "all" || filtersUserId === "")
    ? undefined
    : filtersUserId ?? authUserId;

  return filterUserId;
};

export const buildExpenseExportQuery = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.period) params.append("period", filters.period);
  if (filters.status) params.append("status", filters.status);
  if (filters.minAmount != null) params.append("minAmount", filters.minAmount);
  if (filters.maxAmount != null) params.append("maxAmount", filters.maxAmount);

  const filterUserId = resolveExpenseExportFilterUserId(filters);

  if (filterUserId != null && filterUserId !== "") {
    params.append("userId", String(filterUserId));
  } else if (filters.canUseAdminView) {
    // Sadece admin "tüm şirket" senaryosunda includeAllUsers gönder.
    if (filterUserId == null || filterUserId === "") {
      params.append("includeAllUsers", "true");
    }
  }

  return params;
};
