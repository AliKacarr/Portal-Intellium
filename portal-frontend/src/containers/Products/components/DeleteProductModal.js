import React from "react";
import { Modal, message } from "antd";
import { useIntl } from "react-intl";

const DeleteProductModal = ({ open, close, deleteId, refreshData, axiosAuth }) => {
  const intl = useIntl();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await axiosAuth.delete(`/api/product/${deleteId}`);

      message.success(intl.formatMessage({ id: "products.deleteSuccess" }));
      close();
      window.setTimeout(() => {
        refreshData?.();
      }, 0);
    } catch (err) {
      console.error("Silme hatası:", err);
      message.error(intl.formatMessage({ id: "products.deleteError" }));
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: "products.deleteTitle" })}
      open={open}
      onOk={() => handleDelete()}
      onCancel={close}
      okText={intl.formatMessage({ id: "products.deleteOk" })}
      cancelText={intl.formatMessage({ id: "products.deleteCancel" })}
      okButtonProps={{ danger: true }}
      centered
      destroyOnClose
    >
      <p>{intl.formatMessage({ id: "products.deleteConfirm" })}</p>
      <p style={{ fontSize: "12px", color: "red" }}>{intl.formatMessage({ id: "products.deleteNote" })}</p>
    </Modal>
  );
};

export default DeleteProductModal;
