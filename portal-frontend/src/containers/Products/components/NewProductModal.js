import React, { useState, useEffect, useCallback } from "react";
import { Modal, Form, Input, Select, Button, message, Row, Col, Space, InputNumber } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import { getProductApiErrorMessage } from "./productIntl";

const { Option } = Select;

const categoryTemplates = {
  Laptop: [
    { key: "İşlemci", value: "" },
    { key: "RAM", value: "" },
    { key: "Disk", value: "" },
    { key: "Ekran Kartı", value: "" },
  ],
  Monitor: [
    { key: "Ekran Boyutu", value: "" },
    { key: "Çözünürlük", value: "" },
    { key: "Panel Tipi", value: "" },
  ],
  Telefon: [
    { key: "Hafıza", value: "" },
    { key: "Renk", value: "" },
    { key: "IMEI", value: "" },
  ],
  Araba: [
    { key: "Plaka", value: "" },
    { key: "KM", value: "" },
    { key: "Yakıt Tipi", value: "" },
    { key: "Vites", value: "" },
  ],
  Aksesuar: [{ key: "Tür", value: "" }],
  Diger: [],
};

const NewProductModal = ({ open, close, refreshData, axiosAuth, prefill }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const requiredRule = (fieldMsgId) => [
    {
      required: true,
      message: intl.formatMessage(
        { id: "products.validation.enterField" },
        { field: intl.formatMessage({ id: fieldMsgId }) }
      ),
    },
  ];

  const handleCategoryChange = useCallback(
    (value) => {
      const template = categoryTemplates[value] || [];
      form.setFieldsValue({
        specs: template.map((t) => ({ key: t.key, value: "" })),
      });
    },
    [form]
  );

  useEffect(() => {
    if (!open || !prefill) return;
    form.setFieldsValue({
      category: prefill?.category || undefined,
      brand: prefill?.brand || undefined,
      model: prefill?.model || undefined,
    });
    if (prefill?.category) handleCategoryChange(prefill.category);
  }, [open, prefill, form, handleCategoryChange]);

  const onFinish = async (values) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const specsObj = {};
      if (values.specs && values.specs.length > 0) {
        values.specs.forEach((item) => {
          if (item && item.key && item.value) {
            specsObj[item.key] = item.value;
          }
        });
      }

      const payload = {
        Category: values.category,
        Brand: values.brand?.trim(),
        Model: values.model?.trim(),
        SerialNumber: values.serialNumber?.trim(),
        Quantity: Number(values.quantity) || 1,
        BarcodeNumber: values.barcodeNumber?.trim() || undefined,
        Description: values.description?.trim() || undefined,
        Status: "Depoda",
        TechnicalSpecs: JSON.stringify(specsObj),
      };

      const res = await axiosAuth.post("/api/product/add", payload);
      if (res.data.success) {
        const created = res?.data?.data || res?.data?.Data || null;
        const createdProductId = created?.id ?? created?.Id ?? null;

        const debitRequestId = prefill?.debitRequestId;
        if (debitRequestId && createdProductId) {
          try {
            await axiosAuth.post("/api/DebitRequest/admin-attach-product", {
              requestId: debitRequestId,
              productId: createdProductId,
            });
          } catch (e) {
            console.error("DebitRequest attach başarısız:", e);
            message.warning(intl.formatMessage({ id: "products.attachRequestWarning" }));
          }
        }
        message.success(intl.formatMessage({ id: "products.addSuccess" }));
        close();
        window.setTimeout(() => {
          refreshData?.();
        }, 0);
      } else {
        message.error(res.data.message || res.data.Message || intl.formatMessage({ id: "products.addFailed" }));
      }
    } catch (error) {
      console.error(error);
      message.error(getProductApiErrorMessage(error, intl));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: "products.newProductTitle" })}
      open={open}
      onCancel={close}
      footer={null}
      destroyOnClose
      width={700}
    >
      <Form layout="vertical" form={form} onFinish={onFinish} initialValues={{ specs: [], quantity: 1 }}>
        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h4 style={{ marginTop: 0, color: "#1890ff" }}>{intl.formatMessage({ id: "products.sectionGeneral" })}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label={intl.formatMessage({ id: "products.fieldCategory" })}
                rules={[{ required: true, message: intl.formatMessage({ id: "products.categoryRequired" }) }]}
              >
                <Select placeholder={intl.formatMessage({ id: "products.selectPlaceholder" })} onChange={handleCategoryChange}>
                  {Object.keys(categoryTemplates).map((cat) => (
                    <Option key={cat} value={cat}>
                      {intl.formatMessage({ id: `products.cat_${cat}` })}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label={intl.formatMessage({ id: "products.fieldBrand" })} rules={requiredRule("products.fieldBrand")}>
                <Input placeholder={intl.formatMessage({ id: "products.brandPlaceholder" })} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="model" label={intl.formatMessage({ id: "products.fieldModel" })} rules={requiredRule("products.fieldModel")}>
                <Input placeholder={intl.formatMessage({ id: "products.modelPlaceholder" })} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="serialNumber"
                label={intl.formatMessage({ id: "products.fieldSerial" })}
                rules={requiredRule("products.fieldSerialRule")}
              >
                <Input placeholder={intl.formatMessage({ id: "products.serialPlaceholder" })} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label={intl.formatMessage({ id: "products.fieldQuantity" })}
                rules={[{ required: true, message: intl.formatMessage({ id: "products.quantityRequired" }) }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="barcodeNumber" label={intl.formatMessage({ id: "products.fieldBarcode" })}>
            <Input placeholder={intl.formatMessage({ id: "products.optional" })} />
          </Form.Item>
        </div>

        <div
          style={{
            border: "1px dashed #d9d9d9",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h4 style={{ marginTop: 0, color: "#fa8c16" }}>{intl.formatMessage({ id: "products.sectionTechnical" })}</h4>
          <p style={{ fontSize: "12px", color: "#999" }}>{intl.formatMessage({ id: "products.specsHint" })}</p>

          <Form.List name="specs">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, "key"]} rules={requiredRule("products.fieldSpecName")}>
                      <Input placeholder={intl.formatMessage({ id: "products.specKeyPlaceholder" })} style={{ width: 200, backgroundColor: "#fafafa" }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "value"]} rules={requiredRule("products.fieldValue")}>
                      <Input placeholder={intl.formatMessage({ id: "products.valuePlaceholder" })} style={{ width: 350 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red" }} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    {intl.formatMessage({ id: "products.addSpecRow" })}
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </div>

        <Form.Item name="description" label={intl.formatMessage({ id: "products.fieldDescription" })}>
          <Input.TextArea rows={2} placeholder={intl.formatMessage({ id: "products.optional" })} />
        </Form.Item>

        <div style={{ textAlign: "right" }}>
          <Button onClick={close} style={{ marginRight: 8 }}>
            {intl.formatMessage({ id: "products.cancel" })}
          </Button>
          <Button type="primary" htmlType="submit">
            {intl.formatMessage({ id: "products.save" })}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default NewProductModal;
