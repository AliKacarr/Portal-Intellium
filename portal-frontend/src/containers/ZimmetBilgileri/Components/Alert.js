import React from "react";
import { useIntl } from "react-intl";
import {Alert} from "antd";
const AlertDesigned = () => {
  const intl = useIntl();
  return (
    <Alert
      message={intl.formatMessage({ id: "zimmetBilgileri.demoAlert.message" })}
      description={intl.formatMessage({ id: "zimmetBilgileri.demoAlert.description" })}
      type="info"
      showIcon
    />
  );
};

export default AlertDesigned;
