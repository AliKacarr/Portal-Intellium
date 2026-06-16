import React, { useState } from "react";
import { CloudUploadOutlined } from "@ant-design/icons";
import { Button, message, Spin, Tooltip, Upload } from "antd";

const AddTicketAttachment = () => {
    const [uploadApiProgress, setUploadApiProgress] = useState(false);
    const onUploadChange = async ({ fileList }) => {
        let loadingMessageRef = null;

        if (fileList.length > 0) {
            const formData = new FormData();
            fileList.forEach(file => {
                formData.append("taskAttachments", file.originFileObj);
                formData.append("taskId", taskId);
            });
            setUploadApiProgress(true);
            try {
                loadingMessageRef = message.loading("Dosya yükleniyor...", 0);

                await addTicketAttachment(formData);
                reloadAttachment();
                message.destroy();
                message.success("Dosya yüklendi");
            } catch (error) {
                message.destroy();
                message.warn("En fazla 10MB dosya yüklenebilir");
            }
            setUploadApiProgress(false);
        }
    };

    return (
        uploadApiProgress ? <Spin indicator /> :
            <Upload onChange={onUploadChange} showUploadList={false}>
                <Tooltip
                    title="Dosya yükle"
                    placement="bottom"
                >
                    <Button icon={<CloudUploadOutlined style={{ color: '#53607C' }} />} type='dashed' />
                </Tooltip>
            </Upload>

    );
};
export default AddTicketAttachment;
