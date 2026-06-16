import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Alert, Button, Form, Input, Space, Typography, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { HardDeleteUser } from "../../Api/UserApi";

const EditUserDeleteTab = ({ user }) => {
  const intl = useIntl();
  const history = useHistory();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const expectedText = user?.name || "";
  const isConfirmMatched = confirmText.trim() === expectedText;

  const onDeleteUser = async () => {
    if (!user?.id || !isConfirmMatched) return;
    setLoading(true);
    try {
      await HardDeleteUser(user.id);
      message.success(intl.formatMessage({ id: "user.deleteTab.success" }));
      history.push("/dashboard/UserList");
    } catch (error) {
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data ||
        intl.formatMessage({ id: "user.deleteTab.errorDefault" });
      message.error(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", maxWidth: 700 }}>
      <Alert
        type="warning"
        showIcon
        message={intl.formatMessage({ id: "user.deleteTab.alertTitle" })}
        description={intl.formatMessage({ id: "user.deleteTab.alertDescription" })}
      />

      <Typography.Text>
        {intl.formatMessage({ id: "user.deleteTab.confirmIntro" })}
      </Typography.Text>
      <Typography.Text strong>{expectedText}</Typography.Text>

      <Form layout="vertical" onFinish={onDeleteUser}>
        <Form.Item label={intl.formatMessage({ id: "user.deleteTab.confirmLabel" })}>
          <Input
            placeholder={intl.formatMessage({ id: "user.deleteTab.confirmPlaceholder" })}
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
          />
        </Form.Item>
        <Button
          danger
          type="primary"
          htmlType="submit"
          disabled={!isConfirmMatched}
          loading={loading}
          icon={<DeleteOutlined />}
        >
          {intl.formatMessage({ id: "user.deleteTab.submit" })}
        </Button>
      </Form>
    </Space>
  );
};

export default EditUserDeleteTab;
