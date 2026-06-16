import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Button, message, Row, Col, Space, InputNumber } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import { getProductApiErrorMessage } from "./productIntl";

const { Option } = Select;

const CATEGORY_VALUES = ["Laptop", "Monitor", "Telefon", "Araba", "Aksesuar", "Diger"];

const EditProductModal = ({ open, close, product, refreshData, axiosAuth }) => {
  const intl = useIntl();
  const [form] = Form.useForm();

  const requiredRule = (fieldMsgId) => [
    {
      required: true,
      message: intl.formatMessage(
        { id: "products.validation.enterField" },
        { field: intl.formatMessage({ id: fieldMsgId }) }
      ),
    },
  ];

  useEffect(() => {
    if (open && product) {
      let specsArray = [];
      if (product.technicalSpecs) {
        try {
          const specsObj = JSON.parse(product.technicalSpecs);
          specsArray = Object.entries(specsObj).map(([key, value]) => ({ key, value }));
        } catch (e) {
          console.error("JSON Parse Hatası:", e);
        }
      }

      form.setFieldsValue({
        ...product,
        status: product.status || product.Status,
        specs: specsArray,
      });
    }
  }, [open, product, form]);

  const onFinish = async (values) => {
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
        Id: product.id,
        ...values,
        TechnicalSpecs: JSON.stringify(specsObj),
      };

      const res = await axiosAuth.put("/api/product/update", payload);
      if (res.data.success) {
        message.success(intl.formatMessage({ id: "products.updateSuccess" }));
        close();
        window.setTimeout(() => {
          refreshData?.();
        }, 0);
      } else {
        message.error(res.data.message || res.data.Message || intl.formatMessage({ id: "products.updateFailed" }));
      }
    } catch (error) {
      console.error(error);
      message.error(getProductApiErrorMessage(error, intl));
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: "products.editTitle" })}
      open={open}
      onCancel={close}
      footer={null}
      destroyOnClose
      width={700}
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <div style={{ backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
          <h4 style={{ marginTop: 0, color: "#1890ff" }}>{intl.formatMessage({ id: "products.sectionGeneral" })}</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label={intl.formatMessage({ id: "products.fieldCategory" })}
                rules={[{ required: true, message: intl.formatMessage({ id: "products.categoryRequired" }) }]}
              >
                <Select>
                  {CATEGORY_VALUES.map((v) => (
                    <Option key={v} value={v}>
                      {intl.formatMessage({ id: `products.cat_${v}` })}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label={intl.formatMessage({ id: "products.fieldBrand" })} rules={requiredRule("products.fieldBrand")}>
                <Input placeholder={intl.formatMessage({ id: "products.brandEditPlaceholder" })} />
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label={intl.formatMessage({ id: "products.statusLabel" })}
                rules={[{ required: true, message: intl.formatMessage({ id: "products.statusRequired" }) }]}
              >
                <Select>
                  <Option value="Depoda">{intl.formatMessage({ id: "products.statusInStockOption" })}</Option>
                  <Option value="Zimmetli" disabled>
                    {intl.formatMessage({ id: "products.statusAssignedOption" })}
                  </Option>
                  <Option value="Tamirde">{intl.formatMessage({ id: "products.statusRepairOption" })}</Option>
                  <Option value="Hurda">{intl.formatMessage({ id: "products.statusScrapOption" })}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="barcodeNumber" label={intl.formatMessage({ id: "products.fieldBarcode" })}>
                <Input placeholder={intl.formatMessage({ id: "products.optional" })} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div style={{ border: "1px dashed #d9d9d9", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
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
                      <Input placeholder={intl.formatMessage({ id: "products.valueExamplePlaceholder" })} style={{ width: 350 }} />
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
            {intl.formatMessage({ id: "products.cancelShort" })}
          </Button>
          <Button type="primary" htmlType="submit">
            {intl.formatMessage({ id: "products.update" })}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditProductModal;
