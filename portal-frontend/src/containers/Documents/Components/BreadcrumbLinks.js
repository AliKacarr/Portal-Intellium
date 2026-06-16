import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import axios from "axios";
import SecureLS from "secure-ls";
import { host } from "../../../Api/host";
import { useIntl } from "react-intl";

//Redux
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { changeFolder } from "../redux/actionCreators/fileFoldersActionCreator";
//==== Redux ====

const BreadcrumbLinks = (props) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { currentFolder, currentFolderData, userFolders } = useSelector(
    (state) => {
      const filefolders = state?.filefolders || {};
      const folders = filefolders.userFolders || [];
      const current = filefolders.currentFolder ?? "root";
      const currentNorm = current == null ? null : String(current);
      return {
        currentFolder: current,
        currentFolderData: folders.find(
          (folder) => String(folder?.Id ?? folder?.id) === currentNorm
        ),
        userFolders: folders,
      };
    },
    shallowEqual
  );
  const handleNavigate = (link) => {
    dispatch(changeFolder(link));
  };

  const normalizeId = (v) => (v == null ? null : String(v));
  const folderById = (id) =>
    (userFolders || []).find((f) => normalizeId(f?.Id ?? f?.id) === normalizeId(id));

  // path alanı bazen string geliyor; bu yüzden parent zincirinden breadcrumb üret.
  const buildFolderChain = () => {
    if (!currentFolderData) return [];
    const chain = [];
    const visited = new Set();
    let cursor = currentFolderData;
    while (cursor) {
      const pid = cursor.parent ?? cursor.Parent ?? 0;
      const pidNorm = normalizeId(pid);
      if (!pid || pidNorm === "0" || pidNorm === "root") break;
      if (visited.has(pidNorm)) break;
      visited.add(pidNorm);
      const parentFolder = folderById(pid);
      if (!parentFolder) break;
      chain.unshift(parentFolder);
      cursor = parentFolder;
    }
    return chain;
  };

  const folderChain = currentFolder !== "root" ? buildFolderChain() : [];
  const MAX_DEPTH = 3; // root hariç gösterilecek maksimum kırılım sayısı
  const [apiCrumbs, setApiCrumbs] = useState([]);

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
    let cancelled = false;

    const loadApiCrumbs = async () => {
      // Redux'ta currentFolderData bulunamazsa (docs modülü API ile çalışıyor, redux dolu olmayabiliyor)
      // API'den parent zinciri ile breadcrumb üret.
      if (currentFolder === "root" || currentFolderData) {
        if (!cancelled) setApiCrumbs([]);
        return;
      }
      const id = Number(currentFolder);
      if (!Number.isFinite(id) || id <= 0) {
        if (!cancelled) setApiCrumbs([]);
        return;
      }

      const chain = [];
      const visited = new Set();
      let cursorId = id;
      while (cursorId && chain.length < MAX_DEPTH) {
        if (visited.has(cursorId)) break;
        visited.add(cursorId);
        try {
          const res = await axiosAuth.get("/api/Document/GetById", { params: { Id: cursorId } });
          const doc = res?.data?.data ?? res?.data?.Data ?? res?.data?.Data?.data ?? res?.data ?? null;
          const item = doc?.data ?? doc?.Data ?? doc;
          if (!item) break;
          // Klasör adı
          const name = item?.name ?? item?.Name ?? `#${cursorId}`;
          const parent = item?.parent ?? item?.Parent ?? 0;
          chain.unshift({ id: cursorId, name, parent });
          const p = Number(parent);
          if (!Number.isFinite(p) || p <= 0) break;
          cursorId = p;
        } catch {
          break;
        }
      }

      if (!cancelled) setApiCrumbs(chain);
    };

    loadApiCrumbs();
    return () => {
      cancelled = true;
    };
  }, [axiosAuth, currentFolder, currentFolderData]);

  const crumbItems =
    currentFolder !== "root" && currentFolderData
      ? [...folderChain, currentFolderData]
      : apiCrumbs;
  const shouldCollapse = crumbItems.length > MAX_DEPTH;
  const visibleTail = shouldCollapse ? crumbItems.slice(-2) : crumbItems;

  return (
    <Breadcrumb>
      <Breadcrumb.Item>
        <Link onClick={() => handleNavigate("root")} to="/dashboard/documents">
          {props.label || intl.formatMessage({ id: "documents.common.title" })}
        </Link>
      </Breadcrumb.Item>
      {currentFolder !== "root" && crumbItems.length > 0 ? (
        <>
          {shouldCollapse ? <Breadcrumb.Item key="__ellipsis">...</Breadcrumb.Item> : null}
          {visibleTail.map((folder, idx) => {
            const safeId = folder?.id ?? folder?.Id ?? null;
            const name = folder?.name ?? folder?.Name ?? (safeId ? `#${safeId}` : "-");
            const isLast = idx === visibleTail.length - 1;
            return (
              <Breadcrumb.Item key={String(safeId ?? idx)}>
                {isLast ? (
                  name
                ) : (
                  <Link
                    onClick={() => handleNavigate(safeId)}
                    to={`/dashboard/folder/${safeId}`}
                  >
                    {name}
                  </Link>
                )}
              </Breadcrumb.Item>
            );
          })}
        </>
      ) : (
        <></>
      )}
    </Breadcrumb>
  );
};
export default BreadcrumbLinks;
