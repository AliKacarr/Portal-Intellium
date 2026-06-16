import React, { useEffect, useState, useMemo } from "react";
import { useIntl } from "react-intl";
import { Drawer, Space, Button, Form, Select, DatePicker, Typography, Input } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import moment from "moment";
import axios from "axios";
import { host } from "../../../Api/host";

const { Title } = Typography;

const AssetEdit = ({ open, close, data, messageSuccess, setAllData }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Mevcut statüyü hafızada tutalım, değiştirilmesin ama update ederken geri gönderelim
  const [currentStatus, setCurrentStatus] = useState(""); 

  // Auth & Axios
  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const token = auth?.accessToken;
  const axiosAuth = useMemo(() => axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }), [token]);

  // Kullanıcıları Çek
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const { data } = await axiosAuth.get("/api/Users/getuserlist");
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setUsers(list.map((u) => ({
          value: u.id,
          label: u.name || u.fullName || intl.formatMessage({ id: "zimmetBilgileri.userNumber" }, { id: u.id }),
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };
    if (open) fetchUsers();
  }, [open, axiosAuth, intl]);

  // Detayları Çek ve Doldur
  useEffect(() => {
    const fetchDetail = async () => {
      if (!open || !data?.id) return;
      setLoadingDetail(true);
      try {
        const res = await axiosAuth.get(`/api/debit/get/${data.id}`);
        const detail = res?.data?.data || res?.data;
        
        // Statüyü state'e atıyoruz, formda göstermeyeceğiz
        setCurrentStatus(detail.status || "Teslim Edildi");

        // Ürün detaylarını çekelim (Görsel bilgi için)
        let productInfo = {};
        if (detail.productId) {
             const prodRes = await axiosAuth.get(`/api/product/get/${detail.productId}`);
             if(prodRes.data.success) productInfo = prodRes.data.data;
        }

        form.setFieldsValue({
          teslim_tarihi: detail.deliveryDate ? moment(detail.deliveryDate) : moment(),
          
          // Ürün Bilgileri (Sadece Gösterim)
          productName: `${productInfo.brand || ''} ${productInfo.model || ''}`,
          serialNumber: productInfo.serialNumber,
          category: productInfo.category,
          
          // Personel
          receiverUserId: detail.receiverUserId,
          deliveredUserId: detail.deliveredUserId,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [open, data, axiosAuth, form]);

  const handleOnFinish = async (values) => {
    const payload = {
      Id: Number(data?.id),
      ReceiverUserId: values.receiverUserId,
      DeliveredUserId: values.deliveredUserId,
      ProductId: data.raw?.productId || 0, 
      DeliveryDate: values.teslim_tarihi ? values.teslim_tarihi.toISOString() : new Date().toISOString(),
      // ⚠️ DİKKAT: Formdan değil, veritabanından gelen mevcut statüyü koruyoruz.
      Status: currentStatus, 
    };

    try {
      await axiosAuth.put("/api/debit/update", payload);
      messageSuccess(intl.formatMessage({ id: "zimmetBilgileri.assetEdit.updateSuccess" }), "success");
      
      // Listeyi anlık güncellemek istersen burada setAllData kullanabilirsin
      // Ancak Assets.js fetchDebits ile sayfayı yenilemek daha güvenli olabilir.
      close(false);
      window.location.reload(); // En temizi sayfayı yenilemek
    } catch (err) {
      console.error(err);
      messageSuccess(intl.formatMessage({ id: "zimmetBilgileri.assetEdit.updateError" }), "error");
    }
  };

  return (
    <Drawer
      title={intl.formatMessage({ id: "zimmetBilgileri.assetEdit.title" })}
      placement="right"
      open={open}
      onClose={() => close(false)}
      size="large"
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          loading={loadingDetail}
          style={{ backgroundColor: "#1D6F42", color: "white" }}
        >
          {intl.formatMessage({ id: "zimmetBilgileri.assetEdit.save" })}
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleOnFinish}>
        <Title level={5}>{intl.formatMessage({ id: "zimmetBilgileri.assetEdit.sectionDebit" })}</Title>
        <Form.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetEdit.productReadonly" })} name="productName">
            <Input disabled style={{color: '#333', cursor: 'default'}} />
        </Form.Item>
        <Space>
            <Form.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetEdit.category" })} name="category"><Input disabled /></Form.Item>
            <Form.Item label={intl.formatMessage({ id: "zimmetBilgileri.assetEdit.serial" })} name="serialNumber"><Input disabled /></Form.Item>
        </Space>

        <Title level={5} style={{marginTop: 20}}>Teslim Bilgileri</Title>
        
        {/* STATÜ ALANI KALDIRILDI */}
        
        <Form.Item name="teslim_tarihi" label={intl.formatMessage({ id: "zimmetBilgileri.assetEdit.deliveryDate" })} rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>

        <Title level={5}>{intl.formatMessage({ id: "zimmetBilgileri.assetEdit.sectionPersonnel" })}</Title>
        <Form.Item name="receiverUserId" label={intl.formatMessage({ id: "zimmetBilgileri.assetEdit.receiver" })} rules={[{ required: true }]}>
          <Select options={users} showSearch loading={loadingUsers} optionFilterProp="label"/>
        </Form.Item>
        <Form.Item name="deliveredUserId" label={intl.formatMessage({ id: "zimmetBilgileri.assetEdit.deliverer" })} rules={[{ required: true }]}>
          <Select options={users} showSearch loading={loadingUsers} optionFilterProp="label"/>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AssetEdit;