import React from "react";
import { Modal, Form, Button } from "antd";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import "./CustomModal.css";

const CustomModal = ({
  visible,
  title,
  onCancel,
  onSubmit,
  form,
  children,
  isResponsive = true,
  width: widthProp,
  bodyStyle,
}) => {
  const intl = useIntl();
  const resolvedWidth =
    widthProp != null
      ? widthProp
      : isResponsive && typeof window !== "undefined" && window.innerWidth < 768
        ? "90%"
        : "500px";

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      width={resolvedWidth}
      bodyStyle={bodyStyle}
      footer={[
        <Button key="cancel" icon={<CloseOutlined />} onClick={onCancel}>
          {intl.formatMessage({ id: "parametre.common.cancel" })}
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
        >
          {intl.formatMessage({ id: "parametre.common.save" })}
        </Button>,
      ]}
      className="modal-content"
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        {children}
      </Form>
    </Modal>
  );
};

export default CustomModal;
