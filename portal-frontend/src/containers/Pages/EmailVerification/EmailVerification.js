import React, { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useIntl } from "react-intl";
import message from "@iso/components/Feedback/Message";
import { ConfirmEmail } from "../../../Api/AuthApi";

export default function EmailVerification() {
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const verify = async () => {
      const value = new URLSearchParams(location.search).get("value");
      if (!value) {
        messageApi.open({
          type: "error",
          content: intl.formatMessage({ id: "pages.emailVerification.invalidLink" }),
        });
        return;
      }

      try {
        await ConfirmEmail(value);
        messageApi.open({
          type: "success",
          content: intl.formatMessage({ id: "pages.emailVerification.success" }),
        });
      } catch (error) {
        const errorMessage =
          error?.response?.data || intl.formatMessage({ id: "pages.emailVerification.error" });
        messageApi.open({ type: "error", content: errorMessage });
      } finally {
        setTimeout(() => history.push("/signin"), 1200);
      }
    };

    verify();
  }, [history, location.search, messageApi, intl]);

  return <div style={{ padding: 24 }}>{contextHolder}</div>;
}
