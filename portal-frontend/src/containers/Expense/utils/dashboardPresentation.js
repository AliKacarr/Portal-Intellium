import { formatExpenseDate, getExpenseLocale } from "./expenseI18n";

export const STATUS_TONE_MAP = {
  Onaylandı: {
    background: "rgba(16, 185, 129, 0.12)",
    color: "#0f9f6e",
  },
  Beklemede: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#d97706",
  },
  Taslak: {
    background: "rgba(100, 116, 139, 0.12)",
    color: "#475569",
  },
  "Tamamlanmamış": {
    background: "rgba(14, 165, 233, 0.14)",
    color: "#0284c7",
  },
  "Revize Bekliyor": {
    background: "rgba(59, 130, 246, 0.14)",
    color: "#2563eb",
  },
  "Revize Edildi": {
    background: "rgba(168, 85, 247, 0.14)",
    color: "#7c3aed",
  },
  Onaylanmadı: {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
  },
};

const normalizeCategoryKey = (value) =>
  String(value || "Diğer")
    .trim()
    .toLocaleLowerCase("tr-TR");

const CATEGORY_TONE_OVERRIDES = {
  telekom: {
    background: "rgba(30, 58, 138, 0.14)",
    color: "#1E3A8A",
  },
  yemek: {
    background: "rgba(124, 58, 237, 0.14)",
    color: "#7C3AED",
  },
  teknoloji: {
    background: "rgba(14, 165, 233, 0.14)",
    color: "#0EA5E9",
  },
  ulaşım: {
    background: "rgba(51, 65, 85, 0.14)",
    color: "#334155",
  },
  diğer: {
    background: "rgba(148, 163, 184, 0.18)",
    color: "#94A3B8",
  },
  diger: {
    background: "rgba(148, 163, 184, 0.18)",
    color: "#94A3B8",
  },
};

export const getCategoryTone = (category) => {
  const normalizedCategory = normalizeCategoryKey(category);
  const overriddenTone = CATEGORY_TONE_OVERRIDES[normalizedCategory];

  if (overriddenTone) {
    return overriddenTone;
  }

  const hash = Array.from(normalizedCategory).reduce(
    (total, character, index) =>
      total + character.charCodeAt(0) * (index + 17),
    0
  );
  const hue = (hash * 137.508) % 360;
  const saturation = 62 + (hash % 14);
  const lightness = 46 + (hash % 8);

  return {
    background: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.14)`,
    color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
  };
};

export const getDateParts = (dateValue) => {
  return {
    day: formatExpenseDate(dateValue, { day: "2-digit" }),
    month: formatExpenseDate(dateValue, {
      month: "short",
      locale: getExpenseLocale(),
    }),
    year: formatExpenseDate(dateValue, { year: "numeric" }),
  };
};

export const buildDonutBackground = (items) => {
  if (!items.length) {
    return "conic-gradient(#dbe7f6 0deg 360deg)";
  }

  let currentDegree = 0;
  const segments = items.map((item) => {
    const startDegree = currentDegree;
    currentDegree += (item.percentage / 100) * 360;
    return `${item.color} ${startDegree}deg ${currentDegree}deg`;
  });

  if (currentDegree < 360) {
    segments.push(`#e5edf8 ${currentDegree}deg 360deg`);
  }

  return `conic-gradient(${segments.join(", ")})`;
};
