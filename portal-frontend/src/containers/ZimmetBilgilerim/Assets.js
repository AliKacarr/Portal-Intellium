import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useIntl } from "react-intl";
import moment from "moment";
import "./customStyles.css";

// Antdesign
import { Space, Row, Breadcrumb, Button } from "antd";
import "antd/dist/antd.css";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import PageHeader from "@iso/components/utility/pageHeader";
// İKONLAR
import { SendOutlined, UnorderedListOutlined } from "@ant-design/icons"; 

// Router & Redux
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom"; 

// Components
import Searchbar from "./Components/Searchbar";
import AssetsTable from "./Components/AssetsTable";
import RequestAssetModal from "./Components/RequestAssetModal"; 

// Data & API
import axios from "axios";
import { host } from "../../Api/host";

const Assets = () => {
  const intl = useIntl();
  const history = useHistory(); 
  // const [openPdfDrawer, setOpenPdfDrawer] = useState(false); // ❌ Artık gerek yok
  const [openRequestModal, setOpenRequestModal] = useState(false); 
  
  const [assetsData, setAssetsData] = useState([]); 
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const { id: currentUserId } = useSelector((state) => state.Auth);

  // --- FİLTRELEME MANTIĞI ---
  const categoryOptions = useMemo(() => {
    const uniq = Array.from(new Set(assetsData.map((x) => x.categorie).filter(Boolean)));
    return uniq.map((v) => ({ label: v, value: v }));
  }, [assetsData]);

  const statusOptions = useMemo(() => {
    const uniq = Array.from(new Set(assetsData.map((x) => x.statu).filter(Boolean)));
    return uniq.map((v) => ({ label: v, value: v }));
  }, [assetsData]);

  const handleFilter = () => {
    const filtered = assetsData.filter((item) => {
      const categoryMatch = selectedCategory ? item.categorie === selectedCategory : true;
      const statusMatch = selectedStatus ? item.statu === selectedStatus : true;
      const s = search.toLowerCase();
      
      const searchMatch =
        (item.serial_number?.toLowerCase() || "").includes(s) ||
        (item.product?.toLowerCase() || "").includes(s);
        
      return categoryMatch && statusMatch && searchMatch;
    });
    setFilteredData(filtered);
  };

  useEffect(() => {
    handleFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus, search, assetsData]);

  // --- VERİ ÇEKME ---
  const loadDebits = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await axios.get(`${host}/api/debit/getdebits`);
      const allDebits = res?.data?.data || [];

      const myDebits = allDebits.filter((d) => d.receiverUserId === currentUserId);

      const unknownProduct = intl.formatMessage({ id: "zimmetBilgilerim.unknownProduct" });
      const mapped = myDebits.map((d, idx) => ({
        key: d.id ?? idx + 1,
        id: d.id ?? idx + 1,
        debitId: d.id,
        productId: d.productId ?? d.ProductId,
        product:
          d.productInfo ||
          d.ProductInfo ||
          (d.brand ? `${d.brand} ${d.model}` : "") ||
          d.laptop ||
          unknownProduct,
        serial_number: d.serialNumber || d.SerialNumber || "",
        categorie: d.category || d.Category || "",
        statu: d.status || d.Status || "",
        teslim_tarihi:
          ["Gönderildi", "Teslim Edilemedi"].includes(String(d.status || d.Status || "").trim())
            ? ""
            : d.deliveryDate
            ? moment(d.deliveryDate).format("DD.MM.YYYY")
            : "",
        /** Sıralama için (DD.MM.YYYY string Date ile parse edilemez) */
        deliverySortKey: d.deliveryDate ? moment(d.deliveryDate).valueOf() : 0,

        pdfPath: d.pdfPath || null,

        raw: d,
      }));

      setAssetsData(mapped);
      setFilteredData(mapped);
    } catch (error) {
      console.error("Zimmetler çekilemedi:", error);
    }
  }, [currentUserId, intl]);

  useEffect(() => {
    loadDebits();
  }, [loadDebits]);

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "zimmetBilgilerim.breadcrumb.profile" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "zimmetBilgilerim.breadcrumb.assets" })}</Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>
          {intl.formatMessage({ id: "zimmetBilgilerim.pageTitle" })}
        </PageHeader>

        {/* --- BUTONLAR --- */}
        <div style={{ width: "100%", textAlign: "right", marginTop: "-22px" }}>
            
            {/* TALEPLERİM BUTONU */}
            <Button
                type="primary"
                onClick={() => history.push("/dashboard/my-assets-requests")} 
                icon={<UnorderedListOutlined />}
                style={{ 
                    margin: "8px 10px 8px 0", 
                    backgroundColor: "#fa8c16", 
                    borderColor: "#fa8c16",
                    display: "inline-flex", 
                    alignItems: "center" 
                }}
            >
                {intl.formatMessage({ id: "zimmetBilgilerim.btnMyRequests" })}
            </Button>

            {/* TALEP OLUŞTUR BUTONU */}
            <Button
                type="primary"
                onClick={() => setOpenRequestModal(true)}
                icon={<SendOutlined />}
                style={{ 
                    margin: "8px 0px", 
                    backgroundColor: "#52c41a",
                    borderColor: "#52c41a", 
                    display: "inline-flex", 
                    alignItems: "center" 
                }}
            >
                {intl.formatMessage({ id: "zimmetBilgilerim.btnCreateRequest" })}
            </Button>
        </div>

        <Row>
          <Space style={{ width: "100%" }} direction="vertical" size={"middle"}>
            <Searchbar
              search={search}
              setSearch={setSearch}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              categoriesOptions={categoryOptions}
              statusOptions={statusOptions}
            />
            <AssetsTable data={filteredData} currentUserId={currentUserId} onRefresh={loadDebits} />
          </Space>
        </Row>

        {/* <PdfDrawer open={openPdfDrawer} setOpen={setOpenPdfDrawer} />  <- GEREK KALMADI */}
        
        <RequestAssetModal 
            open={openRequestModal} 
            close={() => setOpenRequestModal(false)} 
        />

      </Box>
    </LayoutWrapper>
  );
};

export default Assets;