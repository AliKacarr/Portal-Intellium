import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import {
  Typography,
  Space,
  Segmented,
  Table,
  Dropdown,
  Badge,
  Modal,
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
// import { getFolders } from "../redux/actionCreators/fileFoldersActionCreator";
// import { getFiles } from "../redux/actionCreators/fileFoldersActionCreator";
import { renameDocument } from "../redux/actionCreators/fileFoldersActionCreator";
import { deleteFile } from "../redux/actionCreators/fileFoldersActionCreator"; //delete file and folder also
import { changeFolder } from "../redux/actionCreators/fileFoldersActionCreator";
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
//==== Component ====

const ShowDocuments = ({
  title,
  showMessage,
  search,
  setWillBePasted,
  willBePasted,
  setWillBeCutDocument,
  willBeCutDocument,
  targetUserId,
}) => {
  const intl = useIntl();
  const { Title } = Typography;
  const t = (id, values) => intl.formatMessage({ id }, values);
  const dispatch = useDispatch();
  const [isList, setIsList] = useState(false);
  const [openFileViewerDrawer, setOpenFileViewerDrawer] = useState(false);
  const [fileWillBeViewed, setFileWillBeViewed] = useState(null);
  const navigate = useHistory();

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

  const {
    isLoading,
    userFolders,
    userFiles,
    currentFolder,
    copiedDocument,
    cuttedDocument,
  } = useSelector(
    (state) => ({
      isLoading: state.filefolders.isLoading,
      userFolders: state.filefolders.userFolders.filter(
        (folder) => folder.parent === "root"
      ),
      userFiles: state.filefolders.userFiles.filter(
        (file) => file.parent === "root"
      ),
      currentFolder: state.filefolders.currentFolder,
      copiedDocument: state.filefolders.copiedDocument,
      cuttedDocument: state.filefolders.cuttedDocument,
    }),
    shallowEqual
  );
  //merge data
  const getUserData = (state) => {
    const folders = userFolders;
    const files = userFiles;
    return [...folders, ...files];
  };
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [clipboardBusy, setClipboardBusy] = useState(false);
  const [renameBusy, setRenameBusy] = useState(false);
  const effectiveCopied = willBePasted || copiedDocument;
  const effectiveCutted = willBeCutDocument || cuttedDocument;

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

  const buildTipDataForAdd = useCallback((item) => {
    const t = (item?.type ?? item?.Type ?? "").toLowerCase();
    const raw = item?.tipData ?? item?.TipData ?? "";
    if (t === "folder") return `data:folder;base64,${btoa("folder")}`;
    if (typeof raw === "string" && raw.startsWith("data:")) return raw;
    const mime = EXT_TO_MIME[t] || "application/octet-stream";
    return `data:${mime};base64,${raw}`;
  }, [EXT_TO_MIME]);

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

  const fetchRoot = useCallback(() => {
    axiosAuth
      .get("/api/Document/GetDocumentsByParent", {
        params: { parent: 0, userId: targetUserId || undefined },
      })
      .then((res) => {
        const payload = res?.data;
        const list = payload?.data || payload?.Data || [];
        const normalized = normalizeDocumentList(list);
        setAllData(normalized);
        setFilteredData(normalized);
      })
      .catch((error) => console.error("Error fetching documents:", error));
  }, [axiosAuth, targetUserId]);

  const handlePasteAction = useCallback(async () => {
    if (clipboardBusy) return;
    setClipboardBusy(true);
    try {
      const parent = 0;
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
        showMessage(t("documents.messages.copiedPasted"), "success");
        fetchRoot();
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
        showMessage(t("documents.messages.moved"), "success");
        fetchRoot();
        return;
      }

      // Menü disabled olacağı için normalde buraya düşmemeli.
    } catch (e) {
      console.error("Paste error:", e);
      showMessage(t("documents.errors.pasteFailed"), "error");
    } finally {
      setClipboardBusy(false);
    }
  }, [
    clipboardBusy,
    allData,
    effectiveCopied,
    effectiveCutted,
    axiosAuth,
    dispatch,
    fetchRoot,
    showMessage,
    targetUserId,
    setWillBePasted,
    setWillBeCutDocument,
    buildTipDataForAdd,
  ]);

  //====  merge data =====

  // Ana "Dokümanlarım" ekranındayken Redux klasör context'i root olmalı; aksi halde
  // yeni dosya/yükleme son ziyaret edilen klasöre (Parent) yazılıyor.
  useEffect(() => {
    dispatch(changeFolder("root"));
  }, [dispatch]);

  useEffect(() => {
    fetchRoot();
    const handler = () => fetchRoot();
    window.addEventListener("documents:refresh", handler);
    return () => window.removeEventListener("documents:refresh", handler);
  }, [fetchRoot]);


  const handleDelete = () => {
    console.log("willBeDeleted:", willBeDeleted);
    const deleteId = willBeDeleted?.id ?? willBeDeleted?.Id;
    if (!willBeDeleted || !deleteId) {
      console.error(t("documents.errors.deleteIdMissing"));
      showMessage(t("documents.errors.deleteFailed"), "error");
      return;
    }

    axiosAuth
      .delete(`/api/Document/delete/${deleteId}`)
      .then(() => {
        showMessage(t("documents.messages.fileDeleted"), "success");
        setFilteredData(filteredData.filter((item) => (item?.id ?? item?.Id) !== deleteId));
        setAllData(allData.filter((item) => (item?.id ?? item?.Id) !== deleteId));
        setOpenDeleteConfirmModal(false);
      })
      .catch((error) => {
        console.error(`${t("documents.errors.deleteFailed")}:`, error);
        showMessage(t("documents.errors.deleteFailed"), "error");
      });
  };

  const handleRename = (values) => {
    if (renameBusy) return;
    setRenameBusy(true);
    const renamedId = willBeRenamed?.id ?? willBeRenamed?.Id;
    if (isDocumentFolder(willBeRenamed)) {
      if (!checkFolderAlreadyExists(values.new_name.trim())) {
        const next = values.new_name.trim();
        axiosAuth
          .put(`/api/Document/update/${renamedId}`, buildDocumentUpdatePayload(willBeRenamed, next))
          .then(() => {
            showMessage(t("documents.messages.updated"), "success");
            setAllData((prev) =>
              (prev || []).map((d) => {
                const id = d?.id ?? d?.Id;
                return id === renamedId ? touchDocumentUpdatedAt({ ...d, name: next, Name: next, type: "folder", Type: "folder" }) : d;
              })
            );
            setFilteredData((prev) =>
              (prev || []).map((d) => {
                const id = d?.id ?? d?.Id;
                return id === renamedId ? touchDocumentUpdatedAt({ ...d, name: next, Name: next, type: "folder", Type: "folder" }) : d;
              })
            );
            setOpenRenameModal(false);
            setWillBeRenamed("");
            form.resetFields();
            fetchRoot();
          })
          .catch((error) => {
            console.error(`${t("documents.errors.updateFailed")}:`, error);
            showMessage(t("documents.errors.updateFailed"), "error");
          })
          .finally(() => setRenameBusy(false));
      } else {
        showMessage(
          `${values.new_name} ${t("documents.errors.sameFolderName")}`,
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

        const next = values.new_name.trim();
        axiosAuth
          .put(`/api/Document/update/${renamedId}`, buildDocumentUpdatePayload(willBeRenamed, next))
          .then(() => {
            showMessage(t("documents.messages.updated"), "success");
            setAllData((prev) =>
              (prev || []).map((d) => {
                const id = d?.id ?? d?.Id;
                return id === renamedId ? touchDocumentUpdatedAt({ ...d, name: next, Name: next }) : d;
              })
            );
            setFilteredData((prev) =>
              (prev || []).map((d) => {
                const id = d?.id ?? d?.Id;
                return id === renamedId ? touchDocumentUpdatedAt({ ...d, name: next, Name: next }) : d;
              })
            );
            setOpenRenameModal(false);
            setWillBeRenamed("");
            form.resetFields();
            fetchRoot();
          })
          .catch((error) => {
            console.error(`${t("documents.errors.updateFailed")}:`, error);
            showMessage(t("documents.errors.updateFailed"), "error");
          })
          .finally(() => setRenameBusy(false));
      } else {
        showMessage(
          `${values.new_name} ${t("documents.errors.sameFileName")}`,
          "error"
        );
        setRenameBusy(false);
      }
    }
  };

  // const [filteredData, setFilteredData] = useState(allData);

  const handleFilter = () => {
    const filtered = allData.filter((item) => {
      const searchMatch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase());
      return searchMatch;
    });
    setFilteredData(filtered);
  };


  useEffect(() => {
    handleFilter();
  }, [search, showMessage]);
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
    const filePresent = userFiles
      ?.filter((file) => file.parent === currentFolder)
      .find((file) => file.name === name);
    if (filePresent) {
      return true;
    } else return false;
  };
  const checkFolderAlreadyExists = (name) => {
    const folderPresent = userFolders
      ?.filter((folder) => folder.name === name)
      .find(
        (folder) => folder.name === name && folder.parent === currentFolder
      );
    if (folderPresent) {
      return true;
    } else return false;
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
        showMessage(`${file.name} ${t("documents.messages.downloaded")}`, "success");
      })
      .catch((error) => {
        console.error(`${t("documents.errors.downloadFailed")}:`, error);
        showMessage(t("documents.errors.downloadFailed"), "error");
      });
  };

  const handleDoubleClick = (item) => {
    const itemId = item.id ?? item.Id;
    const fileType = getDocumentType(item);
    if (fileType === "folder") {
      dispatch(changeFolder(itemId));
      navigate.push(`/dashboard/folder/${itemId}`);
      console.log("item:", item);
    } else if (isOpenableDocumentType(fileType)) {
      setOpenFileViewerDrawer(true);
      setFileWillBeViewed(itemId);
    } else {
      showMessage(t("documents.errors.cannotOpenFormat"), "error");
    }
  };

  useEffect(() => {
    if (isLoading) {
      // dispatch(getFolders("1"));
      // dispatch(getFiles("1"));
    }
  }, [isLoading, dispatch]);
  const columns = [
    {
      title: t("documents.table.name"),
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
      title: t("documents.labels.description"),
      dataIndex: "description",
      sorter: (a, b) => a.description.localeCompare(b.description),
      align: "center",
    },
    {
      title: t("documents.labels.createdAt"),
      dataIndex: "createdAt",
      sorter: (a, b) =>
        new Date(pickDocumentDate(a, "createdAt")) - new Date(pickDocumentDate(b, "createdAt")),
      render: (_, record) => formatDocumentDate(pickDocumentDate(record, "createdAt")),
      align: "center",
    },
    {
      title: t("documents.labels.updatedAt"),
      dataIndex: "updatedAt",
      sorter: (a, b) =>
        new Date(pickDocumentDate(a, "updatedAt")) - new Date(pickDocumentDate(b, "updatedAt")),
      render: (_, record) => formatDocumentDate(pickDocumentDate(record, "updatedAt")),
      align: "center",
    },
    {
      title: t("documents.labels.type"),
      dataIndex: "type",
      sorter: (a, b) => a.type.localeCompare(b.type),
      render: (_, record) => {
        return <>{record.type.toUpperCase()}</>;
      },
      align: "center",
    },
    {

      title: t("documents.table.action"),
      key: 'action',
      render: (_, record) => {
        return (
          <Dropdown
            menu={{
              items: [
                {
                  label: t("documents.actions.open"),
                  key: "1",
                  icon: <FolderOpenOutlined />,
                  onClick: () => handleDoubleClick(record),
                },
                {
                  label: t("documents.actions.copy"),
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
                  label: t("documents.actions.cut"),
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
                  label: t("documents.actions.rename"),
                  key: "4",
                  icon: <EditOutlined />,
                  onClick: () => {
                    setWillBeRenamed(record);
                    setOpenRenameModal(true);
                  },
                },
                {
                  label: t("documents.actions.detail"),
                  key: "5",
                  icon: <InfoCircleOutlined />,
                  onClick: () => {
                    setWillBeViewDetail(record);
                    setDocumentDetailsModal(true);
                  },
                },
                {
                  label: t("documents.actions.download"),
                  key: "6",
                  icon: <DownloadOutlined />,
                  style: { display: isDocumentFolder(record) && "none" },
                  onClick: () => {
                    handleDownloadFile(record);
                  },
                },
                {
                  label: t("documents.actions.delete"),
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
            placement="bottom"
            trigger={["click"]}
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
            label: t("documents.actions.paste"),
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
          <Title level={3}>{title}</Title>
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
            marginBottom: "0",
          }}
          direction={isList ? "vertical" : "horizontal"}
          wrap
        >
          {filteredData?.map((item, index) => (
            <div style={{ width: "10%" }} key={index}>
              {!isList && (
                <Space.Compact block>
                  <Dropdown
                    menu={{
                      items: [
                        {
                            label: t("documents.actions.open"),
                          key: "1",
                          icon: <FolderOpenOutlined />,
                          onClick: () => handleDoubleClick(item),
                        },
                        {
                          label: t("documents.actions.copy"),
                          key: "2",
                          icon: <CopyOutlined />,
                          style: { display: isDocumentFolder(item) && "none" },
                          onClick: () => {
                            dispatch(cutDocument(null));
                            setWillBeCutDocument(null);
                            setWillBePasted(item);
                            dispatch(copyDocument(item));
                          },
                        },
                        {
                          label: t("documents.actions.cut"),
                          key: "3",
                          icon: <ScissorOutlined />,
                          style: { display: isDocumentFolder(item) && "none" },
                          onClick: () => {
                            dispatch(copyDocument(null));
                            setWillBePasted(null);
                            setWillBeCutDocument(item);
                            dispatch(cutDocument(item));
                          },
                        },
                        {
                          label: t("documents.actions.rename"),
                          key: "4",
                          icon: <EditOutlined />,
                          onClick: () => {
                            setWillBeRenamed(item);
                            setOpenRenameModal(true);
                          },
                        },
                        {
                          label: t("documents.actions.detail"),
                          key: "5",
                          icon: <InfoCircleOutlined />,
                          onClick: () => {
                            setWillBeViewDetail(item);
                            setDocumentDetailsModal(true);
                          },
                        },
                        {
                          label: t("documents.actions.download"),
                          key: "6",
                          icon: <DownloadOutlined />,
                          style: { display: isDocumentFolder(item) && "none" },
                          onClick: () => {
                            handleDownloadFile(item);
                          },
                        },
                        {
                          label: t("documents.actions.delete"),
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
                          (item === willBeCutDocument && "100%"),
                      }}
                    >
                      <Badge
                        style={{
                          display: item.privacy === "private" && "none",
                        }}
                            count={t("documents.labels.public")}
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
          ))}
          <Space.Compact block></Space.Compact>
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
            locale={{ emptyText: t("documents.messages.noDocuments") }}
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
          title={t("documents.labels.warning")}
          centered
          open={openDeleteConfirmModal}
          okButtonProps={{ className: "modal-input" }}
          cancelButtonProps={{ className: "modal-input" }}
          okText={t("documents.actions.delete")}
          okType="danger"
          onOk={handleDelete}
          onCancel={() => setOpenDeleteConfirmModal(false)}
        >
          <p>{t("documents.messages.confirmDelete")}</p>
        </Modal>

        <Modal
          className="documents__rename-modal"
          title={`"${willBeRenamed?.name}" ${t("documents.messages.renameTitleSuffix")}`}
          centered
          width={300}
          open={openRenameModal}
          okButtonProps={{ className: "modal-input" }}
          cancelButtonProps={{ className: "modal-input" }}
          okText={t("documents.actions.renameApply")}
          okType="primary"
          onOk={() => form.submit()}
          onCancel={() => {
            setOpenRenameModal(false);
            form.resetFields();
          }}
        >
          <Form
            onFinish={handleRename}
            layout="vertical"
            name="rename_form"
            form={form}
            initialValues={("new_name", willBeRenamed?.name)}
          >
            <Form.Item
              style={{ margin: "0" }}
              label={t("documents.labels.newName")}
              name={"new_name"}
              rules={[{ required: true, message: t("documents.validation.requiredField") }]}
            >
              <Input
                className="modal-input"
                placeholder={
                  isDocumentFolder(willBeRenamed)
                    ? t("documents.placeholders.newFolderName")
                    : t("documents.placeholders.newFileName")
                }
              />
            </Form.Item>
          </Form>
        </Modal>
      </DocumentContainer>
    </Dropdown>
  );
};

export default ShowDocuments;
