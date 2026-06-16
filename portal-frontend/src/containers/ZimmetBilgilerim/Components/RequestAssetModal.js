import React, { useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { Modal, Form, Select, Input, Button, message } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import { host } from "../../../Api/host";

const NEW_PRODUCT_VALUE = "__NEW_PRODUCT__";

const RequestAssetModal = ({ open, close }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isNewProductRequest, setIsNewProductRequest] = useState(false);

  const { id: currentUserId, accessToken } = useSelector((state) => state.Auth);
  const token = accessToken || localStorage.getItem("token");

  const axiosAuth = useMemo(() => axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }), [token]);

  useEffect(() => {
    if (!open) return;
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await axiosAuth.get("/api/product/getall");
        const list = res?.data?.data || res?.data?.Data || [];
        const all = Array.isArray(list) ? list : [];
        setProducts(all);
        if (all.length === 0) message.warning(intl.formatMessage({ id: "zimmetBilgilerim.requestModal.noInventory" }));
      } catch (e) {
        console.error("Ürünler çekilemedi:", e);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [open, axiosAuth, intl]);

  const visibleProducts = useMemo(() => {
    const all = Array.isArray(products) ? products : [];
    return all.filter((p) => String(p?.status ?? p?.Status ?? "").toLowerCase() !== "zimmetli");
  }, [products]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const wantsNew = values.productId === NEW_PRODUCT_VALUE;
      const payload = {
        UserId: currentUserId,
        ProductId: wantsNew ? null : values.productId,
        RequestedCategory: wantsNew ? values.requestedCategory : null,
        RequestedBrand: wantsNew ? values.requestedBrand : null,
        RequestedModel: wantsNew ? values.requestedModel : null,
        Description: values.description,
      };

      const res = await axiosAuth.post("/api/DebitRequest/add", payload);
      if (res.data.success) {
        message.success(intl.formatMessage({ id: "zimmetBilgilerim.requestModal.success" }));
        form.resetFields();
        close();
      } else {
        message.error(res?.data?.message || intl.formatMessage({ id: "zimmetBilgilerim.requestModal.createFailed" }));
      }
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || intl.formatMessage({ id: "zimmetBilgilerim.requestModal.genericError" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.title" })}
      open={open}
      onCancel={close}
      footer={null}
      centered
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item 
            name="productId" 
            label={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.productLabel" })} 
            rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgilerim.requestModal.productRequired" }) }]}
        >
            <Select
              showSearch
              loading={productsLoading}
              placeholder={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.productPlaceholder" })}
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(String(input).toLowerCase())
              }
              onChange={(value) => {
                const wantsNew = value === NEW_PRODUCT_VALUE;
                setIsNewProductRequest(wantsNew);
                if (wantsNew) {
                  message.info(intl.formatMessage({ id: "zimmetBilgilerim.requestModal.newProductHint" }));
                  return;
                }
                const p = (visibleProducts || []).find((x) => (x?.id ?? x?.Id) === value);
                const st = p?.status ?? p?.Status ?? null;
                if (st && String(st).toLowerCase() !== "depoda") {
                  if (String(st).toLowerCase() === "zimmetli") {
                    message.error(intl.formatMessage({ id: "zimmetBilgilerim.requestModal.productAssignedOther" }));
                  } else {
                    message.warning(intl.formatMessage({ id: "zimmetBilgilerim.requestModal.productNotInStock" }));
                  }
                }
              }}
              options={[
                ...(visibleProducts || []).map((p) => {
                  const id = p?.id ?? p?.Id;
                  const category = p?.category ?? p?.Category ?? "";
                  const brand = p?.brand ?? p?.Brand ?? "";
                  const model = p?.model ?? p?.Model ?? "";
                  const sn = p?.serialNumber ?? p?.SerialNumber ?? "";
                  const st = p?.status ?? p?.Status ?? "";
                  const badge = String(st).toLowerCase() === "depoda" ? "" : ` • (${st})`;
                  return {
                    value: id,
                    label: `[${category}] ${brand} ${model} - SN: ${sn}${badge}`,
                  };
                }),
                {
                  value: NEW_PRODUCT_VALUE,
                  label: intl.formatMessage({ id: "zimmetBilgilerim.requestModal.optionNewProduct" }),
                },
              ]}
            />
        </Form.Item>

        {isNewProductRequest && (
          <>
            <Form.Item
              name="requestedCategory"
              label={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.categoryLabel" })}
              rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgilerim.requestModal.categoryRequired" }) }]}
            >
              <Input placeholder={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.categoryPlaceholder" })} />
            </Form.Item>
            <Form.Item
              name="requestedBrand"
              label={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.brandLabel" })}
              rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgilerim.requestModal.brandRequired" }) }]}
            >
              <Input placeholder={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.brandPlaceholder" })} />
            </Form.Item>
            <Form.Item
              name="requestedModel"
              label={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.modelLabel" })}
              rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgilerim.requestModal.modelRequired" }) }]}
            >
              <Input placeholder={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.modelPlaceholder" })} />
            </Form.Item>
          </>
        )}

        <Form.Item 
            name="description" 
            label="Açıklama / Gerekçe"
            // ✅ Kısıtlama kaldırıldı, sadece boş olmaması yeterli
            rules={[{ required: true, message: "Lütfen açıklama girin" }]}
        >
            <Input.TextArea 
                rows={4} 
                placeholder={intl.formatMessage({ id: "zimmetBilgilerim.requestModal.descriptionPlaceholder" })} 
                maxLength={150} 
                showCount 
            />
        </Form.Item>

        <div style={{ textAlign: "right" }}>
            <Button onClick={close} style={{ marginRight: 8 }}>{intl.formatMessage({ id: "zimmetBilgilerim.requestModal.cancel" })}</Button>
            <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
                {intl.formatMessage({ id: "zimmetBilgilerim.requestModal.submit" })}
            </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default RequestAssetModal;