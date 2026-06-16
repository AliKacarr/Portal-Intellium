import React, { useState } from "react";
import Input from "@iso/components/uielements/input";
import Button from "@iso/components/uielements/button";
import IntlMessages from "@iso/components/utility/intlMessages";
import ForgotPasswordStyleWrapper from "./ForgotPassword.styles";
import { Image } from "antd";
import message from "@iso/components/Feedback/Message";
import intelliumlogo from "../../../assets/images/intelliumlogo1.png";
import { ForgotPasswordRequest } from "../../../Api/AuthApi";
import { useIntl } from "react-intl";

export default function () {
  const intl = useIntl();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "pages.forgotPassword.invalidEmail" }),
      });
      return;
    }

    try {
      setLoading(true);
      await ForgotPasswordRequest(email);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "pages.forgotPassword.successSent" }),
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data || intl.formatMessage({ id: "pages.forgotPassword.errorSend" });
      messageApi.open({
        type: "error",
        content: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotPasswordStyleWrapper className="isoForgotPassPage">
      {contextHolder}
      <div className="isoFormContentWrapper">
        <div className="isoFormContent">
          <div className="isoLogoWrapper">
            <Image preview={false} width={100} src={intelliumlogo} />
          </div>

          <div className="isoFormHeadText">
            <h3>
              <IntlMessages id="page.forgetPassSubTitle" />
            </h3>
            <p>
              <IntlMessages id="page.forgetPassDescription" />
            </p>
          </div>

          <div className="isoForgotPassForm">
            <div className="isoInputWrapper">
              <Input
                size="large"
                placeholder={intl.formatMessage({ id: "pages.forgotPassword.emailPlaceholder" })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onPressEnter={handleSend}
              />
            </div>

            <div className="isoInputWrapper">
              <Button type="primary" onClick={handleSend} loading={loading}>
                <IntlMessages id="page.sendRequest" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ForgotPasswordStyleWrapper>
  );
}
