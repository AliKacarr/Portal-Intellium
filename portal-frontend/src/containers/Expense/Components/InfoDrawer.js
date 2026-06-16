import React, { useRef, useState } from "react";
import { Drawer, Button, Space, Image, message } from "antd";
import html2pdf from "html2pdf.js";
import { FilePdfOutlined, PaperClipOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

import { host } from "../../../Api/host";
import Invoice from "./Invoice";
import InvoiceRequest from "./InvoiceRequest";
import { getExpenseCopy } from "../utils/expenseI18n";

const InfoDrawer = ({ open, close, info }) => {
  const copy = getExpenseCopy();
  const invoiceRef = useRef();
  const [isPreviewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isExportingPdf, setExportingPdf] = useState(false);
  const accessToken = useSelector((state) => state?.Auth?.accessToken);
  const isRequest = Array.isArray(info?.expenses);

  const resolveErrorMessage = (error) => {
    const data = error?.response?.data;
    if (data?.message) return data.message;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      try {
        return JSON.stringify(data);
      } catch {
        return error?.message || "PDF indirilemedi";
      }
    }
    return error?.message || "PDF indirilemedi";
  };

  const getFileNameFromResponse = (response, expenseId) => {
    const disposition =
      response.headers.get("content-disposition") ||
      response.headers.get("Content-Disposition");
    if (disposition) {
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
      }
      const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (asciiMatch?.[1]) {
        return asciiMatch[1];
      }
    }
    return `MasrafRaporu_${expenseId}.pdf`;
  };

  const downloadPdfLocally = async (pdfKey) => {
    // Render eklerini DOM'a basmak için bir tick bekle
    await new Promise((resolve) => setTimeout(resolve, 120));
    const element = invoiceRef.current;
    if (!element) {
      throw new Error(copy.exportError || "PDF content could not be prepared.");
    }
    const options = {
      margin: [10, 10, 10, 10],
      filename: isRequest ? `MasrafTalebi_${pdfKey}.pdf` : `MasrafRaporu_${pdfKey}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    await html2pdf().from(element).set(options).save();
  };

  const downloadPdfFromBackend = async (expenseId) => {
    const response = await fetch(`${host}/api/expense/exportToPdf/${expenseId}`, {
      method: "GET",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

    if (!response.ok) {
      let responseData = null;
      try {
        responseData = await response.json();
      } catch {
        try {
          responseData = await response.text();
        } catch {
          responseData = null;
        }
      }
      const error = {
        response: {
          data: responseData,
          status: response.status,
        },
        message: `Request failed with status code ${response.status}`,
      };
      throw error;
    }

    const blob = await response.blob();
    const fileName = getFileNameFromResponse(response, expenseId);
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || `MasrafRaporu_${expenseId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(fileUrl);
  };

  const downloadPDF = async () => {
    const pdfKey = isRequest ? info?.requestId : info?.id;
    if (!pdfKey) {
      message.error(
        isRequest
          ? copy.requestIdMissing || "Request id not found."
          : copy.expenseIdMissing || "Expense id not found."
      );
      return;
    }

    setExportingPdf(true);

    try {
      // Tasarımın birebir korunması için önce frontend şablonundan üret.
      await downloadPdfLocally(pdfKey);
    } catch (localError) {
      // Talep PDF'i backend tekil endpoint'e düşemez.
      if (isRequest) {
        throw localError;
      }
      // Frontend üretimi başarısız olursa backend tekil endpoint'e düş.
      try {
        await downloadPdfFromBackend(pdfKey);
        message.warning(copy.pdfFallbackWarning || "Local PDF could not be generated; downloaded via backend template.");
      } catch (backendError) {
        // Endpoint yoksa tekrar yerelde dene (render gecikmesi gibi durumlar için).
        if (backendError?.response?.status === 404) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          await downloadPdfLocally(pdfKey);
          return;
        }
        throw backendError;
      }
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadPDF();
    } catch (error) {
      message.error(resolveErrorMessage(error));
    }
  };

  return (
    <Drawer
      forceRender
      destroyOnClose
      onClose={() => close(!open)}
      open={open}
      size="large"
      extra={
        <Space align="center">
          <button
            style={{
              fontSize: "10pt",
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => setPreviewVisible(!isPreviewVisible)}
          >
            <PaperClipOutlined style={{ marginRight: "0.3rem" }} />
            {copy.originalInvoice}
          </button>
          <Button
            className="modal-input"
            icon={<FilePdfOutlined />}
            type="dashed"
            style={{ display: "flex", alignItems: "center" }}
            onClick={handleDownloadPdf}
            loading={isExportingPdf}
          >
            {copy.downloadPdf}
          </Button>
        </Space>
      }
    >
      {isRequest ? (
        <InvoiceRequest
          info={info}
          invoiceRef={invoiceRef}
          includeAttachment
          onReceiptZoom={(src) => {
            setPreviewSrc(src);
            setPreviewVisible(true);
          }}
        />
      ) : (
        <Invoice
          info={info}
          invoiceRef={invoiceRef}
          includeAttachment
          onReceiptZoom={
            info?.imageData
              ? () => {
                  setPreviewSrc(`data:image/png;base64,${info.imageData}`);
                  setPreviewVisible(true);
                }
              : undefined
          }
        />
      )}

      <Image
        style={{ display: "none" }}
        preview={{
          visible: isPreviewVisible,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
        src={previewSrc || (info?.imageData && `data:image/png;base64,${info?.imageData}`)}
      />
    </Drawer>
  );
};

export default InfoDrawer;
