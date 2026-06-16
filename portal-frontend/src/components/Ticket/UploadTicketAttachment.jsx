import React, { useState } from "react";
import { CloudUploadOutlined } from "@ant-design/icons";
import { Button, message, Upload } from "antd";
import { AddTicketAttachment } from "../../Api/TicketAttachmentApi";

const UploadTicketAttachment = ({ ticketId, refreshAttachment }) => {
  const [uploadApiProgress, setUploadApiProgress] = useState(false);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("TicketAttachments", file);
    formData.append("TicketId", ticketId);

    setUploadApiProgress(true);
    try {
      message.loading("Dosya yükleniyor...", 0);

      await AddTicketAttachment(formData);
      refreshAttachment();
      message.destroy();
      message.success("Dosya yüklendi");
    } catch (error) {
      message.destroy();
      message.error("En fazla 10MB dosya yüklenebilir");
    }
    setUploadApiProgress(false);

    return false; // Upload bileşenine dosyayı otomatik olarak yüklememesi gerektiğini bildir.
  };

  return (
    <Upload beforeUpload={handleUpload} showUploadList={false}>
      <Button
        loading={uploadApiProgress}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        icon={<CloudUploadOutlined />}
        type="dashed"
      >
        Dosya yükle
      </Button>
    </Upload>
  );
};
export default UploadTicketAttachment;
