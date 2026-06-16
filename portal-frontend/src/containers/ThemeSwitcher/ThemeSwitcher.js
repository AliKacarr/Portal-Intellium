import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Actions from "@iso/redux/themeSwitcher/actions";
import Switcher from "@iso/components/ThemeSwitcher/ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import Themes from "./config";
import IntlMessages from "@iso/components/utility/intlMessages";
import ThemeSwitcherStyle from "./ThemeSwitcher.styles";
import { CloseCircleFilled } from "@ant-design/icons";

const { changeTheme, switchActivation } = Actions;

export default function ThemeSwitcher() {
  const { isActivated, topbarTheme, sidebarTheme, layoutTheme } = useSelector(
    (state) => state.ThemeSwitcher
  );
  const dispatch = useDispatch();
  const styleButton = { background: sidebarTheme.buttonColor };

  return (
    <ThemeSwitcherStyle
      className={isActivated ? "isoThemeSwitcher active" : "isoThemeSwitcher"}
    >
      <div className="componentTitleWrapper" style={styleButton}>
        <span
          className="closeButton"
          onClick={() => {
            dispatch(switchActivation());
          }}
        >
          <CloseCircleFilled />
        </span>
        <h3 className="componentTitle">
          <IntlMessages id="themeSwitcher.settings" />
        </h3>
      </div>

      <div className="SwitcherBlockWrapper">
        <Switcher
          config={Themes.sidebarTheme}
          changeTheme={(attr, theme) => dispatch(changeTheme(attr, theme))}
          selectedId={sidebarTheme.themeName}
        />

        <Switcher
          config={Themes.topbarTheme}
          changeTheme={(attr, theme) => dispatch(changeTheme(attr, theme))}
          selectedId={topbarTheme.themeName}
        />

        <Switcher
          config={Themes.layoutTheme}
          changeTheme={(attr, theme) => dispatch(changeTheme(attr, theme))}
          selectedId={layoutTheme.themeName}
        />
        <LanguageSwitcher />
      </div>
    </ThemeSwitcherStyle>
  );
}
