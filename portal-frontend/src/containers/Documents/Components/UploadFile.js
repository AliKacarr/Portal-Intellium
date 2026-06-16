import React, { useEffect, useState, useMemo, useRef } from "react";
import { Checkbox, Modal, Form, Upload, message, Select, List, Spin, Alert } from "antd";
import { useIntl } from "react-intl";
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import { LockOutlined, UserOutlined, InboxOutlined } from "@ant-design/icons";
import { v4 as uniqueId } from "uuid";
import { uploadFile, getDocuments } from "../redux/actionCreators/fileFoldersActionCreator";
import { buildApiUrl } from "../../../Api/host";
import axios from "axios";
import { host } from "../../../Api/host";
import SecureLS from "secure-ls";
const { Dragger } = Upload;

/** Sunucu gövde üst sınırı ile uyumlu; JSON+base64 ~%33 ek yük */
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

const BLOCKED_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "com", "msi", "dll", "scr", "pif", "vbs", "js", "jar", "app", "deb", "rpm",
  "sh", "ps1", "hta", "lnk",
]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "tsv", "rtf", "md",
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "tif", "tiff",
  "odt", "ods", "odp",
  "xml", "json",
]);

/** Tarayıcı bazen application/octet-stream döner; uzantıya göre bilinen MIME */
const EXT_TO_MIME = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  rtf: "application/rtf",
  md: "text/markdown",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  xml: "application/xml",
  json: "application/json",
};

function normalizeTipDataFromDataUrl(fileName, dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return dataUrl;
  }
  const m = /^data:(.*?);base64,(.*)$/s.exec(dataUrl);
  if (!m) return dataUrl;
  let mime = m[1].split(";")[0].trim().toLowerCase();
  const b64 = m[2];
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (mime === "application/octet-stream" && EXT_TO_MIME[ext]) {
    mime = EXT_TO_MIME[ext];
  }
  return `data:${mime};base64,${b64}`;
}

/**
 * Form.Item file değerini bazen `value` olarak geçirebiliyor; antd 4.24+ Upload yalnızca `fileList` kabul eder.
 */
const FileDragger = ({ value, fileList, onChange, ...rest }) => {
  const list =
    fileList !== undefined && fileList !== null
      ? fileList
      : Array.isArray(value)
        ? value
        : undefined;
  return <Dragger fileList={list} onChange={onChange} {...rest} />;
};

const UploadFile = ({ open, close, actionMessage, targetUserId }) => {
  const intl = useIntl();

  const { Item } = Form;
  const [form] = Form.useForm();
  const [isPublic, setIsPublic] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [success, setSuccess] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [shareUserOptions, setShareUserOptions] = useState([{ label: intl.formatMessage({ id: "documents.common.everyone" }), value: "all" }]);
  const isMounted = useRef(true);
  /** Başarılı yüklemeden sonra modal animasyonu bitince documents:refresh tetiklenecek */
  const pendingDocumentsRefreshRef = useRef(false);
  const { userFiles, currentFolder, currentFolderData } = useSelector(
    (state) => ({
      userFiles: state.filefolders.userFiles,
      currentFolder: state.filefolders.currentFolder,
      currentFolderData: state.filefolders.userFolders.find(
        (folder) => folder.folderId === state.filefolders.currentFolder
      ),
    }),
    shallowEqual
  );
  useEffect(() => {
    if (success) {
      setSuccess(false);
      if (isMounted.current) {
        close(false);
      }
    }
  }, [success]);

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
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setIsPublic(false);
    setIsCustom(false);
  }, [open]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!open) return;
      // sadece "Paylaş" seçildiyse açılacak alan; yine de listeyi hazır tutalım
      try {
        const res = await axiosAuth.get("/api/Users/getuserlist");
        const payload = res?.data;
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        const opts = [
          { label: intl.formatMessage({ id: "documents.common.everyone" }), value: "all" },
          ...list
            .filter((u) => u?.id != null)
            .map((u) => ({
              label: u.name || u.fullName || u.email || `${intl.formatMessage({ id: "documents.common.user" })} #${u.id}`,
              value: String(u.id),
            })),
        ];
        if (isMounted.current) setShareUserOptions(opts);
      } catch {
        if (isMounted.current) setShareUserOptions([{ label: intl.formatMessage({ id: "documents.common.everyone" }), value: "all" }]);
      }
    };
    fetchUsers();
  }, [open, axiosAuth]);

  const dispatch = useDispatch();


  const checkFileAlreadyExists = (name) => {
    const filePresent = userFiles
      ?.filter((file) => file.parent === currentFolder)
      .find((file) => file.name === name);
    return !!filePresent;
  };

  const handleOk = () => {
    form.submit();
  };

  const handleCancel = () => {
    setIsPublic(false);
    setIsCustom(false);
    close(false);
  };

  const checkPrivacy = () => {
    // Paylaş özelliği şimdilik gizli → hep private
    form.setFieldValue("file_privacy", "private");
    form.setFieldValue("share_list", ["all"]);
    setIsPublic(false);
  };

  const onFinish = (values) => {
    if (values.file && values.file.length > 0) {
      const file = values.file[0].originFileObj;
      if (!checkFileAlreadyExists(file.name)) {
        const reader = new FileReader();

        reader.onloadend = () => {
          if (!isMounted.current) {
            return;
          }
          const dataUrl =
            typeof reader.result === "string" ? reader.result : "";
          if (!dataUrl.startsWith("data:")) {
            if (isMounted.current) {
              actionMessage(intl.formatMessage({ id: "documents.errors.fileReadFailed" }), "error");
            }
            return;
          }
          const tipData = normalizeTipDataFromDataUrl(file.name, dataUrl);
          const fileNameParts = file.name.split(".");
          const extension =
            fileNameParts.length > 1 ? fileNameParts.pop().toLowerCase() : "txt";

          let effectiveUserId = Number(targetUserId);
          if (!Number.isFinite(effectiveUserId) || effectiveUserId <= 0) {
            try {
              const ls = new SecureLS({ encodingType: "aes" });
              const id = Number(ls.get("id"));
              effectiveUserId = Number.isFinite(id) ? id : 0;
            } catch {
              effectiveUserId = 0;
            }
          }

          const data = {
            UserId: effectiveUserId,
            CustomerId: 0,
            Name: file.name,
            Description: "",
            Position: "",
            Action: "Created",
            Color: isCustom ? values.file_color : "rgb(37,112,182)",
            ShareWith: "all",
            Privacy: "private",
            Type: extension,
            TipData: tipData,
            //parent: 152,
            Path: `/docs/${file.name}`,
            Parent: currentFolder && currentFolder !== "root" ? Number(currentFolder) : 0,
            IsActive: true,
          };

          axiosAuth
            .post("/api/Document/add", data)
            .then(() => {
              if (!isMounted.current) return;
              actionMessage(`${file.name} ${intl.formatMessage({ id: "documents.messages.uploaded" })}`, "success");
              pendingDocumentsRefreshRef.current = true;
              window.setTimeout(() => {
                if (isMounted.current) close(false);
              }, 0);
            })
            .catch((error) => {
              if (!isMounted.current) return;
              console.error(error);
              actionMessage(
                `${intl.formatMessage({ id: "documents.errors.uploadFailedPrefix" })}: ` +
                  (error?.response?.data?.message || error?.message || intl.formatMessage({ id: "documents.errors.unknown" })),
                "error"
              );
            });
        };

        reader.readAsDataURL(file);
      } else {
        actionMessage(
          `${values.file[0].name} ${intl.formatMessage({ id: "documents.errors.sameFileName" })}`,
          "error"
        );
      }
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <>
      <Modal
        className="documents__popup-modal"
        centered
        destroyOnClose
        title={intl.formatMessage({ id: "documents.actions.uploadFile" })}
        open={open}
        onOk={handleOk}
        okText={intl.formatMessage({ id: "documents.actions.upload" })}
        onCancel={handleCancel}
        afterClose={() => {
          if (!pendingDocumentsRefreshRef.current) return;
          pendingDocumentsRefreshRef.current = false;
          window.dispatchEvent(new Event("documents:refresh"));
        }}
        okButtonProps={{ className: "modal-input" }}
        cancelButtonProps={{ className: "modal-input" }}
      >
        <Form
          onFinish={onFinish}
          layout="vertical"
          name="new_file"
          form={form}
          initialValues={{
            file_color: "#000000",
            file_privacy: "private",
            share_list: ["all"],
          }}
        >

          <Item
            label={intl.formatMessage({ id: "documents.labels.uploadFile" })}
            name="file"
            rules={[{ required: true, message: intl.formatMessage({ id: "documents.validation.uploadRequired" }) }]}
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <FileDragger
              maxCount={1}
              beforeUpload={(file) => {
                if (file.size > MAX_UPLOAD_BYTES) {
                  message.error(
                    intl.formatMessage(
                      { id: "documents.validation.maxSize" },
                      { mb: MAX_UPLOAD_BYTES / (1024 * 1024) }
                    )
                  );
                  return Upload.LIST_IGNORE;
                }
                const ext = (file.name.split(".").pop() || "").toLowerCase();
                if (!ext || BLOCKED_EXTENSIONS.has(ext)) {
                  message.error(
                    intl.formatMessage({ id: "documents.validation.blockedExtension" })
                  );
                  return Upload.LIST_IGNORE;
                }
                if (!ALLOWED_EXTENSIONS.has(ext)) {
                  message.error(
                    intl.formatMessage({ id: "documents.validation.unsupportedExtension" }, { ext })
                  );
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
              multiple={false}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.tsv,.rtf,.md,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tif,.tiff,.odt,.ods,.odp,.xml,.json"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {intl.formatMessage({ id: "documents.upload.hintPrimary" })}
              </p>
              <p className="ant-upload-hint">
                {intl.formatMessage(
                  { id: "documents.upload.hintSecondary" },
                  { mb: MAX_UPLOAD_BYTES / (1024 * 1024) }
                )}
              </p>
            </FileDragger>
          </Item>
          {/* Paylaş/Gizlilik şimdilik kapalı */}
          <Item style={{ margin: !isCustom && "0" }}>
            <Checkbox
              checked={isCustom}
              onChange={(e) => {
                setIsCustom(e.target.checked);
                form.setFieldValue("file_color", "#000000");
              }}
            >
              {intl.formatMessage({ id: "documents.actions.customize" })}
            </Checkbox>
          </Item>
          <Item
            label={intl.formatMessage({ id: "documents.labels.fileColor" })}
            style={{ display: isCustom ? "block" : "none", margin: "0" }}
            name={"file_color"}
          >
            <input type="color" />
          </Item>
        </Form>
      </Modal>
    </>
  );
};

export default UploadFile;
