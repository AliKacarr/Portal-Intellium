import React from "react";
import ReactDOM from "react-dom";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";

import { host } from "../../../Api/host";
import ExpenseGeneralReportPdf from "../Components/ExpenseGeneralReportPdf";
import { getExpenseCopy } from "./expenseI18n";
import { buildExpenseExportQuery } from "./expenseExportParams";

const getReportHeaders = () => [
  "Talep Numarası",
  "Talep Eden",
  "Fatura Tarihi",
  "Fatura Numarası",
  "Kategori",
  "Kurum",
  "Ödeme Tipi",
  "Açıklama",
  "Masraf Sahibi",
  "Para Birimi",
  "KDV Oranı",
  "KDV Tutarı",
  "Vergiler Dahil Toplam",
];

const resolveExpenseRequestIdForExport = (expense) =>
  expense?.requestId ??
  expense?.RequestId ??
  expense?.RequestID ??
  expense?.requestID ??
  "";

const resolveRequesterNameForExport = (expense) =>
  expense?.ownerName || expense?.userName || expense?.creatorName || "";

export const getReportMenuItems = () => {
  const copy = getExpenseCopy();

  return [
    {
      key: "csv",
      label: copy.csvDownload,
    },
    {
      key: "excel",
      label: copy.excelDownload,
    },
    {
      key: "pdf",
      label: copy.pdfDownload,
    },
  ];
};

const downloadTextFile = (fileName, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);
};

const buildExportRows = (expenses, parseAmount) =>
  expenses.map((expense) => [
    resolveExpenseRequestIdForExport(expense),
    resolveRequesterNameForExport(expense),
    expense.invoiceDate || "",
    expense.invoiceNumber || "",
    expense.invoiceTitle || "",
    expense.projectName || "",
    expense.expenseType || "",
    expense.description || "",
    resolveRequesterNameForExport(expense),
    expense.currencyCode || "TRY",
    expense.vatRate ?? "",
    parseAmount(expense.vat),
    parseAmount(expense.totalAmount),
  ]);

const exportExpensesAsXlsxClient = (expenses, parseAmount) => {
  const rows = buildExportRows(expenses, parseAmount);
  const aoa = [getReportHeaders(), ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const safeText = (value) => (value == null ? "" : String(value));
  const cols = aoa[0].map((_, colIdx) => {
    const maxLen = aoa.reduce((max, row) => {
      const len = safeText(row?.[colIdx]).length;
      return len > max ? len : max;
    }, 0);
    // Excel'de okunabilirlik: min 12, max 42 karakter genişliği.
    return { wch: Math.max(12, Math.min(42, maxLen + 2)) };
  });
  worksheet["!cols"] = cols;
  // Başlık satırına filtre ekle.
  const ref = worksheet["!ref"];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    worksheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Masraflar");
  XLSX.writeFile(workbook, "Masraflar_UI.xlsx");
};

const exportExpensesAsCsv = (expenses, parseAmount) => {
  const rows = buildExportRows(expenses, parseAmount);
  const content = [getReportHeaders(), ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  downloadTextFile("masraflar.csv", content, "text/csv;charset=utf-8;");
};

export const exportExpensesToExcelBackend = async (
  accessToken,
  filters = {}
) => {
  const query = buildExpenseExportQuery(filters).toString();
  const url = `${host}/api/expense/exportToExcel${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok) throw new Error("Excel indirilemedi");
  const blob = await response.blob();
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = "Masraflar.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);
};

/**
 * Backend PDF: GET /api/expense/exportToPdf?period=... (Excel ile aynı query)
 * Blob indirme; window.print / yeni sekme yok.
 */
/**
 * Pano özet metrikleri + filtrelenmiş liste — ekrandaki dönem/kullanıcı kapsamı ile uyumlu.
 */
export const exportGeneralReportPdfClient = async (payload) => {
  const hostEl = document.createElement("div");
  hostEl.style.position = "fixed";
  hostEl.style.left = "-12000px";
  hostEl.style.top = "0";
  document.body.appendChild(hostEl);
  ReactDOM.render(<ExpenseGeneralReportPdf {...payload} />, hostEl);
  await new Promise((resolve) => setTimeout(resolve, 220));
  const element = document.getElementById("expense-general-report-root");
  if (!element) {
    ReactDOM.unmountComponentAtNode(hostEl);
    document.body.removeChild(hostEl);
    throw new Error("PDF içeriği oluşturulamadı");
  }
  try {
    await html2pdf()
      .from(element)
      .set({
        margin: [8, 8, 8, 8],
        filename: `MasrafGenelRapor_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .save();
  } finally {
    ReactDOM.unmountComponentAtNode(hostEl);
    document.body.removeChild(hostEl);
  }
};

export const exportExpensesToPdfBackend = async (
  accessToken,
  filters = {}
) => {
  const query = buildExpenseExportQuery(filters).toString();
  const url = `${host}/api/expense/exportToPdf${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok) throw new Error("PDF indirilemedi");
  const blob = await response.blob();
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = "MasrafFormu.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);
};

export const exportExpensesByType = async (
  reportType,
  expenses,
  parseAmount,
  { accessToken, apiFilters, pdfReportContext } = {}
) => {
  const copy = getExpenseCopy();

  if (reportType === "csv") {
    exportExpensesAsCsv(expenses, parseAmount);
    return copy.csvDownloaded;
  }

  if (reportType === "excel") {
    exportExpensesAsXlsxClient(expenses, parseAmount);
    return copy.excelDownloaded;
  }

  if (reportType === "pdf") {
    if (pdfReportContext) {
      await exportGeneralReportPdfClient({
        ...pdfReportContext,
        expenses,
      });
      return copy.pdfDownloaded;
    }
    await exportExpensesToPdfBackend(accessToken, apiFilters);
    return copy.pdfDownloaded;
  }

  throw new Error(`Unknown report type: ${reportType}`);
};
