export const DEFAULT_MEAL_ACCEPTED_DAILY_AMOUNT = 500;

/**
 * Masraf / KDV tutarları — float zinciri yok; TRY için 2 ondalık = kuruş (minor) ile tam sayı aritmetiği.
 *
 * Tek kaynak: Ana giriş **KDV dahil toplam (brüt)** (`totalAmount`).
 * Brüt biliniyorsa: net = round(brüt / (1 + kdv/100), 2), KDV = brüt − net (çift bağımsız yuvarlama yok).
 */

export const MONEY_DECIMALS = 2;
export const MINOR_SCALE = 10 ** MONEY_DECIMALS;

/**
 * String tutarı tek ondalık noktalı sayı dizgesine çevirir.
 * TR: 1.234,56 / 102,27 — US: 1,234.56 — tek nokta: 102.27 veya (kısa sol) 1.234 → 1234.
 */
export function normalizeMoneyDecimalString(raw) {
  if (raw === undefined || raw === null || raw === "") return "";
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? String(raw) : "";
  }
  let s = String(raw)
    .trim()
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");
  if (!s || s === "-" || s === ".") return "";
  const neg = s.startsWith("-");
  if (neg) s = s.slice(1);
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    const parts = s.split(",");
    if (parts.length === 2) {
      s = `${parts[0].replace(/\./g, "")}.${parts[1]}`;
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (lastDot !== -1) {
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount > 1) {
      const ld = s.lastIndexOf(".");
      s = `${s.slice(0, ld).replace(/\./g, "")}.${s.slice(ld + 1)}`;
    } else {
      const parts = s.split(".");
      if (parts.length === 2) {
        const [i, f] = parts;
        if (
          f.length === 3 &&
          i.length <= 2 &&
          /^\d+$/.test(i) &&
          /^\d+$/.test(f)
        ) {
          s = i + f;
        }
      }
    }
  }
  return (neg ? "-" : "") + s;
}

/**
 * Nesnede ilk dolu alanı döndürür (API camelCase + snake_case).
 * @param {Record<string, unknown> | null | undefined} obj
 * @param {string[]} keys
 */
export function pickExpenseLineField(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

/**
 * Fiş kalemi: miktar (qty × … API varyasyonları).
 * @param {unknown} input — doğrudan değer veya satır nesnesi
 */
export function parseExpenseLineQuantity(input) {
  if (input !== null && typeof input === "object" && !Array.isArray(input)) {
    return parseMoney(
      pickExpenseLineField(input, [
        "quantity",
        "qty",
        "Quantity",
        "adet",
        "Adet",
      ])
    );
  }
  return parseMoney(input);
}

/**
 * Fiş kalemi: birim fiyat (KDV dahil brüt).
 * @param {unknown} input — doğrudan değer veya satır nesnesi
 */
export function parseExpenseLineUnitPrice(input) {
  if (input !== null && typeof input === "object" && !Array.isArray(input)) {
    return parseMoney(
      pickExpenseLineField(input, [
        "unitPrice",
        "unit_price",
        "UnitPrice",
        "price",
        "birim_fiyat",
      ])
    );
  }
  return parseMoney(input);
}

/**
 * @param {unknown} value
 * @returns {number | null} minor units (ör. 100,50 TL → 10050), geçersizse null
 */
export function parseMoneyToMinorUnits(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.round(value * MINOR_SCALE);
  }
  const normalized = normalizeMoneyDecimalString(value);
  if (!normalized || normalized === "-" || normalized === ".") return null;
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * MINOR_SCALE);
}

/**
 * @param {number | null} minor
 * @returns {number | null} 2 ondalıklı tutar (API / form için)
 */
export function minorUnitsToAmount(minor) {
  if (minor === null || minor === undefined) return null;
  return Number((minor / MINOR_SCALE).toFixed(MONEY_DECIMALS));
}

/**
 * Para alanı: string/number → 2 ondalıklı sayı veya null
 */
export function parseMoney(value) {
  const minor = parseMoneyToMinorUnits(value);
  if (minor === null) return null;
  return minorUnitsToAmount(minor);
}

/**
 * Görüntü (locale; sadece UI)
 */
export function formatMoney(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "";
  const minor = parseMoneyToMinorUnits(amount);
  if (minor === null) return "";
  return (minor / MINOR_SCALE).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Brüt (KDV dahil) + KDV % → net ve KDV ayrıştırma (kuruş, tek yuvarlama).
 * @returns {{ netMinor: number, vatMinor: number } | null}
 */
export function splitVatFromGrossMinor(grossMinor, vatRatePercent) {
  if (grossMinor === null || grossMinor === undefined) return null;
  const rate = Number(vatRatePercent);
  if (!Number.isFinite(rate) || rate < 0) return null;
  const divisor = 100 + rate;
  if (divisor <= 0) return null;
  const netMinor = Math.round((grossMinor * 100) / divisor);
  const vatMinor = grossMinor - netMinor;
  return { netMinor, vatMinor };
}

/**
 * Net + KDV % → brüt (kuruş, tek yuvarlama).
 */
export function grossFromNetMinor(netMinor, vatRatePercent) {
  if (netMinor === null || netMinor === undefined) return null;
  const rate = Number(vatRatePercent);
  if (!Number.isFinite(rate) || rate < 0) return null;
  return Math.round((netMinor * (100 + rate)) / 100);
}

export function vatFromNetMinor(netMinor, vatRatePercent) {
  const grossMinor = grossFromNetMinor(netMinor, vatRatePercent);
  if (grossMinor === null) return null;
  return grossMinor - netMinor;
}

/** KDV hariç + oran → KDV tutarı (2 dp) */
export function calculateVatAmount(excludingVatAmount, vatRate) {
  const netMinor = parseMoneyToMinorUnits(excludingVatAmount);
  if (netMinor === null) return undefined;
  const vatMinor = vatFromNetMinor(netMinor, vatRate);
  if (vatMinor === null) return undefined;
  return minorUnitsToAmount(vatMinor);
}

/** Net + oran → KDV dahil toplam */
export function calculateExpenseTotal(excludingVatAmount, vatRate) {
  const netMinor = parseMoneyToMinorUnits(excludingVatAmount);
  if (netMinor === null) return undefined;
  const grossMinor = grossFromNetMinor(netMinor, vatRate);
  if (grossMinor === null) return undefined;
  return minorUnitsToAmount(grossMinor);
}

/**
 * Brüt (KDV dahil) + KDV % → tek ayrıştırma; matrah ve KDV aynı kuruş bölünmesinden gelir.
 * UI ve API tutarlılığı için tek kaynak.
 */
export function getSplitVatFromGrossAmount(totalAmount, vatRatePercent) {
  const grossMinor = parseMoneyToMinorUnits(totalAmount);
  if (grossMinor === null) return null;
  const split = splitVatFromGrossMinor(grossMinor, vatRatePercent);
  if (!split) return null;
  return {
    grossMinor,
    netMinor: split.netMinor,
    vatMinor: split.vatMinor,
    excludingVatAmount: minorUnitsToAmount(split.netMinor),
    vat: minorUnitsToAmount(split.vatMinor),
  };
}

/** Brüt + oran → KDV hariç matrah */
export function calculateExcludingVatAmountFromTotal(totalAmount, vatRate) {
  const s = getSplitVatFromGrossAmount(totalAmount, vatRate);
  return s?.excludingVatAmount;
}

/** Brüt + oran → KDV tutarı (brüt − net) */
export function calculateVatAmountFromTotal(totalAmount, vatRate) {
  const s = getSplitVatFromGrossAmount(totalAmount, vatRate);
  return s?.vat;
}

/**
 * Vergiler dahil toplam vs günlük kabul — aynı kuruş kuralları
 */
export function calculateUncoveredMealAmountFromTotal(
  totalAmount,
  acceptedDailyAmount
) {
  const totalMinor = parseMoneyToMinorUnits(totalAmount);
  const acceptedMinor = parseMoneyToMinorUnits(acceptedDailyAmount);
  if (totalMinor === null || acceptedMinor === null) return undefined;
  const diff = totalMinor - acceptedMinor;
  return minorUnitsToAmount(Math.max(0, diff));
}

/** Eski isim: vergi hariç − limit (artık nadiren kullanılır) */
export function calculateUncoveredMealAmount(excludingVatAmount, acceptedAmount) {
  const baseMinor = parseMoneyToMinorUnits(excludingVatAmount);
  const accMinor = parseMoneyToMinorUnits(acceptedAmount);
  if (baseMinor === null || accMinor === null) return undefined;
  return minorUnitsToAmount(Math.max(0, baseMinor - accMinor));
}

/**
 * API tutarlılık: |brüt − net×(1+kdv/100)| ≤ toleranceMinor (varsayılan 1 kuruş)
 */
export function assertGrossNetVatConsistent(
  totalAmount,
  excludingVatAmount,
  vatRate,
  toleranceMinor = 1
) {
  const grossMinor = parseMoneyToMinorUnits(totalAmount);
  const netMinor = parseMoneyToMinorUnits(excludingVatAmount);
  if (grossMinor === null || netMinor === null) return true;
  const split = splitVatFromGrossMinor(grossMinor, vatRate);
  if (!split) return true;
  return Math.abs(split.netMinor - netMinor) <= toleranceMinor;
}
