import React, { useMemo, useState, useEffect } from "react";
import { useIntl } from "react-intl";

//icons
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Button, Modal, Drawer, Space, Spin, Input } from "antd";
//==== icons =====

import axios from "axios";
import { host } from "../../../Api/host";
import SecureLS from "secure-ls";

/** API'deki byte[] JSON base64'ünden UTF-8 metin (Türkçe karakterler dahil) */
const utf8Base64ToString = (b64) => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
};

const stringToUtf8Base64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const MIME_BY_EXT = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
};

const OFFICE_PREVIEW_EXTS = new Set([
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "odp",
]);

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "tif", "tiff"]);

function extensionFromName(name) {
  if (!name || typeof name !== "string") return "";
  const i = name.lastIndexOf(".");
  if (i < 0 || i === name.length - 1) return "";
  return name.slice(i + 1).toLowerCase();
}

/** API byte[] (base64) veya data: URL → Blob (uzun data: URL iframe’de boş kalabiliyor) */
function base64OrDataUrlToBlob(input, mimeFallback) {
  if (input == null || input === "") throw new Error("empty");
  if (Array.isArray(input)) {
    return new Blob([new Uint8Array(input)], { type: mimeFallback });
  }
  const str = String(input).trim();
  let mime = mimeFallback;
  let b64 = str;
  const m = /^data:([^;]+);base64,(.*)$/s.exec(str);
  if (m) {
    mime = m[1].trim().split(";")[0];
    b64 = m[2].replace(/\s/g, "");
  } else {
    b64 = str.replace(/\s/g, "");
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime.split(";")[0] || mimeFallback });
}

/**
 * Txt: önce normal UTF-8 bayt.
 * Eski bug: sunucu tüm "data:text/plain;base64,..." dizesini UTF-8 bayt olarak tutmuştu — iç içe base64'ü aç.
 */
const decodePlainTextFileFromTip = (rawTip) => {
  if (rawTip == null || rawTip === "") return "";
  const b64 =
    typeof rawTip === "string" && rawTip.startsWith("data:")
      ? (rawTip.split(",")[1] || "").trim()
      : String(rawTip).trim();
  if (!b64) return "";
  let text;
  try {
    text = utf8Base64ToString(b64);
  } catch {
    return "";
  }
  if (text.startsWith("data:text/plain;base64,")) {
    const inner = text.slice("data:text/plain;base64,".length).trim();
    try {
      return utf8Base64ToString(inner);
    } catch {
      try {
        return atob(inner);
      } catch {
        return text;
      }
    }
  }
  return text;
};

// API camelCase (id) döndürüyor; eski kod Id bekliyordu — ikisini de kabul et
const FileViewer = ({ open, close, Id, id, showMessage }) => {
  const intl = useIntl();
  const documentId = Id ?? id;
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [screenSize, setScreenSize] = useState(window.innerWidth / 2);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState(null);
  const [data, setData] = useState("");
  const [checkData, setCheckData] = useState("");
  const [changedDataCloseModal, setChangedDataCloseModal] = useState(false);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const axiosAuth = useMemo(() => {
    let token;
    try {
      const ls = new SecureLS({ encodingType: "aes" });
      token = ls.get("accessToken");
    } catch {
      token = undefined;
    }
    token = token || localStorage.getItem("token") || localStorage.getItem("accessToken");
    return axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, []);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!open || documentId == null || documentId === "") return;
      setLoading(true);
      try {
        const res = await axiosAuth.get(`/api/Document/GetById`, {
          params: { Id: documentId },
        });
        const payload = res?.data?.data ?? res?.data?.Data ?? res?.data;
        setDoc(payload || null);

        // txt ise edit alanını dolduralım
        const t = (payload?.type || payload?.Type || "").toLowerCase();
        const rawTip = payload?.tipData ?? payload?.TipData;
        if (t === "txt" && rawTip) {
          const text = decodePlainTextFileFromTip(rawTip);
          setData(text);
          setCheckData(text);
        } else {
          setData("");
          setCheckData("");
        }
        setIsFullScreen(false);
      } catch (e) {
        setDoc(null);
        showMessage?.(intl.formatMessage({ id: "documents.errors.fileContentFetchFailed" }), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [open, documentId, axiosAuth, showMessage]);

  /** PDF/görsel/Office için blob: URL — çok uzun data: URL iframe’de güvenilir değil */
  useEffect(() => {
    const clearPreview = () => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };

    if (!open) {
      clearPreview();
      return undefined;
    }
    if (loading || !doc) {
      clearPreview();
      return undefined;
    }

    const apiType = (doc.type || doc.Type || "").toLowerCase();
    const name = doc.name || doc.Name || "";
    const effectiveType = apiType || extensionFromName(name);
    if (apiType === "folder" || apiType === "txt" || effectiveType === "txt") {
      clearPreview();
      return undefined;
    }

    const rawTip = doc.tipData ?? doc.TipData;
    if (rawTip == null || rawTip === "") {
      clearPreview();
      return undefined;
    }

    let objectUrl = null;
    try {
      const mime =
        MIME_BY_EXT[effectiveType] || "application/octet-stream";
      const blob = base64OrDataUrlToBlob(rawTip, mime);
      objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
    } catch {
      clearPreview();
      return undefined;
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    };
  }, [open, doc, loading]);

  useEffect(() => {
    handleSaveButtonDisabled();
  }, [open]);
  useEffect(() => {
    handleSaveButtonDisabled();
  }, [data, open]);
  //==== editor text ====
  //==== change theme ====
  const handleCheckBeforeClose = () => {
    if (checkData === data) {
      setChangedDataCloseModal(false);
      close(false);
    } else {
      setChangedDataCloseModal(true);
    }
  };
  const handleSaveButtonDisabled = () => {
    if (checkData !== data) {
      setIsSaveDisabled(false);
    } else {
      setIsSaveDisabled(true);
    }
  };
  const onClose = () => {
    handleCheckBeforeClose();
  };
  useEffect(() => {
    if (isFullScreen) {
      setScreenSize(window.innerWidth);
    } else {
      setScreenSize(window.innerWidth / 2);
    }
  }, [isFullScreen]);
  const handleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const title = doc?.name || doc?.Name || `${intl.formatMessage({ id: "documents.labels.file" })} #${documentId ?? ""}`;
  const type = (doc?.type || doc?.Type || "").toLowerCase();
  const effectiveType =
    type || extensionFromName(doc?.name || doc?.Name || "");

  return (
    <>
      <Drawer
        destroyOnClose={true}
        className="file-viewer"
        title={checkData === data ? title : `${title}*`}
        width={screenSize}
        onClose={onClose}
        open={open}
        bodyStyle={{
          paddingBottom: 80,
        }}
        extra={
          <Space>
            <Button
              onClick={handleFullScreen}
              className="modal-input"
              icon={
                isFullScreen ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
            />
            <Button
              icon={<SaveOutlined />}
              className="modal-input"
              onClick={async () => {
                if (type !== "txt") return;
                try {
                  const payload = {
                    Id: doc?.id ?? doc?.Id ?? Number(documentId),
                    UserId: doc?.userId ?? doc?.UserId ?? 0,
                    CustomerId: doc?.customerId ?? doc?.CustomerId ?? 0,
                    Name: doc?.name ?? doc?.Name,
                    Description: doc?.description ?? doc?.Description,
                    Position: doc?.position ?? doc?.Position,
                    Action: doc?.action ?? doc?.Action,
                    Color: doc?.color ?? doc?.Color,
                    ShareWith: doc?.shareWith ?? doc?.ShareWith,
                    Privacy: doc?.privacy ?? doc?.Privacy,
                    Type: doc?.type ?? doc?.Type,
                    Path: doc?.path ?? doc?.Path,
                    Parent: doc?.parent ?? doc?.Parent ?? 0,
                    IsActive: doc?.isActive ?? doc?.IsActive ?? true,
                    TipData: `data:text/plain;base64,${stringToUtf8Base64(
                      data || ""
                    )}`,
                  };
                  await axiosAuth.put(
                    `/api/Document/update/${documentId}`,
                    payload
                  );
                  setCheckData(data);
                  showMessage?.(intl.formatMessage({ id: "documents.messages.saved" }), "success");
                } catch (err) {
                  console.log(err);
                  showMessage?.(intl.formatMessage({ id: "documents.errors.saveFailed" }), "error");
                }
              }}
              disabled={type !== "txt" || isSaveDisabled}
            >
              {intl.formatMessage({ id: "documents.actions.save" })}
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : type === "folder" ? (
          <div style={{ padding: 16, color: "#666" }}>{intl.formatMessage({ id: "documents.messages.folderNoPreview" })}</div>
        ) : type === "txt" ? (
          <Input.TextArea
            value={data}
            onChange={(e) => setData(e.target.value)}
            rows={24}
            placeholder={intl.formatMessage({ id: "documents.placeholders.textContent" })}
          />
        ) : previewUrl && effectiveType === "pdf" ? (
          <iframe
            title={title}
            src={previewUrl}
            style={{ width: "100%", height: "80vh", border: 0 }}
          />
        ) : previewUrl && IMAGE_EXTS.has(effectiveType) ? (
          <img
            alt={title}
            src={previewUrl}
            style={{ maxWidth: "100%", maxHeight: "80vh", display: "block", margin: "0 auto" }}
          />
        ) : previewUrl && OFFICE_PREVIEW_EXTS.has(effectiveType) ? (
          <div style={{ padding: 16, color: "#666" }}>
            <p style={{ marginBottom: 16 }}>
              {intl.formatMessage({ id: "documents.messages.officePreviewHint" })}
            </p>
            <Button type="primary" href={previewUrl} download={title}>
              {intl.formatMessage({ id: "documents.actions.download" })}
            </Button>
          </div>
        ) : (
          <div style={{ padding: 16, color: "#666" }}>
            {intl.formatMessage({ id: "documents.messages.noPreviewForType" })}
          </div>
        )}
        <Modal
          title={intl.formatMessage({ id: "documents.labels.warning" })}
          centered
          open={changedDataCloseModal}
          okButtonProps={{ className: "modal-input" }}
          cancelButtonProps={{ className: "modal-input" }}
          okText={intl.formatMessage({ id: "customer.search.close" })}
          okType="danger"
          onOk={() => {
            setChangedDataCloseModal(false);
            close(false);
          }}
          onCancel={() => setChangedDataCloseModal(false)}
        >
          {intl.formatMessage({ id: "documents.messages.closeWithoutSaving" })}
        </Modal>
      </Drawer>
    </>
  );
};
export default FileViewer;