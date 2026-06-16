import React from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";

const BreadcrumbLinks = (props) => {
  return (
    <Breadcrumb>
      <Breadcrumb.Item>
        <Link to="/dashboard"></Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <Link to={props.to}>{props.label}</Link>
      </Breadcrumb.Item>
    </Breadcrumb>
  );
};
export default BreadcrumbLinks;
