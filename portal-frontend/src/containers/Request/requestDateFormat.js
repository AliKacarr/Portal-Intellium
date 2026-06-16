/**
 * Talep API'si CreatedAt vb. alanları UTC olarak üretir; ISO metinde Z/+offset yoksa
 * tarayıcı değeri "yerel duvar saati" sanıp TR'de ~3 saat geri gösterebilir.
 * Bu yardımcılar UTC anını çıkarıp Europe/Istanbul'da biçimlendirir.
 */

function parseApiInstant(v) {
  if (v == null || v === "") return new Date(NaN);
  if (v instanceof Date) return v;
  if (typeof v === "number" && Number.isFinite(v)) return new Date(v);
  const s = String(v).trim();
  if (!s) return new Date(NaN);
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return new Date(s.length <= 10 ? n * 1000 : n);
  }
  const normalized = s.replace(" ", "T");
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(normalized);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) && !hasTz) {
    return new Date(`${normalized}Z`);
  }
  return new Date(normalized);
}

function formatPartsInIstanbul(d, { withSeconds }) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  });
  const raw = fmt.format(d);
  const [datePart, timePart] = raw.split(",").map((x) => x.trim());
  const [dd, mm, yyyy] = (datePart || "").split("/");
  const timeBits = (timePart || "").split(":");
  const hh = timeBits[0] || "";
  const min = timeBits[1] || "";
  const sec = withSeconds ? timeBits[2] || "00" : null;
  if (!dd || !mm || !yyyy || !hh || !min) {
    return fmt.format(d);
  }
  return sec != null ? `${dd}.${mm}.${yyyy} ${hh}:${min}:${sec}` : `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

/**
 * @param {string|number|Date|null|undefined} v
 * @param {{ withSeconds?: boolean }} [opts]
 * @returns {string}
 */
export function formatTrDateTimeFromApi(v, opts = {}) {
  if (!v) return "-";
  const d = parseApiInstant(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return formatPartsInIstanbul(d, { withSeconds: Boolean(opts.withSeconds) });
}
