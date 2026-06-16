import React, { useMemo } from "react";
import { Link, useRouteMatch } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Layout } from "antd";
import options from "./options";
import Scrollbars from "@iso/components/utility/customScrollBar";
import Menu from "@iso/components/uielements/menu";
import { useIntl } from "react-intl";
import appActions from "@iso/redux/app/actions";
import Logo from "@iso/components/utility/logo";
import SidebarWrapper from "./Sidebar.styles";
import SecureLS from "secure-ls";
import { resolveUiRole } from "@iso/lib/helpers/jwtRoles";

const { Sider } = Layout;

const stripTrailingSlash = (str) => (str?.endsWith("/") ? str.slice(0, -1) : str) || "";

const { toggleOpenDrawer, changeOpenKeys, changeCurrent, toggleCollapsed } =
  appActions;

const ls = new SecureLS({ encodingType: "aes" });

export default function Sidebar() {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { view, openKeys, collapsed, openDrawer, current, height } = useSelector((state) => state.App);
  const customizedTheme = useSelector((state) => state.ThemeSwitcher.sidebarTheme);
  const reduxRole = useSelector((state) => {
    const r = state?.Auth?.role;
    if (!r) return "user";
    if (typeof r === "string") return r;
    return r?.roleName ?? r?.RoleName ?? r?.name ?? r?.Name ?? "user";
  });
  const accessToken = useSelector((state) => state?.Auth?.accessToken) || ls.get("accessToken");
  const role = useMemo(
    () => resolveUiRole({ reduxRole, accessToken }),
    [reduxRole, accessToken]
  );

  // Rol bazlı filtreleme işlevi
  const filterOptionsByRole = (options, role) => {
    return options
      .filter(
        (option) => !option.allowedRoles || option.allowedRoles.includes(role)
      )
      .map((option) => ({
        ...option,
        items: option.items
          ? filterOptionsByRole(option.items, role)
          : undefined,
      }));
  };
  const filteredOptions = filterOptionsByRole(options, role);

  function handleClick(e) {
    dispatch(changeCurrent([e.key]));
    if (view === "MobileView") {
      setTimeout(() => {
        dispatch(toggleCollapsed());
      }, 100);
    }
  }
  function onOpenChange(newOpenKeys) {
    const latestOpenKey = newOpenKeys.find(
      (key) => !(openKeys.indexOf(key) > -1)
    );
    const latestCloseKey = openKeys.find(
      (key) => !(newOpenKeys.indexOf(key) > -1)
    );
    let nextOpenKeys = [];
    if (latestOpenKey) {
      nextOpenKeys = getAncestorKeys(latestOpenKey).concat(latestOpenKey);
    }
    if (latestCloseKey) {
      nextOpenKeys = getAncestorKeys(latestCloseKey);
    }
    dispatch(changeOpenKeys(nextOpenKeys));
  }
  const getAncestorKeys = (key) => {
    const map = {
      sub3: ["sub2"],
    };
    return map[key] || [];
  };

  const isCollapsed = collapsed && !openDrawer;
  const mode = isCollapsed === true ? "vertical" : "inline";
  const onMouseEnter = (event) => {
    if (collapsed && openDrawer === false) {
      dispatch(toggleOpenDrawer());
    }
    return;
  };
  const onMouseLeave = () => {
    if (collapsed && openDrawer === true) {
      dispatch(toggleOpenDrawer());
    }
    return;
  };
  const styling = {
    backgroundColor: customizedTheme.backgroundColor,
  };
  const textColor = customizedTheme.textColor;
  const submenuColor = useMemo(() => ({ color: textColor }), [textColor]);
  const match = useRouteMatch();
  const url = stripTrailingSlash(match?.url);

  const menuItems = useMemo(() => {
    return filteredOptions.map((opt) => {
      if (opt.items) {
        return {
          key: opt.key,
          icon: <i className={opt.leftIcon} />,
          label: (
            <span className="isoMenuHolder" style={submenuColor}>
              <span className="nav-text">
                {intl.formatMessage({ id: opt.label })}
              </span>
            </span>
          ),
          children: opt.items.map((child) => ({
            key: child.key,
            label: (
              <Link
                style={submenuColor}
                to={child.withoutDashboard ? `/${child.key}` : `${url}/${child.key}`}
              >
                {intl.formatMessage({ id: child.label })}
              </Link>
            ),
          })),
        };
      }
      return {
        key: opt.key,
        icon: <i className={opt.leftIcon} />,
        label: (
          <Link to={`${url}/${opt.key}`}>
            <span className="isoMenuHolder" style={submenuColor}>
              <span className="nav-text">
                {intl.formatMessage({ id: opt.label })}
              </span>
            </span>
          </Link>
        ),
      };
    });
  }, [filteredOptions, url, submenuColor, intl]);

  return (
    <SidebarWrapper>
      <Sider
        trigger={null}
        collapsible={true}
        collapsed={isCollapsed}
        width={240}
        className="isomorphicSidebar"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={styling}
      >
        <Logo collapsed={isCollapsed} />
        <Scrollbars style={{ height: height - 70 }}>
          <Menu
            onClick={handleClick}
            theme="dark"
            className="isoDashboardMenu"
            mode={mode}
            openKeys={isCollapsed ? [] : openKeys}
            selectedKeys={current}
            onOpenChange={onOpenChange}
            items={menuItems}
          />
        </Scrollbars>
      </Sider>
    </SidebarWrapper>
  );
}
