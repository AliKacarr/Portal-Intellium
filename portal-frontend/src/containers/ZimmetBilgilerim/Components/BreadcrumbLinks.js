import React from "react";
import { useIntl } from "react-intl";
import { Breadcrumb, Button } from "antd";
import { Link } from "react-router-dom";
import { Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";

const BreadcrumbLinks = (props) => {
  const intl = useIntl();
  return (
    <Breadcrumb>
      <Breadcrumb.Item>
        <Link to="/dashboard">{intl.formatMessage({ id: "zimmetBilgilerim.breadcrumb.dashboard" })}</Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <Dropdown placement="bottom" arrow>
          <Button type="link" size="small" style={{ padding: 0, height: "auto" }}>
            {intl.formatMessage({ id: "zimmetBilgilerim.breadcrumb.profileDropdown" })} <DownOutlined />
          </Button>
        </Dropdown>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <Link to={props.to}>{props.label}</Link>
      </Breadcrumb.Item>
    </Breadcrumb>
  );
};
export default BreadcrumbLinks;
