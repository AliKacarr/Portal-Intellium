/**
 * Portal backend kök URL — tek yapılandırma girişi.
 * Değerler: `.env` / `.env.development` / `.env.production` içindeki
 * `REACT_APP_API_BASE_URL` (varsa) veya `REACT_APP_BACKEND_URL`.
 * Uygulama genelinde doğrudan `process.env.REACT_APP_*` kullanmayın; `host` / `buildApiUrl` kullanın.
 * NOT: `.env` değişiklikleri için dev sunucusunu yeniden başlatın.
 */

const trimTrailingSlash = (value) => value?.replace(/\/+$/, "");
const ensureLeadingSlash = (value = "") =>
  value.startsWith("/") ? value : `/${value}`;

/** Masraf + fiş OCR dahil tüm portal API çağrıları bu kökten türetilir. */
const configuredHost = trimTrailingSlash(
  process.env.REACT_APP_API_BASE_URL?.trim() ||
    process.env.REACT_APP_BACKEND_URL?.trim()
);

export let host = configuredHost || "";

export const getApiHosts = () => (host ? [host] : []);

export const buildApiUrl = (path = "") =>
  `${host}${ensureLeadingSlash(path)}`;

export const setActiveApiHost = (nextHost) => {
  const normalizedHost = trimTrailingSlash(nextHost);

  if (!normalizedHost) {
    return;
  }

  host = normalizedHost;
};
