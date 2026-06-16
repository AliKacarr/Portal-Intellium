import React, { useState, useEffect, useMemo } from "react";
import { useIntl } from "react-intl";
import { Space, Button, Table, Badge, Breadcrumb, Tooltip, message } from "antd";
import { 
  PlusCircleOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserAddOutlined, 
  ArrowLeftOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import IntlMessages from "@iso/components/utility/intlMessages";
import PageHeader from "@iso/components/utility/pageHeader";
import axios from "axios";
import { useHistory } from "react-router-dom"; 
import { host } from "../../Api/host";
import "../Zimmet/zimmetTableHover.css";

// Bileşenler
import NewProductModal from "./components/NewProductModal";
import AssignProductModal from "./components/AssignProductModal";
import EditProductModal from "./components/EditProductModal";
import DeleteProductModal from "./components/DeleteProductModal";
import ProductDetails from "./components/ProductDetails";
import SearchBar from "./components/SearchBar"; // ✅ YENİ COMPONENT

const Products = () => {
  const intl = useIntl();
  const history = useHistory(); 
  const [products, setProducts] = useState([]);         // Ham veri
  const [filteredData, setFilteredData] = useState([]); // Ekranda görünen filtrelenmiş veri
  const [loading, setLoading] = useState(false);
  
  // --- FİLTRE STATE'LERİ ---
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modal State'leri
  const [openNewDrawer, setOpenNewDrawer] = useState(false);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [newPrefill, setNewPrefill] = useState(null);
  /** Teslim edilmiş zimmet sayısı (ürün satırı başına) — sadece “Zimmetle” görünürlüğü için */
  const [deliveredDebitCountByProductId, setDeliveredDebitCountByProductId] = useState({});

  // Auth & Axios
  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const token = auth?.accessToken;

  const axiosAuth = useMemo(() => axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }), [token]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axiosAuth.get("/api/product/getall");
      if (res.data.success) {
        const list = res.data.data;
        setProducts(list);
        setFilteredData(list);
      }
      if (token) {
        try {
          const resD = await axiosAuth.get("/api/debit/getdebits");
          const debits = resD?.data?.data || [];
          const map = {};
          debits.forEach((d) => {
            const pid = d.productId ?? d.ProductId;
            if (!pid) return;
            const st = String(d.status || d.Status || "").trim();
            if (st === "Teslim Edildi" || st === "Gönderildi") map[pid] = (map[pid] || 0) + 1;
          });
          setDeliveredDebitCountByProductId(map);
        } catch (e2) {
          console.error("Zimmet özetleri alınamadı", e2);
        }
      }
    } catch (error) {
      console.error("Ürünler çekilemedi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canShowAssignProduct = (record) => {
    const pid = record.id ?? record.Id;
    const qty = record.quantity ?? 0;
    const delivered = deliveredDebitCountByProductId[pid] ?? 0;
    if (qty <= 0) return false;
    if (record.status !== "Depoda") return false;
    return qty > delivered;
  };

  // Zimmet talebinden "Stoğa Ekle" ile gelindiyse, ürün bilgilerini çekip yeni ürün modalını prefill aç.
  useEffect(() => {
    let parsed = null;
    try {
      parsed = JSON.parse(sessionStorage.getItem("debitRequestStockPrefill") || "null");
    } catch {
      parsed = null;
    }
    if (!parsed) return;

    const pid = parsed?.productId;

    const run = async () => {
      try {
        if (pid) {
          const res = await axiosAuth.get(`/api/product/get/${pid}`);
          const p = res?.data?.data || res?.data?.Data;
          if (p) {
            setNewPrefill({
              category: p.category,
              brand: p.brand,
              model: p.model,
              debitRequestId: parsed?.debitRequestId,
            });
          }
        } else {
          setNewPrefill({
            category: parsed?.requestedCategory,
            brand: parsed?.requestedBrand,
            model: parsed?.requestedModel,
            debitRequestId: parsed?.debitRequestId,
          });
        }
        setOpenNewDrawer(true);
        message.info("Talep edilen ürün için stoğa ekleme formu hazırlandı. Yeni seri numarası girip kaydedin.");
      } catch (e) {
        console.error("Prefill ürün çekilemedi:", e);
      } finally {
        try {
          sessionStorage.removeItem("debitRequestStockPrefill");
        } catch {}
      }
    };
    run();
  }, [axiosAuth]);

  // --- DİNAMİK FİLTRE SEÇENEKLERİ (Veriden Üretilir) ---
  const categoryOptions = useMemo(() => {
    const uniq = Array.from(new Set(products.map(x => x.category).filter(Boolean)));
    return uniq.map(cat => ({ label: cat, value: cat }));
  }, [products]);

  const statusOptions = useMemo(() => {
    const uniq = Array.from(new Set(products.map(x => x.status).filter(Boolean)));
    return uniq.map(st => ({ label: st, value: st }));
  }, [products]);

  // --- FİLTRELEME MANTIĞI ---
  useEffect(() => {
    const s = search.toLowerCase();
    
    const filtered = products.filter(item => {
      // 1. Kategori Kontrolü
      const matchCat = selectedCategory ? item.category === selectedCategory : true;
      // 2. Statü Kontrolü
      const matchStatus = selectedStatus ? item.status === selectedStatus : true;
      // 3. Arama Kontrolü (Marka, Model, SeriNo, Barkod)
      const matchSearch = 
        (item.brand?.toLowerCase().includes(s)) ||
        (item.model?.toLowerCase().includes(s)) ||
        (item.serialNumber?.toLowerCase().includes(s)) ||
        (item.barcodeNumber?.toLowerCase().includes(s));

      return matchCat && matchStatus && matchSearch;
    });

    setFilteredData(filtered);
  }, [search, selectedCategory, selectedStatus, products]);


  const columns = [
    {
      title: "Adet",
      dataIndex: "quantity",
      width: 80,
      sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0),
      render: (v) => <span style={{ fontWeight: 600 }}>{v ?? 0}</span>,
    },
    {
      title: "Kategori",
      dataIndex: "category",
      render: (text) => <span style={{fontWeight: 500}}>{text}</span>,
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: "Marka / Model",
      render: (_, record) => (
        <span>{record.brand} - {record.model}</span>
      ),
    },
    {
      title: "Seri No",
      dataIndex: "serialNumber",
    },
    {
      title: "Durum",
      dataIndex: "status",
      render: (status) => {
        return <Badge status={status === "Depoda" ? "success" : status === "Zimmetli" ? "warning" : "error"} text={status} />;
      },
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Aksiyon",
      key: "action",
      align: "center",
      width: 168,
      render: (_, record) => {
        const slot = (content, variant) => (
          <div
            className={`zimmet-action-slot${variant === "danger" ? " zimmet-action-slot--danger" : ""}`}
            style={{
              width: 36,
              minHeight: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {content}
          </div>
        );
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              flexWrap: "nowrap",
            }}
          >
            {slot(
              canShowAssignProduct(record) ? (
                <Tooltip title={intl.formatMessage({ id: "products.tooltipAssign" })}>
                  <Button
                    type="text"
                    size="small"
                    icon={<UserAddOutlined style={{ fontSize: "16px", color: "#722ed1" }} />}
                    onClick={() => {
                      setSelectedProduct(record);
                      setOpenAssignModal(true);
                    }}
                  />
                </Tooltip>
              ) : null
            )}
            {slot(
              <Tooltip title={intl.formatMessage({ id: "products.tooltipDetail" })}>
                <Button
                  type="text"
                  size="small"
                  icon={<ProfileOutlined style={{ fontSize: "16px", color: "#1890ff" }} />}
                  onClick={() => {
                    setSelectedProduct(record);
                    setOpenDetailsDrawer(true);
                  }}
                />
              </Tooltip>
            )}
            {slot(
              <Tooltip title={intl.formatMessage({ id: "products.tooltipEdit" })}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ fontSize: "16px", color: "#595959" }} />}
                  onClick={() => {
                    setSelectedProduct(record);
                    setOpenEditModal(true);
                  }}
                />
              </Tooltip>
            )}
            {slot(
              <Tooltip title={intl.formatMessage({ id: "products.tooltipDelete" })}>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined style={{ fontSize: "16px" }} />}
                  onClick={() => {
                    setDeleteId(record.id);
                    setOpenDeleteModal(true);
                  }}
                />
              </Tooltip>,
              "danger"
            )}
          </div>
        );
      },
    },
  ];

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>Envanter</Breadcrumb.Item>
          <Breadcrumb.Item>Ürün Listesi</Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>
          <IntlMessages id="Envanter Yönetimi" />
        </PageHeader>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexWrap: "wrap",
            marginTop: "-6px",
            marginBottom: "18px",
          }}
        >
          <Button
            type="primary"
            ghost
            icon={<ArrowLeftOutlined />}
            onClick={() => history.push("/dashboard/assets")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              fontWeight: 600,
              margin: "8px 0",
            }}
          >
            Zimmet Listesine Dön
          </Button>

          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={() => setOpenNewDrawer(true)}
            style={{ margin: "8px 0", height: 36, borderRadius: 8, fontWeight: 600 }}
          >
            Yeni Ürün Ekle
          </Button>
        </div>

        {/* ✅ YENİ SEARCHBAR BİLEŞENİ */}
        <SearchBar 
            search={search}
            setSearch={setSearch}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            categoriesOptions={categoryOptions}
            statusOptions={statusOptions}
            placeholder="Marka, Model, Seri No veya Barkod ile ara..."
        />

        <Table
          className="zimmet-assets-table"
          columns={columns}
          dataSource={filteredData} // ✅ Filtrelenmiş veri kullanılıyor
          rowKey="id"
          loading={loading}
          style={{ marginTop: 10 }}
          pagination={{ pageSize: 10 }}
        />

        {/* --- MODALLAR --- */}
        
        <NewProductModal 
            open={openNewDrawer} 
            close={() => { setOpenNewDrawer(false); setNewPrefill(null); }}
            refreshData={fetchProducts}
            axiosAuth={axiosAuth}
            prefill={newPrefill}
        />

        <AssignProductModal 
            open={openAssignModal}
            close={() => setOpenAssignModal(false)}
            product={selectedProduct}
            refreshData={fetchProducts}
        />

        <EditProductModal 
            open={openEditModal}
            close={() => setOpenEditModal(false)}
            product={selectedProduct}
            refreshData={fetchProducts}
            axiosAuth={axiosAuth}
        />

        <DeleteProductModal 
            open={openDeleteModal}
            close={() => setOpenDeleteModal(false)}
            deleteId={deleteId}
            refreshData={fetchProducts}
            axiosAuth={axiosAuth}
        />

        <ProductDetails 
            open={openDetailsDrawer} 
            close={() => setOpenDetailsDrawer(false)}
            product={selectedProduct}
        />

      </Box>
    </LayoutWrapper>
  );
};

export default Products;