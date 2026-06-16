import React, { useEffect, useRef, useState, useMemo } from "react";
import { useIntl } from "react-intl";
import moment from "moment";
import { Drawer, Badge, Descriptions, Space, Spin } from "antd";
import axios from "axios";
import { host } from "../../../Api/host";

const AssetDetails = ({ open, close, data, messageSuccess }) => {
  const intl = useIntl();
  const divRef = useRef(null);
  const [detail, setDetail] = useState(null);
  const [product, setProduct] = useState(null); // Ürün detayları için
  const [loading, setLoading] = useState(false);

  // Auth & Axios
  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const token = auth?.accessToken;
  const axiosAuth = useMemo(() => axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }), [token]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!open || !data?.id) return;
      setLoading(true);
      try {
        // 1. Zimmet Detayı
        const res = await axiosAuth.get(`/api/debit/get/${data.id}`);
        const debit = res?.data?.data || res?.data;
        
        // 2. Personel İsimleri
        const [receiverRes, deliveredRes] = await Promise.all([
          axiosAuth.get(`/api/Users/getbyid?id=${debit.receiverUserId}`),
          axiosAuth.get(`/api/Users/getbyid?id=${debit.deliveredUserId}`),
        ]);

        // 3. Ürün Detayı (Teknik Özellikler için)
        if(debit.productId) {
            const prodRes = await axiosAuth.get(`/api/product/get/${debit.productId}`);
            if(prodRes.data.success) {
                setProduct(prodRes.data.data);
            }
        }

        setDetail({
          ...debit,
          receiverName: receiverRes?.data?.data?.name || `#${debit.receiverUserId}`,
          deliveredName: deliveredRes?.data?.data?.name || `#${debit.deliveredUserId}`,
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [open, data, axiosAuth]);

  // PDF ve Excel fonksiyonları (Aynı kalabilir, sadece product alanlarını güncellemek gerekebilir)
  // ... (downloadAsPdf ve exportToExcel fonksiyonları) ...

  // Teknik özellikleri render eden yardımcı fonksiyon
  const renderSpecs = () => {
      if(!product?.technicalSpecs) return intl.formatMessage({ id: "zimmetBilgileri.assetDetails.specsNotSpecified" });
      try {
          const specs = JSON.parse(product.technicalSpecs);
          return Object.entries(specs).map(([key, val]) => (
              <div key={key}><b>{key}:</b> {val}</div>
          ));
      } catch { return product.technicalSpecs; }
  };

  return (
    <Drawer
      title={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.title" })}
      placement="right"
      onClose={() => close(false)}
      open={open}
      size="large"
    >
      {loading ? <Spin /> : (
        <div ref={divRef}>
          <Space direction="vertical" style={{ width: "100%" }} size={20}>
            
            <Descriptions title={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.sectionStatus" })} bordered column={1}>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.status" })}>
                    <Badge status={detail?.status === "Teslim Edildi" ? "success" : "warning"} text={detail?.status} />
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.date" })}>
                    {detail?.deliveryDate ? moment(detail.deliveryDate).format('DD.MM.YYYY') : "-"}
                </Descriptions.Item>
            </Descriptions>

            <Descriptions title={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.sectionProduct" })} bordered column={2}>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.category" })}>{product?.category}</Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.brandModel" })}>{product?.brand} {product?.model}</Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.serial" })}>{product?.serialNumber}</Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.barcode" })}>{product?.barcodeNumber || "-"}</Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.specs" })} span={2}>
                    {renderSpecs()}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.description" })} span={2}>{product?.description || "-"}</Descriptions.Item>
            </Descriptions>

            <Descriptions title={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.sectionPersonnel" })} bordered column={1}>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.receiver" })}>{detail?.receiverName}</Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetDetails.deliverer" })}>{detail?.deliveredName}</Descriptions.Item>
            </Descriptions>

          </Space>
        </div>
      )}
    </Drawer>
  );
};

export default AssetDetails;