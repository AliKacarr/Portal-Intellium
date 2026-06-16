import React from "react";
import { Badge } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import {
  formatExpenseDate,
  formatExpenseCurrency,
  getExpenseCategoryLabel,
  getExpenseCopy,
  translateExpenseStatus,
} from "../utils/expenseI18n";
import { getExpenseCurrencyCode } from "../utils/expenseCurrency";
import { parseMoney } from "../utils/expenseMoney";
import { getApprovedExpenseAmount } from "../utils/dashboardMetrics";

const parseLineNumber = (v) => {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(typeof v === "string" ? String(v).replace(",", ".") : v);
  return Number.isFinite(n) ? n : 0;
};

/** InvoiceRequest ile aynı: satır totalAmount veya adet×birim (KDV dahil brüt) */
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
  if (gross <= 0) {
    return { net: 0, vat: 0, total: 0 };
  }
  if (k <= 0) {
    return { net: gross, vat: 0, total: gross };
  }
  const net = gross / (1 + k / 100);
  const vat = gross - net;
  return { net, vat, total: gross };
};

const buildVerificationCode = (info) => {
  const id = Number(info?.id);
  if (!Number.isFinite(id) || id <= 0) {
    return "882 - 9912 - XCA";
  }
  const a = String(100 + (id % 900)).padStart(3, "0");
  const b = String(9000 + ((id * 7) % 1000)).slice(-4);
  return `${a} - ${b} - XCA`;
};

const KkegCell = ({ checked }) => (
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
    {checked ? "✓" : ""}
  </div>
);

const getBadgeStatus = (status) => {
  if (status === "Onaylandı") return "success";
  if (status === "Onaylanmadı") return "error";
  if (status === "Revize Bekliyor") return "warning";
  return "processing";
};

function Invoice({ info, invoiceRef, includeAttachment = false, onReceiptZoom }) {
  const copy = getExpenseCopy();
  const currencyCode = getExpenseCurrencyCode(info);
  const fmt = (amount) => formatExpenseCurrency(amount, { currencyCode });
  const fmtByCode = (amount, code) =>
    formatExpenseCurrency(amount, { currencyCode: code || currencyCode });

  const categoryLabel = getExpenseCategoryLabel(info?.invoiceTitle, info?.extraCategorie);

  const approvedAmountToDisplay = getApprovedExpenseAmount(info);

  const invoiceItems = Array.isArray(info?.items) ? info.items : [];
  const createdAt = formatExpenseDate(new Date());
  const footerDateTime = new Date().toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const verificationCode = buildVerificationCode(info);
  const ownerName = info?.ownerName || copy.unknownUser;
  const creatorName = info?.creatorName || copy.unknownUser;

  return (
    <div
      className="invoice-container"
      ref={invoiceRef}
      style={{
        border: "1px solid #d8deeb",
        borderRadius: 8,
        padding: 18,
        background: "#fff",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1f2b4a 0%, #243963 100%)",
          color: "#f8fbff",
          borderRadius: 8,
          padding: "18px 20px",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>{copy.invoiceSummary}</div>
            <div style={{ opacity: 0.75, letterSpacing: ".08em", fontSize: 11 }}>
              OFFICIAL FINANCIAL STATEMENT
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ opacity: 0.75, fontSize: 10 }}>MASRAF NUMARASI</div>
            <div style={{ fontWeight: 700, fontSize: 26 }}>{info?.invoiceNumber || "-"}</div>
          </div>
        </div>
      </div>

      <div style={{ border: "1px solid #d8deeb", borderRadius: 6, padding: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>Durumu</div>
            <Badge status={getBadgeStatus(info?.status)} text={translateExpenseStatus(info?.status || "Beklemede")} />
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.invoiceDate}</div>
            <div style={{ fontWeight: 700 }}>{formatExpenseDate(info?.invoiceDate)}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.invoicePeriod}</div>
            <div style={{ fontWeight: 700 }}>{info?.expensePeriod || "-"}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.generatedOn}</div>
            <div style={{ fontWeight: 700 }}>{createdAt}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, marginTop: 12 }}>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.owner}</div>
            <div style={{ fontWeight: 700 }}>{ownerName}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.createdBy}</div>
            <div style={{ fontWeight: 700 }}>{creatorName}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.company}</div>
            <div style={{ fontWeight: 700 }}>{info?.projectName || "-"}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{copy.category}</div>
            <div style={{ fontWeight: 700 }}>{categoryLabel}</div>
          </div>
        </div>
      </div>

      {info?.mealPersonNames ? (
        <div style={{ marginTop: 6 }}>
          <div style={{ opacity: 0.7, fontSize: 11 }}>
            {copy.participantNames}{" "}
            {Number(info?.personCount ?? info?.mealPersonCount) > 0
              ? `(${Number(info?.personCount ?? info?.mealPersonCount)} ${copy.personUnit})`
              : ""}
          </div>
          <div style={{ marginTop: 2, whiteSpace: "pre-wrap" }}>
            {String(info.mealPersonNames)}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            color: "#1f2b4a",
            fontWeight: 700,
            fontSize: 12,
            marginBottom: 6,
          }}
        >
          {copy.expenseBasedInfo}
        </div>
        <div
          style={{
            border: "1px solid #d8deeb",
            borderRadius: 8,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "7px 10px",
              borderBottom: "1px solid #e8edf6",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.06em", color: "#94a3b8", fontWeight: 600 }}>
                FATURA NO
              </div>
              <div style={{ fontWeight: 700, fontSize: 12, marginTop: 1, lineHeight: 1.2 }}>
                {info?.invoiceNumber || "-"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.06em", color: "#94a3b8", fontWeight: 600 }}>
                {copy.invoiceDateUpper}
              </div>
              <div style={{ fontWeight: 700, fontSize: 12, marginTop: 1, lineHeight: 1.2 }}>
                {formatExpenseDate(info?.invoiceDate)}
              </div>
            </div>
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 10,
              lineHeight: 1.2,
            }}
          >
            <thead>
              <tr style={{ background: "#f2f6fb" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "5px 6px",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  {copy.expenseTypeUpper}
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "5px 6px",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  TUTAR (NET)
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "5px 6px",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  KDV %
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "5px 6px",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  KDV TUTAR
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "5px 6px",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  TOPLAM
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "5px 6px",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  KKEG
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.length ? (
                invoiceItems.map((item, index) => {
                  const { net, vat, total } = getLineVatSplit(item);
                  const lineCc =
                    item?.currencyCode != null && String(item.currencyCode).trim() !== ""
                      ? getExpenseCurrencyCode({
                          currencyCode: String(item.currencyCode).trim(),
                        })
                      : currencyCode;
                  return (
                    <tr key={`${item?.itemName || "item"}-${index}`} style={{ borderTop: "1px solid #e8edf6" }}>
                      <td
                        style={{
                          padding: "4px 6px",
                          wordBreak: "break-word",
                          fontSize: 10,
                          lineHeight: 1.2,
                        }}
                      >
                        {item?.itemName || "-"}
                      </td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          fontSize: 10,
                          lineHeight: 1.2,
                        }}
                      >
                        {fmtByCode(net, lineCc)}
                      </td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          fontSize: 10,
                          lineHeight: 1.2,
                        }}
                      >
                        {item?.kdvRate ?? 0}
                      </td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          fontSize: 10,
                          lineHeight: 1.2,
                        }}
                      >
                        {fmtByCode(vat, lineCc)}
                      </td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          fontSize: 10,
                          lineHeight: 1.2,
                        }}
                      >
                        {fmtByCode(total, lineCc)}
                      </td>
                      <td style={{ padding: "3px 6px", textAlign: "center", verticalAlign: "middle" }}>
                        <KkegCell checked={item?.isKkeg === true} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: 8, opacity: 0.7, fontSize: 10 }}>
                    {copy.itemNotFound}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: "#1f2b4a", color: "#fff" }}>
                <td
                  colSpan={5}
                  style={{
                    padding: "6px 8px",
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: 10,
                    lineHeight: 1.2,
                  }}
                >
                  {copy.approvedAmountLabel}:
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    textAlign: "right",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    fontSize: 10,
                    lineHeight: 1.2,
                  }}
                >
                  {fmt(approvedAmountToDisplay)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {includeAttachment && String(info?.description || "").trim() ? (
        <div style={{ marginTop: 20 }}>
          <div style={{ color: "#1f2b4a", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
            {copy.description}
          </div>
          <div
            style={{
              border: "1px solid #d8deeb",
              borderRadius: 8,
              padding: "12px 14px",
              background: "#f8fafc",
              fontSize: 12,
              lineHeight: 1.45,
              color: "#0f172a",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {String(info.description).trim()}
          </div>
        </div>
      ) : null}

      {includeAttachment ? (
        <div style={{ marginTop: includeAttachment && String(info?.description || "").trim() ? 14 : 20 }}>
          <div style={{ color: "#1f2b4a", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
            {copy.receiptImage}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            {/* Fiş önizleme — kare kutu, sağ üst büyütme */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                border: "1px solid #d8deeb",
                borderRadius: 12,
                overflow: "hidden",
                background: "#f1f5f9",
                boxSizing: "border-box",
              }}
            >
              {info?.imageData ? (
                <>
                  <img
                    alt={copy.originalInvoice}
                    src={`data:image/png;base64,${info.imageData}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {typeof onReceiptZoom === "function" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onReceiptZoom();
                      }}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "none",
                        background: "#fff",
                        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.15)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#475569",
                        padding: 0,
                      }}
                      aria-label={copy.detail || "Enlarge image"}
                    >
                      <SearchOutlined style={{ fontSize: 16 }} />
                    </button>
                  ) : null}
                </>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  {copy.imageNotFound}
                </div>
              )}
            </div>

            {/* Doğrulama — kare kutu, açıklama + altta beyaz doğrulama kodu şeridi */}
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                border: "1px solid #c5d4f0",
                borderRadius: 12,
                overflow: "hidden",
                background: "linear-gradient(180deg, #eef3ff 0%, #e2ebfc 100%)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "16px 16px 8px", flex: 1, minHeight: 0 }}>
                <div style={{ fontWeight: 700, color: "#1e3a5f", fontSize: 15, marginBottom: 10 }}>
                  {copy.verifiedImage}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: "#475569",
                  }}
                >
                  {copy.receiptVerificationText}
                </p>
              </div>
              <div
                style={{
                  background: "#fff",
                  padding: "12px 14px",
                  borderTop: "1px solid #dbe4f8",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    fontSize: 15,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#94a3b8",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 2,
                    }}
                  >
                    {copy.verificationCode}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: 14,
                      letterSpacing: "0.04em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {verificationCode}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 20,
          borderTop: "1px solid #d8deeb",
          paddingTop: 14,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 1fr) auto",
          gap: 12,
          alignItems: "end",
          fontSize: 11,
          color: "#4a5a77",
        }}
      >
        <div>
          <div style={{ opacity: 0.7, fontSize: 10, marginBottom: 4 }}>{copy.editedAt}</div>
          <div style={{ fontWeight: 700, color: "#1e293b" }}>{footerDateTime}</div>
        </div>
        <div>
          <div style={{ borderBottom: "1px solid #cbd5e1", minHeight: 20, marginBottom: 6 }} />
          <div style={{ opacity: 0.7, fontSize: 10 }}>{copy.approver}</div>
        </div>
        <div>
          <div style={{ borderBottom: "1px solid #cbd5e1", minHeight: 20, marginBottom: 6 }} />
          <div style={{ opacity: 0.7, fontSize: 10 }}>{copy.accounting}</div>
        </div>
        <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
          <div style={{ opacity: 0.7, fontSize: 10, marginBottom: 4 }}>{copy.page}</div>
          <div style={{ fontWeight: 700, color: "#1e293b" }}>01 / 01</div>
        </div>
      </div>
    </div>
  );
}

export default Invoice;

