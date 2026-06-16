import React from "react";
import { Modal } from "antd";
import { useIntl } from "react-intl";
const DeleteModal = (props) => {
  const intl = useIntl();
  return (
    <Modal
      title={intl.formatMessage({ id: "emergencyContact.delete" })}
      open={props.open}
      onOk={props.onOk}
      onCancel={props.onCancel}
      centered
      okButtonProps={{ danger: true }}
      okText={intl.formatMessage({ id: "emergencyContact.delete" })}
      cancelText={intl.formatMessage({ id: "emergencyContact.cancel" }, { defaultMessage: "Vazgec" })}
    >
      <p>{intl.formatMessage({ id: "emergencyContact.deleteConfirm" }, { defaultMessage: "Bu kisiyi silmek istediginizden emin misiniz?" })}</p>
    </Modal>
  );
};

export default DeleteModal;
