import React from "react";
import { Link, useRouteMatch } from "react-router-dom";
import Menu from "@iso/components/uielements/menu";
import { useIntl } from "react-intl";

const { SubMenu } = Menu;

const stripTrailingSlash = (str) => {
  return str.endsWith("/") ? str.slice(0, -1) : str;
};

const SidebarMenu = React.memo(function SidebarMenu({
  singleOption,
  submenuStyle,
  submenuColor,
  ...rest
}) {
  const intl = useIntl();
  const match = useRouteMatch();
  const { key, label, leftIcon, items } = singleOption;
  const url = stripTrailingSlash(match.url);

  const menuItems = items
    ? items.map((child) => ({
        label: (
          <Link
            style={submenuColor}
            to={
              child.withoutDashboard ? `/${child.key}` : `${url}/${child.key}`
            }
          >
            {intl.formatMessage({ id: child.label })}
          </Link>
        ),
        key: child.key,
      }))
    : [
        {
          label: (
            <Link to={`${url}/${key}`}>
              <span className="isoMenuHolder" style={submenuColor}>
                <i className={leftIcon} />
                <span className="nav-text">
                  {intl.formatMessage({ id: label })}
                </span>
              </span>
            </Link>
          ),
          key: key,
        },
      ];

  return items ? (
    <SubMenu
      key={key}
      title={
        <span className="isoMenuHolder" style={submenuColor}>
          <i className={leftIcon} />
          <span className="nav-text">
            {intl.formatMessage({ id: label })}
          </span>
        </span>
      }
      {...rest}
    >
      {menuItems.map((item) => (
        <Menu.Item style={submenuStyle} key={item.key}>
          {item.label}
        </Menu.Item>
      ))}
    </SubMenu>
  ) : (
    <Menu.Item key={key} {...rest}>
      {menuItems[0].label}
    </Menu.Item>
  );
});

export default SidebarMenu;
