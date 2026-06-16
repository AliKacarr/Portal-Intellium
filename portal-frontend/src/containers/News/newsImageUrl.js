import { buildApiUrl } from "../../Api/host";

/**
 * Haber ImageUrl: tam URL ise aynen; file-storage göreli yolu (örn. news-covers/…) ise API kökü ile birleştirir.
 */
/** Geçerli bir haber kapak URL’si var mı (boş / yalnızca boşluk değil). */
export function hasNewsImage(imageUrl) {
  return newsImageSrc(imageUrl).length > 0;
}

export function newsImageSrc(imageUrl) {
  if (imageUrl == null) return "";
  const s = String(imageUrl).trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("data:") || lower.startsWith("blob:")) {
    return s;
  }
  const normalized = s.replace(/\\/g, "/").replace(/^\/+/, "");
  return buildApiUrl(`/${normalized}`);
}
