import React from "react";
import { Breadcrumb } from "antd";
import { useIntl } from "react-intl";

import { Link } from "react-router-dom";
const BreadLinks = () => {
  const intl = useIntl();
  return (
    <Breadcrumb>
      <Breadcrumb.Item>
        <Link to="my-profile">{intl.formatMessage({ id: "jobInformations.breadcrumb.profile" })}</Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <Link to="job-informations">{intl.formatMessage({ id: "jobInformations.breadcrumb.title" })}</Link>
      </Breadcrumb.Item>
    </Breadcrumb>
  );
};

export default BreadLinks;
