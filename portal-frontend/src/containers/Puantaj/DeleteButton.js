import React from "react";
import Popconfirm from "@iso/components/Feedback/Popconfirm";
import { Button } from "antd";
import { notification } from "@iso/components";
import { CloseOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";

export default function DeleteButton({ handleDelete }) {
  const intl = useIntl();
  return (
    <Popconfirm
      title={intl.formatMessage({ id: "puantaj.delete.confirm" })}
      okText={intl.formatMessage({ id: "puantaj.delete.ok" })}
      cancelText={intl.formatMessage({ id: "puantaj.delete.cancel" })}
      onConfirm={() => {
        notification(
          "error",
          intl.formatMessage({ id: "puantaj.delete.notification" }),
          ""
        );
        handleDelete();
      }}
    >
      <Button
        icon={<CloseOutlined />}
        type="default"
        className="isoDeleteBtn"
      />
    </Popconfirm>
  );
}
