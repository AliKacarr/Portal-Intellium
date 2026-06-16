export function getJwtRoles(accessToken) {
  try {
    const token = String(accessToken || "").trim();
    if (!token) return [];
    const parts = token.split(".");
    if (parts.length < 2) return [];

    // base64url decode
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadB64 + "===".slice((payloadB64.length + 3) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(json);

    // ASP.NET Core default role claim type
    const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const raw =
      payload?.[roleKey] ??
      payload?.role ??
      payload?.roles ??
      payload?.Role ??
      payload?.Roles;

    const roles = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return roles
      .map((r) => String(r || "").trim())
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

export function resolveUiRole({ reduxRole, accessToken }) {
  const normalizedReduxRole = String(reduxRole || "").trim();
  const tokenRoles = getJwtRoles(accessToken).map((r) => r.toLowerCase());

  // Rol alias'ları (backend ile uyum):
  // - worker-outsource
  // - worker-outsourced (legacy)
  const WORKER_OUTSOURCE_ROLES = new Set(["worker-outsource", "worker-outsourced"]);

  // Eğer token içinde outsource rolü varsa, UI rolünü kesin outsource yap.
  if (tokenRoles.some((r) => WORKER_OUTSOURCE_ROLES.has(r)))
    return "worker-outsource";

  // Aksi halde redux rolü varsa onu kullan, yoksa user.
  return normalizedReduxRole || "user";
}
