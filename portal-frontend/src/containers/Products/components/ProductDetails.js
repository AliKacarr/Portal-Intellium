import React from "react";
import { Drawer, Descriptions, Badge, Tag, Space } from "antd";
import { useIntl } from "react-intl";
import { PRODUCT_STATUS_KEYS } from "./productIntl";

const ProductDetails = ({ open, close, product }) => {
  const intl = useIntl();

  const statusBadgeText = (status) => {
    const id = PRODUCT_STATUS_KEYS[status];
    return id ? intl.formatMessage({ id }) : status;
  };

  const renderSpecs = () => {
    const specsData = product?.technicalSpecs || product?.TechnicalSpecs;

    if (!specsData) return <Descriptions.Item>{intl.formatMessage({ id: "products.notSpecified" })}</Descriptions.Item>;

    try {
      const specs = JSON.parse(specsData);
      return Object.entries(specs).map(([key, val]) => (
        <Descriptions.Item key={key} label={key}>
          {val}
        </Descriptions.Item>
      ));
    } catch {
      return (
        <Descriptions.Item label={intl.formatMessage({ id: "products.specsRawLabel" })}>{specsData}</Descriptions.Item>
      );
    }
  };

  if (!product) return null;

  const currentStatus = product.status || product.Status;

  return (
    <Drawer
      title={intl.formatMessage({ id: "products.detailsTitle" })}
      placement="right"
      onClose={close}
      open={open}
      width={600}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={25}>
        <Descriptions title={intl.formatMessage({ id: "products.sectionStatus" })} bordered column={1} size="small">
          <Descriptions.Item label={intl.formatMessage({ id: "products.labelStatus" })}>
            <Badge
              status={currentStatus === "Depoda" ? "success" : currentStatus === "Zimmetli" ? "warning" : "error"}
              text={statusBadgeText(currentStatus)}
            />
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "products.labelSerialNumber" })}>
            <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>{product.serialNumber || product.SerialNumber}</span>
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "products.fieldBarcode" })}>
            {product.barcodeNumber || product.BarcodeNumber || "-"}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions title={intl.formatMessage({ id: "products.sectionProductInfo" })} bordered column={1} size="small">
          <Descriptions.Item label={intl.formatMessage({ id: "products.fieldCategory" })}>
            <Tag color="blue">{product.category || product.Category}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "products.fieldBrand" })}>{product.brand || product.Brand}</Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "products.fieldModel" })}>{product.model || product.Model}</Descriptions.Item>
        </Descriptions>

        <Descriptions title={intl.formatMessage({ id: "products.sectionSpecs" })} bordered column={1} size="small">
          {renderSpecs()}
        </Descriptions>

        <Descriptions title={intl.formatMessage({ id: "products.sectionNotes" })} bordered column={1} size="small">
          <Descriptions.Item label={intl.formatMessage({ id: "products.noteLabel" })}>
            {product.description || product.Description || intl.formatMessage({ id: "products.noDescription" })}
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Drawer>
  );
};

export default ProductDetails;
