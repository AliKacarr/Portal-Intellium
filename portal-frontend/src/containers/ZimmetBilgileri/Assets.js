import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useIntl } from "react-intl";
import moment from "moment";
import "./customStyles.css";
import { Space, Row, Button, message, Breadcrumb, Badge } from "antd";
import "antd/dist/antd.css";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import PageHeader from "@iso/components/utility/pageHeader";
import { AppstoreOutlined, PlusCircleOutlined, InboxOutlined } from "@ant-design/icons"; 
import { useHistory } from "react-router-dom"; 

import DeleteModal from "./Components/DeleteModal";
import Searchbar from "./Components/Searchbar";
import AssetsTable from "./Components/AssetsTable";
import PdfDrawer from "./Components/PdfDrawer";
import NewAssetModal from "./Components/NewAssetModal";
import AssetDetails from "./Components/AssetDetails";
import AssetEdit from "./Components/AssetEdit";

import { personelAssetsData } from "./data/assetsData";
import axios from "axios";
import { host } from "../../Api/host";

const Assets = () => {
  const intl = useIntl();
  const history = useHistory(); 
  
  const [openPdfDrawer, setOpenPdfDrawer] = useState(false);
  const [openNewDrawer, setOpenNewDrawer] = useState(false); 
  
  const [asstesData, setAssetsData] = useState(personelAssetsData);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [filteredData, setFilteredData] = useState(personelAssetsData);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  // --- FİLTRELEME MANTIĞI ---
  const categoryOptions = useMemo(() => {
    const uniq = Array.from(new Set((asstesData || []).map((x) => (x?.categorie || "").toString().trim()).filter(Boolean)));
    return uniq.map((v) => ({ label: v, value: v }));
  }, [asstesData]);

  const statusOptions = useMemo(() => {
    const uniq = Array.from(new Set((asstesData || []).map((x) => (x?.statu || "").toString().trim()).filter(Boolean)));
    return uniq.map((v) => ({ label: v, value: v }));
  }, [asstesData]);

  const handleFilter = () => {
    const filtered = (asstesData || []).filter((item) => {
      const categoryMatch = selectedCategory ? item.categorie === selectedCategory : true;
      const statusMatch = selectedStatus ? item.statu === selectedStatus : true;
      const s = (search || "").toLowerCase();
      const searchMatch = (item.serial_number?.toLowerCase() || "").includes(s) || (item.personel?.toLowerCase() || "").includes(s) || (item.product?.toLowerCase() || "").includes(s);
      return categoryMatch && statusMatch && searchMatch;
    });
    setFilteredData(filtered);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- filter runs when inputs change
  useEffect(() => { handleFilter(); }, [selectedCategory, selectedStatus, search]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setFilteredData(asstesData); handleFilter(); }, [asstesData]);

  // --- VERİ ÇEKME ---
  const loadDebits = useCallback(async () => {
    try {
      const [resDebits, resUsers] = await Promise.all([
        axios.get(`${host}/api/debit/getdebits`),
        axios.get(`${host}/api/Users/getuserlist`)
      ]);
      const debits = resDebits?.data?.data || [];
      const usersPayload = resUsers?.data;
      const users = Array.isArray(usersPayload)
        ? usersPayload
        : Array.isArray(usersPayload?.data)
        ? usersPayload.data
        : [];
      const userMap = {};
      users.forEach((u) => { 
          userMap[u.id] = u.name || u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email; 
      });

      const unknownProduct = intl.formatMessage({ id: "zimmetBilgileri.unknownProduct" });
      const adminLabel = intl.formatMessage({ id: "zimmetBilgileri.adminLabel" });
      const mapped = debits.map((d, idx) => ({
        key: d.id ?? idx + 1, id: d.id ?? idx + 1,
        product: d.productInfo || d.ProductInfo || d.laptop || unknownProduct,
        categorie: d.category || d.Category || "",
        serial_number: d.serialNumber || d.SerialNumber || "",
        personelId: d.receiverUserId,
        personel:
          userMap[d.receiverUserId] ||
          intl.formatMessage({ id: "zimmetBilgileri.employeeNumber" }, { id: d.receiverUserId }),
        assignPersonelId: d.deliveredUserId,
        assignPersonel: userMap[d.deliveredUserId] || adminLabel,
        statu: d.status || d.Status || "Zimmetli",
        teslim_tarihi: d.deliveryDate ? moment(d.deliveryDate).format('DD.MM.YYYY') : "",
        raw: d,
      }));

      mapped.sort((a, b) => b.id - a.id);

      if (mapped.length > 0) { 
          setAssetsData(mapped); 
          setFilteredData(mapped); 
      } else { 
          setAssetsData(personelAssetsData); 
          setFilteredData(personelAssetsData); 
      } 
    } catch (err) { console.error("Hata:", err); }
  }, [intl]);

  useEffect(() => {
    loadDebits();
  }, [loadDebits]);

  const isPendingDebitRequest = (r) => {
    const st = r?.status ?? r?.Status ?? "";
    return st === "Bekliyor" || st === "Stok Bekliyor" || st === "Envanter Bekliyor";
  };

  // --- GELEN TALEPLER BADGE İÇİN VERİ ÇEKME ---
  useEffect(() => {
    let mounted = true;
    const fetchPendingRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/DebitRequest/getall`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const ok = res?.data?.success === true || res?.data?.Success === true;
        const raw = ok ? (res?.data?.data ?? res?.data?.Data ?? []) : [];
        const pending = raw.filter(isPendingDebitRequest);

        const lastSeenDate = sessionStorage.getItem("lastSeenDebitRequestDate");
        let unseenCount = 0;

        if (lastSeenDate) {
          const lastSeen = new Date(lastSeenDate);
          unseenCount = pending.filter((r) => {
            const requestDate = r?.requestDate ?? r?.RequestDate;
            return requestDate && new Date(requestDate) > lastSeen;
          }).length;
        } else {
          unseenCount = pending.length;
        }

        if (mounted) setPendingRequestCount(unseenCount);
      } catch (err) {
        console.error("Talep getirme hatası:", err);
      }
    };
    fetchPendingRequests();
    const intervalId = setInterval(fetchPendingRequests, 60000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const [messageApi, contextHolder] = message.useMessage();
  const success = (content, type) => { messageApi.open({ type, content, duration: 3 }); };

  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
  const [willBeShowDetails, setWillBeShowDetails] = useState(null);
  const [openEditDrawer, setOpenEditDrawer] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [willBeDeleted, setWillBeDeleted] = useState("");

  const handleIncomingRequestsClick = () => {
    sessionStorage.setItem("lastSeenDebitRequestDate", new Date().toISOString());
    setPendingRequestCount(0);
    history.push("/dashboard/incoming-requests");
  };

  return (
    <LayoutWrapper>
      {contextHolder}
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "zimmetBilgileri.breadcrumb.root" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "zimmetBilgileri.breadcrumb.assets" })}</Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>{intl.formatMessage({ id: "zimmetBilgileri.pageTitle" })}</PageHeader>

        <div style={{ width: "100%", textAlign: "right", marginTop: "-22px" }}>
          
          <span style={{ margin: "8px 10px 8px 0", display: "inline-block" }}>
            <Badge count={pendingRequestCount}>
              <Button
                type="primary"
                onClick={handleIncomingRequestsClick}
                icon={<InboxOutlined />}
                style={{ 
                    backgroundColor: "#13c2c2", 
                    borderColor: "#13c2c2", 
                    display: "inline-flex", 
                    alignItems: "center" 
                }}
              >
                {intl.formatMessage({ id: "zimmetBilgileri.btnIncomingRequests" })}
              </Button>
            </Badge>
          </span>

          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={() => setOpenNewDrawer(true)}
            style={{ 
                margin: "8px 10px 8px 0", 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center" 
            }}
          >
            {intl.formatMessage({ id: "zimmetBilgileri.btnQuickAssign" })}
          </Button>

          <Button
            type="primary"
            onClick={() => history.push("/dashboard/products")} 
            icon={<AppstoreOutlined />}
            style={{ 
                margin: "8px 0px", 
                backgroundColor: "#722ed1", 
                borderColor: "#722ed1", 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center" 
            }}
          >
            {intl.formatMessage({ id: "zimmetBilgileri.btnInventory" })}
          </Button>

        </div>

        <Row>
          <Space style={{ width: "100%" }} direction="vertical" size="middle">
            <Searchbar
              search={search} setSearch={setSearch}
              selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
              categoriesOptions={categoryOptions} statusOptions={statusOptions}
            />
            <AssetsTable
              data={filteredData}
              openDrawer={setOpenPdfDrawer} openDelete={setOpenDeleteModal} setWillBeDeleted={setWillBeDeleted}
              openDetailsDrawer={setOpenDetailsDrawer} openEditDrawer={setOpenEditDrawer} setWillBeShowDetails={setWillBeShowDetails}
              onRevoked={loadDebits}
            />
          </Space>
        </Row>

        {/* --- MODALLAR --- */}

        <NewAssetModal 
            open={openNewDrawer} 
            close={() => setOpenNewDrawer(false)}
            messageSuccess={success}
            refreshData={() => window.location.reload()}
        />

        <PdfDrawer open={openPdfDrawer} setOpen={setOpenPdfDrawer} />

        <DeleteModal
          open={openDeleteModal} close={setOpenDeleteModal} deleteId={willBeDeleted} messageSuccess={success}
          onDeleted={(id) => {
            setAssetsData((prev) => prev.filter((item) => item.id !== id));
            setFilteredData((prev) => prev.filter((item) => item.id !== id));
          }}
        />

        <AssetDetails
          open={openDetailsDrawer} close={setOpenDetailsDrawer} data={willBeShowDetails}
          setWillBeShowDetails={setWillBeShowDetails} openPdfDrawer={setOpenPdfDrawer} messageSuccess={success}
        />

        <AssetEdit
          messageSuccess={success} allData={asstesData} setAllData={setAssetsData} setData={setWillBeShowDetails}
          open={openEditDrawer} close={setOpenEditDrawer} data={willBeShowDetails}
        />
      </Box>
    </LayoutWrapper>
  );
};

export default Assets;