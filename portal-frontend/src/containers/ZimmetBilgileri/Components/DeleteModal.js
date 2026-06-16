import React, { useMemo } from "react";
import { useIntl } from "react-intl";
import { Modal } from "antd";
import axios from "axios";
import { host } from "../../../Api/host";

const DeleteModal = (props) => {
  const intl = useIntl();
  const { open, close, deleteId, messageSuccess, onDeleted } = props;

  // Token'ı al
  const auth = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const token = auth?.accessToken;

  // Axios auth instance
  const axiosAuth = useMemo(
    () =>
      axios.create({
        baseURL: host,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );

  // 🗑️ Silme işlemi
  const handleDelete = async () => {
    if (!deleteId) {
      messageSuccess(intl.formatMessage({ id: "zimmetBilgileri.deleteNoRecord" }), "error");
      return;
    }

    try {
      // Swagger'a göre id query parametre olarak gönderiliyor
      await axiosAuth.delete(`/api/debit/${deleteId}`);


      messageSuccess(intl.formatMessage({ id: "zimmetBilgileri.deleteSuccess" }), "success");

      if (onDeleted) onDeleted(deleteId);
      close(false);
    } catch (err) {
      console.error("❌ Silme hatası:", err);
      messageSuccess(intl.formatMessage({ id: "zimmetBilgileri.deleteError" }), "error");
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: "zimmetBilgileri.deleteModalTitle" })}
      open={open}
      onOk={handleDelete}
      onCancel={() => close(false)}
      centered
      okButtonProps={{ danger: true }}
      okText={intl.formatMessage({ id: "zimmetBilgileri.deleteOk" })}
      cancelText={intl.formatMessage({ id: "zimmetBilgileri.deleteCancel" })}
    >
      <p>{intl.formatMessage({ id: "zimmetBilgileri.deleteConfirm" })}</p>
    </Modal>
  );
};

export default DeleteModal;
