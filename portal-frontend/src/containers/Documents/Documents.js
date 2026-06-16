import React, { useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import "./customStyles.css";

//Antdesign
import { Row, Col, message, Select, Space } from "antd";
import "antd/dist/antd.css";
//==== Antdesign ====

//Styled div's

import Box from "@iso/components/utility/box";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
//==== Styled div's =====

//Components
import ShowDocuments from "./Components/ShowDocuments";
import Searchbar from "./Components/Searchbar";
import CreateFolderModal from "./Components/CreateFolderModal";
import CreateFileModal from "./Components/CreateFileModal";
import UploadFile from "./Components/UploadFile";
import FolderView from "./Components/FolderView";
import BreadcrumbLinks from "./Components/BreadcrumbLinks";
//==== Components ====
import { Switch, Route, useLocation, matchPath } from "react-router-dom";
//redux
import { Provider } from "react-redux";
import store from "./redux/store";
import { useDispatch } from "react-redux";
import axios from "axios";
import { host } from "../../Api/host";
import { changeFolder } from "./redux/actionCreators/fileFoldersActionCreator";
import { useHistory } from "react-router-dom";
import SecureLS from "secure-ls";
import { resolveUiRole } from "@iso/lib/helpers/jwtRoles";
//==== redux ====

const DocumentsContent = () => {
  const intl = useIntl();
  const location = useLocation();
  const hideTopBreadcrumb = Boolean(
    matchPath(location.pathname, { path: "/dashboard/folder/:Id", exact: true })
  );
  const [openNewFolderModal, setOpenNewFolderModal] = useState(false);
  const [openNewFileModal, setOpenNewFileModal] = useState(false);
  const [openUploadFileModal, setOpenUploadFileModal] = useState(false);
  const [search, setSearch] = useState("");
  const [willBePasted, setWillBePasted] = useState("");
  const [willBeCutDocument, setWillBeCutDocument] = useState("");
  const [users, setUsers] = useState([]);

  const dispatch = useDispatch();
  const navigate = useHistory();
  const ls = useMemo(() => new SecureLS({ encodingType: "aes" }), []);
  const auth = useMemo(() => {
    // Documents modülü kendi store'u ile çalıştığı için Auth burada yok;
    // bu yüzden SecureLS/localStorage üzerinden okuyoruz.
    let roleRaw = null;
    try {
      roleRaw = ls.get("role");
      if (typeof roleRaw === "string") {
        // SecureLS bazen string döndürür
        try {
          roleRaw = JSON.parse(roleRaw);
        } catch {
          // ignore
        }
      }
    } catch {
      roleRaw = null;
    }

    let idVal = null;
    try {
      idVal = Number(ls.get("id"));
    } catch {
      idVal = null;
    }

    let token = null;
    try {
      token = ls.get("accessToken");
    } catch {
      token = null;
    }
    token = token || localStorage.getItem("token") || localStorage.getItem("accessToken");

    return {
      id: Number.isFinite(idVal) ? idVal : null,
      role: roleRaw,
      accessToken: token,
    };
  }, [ls]);
  const roleName = useMemo(() => {
    const r = auth?.role;
    if (!r) return "";
    if (typeof r === "string") return r;
    if (Array.isArray(r)) {
      // ör: [{ roleName: "admin" }]
      const first = r[0];
      return String(first?.roleName ?? first?.name ?? first ?? "");
    }
    // ör: { roleName: "admin" } veya { name: "admin" }
    return String(r?.roleName ?? r?.RoleName ?? r?.name ?? r?.Name ?? "");
  }, [auth?.role]);

  const uiRole = useMemo(() => {
    return resolveUiRole({ reduxRole: roleName, accessToken: auth?.accessToken });
  }, [roleName, auth?.accessToken]);

  const isAdmin = String(uiRole).toLowerCase() === "admin";
  const looksLikeAdmin = useMemo(() => {
    try {
      return JSON.stringify(auth?.role ?? "")
        .toLowerCase()
        .includes("admin");
    } catch {
      return false;
    }
  }, [auth?.role]);
  const selfUserId = auth?.id ?? null;
  const [selectedUserId, setSelectedUserId] = useState(selfUserId);

  const axiosAuth = useMemo(() => {
    const token =
      auth?.accessToken || localStorage.getItem("token") || localStorage.getItem("accessToken");
    return axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [auth?.accessToken]);

  // Admin tespiti: roleName güvenilmez olabilir; getuserlist çalışıyorsa admin yetkisi var demektir.
  const [canSelectUser, setCanSelectUser] = useState(false);

  useEffect(() => {
    if (!isAdmin) setSelectedUserId(selfUserId);

    const fetchUsers = async () => {
      try {
        const res = await axiosAuth.get("/api/Users/getuserlist");
        const payload = res?.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : payload?.Data && Array.isArray(payload.Data)
          ? payload.Data
          : [];
        const normalized = Array.isArray(list) ? list : [];
        setUsers(normalized);
        setCanSelectUser(true);
      } catch {
        setUsers([]);
        setCanSelectUser(false);
      }
    };

    // worker-outsource/user rolünde user listesi endpoint'i yetkisiz → hiç çağırma (console 401/403 olmasın).
    if (isAdmin) {
      fetchUsers();
    } else {
      setUsers([]);
      setCanSelectUser(false);
    }
  }, [isAdmin, selfUserId, axiosAuth]);

  const handleUserChange = (value) => {
    const next = value ? Number(value) : selfUserId;
    setSelectedUserId(next);
    dispatch(changeFolder("root"));
    navigate.push("/dashboard/documents");
    window.dispatchEvent(new Event("documents:refresh"));
  };

  //Message
  const [messageApi, contextHolder] = message.useMessage();
  const success = (content, type) => {
    const t = type || "info";
    try {
      messageApi?.open?.({
        type: t,
        content,
        duration: 3,
      });
    } catch (e) {
      // Bazı antd/context kombinasyonlarında messageApi.open patlayabiliyor.
      // Global message fallback kullan.
      const fn = message?.[t] || message?.open;
      if (typeof fn === "function") {
        try {
          fn(content);
        } catch {
          // ignore
        }
      }
    }
  };
  //===== Mesage ====
  return (
    <>
      {contextHolder}
      <LayoutWrapper>
        <Box style={{ marginTop: "-20px" }}>
          {!hideTopBreadcrumb && (
            <Row align="middle" justify="space-between">
              <Col className="documents__header-left" flex="auto">
                <div style={{ marginBottom: "12px" }}>
                  <BreadcrumbLinks label={intl.formatMessage({ id: "documents.common.title" })} />
                </div>
              </Col>
            </Row>
          )}
          <Row style={{ marginTop: hideTopBreadcrumb ? 0 : "1rem" }}>
              <Searchbar
                search={search}
                setSearch={setSearch}
                openCreateFileModal={setOpenNewFileModal}
                openCreateFolderModal={setOpenNewFolderModal}
                openUploadFileModal={setOpenUploadFileModal}
                rightExtra={
                  isAdmin ? (
                    <Space align="center" style={{ marginRight: 8 }}>
                      <span style={{ color: "#666" }}>{intl.formatMessage({ id: "documents.common.user" })}:</span>
                      <Select
                        showSearch
                        style={{ width: 240 }}
                        value={selectedUserId ?? undefined}
                        onChange={handleUserChange}
                        disabled={!canSelectUser || (users || []).length === 0}
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          String(option?.label ?? "")
                            .toLowerCase()
                            .includes(String(input).toLowerCase())
                        }
                        options={[
                          ...(selfUserId
                            ? [{ value: selfUserId, label: intl.formatMessage({ id: "documents.common.self" }) }]
                            : []),
                          ...(users || [])
                            .filter((u) => u?.id != null && Number(u.id) !== Number(selfUserId))
                            .map((u) => ({
                              value: u?.id,
                              label:
                                u?.name ||
                                u?.fullName ||
                                u?.email ||
                                intl.formatMessage({ id: "documents.common.userWithId" }, { id: u?.id }),
                            })),
                        ]}
                        placeholder={intl.formatMessage({ id: "documents.common.selectUser" })}
                      />
                    </Space>
                  ) : null
                }
              />
          </Row>
          <Switch>
              <Route path="/dashboard/folder/:Id">
                <FolderView
                  willBeCutDocument={willBeCutDocument}
                  setWillBeCutDocument={setWillBeCutDocument}
                  willBePasted={willBePasted}
                  setWillBePasted={setWillBePasted}
                  search={search}
                  showMessage={success}
                  targetUserId={selectedUserId}
                />
              </Route>
              <Route path="/dashboard/documents">
                <ShowDocuments
                  willBeCutDocument={willBeCutDocument}
                  setWillBeCutDocument={setWillBeCutDocument}
                  willBePasted={willBePasted}
                  setWillBePasted={setWillBePasted}
                  search={search}
                  showMessage={success}
                  title={
                    isAdmin && selectedUserId && selectedUserId !== selfUserId
                      ? intl.formatMessage({ id: "documents.common.userDocuments" })
                      : intl.formatMessage({ id: "documents.common.myDocuments" })
                  }
                  targetUserId={selectedUserId}
                />
              </Route>
            </Switch>
          <CreateFolderModal
            open={openNewFolderModal}
            close={setOpenNewFolderModal}
            actionMessage={success}
            targetUserId={selectedUserId}
          />
          <CreateFileModal
            open={openNewFileModal}
            close={setOpenNewFileModal}
            actionMessage={success}
            targetUserId={selectedUserId}
          />
          <UploadFile
            open={openUploadFileModal}
            close={setOpenUploadFileModal}
            actionMessage={success}
            targetUserId={selectedUserId}
          />
        </Box>
      </LayoutWrapper>
    </>
  );
};

const Documents = () => (
  <Provider store={store}>
    <DocumentsContent />
  </Provider>
);

export default Documents;
