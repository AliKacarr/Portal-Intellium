import React from "react";
import { Descriptions, Modal } from "antd";
import { useIntl } from "react-intl";
import { formatDocumentDate, pickDocumentDate } from "../documentDateUtils";
import { getDocumentType, isDocumentFolder } from "../documentRowUtils";

const DetailsModal = ({ open, close, data }) => {
  const intl = useIntl();
  const docType = getDocumentType(data);
  const type = docType ? docType.charAt(0).toUpperCase() + docType.slice(1) : "-";
  const name = data?.name ?? data?.Name ?? "-";
  const createdAt = formatDocumentDate(pickDocumentDate(data, "createdAt"), { withTime: true });
  const updatedAt = formatDocumentDate(pickDocumentDate(data, "updatedAt"), { withTime: true });

  const handleCancel = () => {
    close(false);
  };

  return (
    <Modal
      className="documents__details-modal"
      title={data?.name}
      open={open}
      footer={false}
      onCancel={handleCancel}
      centered
      width={window.innerWidth * 0.5}
      bodyStyle={{ borderRadius: "2rem" }}
      style={{ borderRadius: "2rem" }}
    >
      <Descriptions
        layout="horizontal"
        bordered
        column={2}
      >
        <Descriptions.Item
          label={isDocumentFolder(data) ? intl.formatMessage({ id: "documents.labels.folderName" }) : intl.formatMessage({ id: "documents.labels.fileName" })}
          span={2}
          style={{ fontWeight: "bold", color: "black" }}
        >
          {name}
        </Descriptions.Item>
        <Descriptions.Item
          label={intl.formatMessage({ id: "documents.labels.type" })}
          span={2}
          style={{ fontWeight: "bold", color: "black" }}
        >
          {type === "Folder" ? intl.formatMessage({ id: "documents.labels.folder" }) : type}
        </Descriptions.Item>
        <Descriptions.Item
          label={intl.formatMessage({ id: "documents.labels.createdAt" })}
          span={2}
          style={{ fontWeight: "bold", color: "black" }}
        >
          {createdAt}
        </Descriptions.Item>
        <Descriptions.Item
          label={intl.formatMessage({ id: "documents.labels.updatedAt" })}
          span={2}
          style={{ fontWeight: "bold", color: "black" }}
        >
          {updatedAt}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default DetailsModal;
