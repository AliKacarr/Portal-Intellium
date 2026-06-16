import React from "react";
import { Badge } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import {
  formatExpenseDate,
  formatExpenseCurrency,
  formatRequestCategorySummary,
  getExpenseCategoryLabel,
  getExpenseCopy,
  getMultiCurrencyDisplayLabel,
  resolveExpenseStatusReason,
  translateExpensePaymentType,
  translateExpenseStatus,
} from "../utils/expenseI18n";
import { formatRequestDisplayCode8 } from "../../../utils/requestDisplayCode";
import { getExpenseCurrencyCode } from "../utils/expenseCurrency";
import { parseMoney } from "../utils/expenseMoney";
import { getApprovedExpenseAmount, parseAmount } from "../utils/dashboardMetrics";

/** Eski/uzun verilerde özet kartı ve tablo taşmasını önler */
const shortTextEllipsis = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
};

const uniqueCompact = (values) =>
  Array.from(new Set(values.filter(Boolean).map((v) => String(v)))).slice(0, 6);

const formatDateShort = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR");
};

// formatRequestDisplayCode8: src/utils/requestDisplayCode.js

const REQUEST_META_MAP_STORAGE_KEY = "expenseRequestMetaMap";
const getRequestMetaFromStorage = (requestId) => {
  if (!requestId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REQUEST_META_MAP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const meta = parsed[String(requestId)];
    return meta && typeof meta === "object" ? meta : null;
  } catch {
    return null;
  }
};

const resolveInvoiceNumber = (expense) =>
  String(
    expense?.invoiceNumber ??
      expense?.invoiceNo ??
      expense?.InvoiceNumber ??
      expense?.faturaNo ??
      expense?.faturaNumarasi ??
      ""
  ).trim();

const resolveProjectName = (expense) =>
  String(
    expense?.projectName ??
      expense?.companyName ??
      expense?.company ??
      expense?.kurum ??
      expense?.Kurum ??
      ""
  ).trim();

const resolvePersonCount = (expense) => {
  const raw = expense?.personCount ?? expense?.mealPersonCount;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const getBaseCategoryLabel = (expense) =>
  getExpenseCategoryLabel(expense?.invoiceTitle, expense?.extraCategorie);

const getCategoryChipData = (expense) => {
  const label = getBaseCategoryLabel(expense);
  const count =
    expense?.invoiceTitle === "Yemek" || expense?.invoiceTitle === "Ulaşım"
      ? resolvePersonCount(expense)
      : null;
  return { label, count };
};

const parseLineNumber = (v) => {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(typeof v === "string" ? String(v).replace(",", ".") : v);
  return Number.isFinite(n) ? n : 0;
};

const getGrossVatSplit = (gross, vatRate) => {
  const g = parseLineNumber(gross);
  const k = parseLineNumber(vatRate);
  if (g <= 0) return { net: 0, vat: 0, total: 0 };
  if (k <= 0) return { net: g, vat: 0, total: g };
  const net = g / (1 + k / 100);
  const vat = g - net;
  return { net, vat, total: g };
};

const round2 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

/** KDV dahil satır brütü: önce totalAmount; yoksa adet×birim (OCR/form genelde böyle gelir) */
const getLineGrossKdvInclusive = (item) => {
  const direct = parseMoney(item?.totalAmount);
  if (direct != null && direct > 0) {
    return direct;
  }
  const qty = parseMoney(item?.quantity);
  const q = qty != null && qty > 0 ? qty : 1;
  const up = parseMoney(item?.unitPrice);
  if (up == null || !Number.isFinite(up)) {
    return 0;
  }
  return q * up;
};

const getLineVatSplit = (item) => {
  const gross = getLineGrossKdvInclusive(item);
  const k = parseLineNumber(item?.kdvRate);
  if (gross <= 0) return { net: 0, vat: 0, total: 0 };
  if (k <= 0) return { net: gross, vat: 0, total: gross };
  const net = round2(gross / (1 + k / 100));
  const vat = round2(gross - net);
  return { net, vat, total: gross };
};

const getBadgeStatus = (status) => {
  if (status === "Onaylandı") return "success";
  if (status === "Onaylanmadı") return "error";
  if (status === "Revize Bekliyor") return "warning";
  return "processing";
};

function InvoiceRequest({
  info,
  invoiceRef,
  includeAttachment = false,
  onReceiptZoom,
}) {
  const copy = getExpenseCopy();
  const requestExpenses = Array.isArray(info?.expenses) ? info.expenses : [];
  const primary = requestExpenses[0] || info || {};
  const currencyCode = getExpenseCurrencyCode(primary);
  const fmt = (amount) => formatExpenseCurrency(amount, { currencyCode });
  const fmtByCode = (amount, code) =>
    formatExpenseCurrency(amount, { currencyCode: code || currencyCode });

  const requestId = String(info?.requestId || primary?.requestId || "");
  const requestDisplayCode8 = formatRequestDisplayCode8(requestId);
  const createdAt = formatExpenseDate(new Date());
  const ownerName = primary?.ownerName || copy.unknownUser;
  const creatorName = primary?.creatorName || copy.unknownUser;
  const requestMeta = getRequestMetaFromStorage(requestId);
  const invoiceNumberShared =
    resolveInvoiceNumber(primary) ||
    requestExpenses.map(resolveInvoiceNumber).find(Boolean) ||
    String(requestMeta?.invoiceNumber || "").trim() ||
    "";
  const projectNameShared =
    resolveProjectName(primary) ||
    requestExpenses.map(resolveProjectName).find(Boolean) ||
    String(requestMeta?.projectName || "").trim() ||
    "";

  const distinctInvoiceNumbers = uniqueCompact(
    requestExpenses.map((e) => resolveInvoiceNumber(e)).filter(Boolean)
  );
  const distinctProjectNames = uniqueCompact(
    requestExpenses.map((e) => resolveProjectName(e)).filter(Boolean)
  );

  const totalsByCurrency = requestExpenses.reduce((acc, e) => {
    const code = getExpenseCurrencyCode(e) || "-";
    const prev = acc[code] || { currencyCode: code, approvedTotal: 0 };
    const nextApproved = prev.approvedTotal + parseAmount(getApprovedExpenseAmount(e));
    return {
      ...acc,
      [code]: {
        currencyCode: code,
        approvedTotal: nextApproved,
      },
    };
  }, {});

  const totalsByCurrencyList = Object.values(totalsByCurrency).sort((a, b) =>
    String(a.currencyCode).localeCompare(String(b.currencyCode))
  );

  const isMixedCurrency = totalsByCurrencyList.length > 1;
  const approvedTotal = isMixedCurrency
    ? null
    : totalsByCurrencyList[0]?.approvedTotal ?? 0;
  const expenseCount = requestExpenses.length || 0;
  const categorySummaryText =
    formatRequestCategorySummary(requestExpenses) ||
    `${expenseCount} ${copy.expenseCountUnit}`;
  const resolvePaymentTypeCell = (expense) => {
    const raw = String(expense?.expenseType || "").trim();
    return raw ? translateExpensePaymentType(raw) || raw : "—";
  };

  const expenseSummaries = requestExpenses
    .map((e, idx) => {
      const { label, count } = getCategoryChipData(e);
      const cc = getExpenseCurrencyCode(e) || "-";
      return {
        key: String(e?.id ?? e?.Id ?? `${idx}`),
        category: label || "-",
        personCount: count,
        date: formatDateShort(e?.invoiceDate),
        invoiceNumber: resolveInvoiceNumber(e) || "-",
        projectName: resolveProjectName(e) || "-",
        currencyCode: cc,
        description: String(e?.description || "").trim(),
        dateMs: (() => {
          const t = new Date(e?.invoiceDate || 0).getTime();
          return Number.isFinite(t) ? t : 0;
        })(),
        paymentType: resolvePaymentTypeCell(e),
      };
    })
    .sort((a, b) => a.dateMs - b.dateMs);

  const requestStatus = info?.status || primary?.status || "";
  const isRejected = requestStatus === "Onaylanmadı";
  const requestRejectionReason = (() => {
    for (const entry of [info, primary, ...requestExpenses]) {
      const r = resolveExpenseStatusReason(entry);
      if (r) return r;
    }
    return "";
  })();

  const resolveLineItemName = (item) =>
    String(item?.itemName ?? item?.ItemName ?? item?.name ?? "").trim();

  const rows = requestExpenses.flatMap((expense) => {
    const expenseItems = Array.isArray(expense?.items) ? expense.items : [];
    const rowCurrency = getExpenseCurrencyCode(expense) || "-";
    const category = getBaseCategoryLabel(expense);
    const invoiceNumber = resolveInvoiceNumber(expense) || "-";
    if (expenseItems.length) {
      return expenseItems.map((item, idx) => {
        const lineCurrency =
          item?.currencyCode != null && String(item.currencyCode).trim() !== ""
            ? getExpenseCurrencyCode({
                currencyCode: String(item.currencyCode).trim(),
              })
            : rowCurrency;
        const itemName = resolveLineItemName(item);
        return {
          key: `${expense?.id ?? expense?.Id ?? "x"}-item-${item?.id ?? idx}`,
          itemName: itemName || "—",
          invoiceNumber,
          category,
          currencyCode: lineCurrency,
          kdvRate: item?.kdvRate ?? 0,
          kkeg: Boolean(item?.isKkeg),
          split: getLineVatSplit(item),
        };
      });
    }
    const split = getGrossVatSplit(expense?.totalAmount, expense?.vatRate);
    return [
      {
        key: `${expense?.id ?? expense?.Id ?? "x"}-expense`,
        itemName: "—",
        invoiceNumber,
        category,
        currencyCode: rowCurrency,
        kdvRate: expense?.vatRate ?? 0,
        kkeg: Boolean(expense?.hasKkeg || expense?.isKkeg),
        split,
      },
    ];
  });

  /** GENEL TOPLAM: tablodaki kalem TOPLAM sütununun tutarları (split.total) — fiş totalAmount toplamı değil */
  const lineGrandTotalsByCurrency = rows.reduce((acc, r) => {
    const code = r.currencyCode && r.currencyCode !== "-" ? r.currencyCode : currencyCode;
    const add = parseAmount(r.split?.total);
    if (!Number.isFinite(add)) return acc;
    acc[code] = (acc[code] || 0) + add;
    return acc;
  }, {});

  const lineGrandTotalsList = Object.entries(lineGrandTotalsByCurrency)
    .map(([cc, total]) => ({ currencyCode: cc, lineTotal: total }))
    .sort((a, b) => String(a.currencyCode).localeCompare(String(b.currencyCode)));

  const isMixedGeneralTotal = lineGrandTotalsList.length > 1;

  return (
    <div
      className="invoice-container"
      ref={invoiceRef}
      style={{
        border: "1px solid rgba(148,163,184,.55)",
        borderRadius: 14,
        padding: 18,
        background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1f2b4a 0%, #243963 100%)",
          color: "#f8fbff",
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 14,
          boxShadow: "0 18px 46px rgba(2, 6, 23, 0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>
              {copy.invoiceSummary}
            </div>
            <div style={{ opacity: 0.8, letterSpacing: ".08em", fontSize: 11, marginTop: 2 }}>
              {copy.requestSummaryUpper} • {categorySummaryText}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ opacity: 0.85, fontSize: 10, letterSpacing: ".12em" }}>
              {copy.requestNumberUpper}
            </div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 26,
                letterSpacing: "0.06em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {requestId ? requestDisplayCode8 : "—"}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          border: "1px solid rgba(148,163,184,.45)",
          borderRadius: 14,
          padding: 12,
          background: "rgba(255,255,255,.9)",
          boxShadow: "0 10px 30px rgba(2, 6, 23, 0.06)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 10,
          }}
        >
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>Durumu</div>
            <Badge
              status={getBadgeStatus(info?.status || primary?.status)}
              text={translateExpenseStatus(info?.status || primary?.status || "Beklemede")}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.invoiceNumber}</div>
            <div style={{ fontWeight: 800, ...shortTextEllipsis }} title={invoiceNumberShared || undefined}>
              {distinctInvoiceNumbers.length > 1
                ? getMultiCurrencyDisplayLabel()
                : invoiceNumberShared || "-"}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.company}</div>
            <div style={{ fontWeight: 800, ...shortTextEllipsis }} title={projectNameShared || undefined}>
              {distinctProjectNames.length > 1
                ? getMultiCurrencyDisplayLabel()
                : projectNameShared || "-"}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.generatedOn}</div>
            <div style={{ fontWeight: 700 }}>{createdAt}</div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 10,
            marginTop: 12,
          }}
        >
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.owner}</div>
            <div style={{ fontWeight: 700 }}>{ownerName}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.createdBy}</div>
            <div style={{ fontWeight: 700 }}>{creatorName}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.expenseSummaryLabel}</div>
            <div style={{ fontWeight: 800 }}>{expenseCount} {copy.expenseCountUnit}</div>
          </div>
        </div>
      </div>

      {isRejected ? (
        <div
          style={{
            marginTop: 12,
            borderRadius: 14,
            padding: "14px 16px",
            border: "1px solid rgba(248, 113, 113, 0.42)",
            background:
              "linear-gradient(180deg, rgba(254, 242, 242, 0.98), rgba(254, 226, 226, 0.45))",
            boxShadow: "0 6px 18px rgba(185, 28, 28, 0.1)",
          }}
        >
          <div
            style={{
              color: "#b91c1c",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {copy.redReasonLabel}
          </div>
          <div
            style={{
              color: "#7f1d1d",
              fontSize: 14,
              lineHeight: 1.55,
              fontWeight: 600,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {requestRejectionReason || copy.reasonNotProvided}
          </div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 10,
          border: "1px solid rgba(148,163,184,.45)",
          borderRadius: 10,
          padding: "9px 10px",
          background: "rgba(255,255,255,.9)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>{copy.expenseBasedInfo}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {expenseSummaries.length} {copy.recordCount}
          </div>
        </div>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {expenseSummaries.map((s, idx) => (
            <div
              key={`${s.key}-${idx}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 8,
                padding: "7px 9px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,.38)",
                background: idx % 2 ? "rgba(248,250,252,.7)" : "#fff",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#0f172a" }}>
                    {s.category}
                  </span>
                  {s.personCount ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(31,118,199,0.10)",
                        border: "1px solid rgba(31,118,199,0.22)",
                        color: "#0f172a",
                      }}
                    >
                      {s.personCount} {copy.personUnit}
                    </span>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: "#334155", fontWeight: 700 }}>
                  <span>{copy.invoiceLabel}: {s.invoiceNumber}</span>
                  <span>•</span>
                  <span>{copy.companyLabel}: {s.projectName}</span>
                  <span>•</span>
                  <span>{copy.currencyCodeColumn}: {s.currencyCode || "-"}</span>
                  <span>•</span>
                  <span>
                    {copy.paymentType}: {s.paymentType}
                  </span>
                </div>
                {s.description ? (
                  <div style={{ marginTop: 2 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#64748b",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {copy.description}
                    </div>
                    <div
                      style={{
                        border: "1px solid rgba(148,163,184,.4)",
                        borderRadius: 8,
                        padding: "6px 8px",
                        background: "rgba(248,250,252,.95)",
                        fontSize: 11,
                        lineHeight: 1.4,
                        color: "#0f172a",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {s.description}
                    </div>
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  paddingTop: 2,
                }}
              >
                {s.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
          marginTop: 10,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(148,163,184,.45)",
            borderRadius: 10,
            padding: 10,
            background: "linear-gradient(180deg, rgba(31,118,199,0.10), rgba(255,255,255,0.9))",
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 800 }}>
            {copy.approvedAmountLabel}
          </div>
          {isMixedCurrency ? (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {totalsByCurrencyList.map((t) => (
                <div
                  key={`approved-${t.currencyCode}`}
                  style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
                >
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#334155" }}>
                    {t.currencyCode}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                    {fmtByCode(t.approvedTotal, t.currencyCode)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2, color: "#0f172a" }}>
              {fmt(approvedTotal)}
            </div>
          )}
        </div>
        <div
          style={{
            border: "1px solid rgba(148,163,184,.45)",
            borderRadius: 10,
            padding: 10,
            background: "rgba(255,255,255,.9)",
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 800 }}>
            {copy.overallPrice}
          </div>
          {isMixedGeneralTotal ? (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {lineGrandTotalsList.map((t) => (
                <div
                  key={`gen-line-${t.currencyCode}`}
                  style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
                >
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#334155" }}>
                    {t.currencyCode}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                    {fmtByCode(t.lineTotal, t.currencyCode)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2, color: "#0f172a" }}>
              {fmtByCode(
                lineGrandTotalsList[0]?.lineTotal ?? 0,
                lineGrandTotalsList[0]?.currencyCode || currencyCode
              )}
            </div>
          )}
        </div>
        <div
          style={{
            border: "1px solid rgba(148,163,184,.45)",
            borderRadius: 10,
            padding: 10,
            background: "rgba(255,255,255,.9)",
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 800 }}>
            {copy.currency}
          </div>
          {isMixedCurrency ? (
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {totalsByCurrencyList.map((t) => (
                <span
                  key={`cc-${t.currencyCode}`}
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "rgba(31,118,199,0.10)",
                    border: "1px solid rgba(31,118,199,0.22)",
                    color: "#0f172a",
                  }}
                >
                  {t.currencyCode}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2, color: "#0f172a" }}>
              {currencyCode || "-"}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div
          style={{
            color: "#1f2b4a",
            fontWeight: 700,
            fontSize: 12,
            marginBottom: 4,
          }}
        >
          {copy.expenseBasedInfo}
        </div>
        <div
          style={{
            border: "1px solid rgba(148,163,184,.45)",
            borderRadius: 10,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 8px 20px rgba(2, 6, 23, 0.06)",
            maxWidth: "100%",
          }}
        >
          <table
            style={{
              width: "100%",
              maxWidth: "100%",
              borderCollapse: "collapse",
              fontSize: 9,
              lineHeight: 1.25,
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "linear-gradient(180deg, #f8fafc, #eef2ff)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 5px",
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#475569",
                  }}
                >
                  {copy.expenseLineItemName}
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 4px",
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#475569",
                  }}
                >
                  {copy.invoiceNumber}
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 4px",
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#475569",
                  }}
                >
                  {copy.category}
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "4px 4px",
                    fontSize: 8,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  TUTAR (NET)
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "4px 3px",
                    fontSize: 8,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  KDV %
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "4px 4px",
                    fontSize: 8,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  KDV TUTAR
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "4px 4px",
                    fontSize: 8,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  TOPLAM
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "4px 3px",
                    fontSize: 8,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  KKEG
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r, idx) => (
                  <tr
                    key={r.key}
                    style={{
                      borderTop: "1px solid rgba(226,232,240,.9)",
                      background: idx % 2 ? "rgba(248,250,252,.72)" : "#fff",
                    }}
                  >
                    <td
                      style={{
                        padding: "4px 5px",
                        fontWeight: 600,
                        color: "#0f172a",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        lineHeight: 1.3,
                        verticalAlign: "top",
                      }}
                    >
                      {r.itemName || "—"}
                    </td>
                    <td
                      style={{
                        padding: "4px 4px",
                        fontWeight: 700,
                        color: "#0f172a",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={String(r.invoiceNumber || "")}
                    >
                      {r.invoiceNumber || "-"}
                    </td>
                    <td
                      style={{
                        padding: "4px 4px",
                        fontWeight: 700,
                        color: "#0f172a",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={String(r.category || "")}
                    >
                      {r.category || "-"}
                    </td>
                    <td
                      style={{
                        padding: "4px 4px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {fmtByCode(r.split.net, r.currencyCode)}
                    </td>
                    <td
                      style={{
                        padding: "4px 3px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      %{parseLineNumber(r.kdvRate)}
                    </td>
                    <td
                      style={{
                        padding: "4px 4px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {fmtByCode(r.split.vat, r.currencyCode)}
                    </td>
                    <td
                      style={{
                        padding: "4px 4px",
                        textAlign: "right",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {fmtByCode(r.split.total, r.currencyCode)}
                    </td>
                    <td style={{ padding: "4px 3px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 13,
                          height: 13,
                          border: "1px solid #94a3b8",
                          borderRadius: 2,
                          fontSize: 9,
                          lineHeight: 1,
                          color: "#1f2b4a",
                          fontWeight: 700,
                        }}
                      >
                        {r.kkeg ? "✓" : ""}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr style={{ borderTop: "1px solid #e8edf6" }}>
                  <td colSpan={8} style={{ padding: "10px 10px", color: "#64748b" }}>
                    {copy.itemNotFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div
            style={{
              background: "linear-gradient(135deg, #1f2b4a 0%, #243963 100%)",
              color: "#fff",
              padding: "8px 10px",
              fontWeight: 900,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              fontSize: 10,
            }}
          >
            {copy.approvedAmountLabel}:{" "}
            {isMixedCurrency
              ? totalsByCurrencyList
                  .map((t) => `${t.currencyCode}: ${fmtByCode(t.approvedTotal, t.currencyCode)}`)
                  .join(" • ")
              : fmt(approvedTotal)}
          </div>
        </div>
      </div>

      {includeAttachment ? (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              color: "#1f2b4a",
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            {copy.receiptImage}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {requestExpenses.map((expense, idx) => {
              const src = expense?.imageData
                ? `data:image/png;base64,${expense.imageData}`
                : null;
              return (
                <div
                  key={expense?.id ?? expense?.Id ?? idx}
                  style={{
                    border: "1px solid #d8deeb",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#f8fafc",
                    minHeight: 240,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0f172a",
                      ...shortTextEllipsis,
                    }}
                    title={String(expense?.invoiceNumber || "")}
                  >
                    {expense?.invoiceNumber || `${copy.expense} ${idx + 1}`}
                  </div>
                  <div style={{ height: 1, background: "#e8edf6" }} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 10,
                      height: 200,
                      background: "#fff",
                    }}
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={copy.originalInvoice || "receipt"}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div style={{ color: "#64748b", fontSize: 12 }}>{copy.imageNotFound}</div>
                    )}
                  </div>
                  {src && onReceiptZoom ? (
                    <button
                      type="button"
                      onClick={() => onReceiptZoom(src)}
                      style={{
                        position: "absolute",
                        top: 42,
                        right: 10,
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.5)",
                        background: "rgba(15,23,42,0.35)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title={copy.detail || "Zoom"}
                    >
                      <SearchOutlined />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default InvoiceRequest;

