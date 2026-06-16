import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Space,
  Segmented,
  Spin,
  Table,
  Modal,
  Badge,
  Dropdown,
  Input,
  Form,
} from "antd";
import { StyledDivider, DocumentContainer } from "../Documents.styles";
//Icons
import {
  AppstoreOutlined,
  BarsOutlined,
  FolderFilled,
  FileTextFilled,
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
  InfoCircleOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
//==== Icons ====

//Style div
import {
  DocumentContainerHeader,
  DocumentCardVertical,
} from "../Documents.styles";
import { isOpenableDocumentType } from "./openableDocumentTypes";
import {
  buildDocumentUpdatePayload,
  getDocumentType,
  isDocumentFolder,
  touchDocumentUpdatedAt,
} from "../documentRowUtils";
//==== Styled div =====

//Redux
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { changeFolder, createFile } from "../redux/actionCreators/fileFoldersActionCreator";
import { renameDocument } from "../redux/actionCreators/fileFoldersActionCreator";
import { deleteFile } from "../redux/actionCreators/fileFoldersActionCreator"; //delete file and folder also
import { useParams } from "react-router-dom";
import { copyDocument } from "../redux/actionCreators/fileFoldersActionCreator";
import { pasteDocument } from "../redux/actionCreators/fileFoldersActionCreator";
import { cutDocument } from "../redux/actionCreators/fileFoldersActionCreator";
import { moveDocument } from "../redux/actionCreators/fileFoldersActionCreator";

//==== Redux ====


//Component
import FileViewer from "./FileViewer";
import DetailsModal from "./DetailsModal";
import {
  formatDocumentDate,
  normalizeDocumentList,
  pickDocumentDate,
} from "../documentDateUtils";
import { buildApiUrl } from "../../../Api/host";
import axios from "axios";
import { host } from "../../../Api/host";
import SecureLS from "secure-ls";
import { useIntl } from "react-intl";

//==== Component ====

const FolderView = ({
  showMessage,
  search,
  setWillBePasted,
  willBePasted,
  setWillBeCutDocument,
  willBeCutDocument,
  targetUserId,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { Id } = useParams();
  // URL'deki klasör, modal'ların Parent değeriyle aynı olmalı (yeni dosya / yükleme).
  useEffect(() => {
    if (Id != null && Id !== "") {
      dispatch(changeFolder(Id));
    }
  }, [Id, dispatch]);
  const [isList, setIsList] = useState(false);
  const navigate = useHistory();
  const [openFileViewerDrawer, setOpenFileViewerDrawer] = useState(false);
  const [fileWillBeViewed, setFileWillBeViewed] = useState(null);
  const [openCreateFileModal, setOpenCreateFileModal] = useState(false);
  const [openCreateFolderModal, setOpenCreateFolderModal] = useState(false);
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [clipboardBusy, setClipboardBusy] = useState(false);
  const [renameBusy, setRenameBusy] = useState(false);
  /** Geri satırında gösterilecek tam yol (üst breadcrumb ile uyumlu) */
  const [folderPathLabel, setFolderPathLabel] = useState("");
  const {
    currentFolderData,
    childFolders,
    childFiles,
    currentFolder,
    copiedDocument,
    cuttedDocument,
    userFolders,
  } = useSelector((state) => {
    const filefolders = state.filefolders || {};
    const userFoldersInner = filefolders.userFolders || [];
    const userFiles = filefolders.userFiles || [];
    const currentId = filefolders.currentFolder;
    return {
      currentFolderData: userFoldersInner.find(
        (folder) => folder.Id == currentId || folder.id == currentId
      ),
      childFolders: userFoldersInner.filter((folder) => folder.parent == currentId),
      childFiles: userFiles.filter((file) => file.parent == currentId),
      currentFolder: currentId && currentId !== "root" ? currentId : null,
      copiedDocument: filefolders.copiedDocument || null,
      cuttedDocument: filefolders.cuttedDocument || null,
      userFolders: userFoldersInner,
    };
  }, shallowEqual);

  const effectiveCopied = willBePasted || copiedDocument;
  const effectiveCutted = willBeCutDocument || cuttedDocument;

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

  const selfUserId = useMemo(() => {
    try {
      const ls = new SecureLS({ encodingType: "aes" });
      const v = ls.get("id");
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    } catch {
      const v = localStorage.getItem("id");
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
  }, []);

  useEffect(() => {
    const rootLabel = intl.formatMessage({ id: "documents.common.title" });
    const idParam = Id != null && Id !== "" ? String(Id) : "";
    if (!idParam) {
      setFolderPathLabel(rootLabel);
      return;
    }

    const normalizeId = (v) => (v == null ? null : String(v));
    const findFolder = (fid) =>
      userFolders.find((f) => normalizeId(f?.Id ?? f.id) === normalizeId(fid));

    const pathFromRedux = () => {
      const start = findFolder(idParam);
      if (!start) return null;
      const segments = [];
      const visited = new Set();
      let cursor = start;
      while (cursor) {
        segments.unshift(String(cursor?.name ?? cursor?.Name ?? "").trim() || `#${cursor?.Id ?? cursor?.id}`);
        const pid = cursor.parent ?? cursor.Parent ?? 0;
        const pidNorm = normalizeId(pid);
        if (!pid || pidNorm === "0" || pidNorm === "root") break;
        if (visited.has(pidNorm)) break;
        visited.add(pidNorm);
        const parent = findFolder(pidNorm);
        if (!parent) break;
        cursor = parent;
      }
      return [rootLabel, ...segments].join(" / ");
    };

    if (userFolders.length > 0) {
      const p = pathFromRedux();
      if (p) {
        setFolderPathLabel(p);
        return;
      }
    }

    let cancelled = false;
    (async () => {
      const names = [];
      const visited = new Set();
      let cursorId = Number(idParam);
      for (let i = 0; i < 30 && Number.isFinite(cursorId) && cursorId > 0; i++) {
        if (visited.has(cursorId)) break;
        visited.add(cursorId);
        try {
          const res = await axiosAuth.get("/api/Document/GetById", { params: { Id: cursorId } });
          const payload = res?.data?.data ?? res?.data?.Data ?? res?.data ?? null;
          const item = payload?.data ?? payload?.Data ?? payload;
          if (!item) break;
          const name = String(item?.name ?? item?.Name ?? "").trim() || `#${cursorId}`;
          names.unshift(name);
          const parent = item?.parent ?? item?.Parent ?? 0;
          const pNum = Number(parent);
          if (!Number.isFinite(pNum) || pNum <= 0) break;
          cursorId = pNum;
        } catch {
          break;
        }
      }
      if (!cancelled) {
        setFolderPathLabel([rootLabel, ...names].filter(Boolean).join(" / "));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [Id, currentFolderData, userFolders, axiosAuth, intl]);

  const EXT_TO_MIME = useMemo(
    () => ({
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
    }),
    []
  );

  const buildTipDataForAdd = (item) => {
    const t = (item?.type ?? item?.Type ?? "").toLowerCase();
    const raw = item?.tipData ?? item?.TipData ?? "";
    if (t === "folder") return `data:folder;base64,${btoa("folder")}`;
    if (typeof raw === "string" && raw.startsWith("data:")) return raw;
    const mime = EXT_TO_MIME[t] || "application/octet-stream";
    return `data:${mime};base64,${raw}`;
  };

  const buildCopyName = (baseName, existingNames) => {
    const name = String(baseName || "").trim();
    if (!name) return "kopya";
    const dot = name.lastIndexOf(".");
    const hasExt = dot > 0 && dot < name.length - 1;
    const stem = hasExt ? name.slice(0, dot) : name;
    const ext = hasExt ? name.slice(dot) : "";
    let candidate = `${stem} (kopya)${ext}`;
    let i = 1;
    while (existingNames.has(candidate)) {
      candidate = `${stem} (kopya ${i})${ext}`;
      i += 1;
    }
    return candidate;
  };

  const handlePasteAction = async () => {
    if (clipboardBusy) return;
    setClipboardBusy(true);
    try {
      const parent = Id ? Number(Id) : 0;
      const existingNames = new Set((allData || []).map((d) => d?.name ?? d?.Name).filter(Boolean));

      if (effectiveCopied) {
        const source = effectiveCopied;
        const newName = buildCopyName(source?.name ?? source?.Name, existingNames);
        const payload = {
          UserId: source?.userId ?? source?.UserId ?? targetUserId ?? selfUserId ?? 0,
          CustomerId: source?.customerId ?? source?.CustomerId ?? 0,
          Name: newName,
          Description: source?.description ?? source?.Description ?? "Copy",
          Position: source?.position ?? source?.Position ?? "",
          Action: "Created",
          Color: source?.color ?? source?.Color ?? "rgb(37,112,182)",
          ShareWith: "all",
          Privacy: "private",
          Type: source?.type ?? source?.Type,
          TipData: buildTipDataForAdd(source),
          Path: `/docs/${newName}`,
          Parent: parent,
          IsActive: true,
        };
        await axiosAuth.post("/api/Document/add", payload);
        dispatch(copyDocument(null));
        dispatch(cutDocument(null));
        setWillBePasted(null);
        setWillBeCutDocument(null);
        showMessage("Kopyalandı ve yapıştırıldı", "success");
        fetchFolder();
        return;
      }

      if (effectiveCutted) {
        const source = effectiveCutted;
        const id = source?.id ?? source?.Id;
        await axiosAuth.put(`/api/Document/update/${id}`, {
          ...source,
          Parent: parent,
          parent,
          tipData: "",
          TipData: "",
        });
        dispatch(copyDocument(null));
        dispatch(cutDocument(null));
        setWillBePasted(null);
        setWillBeCutDocument(null);
        showMessage("Taşındı", "success");
        fetchFolder();
        return;
      }

      // Menü disabled olacağı için normalde buraya düşmemeli.
    } catch (e) {
      console.error("Paste error:", e);
      showMessage("Yapıştırma işlemi başarısız", "error");
    } finally {
      setClipboardBusy(false);
    }
  };

  const handleBack = async () => {
    // Öncelik: redux'ta currentFolderData varsa parent'ı kullan.
    let parent = currentFolderData?.parent ?? currentFolderData?.Parent ?? null;

    // Redux boşsa: URL'deki Id üzerinden API'den parent'ı çek.
    if (parent == null) {
      const idNum = Id ? Number(Id) : 0;
      if (Number.isFinite(idNum) && idNum > 0) {
        try {
          const res = await axiosAuth.get("/api/Document/GetById", { params: { Id: idNum } });
          const payload = res?.data?.data ?? res?.data?.Data ?? res?.data ?? null;
          const item = payload?.data ?? payload?.Data ?? payload;
          parent = item?.parent ?? item?.Parent ?? 0;
        } catch {
          parent = 0;
        }
      } else {
        parent = 0;
      }
    }

    if (!parent || String(parent) === "0" || String(parent) === "root") {
      dispatch(changeFolder("root"));
      navigate.push("/dashboard/documents");
      return;
    }
    dispatch(changeFolder(parent));
    navigate.push(`/dashboard/folder/${parent}`);
  };

  //merge data
  const getUserData = (state) => {
    const folders = childFolders;
    const files = childFiles;
    return [...folders, ...files];
  };

  //==== merge data =====

  //display data
  const handleFilter = () => {
    const searchTerm = typeof search === 'string' ? search.toLowerCase() : '';
    const filtered = allData.filter((item) => {
      const name = item.name ? item.name.toLowerCase() : '';
      const type = item.type ? item.type.toLowerCase() : '';
      const searchMatch = name.includes(searchTerm) || type.includes(searchTerm);
      return searchMatch;
    });
    setFilteredData(filtered);
  };


  const fetchFolder = () => {
    axiosAuth
      .get("/api/Document/GetDocumentsByParent", {
        params: { parent: Id ? Number(Id) : 0, userId: targetUserId || undefined },
      })
      .then((res) => {
        const payload = res?.data;
        const list = payload?.data || payload?.Data || [];
        const normalized = normalizeDocumentList(list);
        setAllData(normalized);
        setFilteredData(normalized);
      })
      .catch((error) => console.error("Error fetching documents:", error));
  };

  useEffect(() => {
    fetchFolder();
    const handler = () => fetchFolder();
    window.addEventListener("documents:refresh", handler);
    return () => window.removeEventListener("documents:refresh", handler);
  }, [Id, targetUserId]);


  useEffect(() => {
    handleFilter();
  }, [search, allData]);



  //=== display data ====
  //Actions on document
  const [willBeViewDetail, setWillBeViewDetail] = useState("");
  const [documentDetailsModal, setDocumentDetailsModal] = useState(false);
  const [willBeDeleted, setWillBeDeleted] = useState("");
  const [openDeleteConfirmModal, setOpenDeleteConfirmModal] = useState(false);
  const [openRenameModal, setOpenRenameModal] = useState(false);
  const [willBeRenamed, setWillBeRenamed] = useState("");

  const [form] = Form.useForm();
  const checkFileAlreadyExists = (name, ext) => {
    if (!ext) {
      name = name + ".txt";
    }
    const filePresent = childFiles
      ?.filter((file) => file.parent == Id)
      .find((file) => file.name === name);
    if (filePresent) {
      return true;
    } else return false;
  };
  const checkFolderAlreadyExists = (name) => {
    const folderPresent = childFolders
      ?.filter((folder) => folder.name === name)
      .find(
        (folder) => folder.name === name && folder.parent == Id
      );
    if (folderPresent) {
      return true;
    } else return false;
  };
  const handleRenameFinish = (values) => {
    if (renameBusy) return;
    setRenameBusy(true);
    const renamedId = willBeRenamed?.id ?? willBeRenamed?.Id;
    if (isDocumentFolder(willBeRenamed)) {
      if (!checkFolderAlreadyExists(values.new_name.trim())) {
        const nextName = values.new_name.trim();
        axiosAuth
          .put(`/api/Document/update/${renamedId}`, buildDocumentUpdatePayload(willBeRenamed, nextName))
          .then(() => {
            setAllData((prev) =>
              (prev || []).map((d) => {
                const id = d?.id ?? d?.Id;
                return id === renamedId
                  ? touchDocumentUpdatedAt({ ...d, name: nextName, Name: nextName, type: "folder", Type: "folder" })
                  : d;
              })
            );
            setFilteredData((prev) =>
              (prev || []).map((d) => {
                const id = d?.id ?? d?.Id;
                return id === renamedId
                  ? touchDocumentUpdatedAt({ ...d, name: nextName, Name: nextName, type: "folder", Type: "folder" })
                  : d;
              })
            );
            setOpenRenameModal(false);
            showMessage("Başarılı bir şekilde güncellendi", "success");
            setWillBeRenamed("");
            form.resetFields();
            fetchFolder();
          })
          .catch((err) => {
            console.error("Rename error:", err);
            showMessage("Güncelleme işlemi başarısız", "error");
          })
          .finally(() => setRenameBusy(false));
      } else {
        showMessage(
          values.new_name + " ile aynı isimde bir klasör vardır.",
          "error"
        );
        setRenameBusy(false);
      }
    } else {
      let extension = false;
      if (values.new_name.split(".").length > 1) {
        extension = true;
      }
      if (!checkFileAlreadyExists(values.new_name.trim(), extension)) {
        const nextName = values.new_name.trim();
        axiosAuth
          .put(`/api/Document/update/${renamedId}`, buildDocumentUpdatePayload(willBeRenamed, nextName))
          .then(() => {
            setAllData((prev) =>
              (prev || []).map((d) => {
                const id = d?.id ?? d?.Id;
                return id === renamedId ? touchDocumentUpdatedAt({ ...d, name: nextName, Name: nextName }) : d;
              })
            );
            setFilteredData((prev) =>
              (prev || []).map((d) => {
                const id = d?.id ?? d?.Id;
                return id === renamedId ? touchDocumentUpdatedAt({ ...d, name: nextName, Name: nextName }) : d;
              })
            );
            setOpenRenameModal(false);
            showMessage("Başarılı bir şekilde güncellendi", "success");
            setWillBeRenamed("");
            form.resetFields();
            fetchFolder();
          })
          .catch((err) => {
            console.error("Rename error:", err);
            showMessage("Güncelleme işlemi başarısız", "error");
          })
          .finally(() => setRenameBusy(false));
      } else {
        showMessage(
          values.new_name + " ile aynı isimde bir dosya vardır.",
          "error"
        );
        setRenameBusy(false);
      }
    }
  };

  const handleDownloadFile = (file) => {
    fetch(buildApiUrl(`/api/Document/add/${file.Id}`))
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        showMessage(`${file.name} başarıyla indirildi`, "success");
      })
      .catch((error) => {
        console.error("İndirme işlemi sırasında hata oluştu:", error);
        showMessage("İndirme işlemi sırasında bir hata oluştu", "error");
      });
  };

  //==== Actions on document =====
  // const { isLoading } = useSelector(
  //   (state) => ({
  //     isLoading: state.filefolders?.isLoading ?? false,
  //   }),
  //   shallowEqual
  // );


  const handleDoubleClick = (item) => {
    const itemId = item.id ?? item.Id;
    const fileType = getDocumentType(item);
    if (fileType === "folder") {
      dispatch(changeFolder(itemId));
      navigate.push(`/dashboard/folder/${itemId}`);
    } else if (isOpenableDocumentType(fileType)) {
      setOpenFileViewerDrawer(true);
      setFileWillBeViewed(itemId);
    } else {
      showMessage("Bu formattaki dosyalar açılamıyor", "error");
    }
  };
  const columns = [
    {
      title: "Ad",
      dataIndex: "name",
      width: "50%",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => {
        return (
          <span style={{ display: "flex", alignItems: "center" }}>
            {isDocumentFolder(record) ? (
              <FolderFilled
                style={{
                  fontSize: "1.5rem",
                  color: record.color,
                  marginRight: "0.5rem",
                }}
              />
            ) : (
              <FileTextFilled
                style={{
                  fontSize: "1.5rem",
                  color: record.color,
                  marginRight: "0.5rem",
                }}
              />
            )}

            {record?.name}
          </span>
        );
      },
    },
    {
      title: "Oluşturma Tarihi",
      dataIndex: "createdAt",
      sorter: (a, b) =>
        new Date(pickDocumentDate(a, "createdAt")) - new Date(pickDocumentDate(b, "createdAt")),
      render: (_, record) => formatDocumentDate(pickDocumentDate(record, "createdAt")),
      align: "center",
    },
    {
      title: "Güncelleme Tarihi",
      dataIndex: "updatedAt",
      sorter: (a, b) =>
        new Date(pickDocumentDate(a, "updatedAt")) - new Date(pickDocumentDate(b, "updatedAt")),
      render: (_, record) => formatDocumentDate(pickDocumentDate(record, "updatedAt")),
      align: "center",
    },
    {
      title: "Tip",
      dataIndex: "type",
      sorter: (a, b) => {
        const typeA = a.type || "";
        const typeB = b.type || "";
        return typeA.localeCompare(typeB);
      },
      render: (_, record) => {
        return <>{(record.type || "").toUpperCase()}</>;
      },
      align: "center",
    },
    {
      title: "Aksiyon",
      render: (_, record) => {
        return (
          <Dropdown
            menu={{
              items: [
                {
                  label: "Aç",
                  key: "1",
                  icon: <FolderOpenOutlined />,
                  onClick: () => handleDoubleClick(record),
                },
                {
                  label: "Kopyala",
                  key: "2",
                  icon: <CopyOutlined />,
                  style: { display: isDocumentFolder(record) && "none" },
                  onClick: () => {
                    dispatch(cutDocument(null));
                    setWillBeCutDocument(null);
                    setWillBePasted(record);
                    dispatch(copyDocument(record));
                  },
                },
                {
                  label: "Kes",
                  key: "3",
                  icon: <ScissorOutlined />,
                  style: { display: isDocumentFolder(record) && "none" },
                  onClick: () => {
                    dispatch(copyDocument(null));
                    setWillBePasted(null);
                    setWillBeCutDocument(record);
                    dispatch(cutDocument(record));
                  },
                },
                {
                  label: "İsimlendir",
                  key: "4",
                  icon: <EditOutlined />,
                  onClick: () => {
                    setWillBeRenamed(record);
                    setOpenRenameModal(true);
                  },
                },
                {
                  label: "Detay",
                  key: "5",
                  icon: <InfoCircleOutlined />,
                  onClick: () => {
                    setWillBeViewDetail(record);
                    setDocumentDetailsModal(true);
                  },
                },
                {
                  label: "İndir",
                  key: "6",
                  icon: <DownloadOutlined />,
                  style: { display: isDocumentFolder(record) && "none" },
                  onClick: () => {
                    handleDownloadFile(record);
                  },
                },
                {
                  label: "Sil",
                  key: "7",
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => {
                    setWillBeDeleted(record);
                    setOpenDeleteConfirmModal(true);
                  },
                },
              ],
            }}
            trigger={["click"]}
            placement="bottom"
          >
            <EllipsisOutlined />
          </Dropdown>
        );
      },
      align: "center",
    },
  ];

  return (
    <Dropdown
      menu={{
        items: [
          {
            label: "Yapıştır",
            key: "1",
            icon: <FolderOpenOutlined />,
            disabled: clipboardBusy || !(effectiveCopied || effectiveCutted),
            onClick: handlePasteAction,
          },
        ],
      }}
      trigger={["contextMenu"]}
    >
      <DocumentContainer>
        <DocumentContainerHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flex: 1,
                minWidth: 0,
                flexWrap: "nowrap",
              }}
            >
              <span
                role="button"
                tabIndex={0}
                onClick={handleBack}
                onKeyDown={(e) => (e.key === "Enter" ? handleBack() : null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  color: "#1677ff",
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                <ArrowLeftOutlined />{" "}
                {intl.formatMessage({ id: "documents.actions.back" })}
              </span>
              <Typography.Text
                type="secondary"
                ellipsis={{ tooltip: folderPathLabel }}
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  flex: 1,
                  minWidth: 0,
                  lineHeight: 1.4,
                }}
              >
                {folderPathLabel}
              </Typography.Text>
            </div>
          </div>
          <Segmented
            onChange={() => setIsList(!isList)}
            options={[
              {
                value: "Kanban",
                icon: <AppstoreOutlined />,
              },
              {
                value: "List",
                icon: <BarsOutlined />,
              },
            ]}
          />
        </DocumentContainerHeader>
        <StyledDivider style={{ marginBottom: isList && "0" }} />
        <Space
          style={{
            display: isList && "none",
            width: "100%",
            marginBottom: "0",
          }}
          direction={isList ? "vertical" : "horizontal"}
          wrap
          size={2}
        >
          {isLoading ? (
            <div
              style={{
                minHeight: "150px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Spin />
            </div>
          ) : (
            allData?.map((item, index) => {
              return (
                <div key={index}>
                  {!isList && (
                    <Space.Compact block>
                      <Dropdown
                        menu={{
                          items: [
                            {
                              label: "Aç",
                              key: "1",
                              icon: <FolderOpenOutlined />,
                              onClick: () => handleDoubleClick(item),
                            },
                            {
                              label: "Kopyala",
                              key: "2",
                              icon: <CopyOutlined />,
                              style: {
                                display: isDocumentFolder(item) && "none",
                              },
                              onClick: () => {
                                dispatch(cutDocument(null));
                                setWillBeCutDocument(null);
                                setWillBePasted(item);
                                dispatch(copyDocument(item));
                              },
                            },
                            {
                              label: "Kes",
                              key: "3",
                              icon: <ScissorOutlined />,
                              style: {
                                display: isDocumentFolder(item) && "none",
                              },
                              onClick: () => {
                                dispatch(copyDocument(null));
                                setWillBePasted(null);
                                setWillBeCutDocument(item);
                                dispatch(cutDocument(item));
                              },
                            },
                            {
                              label: "İsimlendir",
                              key: "4",
                              icon: <EditOutlined />,
                              onClick: () => {
                                setWillBeRenamed(item);
                                setOpenRenameModal(true);
                              },
                            },
                            {
                              label: "Detay",
                              key: "5",
                              icon: <InfoCircleOutlined />,
                              onClick: () => {
                                setWillBeViewDetail(item);
                                setDocumentDetailsModal(true);
                              },
                            },
                            {
                              label: "İndir",
                              key: "6",
                              icon: <DownloadOutlined />,
                              style: {
                                display: isDocumentFolder(item) && "none",
                              },
                              onClick: () => {
                                handleDownloadFile(item);
                              },
                            },
                            {
                              label: "Sil",
                              key: "7",
                              icon: <DeleteOutlined />,
                              danger: true,
                              onClick: () => {
                                setWillBeDeleted(item);
                                setOpenDeleteConfirmModal(true);
                              },
                            },
                          ],
                        }}
                        trigger={["contextMenu"]}
                      >
                        <DocumentCardVertical
                          onContextMenu={(e) => e.stopPropagation()}
                          onDoubleClick={() => handleDoubleClick(item)}
                          style={{
                            opacity:
                              (item === willBeCutDocument && "50%") ||
                              (item === willBeCutDocument && "50%"),
                          }}
                        >
                          <Badge
                            style={{
                              display: item.privacy === "private" && "none",
                            }}
                            count="Genel"
                            color="cyan"
                          >
                            {isDocumentFolder(item) ? (
                              <FolderFilled style={{ color: item.color }} />
                            ) : (
                              <FileTextFilled style={{ color: item.color }} />
                            )}
                          </Badge>

                          <p
                            style={{
                              color: "black",
                              maxWidth: "5rem",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item?.name}
                          </p>
                        </DocumentCardVertical>
                      </Dropdown>
                    </Space.Compact>
                  )}
                </div>
              );
            })
          )}
        </Space>
        {isList && (
          <Table
            onRow={(record, rowIndex) => {
              return {
                onDoubleClick: (event) => {
                  handleDoubleClick(record);
                },
              };
            }}
            rowKey={"name"}
            locale={{ emptyText: "Dökümanlarınız Bulunmamaktadır" }}
            style={{ marginTop: "0" }}
            pagination={false}
            dataSource={filteredData}
            columns={columns}
          />
        )}
        <FileViewer
          open={openFileViewerDrawer}
          close={setOpenFileViewerDrawer}
          Id={fileWillBeViewed}
          showMessage={showMessage}
        />
        <DetailsModal
          close={setDocumentDetailsModal}
          open={documentDetailsModal}
          data={willBeViewDetail}
        />

        <Modal
          className="documents__delete-modal"
          title="Uyarı"
          centered
          open={openDeleteConfirmModal}
          okButtonProps={{ className: "modal-input" }}
          cancelButtonProps={{ className: "modal-input" }}
          okText="Sil"
          okType="danger"
          onOk={() => {
            if (
              copiedDocument ===
              (isDocumentFolder(willBeDeleted)
                ? willBeDeleted?.Id
                : willBeDeleted?.Id)
            ) {
              dispatch(copyDocument(null));
            }
            dispatch(deleteFile(willBeDeleted));
            setOpenDeleteConfirmModal(false);
            showMessage("Başarılı bir şekilde silindi", "success");
            setWillBeDeleted("");
          }}
          onCancel={() => {
            setOpenDeleteConfirmModal(false);
            setWillBeDeleted("");
          }}
        >
          {willBeDeleted?.name}'i silmek istediğinizden emin misiniz?
        </Modal>

        <Modal
          className="documents__rename-modal"
          title={`"${willBeRenamed?.name}"` + " Adını Değiştir"}
          centered
          width={300}
          open={openRenameModal}
          okButtonProps={{ className: "modal-input" }}
          cancelButtonProps={{ className: "modal-input" }}
          okText="Değiştir"
          okType="primary"
          onOk={() => form.submit()}
          onCancel={() => {
            setOpenRenameModal(false);
            form.resetFields();
          }}
        >
          <Form
            onFinish={handleRenameFinish}
            layout="vertical"
            name="rename_form"
            form={form}
            initialValues={("new_name", willBeRenamed?.name)}
          >
            <Form.Item
              style={{ margin: "0" }}
              label={"Yeni Ad"}
              name={"new_name"}
              rules={[{ required: true, message: "Gerekli bir alan" }]}
            >
              <Input
                className="modal-input"
                placeholder={
                  isDocumentFolder(willBeRenamed)
                    ? "Klasörün yeni adı giriniz"
                    : "Dosyanın yeni adı giriniz"
                }
              />
            </Form.Item>
          </Form>
        </Modal>
      </DocumentContainer>
    </Dropdown>
  );
};

export default FolderView;
