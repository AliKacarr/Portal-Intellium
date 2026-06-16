import React, { useEffect, useState, useMemo } from "react";
import { useIntl } from "react-intl";
import { Modal, Form, Select, Input, Button, message } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import { host } from "../../../Api/host";

const NEW_PRODUCT_VALUE = "__NEW_PRODUCT__";

const EditRequestModal = ({ open, close, request, refreshData }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isNewProductRequest, setIsNewProductRequest] = useState(false);

  const { accessToken } = useSelector((state) => state.Auth);
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
      } catch (e) {
        console.error("Ürünler çekilemedi:", e);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [open, axiosAuth]);

  const visibleProducts = useMemo(() => {
    const all = Array.isArray(products) ? products : [];
    return all.filter((p) => String(p?.status ?? p?.Status ?? "").toLowerCase() !== "zimmetli");
  }, [products]);

  // Modal açılınca verileri doldur
  useEffect(() => {
    if (open && request) {
        const isNew = !request?.productId && (request?.requestedCategory || request?.requestedBrand || request?.requestedModel);
        setIsNewProductRequest(Boolean(isNew));
        form.setFieldsValue({
            productId: isNew ? NEW_PRODUCT_VALUE : request.productId,
            requestedCategory: request.requestedCategory,
            requestedBrand: request.requestedBrand,
            requestedModel: request.requestedModel,
            description: request.description
        });
    }
  }, [open, request, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const wantsNew = values.productId === NEW_PRODUCT_VALUE;
      const payload = {
        Id: request.id,
        ProductId: wantsNew ? null : values.productId,
        RequestedCategory: wantsNew ? values.requestedCategory : null,
        RequestedBrand: wantsNew ? values.requestedBrand : null,
        RequestedModel: wantsNew ? values.requestedModel : null,
        Description: values.description,
      };

      const res = await axiosAuth.post("/api/DebitRequest/update-my-request", payload);
      
      if (res.data.success) {
        message.success(intl.formatMessage({ id: "zimmetBilgilerim.editModal.success" }));
        refreshData(); 
        close();
      } else {
        message.error(res.data.message || intl.formatMessage({ id: "zimmetBilgilerim.editModal.updateFailed" }));
      }
    } catch (err) {
      console.error(err);
      message.error(intl.formatMessage({ id: "zimmetBilgilerim.editModal.genericError" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: "zimmetBilgilerim.editModal.title" })}
      open={open}
      onCancel={close}
      footer={null}
      centered
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item 
            name="productId" 
            label={intl.formatMessage({ id: "zimmetBilgilerim.editModal.productLabel" })} 
            rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgilerim.editModal.productRequired" }) }]}
        >
            <Select
              showSearch
              loading={productsLoading}
              placeholder={intl.formatMessage({ id: "zimmetBilgilerim.editModal.productPlaceholder" })}
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(String(input).toLowerCase())
              }
              onChange={(value) => setIsNewProductRequest(value === NEW_PRODUCT_VALUE)}
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
                  label: intl.formatMessage({ id: "zimmetBilgilerim.editModal.optionNewProduct" }),
                },
              ]}
            />
        </Form.Item>

        {isNewProductRequest && (
          <>
            <Form.Item
              name="requestedCategory"
              label={intl.formatMessage({ id: "zimmetBilgilerim.editModal.categoryLabel" })}
              rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgilerim.editModal.categoryRequired" }) }]}
            >
              <Input placeholder={intl.formatMessage({ id: "zimmetBilgilerim.editModal.categoryPlaceholder" })} />
            </Form.Item>
            <Form.Item
              name="requestedBrand"
              label={intl.formatMessage({ id: "zimmetBilgilerim.editModal.brandLabel" })}
              rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgilerim.editModal.brandRequired" }) }]}
            >
              <Input placeholder={intl.formatMessage({ id: "zimmetBilgilerim.editModal.brandPlaceholder" })} />
            </Form.Item>
            <Form.Item
              name="requestedModel"
              label={intl.formatMessage({ id: "zimmetBilgilerim.editModal.modelLabel" })}
              rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgilerim.editModal.modelRequired" }) }]}
            >
              <Input placeholder={intl.formatMessage({ id: "zimmetBilgilerim.editModal.modelPlaceholder" })} />
            </Form.Item>
          </>
        )}

        <Form.Item 
            name="description" 
            label={intl.formatMessage({ id: "zimmetBilgilerim.editModal.descriptionLabel" })}
            // ✅ Kısıtlama kaldırıldı
            rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgilerim.editModal.descriptionRequired" }) }]}
        >
            <Input.TextArea 
                rows={4} 
                maxLength={150} 
                showCount 
            />
        </Form.Item>

        <div style={{ textAlign: "right" }}>
            <Button onClick={close} style={{ marginRight: 8 }}>{intl.formatMessage({ id: "zimmetBilgilerim.editModal.cancel" })}</Button>
            <Button type="primary" htmlType="submit" loading={loading}>{intl.formatMessage({ id: "zimmetBilgilerim.editModal.submit" })}</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditRequestModal;